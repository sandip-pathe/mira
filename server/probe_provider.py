"""Opt-in live synthetic tool probe. Does not count as physical WebRTC evidence."""
import asyncio
import json
import os
import time
from uuid import uuid4

import httpx
import websockets
from server.app import INSTRUCTIONS, TOOLS  # loads only server/.env


async def probe():
    async with httpx.AsyncClient(base_url='http://127.0.0.1:8000', timeout=45) as api:
        response = await api.post('/sessions', json={'session_id': str(uuid4())})
        response.raise_for_status()
        session = response.json()
        headers = {'Authorization': 'Bearer ' + session['capability']}
        base = '/sessions/' + session['session_id']
        response = await api.post(base + '/voice', headers=headers)
        response.raise_for_status()
        credential = response.json()
        model = os.getenv('OPENAI_REALTIME_MODEL', 'gpt-realtime-2.1')
        async with websockets.connect('wss://api.openai.com/v1/realtime?model=' + model,
                additional_headers={'Authorization': 'Bearer ' + credential['value']}, max_size=2**22) as ws:
            async def send(event):
                await ws.send(json.dumps(event))

            await send({'type': 'session.update', 'session': {
                'type': 'realtime', 'instructions': INSTRUCTIONS, 'tools': TOOLS,
                'audio': {'input': {'turn_detection': None}},
            }})
            async with asyncio.timeout(60):
                while True:
                    event = json.loads(await ws.recv())
                    if event['type'] == 'error':
                        raise RuntimeError('Provider rejected configuration: ' + event['error'].get('code', 'unknown'))
                    if event['type'] == 'session.updated':
                        assert event['session']['audio']['input']['turn_detection'] is None
                        break
                await send({'type': 'conversation.item.create', 'item': {'type': 'message', 'role': 'user',
                    'content': [{'type': 'input_text', 'text': 'Synthetic demo: I agree to see task_reset_60s and pause_60s. Please offer both.'}]}})
                await send({'type': 'response.create', 'response': {'output_modalities': ['text'],
                    'tool_choice': {'type': 'function', 'name': 'select_actions'}}})
                call = None
                while True:
                    event = json.loads(await ws.recv())
                    if event['type'] == 'error':
                        raise RuntimeError('Provider rejected turn: ' + event['error'].get('code', 'unknown'))
                    if event['type'] == 'response.function_call_arguments.done':
                        call = {'call_id': event['call_id'], 'name': event['name'], 'arguments': json.loads(event['arguments'])}
                    if event['type'] == 'response.done':
                        if event['response']['status'] != 'completed':
                            raise RuntimeError('Provider tool response did not complete')
                        break
                assert call and call['name'] == 'select_actions'
                started = time.monotonic()
                response = await api.post(base + '/tool-calls', params={'generation': credential['generation']}, headers=headers, json=call)
                response.raise_for_status()
                response = await api.post(base + '/tools', headers=headers, json=call)
                response.raise_for_status()
                result = response.json()
                assert result['call_id'] == call['call_id']
                assert {action['id'] for action in result['result']['actions']} == {'task_reset_60s', 'pause_60s'}
                relay_ms = round((time.monotonic() - started) * 1000)
                await send({'type': 'conversation.item.create', 'item': {'type': 'function_call_output',
                    'call_id': call['call_id'], 'output': json.dumps(result['result'])}})
                await send({'type': 'response.create', 'response': {'output_modalities': ['text'], 'tool_choice': 'none'}})
                text_received = False
                while True:
                    event = json.loads(await ws.recv())
                    if event['type'] == 'error':
                        raise RuntimeError('Provider rejected tool result: ' + event['error'].get('code', 'unknown'))
                    if event['type'] == 'response.output_text.done':
                        text_received = bool(event.get('text'))
                    if event['type'] == 'response.done':
                        assert event['response']['status'] == 'completed' and text_received
                        break
                print(f'Live Realtime tool event -> FastAPI -> provider continuation passed; local relay {relay_ms} ms.')
                print('WebSocket contract probe only. Physical Android WebRTC/audio gate remains pending.')


if __name__ == '__main__':
    asyncio.run(probe())

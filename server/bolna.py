"""Short-lived Bolna call sessions; account credentials stay on the server."""
import os

import httpx
from fastapi import HTTPException


async def mint_call_session():
    key = os.getenv('BOLNA_API_KEY', '').strip()
    agent = os.getenv('BOLNA_AGENT_ID', '').strip()
    if not key or not agent:
        raise HTTPException(503, detail='Mira calling is not configured')
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                'https://api.bolna.ai/web-call/freeswitch-session',
                headers={'Authorization': f'Bearer {key}'},
                json={'agent_id': agent},
            )
        if response.status_code == 429:
            raise HTTPException(429, detail='Mira calling is busy. Try again shortly.')
        response.raise_for_status()
        session = response.json()
        required = ('run_id', 'agent_id', 'sip_username', 'sip_password', 'sip_domain', 'wss_url')
        if not all(isinstance(session.get(k), str) and session[k] for k in required):
            raise ValueError('Invalid call session')
        if not session['wss_url'].startswith('wss://') or not isinstance(session.get('ice_servers'), list):
            raise ValueError('Invalid call transport')
        return {k: session[k] for k in (*required, 'ice_servers', 'sip_register', 'expires_in')}
    except (httpx.HTTPError, ValueError, KeyError):
        raise HTTPException(503, detail='Mira calling is temporarily unavailable') from None

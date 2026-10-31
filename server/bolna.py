"""Short-lived Bolna call sessions; account credentials stay on the server."""
import os
import json
from typing import Literal

import httpx
from fastapi import HTTPException
from pydantic import BaseModel, ConfigDict, Field


class BoundedCallData(BaseModel):
    model_config = ConfigDict(extra='forbid', strict=True)


class CallMessage(BoundedCallData):
    role: Literal['user', 'assistant']
    content: str = Field(min_length=1, max_length=800)


class CallExcerpt(BoundedCallData):
    source_type: Literal['journal', 'action', 'feedback']
    label: str = Field(max_length=80)
    excerpt: str = Field(min_length=1, max_length=600)


class CallPreference(BoundedCallData):
    intervention_id: str = Field(max_length=64)
    rating: str = Field(max_length=24)
    preference: str = Field(max_length=240)


class BolnaCallContext(BoundedCallData):
    context_version: Literal[1] = 1
    person_name: str = Field(default='', max_length=80)
    consent_revision: int = Field(default=0, ge=0)
    recent_messages: list[CallMessage] = Field(default_factory=list, max_length=6)
    shared_excerpts: list[CallExcerpt] = Field(default_factory=list, max_length=1)
    saved_preferences: list[CallPreference] = Field(default_factory=list, max_length=3)

    def user_data(self):
        return {
            'person_name': self.person_name,
            'mira_context': json.dumps(self.model_dump(include={
                'context_version', 'recent_messages', 'shared_excerpts', 'saved_preferences',
            }), ensure_ascii=False),
        }


async def mint_call_session(context: BolnaCallContext | None = None):
    key = os.getenv('BOLNA_API_KEY', '').strip()
    agent = os.getenv('BOLNA_AGENT_ID', '').strip()
    if not key or not agent:
        raise HTTPException(503, detail='Mira calling is not configured')
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                'https://api.bolna.ai/web-call/freeswitch-session',
                headers={'Authorization': f'Bearer {key}'},
                json={'agent_id': agent, 'user_data': (context or BolnaCallContext()).user_data()},
            )
        if response.status_code == 429:
            raise HTTPException(429, detail='Mira calling is busy. Try again shortly.')
        response.raise_for_status()
        session = response.json()
        if not isinstance(session, dict):
            raise ValueError('Invalid call session')
        required = ('run_id', 'agent_id', 'sip_username', 'sip_password', 'sip_domain', 'wss_url')
        if not all(isinstance(session.get(k), str) and session[k] for k in required):
            raise ValueError('Invalid call session')
        if not session['wss_url'].startswith('wss://') or not isinstance(session.get('ice_servers'), list):
            raise ValueError('Invalid call transport')
        return {k: session[k] for k in (*required, 'ice_servers', 'sip_register', 'expires_in')}
    except (httpx.HTTPError, ValueError, KeyError):
        raise HTTPException(503, detail='Mira calling is temporarily unavailable') from None

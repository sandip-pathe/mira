"""Firebase ID-token verification for authenticated worker requests."""
from cachecontrol import CacheControl
from google.auth import exceptions as google_auth_exceptions
from google.auth.transport.requests import Request
from google.oauth2 import id_token
import requests

FIREBASE_PROJECT_ID = 'mira-companion-app'

# Firebase signing keys rotate infrequently and publish cache headers.
_cached_http = CacheControl(requests.Session())
_google_request = Request(session=_cached_http)


class FirebaseAuthUnavailable(Exception):
    """The signing-key service could not be reached to verify a token."""


def verify_firebase_uid(token: str) -> str:
    try:
        claims = id_token.verify_firebase_token(
            token,
            _google_request,
            audience=FIREBASE_PROJECT_ID,
        )
    except google_auth_exceptions.TransportError as error:
        raise FirebaseAuthUnavailable() from error
    except (ValueError, google_auth_exceptions.GoogleAuthError):
        return ''

    uid = claims.get('user_id') or claims.get('sub')
    if not isinstance(uid, str) or not uid:
        return ''
    return uid

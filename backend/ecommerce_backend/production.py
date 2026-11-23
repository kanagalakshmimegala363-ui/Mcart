"""
Production settings for Vercel (used ONLY when the environment variable
DJANGO_SETTINGS_MODULE=ecommerce_backend.production is set on Vercel).

Your normal settings.py is untouched, so local development behaves exactly as before.
Everything secret or site-specific comes from Vercel Environment Variables.
"""
import os

from .settings import *  # noqa: F401,F403  (start from the normal settings)
from .settings import BASE_DIR, CORS_ALLOWED_ORIGINS, FRONTEND_URL


def _csv(name, default=''):
    return [item.strip() for item in os.environ.get(name, default).split(',') if item.strip()]


# --- Secrets and safety ---------------------------------------------------
DEBUG = os.environ.get('DJANGO_DEBUG', 'False') == 'True'

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', '')
if not SECRET_KEY:
    raise RuntimeError('Set DJANGO_SECRET_KEY in the Vercel project Environment Variables.')

# Vercel gives every deployment a *.vercel.app address (add your own domain with DJANGO_ALLOWED_HOSTS).
ALLOWED_HOSTS = _csv('DJANGO_ALLOWED_HOSTS', '.vercel.app')

# Vercel terminates HTTPS in front of Django; trust its header so Django knows the request is secure.
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# --- Who may call the API from a browser ------------------------------------
# FRONTEND_URL (e.g. https://mcart.vercel.app) is allowed automatically.
CORS_ALLOWED_ORIGINS = list(CORS_ALLOWED_ORIGINS) + [FRONTEND_URL.rstrip('/')] + _csv('CORS_EXTRA_ORIGINS')

# Admin login over HTTPS needs the backend's own address to be trusted.
CSRF_TRUSTED_ORIGINS = _csv('DJANGO_CSRF_ORIGINS')
for _host in (os.environ.get('VERCEL_PROJECT_PRODUCTION_URL'), os.environ.get('VERCEL_URL')):
    if _host:
        CSRF_TRUSTED_ORIGINS.append('https://' + _host)

# --- Static files (admin pages): Vercel runs collectstatic when STATIC_ROOT is set ---
STATIC_ROOT = BASE_DIR / 'staticfiles'

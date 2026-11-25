"""
Mcart backend settings.

Architecture (mirrors the reference project you shared):
- Custom User model (accounts.User) — email is unique, plus shipping fields.
- JWT auth via djangorestframework-simplejwt; login embeds the user object
  in the token response so the frontend doesn't need a second call.
- Authorization: DRF's built-in IsAdminUser (Django's is_staff flag) gates
  catalog writes; cart/orders are scoped to request.user in get_queryset().
- CORS enabled for the React dev server (localhost:3000).
- MySQL (Workbench) by default; SQLite fallback block available.
"""

from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

# --- ADDED (Google login + Aiven): read secrets from backend/.env ---------
# The .env file is optional. If it does not exist, the project behaves
# exactly as before (local MySQL, no Google button).
import os
try:
    from dotenv import load_dotenv
    load_dotenv(BASE_DIR / '.env')
except ImportError:
    pass

SECRET_KEY = 'django-insecure-CHANGE-THIS-BEFORE-DEPLOYING'
DEBUG = True
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',

    # Local apps
    'accounts',
    'products',
    'cart',
    'orders',
]

AUTH_USER_MODEL = 'accounts.User'

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'ecommerce_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'ecommerce_backend.wsgi.application'

# --------------------------------------------------------------------
# DATABASE - MySQL (MySQL Workbench / WAMP, localhost:3306)
# Create the database first in Workbench:
#   CREATE DATABASE mcart_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
# Requires: pip install mysqlclient
# --------------------------------------------------------------------
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        # Local MySQL (MySQL Workbench). Values come from backend/.env so the
        # password never sits in the source code that goes to GitHub.
        'NAME': os.environ.get('DB_NAME', 'mcart_db'),
        'USER': os.environ.get('DB_USER', 'root'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '3306'),
        'OPTIONS': {'charset': 'utf8mb4'},
    }
}

# --- ADDED: Aiven cloud MySQL ---------------------------------------------
# If AIVEN_DB_HOST is set in backend/.env, the cloud database is used
# INSTEAD of the local one above. Remove it from .env to go back to local.
if os.environ.get('AIVEN_DB_HOST'):
    ca_path = os.environ.get('AIVEN_DB_CA_PATH', str(BASE_DIR / 'certs' / 'ca.pem'))
    if not os.path.isabs(ca_path):
        ca_path = str(BASE_DIR / ca_path)
    DATABASES['default'] = {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.environ.get('AIVEN_DB_NAME', 'defaultdb'),
        'USER': os.environ.get('AIVEN_DB_USER', 'avnadmin'),
        'PASSWORD': os.environ['AIVEN_DB_PASSWORD'],
        'HOST': os.environ['AIVEN_DB_HOST'],
        'PORT': os.environ.get('AIVEN_DB_PORT', '3306'),
        'OPTIONS': {
            'charset': 'utf8mb4',
            'ssl': {'ca': ca_path},
        },
    }

# SQLite fallback (no MySQL needed) - comment the block above and
# uncomment this one if you want to run without a MySQL server:
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',
#         'NAME': BASE_DIR / 'db.sqlite3',
#     }
# }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --------------------------------------------------------------------
# REST Framework + Simple JWT
# --------------------------------------------------------------------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 56,
    'DEFAULT_FILTER_BACKENDS': ('django_filters.rest_framework.DjangoFilterBackend',),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# --------------------------------------------------------------------
# CORS - allow the React dev server to talk to this API
# --------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
]
CORS_ALLOW_CREDENTIALS = True

# --------------------------------------------------------------------
# ADDED: Google login (OAuth 2.0). Values come from backend/.env
# --------------------------------------------------------------------
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')
GOOGLE_REDIRECT_URI = os.environ.get(
    'GOOGLE_REDIRECT_URI', 'http://127.0.0.1:8000/api/auth/google/callback/'
)
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

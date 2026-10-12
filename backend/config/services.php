<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'cloudinary' => [
        'cloud_name' => env('CLOUDINARY_CLOUD_NAME'),
        'api_key' => env('CLOUDINARY_API_KEY'),
        'api_secret' => env('CLOUDINARY_API_SECRET'),
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => rtrim((string) env('APP_URL', 'http://localhost'), '/').'/api/auth/google/callback',
        'authorization_url' => env('GOOGLE_AUTHORIZATION_URL', 'https://accounts.google.com/o/oauth2/v2/auth'),
        'token_url' => env('GOOGLE_TOKEN_URL', 'https://oauth2.googleapis.com/token'),
        'userinfo_url' => env('GOOGLE_USERINFO_URL', 'https://openidconnect.googleapis.com/v1/userinfo'),
        'timeout' => (int) env('GOOGLE_HTTP_TIMEOUT', 10),
        'state_ttl' => (int) env('GOOGLE_STATE_TTL', 600),
        'setup_ttl' => (int) env('GOOGLE_SETUP_TTL', 900),
        'link_ttl' => (int) env('GOOGLE_LINK_TTL', 900),
        'handoff_ttl' => (int) env('GOOGLE_HANDOFF_TTL', 300),
    ],

    'frontend' => [
        'url' => rtrim((string) env('FRONTEND_URL', ''), '/'),
    ],

    'groq' => [
        'key' => env('GROQ_API_KEY'),
        'model' => env('GROQ_MODEL', 'openai/gpt-oss-120b'),
        'base_url' => env('GROQ_BASE_URL', 'https://api.groq.com/openai/v1'),
    ],

    'openrouteservice' => [
        'key' => env('OPENROUTESERVICE_API_KEY'),
        'base_url' => env('OPENROUTESERVICE_BASE_URL', 'https://api.openrouteservice.org'),
        'timeout' => (int) env('OPENROUTESERVICE_TIMEOUT', 8),
    ],

    'reverse_geocoder' => [
        'provider' => env('REVERSE_GEOCODER_PROVIDER', 'nominatim'),
        'url' => env('REVERSE_GEOCODER_URL', 'https://nominatim.openstreetmap.org/reverse'),
        'user_agent' => env('REVERSE_GEOCODER_USER_AGENT', env('APP_NAME', 'ALD Motorshop').' (+'.env('APP_URL', 'http://localhost').')'),
        'timeout' => (int) env('REVERSE_GEOCODER_TIMEOUT', 8),
    ],

];

<?php

return [

    'max_message_length' => 1000,

    'history_limit' => 6,

    'guest_daily_limit' => 50,

    'daily_cache_prefix' => 'assistant:daily',

    'max_completion_tokens' => 256,

    'reasoning_effort' => 'low',

    'reasoning_models' => [
        'openai/gpt-oss-20b',
        'openai/gpt-oss-120b',
    ],

    'max_knowledge_documents' => 2,

    'max_knowledge_context_characters' => 12000,

    'max_knowledge_file_characters' => 6000,

];

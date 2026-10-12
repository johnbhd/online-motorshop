<?php

namespace App\Services\Auth;

use RuntimeException;

class GoogleAuthException extends RuntimeException
{
    public function __construct(
        public readonly string $errorCode,
        string $message = 'Google authentication failed.',
    ) {
        parent::__construct($message);
    }
}

<?php

namespace App\Services;

use RuntimeException;

class CloudinaryServiceException extends RuntimeException
{
    public static function unavailable(?\Throwable $previous = null): self
    {
        return new self(
            'Image storage is temporarily unavailable. Please try again.',
            0,
            $previous,
        );
    }
}

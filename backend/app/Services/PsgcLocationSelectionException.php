<?php

namespace App\Services;

use RuntimeException;

class PsgcLocationSelectionException extends RuntimeException
{
    /**
     * @param  array<string, array<int, string>>  $errors
     */
    public function __construct(
        string $message,
        private readonly array $errors,
    ) {
        parent::__construct($message);
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function errors(): array
    {
        return $this->errors;
    }
}

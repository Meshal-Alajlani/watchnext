<?php
declare(strict_types=1);

// An error the client should see, with its HTTP status: 400 bad input, 401 not signed in, 404 not found ...
final class ApiError extends RuntimeException
{
    public function __construct(public readonly int $status, string $message)
    {
        parent::__construct($message);
    }
}

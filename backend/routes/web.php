<?php

use Illuminate\Support\Facades\Route;

// Browser-rendered routes intentionally live in the Next.js frontend.
// Application data endpoints are registered through routes/api.php.

Route::get('/up', function () {
    return response()->json([
        'status' => 'ok',
    ]);
});

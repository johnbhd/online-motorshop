<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(
                ['message' => 'Unauthenticated'],
                Response::HTTP_UNAUTHORIZED,
            );
        }

        if ($user->status !== 'active') {
            return response()->json(
                ['message' => 'Account is not active'],
                Response::HTTP_FORBIDDEN,
            );
        }

        if (! in_array($user->role, $roles, true)) {
            return response()->json(
                ['message' => 'Forbidden'],
                Response::HTTP_FORBIDDEN
            );
        }

        return $next($request);
    }
}

<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DisableCsrfForExercises
{
    public function handle($request, Closure $next)
    {
        if ($request->is('exercises') || $request->is('exercises/*')) {
            // Nonaktifkan CSRF untuk endpoint ini
            return $next($request);
        }

        return app('Illuminate\Foundation\Http\Middleware\VerifyCsrfToken')->handle($request, $next);
    }
}

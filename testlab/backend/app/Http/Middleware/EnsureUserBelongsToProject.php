<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;   // ← IMPORTANTE
use Symfony\Component\HttpFoundation\Response;

class EnsureUserBelongsToProject
{
    public function handle(Request $request, Closure $next): Response
    {
        $projectId = $request->route('id') ?? $request->route('project');
        $user = $request->user();

        if ($user->rol === 'admin') {
            return $next($request);
        }

        $belongs = DB::table('project_user')
            ->where('project_id', $projectId)
            ->where('user_id', $user->id)
            ->exists();

        if (!$belongs) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        return $next($request);
    }
}
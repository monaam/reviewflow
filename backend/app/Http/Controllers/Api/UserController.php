<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Only admin and PM can list users
        if (!$request->user()->isAdmin() && !$request->user()->isPM()) {
            abort(403, 'Access denied');
        }

        $query = User::query()->where('is_active', true);

        if ($request->has('role') && in_array($request->role, ['admin', 'pm', 'creative', 'reviewer'])) {
            $query->where('role', $request->role);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('name')->get(['id', 'name', 'email', 'role']);

        return response()->json(['data' => $users]);
    }
}

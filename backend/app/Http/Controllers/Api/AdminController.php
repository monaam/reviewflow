<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\CreativeRequest;
use App\Models\Project;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            if (!$request->user()->isAdmin()) {
                abort(403, 'Admin access required');
            }
            return $next($request);
        });
    }

    // User Management
    public function users(Request $request): JsonResponse
    {
        $query = User::query();

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('name')->paginate(20);

        return response()->json($users);
    }

    public function createUser(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin,pm,creative,reviewer',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'is_active' => true,
        ]);

        return response()->json($user, 201);
    }

    public function updateUser(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => 'sometimes|string|min:8',
            'role' => 'sometimes|in:admin,pm,creative,reviewer',
            'is_active' => 'sometimes|boolean',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return response()->json($user->fresh());
    }

    public function deleteUser(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['error' => 'Cannot delete your own account'], 400);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    // Settings
    public function settings(): JsonResponse
    {
        $settings = Setting::all()->pluck('value', 'key');

        return response()->json($settings);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'discord_webhook_url' => 'nullable|url',
        ]);

        foreach ($validated as $key => $value) {
            Setting::set($key, $value);
        }

        return response()->json(Setting::all()->pluck('value', 'key'));
    }

    // Analytics
    public function analytics(Request $request): JsonResponse
    {
        $period = $request->input('period', 30);
        $startDate = now()->subDays($period);

        $stats = [
            'total_projects' => Project::count(),
            'active_projects' => Project::active()->count(),
            'total_assets' => Asset::count(),
            'pending_assets' => Asset::pendingReview()->count(),
            'approved_assets' => Asset::approved()->count(),
            'revision_requested' => Asset::needsRevision()->count(),
            'total_requests' => CreativeRequest::count(),
            'pending_requests' => CreativeRequest::pending()->count(),
            'overdue_requests' => CreativeRequest::overdue()->count(),
            'total_users' => User::count(),
            'active_users' => User::where('is_active', true)->count(),
        ];

        // Assets by period
        $assetsByDate = Asset::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->where('created_at', '>=', $startDate)
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Approval rate
        $totalProcessed = Asset::whereIn('status', ['approved', 'revision_requested'])->count();
        $approved = Asset::approved()->count();
        $stats['approval_rate'] = $totalProcessed > 0 ? round(($approved / $totalProcessed) * 100, 1) : 0;

        // Average revision rounds (simplified)
        $stats['avg_revision_rounds'] = Asset::avg('current_version') ?? 1;

        return response()->json([
            'stats' => $stats,
            'assets_by_date' => $assetsByDate,
        ]);
    }
}

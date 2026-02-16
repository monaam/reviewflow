<?php

namespace App\Http\Controllers\Api;

use App\Enums\AssetStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\UserStoreRequest;
use App\Http\Requests\UserUpdateRequest;
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
    protected function checkAdmin(Request $request): void
    {
        if (!$request->user()->isAdmin()) {
            abort(403, 'Admin access required');
        }
    }

    // User Management
    public function users(Request $request): JsonResponse
    {
        $this->checkAdmin($request);

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

    public function createUser(UserStoreRequest $request): JsonResponse
    {
        $this->checkAdmin($request);

        $validated = $request->validated();

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'is_active' => true,
        ]);

        return response()->json($user, 201);
    }

    public function updateUser(UserUpdateRequest $request, User $user): JsonResponse
    {
        $this->checkAdmin($request);

        $validated = $request->validated();

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        // Revoke tokens when deactivating so the user is immediately locked out
        if (isset($validated['is_active']) && !$validated['is_active']) {
            $user->tokens()->delete();
        }

        return response()->json($user->fresh());
    }

    public function deleteUser(Request $request, User $user): JsonResponse
    {
        $this->checkAdmin($request);

        if ($user->id === $request->user()->id) {
            return response()->json(['error' => 'Cannot delete your own account'], 400);
        }

        // Deactivate instead of hard-deleting to preserve all related data
        $user->update(['is_active' => false]);

        // Revoke all access tokens so the user is immediately locked out
        $user->tokens()->delete();

        return response()->json(['message' => 'User deactivated successfully']);
    }

    // Settings
    public function settings(Request $request): JsonResponse
    {
        $this->checkAdmin($request);

        $settings = Setting::all()->pluck('value', 'key');

        return response()->json($settings);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $this->checkAdmin($request);

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
        $this->checkAdmin($request);

        $period = $request->input('period', 30);
        $startDate = now()->subDays($period);

        $stats = [
            'total_projects' => Project::count(),
            'active_projects' => Project::active()->count(),
            'total_assets' => Asset::count(),
            'pending_assets' => Asset::pendingReview()->count(),
            'approved_assets' => Asset::approved()->count(),
            AssetStatus::REVISION_REQUESTED->value => Asset::needsRevision()->count(),
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
        $totalProcessed = Asset::whereIn('status', [AssetStatus::APPROVED->value, AssetStatus::REVISION_REQUESTED->value])->count();
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

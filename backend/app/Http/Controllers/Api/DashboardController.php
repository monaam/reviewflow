<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\CreativeRequest;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = match ($user->role) {
            'admin' => $this->adminDashboard($user),
            'pm' => $this->pmDashboard($user),
            'creative' => $this->creativeDashboard($user),
            'reviewer' => $this->reviewerDashboard($user),
        };

        return response()->json($data);
    }

    protected function adminDashboard($user): array
    {
        return [
            'role' => 'admin',
            'stats' => [
                'total_projects' => Project::count(),
                'active_projects' => Project::active()->count(),
                'pending_assets' => Asset::pendingReview()->count(),
                'overdue_requests' => CreativeRequest::overdue()->count(),
            ],
            'asset_status_distribution' => $this->getAssetStatusDistribution(),
            'recent_activity' => $this->getRecentActivity(),
            'pending_approvals' => Asset::pendingReview()
                ->with(['uploader', 'project', 'latestVersion'])
                ->latest()
                ->limit(10)
                ->get(),
        ];
    }

    protected function getAssetStatusDistribution(): array
    {
        return [
            ['label' => 'Pending Review', 'value' => Asset::where('status', 'pending_review')->count()],
            ['label' => 'In Review', 'value' => Asset::where('status', 'in_review')->count()],
            ['label' => 'Approved', 'value' => Asset::where('status', 'approved')->count()],
            ['label' => 'Revision Requested', 'value' => Asset::where('status', 'revision_requested')->count()],
        ];
    }

    protected function pmDashboard($user): array
    {
        $projectIds = $user->projects()->pluck('projects.id');

        return [
            'role' => 'pm',
            'stats' => [
                'my_projects' => $user->projects()->count(),
                'pending_my_approval' => Asset::whereIn('project_id', $projectIds)
                    ->pendingReview()
                    ->count(),
                'requests_created' => $user->createdRequests()->count(),
                'overdue_requests' => CreativeRequest::where('created_by', $user->id)
                    ->overdue()
                    ->count(),
            ],
            'pending_approvals' => Asset::whereIn('project_id', $projectIds)
                ->pendingReview()
                ->with(['uploader', 'project', 'latestVersion'])
                ->latest()
                ->limit(10)
                ->get(),
            'my_projects' => Project::forUser($user)
                ->with(['creator'])
                ->withCount([
                    'assets',
                    'assets as approved_assets_count' => function ($query) {
                        $query->where('status', 'approved');
                    },
                    'assets as pending_assets_count' => function ($query) {
                        $query->where('status', 'pending_review');
                    },
                    'creativeRequests',
                ])
                ->active()
                ->latest()
                ->limit(5)
                ->get(),
            'overdue_requests' => CreativeRequest::where('created_by', $user->id)
                ->overdue()
                ->with(['assignee', 'project'])
                ->limit(5)
                ->get(),
        ];
    }

    protected function creativeDashboard($user): array
    {
        return [
            'role' => 'creative',
            'stats' => [
                'assigned_requests' => $user->assignedRequests()
                    ->whereNotIn('status', ['completed', 'cancelled'])
                    ->count(),
                'pending_requests' => $user->assignedRequests()
                    ->where('status', 'pending')
                    ->count(),
                'my_assets' => $user->uploadedAssets()->count(),
                'revision_requested' => $user->uploadedAssets()
                    ->needsRevision()
                    ->count(),
            ],
            'my_queue' => CreativeRequest::where(function ($q) use ($user) {
                    $q->where('assigned_to', $user->id)
                      ->orWhereNull('assigned_to');
                })
                ->whereNotIn('status', ['completed', 'cancelled'])
                ->with(['creator', 'project'])
                ->orderBy('deadline')
                ->limit(10)
                ->get(),
            'revision_needed' => Asset::where('uploaded_by', $user->id)
                ->needsRevision()
                ->with(['project', 'latestVersion'])
                ->latest()
                ->limit(5)
                ->get(),
            'recent_uploads' => $user->uploadedAssets()
                ->with(['project', 'latestVersion'])
                ->latest()
                ->limit(5)
                ->get(),
            'my_projects' => Project::forUser($user)
                ->with(['creator'])
                ->withCount([
                    'assets',
                    'assets as approved_assets_count' => function ($query) {
                        $query->where('status', 'approved');
                    },
                    'assets as pending_assets_count' => function ($query) {
                        $query->where('status', 'pending_review');
                    },
                    'creativeRequests',
                ])
                ->active()
                ->latest()
                ->limit(5)
                ->get(),
        ];
    }

    protected function reviewerDashboard($user): array
    {
        $projectIds = $user->projects()->pluck('projects.id');

        return [
            'role' => 'reviewer',
            'stats' => [
                'accessible_projects' => $user->projects()->count(),
                'pending_review' => Asset::whereIn('project_id', $projectIds)
                    ->pendingReview()
                    ->count(),
            ],
            'pending_review' => Asset::whereIn('project_id', $projectIds)
                ->pendingReview()
                ->with(['uploader', 'project', 'latestVersion'])
                ->latest()
                ->limit(10)
                ->get(),
        ];
    }

    protected function getRecentActivity(): array
    {
        $recentAssets = Asset::with(['uploader', 'project'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn($a) => [
                'type' => 'asset_uploaded',
                'data' => $a,
                'created_at' => $a->created_at,
            ]);

        $recentRequests = CreativeRequest::with(['creator', 'assignee', 'project'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn($r) => [
                'type' => 'request_created',
                'data' => $r,
                'created_at' => $r->created_at,
            ]);

        return $recentAssets->merge($recentRequests)
            ->sortByDesc('created_at')
            ->take(10)
            ->values()
            ->toArray();
    }
}

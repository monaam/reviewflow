<?php

namespace App\Policies;

use App\Models\Asset;
use App\Models\User;

class AssetPolicy
{
    public function view(User $user, Asset $asset): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        // Reviewers can only view assets sent to them (client_review) or already acted upon (approved/revision_requested)
        if ($user->isReviewer()) {
            return in_array($asset->status, ['client_review', 'approved', 'revision_requested'])
                && $asset->project->members()->where('users.id', $user->id)->exists();
        }

        return $asset->project->members()->where('users.id', $user->id)->exists();
    }

    public function update(User $user, Asset $asset): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isPM()) {
            return $asset->project->members()->where('users.id', $user->id)->exists();
        }

        if ($user->isCreative()) {
            return $asset->uploaded_by === $user->id;
        }

        return false;
    }

    public function delete(User $user, Asset $asset): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isPM()) {
            return $asset->project->created_by === $user->id ||
                   $asset->project->members()
                       ->where('users.id', $user->id)
                       ->where('role_in_project', 'owner')
                       ->exists();
        }

        // Creatives cannot delete assets - only admin and PM can delete
        return false;
    }

    public function uploadVersion(User $user, Asset $asset): bool
    {
        if ($user->isAdmin() || $user->isPM()) {
            return $this->view($user, $asset);
        }

        if ($user->isCreative()) {
            return $asset->uploaded_by === $user->id;
        }

        return false;
    }

    public function approve(User $user, Asset $asset): bool
    {
        if (!$user->canApprove()) {
            return false;
        }

        if ($user->isAdmin()) {
            return true;
        }

        return $asset->project->members()->where('users.id', $user->id)->exists();
    }

    public function comment(User $user, Asset $asset): bool
    {
        return $this->view($user, $asset);
    }

    public function lock(User $user, Asset $asset): bool
    {
        // Only PM and Admin can lock/unlock assets (not reviewers)
        if (!$user->isAdmin() && !$user->isPM()) {
            return false;
        }

        if ($user->isAdmin()) {
            return true;
        }

        return $asset->project->members()->where('users.id', $user->id)->exists();
    }

    public function download(User $user, Asset $asset): bool
    {
        return $this->view($user, $asset);
    }
}

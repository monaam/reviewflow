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

        if ($user->isCreative()) {
            return $asset->uploaded_by === $user->id;
        }

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
        // Only PM and Admin can lock/unlock assets
        if (!$user->canApprove()) {
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

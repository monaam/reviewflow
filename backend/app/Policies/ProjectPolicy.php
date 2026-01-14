<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Project $project): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $project->members()->where('users.id', $user->id)->exists();
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->isPM();
    }

    public function update(User $user, Project $project): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isPM()) {
            return $project->created_by === $user->id ||
                   $project->members()
                       ->where('users.id', $user->id)
                       ->where('role_in_project', 'owner')
                       ->exists();
        }

        return false;
    }

    public function delete(User $user, Project $project): bool
    {
        return $user->isAdmin();
    }

    public function uploadAsset(User $user, Project $project): bool
    {
        if ($user->isAdmin() || $user->isPM()) {
            return $this->view($user, $project);
        }

        if ($user->isCreative()) {
            return $project->members()->where('users.id', $user->id)->exists();
        }

        return false;
    }

    public function createRequest(User $user, Project $project): bool
    {
        if (!$user->isAdmin() && !$user->isPM()) {
            return false;
        }

        return $this->view($user, $project);
    }
}

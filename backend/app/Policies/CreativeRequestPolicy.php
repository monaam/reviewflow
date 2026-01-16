<?php

namespace App\Policies;

use App\Models\CreativeRequest;
use App\Models\User;

class CreativeRequestPolicy
{
    public function view(User $user, CreativeRequest $request): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($request->created_by === $user->id || $request->assigned_to === $user->id) {
            return true;
        }

        // Creatives can view unassigned requests (so they can pick them up)
        if ($request->assigned_to === null && $user->isCreative()) {
            return true;
        }

        return $request->project->members()->where('users.id', $user->id)->exists();
    }

    public function update(User $user, CreativeRequest $request): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $request->created_by === $user->id;
    }

    public function delete(User $user, CreativeRequest $request): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $request->created_by === $user->id;
    }

    public function start(User $user, CreativeRequest $request): bool
    {
        if ($request->status !== 'pending') {
            return false;
        }

        // Assigned to this user OR unassigned (creative can pick it up)
        return $request->assigned_to === $user->id ||
               ($request->assigned_to === null && $user->isCreative());
    }

    public function complete(User $user, CreativeRequest $request): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $request->created_by === $user->id;
    }
}

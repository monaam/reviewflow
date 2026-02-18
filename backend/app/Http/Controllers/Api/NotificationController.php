<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterPushSubscriptionRequest;
use App\Http\Requests\UpdatePushPreferencesRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = $request->user()
            ->notifications()
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($notifications);
    }

    public function unread(Request $request): JsonResponse
    {
        $notifications = $request->user()
            ->unreadNotifications()
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $unreadCount = $request->user()->unreadNotifications()->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()
            ->notifications()
            ->findOrFail($id);

        $notification->markAsRead();

        return response()->json($notification);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['message' => 'All notifications marked as read']);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $request->user()
            ->notifications()
            ->findOrFail($id)
            ->delete();

        return response()->json(['message' => 'Notification deleted']);
    }

    public function registerPushSubscription(RegisterPushSubscriptionRequest $request): JsonResponse
    {
        $request->validated();

        $request->user()->update([
            'onesignal_player_id' => $request->player_id,
        ]);

        return response()->json(['message' => 'Push subscription registered']);
    }

    public function updatePushPreferences(UpdatePushPreferencesRequest $request): JsonResponse
    {
        $request->validated();

        $request->user()->update([
            'push_notifications_enabled' => $request->enabled,
        ]);

        return response()->json(['message' => 'Push preferences updated']);
    }
}

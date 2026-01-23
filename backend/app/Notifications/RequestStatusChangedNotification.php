<?php

namespace App\Notifications;

use App\Models\CreativeRequest;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\OneSignal\OneSignalChannel;
use NotificationChannels\OneSignal\OneSignalMessage;

class RequestStatusChangedNotification extends Notification implements ShouldBroadcast
{
    use Queueable;

    public function __construct(
        public CreativeRequest $request,
        public string $oldStatus,
        public User $actor
    ) {}

    public function via(object $notifiable): array
    {
        $channels = ['database', 'broadcast'];

        if ($notifiable->push_notifications_enabled && $notifiable->onesignal_player_id) {
            $channels[] = OneSignalChannel::class;
        }

        return $channels;
    }

    public function toDatabase(object $notifiable): array
    {
        $statusLabels = [
            'pending' => 'Pending',
            'in_progress' => 'In Progress',
            'asset_submitted' => 'Asset Submitted',
            'completed' => 'Completed',
            'cancelled' => 'Cancelled',
        ];

        $newStatusLabel = $statusLabels[$this->request->status] ?? $this->request->status;

        return [
            'type' => 'request.status_changed',
            'title' => 'Request Status Updated',
            'message' => "{$this->actor->name} changed {$this->request->title} status to {$newStatusLabel}",
            'actor' => [
                'id' => $this->actor->id,
                'name' => $this->actor->name,
                'avatar' => $this->actor->avatar,
            ],
            'request_id' => $this->request->id,
            'project_id' => $this->request->project_id,
            'old_status' => $this->oldStatus,
            'new_status' => $this->request->status,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toDatabase($notifiable));
    }

    public function toOneSignal(object $notifiable): OneSignalMessage
    {
        $statusLabels = [
            'pending' => 'Pending',
            'in_progress' => 'In Progress',
            'asset_submitted' => 'Asset Submitted',
            'completed' => 'Completed',
            'cancelled' => 'Cancelled',
        ];

        $newStatusLabel = $statusLabels[$this->request->status] ?? $this->request->status;

        return OneSignalMessage::create()
            ->setSubject('Request Status Updated')
            ->setBody("{$this->actor->name} changed {$this->request->title} status to {$newStatusLabel}")
            ->setUrl(config('app.frontend_url') . "/requests/{$this->request->id}");
    }
}

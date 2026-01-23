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

class RequestAssignedNotification extends Notification implements ShouldBroadcast
{
    use Queueable;

    public function __construct(
        public CreativeRequest $request,
        public ?User $assigner = null
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
        $message = $this->assigner
            ? "{$this->assigner->name} assigned you to {$this->request->title}"
            : "You have been assigned to {$this->request->title}";

        return [
            'type' => 'request.assigned',
            'title' => 'Request Assigned',
            'message' => $message,
            'actor' => $this->assigner ? [
                'id' => $this->assigner->id,
                'name' => $this->assigner->name,
                'avatar' => $this->assigner->avatar,
            ] : null,
            'request_id' => $this->request->id,
            'project_id' => $this->request->project_id,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toDatabase($notifiable));
    }

    public function toOneSignal(object $notifiable): OneSignalMessage
    {
        $message = $this->assigner
            ? "{$this->assigner->name} assigned you to {$this->request->title}"
            : "You have been assigned to {$this->request->title}";

        return OneSignalMessage::create()
            ->setSubject('Request Assigned')
            ->setBody($message)
            ->setUrl(config('app.frontend_url') . "/requests/{$this->request->id}");
    }
}

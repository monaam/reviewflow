<?php

namespace App\Notifications;

use App\Models\Asset;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\OneSignal\OneSignalChannel;
use NotificationChannels\OneSignal\OneSignalMessage;

class RevisionRequestedNotification extends Notification implements ShouldBroadcast
{
    use Queueable;

    public function __construct(
        public Asset $asset,
        public User $reviewer,
        public ?string $feedback = null
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
        return [
            'type' => 'asset.revision_requested',
            'title' => 'Revision Requested',
            'message' => "{$this->reviewer->name} requested revisions on {$this->asset->title}",
            'actor' => [
                'id' => $this->reviewer->id,
                'name' => $this->reviewer->name,
                'avatar' => $this->reviewer->avatar,
            ],
            'asset_id' => $this->asset->id,
            'project_id' => $this->asset->project_id,
            'feedback' => $this->feedback,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toDatabase($notifiable));
    }

    public function toOneSignal(object $notifiable): OneSignalMessage
    {
        return OneSignalMessage::create()
            ->setSubject('Revision Requested')
            ->setBody("{$this->reviewer->name} requested revisions on {$this->asset->title}")
            ->setUrl(config('app.frontend_url') . "/assets/{$this->asset->id}");
    }
}

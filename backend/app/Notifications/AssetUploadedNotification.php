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

class AssetUploadedNotification extends Notification implements ShouldBroadcast
{
    use Queueable;

    public function __construct(
        public Asset $asset,
        public User $uploader
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
            'type' => 'asset.uploaded',
            'title' => 'New Asset Uploaded',
            'message' => "{$this->uploader->name} uploaded {$this->asset->title}",
            'actor' => [
                'id' => $this->uploader->id,
                'name' => $this->uploader->name,
                'avatar' => $this->uploader->avatar,
            ],
            'asset_id' => $this->asset->id,
            'project_id' => $this->asset->project_id,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toDatabase($notifiable));
    }

    public function toOneSignal(object $notifiable): OneSignalMessage
    {
        return OneSignalMessage::create()
            ->setSubject('New Asset Uploaded')
            ->setBody("{$this->uploader->name} uploaded {$this->asset->title}")
            ->setUrl(config('app.frontend_url') . "/assets/{$this->asset->id}");
    }
}

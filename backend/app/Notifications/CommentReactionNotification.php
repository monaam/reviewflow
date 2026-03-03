<?php

namespace App\Notifications;

use App\Models\Comment;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\OneSignal\OneSignalChannel;
use NotificationChannels\OneSignal\OneSignalMessage;

class CommentReactionNotification extends Notification implements ShouldBroadcast
{
    use Queueable;

    public function __construct(
        public Comment $comment,
        public User $actor,
        public string $emoji
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
            'type' => 'comment.reaction',
            'title' => 'New Reaction',
            'message' => "{$this->actor->name} reacted {$this->emoji} to your comment on {$this->comment->asset->title}",
            'actor' => [
                'id' => $this->actor->id,
                'name' => $this->actor->name,
                'avatar' => $this->actor->avatar,
            ],
            'asset_id' => $this->comment->asset_id,
            'comment_id' => $this->comment->id,
            'project_id' => $this->comment->asset->project_id,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toDatabase($notifiable));
    }

    public function toOneSignal(object $notifiable): OneSignalMessage
    {
        return OneSignalMessage::create()
            ->setSubject('New Reaction')
            ->setBody("{$this->actor->name} reacted {$this->emoji} to your comment on {$this->comment->asset->title}")
            ->setUrl(config('app.frontend_url') . "/assets/{$this->comment->asset_id}");
    }
}

<?php

namespace App\Services;

use App\Models\Asset;
use App\Models\Comment;
use App\Models\CreativeRequest;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DiscordNotificationService
{
    protected ?string $webhookUrl;
    protected string $appUrl;

    public function __construct()
    {
        $this->webhookUrl = Setting::getDiscordWebhookUrl();
        $this->appUrl = config('app.url');
    }

    public function isConfigured(): bool
    {
        return !empty($this->webhookUrl);
    }

    public function notifyNewRequest(CreativeRequest $request): void
    {
        $this->send([
            'embeds' => [[
                'title' => '📋 New Creative Request',
                'color' => 0x3498db,
                'fields' => [
                    ['name' => 'Title', 'value' => $request->title, 'inline' => false],
                    ['name' => 'Project', 'value' => $request->project->name, 'inline' => true],
                    ['name' => 'Assigned To', 'value' => $request->assignee?->name ?? 'Unassigned', 'inline' => true],
                    ['name' => 'Priority', 'value' => ucfirst($request->priority), 'inline' => true],
                    ['name' => 'Deadline', 'value' => $request->deadline->format('M j, Y g:i A'), 'inline' => true],
                ],
                'footer' => ['text' => "Created by {$request->creator->name}"],
                'timestamp' => now()->toIso8601String(),
            ]],
        ]);
    }

    public function notifyNewUpload(Asset $asset): void
    {
        $this->send([
            'embeds' => [[
                'title' => '🎨 New Asset Uploaded',
                'color' => 0x9b59b6,
                'fields' => [
                    ['name' => 'Asset', 'value' => $asset->title, 'inline' => false],
                    ['name' => 'Project', 'value' => $asset->project->name, 'inline' => true],
                    ['name' => 'Type', 'value' => ucfirst($asset->type), 'inline' => true],
                    ['name' => 'Uploaded By', 'value' => $asset->uploader->name, 'inline' => true],
                ],
                'footer' => ['text' => 'Awaiting review'],
                'timestamp' => now()->toIso8601String(),
            ]],
        ]);
    }

    public function notifyNewVersion(Asset $asset): void
    {
        $this->send([
            'embeds' => [[
                'title' => '📤 New Version Uploaded',
                'color' => 0x1abc9c,
                'fields' => [
                    ['name' => 'Asset', 'value' => "{$asset->title} v{$asset->current_version}", 'inline' => false],
                    ['name' => 'Project', 'value' => $asset->project->name, 'inline' => true],
                    ['name' => 'Uploaded By', 'value' => $asset->uploader->name, 'inline' => true],
                ],
                'footer' => ['text' => 'Ready for review'],
                'timestamp' => now()->toIso8601String(),
            ]],
        ]);
    }

    public function notifyApproval(Asset $asset, User $approver): void
    {
        $this->send([
            'embeds' => [[
                'title' => '✅ Asset Approved',
                'color' => 0x2ecc71,
                'fields' => [
                    ['name' => 'Asset', 'value' => $asset->title, 'inline' => false],
                    ['name' => 'Project', 'value' => $asset->project->name, 'inline' => true],
                    ['name' => 'Approved By', 'value' => $approver->name, 'inline' => true],
                ],
                'timestamp' => now()->toIso8601String(),
            ]],
        ]);
    }

    public function notifyRevisionRequested(Asset $asset, User $reviewer, string $comment): void
    {
        $this->send([
            'embeds' => [[
                'title' => '🔄 Revision Requested',
                'color' => 0xe74c3c,
                'fields' => [
                    ['name' => 'Asset', 'value' => $asset->title, 'inline' => false],
                    ['name' => 'Project', 'value' => $asset->project->name, 'inline' => true],
                    ['name' => 'Requested By', 'value' => $reviewer->name, 'inline' => true],
                    ['name' => 'Feedback', 'value' => substr($comment, 0, 500), 'inline' => false],
                ],
                'timestamp' => now()->toIso8601String(),
            ]],
        ]);
    }

    public function notifyNewComment(Comment $comment): void
    {
        $asset = $comment->asset;
        $preview = strlen($comment->content) > 100
            ? substr($comment->content, 0, 100) . '...'
            : $comment->content;

        $this->send([
            'embeds' => [[
                'title' => '💬 New Comment',
                'color' => 0xf39c12,
                'fields' => [
                    ['name' => 'Asset', 'value' => $asset->title, 'inline' => true],
                    ['name' => 'Project', 'value' => $asset->project->name, 'inline' => true],
                    ['name' => 'Comment', 'value' => $preview, 'inline' => false],
                ],
                'footer' => ['text' => "By {$comment->user->name}"],
                'timestamp' => now()->toIso8601String(),
            ]],
        ]);
    }

    public function notifyDeadlineApproaching(CreativeRequest $request): void
    {
        $this->send([
            'embeds' => [[
                'title' => '⏰ Deadline Approaching',
                'color' => 0xf1c40f,
                'fields' => [
                    ['name' => 'Request', 'value' => $request->title, 'inline' => false],
                    ['name' => 'Project', 'value' => $request->project->name, 'inline' => true],
                    ['name' => 'Assigned To', 'value' => $request->assignee?->name ?? 'Unassigned', 'inline' => true],
                    ['name' => 'Due', 'value' => $request->deadline->format('M j, Y g:i A'), 'inline' => false],
                ],
                'footer' => ['text' => 'Due in less than 24 hours'],
                'timestamp' => now()->toIso8601String(),
            ]],
        ]);
    }

    public function notifyOverdue(CreativeRequest $request): void
    {
        $this->send([
            'embeds' => [[
                'title' => '🚨 Request Overdue',
                'color' => 0xe74c3c,
                'fields' => [
                    ['name' => 'Request', 'value' => $request->title, 'inline' => false],
                    ['name' => 'Project', 'value' => $request->project->name, 'inline' => true],
                    ['name' => 'Assigned To', 'value' => $request->assignee?->name ?? 'Unassigned', 'inline' => true],
                    ['name' => 'Was Due', 'value' => $request->deadline->format('M j, Y g:i A'), 'inline' => false],
                ],
                'footer' => ['text' => "Overdue by {$request->deadline->diffForHumans()}"],
                'timestamp' => now()->toIso8601String(),
            ]],
        ]);
    }

    protected function send(array $payload): void
    {
        if (!$this->isConfigured()) {
            return;
        }

        try {
            Http::post($this->webhookUrl, $payload);
        } catch (\Exception $e) {
            Log::error('Discord notification failed', [
                'error' => $e->getMessage(),
                'payload' => $payload,
            ]);
        }
    }
}

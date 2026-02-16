<?php

namespace App\Enums;

enum AssetStatus: string
{
    case PENDING_REVIEW = 'pending_review';
    case IN_REVIEW = 'in_review';
    case CLIENT_REVIEW = 'client_review';
    case APPROVED = 'approved';
    case REVISION_REQUESTED = 'revision_requested';
    case PUBLISHED = 'published';

    /**
     * Get all status values as array (for validation)
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get statuses visible to reviewers (external clients)
     */
    public static function reviewerVisible(): array
    {
        return [
            self::CLIENT_REVIEW->value,
            self::APPROVED->value,
            self::REVISION_REQUESTED->value,
            self::PUBLISHED->value,
        ];
    }

    /**
     * Get human-readable label
     */
    public function label(): string
    {
        return match($this) {
            self::PENDING_REVIEW => 'Pending Review',
            self::IN_REVIEW => 'In Review',
            self::CLIENT_REVIEW => 'Client Review',
            self::APPROVED => 'Approved',
            self::REVISION_REQUESTED => 'Revision Requested',
            self::PUBLISHED => 'Published',
        };
    }
}

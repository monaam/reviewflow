<?php

namespace App\Enums;

enum Priority: string
{
    case LOW = 'low';
    case NORMAL = 'normal';
    case HIGH = 'high';
    case URGENT = 'urgent';

    /**
     * Get all priority values as array (for validation)
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get human-readable label
     */
    public function label(): string
    {
        return match($this) {
            self::LOW => 'Low',
            self::NORMAL => 'Normal',
            self::HIGH => 'High',
            self::URGENT => 'Urgent',
        };
    }
}

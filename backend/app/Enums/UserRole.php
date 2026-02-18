<?php

namespace App\Enums;

enum UserRole: string
{
    case ADMIN = 'admin';
    case PM = 'pm';
    case CREATIVE = 'creative';
    case REVIEWER = 'reviewer';

    /**
     * Get all role values as array (for validation)
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get managerial roles (admin, pm)
     */
    public static function managerial(): array
    {
        return [
            self::ADMIN->value,
            self::PM->value,
        ];
    }

    /**
     * Get roles that can approve assets
     */
    public static function canApprove(): array
    {
        return [
            self::ADMIN->value,
            self::PM->value,
            self::REVIEWER->value,
        ];
    }

    /**
     * Get human-readable label
     */
    public function label(): string
    {
        return match($this) {
            self::ADMIN => 'Admin',
            self::PM => 'Project Manager',
            self::CREATIVE => 'Creative',
            self::REVIEWER => 'Reviewer',
        };
    }
}

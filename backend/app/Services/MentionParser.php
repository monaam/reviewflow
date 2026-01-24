<?php

namespace App\Services;

class MentionParser
{
    /**
     * Extract user IDs from @user:uuid format in content.
     *
     * @param string $content The comment content to parse
     * @return array<string> Array of unique user UUIDs
     */
    public function extractMentionedUserIds(string $content): array
    {
        preg_match_all('/@user:([a-f0-9-]{36})/i', $content, $matches);

        return array_unique($matches[1]);
    }
}

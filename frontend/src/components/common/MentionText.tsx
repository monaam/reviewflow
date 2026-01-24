import { FC, useMemo } from 'react';
import { User } from '../../types';

interface MentionTextProps {
  content: string;
  mentions?: User[];
  className?: string;
}

interface TextPart {
  type: 'text' | 'mention';
  content: string;
  userId?: string;
  userName?: string;
}

/**
 * Renders comment content with highlighted mentions.
 * Parses @user:uuid format from text and replaces with highlighted user names.
 */
export const MentionText: FC<MentionTextProps> = ({
  content,
  mentions = [],
  className = '',
}) => {
  // Create a map of user IDs to names for quick lookup
  const mentionMap = useMemo(() => {
    const map = new Map<string, string>();
    mentions.forEach(user => {
      map.set(user.id, user.name);
    });
    return map;
  }, [mentions]);

  // Parse content and split into parts
  const parts = useMemo((): TextPart[] => {
    const mentionRegex = /@user:([a-f0-9-]{36})/gi;
    const result: TextPart[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      // Add text before the mention
      if (match.index > lastIndex) {
        result.push({
          type: 'text',
          content: content.slice(lastIndex, match.index),
        });
      }

      // Add the mention
      const userId = match[1];
      const userName = mentionMap.get(userId);
      result.push({
        type: 'mention',
        content: match[0],
        userId,
        userName: userName || 'Unknown User',
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after the last mention
    if (lastIndex < content.length) {
      result.push({
        type: 'text',
        content: content.slice(lastIndex),
      });
    }

    return result;
  }, [content, mentionMap]);

  // If no mentions in content, just render the text
  if (parts.length === 0 || (parts.length === 1 && parts[0].type === 'text')) {
    return <span className={className}>{content}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return <span key={index}>{part.content}</span>;
        }

        return (
          <span
            key={index}
            className="text-primary-600 dark:text-primary-400 font-medium"
            title={`@${part.userName}`}
          >
            @{part.userName}
          </span>
        );
      })}
    </span>
  );
};

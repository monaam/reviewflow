import { FC, useMemo } from 'react';
import { User } from '../../types';

interface MentionTextProps {
  content: string;
  mentions?: User[];
  className?: string;
}

interface TextPart {
  type: 'text' | 'mention' | 'link';
  content: string;
  userId?: string;
  userName?: string;
  href?: string;
}

const URL_REGEX = /https?:\/\/[^\s<>'")\]]+/gi;

function truncateUrl(url: string, maxLength = 40): string {
  const withoutProtocol = url.replace(/^https?:\/\//, '');
  if (withoutProtocol.length <= maxLength) return withoutProtocol;
  return withoutProtocol.slice(0, maxLength) + '…';
}

function splitTextWithLinks(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let lastIndex = 0;
  let match;

  URL_REGEX.lastIndex = 0;
  while ((match = URL_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'link', content: truncateUrl(match[0]), href: match[0] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts;
}

/**
 * Renders comment content with highlighted mentions and clickable links.
 * Parses @user:uuid format from text and replaces with highlighted user names.
 * Detects http/https URLs and renders them as clickable links.
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

  // Parse content: first split by mentions, then split text parts by URLs
  const parts = useMemo((): TextPart[] => {
    const mentionRegex = /@user:([a-f0-9-]{36})/gi;
    const mentionParts: TextPart[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        mentionParts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index),
        });
      }

      const userId = match[1];
      const userName = mentionMap.get(userId);
      mentionParts.push({
        type: 'mention',
        content: match[0],
        userId,
        userName: userName || 'Unknown User',
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      mentionParts.push({
        type: 'text',
        content: content.slice(lastIndex),
      });
    }

    // Second pass: split text parts to detect URLs
    const result: TextPart[] = [];
    for (const part of mentionParts) {
      if (part.type === 'text') {
        result.push(...splitTextWithLinks(part.content));
      } else {
        result.push(part);
      }
    }

    return result;
  }, [content, mentionMap]);

  if (parts.length === 0 || (parts.length === 1 && parts[0].type === 'text')) {
    // Still need to check for links in plain text
    const linkParts = splitTextWithLinks(content);
    if (linkParts.length === 1 && linkParts[0].type === 'text') {
      return <span className={className}>{content}</span>;
    }
    return (
      <span className={className}>
        {linkParts.map((part, index) =>
          part.type === 'link' ? (
            <a
              key={index}
              href={part.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300"
              title={part.href}
            >
              {part.content}
            </a>
          ) : (
            <span key={index}>{part.content}</span>
          )
        )}
      </span>
    );
  }

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === 'link') {
          return (
            <a
              key={index}
              href={part.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300"
              title={part.href}
            >
              {part.content}
            </a>
          );
        }

        if (part.type === 'mention') {
          return (
            <span
              key={index}
              className="text-primary-600 dark:text-primary-400 font-medium"
              title={`@${part.userName}`}
            >
              @{part.userName}
            </span>
          );
        }

        return <span key={index}>{part.content}</span>;
      })}
    </span>
  );
};

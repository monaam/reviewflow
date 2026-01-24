import { FC, useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { useMentionableUsers } from '../../hooks/useMentionableUsers';
import { MentionableUser } from '../../types';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  assetId: string;
  placeholder?: string;
  rows?: number;
  className?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

// Parse @user:uuid patterns and return display text with user names
function parseForDisplay(content: string, userMap: Map<string, string>): string {
  return content.replace(/@user:([a-f0-9-]{36})/gi, (match, userId) => {
    const userName = userMap.get(userId);
    return userName ? `@${userName}` : match;
  });
}

// Convert display text back to storage format
function parseForStorage(displayText: string, userMap: Map<string, MentionableUser>): string {
  // Replace @username with @user:uuid
  let result = displayText;
  userMap.forEach((user, name) => {
    // Use word boundary to match @username accurately
    const regex = new RegExp(`@${escapeRegex(name)}(?=\\s|$|[^\\w])`, 'g');
    result = result.replace(regex, `@user:${user.id}`);
  });
  return result;
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const MentionInput: FC<MentionInputProps> = ({
  value,
  onChange,
  assetId,
  placeholder = 'Add a comment...',
  rows = 3,
  className = '',
  autoFocus = false,
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartPos, setMentionStartPos] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [displayValue, setDisplayValue] = useState('');

  const { users, isLoading, search, allUsers } = useMentionableUsers(assetId);

  // Create maps for conversion
  const idToNameMap = useRef(new Map<string, string>());
  const nameToUserMap = useRef(new Map<string, MentionableUser>());

  // Update maps when users change
  useEffect(() => {
    idToNameMap.current.clear();
    nameToUserMap.current.clear();
    allUsers.forEach(user => {
      idToNameMap.current.set(user.id, user.name);
      nameToUserMap.current.set(user.name, user);
    });
  }, [allUsers]);

  // Convert storage value to display value when value prop changes externally
  useEffect(() => {
    const newDisplayValue = parseForDisplay(value, idToNameMap.current);
    setDisplayValue(newDisplayValue);
  }, [value, allUsers]);

  // Filter users based on mention query
  useEffect(() => {
    if (mentionQuery) {
      search(mentionQuery);
    }
  }, [mentionQuery, search]);

  // Reset selected index when users change
  useEffect(() => {
    setSelectedIndex(0);
  }, [users]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDisplayValue = e.target.value;
    const cursorPos = e.target.selectionStart;

    setDisplayValue(newDisplayValue);

    // Convert display value to storage value
    const storageValue = parseForStorage(newDisplayValue, nameToUserMap.current);
    onChange(storageValue);

    // Check if we should show the mention dropdown
    const textBeforeCursor = newDisplayValue.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Only show dropdown if there's no space after @ (user is still typing the mention)
      const hasSpace = textAfterAt.includes(' ');
      // Check if this @ is at the start or preceded by a space
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
      const isValidMentionStart = charBeforeAt === ' ' || charBeforeAt === '\n' || lastAtIndex === 0;

      if (!hasSpace && isValidMentionStart) {
        setShowDropdown(true);
        setMentionStartPos(lastAtIndex);
        setMentionQuery(textAfterAt);
      } else {
        setShowDropdown(false);
        setMentionStartPos(null);
        setMentionQuery('');
      }
    } else {
      setShowDropdown(false);
      setMentionStartPos(null);
      setMentionQuery('');
    }
  }, [onChange]);

  const insertMention = useCallback((user: MentionableUser) => {
    if (mentionStartPos === null || !textareaRef.current) return;

    const beforeMention = displayValue.slice(0, mentionStartPos);
    const afterCursor = displayValue.slice(textareaRef.current.selectionStart);

    // Insert the mention with display name (will be converted to uuid on storage)
    const mentionText = `@${user.name} `;
    const newDisplayValue = beforeMention + mentionText + afterCursor;

    setDisplayValue(newDisplayValue);

    // Convert to storage format
    const storageValue = parseForStorage(newDisplayValue, nameToUserMap.current);
    // Also add this user to the map in case they weren't there
    nameToUserMap.current.set(user.name, user);
    idToNameMap.current.set(user.id, user.name);

    // Re-convert with updated map
    onChange(parseForStorage(newDisplayValue, nameToUserMap.current));

    setShowDropdown(false);
    setMentionStartPos(null);
    setMentionQuery('');

    // Set cursor position after the inserted mention
    const newCursorPos = beforeMention.length + mentionText.length;
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }, [mentionStartPos, displayValue, onChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showDropdown || users.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % users.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + users.length) % users.length);
        break;
      case 'Enter':
        if (showDropdown && users[selectedIndex]) {
          e.preventDefault();
          insertMention(users[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        break;
      case 'Tab':
        if (showDropdown && users[selectedIndex]) {
          e.preventDefault();
          insertMention(users[selectedIndex]);
        }
        break;
    }
  }, [showDropdown, users, selectedIndex, insertMention]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={`input ${className}`}
        autoFocus={autoFocus}
        disabled={disabled}
      />

      {showDropdown && users.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-64 max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg mt-1"
        >
          {isLoading ? (
            <div className="p-3 text-sm text-gray-500 dark:text-gray-400">
              Loading...
            </div>
          ) : (
            users.map((user, index) => (
              <button
                key={user.id}
                type="button"
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                }`}
                onClick={() => insertMention(user)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-medium">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-sm text-gray-900 dark:text-white truncate">
                  {user.name}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {showDropdown && !isLoading && users.length === 0 && mentionQuery && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg mt-1"
        >
          <div className="p-3 text-sm text-gray-500 dark:text-gray-400">
            No users found matching "{mentionQuery}"
          </div>
        </div>
      )}
    </div>
  );
};

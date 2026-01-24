import { useState, useEffect, useCallback, useRef } from 'react';
import { assetsApi } from '../api/assets';
import { MentionableUser } from '../types';

interface UseMentionableUsersResult {
  users: MentionableUser[];
  allUsers: MentionableUser[];
  isLoading: boolean;
  error: Error | null;
  search: (query: string) => void;
  clearSearch: () => void;
}

export function useMentionableUsers(assetId: string): UseMentionableUsersResult {
  const [users, setUsers] = useState<MentionableUser[]>([]);
  const [allUsers, setAllUsers] = useState<MentionableUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch all users initially
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const data = await assetsApi.getMentionableUsers(assetId);
        setAllUsers(data);
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch users'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [assetId]);

  const search = useCallback((query: string) => {
    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Filter locally for instant feedback
    if (!query.trim()) {
      setUsers(allUsers);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = allUsers.filter(user =>
      user.name.toLowerCase().includes(lowerQuery)
    );
    setUsers(filtered);
  }, [allUsers]);

  const clearSearch = useCallback(() => {
    setUsers(allUsers);
  }, [allUsers]);

  return {
    users,
    allUsers,
    isLoading,
    error,
    search,
    clearSearch,
  };
}

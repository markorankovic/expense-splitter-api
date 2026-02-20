import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { createGroup as createGroupRequest, fetchGroups as fetchGroupsRequest } from '../api';
import type { Group } from '../types';
import { useAuth } from './AuthContext';

type GroupContextValue = {
  groups: Group[];
  groupsLoading: boolean;
  groupsError: string;
  activeGroupId: string | null;
  fetchGroups: () => Promise<void>;
  createGroup: (name: string) => Promise<void>;
  selectActiveGroup: (groupId: string) => void;
};

const GroupContext = createContext<GroupContextValue | undefined>(undefined);

export function GroupProvider({ children }: PropsWithChildren) {
  const { token, loggedIn } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState('');
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    setGroupsError('');
    setGroupsLoading(true);
    try {
      const data = await fetchGroupsRequest(token, 1, 50);
      setGroups(data.items);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load groups';
      setGroupsError(message);
      throw err;
    } finally {
      setGroupsLoading(false);
    }
  }, [token]);

  const createGroup = useCallback(async (name: string) => {
    if (!token || !name) {
      throw new Error('Invalid group name');
    }

    setGroupsError('');
    try {
      await createGroupRequest(token, name);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create group';
      setGroupsError(message);
      throw err;
    }
  }, [token]);

  useEffect(() => {
    if (!loggedIn) {
      setGroups([]);
      setGroupsError('');
      setGroupsLoading(false);
      setActiveGroupId(null);
    }
  }, [loggedIn]);

  useEffect(() => {
    if (!groups.length) {
      setActiveGroupId(null);
      return;
    }
    if (!activeGroupId || !groups.some((group) => group.id === activeGroupId)) {
      setActiveGroupId(groups[0].id);
    }
  }, [groups, activeGroupId]);

  const selectActiveGroup = (groupId: string) => {
    setActiveGroupId(groupId);
  };

  const value = useMemo(
    () => ({
      groups,
      groupsLoading,
      groupsError,
      activeGroupId,
      fetchGroups,
      createGroup,
      selectActiveGroup,
    }),
    [
      groups,
      groupsLoading,
      groupsError,
      activeGroupId,
      fetchGroups,
      createGroup,
      selectActiveGroup,
    ],
  );

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>;
}

export function useGroups() {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroups must be used within a GroupProvider');
  }
  return context;
}

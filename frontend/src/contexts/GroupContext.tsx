import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  createGroup as createGroupRequest,
  deleteGroup as deleteGroupRequest,
  fetchGroups as fetchGroupsRequest,
  updateGroup as updateGroupRequest,
} from '../api';
import type { Group } from '../types';
import { useAuth } from './AuthContext';
import { useMe } from './MeContext';

type GroupContextValue = {
  groups: Group[];
  groupsLoading: boolean;
  groupsError: string;
  activeGroupId: string | null;
  fetchGroups: () => Promise<void>;
  createGroup: (name: string) => Promise<void>;
  updateGroup: (groupId: string, name: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  selectActiveGroup: (groupId: string) => void;
};

const GroupContext = createContext<GroupContextValue | undefined>(undefined);

export function GroupProvider({ children }: PropsWithChildren) {
  const { token, loggedIn } = useAuth();
  const { meId } = useMe();
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState('');
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const orderedGroups = useMemo(
    () =>
      [...groups].sort((a, b) => {
        const aOwned = a.ownerId === meId ? 1 : 0;
        const bOwned = b.ownerId === meId ? 1 : 0;
        return bOwned - aOwned;
      }),
    [groups, meId],
  );

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

  const updateGroup = useCallback(async (groupId: string, name: string) => {
    if (!token || !groupId || !name) {
      throw new Error('Invalid group data');
    }

    setGroupsError('');
    try {
      await updateGroupRequest(token, groupId, name);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update group';
      setGroupsError(message);
      throw err;
    }
  }, [token]);

  const deleteGroup = useCallback(async (groupId: string) => {
    if (!token || !groupId) {
      throw new Error('Invalid group');
    }

    setGroupsError('');
    try {
      await deleteGroupRequest(token, groupId);
      if (activeGroupId === groupId) {
        setActiveGroupId(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete group';
      setGroupsError(message);
      throw err;
    }
  }, [token, activeGroupId]);

  useEffect(() => {
    if (!loggedIn) {
      setGroups([]);
      setGroupsError('');
      setGroupsLoading(false);
      setActiveGroupId(null);
      return;
    }
    setActiveGroupId(null);
  }, [loggedIn]);

  useEffect(() => {
    if (!orderedGroups.length) {
      setActiveGroupId(null);
      return;
    }
    if (
      !activeGroupId ||
      !orderedGroups.some((group) => group.id === activeGroupId)
    ) {
      setActiveGroupId(orderedGroups[0].id);
    }
  }, [orderedGroups, activeGroupId]);

  const selectActiveGroup = (groupId: string) => {
    setActiveGroupId(groupId);
  };

  const value = useMemo(
    () => ({
      groups: orderedGroups,
      groupsLoading,
      groupsError,
      activeGroupId,
      fetchGroups,
      createGroup,
      updateGroup,
      deleteGroup,
      selectActiveGroup,
    }),
    [
      orderedGroups,
      groupsLoading,
      groupsError,
      activeGroupId,
      fetchGroups,
      createGroup,
      updateGroup,
      deleteGroup,
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

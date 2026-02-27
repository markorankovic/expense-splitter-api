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

type GroupContextValue = {
  groups: Group[];
  groupsLoading: boolean;
  groupsError: string;
  activeGroupId: string | null;
  groupPage: number;
  groupPageSize: number;
  groupTotal: number;
  fetchGroups: (page?: number) => Promise<void>;
  createGroup: (name: string) => Promise<void>;
  updateGroup: (groupId: string, name: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  setGroupPage: (page: number) => void;
  selectActiveGroup: (groupId: string) => void;
};

const GroupContext = createContext<GroupContextValue | undefined>(undefined);

export function GroupProvider({ children }: PropsWithChildren) {
  const { token, loggedIn } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState('');
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [groupPage, setGroupPage] = useState(1);
  const groupPageSize = 4;
  const [groupTotal, setGroupTotal] = useState(0);
  const fetchGroups = useCallback(async (page = groupPage) => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    setGroupsError('');
    setGroupsLoading(true);
    try {
      const data = await fetchGroupsRequest(token, page, groupPageSize);
      setGroups(data.items);
      setGroupTotal(data.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load groups';
      setGroupsError(message);
      throw err;
    } finally {
      setGroupsLoading(false);
    }
  }, [token, groupPage, groupPageSize]);

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
      setGroupTotal(0);
      setGroupsError('');
      setGroupsLoading(false);
      setActiveGroupId(null);
      setGroupPage(1);
      return;
    }
    setActiveGroupId(null);
  }, [loggedIn]);

  useEffect(() => {
    if (!groups.length) {
      setActiveGroupId(null);
      return;
    }
    if (
      !activeGroupId ||
      !groups.some((group) => group.id === activeGroupId)
    ) {
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
      groupPage,
      groupPageSize,
      groupTotal,
      fetchGroups,
      createGroup,
      updateGroup,
      deleteGroup,
      setGroupPage,
      selectActiveGroup,
    }),
    [
      groups,
      groupsLoading,
      groupsError,
      activeGroupId,
      groupPage,
      groupPageSize,
      groupTotal,
      fetchGroups,
      createGroup,
      updateGroup,
      deleteGroup,
      setGroupPage,
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

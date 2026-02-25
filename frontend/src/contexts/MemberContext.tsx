import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { addGroupMember, fetchGroupMembers, removeGroupMember } from '../api';
import type { GroupMember } from '../types';
import { useAuth } from './AuthContext';

type MemberContextValue = {
  members: GroupMember[];
  membersLoading: boolean;
  membersError: string;
  memberPage: number;
  memberPageSize: number;
  memberTotal: number;
  setMemberPage: (page: number) => void;
  memberEmailById: Map<string, string>;
  formatMemberLabel: (memberId: string) => string;
  fetchMembers: (groupId: string, page?: number) => Promise<void>;
  addMember: (groupId: string, email: string) => Promise<void>;
  removeMember: (groupId: string, userId: string) => Promise<void>;
};

const MemberContext = createContext<MemberContextValue | undefined>(undefined);

export function MemberProvider({ children }: PropsWithChildren) {
  const { token, loggedIn } = useAuth();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState('');
  const [memberPage, setMemberPage] = useState(1);
  const memberPageSize = 4;
  const [memberTotal, setMemberTotal] = useState(0);

  const memberEmailById = useMemo(
    () => new Map(members.map((member) => [member.id, member.email])),
    [members],
  );

  const formatMemberLabel = useCallback(
    (memberId: string) => memberEmailById.get(memberId) ?? memberId,
    [memberEmailById],
  );

  const fetchMembers = useCallback(async (groupId: string, page = memberPage) => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    setMembersError('');
    setMembersLoading(true);
    try {
      const data = await fetchGroupMembers(token, groupId, page, memberPageSize);
      setMembers(data.members);
      setMemberTotal(data.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load members';
      setMembersError(message);
      throw err;
    } finally {
      setMembersLoading(false);
    }
  }, [token, memberPage, memberPageSize]);

  const addMember = useCallback(async (groupId: string, email: string) => {
    if (!token || !groupId || !email) {
      throw new Error('Invalid member email');
    }
    try {
      await addGroupMember(token, groupId, email);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add member');
    }
  }, [token]);

  const removeMember = useCallback(async (groupId: string, userId: string) => {
    if (!token || !groupId || !userId) {
      throw new Error('Invalid member');
    }
    try {
      await removeGroupMember(token, groupId, userId);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to remove member');
    }
  }, [token]);

  useEffect(() => {
    if (!loggedIn) {
      setMembers([]);
      setMembersError('');
      setMembersLoading(false);
      setMemberPage(1);
      setMemberTotal(0);
    }
  }, [loggedIn]);

  const value = useMemo(
    () => ({
      members,
      membersLoading,
      membersError,
      memberPage,
      memberPageSize,
      memberTotal,
      setMemberPage,
      memberEmailById,
      formatMemberLabel,
      fetchMembers,
      addMember,
      removeMember,
    }),
    [
      members,
      membersLoading,
      membersError,
      memberPage,
      memberPageSize,
      memberTotal,
      setMemberPage,
      memberEmailById,
      formatMemberLabel,
      fetchMembers,
      addMember,
      removeMember,
    ],
  );

  return <MemberContext.Provider value={value}>{children}</MemberContext.Provider>;
}

export function useMembers() {
  const context = useContext(MemberContext);
  if (!context) {
    throw new Error('useMembers must be used within a MemberProvider');
  }
  return context;
}

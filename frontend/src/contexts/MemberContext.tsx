import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { addGroupMember, fetchGroupMembers } from '../api';
import type { GroupMember } from '../types';
import { useAuth } from './AuthContext';

type MemberContextValue = {
  members: GroupMember[];
  membersLoading: boolean;
  membersError: string;
  memberEmailById: Map<string, string>;
  formatMemberLabel: (memberId: string) => string;
  loadMembers: (groupId: string) => Promise<void>;
  addMember: (groupId: string, email: string) => Promise<void>;
  resetMembers: () => void;
};

const MemberContext = createContext<MemberContextValue | undefined>(undefined);

export function MemberProvider({ children }: PropsWithChildren) {
  const { token, loggedIn } = useAuth();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState('');

  const memberEmailById = useMemo(
    () => new Map(members.map((member) => [member.id, member.email])),
    [members],
  );

  const formatMemberLabel = (memberId: string) => memberEmailById.get(memberId) ?? memberId;

  const loadMembers = async (groupId: string) => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    setMembersError('');
    setMembersLoading(true);
    try {
      const data = await fetchGroupMembers(token, groupId);
      setMembers(data.members);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load members';
      setMembersError(message);
      throw err;
    } finally {
      setMembersLoading(false);
    }
  };

  const addMember = async (groupId: string, email: string) => {
    if (!token || !groupId || !email) {
      throw new Error('Invalid member email');
    }

    setMembersError('');
    try {
      await addGroupMember(token, groupId, email);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add member';
      setMembersError(message);
      throw err;
    }
  };

  const resetMembers = () => {
    setMembers([]);
    setMembersError('');
    setMembersLoading(false);
  };

  useEffect(() => {
    if (!loggedIn) {
      resetMembers();
    }
  }, [loggedIn]);

  const value = useMemo(
    () => ({
      members,
      membersLoading,
      membersError,
      memberEmailById,
      formatMemberLabel,
      loadMembers,
      addMember,
      resetMembers,
    }),
    [members, membersLoading, membersError, memberEmailById],
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

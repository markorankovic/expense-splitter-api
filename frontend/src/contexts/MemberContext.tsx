import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  addGroupMember,
  fetchGroupMember,
  fetchGroupMembers,
  removeGroupMember,
} from '../api';
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
  ensureMemberEmails: (groupId: string, userIds: string[]) => Promise<void>;
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
  const [memberEmailById, setMemberEmailById] = useState<Map<string, string>>(new Map());
  const inFlightLookupsRef = useRef(new Set<string>());

  const formatMemberLabel = useCallback(
    (memberId: string) => memberEmailById.get(memberId) ?? memberId,
    [memberEmailById],
  );

  const ensureMemberEmails = useCallback(async (groupId: string, userIds: string[]) => {
    if (!token || !groupId || userIds.length === 0) {
      return;
    }

    const missing = userIds.filter((userId) => !memberEmailById.has(userId));
    if (missing.length === 0) {
      return;
    }

    await Promise.all(
      missing.map(async (userId) => {
        const key = `${groupId}:${userId}`;
        if (inFlightLookupsRef.current.has(key)) {
          return;
        }

        inFlightLookupsRef.current.add(key);
        try {
          const member = await fetchGroupMember(token, groupId, userId);
          setMemberEmailById((prev) => {
            const next = new Map(prev);
            next.set(member.id, member.email);
            return next;
          });
        } catch {
          // Ignore not-found/membership races and keep fallback label.
        } finally {
          inFlightLookupsRef.current.delete(key);
        }
      }),
    );
  }, [token, memberEmailById]);

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
      setMemberEmailById((prev) => {
        const next = new Map(prev);
        data.members.forEach((member) => {
          next.set(member.id, member.email);
        });
        return next;
      });
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
      setMemberEmailById(new Map());
      inFlightLookupsRef.current.clear();
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
      ensureMemberEmails,
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
      ensureMemberEmails,
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

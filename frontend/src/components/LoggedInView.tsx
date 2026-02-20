import { useEffect, useState } from 'react';
import type {
  BalancesResponse,
  Expense,
  Group,
  GroupMember,
  SettleResponse,
} from '../types';
import { BalancesPanel } from './BalancesPanel';
import { ExpensesPanel } from './ExpensesPanel';
import { GroupsPanel } from './GroupsPanel';
import { MembersPanel } from './MembersPanel';

type LoggedInViewProps = {
  meId: string | null;
  meEmail: string | null;
  groups: Group[];
  members: GroupMember[];
  expenses: Expense[];
  balances: BalancesResponse | null;
  settle: SettleResponse | null;
  onLoadGroups: () => Promise<void>;
  onLoadMembers: (groupId: string) => Promise<void>;
  onLoadExpenses: (groupId: string) => Promise<void>;
  onLoadBalancesAndSettle: (groupId: string) => Promise<void>;
  onCreateGroup: (name: string) => Promise<void>;
  onAddMember: (groupId: string, email: string) => Promise<void>;
  onCreateExpense: (
    groupId: string,
    description: string,
    amountInput: string,
    meId: string,
    members: GroupMember[],
  ) => Promise<void>;
  formatMemberLabel: (memberId: string) => string;
  onLogout: () => void;
};

export function LoggedInView({
  meId,
  meEmail,
  groups,
  members,
  expenses,
  balances,
  settle,
  onLoadGroups,
  onLoadMembers,
  onLoadExpenses,
  onLoadBalancesAndSettle,
  onCreateGroup,
  onAddMember,
  onCreateExpense,
  formatMemberLabel,
  onLogout,
}: LoggedInViewProps) {
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState('');
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState('');
  const [memberStatus, setMemberStatus] = useState('');
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expensesError, setExpensesError] = useState('');
  const [expenseStatus, setExpenseStatus] = useState('');
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [balancesError, setBalancesError] = useState('');

  const loadGroups = async () => {
    setGroupsError('');
    setGroupsLoading(true);
    try {
      await onLoadGroups();
    } catch (err) {
      setGroupsError(err instanceof Error ? err.message : 'Failed to load groups');
    } finally {
      setGroupsLoading(false);
    }
  };

  const loadMembers = async (groupId: string) => {
    setMembersError('');
    setMembersLoading(true);
    try {
      await onLoadMembers(groupId);
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setMembersLoading(false);
    }
  };

  const loadExpenses = async (groupId: string) => {
    setExpensesError('');
    setExpensesLoading(true);
    try {
      await onLoadExpenses(groupId);
    } catch (err) {
      setExpensesError(err instanceof Error ? err.message : 'Failed to load expenses');
    } finally {
      setExpensesLoading(false);
    }
  };

  const loadBalancesAndSettle = async (groupId: string) => {
    setBalancesError('');
    setBalancesLoading(true);
    try {
      await onLoadBalancesAndSettle(groupId);
    } catch (err) {
      setBalancesError(err instanceof Error ? err.message : 'Failed to load balances');
    } finally {
      setBalancesLoading(false);
    }
  };

  useEffect(() => {
    void loadGroups();
  }, []);

  useEffect(() => {
    if (!activeGroupId && groups.length > 0) {
      setActiveGroupId(groups[0].id);
    }
  }, [activeGroupId, groups]);

  useEffect(() => {
    if (!activeGroupId) {
      return;
    }
    void loadMembers(activeGroupId);
    void loadExpenses(activeGroupId);
    void loadBalancesAndSettle(activeGroupId);
  }, [activeGroupId]);

  const handleCreateGroup = async (name: string) => {
    try {
      await onCreateGroup(name);
      await loadGroups();
      return true;
    } catch (err) {
      setGroupsError(err instanceof Error ? err.message : 'Failed to create group');
      return false;
    }
  };

  const handleAddMember = async (email: string) => {
    if (!activeGroupId) {
      return false;
    }
    setMemberStatus('');
    try {
      await onAddMember(activeGroupId, email);
      setMemberStatus('Member added.');
      await loadMembers(activeGroupId);
      await loadBalancesAndSettle(activeGroupId);
      return true;
    } catch (err) {
      setMemberStatus(err instanceof Error ? err.message : 'Failed to add member');
      return false;
    }
  };

  const handleCreateExpense = async (description: string, amountInput: string) => {
    if (!activeGroupId || !meId) {
      return false;
    }
    try {
      await onCreateExpense(activeGroupId, description, amountInput, meId, members);
      setExpenseStatus('Expense added.');
      await loadExpenses(activeGroupId);
      await loadBalancesAndSettle(activeGroupId);
      return true;
    } catch (err) {
      setExpenseStatus(err instanceof Error ? err.message : 'Failed to add expense');
      return false;
    }
  };

  return (
    <div className="logged-in">
      <p className="success">Logged in{meEmail ? ` as ${meEmail}` : ''}</p>

      <GroupsPanel
        groups={groups}
        groupsLoading={groupsLoading}
        groupsError={groupsError}
        activeGroupId={activeGroupId}
        onCreateGroup={handleCreateGroup}
        onSelectGroup={setActiveGroupId}
      />

      {activeGroupId ? (
        <MembersPanel
          memberStatus={memberStatus}
          membersError={membersError}
          membersLoading={membersLoading}
          members={members}
          onAddMember={handleAddMember}
        />
      ) : null}

      {activeGroupId ? (
        <ExpensesPanel
          expenseStatus={expenseStatus}
          expensesError={expensesError}
          expensesLoading={expensesLoading}
          expenses={expenses}
          membersLoading={membersLoading}
          members={members}
          onCreateExpense={handleCreateExpense}
          formatMemberLabel={formatMemberLabel}
        />
      ) : null}

      {activeGroupId ? (
        <BalancesPanel
          balancesLoading={balancesLoading}
          balancesError={balancesError}
          balances={balances}
          settle={settle}
          onRefresh={() => {
            if (!activeGroupId) {
              return;
            }
            void loadBalancesAndSettle(activeGroupId);
          }}
          formatMemberLabel={formatMemberLabel}
        />
      ) : null}

      <div className="logout-card">
        <button type="button" onClick={onLogout} className="button ghost">
          Log out
        </button>
      </div>
    </div>
  );
}

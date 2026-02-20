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
  groupsLoading: boolean;
  groupsError: string;
  members: GroupMember[];
  membersLoading: boolean;
  membersError: string;
  expenses: Expense[];
  expensesLoading: boolean;
  expensesError: string;
  expenseStatus: string;
  balances: BalancesResponse | null;
  settle: SettleResponse | null;
  balancesLoading: boolean;
  balancesError: string;
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
  groupsLoading,
  groupsError,
  members,
  membersLoading,
  membersError,
  expenses,
  expensesLoading,
  expensesError,
  expenseStatus,
  balances,
  settle,
  balancesLoading,
  balancesError,
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
  const [memberStatus, setMemberStatus] = useState('');

  useEffect(() => {
    void onLoadGroups().catch(() => {});
  }, [onLoadGroups]);

  useEffect(() => {
    if (!activeGroupId && groups.length > 0) {
      setActiveGroupId(groups[0].id);
    }
  }, [activeGroupId, groups]);

  useEffect(() => {
    if (!activeGroupId) {
      return;
    }

    void onLoadMembers(activeGroupId).catch(() => {});
    void onLoadExpenses(activeGroupId).catch(() => {});
    void onLoadBalancesAndSettle(activeGroupId).catch(() => {});
  }, [activeGroupId, onLoadMembers, onLoadExpenses, onLoadBalancesAndSettle]);

  const handleCreateGroup = async (name: string) => {
    try {
      await onCreateGroup(name);
      await onLoadGroups();
      return true;
    } catch {
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
      await onLoadMembers(activeGroupId);
      await onLoadBalancesAndSettle(activeGroupId);
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
      await onLoadExpenses(activeGroupId);
      await onLoadBalancesAndSettle(activeGroupId);
      return true;
    } catch {
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
            void onLoadBalancesAndSettle(activeGroupId).catch(() => {});
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

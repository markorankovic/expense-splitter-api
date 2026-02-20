import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBalancesAndSettle } from '../contexts/BalancesAndSettleContext';
import { useExpenses } from '../contexts/ExpenseContext';
import { useGroups } from '../contexts/GroupContext';
import { useMembers } from '../contexts/MemberContext';
import { useMe } from '../contexts/MeContext';
import { BalancesPanel } from './BalancesPanel';
import { ExpensesPanel } from './ExpensesPanel';
import { GroupsPanel } from './GroupsPanel';
import { MembersPanel } from './MembersPanel';

export function LoggedInView() {
  const { logout } = useAuth();
  const { meId, meEmail } = useMe();
  const { groups, groupsLoading, groupsError, fetchGroups, createGroup } = useGroups();
  const { members, membersLoading, membersError, formatMemberLabel, fetchMembers, addMember } =
    useMembers();
  const { expenses, expensesLoading, expensesError, expenseStatus, fetchExpenses, createExpense } =
    useExpenses();
  const {
    balances,
    settle,
    balancesLoading,
    balancesError,
    fetchBalancesAndSettle,
  } = useBalancesAndSettle();

  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [memberStatus, setMemberStatus] = useState('');

  useEffect(() => {
    void fetchGroups().catch(() => {});
  }, [fetchGroups]);

  useEffect(() => {
    if (!groups.length) {
      setActiveGroupId(null);
      return;
    }

    if (!activeGroupId || !groups.some((group) => group.id === activeGroupId)) {
      setActiveGroupId(groups[0].id);
    }
  }, [activeGroupId, groups]);

  useEffect(() => {
    if (!activeGroupId) {
      return;
    }

    void fetchMembers(activeGroupId).catch(() => {});
    void fetchExpenses(activeGroupId).catch(() => {});
    void fetchBalancesAndSettle(activeGroupId).catch(() => {});
  }, [activeGroupId, fetchMembers, fetchExpenses, fetchBalancesAndSettle]);

  const handleCreateGroup = async (name: string) => {
    try {
      await createGroup(name);
      await fetchGroups();
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
      await addMember(activeGroupId, email);
      setMemberStatus('Member added.');
      await fetchMembers(activeGroupId);
      await fetchBalancesAndSettle(activeGroupId);
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
      await createExpense(activeGroupId, description, amountInput, meId, members);
      await fetchExpenses(activeGroupId);
      await fetchBalancesAndSettle(activeGroupId);
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
            void fetchBalancesAndSettle(activeGroupId).catch(() => {});
          }}
          formatMemberLabel={formatMemberLabel}
        />
      ) : null}

      <div className="logout-card">
        <button type="button" onClick={logout} className="button ghost">
          Log out
        </button>
      </div>
    </div>
  );
}

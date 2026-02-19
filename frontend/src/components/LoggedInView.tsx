import type { SubmitEvent } from 'react';
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
  meEmail: string | null;
  groups: Group[];
  groupsLoading: boolean;
  groupsError: string;
  groupName: string;
  activeGroupId: string | null;
  onGroupNameChange: (value: string) => void;
  onCreateGroup: (event: SubmitEvent<HTMLFormElement>) => void;
  onSelectGroup: (groupId: string) => void;
  memberEmail: string;
  memberStatus: string;
  membersError: string;
  membersLoading: boolean;
  members: GroupMember[];
  onMemberEmailChange: (value: string) => void;
  onAddMember: (event: SubmitEvent<HTMLFormElement>) => void;
  expenseDescription: string;
  expenseAmount: string;
  expenseStatus: string;
  expensesError: string;
  expensesLoading: boolean;
  expenses: Expense[];
  onExpenseDescriptionChange: (value: string) => void;
  onExpenseAmountChange: (value: string) => void;
  onCreateExpense: (event: SubmitEvent<HTMLFormElement>) => void;
  balancesLoading: boolean;
  balancesError: string;
  balances: BalancesResponse | null;
  settle: SettleResponse | null;
  onRefreshBalances: () => void;
  formatMemberLabel: (memberId: string) => string;
  onLogout: () => void;
};

export function LoggedInView({
  meEmail,
  groups,
  groupsLoading,
  groupsError,
  groupName,
  activeGroupId,
  onGroupNameChange,
  onCreateGroup,
  onSelectGroup,
  memberEmail,
  memberStatus,
  membersError,
  membersLoading,
  members,
  onMemberEmailChange,
  onAddMember,
  expenseDescription,
  expenseAmount,
  expenseStatus,
  expensesError,
  expensesLoading,
  expenses,
  onExpenseDescriptionChange,
  onExpenseAmountChange,
  onCreateExpense,
  balancesLoading,
  balancesError,
  balances,
  settle,
  onRefreshBalances,
  formatMemberLabel,
  onLogout,
}: LoggedInViewProps) {
  return (
    <div className="logged-in">
      <p className="success">Logged in{meEmail ? ` as ${meEmail}` : ''}</p>

      <GroupsPanel
        groups={groups}
        groupsLoading={groupsLoading}
        groupsError={groupsError}
        groupName={groupName}
        activeGroupId={activeGroupId}
        onGroupNameChange={onGroupNameChange}
        onCreateGroup={onCreateGroup}
        onSelectGroup={onSelectGroup}
      />

      {activeGroupId ? (
        <MembersPanel
          memberEmail={memberEmail}
          memberStatus={memberStatus}
          membersError={membersError}
          membersLoading={membersLoading}
          members={members}
          onMemberEmailChange={onMemberEmailChange}
          onAddMember={onAddMember}
        />
      ) : null}

      {activeGroupId ? (
        <ExpensesPanel
          expenseDescription={expenseDescription}
          expenseAmount={expenseAmount}
          expenseStatus={expenseStatus}
          expensesError={expensesError}
          expensesLoading={expensesLoading}
          expenses={expenses}
          membersLoading={membersLoading}
          members={members}
          onExpenseDescriptionChange={onExpenseDescriptionChange}
          onExpenseAmountChange={onExpenseAmountChange}
          onCreateExpense={onCreateExpense}
          formatMemberLabel={formatMemberLabel}
        />
      ) : null}

      {activeGroupId ? (
        <BalancesPanel
          balancesLoading={balancesLoading}
          balancesError={balancesError}
          balances={balances}
          settle={settle}
          onRefresh={onRefreshBalances}
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

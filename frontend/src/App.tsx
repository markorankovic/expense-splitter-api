import './App.css';
import { LoggedInView } from './components/LoggedInView';
import { LoginRegisterForm } from './components/LoginRegisterForm';
import { useAuth } from './contexts/AuthContext';
import { useBalancesAndSettle } from './contexts/BalancesAndSettleContext';
import { useExpenses } from './contexts/ExpenseContext';
import { useGroups } from './contexts/GroupContext';
import { useMembers } from './contexts/MemberContext';
import { useMe } from './contexts/MeContext';

export default function App() {
  const { loading, error, loggedIn, registerStatus, login, register, logout } = useAuth();
  const { meId, meEmail } = useMe();
  const { groups, groupsLoading, groupsError, fetchGroups, createGroup } = useGroups();
  const { members, membersLoading, membersError, formatMemberLabel, fetchMembers, addMember } =
    useMembers();
  const {
    balances,
    settle,
    balancesLoading,
    balancesError,
    fetchBalancesAndSettle,
  } = useBalancesAndSettle();
  const {
    expenses,
    expensesLoading,
    expensesError,
    expenseStatus,
    fetchExpenses,
    createExpense,
  } =
    useExpenses();

  return (
    <main className="page">
      <section className="card">
        <h1 className="title">Expense Splitter</h1>

        {loggedIn ? (
          <LoggedInView
            meId={meId}
            meEmail={meEmail}
            groups={groups}
            groupsLoading={groupsLoading}
            groupsError={groupsError}
            members={members}
            membersLoading={membersLoading}
            membersError={membersError}
            expenses={expenses}
            expensesLoading={expensesLoading}
            expensesError={expensesError}
            expenseStatus={expenseStatus}
            balances={balances}
            settle={settle}
            balancesLoading={balancesLoading}
            balancesError={balancesError}
            onLoadGroups={fetchGroups}
            onLoadMembers={fetchMembers}
            onLoadExpenses={fetchExpenses}
            onLoadBalancesAndSettle={fetchBalancesAndSettle}
            onCreateGroup={createGroup}
            onAddMember={addMember}
            onCreateExpense={createExpense}
            formatMemberLabel={formatMemberLabel}
            onLogout={logout}
          />
        ) : (
          <LoginRegisterForm
            loading={loading}
            error={error}
            registerStatus={registerStatus}
            onLogin={login}
            onRegister={register}
          />
        )}
      </section>
    </main>
  );
}

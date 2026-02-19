import { useEffect, useMemo, useState, type SubmitEvent } from 'react';
import './App.css';
import {
  addGroupMember,
  createExpense as createExpenseRequest,
  createGroup as createGroupRequest,
  fetchExpenses as fetchExpensesRequest,
  fetchGroupBalances,
  fetchGroupMembers,
  fetchGroups as fetchGroupsRequest,
  fetchGroupSettle,
  fetchMe as fetchMeRequest,
  login as loginRequest,
  register as registerRequest,
} from './api';
import {
  type BalancesResponse,
  type Expense,
  type Group,
  type GroupMember,
  type RegisterStatus,
  type SettleResponse,
} from './types';
import { GroupsPanel } from './components/GroupsPanel';
import { LoginRegisterForm } from './components/LoginRegisterForm';
import { MembersPanel } from './components/MembersPanel';
import { formatMoney, gbpToPence } from './utils/money';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loggedIn, setLoggedIn] = useState(
    () => Boolean(localStorage.getItem('accessToken')),
  );
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState('');
  const [groupName, setGroupName] = useState('');
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [meId, setMeId] = useState<string | null>(null);
  const [meEmail, setMeEmail] = useState<string | null>(null);
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseStatus, setExpenseStatus] = useState('');
  const [registerStatus, setRegisterStatus] = useState<RegisterStatus | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberStatus, setMemberStatus] = useState('');
  const [balances, setBalances] = useState<BalancesResponse | null>(null);
  const [settle, setSettle] = useState<SettleResponse | null>(null);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [balancesError, setBalancesError] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expensesError, setExpensesError] = useState('');
  const memberEmailById = useMemo(
    () => new Map(members.map((member) => [member.id, member.email])),
    [members],
  );

  const token = localStorage.getItem('accessToken') ?? '';
  const formatMemberLabel = (memberId: string) =>
    memberEmailById.get(memberId) ?? memberId;

  // TODO: Should consider maybe abstracting the fetch logic into a common function to reduce repetition.

  const fetchMe = async () => {
    if (!token) {
      return;
    }
    try {
      const response = await fetchMeRequest(token);
      if (!response.ok) {
        const message = await response.json().catch(() => null);
        console.error('Failed to load current user', message?.message ?? response.status);
        return;
      }
      const data = await response.json();
      setMeId(data.id);
      setMeEmail(data.email);
    } catch (err) {
      console.error('Failed to load current user', err);
      setMeId(null);
      setMeEmail(null);
    }
  };

  const fetchGroups = async () => {
    if (!token) {
      return;
    }
    setGroupsError('');
    setGroupsLoading(true);
    try {
      // TODO: Might need to implement frontend pagination if there are lots of groups, but for now just get the first 50.
      const data = await fetchGroupsRequest(token, 1, 50);
      setGroups(data.items);
    } catch (err) {
      setGroupsError(err instanceof Error ? err.message : 'Failed to load groups');
    } finally {
      setGroupsLoading(false);
    }
  };

  const fetchMembers = async (groupId: string) => {
    if (!token) {
      return;
    }
    setMembersError('');
    setMembersLoading(true);
    try {
      const data = await fetchGroupMembers(token, groupId);
      setMembers(data.members);
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : 'Failed to load members');
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  // TODO: Maybe this should only fetch the settle and the settle data has the balances data in it as well to avoid needing to make two separate requests and keep them in sync?
  const fetchBalancesAndSettle = async (groupId: string) => {
    if (!token) {
      return;
    }
    setBalancesError('');
    setBalancesLoading(true);
    try {
      const [balancesData, settleData] = await Promise.all([
        fetchGroupBalances(token, groupId),
        fetchGroupSettle(token, groupId),
      ]);
      setBalances(balancesData);
      setSettle(settleData);
    } catch (err) {
      setBalancesError(
        err instanceof Error ? err.message : 'Failed to load balances',
      );
      setBalances(null);
      setSettle(null);
    } finally {
      setBalancesLoading(false);
    }
  };

  const fetchExpenses = async (groupId: string) => {
    if (!token) {
      return;
    }
    setExpensesError('');
    setExpensesLoading(true);
    try {
      const data = await fetchExpensesRequest(token, groupId, 1, 50);
      setExpenses(data.items);
    } catch (err) {
      setExpensesError(
        err instanceof Error ? err.message : 'Failed to load expenses',
      );
      setExpenses([]);
    } finally {
      setExpensesLoading(false);
    }
  };

  useEffect(() => {
    if (loggedIn) {
      fetchMe();
      fetchGroups();
    } else {
      setGroups([]);
      setActiveGroupId(null);
      setMeId(null);
      setMeEmail(null);
      setMembers([]);
      setBalances(null);
      setSettle(null);
      setExpenses([]);
    }
  }, [loggedIn]);

  useEffect(() => {
    if (activeGroupId) {
      fetchMembers(activeGroupId);
      fetchBalancesAndSettle(activeGroupId);
      fetchExpenses(activeGroupId);
    } else {
      setMembers([]);
      setBalances(null);
      setSettle(null);
      setExpenses([]);
    }
  }, [activeGroupId]);

  useEffect(() => {
    if (!activeGroupId && groups.length > 0) {
      setActiveGroupId(groups[0].id);
    }
  }, [activeGroupId, groups]);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setRegisterStatus(null);
    setLoading(true);

    try {
      const data = await loginRequest(email, password);
      localStorage.setItem('accessToken', data.accessToken);
      setLoggedIn(true);
      setEmail('');
      setPassword('');
      setExpenseStatus('');
      setRegisterStatus(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password) {
      setRegisterStatus({
        kind: 'error',
        message: 'Email and password are required.',
      });
      return;
    }
    setError('');
    setRegisterStatus(null);
    try {
      await registerRequest(email, password);
      setRegisterStatus({
        kind: 'success',
        message: 'Registered. You can now log in.',
      });
    } catch (err) {
      setRegisterStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Registration failed',
      });
    }
  };

  const handleCreateGroup = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !groupName.trim()) {
      return;
    }
    setGroupsError('');
    try {
      await createGroupRequest(token, groupName.trim());
      setGroupName('');
      await fetchGroups();
    } catch (err) {
      setGroupsError(err instanceof Error ? err.message : 'Failed to create group');
    }
  };

  const handleAddMember = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !activeGroupId || !memberEmail.trim()) {
      return;
    }
    setMemberStatus('');
    try {
      await addGroupMember(token, activeGroupId, memberEmail.trim());
      setMemberEmail('');
      setMemberStatus('Member added.');
      // TODO: Can we not avoid having to re-fetch all the members after adding a new one?
      await fetchMembers(activeGroupId);
      await fetchBalancesAndSettle(activeGroupId);
    } catch (err) {
      setMemberStatus(err instanceof Error ? err.message : 'Failed to add member');
    }
  };

  const handleCreateExpense = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !activeGroupId || !meId || members.length === 0) {
      return;
    }
    const pence = gbpToPence(expenseAmount);
    if (!pence) {
      setExpenseStatus('Enter a valid amount (e.g. 12.34).');
      return;
    }
    const base = Math.floor(pence / members.length);
    const remainder = pence % members.length;
    const splits = members.map((member, index) => ({
      userId: member.id,
      amount: index < remainder ? base + 1 : base,
    }));
    setExpenseStatus('');
    try {
      await createExpenseRequest(token, activeGroupId, {
        description: expenseDescription.trim(),
        amount: pence,
        paidByUserId: meId,
        splits,
      });
      setExpenseDescription('');
      setExpenseAmount('');
      setExpenseStatus('Expense added.');
      await fetchExpenses(activeGroupId);
      await fetchBalancesAndSettle(activeGroupId);
    } catch (err) {
      setExpenseStatus(
        err instanceof Error ? err.message : 'Failed to add expense',
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setLoggedIn(false);
    setEmail('');
    setPassword('');
    setGroupName('');
    setGroupsError('');
    setExpenseDescription('');
    setExpenseAmount('');
    setExpenseStatus('');
    setMembers([]);
    setMembersError('');
    setMemberEmail('');
    setMemberStatus('');
    setBalances(null);
    setSettle(null);
    setBalancesError('');
    setMeEmail(null);
    setExpenses([]);
    setExpensesError('');
  };

  return (
    <main className="page">
      <section className="card">
        <h1 className="title">Expense Splitter</h1>

        {loggedIn ? (
          <div className="logged-in">
            <p className="success">
              Logged in{meEmail ? ` as ${meEmail}` : ''}
            </p>

            <GroupsPanel
              groups={groups}
              groupsLoading={groupsLoading}
              groupsError={groupsError}
              groupName={groupName}
              activeGroupId={activeGroupId}
              onGroupNameChange={setGroupName}
              onCreateGroup={handleCreateGroup}
              onSelectGroup={setActiveGroupId}
            />

            {activeGroupId ? (
              <MembersPanel
                memberEmail={memberEmail}
                memberStatus={memberStatus}
                membersError={membersError}
                membersLoading={membersLoading}
                members={members}
                onMemberEmailChange={setMemberEmail}
                onAddMember={handleAddMember}
              />
            ) : null}

            {activeGroupId ? (
              <div className="expense-card">
                <h2 className="subtitle">Expenses</h2>
                <form onSubmit={handleCreateExpense} className="form">
                  <label className="label">
                    Description
                    <input
                      className="input"
                      type="text"
                      value={expenseDescription}
                      onChange={(event) => setExpenseDescription(event.target.value)}
                      placeholder="Dinner"
                      required
                    />
                  </label>
                  <label className="label">
                    Amount (£)
                    <input
                      className="input"
                      type="text"
                      value={expenseAmount}
                      onChange={(event) => setExpenseAmount(event.target.value)}
                      placeholder="12.34"
                      required
                    />
                  </label>
                  {expenseStatus ? (
                    <p className={expenseStatus === 'Expense added.' ? 'success' : 'error'}>
                      {expenseStatus}
                    </p>
                  ) : null}
                  <button
                    className="button"
                    type="submit"
                    disabled={membersLoading || members.length === 0}
                  >
                    Add expense
                  </button>
                </form>
                {expensesError ? <p className="error">{expensesError}</p> : null}
                {expensesLoading ? (
                  <p className="muted">Loading expenses...</p>
                ) : expenses.length === 0 ? (
                  <p className="muted">No expenses yet.</p>
                ) : (
                  <ul className="expenses-list">
                    {expenses.map((expense) => (
                      <li key={expense.id}>
                        <div>
                          <p className="expense-name">{expense.description}</p>
                          <p className="muted">
                            Paid by {formatMemberLabel(expense.paidByUserId)}
                          </p>
                        </div>
                        <span>{formatMoney(expense.amount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}

            {activeGroupId ? (
              <div className="balances-card">
                <div className="balances-header">
                  <h2 className="subtitle">Balances</h2>
                  <button
                    type="button"
                    className="button ghost"
                    onClick={() => fetchBalancesAndSettle(activeGroupId)}
                    disabled={balancesLoading}
                  >
                    Refresh
                  </button>
                </div>
                {balancesError ? <p className="error">{balancesError}</p> : null}
                {balances ? (
                  <ul className="balances-list">
                    {balances.balances.filter((entry) => entry.balance !== 0).length ===
                    0 ? (
                      <li className="muted">No balances yet.</li>
                    ) : (
                      balances.balances
                        .filter((entry) => entry.balance !== 0)
                        .map((entry) => (
                          <li key={entry.userId}>
                            <span>{formatMemberLabel(entry.userId)}</span>
                            <span>{formatMoney(entry.balance)}</span>
                          </li>
                        ))
                    )}
                  </ul>
                ) : (
                  <p className="muted">No balances yet.</p>
                )}

                <h2 className="subtitle">Settle</h2>
                {settle ? (
                  <ul className="balances-list">
                    {settle.transfers.length === 0 ? (
                      <li className="muted">No transfers needed.</li>
                    ) : (
                      settle.transfers.map((transfer, index) => (
                        <li key={`${transfer.fromUserId}-${transfer.toUserId}-${index}`}>
                          <span>
                            {formatMemberLabel(transfer.fromUserId)} →{' '}
                            {formatMemberLabel(transfer.toUserId)}
                          </span>
                          <span>{formatMoney(transfer.amount)}</span>
                        </li>
                      ))
                    )}
                  </ul>
                ) : (
                  <p className="muted">No settlements yet.</p>
                )}
              </div>
            ) : null}

            <div className="logout-card">
              <button type="button" onClick={handleLogout} className="button ghost">
                Log out
              </button>
            </div>
          </div>
        ) : (
          <LoginRegisterForm
            email={email}
            password={password}
            loading={loading}
            error={error}
            registerStatus={registerStatus}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onLogin={handleSubmit}
            onRegister={handleRegister}
          />
        )}
      </section>
    </main>
  );
}

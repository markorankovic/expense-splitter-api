import { useEffect, useMemo, useState, type SubmitEvent } from 'react';
import './App.css';

type LoginResponse = {
  accessToken: string;
};

type Group = {
  id: string;
  name: string;
  createdAt: string;
  ownerId: string;
};

type GroupsResponse = {
  items: Group[];
  page: number;
  pageSize: number;
  total: number;
};

type MeResponse = {
  id: string;
  email: string;
};

type GroupMember = {
  id: string;
  email: string;
};

type GroupDetailsResponse = Group & {
  members: GroupMember[];
};

type BalancesResponse = {
  groupId: string;
  balances: { userId: string; balance: number }[];
};

type SettleResponse = {
  groupId: string;
  transfers: { fromUserId: string; toUserId: string; amount: number }[];
};

type Expense = {
  id: string;
  description: string;
  amount: number;
  paidByUserId: string;
  createdAt: string;
};

type ExpensesResponse = {
  items: Expense[];
  page: number;
  pageSize: number;
  total: number;
};

type RegisterStatus = {
  kind: 'success' | 'error';
  message: string;
};

const gbpToPence = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return null;
  }
  const [whole, fraction = ''] = trimmed.split('.');
  const normalizedFraction = fraction.padEnd(2, '0');
  const pence = Number(whole) * 100 + Number(normalizedFraction);
  return Number.isFinite(pence) && pence > 0 ? pence : null;
};

const formatMoney = (pence: number) => {
  const sign = pence < 0 ? '-' : '';
  const abs = Math.abs(pence);
  const pounds = Math.floor(abs / 100);
  const pennies = String(abs % 100).padStart(2, '0');
  return `${sign}£${pounds}.${pennies}`;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

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
      const response = await fetch(`${API_BASE_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const message = await response.json().catch(() => null);
        console.error('Failed to load current user', message?.message ?? response.status);
        return;
      }
      const data: MeResponse = await response.json();
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
      const response = await fetch(`${API_BASE_URL}/groups?page=1&pageSize=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const message = await response.json().catch(() => null);
        throw new Error(message?.message ?? 'Failed to load groups');
      }

      const data: GroupsResponse = await response.json();
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
      const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const message = await response.json().catch(() => null);
        throw new Error(message?.message ?? 'Failed to load members');
      }
      const data: GroupDetailsResponse = await response.json();
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
      const [balancesResponse, settleResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/groups/${groupId}/balances`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/groups/${groupId}/settle`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!balancesResponse.ok || !settleResponse.ok) {
        const failedResponse = !balancesResponse.ok
          ? balancesResponse
          : settleResponse;
        const message = await failedResponse.json().catch(() => null);
        throw new Error(message?.message ?? 'Failed to load balances');
      }

      const balancesData: BalancesResponse = await balancesResponse.json();
      const settleData: SettleResponse = await settleResponse.json();
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
      const response = await fetch(
        `${API_BASE_URL}/groups/${groupId}/expenses?page=1&pageSize=50`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        const message = await response.json().catch(() => null);
        throw new Error(message?.message ?? 'Failed to load expenses');
      }

      const data: ExpensesResponse = await response.json();
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
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const message = await response.json().catch(() => null);
        throw new Error(message?.message ?? 'Login failed');
      }

      const data: LoginResponse = await response.json();
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
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const message = await response.json().catch(() => null);
        throw new Error(message?.message ?? 'Registration failed');
      }

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
      const response = await fetch(`${API_BASE_URL}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: groupName.trim() }),
      });

      if (!response.ok) {
        const message = await response.json().catch(() => null);
        throw new Error(message?.message ?? 'Failed to create group');
      }

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
      const response = await fetch(
        `${API_BASE_URL}/groups/${activeGroupId}/members`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email: memberEmail.trim() }),
        },
      );

      if (!response.ok) {
        const message = await response.json().catch(() => null);
        throw new Error(message?.message ?? 'Failed to add member');
      }

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
      const response = await fetch(
        `${API_BASE_URL}/groups/${activeGroupId}/expenses`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            description: expenseDescription.trim(),
            amount: pence,
            paidByUserId: meId,
            splits,
          }),
        },
      );

      if (!response.ok) {
        const message = await response.json().catch(() => null);
        throw new Error(message?.message ?? 'Failed to add expense');
      }

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

            <div className="groups">
              <h2 className="subtitle">Groups</h2>
              <form onSubmit={handleCreateGroup} className="form inline">
                <label className="label">
                  New group
                  <input
                    className="input"
                    type="text"
                    value={groupName}
                    onChange={(event) => setGroupName(event.target.value)}
                    placeholder="Weekend trip"
                    required
                  />
                </label>
                <button className="button" type="submit" disabled={!groupName.trim()}>
                  Create
                </button>
              </form>

              {groupsError ? <p className="error">{groupsError}</p> : null}
              {groupsLoading ? <span className="muted">Loading...</span> : null}
              {groups.length === 0 && !groupsLoading ? (
                <p className="muted">No groups yet.</p>
              ) : (
                <ul className="groups-list">
                  {groups.map((group) => (
                    <li key={group.id}>
                      <button
                        type="button"
                        className={`group-button${
                          activeGroupId === group.id ? ' active' : ''
                        }`}
                        onClick={() => setActiveGroupId(group.id)}
                      >
                        {group.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {activeGroupId ? (
              <div className="members-card">
                <h2 className="subtitle">Members</h2>
                <form onSubmit={handleAddMember} className="form inline">
                  <label className="label">
                    Email
                    <input
                      className="input"
                      type="email"
                      value={memberEmail}
                      onChange={(event) => setMemberEmail(event.target.value)}
                      placeholder="person@example.com"
                      required
                    />
                  </label>
                  <button className="button" type="submit" disabled={!memberEmail.trim()}>
                    Add
                  </button>
                </form>
                {membersError ? <p className="error">{membersError}</p> : null}
                {memberStatus ? (
                  <p className={memberStatus === 'Member added.' ? 'success' : 'error'}>
                    {memberStatus}
                  </p>
                ) : null}
                <div className="members-list">
                  {membersLoading ? (
                    <p className="muted">Loading members...</p>
                  ) : members.length === 0 ? (
                    <p className="muted">No members yet.</p>
                  ) : (
                    <ul>
                      {members.map((member) => (
                        <li key={member.id}>
                          <span className="member-email">{member.email}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
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
          <form onSubmit={handleSubmit} className="form">
            <label className="label">
              Email
              <input
                className="input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="label">
              Password
              <input
                className="input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
              />
            </label>

            {error ? <p className="error">{error}</p> : null}
            {registerStatus ? (
              <p className={registerStatus.kind === 'success' ? 'success' : 'error'}>
                {registerStatus.message}
              </p>
            ) : null}

            <button className="button" type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <button
              className="button ghost"
              type="button"
              onClick={handleRegister}
              disabled={loading}
            >
              Register
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

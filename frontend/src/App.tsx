import { useEffect, useState } from 'react';
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

const formatMemberLabel = (memberId: string, members: GroupMember[]) => {
  const match = members.find((member) => member.id === memberId);
  return match?.email ?? memberId;
};

const API_BASE_URL = 'http://localhost:3000';

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
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberStatus, setMemberStatus] = useState('');
  const [balances, setBalances] = useState<BalancesResponse | null>(null);
  const [settle, setSettle] = useState<SettleResponse | null>(null);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [balancesError, setBalancesError] = useState('');

  const token = localStorage.getItem('accessToken') ?? '';

  const fetchMe = async () => {
    if (!token) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        return;
      }
      const data: MeResponse = await response.json();
      setMeId(data.id);
      setMeEmail(data.email);
    } catch {
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
      const response = await fetch(`${API_BASE_URL}/groups?page=1&pageSize=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const message = await response.json().catch(() => null);
        throw new Error(message?.message ?? 'Failed to load groups');
      }

      const data: GroupsResponse = await response.json();
      setGroups(data.items);
      if (!activeGroupId && data.items.length > 0) {
        setActiveGroupId(data.items[0].id);
      }
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
        const message = await balancesResponse.json().catch(() => null);
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
    } finally {
      setBalancesLoading(false);
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
    }
  }, [loggedIn]);

  useEffect(() => {
    if (activeGroupId) {
      fetchMembers(activeGroupId);
      fetchBalancesAndSettle(activeGroupId);
    } else {
      setMembers([]);
      setBalances(null);
      setSettle(null);
    }
  }, [activeGroupId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (event: React.FormEvent<HTMLFormElement>) => {
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

  const handleAddMember = async (event: React.FormEvent<HTMLFormElement>) => {
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
      await fetchMembers(activeGroupId);
    } catch (err) {
      setMemberStatus(err instanceof Error ? err.message : 'Failed to add member');
    }
  };

  const handleCreateExpense = async (event: React.FormEvent<HTMLFormElement>) => {
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
                <h2 className="subtitle">Add expense</h2>
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
                            <span>{formatMemberLabel(entry.userId, members)}</span>
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
                            {formatMemberLabel(transfer.fromUserId, members)} →{' '}
                            {formatMemberLabel(transfer.toUserId, members)}
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

            <button className="button" type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

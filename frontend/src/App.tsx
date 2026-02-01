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
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseStatus, setExpenseStatus] = useState('');

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
    } catch {
      setMeId(null);
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

  useEffect(() => {
    if (loggedIn) {
      fetchMe();
      fetchGroups();
    } else {
      setGroups([]);
      setActiveGroupId(null);
      setMeId(null);
    }
  }, [loggedIn]);

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

  const handleCreateExpense = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !activeGroupId || !meId) {
      return;
    }
    const pence = gbpToPence(expenseAmount);
    if (!pence) {
      setExpenseStatus('Enter a valid amount (e.g. 12.34).');
      return;
    }
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
            splits: [{ userId: meId, amount: pence }],
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
  };

  return (
    <main className="page">
      <section className="card">
        <h1 className="title">Expense Splitter</h1>

        {loggedIn ? (
          <div className="logged-in">
            <div className="logged-in-header">
              <p className="success">Logged in</p>
              <button type="button" onClick={handleLogout} className="button ghost">
                Log out
              </button>
            </div>

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

            <div className="groups">
              <div className="groups-header">
                <h2 className="subtitle">Your groups</h2>
                {groupsLoading ? <span className="muted">Loading...</span> : null}
              </div>
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
                  <button className="button" type="submit">
                    Add expense
                  </button>
                </form>
              </div>
            ) : null}
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

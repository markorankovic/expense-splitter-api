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

  const token = localStorage.getItem('accessToken') ?? '';

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
      fetchGroups();
    } else {
      setGroups([]);
      setActiveGroupId(null);
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

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setLoggedIn(false);
    setEmail('');
    setPassword('');
    setGroupName('');
    setGroupsError('');
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

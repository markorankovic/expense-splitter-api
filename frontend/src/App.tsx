import { useEffect, useMemo, useState } from 'react';
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
import { LoginRegisterForm } from './components/LoginRegisterForm';
import { LoggedInView } from './components/LoggedInView';
import { gbpToPence } from './utils/money';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loggedIn, setLoggedIn] = useState(
    () => Boolean(localStorage.getItem('accessToken')),
  );
  const [groups, setGroups] = useState<Group[]>([]);
  const [meId, setMeId] = useState<string | null>(null);
  const [meEmail, setMeEmail] = useState<string | null>(null);
  const [registerStatus, setRegisterStatus] = useState<RegisterStatus | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [balances, setBalances] = useState<BalancesResponse | null>(null);
  const [settle, setSettle] = useState<SettleResponse | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
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
      throw new Error('Not authenticated');
    }
    // TODO: Might need to implement frontend pagination if there are lots of groups, but for now just get the first 50.
    const data = await fetchGroupsRequest(token, 1, 50);
    setGroups(data.items);
  };

  const fetchMembers = async (groupId: string) => {
    if (!token) {
      throw new Error('Not authenticated');
    }
    const data = await fetchGroupMembers(token, groupId);
    setMembers(data.members);
  };

  // TODO: Maybe this should only fetch the settle and the settle data has the balances data in it as well to avoid needing to make two separate requests and keep them in sync?
  const fetchBalancesAndSettle = async (groupId: string) => {
    if (!token) {
      throw new Error('Not authenticated');
    }
    const [balancesData, settleData] = await Promise.all([
      fetchGroupBalances(token, groupId),
      fetchGroupSettle(token, groupId),
    ]);
    setBalances(balancesData);
    setSettle(settleData);
  };

  const fetchExpenses = async (groupId: string) => {
    if (!token) {
      throw new Error('Not authenticated');
    }
    const data = await fetchExpensesRequest(token, groupId, 1, 50);
    setExpenses(data.items);
  };

  useEffect(() => {
    if (loggedIn) {
      fetchMe();
    } else {
      setGroups([]);
      setMeId(null);
      setMeEmail(null);
      setMembers([]);
      setBalances(null);
      setSettle(null);
      setExpenses([]);
    }
  }, [loggedIn]);

  const handleLogin = async (email: string, password: string) => {
    setError('');
    setRegisterStatus(null);
    setLoading(true);

    try {
      const data = await loginRequest(email, password);
      localStorage.setItem('accessToken', data.accessToken);
      setLoggedIn(true);
      setRegisterStatus(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (email: string, password: string) => {
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

  const handleCreateGroup = async (groupName: string) => {
    if (!token || !groupName) {
      throw new Error('Invalid group name');
    }
    await createGroupRequest(token, groupName);
  };

  const handleAddMember = async (groupId: string, memberEmail: string) => {
    if (!token || !groupId || !memberEmail) {
      throw new Error('Invalid member email');
    }
    await addGroupMember(token, groupId, memberEmail);
  };

  const handleCreateExpense = async (
    groupId: string,
    expenseDescription: string,
    expenseAmount: string,
    paidByUserId: string,
    groupMembers: GroupMember[],
  ) => {
    if (!token || !groupId || !paidByUserId || groupMembers.length === 0) {
      throw new Error('Missing expense data');
    }
    const pence = gbpToPence(expenseAmount);
    if (!pence) {
      throw new Error('Enter a valid amount (e.g. 12.34).');
    }
    const base = Math.floor(pence / groupMembers.length);
    const remainder = pence % groupMembers.length;
    const splits = groupMembers.map((member, index) => ({
      userId: member.id,
      amount: index < remainder ? base + 1 : base,
    }));
    await createExpenseRequest(token, groupId, {
      description: expenseDescription.trim(),
      amount: pence,
      paidByUserId,
      splits,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setLoggedIn(false);
    setMembers([]);
    setBalances(null);
    setSettle(null);
    setMeEmail(null);
    setExpenses([]);
  };

  return (
    <main className="page">
      <section className="card">
        <h1 className="title">Expense Splitter</h1>

        {loggedIn ? (
          <LoggedInView
            meId={meId}
            meEmail={meEmail}
            groups={groups}
            members={members}
            expenses={expenses}
            balances={balances}
            settle={settle}
            onLoadGroups={fetchGroups}
            onLoadMembers={fetchMembers}
            onLoadExpenses={fetchExpenses}
            onLoadBalancesAndSettle={fetchBalancesAndSettle}
            onCreateGroup={handleCreateGroup}
            onAddMember={handleAddMember}
            onCreateExpense={handleCreateExpense}
            formatMemberLabel={formatMemberLabel}
            onLogout={handleLogout}
          />
        ) : (
          <LoginRegisterForm
            loading={loading}
            error={error}
            registerStatus={registerStatus}
            onLogin={handleLogin}
            onRegister={handleRegister}
          />
        )}
      </section>
    </main>
  );
}

import type {
  BalancesResponse,
  Expense,
  ExpensesResponse,
  Group,
  GroupDetailsResponse,
  GroupsResponse,
  LoginResponse,
  MeResponse,
  SettleResponse,
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

const parseErrorMessage = async (response: Response, fallback: string) => {
  const payload = await response.json().catch(() => null);
  return payload?.message ?? fallback;
};

export const fetchMe = async (token: string) => {
  const response = await fetch(`${API_BASE_URL}/me`, {
    headers: authHeaders(token),
  });
  return response;
};

export const fetchGroups = async (
  token: string,
  page = 1,
  pageSize = 50,
): Promise<GroupsResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/groups?page=${page}&pageSize=${pageSize}`,
    {
      headers: authHeaders(token),
    },
  );
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Failed to load groups'));
  }
  return response.json();
};

export const fetchGroupMembers = async (
  token: string,
  groupId: string,
): Promise<GroupDetailsResponse> => {
  const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
    headers: authHeaders(token),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Failed to load members'));
  }
  return response.json();
};

export const fetchGroupBalances = async (
  token: string,
  groupId: string,
): Promise<BalancesResponse> => {
  const response = await fetch(`${API_BASE_URL}/groups/${groupId}/balances`, {
    headers: authHeaders(token),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Failed to load balances'));
  }
  return response.json();
};

export const fetchGroupSettle = async (
  token: string,
  groupId: string,
): Promise<SettleResponse> => {
  const response = await fetch(`${API_BASE_URL}/groups/${groupId}/settle`, {
    headers: authHeaders(token),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Failed to load balances'));
  }
  return response.json();
};

export const fetchExpenses = async (
  token: string,
  groupId: string,
  page = 1,
  pageSize = 50,
): Promise<ExpensesResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/groups/${groupId}/expenses?page=${page}&pageSize=${pageSize}`,
    {
      headers: authHeaders(token),
    },
  );
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Failed to load expenses'));
  }
  return response.json();
};

export const login = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Login failed'));
  }
  return response.json();
};

export const register = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Registration failed'));
  }
  return response.json();
};

export const createGroup = async (
  token: string,
  name: string,
): Promise<Group> => {
  const response = await fetch(`${API_BASE_URL}/groups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token),
    },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Failed to create group'));
  }
  return response.json();
};

export const addGroupMember = async (
  token: string,
  groupId: string,
  email: string,
) => {
  const response = await fetch(`${API_BASE_URL}/groups/${groupId}/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token),
    },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Failed to add member'));
  }
  return response.json();
};

export const createExpense = async (
  token: string,
  groupId: string,
  payload: {
    description: string;
    amount: number;
    paidByUserId: string;
    splits: { userId: string; amount: number }[];
  },
): Promise<Expense> => {
  const response = await fetch(`${API_BASE_URL}/groups/${groupId}/expenses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Failed to add expense'));
  }
  return response.json();
};

export type { MeResponse };

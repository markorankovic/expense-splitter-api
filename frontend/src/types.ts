export type LoginResponse = {
  accessToken: string;
};

export type Group = {
  id: string;
  name: string;
  createdAt: string;
  ownerId: string;
};

export type GroupsResponse = {
  items: Group[];
  page: number;
  pageSize: number;
  total: number;
};

export type MeResponse = {
  id: string;
  email: string;
};

export type GroupMember = {
  id: string;
  email: string;
};

export type GroupDetailsResponse = Group & {
  members: GroupMember[];
};

export type BalanceEntry = {
  userId: string;
  balance: number;
};

export type BalancesResponse = {
  groupId: string;
  balances: BalanceEntry[];
};

export type SettleTransfer = {
  fromUserId: string;
  toUserId: string;
  amount: number;
};

export type SettleResponse = {
  groupId: string;
  transfers: SettleTransfer[];
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  paidByUserId: string;
  createdAt: string;
};

export type ExpensesResponse = {
  items: Expense[];
  page: number;
  pageSize: number;
  total: number;
};

export type RegisterStatus = {
  kind: 'success' | 'error';
  message: string;
};

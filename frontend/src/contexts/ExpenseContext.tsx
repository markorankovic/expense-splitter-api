import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { createExpense as createExpenseRequest, fetchExpenses as fetchExpensesRequest } from '../api';
import type { Expense, GroupMember } from '../types';
import { gbpToPence } from '../utils/money';
import { useAuth } from './AuthContext';

type ExpenseContextValue = {
  expenses: Expense[];
  expensesLoading: boolean;
  expensesError: string;
  expenseStatus: string;
  loadExpenses: (groupId: string) => Promise<void>;
  createExpense: (
    groupId: string,
    description: string,
    amountInput: string,
    paidByUserId: string,
    members: GroupMember[],
  ) => Promise<void>;
  resetExpenses: () => void;
};

const ExpenseContext = createContext<ExpenseContextValue | undefined>(undefined);

export function ExpenseProvider({ children }: PropsWithChildren) {
  const { token, loggedIn } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expensesError, setExpensesError] = useState('');
  const [expenseStatus, setExpenseStatus] = useState('');

  const loadExpenses = async (groupId: string) => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    setExpensesError('');
    setExpensesLoading(true);
    try {
      const data = await fetchExpensesRequest(token, groupId, 1, 50);
      setExpenses(data.items);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load expenses';
      setExpensesError(message);
      throw err;
    } finally {
      setExpensesLoading(false);
    }
  };

  const createExpense = async (
    groupId: string,
    description: string,
    amountInput: string,
    paidByUserId: string,
    members: GroupMember[],
  ) => {
    if (!token || !groupId || !paidByUserId || members.length === 0) {
      throw new Error('Missing expense data');
    }

    const pence = gbpToPence(amountInput);
    if (!pence) {
      throw new Error('Enter a valid amount (e.g. 12.34).');
    }

    const base = Math.floor(pence / members.length);
    const remainder = pence % members.length;
    const splits = members.map((member, index) => ({
      userId: member.id,
      amount: index < remainder ? base + 1 : base,
    }));

    setExpenseStatus('');
    try {
      await createExpenseRequest(token, groupId, {
        description: description.trim(),
        amount: pence,
        paidByUserId,
        splits,
      });
      setExpenseStatus('Expense added.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add expense';
      setExpenseStatus(message);
      throw err;
    }
  };

  const resetExpenses = () => {
    setExpenses([]);
    setExpensesError('');
    setExpensesLoading(false);
    setExpenseStatus('');
  };

  useEffect(() => {
    if (!loggedIn) {
      resetExpenses();
    }
  }, [loggedIn]);

  const value = useMemo(
    () => ({
      expenses,
      expensesLoading,
      expensesError,
      expenseStatus,
      loadExpenses,
      createExpense,
      resetExpenses,
    }),
    [expenses, expensesLoading, expensesError, expenseStatus],
  );

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
}

export function useExpenses() {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
}

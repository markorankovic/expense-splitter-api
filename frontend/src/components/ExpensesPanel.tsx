import { useEffect, useState, type SubmitEvent } from 'react';
import { useBalancesAndSettle } from '../contexts/BalancesAndSettleContext';
import { useExpenses } from '../contexts/ExpenseContext';
import { useGroups } from '../contexts/GroupContext';
import { useMembers } from '../contexts/MemberContext';
import { useMe } from '../contexts/MeContext';
import { formatMoney } from '../utils/money';
import { PaginationControls } from './PaginationControls';

export function ExpensesPanel() {
  const { groups, activeGroupId } = useGroups();
  const {
    expenseStatus,
    expensesError,
    expensesLoading,
    expenses,
    expensePage,
    expensePageSize,
    expenseTotal,
    setExpensePage,
    fetchExpenses,
    createExpense,
    deleteExpense,
  } = useExpenses();
  const { membersLoading, members, formatMemberLabel, ensureMemberEmails } = useMembers();
  const { meId } = useMe();
  const { fetchBalancesAndSettle } = useBalancesAndSettle();
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  useEffect(() => {
    if (!activeGroupId) {
      return;
    }
    void fetchExpenses(activeGroupId, expensePage).catch(() => {});
  }, [activeGroupId, expensePage, fetchExpenses]);

  useEffect(() => {
    if (!activeGroupId || expenses.length === 0) {
      return;
    }
    const paidByUserIds = expenses.map((expense) => expense.paidByUserId);
    void ensureMemberEmails(activeGroupId, paidByUserIds).catch(() => {});
  }, [activeGroupId, expenses, ensureMemberEmails]);

  useEffect(() => {
    setExpensePage(1);
  }, [activeGroupId, setExpensePage]);

  if (!activeGroupId) {
    return null;
  }

  const activeGroup = groups.find((group) => group.id === activeGroupId) ?? null;
  const isOwner = activeGroup?.ownerId === meId;

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await createExpense(activeGroupId, expenseDescription, expenseAmount);
      await fetchExpenses(activeGroupId, expensePage);
      await fetchBalancesAndSettle(activeGroupId).catch(() => {});
      setExpenseDescription('');
      setExpenseAmount('');
    } catch {
      return;
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await deleteExpense(activeGroupId, expenseId);
      await fetchExpenses(activeGroupId, expensePage);
      await fetchBalancesAndSettle(activeGroupId).catch(() => {});
    } catch {
      return;
    }
  };

  return (
    <div className="expense-card">
      <h2 className="subtitle">Expenses</h2>
      <form onSubmit={handleSubmit} className="form">
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
              <div className="expense-content">
                <div>
                  <p className="expense-name">{expense.description}</p>
                  <p className="muted">Paid by {formatMemberLabel(expense.paidByUserId)}</p>
                </div>
                <span>{formatMoney(expense.amount)}</span>
              </div>
              <button
                type="button"
                className="button ghost expense-action"
                aria-label="Delete expense"
                title={
                  expense.paidByUserId === meId || isOwner
                    ? 'Delete expense'
                    : 'Only payer or group owner can delete this expense'
                }
                disabled={expense.paidByUserId !== meId && !isOwner}
                onClick={() => {
                  void handleDeleteExpense(expense.id);
                }}
              >
                🗑
              </button>
            </li>
          ))}
        </ul>
      )}
      <PaginationControls
        currentPage={expensePage}
        pageSize={expensePageSize}
        totalItems={expenseTotal}
        loading={expensesLoading}
        onPageChange={setExpensePage}
      />
    </div>
  );
}

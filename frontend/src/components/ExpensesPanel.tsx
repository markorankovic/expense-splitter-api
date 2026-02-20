import { useEffect, useState, type SubmitEvent } from 'react';
import { useBalancesAndSettle } from '../contexts/BalancesAndSettleContext';
import { useExpenses } from '../contexts/ExpenseContext';
import { useGroups } from '../contexts/GroupContext';
import { useMembers } from '../contexts/MemberContext';
import { formatMoney } from '../utils/money';

export function ExpensesPanel() {
  const { activeGroupId } = useGroups();
  const { expenseStatus, expensesError, expensesLoading, expenses, fetchExpenses, createExpense } =
    useExpenses();
  const { membersLoading, members, formatMemberLabel } = useMembers();
  const { fetchBalancesAndSettle } = useBalancesAndSettle();
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  useEffect(() => {
    if (!activeGroupId) {
      return;
    }
    void fetchExpenses(activeGroupId).catch(() => {});
  }, [activeGroupId, fetchExpenses]);

  if (!activeGroupId) {
    return null;
  }

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await createExpense(activeGroupId, expenseDescription, expenseAmount);
      await fetchExpenses(activeGroupId);
      await fetchBalancesAndSettle(activeGroupId).catch(() => {});
      setExpenseDescription('');
      setExpenseAmount('');
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
              <div>
                <p className="expense-name">{expense.description}</p>
                <p className="muted">Paid by {formatMemberLabel(expense.paidByUserId)}</p>
              </div>
              <span>{formatMoney(expense.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

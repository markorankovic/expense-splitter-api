import { useState, type SubmitEvent } from 'react';
import type { Expense, GroupMember } from '../types';
import { formatMoney } from '../utils/money';

type ExpensesPanelProps = {
  expenseStatus: string;
  expensesError: string;
  expensesLoading: boolean;
  expenses: Expense[];
  membersLoading: boolean;
  members: GroupMember[];
  onCreateExpense: (
    description: string,
    amountInput: string,
  ) => Promise<boolean> | boolean;
  formatMemberLabel: (memberId: string) => string;
};

export function ExpensesPanel({
  expenseStatus,
  expensesError,
  expensesLoading,
  expenses,
  membersLoading,
  members,
  onCreateExpense,
  formatMemberLabel,
}: ExpensesPanelProps) {
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const ok = await onCreateExpense(expenseDescription, expenseAmount);
    if (ok) {
      setExpenseDescription('');
      setExpenseAmount('');
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

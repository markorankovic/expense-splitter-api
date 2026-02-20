import type { BalancesResponse, SettleResponse } from '../types';
import { formatMoney } from '../utils/money';

type BalancesPanelProps = {
  balancesLoading: boolean;
  balancesError: string;
  balances: BalancesResponse | null;
  settle: SettleResponse | null;
  onRefresh: () => void;
  formatMemberLabel: (memberId: string) => string;
};

export function BalancesPanel({
  balancesLoading,
  balancesError,
  balances,
  settle,
  onRefresh,
  formatMemberLabel,
}: BalancesPanelProps) {
  return (
    <div className="balances-card">
      <div className="balances-header">
        <h2 className="subtitle">Balances</h2>
        <button
          type="button"
          className="button ghost"
          onClick={onRefresh}
          disabled={balancesLoading}
        >
          Refresh
        </button>
      </div>
      {balancesError ? <p className="error">{balancesError}</p> : null}
      {balances ? (
        <ul className="balances-list">
          {balances.balances.filter((entry) => entry.balance !== 0).length === 0 ? (
            <li className="muted">No balances yet.</li>
          ) : (
            balances.balances
              .filter((entry) => entry.balance !== 0)
              .map((entry) => (
                <li key={entry.userId}>
                  <span>{formatMemberLabel(entry.userId)}</span>
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
                  {formatMemberLabel(transfer.fromUserId)} →{' '}
                  {formatMemberLabel(transfer.toUserId)}
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
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useBalancesAndSettle } from '../contexts/BalancesAndSettleContext';
import { useGroups } from '../contexts/GroupContext';
import { useMembers } from '../contexts/MemberContext';
import { formatMoney } from '../utils/money';

export function BalancesPanel() {
  const { activeGroupId } = useGroups();
  const { formatMemberLabel } = useMembers();
  const {
    balancesLoading,
    balancesError,
    balances,
    settle,
    fetchBalancesAndSettle,
  } = useBalancesAndSettle();
  const [balancePage, setBalancePage] = useState(1);
  const [settlePage, setSettlePage] = useState(1);
  const balancePageSize = 4;
  const settlePageSize = 4;
  const nonZeroBalances = useMemo(
    () => balances?.balances.filter((entry) => entry.balance !== 0) ?? [],
    [balances],
  );
  const balanceTotalPages = Math.max(
    1,
    Math.ceil(nonZeroBalances.length / balancePageSize),
  );
  const settleTotalPages = Math.max(
    1,
    Math.ceil((settle?.transfers.length ?? 0) / settlePageSize),
  );
  const paginatedBalances = nonZeroBalances.slice(
    (balancePage - 1) * balancePageSize,
    balancePage * balancePageSize,
  );
  const paginatedTransfers = (settle?.transfers ?? []).slice(
    (settlePage - 1) * settlePageSize,
    settlePage * settlePageSize,
  );

  useEffect(() => {
    if (!activeGroupId) {
      return;
    }
    void fetchBalancesAndSettle(activeGroupId).catch(() => {});
  }, [activeGroupId, fetchBalancesAndSettle]);

  useEffect(() => {
    setBalancePage(1);
    setSettlePage(1);
  }, [activeGroupId]);

  useEffect(() => {
    if (balancePage > balanceTotalPages) {
      setBalancePage(balanceTotalPages);
    }
  }, [balancePage, balanceTotalPages]);

  useEffect(() => {
    if (settlePage > settleTotalPages) {
      setSettlePage(settleTotalPages);
    }
  }, [settlePage, settleTotalPages]);

  if (!activeGroupId) {
    return null;
  }

  return (
    <div className="balances-card">
      <div className="balances-header">
        <h2 className="subtitle">Balances</h2>
        <button
          type="button"
          className="button ghost"
          onClick={() => {
            void fetchBalancesAndSettle(activeGroupId).catch(() => {});
          }}
          disabled={balancesLoading}
        >
          Refresh
        </button>
      </div>
      {balancesError ? <p className="error">{balancesError}</p> : null}
      {balances ? (
        <ul className="balances-list">
          {nonZeroBalances.length === 0 ? (
            <li className="muted">No balances yet.</li>
          ) : (
            paginatedBalances.map((entry) => (
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
      {nonZeroBalances.length > balancePageSize ? (
        <div className="pagination">
          <button
            type="button"
            className="button ghost"
            onClick={() => setBalancePage(Math.max(1, balancePage - 1))}
            disabled={balancePage === 1 || balancesLoading}
          >
            Prev
          </button>
          <span className="muted">
            Page {balancePage} / {balanceTotalPages}
          </span>
          <button
            type="button"
            className="button ghost"
            onClick={() => setBalancePage(Math.min(balanceTotalPages, balancePage + 1))}
            disabled={balancePage >= balanceTotalPages || balancesLoading}
          >
            Next
          </button>
        </div>
      ) : null}

      <h2 className="subtitle">Settle</h2>
      {settle ? (
        <ul className="balances-list">
          {settle.transfers.length === 0 ? (
            <li className="muted">No transfers needed.</li>
          ) : (
            paginatedTransfers.map((transfer, index) => (
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
      {settle && settle.transfers.length > settlePageSize ? (
        <div className="pagination">
          <button
            type="button"
            className="button ghost"
            onClick={() => setSettlePage(Math.max(1, settlePage - 1))}
            disabled={settlePage === 1 || balancesLoading}
          >
            Prev
          </button>
          <span className="muted">
            Page {settlePage} / {settleTotalPages}
          </span>
          <button
            type="button"
            className="button ghost"
            onClick={() => setSettlePage(Math.min(settleTotalPages, settlePage + 1))}
            disabled={settlePage >= settleTotalPages || balancesLoading}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}

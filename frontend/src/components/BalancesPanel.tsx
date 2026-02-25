import { useEffect } from 'react';
import { useBalancesAndSettle } from '../contexts/BalancesAndSettleContext';
import { useGroups } from '../contexts/GroupContext';
import { useMembers } from '../contexts/MemberContext';
import { formatMoney } from '../utils/money';
import { PaginationControls } from './PaginationControls';

export function BalancesPanel() {
  const { activeGroupId } = useGroups();
  const { formatMemberLabel, ensureMemberEmails } = useMembers();
  const {
    balancesLoading,
    balancesError,
    balances,
    settle,
    balancePage,
    settlePage,
    balancePageSize,
    settlePageSize,
    balanceTotal,
    settleTotal,
    setBalancePage,
    setSettlePage,
    fetchBalancesAndSettle,
  } = useBalancesAndSettle();
  const balanceTotalPages = Math.max(1, Math.ceil(balanceTotal / balancePageSize));
  const settleTotalPages = Math.max(1, Math.ceil(settleTotal / settlePageSize));

  useEffect(() => {
    if (!activeGroupId) {
      return;
    }
    void fetchBalancesAndSettle(activeGroupId, balancePage, settlePage).catch(() => {});
  }, [activeGroupId, balancePage, settlePage, fetchBalancesAndSettle]);

  useEffect(() => {
    if (!activeGroupId) {
      return;
    }

    const userIds = new Set<string>();
    balances?.balances.forEach((entry) => userIds.add(entry.userId));
    settle?.transfers.forEach((transfer) => {
      userIds.add(transfer.fromUserId);
      userIds.add(transfer.toUserId);
    });

    if (userIds.size === 0) {
      return;
    }

    void ensureMemberEmails(activeGroupId, Array.from(userIds)).catch(() => {});
  }, [activeGroupId, balances, settle, ensureMemberEmails]);

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
            void fetchBalancesAndSettle(activeGroupId, balancePage, settlePage).catch(() => {});
          }}
          disabled={balancesLoading}
        >
          Refresh
        </button>
      </div>
      {balancesError ? <p className="error">{balancesError}</p> : null}
      {balances ? (
        <ul className="balances-list">
          {balances.balances.length === 0 ? (
            <li className="muted">No balances yet.</li>
          ) : (
            balances.balances.map((entry) => (
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
      <PaginationControls
        currentPage={balancePage}
        pageSize={balancePageSize}
        totalItems={balanceTotal}
        loading={balancesLoading}
        onPageChange={setBalancePage}
      />

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
      <PaginationControls
        currentPage={settlePage}
        pageSize={settlePageSize}
        totalItems={settleTotal}
        loading={balancesLoading}
        onPageChange={setSettlePage}
      />
    </div>
  );
}

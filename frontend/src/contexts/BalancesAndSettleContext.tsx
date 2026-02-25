import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { fetchGroupBalances, fetchGroupSettle } from '../api';
import type { BalancesResponse, SettleResponse } from '../types';
import { useAuth } from './AuthContext';

type BalancesAndSettleContextValue = {
  balances: BalancesResponse | null;
  settle: SettleResponse | null;
  balancesLoading: boolean;
  balancesError: string;
  balancePage: number;
  settlePage: number;
  balancePageSize: number;
  settlePageSize: number;
  balanceTotal: number;
  settleTotal: number;
  setBalancePage: (page: number) => void;
  setSettlePage: (page: number) => void;
  fetchBalancesAndSettle: (
    groupId: string,
    balancePage?: number,
    settlePage?: number,
  ) => Promise<void>;
};

const BalancesAndSettleContext =
  createContext<BalancesAndSettleContextValue | undefined>(undefined);

export function BalancesAndSettleProvider({ children }: PropsWithChildren) {
  const { token, loggedIn } = useAuth();
  const [balances, setBalances] = useState<BalancesResponse | null>(null);
  const [settle, setSettle] = useState<SettleResponse | null>(null);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [balancesError, setBalancesError] = useState('');
  const [balancePage, setBalancePage] = useState(1);
  const [settlePage, setSettlePage] = useState(1);
  const balancePageSize = 4;
  const settlePageSize = 4;
  const [balanceTotal, setBalanceTotal] = useState(0);
  const [settleTotal, setSettleTotal] = useState(0);

  const fetchBalancesAndSettle = useCallback(async (
    groupId: string,
    balancesPageValue = balancePage,
    settlePageValue = settlePage,
  ) => {
    if (!token) {
      throw new Error('Not authenticated');
    }

      setBalancesError('');
      setBalancesLoading(true);
      try {
        const [balancesData, settleData] = await Promise.all([
          fetchGroupBalances(token, groupId, balancesPageValue, balancePageSize),
          fetchGroupSettle(token, groupId, settlePageValue, settlePageSize),
        ]);
        setBalances(balancesData);
        setSettle(settleData);
        setBalanceTotal(balancesData.total);
        setSettleTotal(settleData.total);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load balances';
        setBalancesError(message);
        throw err;
      } finally {
        setBalancesLoading(false);
      }
  }, [token, balancePage, settlePage, balancePageSize, settlePageSize]);

  useEffect(() => {
    if (!loggedIn) {
      setBalances(null);
      setSettle(null);
      setBalancesError('');
      setBalancesLoading(false);
      setBalancePage(1);
      setSettlePage(1);
      setBalanceTotal(0);
      setSettleTotal(0);
    }
  }, [loggedIn]);

  const value = useMemo(
    () => ({
      balances,
      settle,
      balancesLoading,
      balancesError,
      balancePage,
      settlePage,
      balancePageSize,
      settlePageSize,
      balanceTotal,
      settleTotal,
      setBalancePage,
      setSettlePage,
      fetchBalancesAndSettle,
    }),
    [
      balances,
      settle,
      balancesLoading,
      balancesError,
      balancePage,
      settlePage,
      balancePageSize,
      settlePageSize,
      balanceTotal,
      settleTotal,
      setBalancePage,
      setSettlePage,
      fetchBalancesAndSettle,
    ],
  );

  return (
    <BalancesAndSettleContext.Provider value={value}>
      {children}
    </BalancesAndSettleContext.Provider>
  );
}

export function useBalancesAndSettle() {
  const context = useContext(BalancesAndSettleContext);
  if (!context) {
    throw new Error('useBalancesAndSettle must be used within a BalancesAndSettleProvider');
  }
  return context;
}

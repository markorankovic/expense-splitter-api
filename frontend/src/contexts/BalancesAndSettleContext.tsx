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
  fetchBalancesAndSettle: (groupId: string) => Promise<void>;
};

const BalancesAndSettleContext =
  createContext<BalancesAndSettleContextValue | undefined>(undefined);

export function BalancesAndSettleProvider({ children }: PropsWithChildren) {
  const { token, loggedIn } = useAuth();
  const [balances, setBalances] = useState<BalancesResponse | null>(null);
  const [settle, setSettle] = useState<SettleResponse | null>(null);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [balancesError, setBalancesError] = useState('');

  const fetchBalancesAndSettle = useCallback(async (groupId: string) => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    setBalancesError('');
    setBalancesLoading(true);
    try {
      const [balancesData, settleData] = await Promise.all([
        fetchGroupBalances(token, groupId),
        fetchGroupSettle(token, groupId),
      ]);
      setBalances(balancesData);
      setSettle(settleData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load balances';
      setBalancesError(message);
      throw err;
    } finally {
      setBalancesLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!loggedIn) {
      setBalances(null);
      setSettle(null);
      setBalancesError('');
      setBalancesLoading(false);
    }
  }, [loggedIn]);

  const value = useMemo(
    () => ({
      balances,
      settle,
      balancesLoading,
      balancesError,
      fetchBalancesAndSettle,
    }),
    [
      balances,
      settle,
      balancesLoading,
      balancesError,
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

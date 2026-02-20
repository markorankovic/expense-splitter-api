import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { fetchMe as fetchMeRequest } from '../api';
import { useAuth } from './AuthContext';

type MeContextValue = {
  meId: string | null;
  meEmail: string | null;
  loadMe: () => Promise<void>;
};

const MeContext = createContext<MeContextValue | undefined>(undefined);

export function MeProvider({ children }: PropsWithChildren) {
  const { token, loggedIn } = useAuth();
  const [meId, setMeId] = useState<string | null>(null);
  const [meEmail, setMeEmail] = useState<string | null>(null);

  const loadMe = async () => {
    if (!token) {
      setMeId(null);
      setMeEmail(null);
      return;
    }

    try {
      const response = await fetchMeRequest(token);
      if (!response.ok) {
        const message = await response.json().catch(() => null);
        console.error('Failed to load current user', message?.message ?? response.status);
        return;
      }

      const data = await response.json();
      setMeId(data.id);
      setMeEmail(data.email);
    } catch (err) {
      console.error('Failed to load current user', err);
      setMeId(null);
      setMeEmail(null);
    }
  };

  useEffect(() => {
    if (loggedIn) {
      void loadMe();
      return;
    }

    setMeId(null);
    setMeEmail(null);
  }, [loggedIn, token]);

  const value = useMemo(
    () => ({
      meId,
      meEmail,
      loadMe,
    }),
    [meId, meEmail],
  );

  return <MeContext.Provider value={value}>{children}</MeContext.Provider>;
}

export function useMe() {
  const context = useContext(MeContext);
  if (!context) {
    throw new Error('useMe must be used within a MeProvider');
  }
  return context;
}

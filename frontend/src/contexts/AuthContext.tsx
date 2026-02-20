import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren,
} from 'react';
import { login as loginRequest, register as registerRequest } from '../api';
import type { RegisterStatus } from '../types';

type AuthContextValue = {
  token: string;
  loading: boolean;
  error: string;
  loggedIn: boolean;
  registerStatus: RegisterStatus | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState(() => localStorage.getItem('accessToken') ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loggedIn, setLoggedIn] = useState(() => Boolean(localStorage.getItem('accessToken')));
  const [registerStatus, setRegisterStatus] = useState<RegisterStatus | null>(null);

  const login = async (email: string, password: string) => {
    setError('');
    setRegisterStatus(null);
    setLoading(true);

    try {
      const data = await loginRequest(email, password);
      localStorage.setItem('accessToken', data.accessToken);
      setToken(data.accessToken);
      setLoggedIn(true);
      setRegisterStatus(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    if (!email || !password) {
      setRegisterStatus({
        kind: 'error',
        message: 'Email and password are required.',
      });
      return;
    }

    setError('');
    setRegisterStatus(null);
    try {
      await registerRequest(email, password);
      setRegisterStatus({
        kind: 'success',
        message: 'Registered. You can now log in.',
      });
    } catch (err) {
      setRegisterStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Registration failed',
      });
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setToken('');
    setLoggedIn(false);
    setRegisterStatus(null);
    setError('');
  };

  const value = {
    token,
    loading,
    error,
    loggedIn,
    registerStatus,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

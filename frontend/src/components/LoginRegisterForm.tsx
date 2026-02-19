import type { SubmitEvent } from 'react';
import type { RegisterStatus } from '../types';

type LoginRegisterFormProps = {
  email: string;
  password: string;
  loading: boolean;
  error: string;
  registerStatus: RegisterStatus | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onLogin: (event: SubmitEvent<HTMLFormElement>) => void;
  onRegister: () => void;
};

export function LoginRegisterForm({
  email,
  password,
  loading,
  error,
  registerStatus,
  onEmailChange,
  onPasswordChange,
  onLogin,
  onRegister,
}: LoginRegisterFormProps) {
  return (
    <form onSubmit={onLogin} className="form">
      <label className="label">
        Email
        <input
          className="input"
          type="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder="you@example.com"
          required
        />
      </label>

      <label className="label">
        Password
        <input
          className="input"
          type="password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          placeholder="••••••••"
          required
          minLength={8}
        />
      </label>

      {error ? <p className="error">{error}</p> : null}
      {registerStatus ? (
        <p className={registerStatus.kind === 'success' ? 'success' : 'error'}>
          {registerStatus.message}
        </p>
      ) : null}

      <button className="button" type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
      <button
        className="button ghost"
        type="button"
        onClick={onRegister}
        disabled={loading}
      >
        Register
      </button>
    </form>
  );
}

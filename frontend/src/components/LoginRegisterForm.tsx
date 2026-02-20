import { useState, type SubmitEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function LoginRegisterForm() {
  const { loading, error, registerStatus, login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    void login(email, password);
  };

  const handleRegister = () => {
    void register(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <label className="label">
        Email
        <input
          className="input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
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
          onChange={(event) => setPassword(event.target.value)}
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
        onClick={handleRegister}
        disabled={loading}
      >
        Register
      </button>
    </form>
  );
}

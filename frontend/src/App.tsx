import './App.css';
import { LoggedInView } from './components/LoggedInView';
import { LoginRegisterForm } from './components/LoginRegisterForm';
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const { loggedIn } = useAuth();

  return (
    <main className="page">
      <section className="card">
        <h1 className="title">Expense Splitter</h1>
        {loggedIn ? <LoggedInView /> : <LoginRegisterForm />}
      </section>
    </main>
  );
}

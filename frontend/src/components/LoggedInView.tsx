import { useAuth } from '../contexts/AuthContext';
import { useMe } from '../contexts/MeContext';
import { BalancesPanel } from './BalancesPanel';
import { ExpensesPanel } from './ExpensesPanel';
import { GroupsPanel } from './GroupsPanel';
import { MembersPanel } from './MembersPanel';

export function LoggedInView() {
  const { logout } = useAuth();
  const { meEmail } = useMe();

  return (
    <div className="logged-in">
      <p className="success">Logged in{meEmail ? ` as ${meEmail}` : ''}</p>

      <GroupsPanel />
      <MembersPanel />
      <ExpensesPanel />
      <BalancesPanel />

      <div className="logout-card">
        <button type="button" onClick={logout} className="button ghost">
          Log out
        </button>
      </div>
    </div>
  );
}

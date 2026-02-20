import type { PropsWithChildren } from 'react';
import { AuthProvider } from './AuthContext';
import { BalancesAndSettleProvider } from './BalancesAndSettleContext';
import { ExpenseProvider } from './ExpenseContext';
import { GroupProvider } from './GroupContext';
import { MemberProvider } from './MemberContext';
import { MeProvider } from './MeContext';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <MeProvider>
        <GroupProvider>
          <MemberProvider>
            <ExpenseProvider>
              <BalancesAndSettleProvider>{children}</BalancesAndSettleProvider>
            </ExpenseProvider>
          </MemberProvider>
        </GroupProvider>
      </MeProvider>
    </AuthProvider>
  );
}

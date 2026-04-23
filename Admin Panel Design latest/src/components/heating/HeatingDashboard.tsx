import { User } from '../../App';
import { CTHeating } from './CTHeating';
import { PTHeating } from './PTHeating';

interface HeatingDashboardProps {
  user: User;
  activeView: 'ct-heating' | 'pt-heating';
}

export function HeatingDashboard({ user, activeView }: HeatingDashboardProps) {
  if (activeView === 'pt-heating') {
    return <PTHeating user={user} />;
  }
  return <CTHeating user={user} />;
}

import { User } from '../../App';
import { HeatingTrackingModule } from '../tester/HeatingTrackingModule';

interface CTHeatingProps {
  user: User;
}

// Adapter: gives HeatingTrackingModule a heating_operator user context.
// HeatingTrackingModule internally routes by role; we override it to 'CT' mode
// by providing a non-pt-tester role, which correctly triggers the CT branch.
export function CTHeating({ user }: CTHeatingProps) {
  // Pass user with a role that is not 'pt-tester' so the CT branch is selected
  const ctUser: User = { ...user, role: 'after-primary-tester' };
  return <HeatingTrackingModule user={ctUser} />;
}

import { User } from '../../App';
import { PTHeatingRecordModule } from '../tester/PTHeatingRecordModule';

interface PTHeatingProps {
  user: User;
}

// Adapter: renders the PT Heating workflow for the heating_operator role.
// PTHeatingRecordModule accepts { user } and fetches PT orders independently.
export function PTHeating({ user }: PTHeatingProps) {
  const ptUser: User = { ...user, role: 'pt-tester' };
  return <PTHeatingRecordModule user={ptUser} />;
}

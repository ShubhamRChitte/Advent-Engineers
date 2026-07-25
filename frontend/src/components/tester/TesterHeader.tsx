import { Bell, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '../ui/button';
import { NotificationsPanel } from '../NotificationsPanel';
import { User } from '../../App';

interface TesterHeaderProps {
  user: User;
  onLogout: () => void;
  onSwitchRole?: ((newRole: User['role']) => void) | undefined;
}

export function TesterHeader({ user, onLogout, onSwitchRole }: TesterHeaderProps) {
  const getTesterType = () => {
    switch (user.role) {
      case 'core-tester':
        return 'Core Testing';
      case 'secondary-tester':
        return 'Secondary Testing';
      case 'after-primary-tester':
        return 'Primary Testing';
      case 'final-tester':
        return 'Final Testing';
      case 'pt-tester':
        return 'PT Testing';
      case 'pt-pretester':
        return 'PT Pretest';
      case 'heating_operator':
        return 'Heating Operator';
      default:
        return 'Testing';
    }
  };

  const deptRoleMap: { [key: string]: { role: User['role']; label: string } } = {
    'Core Test': { role: 'core-tester', label: 'Core Testing' },
    'Secondary Test': { role: 'secondary-tester', label: 'Secondary Testing' },
    'Primary Test': { role: 'after-primary-tester', label: 'Primary Testing' },
    'Final Test': { role: 'final-tester', label: 'Final Testing' },
    'PT Test': { role: 'pt-tester', label: 'PT Testing' },
    'PT Pretest': { role: 'pt-pretester', label: 'PT Pretest' },
    'Heating': { role: 'heating_operator', label: 'Heating Operator' }
  };

  const allTestingDepts = ['Core Test', 'Secondary Test', 'Primary Test', 'Final Test', 'PT Test', 'PT Pretest', 'Heating'];

  const parseDepartments = (usr: User): string[] => {
    let depts: string[] = [];
    if (Array.isArray(usr.departments) && usr.departments.length > 0) {
      depts = usr.departments;
    } else if (typeof usr.department === 'string' && usr.department.trim()) {
      depts = usr.department.split(',').map(d => d.trim()).filter(Boolean);
    } else if (Array.isArray(usr.department)) {
      depts = usr.department;
    }
    return Array.from(new Set(depts));
  };

  const userDepts = parseDepartments(user);
  const isAdmin = user.role === 'admin' || user.designation === 'Admin';
  
  // Admin gets access to all testing panels. Regular employees get access STRICTLY to their assigned departments.
  const deptsToUse = isAdmin ? allTestingDepts : (userDepts.length > 0 ? userDepts : allTestingDepts);

  const availableDashboards = deptsToUse
    .map(d => deptRoleMap[d])
    .filter((d): d is { role: User['role']; label: string } => Boolean(d));

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-[#003a70] text-xl font-bold flex items-center gap-2">
              {getTesterType()} Panel
            </h1>
            <p className="text-sm text-gray-600">Perform transformer testing procedures</p>
          </div>

          {availableDashboards.length > 1 && onSwitchRole && (
            <div className="ml-4 flex items-center gap-2 bg-blue-50/90 border border-blue-200 px-3 py-1.5 rounded-lg shadow-xs">
              <LayoutDashboard className="w-4 h-4 text-blue-700" />
              <span className="text-xs font-semibold text-blue-900">Switch Role / Dashboard:</span>
              <select
                value={user.role}
                onChange={(e) => onSwitchRole(e.target.value as User['role'])}
                className="bg-white text-xs font-bold text-blue-900 border border-blue-300 rounded px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs hover:border-blue-400 transition-colors"
              >
                {availableDashboards.map(d => (
                  <option key={d.role} value={d.role}>
                    {d.label} Panel
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <NotificationsPanel />
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">{user.name}</p>
              {onSwitchRole ? (
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    {getTesterType()}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-gray-500">{getTesterType()}</p>
              )}
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#003a70] to-[#005a9c] flex items-center justify-center text-white font-bold">
              {user.name.charAt(0)}
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={onLogout} className="border-gray-300 hover:bg-gray-50">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}

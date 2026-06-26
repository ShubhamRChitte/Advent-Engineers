import { Bell, LogOut } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { NotificationsPanel } from '../NotificationsPanel';
import { User } from '../../App';

interface TesterHeaderProps {
  user: User;
  onLogout: () => void;
}

export function TesterHeader({ user, onLogout }: TesterHeaderProps) {
  const getTesterType = () => {
    switch (user.role) {
      case 'core-tester':
        return 'Core Testing';
      case 'secondary-tester':
        return 'Secondary Testing';
      case 'final-tester':
        return 'Final Testing';
      default:
        return 'Testing';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#003a70]">{getTesterType()} Panel</h1>
          <p className="text-sm text-gray-600">Perform transformer testing procedures</p>
        </div>
        
        <div className="flex items-center gap-4">
          <NotificationsPanel />
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm">{user.name}</p>
              <p className="text-xs text-gray-500">{getTesterType()}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#003a70] to-[#005a9c] flex items-center justify-center text-white">
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

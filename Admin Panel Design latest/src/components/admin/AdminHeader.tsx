import { Bell, LogOut } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { User } from '../../App';

interface AdminHeaderProps {
  user: User;
  onLogout: () => void;
  onNotificationClick?: () => void;
}

export function AdminHeader({ user, onLogout, onNotificationClick }: AdminHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#003a70]">ADVENT ENGINEERS</h1>
          <p className="text-sm text-gray-600">Admin Panel</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" onClick={onNotificationClick}>
            <Bell className="w-5 h-5" />
            <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-[#dc2626] text-white text-xs">
              3
            </Badge>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm">{user.name}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#003a70] to-[#005a9c] flex items-center justify-center text-white">
              {user.name.charAt(0)}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="border-gray-300 hover:bg-gray-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}

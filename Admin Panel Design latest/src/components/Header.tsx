import { Search, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { User } from '../App';
import { NotificationsPanel } from './NotificationsPanel';
import { QuickActionsMenu } from './QuickActionsMenu';

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

export function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search orders, workers, transformers..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4 ml-6">
          {user.role === 'admin' && <QuickActionsMenu />}
          
          <NotificationsPanel />
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm">{user.name}</p>
              <p className="text-xs text-gray-500">{user.role === 'admin' ? 'Admin' : 'Entry Level'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="ml-2"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}

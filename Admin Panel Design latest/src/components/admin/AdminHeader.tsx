import { useState, useEffect } from 'react';
import { Bell, LogOut } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { User } from '../../App';
import axios from 'axios';

interface AdminHeaderProps {
  user: User;
  onLogout: () => void;
  onNotificationClick?: () => void;
}

export function AdminHeader({ user, onLogout, onNotificationClick }: AdminHeaderProps) {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/notifications/unread-count`, {
        withCredentials: true,
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (response.data.success) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Poll for unread count every 30 seconds for the header badge
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm relative z-50">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#003a70]">ADVENT ENGINEERS</h1>
          <p className="text-sm text-gray-600">Admin Panel</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            type="button"
            className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer group" 
            onClick={(e) => {
              e.preventDefault();
              if (onNotificationClick) onNotificationClick();
            }}
            aria-label="Toggle notifications"
          >
            <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-[#dc2626] text-white text-[10px] animate-in zoom-in duration-300">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </button>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#003a70] to-[#005a9c] flex items-center justify-center text-white font-semibold shadow-inner">
              {user.name.charAt(0)}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="border-gray-200 hover:bg-gray-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}

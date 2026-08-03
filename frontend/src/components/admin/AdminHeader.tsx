import { useState, useEffect } from 'react';
import { Bell, LogOut, PlusCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { User } from '../../App';
import { NotificationsPanel } from '../NotificationsPanel';
import axios from '@/utils/axiosConfig';

interface AdminHeaderProps {
  user: User;
  onLogout: () => void;
  onNotificationClick?: () => void;
  onAddOrderClick?: () => void;
}

export function AdminHeader({ user, onLogout, onNotificationClick, onAddOrderClick }: AdminHeaderProps) {
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
          <p className="text-sm text-gray-600">Testing Panel</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            type="button"
            className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer group" 
            onClick={(e) => {
              e.preventDefault();
              if (onAddOrderClick) onAddOrderClick();
            }}
            title="Add Order"
            aria-label="Add Order"
          >
            <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
          
          <NotificationsPanel />
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.name || user?.employeeId || 'Admin'}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#003a70] to-[#005a9c] flex items-center justify-center text-white font-semibold shadow-inner">
              {(user?.name || user?.employeeId || 'A').charAt(0).toUpperCase()}
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

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Bell, CheckCircle2, AlertTriangle, Info, X, Clock } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';

interface Notification {
  _id: string;
  type: 'ASSIGNMENT' | 'STAGE_TRANSITION' | 'REASSIGNMENT' | 'ALERT';
  message: string;
  jobId?: string;
  createdAt: string;
  isRead: boolean;
}

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = () => {
    axios.get('http://localhost:5001/api/notifications/unread-count', { withCredentials: true })
      .then(res => setUnreadCount(res.data.count))
      .catch(err => console.error("Error fetching unread count:", err));
  };

  const fetchNotifications = () => {
    axios.get('http://localhost:5001/api/notifications', { withCredentials: true })
      .then(res => setNotifications(res.data.notifications))
      .catch(err => console.error("Error fetching notifications:", err));
  };

  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications();

    // Polling for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await axios.put(`http://localhost:5001/api/notifications/${id}/read`, {}, { withCredentials: true });
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('http://localhost:5001/api/notifications/mark-read', {}, { withCredentials: true });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const removeNotification = (id: string) => {
    // Optionally implement delete API, or just local hide
    setNotifications(notifications.filter(n => n._id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50';
      case 'warning':
        return 'bg-yellow-50';
      case 'error':
        return 'bg-red-50';
      default:
        return 'bg-blue-50';
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative p-2 text-gray-600 hover:bg-gray-50 rounded-lg">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-red-500 text-white">
              {unreadCount}
            </Badge>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Mark all as read
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`relative p-4 rounded-lg border ${
                  notification.isRead ? 'bg-white border-gray-200' : `${getBackgroundColor(notification.type)} border-transparent`
                }`}
              >
                <button
                  onClick={() => removeNotification(notification._id)}
                  className="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={notification.isRead ? '' : 'font-medium'}>
                        {notification.type === 'ASSIGNMENT' ? 'New Assignment' : 'Notification'}
                      </p>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <p className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {!notification.isRead && (
                        <Button
                          variant="link"
                          size="sm"
                          className="text-xs h-auto p-0 ml-4"
                          onClick={() => markAsRead(notification._id)}
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

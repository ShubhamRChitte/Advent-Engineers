import { useState, useEffect } from 'react';
import axios from '@/utils/axiosConfig';
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
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchUnreadCount = () => {
    axios.get(`/notifications/unread-count`, { withCredentials: true, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(res => setUnreadCount(res.data.count))
      .catch(err => console.error("Error fetching unread count:", err));
  };

  const fetchNotifications = () => {
    axios.get(`/notifications`, { withCredentials: true, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
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
      await axios.put(`/notifications/${id}/read`, {}, { withCredentials: true, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`/notifications/mark-read`, {}, { withCredentials: true, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
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
      <SheetContent className="w-full sm:max-w-md bg-white border-l-0 sm:rounded-l-[2rem] shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.1)] p-0 flex flex-col" aria-describedby={undefined}>
        <div className="p-6 pb-4 border-b border-slate-100 flex-shrink-0 bg-gradient-to-b from-slate-50 to-white sm:rounded-tl-[2rem]">
          <SheetHeader className="mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <SheetTitle className="text-xl text-slate-800">Notifications</SheetTitle>
                <p className="text-sm text-slate-500 font-medium mt-0.5">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </SheetHeader>

          <div className="flex items-center justify-between">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setFilter('all')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                All
              </button>
              <button 
                onClick={() => setFilter('unread')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${filter === 'unread' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
            
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                Mark all as read
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
            {notifications.filter(n => filter === 'all' || !n.isRead).length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">No {filter === 'unread' ? 'unread ' : ''}notifications</p>
                <p className="text-slate-400 text-sm mt-1">You're all caught up!</p>
              </div>
            ) : (
              notifications.filter(n => filter === 'all' || !n.isRead).map((notification) => {
              return (
                <Card 
                  key={notification._id}
                  className={`group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-blue-300 ${
                    !notification.isRead ? 'border-l-4 border-l-blue-600 bg-blue-50/50' : 'bg-white'
                  }`}
                >
                  <div className="p-4 flex items-start gap-4">
                    <div className={`flex-shrink-0 p-3 rounded-xl ${!notification.isRead ? 'bg-blue-600' : 'bg-slate-100'}`}>
                      <Bell className={`w-5 h-5 ${!notification.isRead ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-8">
                      <div className="mb-2">
                        <h4 className={`text-sm font-semibold ${!notification.isRead ? 'text-blue-900' : 'text-slate-700'}`}>
                          {notification.message}
                        </h4>
                      </div>
                      
                      <div className="flex flex-wrap items-center justify-between gap-y-2 mt-2">
                        <span className="text-xs text-slate-400 whitespace-nowrap flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>

                        {!notification.isRead && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 text-xs text-blue-600 hover:bg-blue-100 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification._id);
                            }}
                            title="Mark as read"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                            Mark read
                          </Button>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification._id);
                      }}
                      className="absolute top-2 right-2 p-1.5 hover:bg-red-50 rounded-md text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Card>
              );
            }))}
          </div>
      </SheetContent>
    </Sheet>
  );
}

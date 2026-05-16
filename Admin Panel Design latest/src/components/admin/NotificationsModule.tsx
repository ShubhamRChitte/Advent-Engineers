import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import {
  Bell,
  CheckCircle,
  Clock,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { StrictApprovalDashboard } from './StrictApprovalDashboard';

interface Order {
  _id: string;
  jobId: string;
  clientName: string;
  transformerName: string;
  transformerType: string;
  status: string;
}

interface Notification {
  _id: string;
  orderId: Order | string;
  jobId: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsModuleProps {
  onNavigateToOrder?: (orderId: string) => void;
  isActive?: boolean;
}

export function NotificationsModule({ onNavigateToOrder, isActive }: NotificationsModuleProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/api/notifications/admin', {
        withCredentials: true
      });
      if (response.data.success) {
        const newNotifications = response.data.notifications;
        
        setNotifications(prev => {
          if (prev.length === newNotifications.length && prev[0]?._id === newNotifications[0]?._id) {
            return prev;
          }
          return newNotifications;
        });
        setError(null);
      }
    } catch (err: any) {
      console.error("Failed to fetch notifications", err);
      setError("Failed to load notifications. Please try again.");
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && isActive) {
        fetchNotifications(true);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchNotifications, isActive]);

  const handleMarkAllRead = async () => {
    const previousNotifications = [...notifications];
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));

    try {
      const response = await axios.put('http://localhost:5001/api/notifications/mark-read', {}, {
        withCredentials: true
      });
      if (response.data.success) {
        toast.success("All notifications marked as read");
      }
    } catch (err) {
      setNotifications(previousNotifications);
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkSingleRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    try {
      await axios.put(`http://localhost:5001/api/notifications/${id}/read`, {}, { withCredentials: true });
    } catch (err) {
      console.error("Failed to mark read", err);
    }
  };

  const handleAlertClick = (notification: Notification) => {
    const orderId = typeof notification.orderId === 'object' ? notification.orderId._id : notification.orderId;
    if (onNavigateToOrder && orderId) {
      onNavigateToOrder(orderId);
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-gray-500 animate-pulse">Loading updates...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Alerts & Milestones</h2>
          <p className="text-slate-500 mt-1">Real-time alerts for completed transformer orders</p>
        </div>
        
        <div className="flex items-center gap-3">
          {notifications.some(n => !n.isRead) && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleMarkAllRead}
              className="text-slate-600 hover:text-blue-600 border-slate-200"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark all as read
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => fetchNotifications()} title="Refresh">
            <Clock className={`w-5 h-5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ✅ Removed Admin Review Panel for Retest Approvals as per user request */}

      {/* ✅ Add Strict Approval Requests Dashboard right here at the top of Notifications */}
      <StrictApprovalDashboard />

      {error && (
        <Card className="p-4 border-red-200 bg-red-50 text-red-700 flex items-center justify-between">
          <p className="text-sm">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => fetchNotifications()}>Retry</Button>
        </Card>
      )}

      <div className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map((notification) => {
            const orderDoc = typeof notification.orderId === 'object' ? notification.orderId : null;
            
            return (
              <Card 
                key={notification._id}
                className={`group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-blue-300 relative overflow-hidden ${
                  !notification.isRead ? 'border-l-4 border-l-blue-600 bg-blue-50/50' : 'bg-white'
                }`}
                onClick={() => handleAlertClick(notification)}
              >
                <div className="p-4 flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${!notification.isRead ? 'bg-blue-600' : 'bg-slate-100'}`}>
                    <Bell className={`w-5 h-5 ${!notification.isRead ? 'text-white' : 'text-slate-400'}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`text-base font-semibold truncate ${!notification.isRead ? 'text-blue-900' : 'text-slate-700'}`}>
                        {notification.message}
                      </h4>
                      <span className="text-xs text-slate-400 whitespace-nowrap ml-4">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                      {orderDoc && (
                        <>
                          <span className="font-medium text-slate-700">Client: {orderDoc.clientName}</span>
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">Job ID: {orderDoc.jobId}</span>
                        </>
                      )}
                      {!orderDoc && <span>Order: {notification.jobId}</span>}
                    </div>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    {!notification.isRead && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-blue-600"
                        onClick={(e) => handleMarkSingleRead(notification._id, e)}
                        title="Mark as read"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                    <div className="text-blue-600 p-2">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        ) : !loading && (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <Bell className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600">No completed orders yet</h3>
            <p className="text-slate-400 max-w-xs mx-auto mt-2">
              Completed order alerts will appear here in real-time once testers finish final stages.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

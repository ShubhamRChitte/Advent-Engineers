import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import axios from 'axios';
import {
  Bell,
  Package,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  AlertCircle,
  PlayCircle
} from 'lucide-react';

interface TaskNotification {
  id: string;
  orderObjectId: string;
  orderId: string;
  jobId: string;
  message: string;
  clientName: string;
  transformerName: string;
  transformerType: string;
  quantity: number;
  deadline: string;
  instructions: string;
  fromStage: string;
  fromEmployee: string;
  timestamp: string;
  rawDate?: string;
  isRead: boolean;
  priority: 'High' | 'Medium' | 'Low';
  orderStatus?: string;
  completionStages?: any;
}

interface TesterNotificationsProps {
  userRole: string;
  userName: string;
  onViewOrder?: (orderId: string) => void;
  setActiveView?: (view: string) => void;
}

const getPTPretesterStatus = (notification: TaskNotification) => {
  const statusLower = (notification.orderStatus || '').toLowerCase();
  
  // 1. COMPLETED: If the pre-testing is marked completed or order is finished
  const isCompleted = 
    notification.completionStages?.pt_pretest === true ||
    statusLower.includes('pt pre-testing completed') ||
    statusLower.includes('pt pretesting completed') ||
    statusLower.includes('pt testing assigned') ||
    statusLower.includes('pt testing') ||
    statusLower.includes('final testing') ||
    statusLower === 'completed' ||
    statusLower === 'shipped' ||
    statusLower === 'dispatch';
    
  if (isCompleted) return 'COMPLETED';

  // 2. DELAYED: If deadline is passed and not completed
  const isOverdue = notification.deadline ? new Date(notification.deadline) < new Date() : false;
  if (isOverdue) return 'DELAYED';

  // 3. IN PROGRESS: If testing has started/is in progress
  const isInProgress = statusLower.includes('in progress') || statusLower.includes('in-testing');
  if (isInProgress) return 'IN PROGRESS';

  // 4. NEW: Default/unread or recently assigned
  return 'NEW';
};

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'NEW':
      return {
        borderClass: 'border-l-[4px] border-l-blue-500',
        bgClass: 'bg-blue-50/10',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200 text-xs'
      };
    case 'IN PROGRESS':
      return {
        borderClass: 'border-l-[4px] border-l-green-500',
        bgClass: 'bg-green-50/10',
        badgeClass: 'bg-green-100 text-green-800 border-green-200 text-xs'
      };
    case 'DELAYED':
      return {
        borderClass: 'border-l-[4px] border-l-orange-500',
        bgClass: 'bg-orange-50/10',
        badgeClass: 'bg-orange-100 text-orange-800 border-orange-200 text-xs'
      };
    case 'COMPLETED':
      return {
        borderClass: 'border-l-[4px] border-l-gray-400',
        bgClass: 'bg-gray-50/30',
        badgeClass: 'bg-gray-100 text-gray-800 border-gray-200 text-xs'
      };
    default:
      return {
        borderClass: 'border-l-[4px] border-l-gray-300',
        bgClass: 'bg-white',
        badgeClass: 'bg-gray-100 text-gray-800 border-gray-200 text-xs'
      };
  }
};

const getStartButtonLabel = (notification: TaskNotification) => {
  const statusLower = (notification.orderStatus || '').toLowerCase();
  const isInProgress = statusLower.includes('in progress') || statusLower.includes('in-testing');
  return isInProgress ? 'Continue PT Pretest' : 'Start PT Pretest';
};

const formatPTTimestamp = (rawDate?: string, fromStage?: string, fromEmployee?: string) => {
  if (!rawDate) return '';
  try {
    const date = new Date(rawDate);
    const day = date.getDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const timeStr = `${hours}:${minutes} ${ampm}`;
    
    const stage = fromStage || 'Admin';
    const emp = fromEmployee || 'System';
    
    return `${day} ${month} ${year} • ${timeStr} • ${stage} (${emp})`;
  } catch (e) {
    return rawDate;
  }
};

export function TesterNotifications({ userRole, onViewOrder, setActiveView }: TesterNotificationsProps) {
  // ... (existing code handles notifications loading) ...



  // ... (existing rendering code) ...


  const getTestingStageName = () => {
    switch (userRole) {
      case 'core-tester':
        return 'Core Test';
      case 'secondary-tester':
        return 'Secondary Test';
      case 'after-primary-tester':
        return 'After Primary Test';
      case 'final-tester':
        return 'Final Test';
      default:
        return 'Testing';
    }
  };

  // Sample notifications - would come from backend in real app
  // const [notifications, setNotifications] = useState<TaskNotification[]>([
  //   {
  //     id: '1',
  //     orderId: 'ORD-2024-007',
  //     jobId: 'JOB-2025-015',
  //     message: 'You have a new testing task assigned',
  //     clientName: 'MSEB Power Distribution Ltd.',
  //     transformerName: 'Outdoor Epoxy Resin Cast CT',
  //     transformerType: 'Current Transformer',
  //     quantity: 45,
  //     deadline: '2024-11-28',
  //     instructions: 'Priority order - Please complete testing within 3 days. All cores have been tested and approved by Core Testing team.',
  //     fromStage: 'Core Test',
  //     fromEmployee: 'Rajesh Kumar',
  //     timestamp: '2024-11-24 10:30 AM',
  //     isRead: false,
  //     priority: 'High',
  //   },
  //   {
  //     id: '2',
  //     orderId: 'ORD-2024-008',
  //     jobId: 'JOB-2025-016',
  //     message: 'You have a new testing task assigned',
  //     clientName: 'Tata Power Company',
  //     transformerName: 'Dead Tank Type-3',
  //     transformerType: 'Current Transformer',
  //     quantity: 30,
  //     deadline: '2024-11-30',
  //     instructions: 'Standard testing procedure. Previous stage completed successfully.',
  //     fromStage: 'Core Test',
  //     fromEmployee: 'Vikram Singh',
  //     timestamp: '2024-11-24 02:15 PM',
  //     isRead: false,
  //     priority: 'Medium',
  //   },
  //   {
  //     id: '3',
  //     orderId: 'ORD-2024-006',
  //     jobId: 'JOB-2025-014',
  //     message: 'You have a new testing task assigned',
  //     clientName: 'Gujarat Energy Transmission Corp.',
  //     transformerName: 'Live Tank Type CT',
  //     transformerType: 'Current Transformer',
  //     quantity: 25,
  //     deadline: '2024-11-27',
  //     instructions: 'Urgent - Client requires quick turnaround. All previous tests passed.',
  //     fromStage: 'Core Test',
  //     fromEmployee: 'Rajesh Kumar',
  //     timestamp: '2024-11-23 04:45 PM',
  //     isRead: true,
  //     priority: 'High',
  //   },
  // ]);







  const [notifications, setNotifications] = useState<TaskNotification[]>([]);

  // useEffect(() => {
  //   axios
  //     .get("http://localhost:5001/allorders")
  //     .then((res) => {
  //       setNotifications(res.data);
  //     })
  //     .catch((err) => {
  //       console.error("API ERROR:", err);
  //     });
  // }, []);



  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/notifications`, { withCredentials: true });
        const mapped = res.data.notifications.map((n: any) => {
          const order = n.orderId || {}; // Use the populated order or an empty object
          return {
            id: n._id,
            orderObjectId: order._id || 'N/A',
            orderId: order.jobId || 'N/A',
            jobId: order.jobId || 'N/A',
            message: n.message,
            clientName: order.clientName || 'N/A',
            transformerName: order.transformerName || 'Check Order',
            transformerType: order.transformerType || 'N/A',
            quantity: order.quantity || 0,
            deadline: order.deadline || new Date().toISOString(),
            instructions: order.instructions || '',
            fromStage: 'Admin',
            fromEmployee: 'System',
            timestamp: new Date(n.createdAt).toLocaleString(),
            rawDate: n.createdAt,
            isRead: n.isRead,
            priority: order.priority || 'Medium',
            orderStatus: order.status || '',
            completionStages: order.completionStages || {}
          };
        }).sort((a: any, b: any) => new Date(b.rawDate || 0).getTime() - new Date(a.rawDate || 0).getTime());
        setNotifications(mapped);
      } catch (err) {
        console.error("API ERROR:", err);
      }
    };

    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/notifications/${notificationId}/read`, {}, { withCredentials: true });
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/notifications/mark-read`, {}, { withCredentials: true });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const handleStartPTPretest = async (notification: TaskNotification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }
    if (setActiveView) {
      setActiveView('testing');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'Medium':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'Low':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2>Testing Notifications</h2>
          <p className="text-gray-500 mt-1">New testing tasks assigned to you</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-blue-600 text-white px-4 py-2 text-sm">
            <Bell className="w-4 h-4 mr-2" />
            {unreadCount} New
          </Badge>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
            >
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-blue-700">Total Tasks</p>
              <h3 className="mt-1 text-blue-900">{notifications.length}</h3>
            </div>
            <div className="p-3 bg-blue-500 rounded-lg">
              <Bell className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-orange-700">Unread</p>
              <h3 className="mt-1 text-orange-900">{unreadCount}</h3>
            </div>
            <div className="p-3 bg-orange-500 rounded-lg">
              <Bell className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-green-700">Your Stage</p>
              <p className="mt-1 text-sm text-green-900">{getTestingStageName()}</p>
            </div>
            <div className="p-3 bg-green-500 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.map((notification) => {
          if (userRole === 'pt-pretester') {
            const status = getPTPretesterStatus(notification);
            const styles = getStatusStyles(status);
            return (
              <Card
                key={notification.id}
                className={`p-3 transition-all border border-gray-100 shadow-sm ${styles.borderClass} ${styles.bgClass} hover:shadow-md`}
              >
                <div className="space-y-2.5">
                  {/* Notification Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-gray-900 m-0">
                        You have a new testing task assigned
                      </h3>
                      <span className="text-xs bg-slate-100 text-slate-800 font-mono font-bold px-2 py-0.5 rounded border border-slate-200 shadow-sm">
                        JOB ID: {notification.jobId}
                      </span>
                      <Badge className={`${styles.badgeClass} text-[10px] px-2 py-0.5 font-semibold rounded-md shadow-none`}>
                        {status}
                      </Badge>
                    </div>
                    
                    {!notification.isRead && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="h-7 text-xs px-2 text-gray-600 hover:text-gray-900 gap-1.5 border-gray-200"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Mark as Read
                      </Button>
                    )}
                  </div>

                  {/* Clean & Compact Info Layout with grid spacing */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-4 py-2 px-3 bg-white rounded border border-gray-100">
                    <div className="text-xs">
                      <span className="text-gray-400 font-medium">Client: </span>
                      <span className="font-semibold text-gray-800">{notification.clientName}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-gray-400 font-medium">Transformer: </span>
                      <span className="font-semibold text-gray-800">{notification.transformerType}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-gray-400 font-medium">Qty: </span>
                      <span className="font-semibold text-gray-850">
                        {notification.quantity} {notification.quantity === 1 ? 'Unit' : 'Units'}
                      </span>
                    </div>
                  </div>

                  {/* Footer (Timestamp and Action Buttons) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1.5">
                    {/* Improved visually lighter assignment / timestamp info */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                      <Clock className="w-3.5 h-3.5 text-gray-400 mr-0.5" />
                      <span>{formatPTTimestamp(notification.rawDate, notification.fromStage, notification.fromEmployee)}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        className="h-8 text-xs gap-1.5 px-3 border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"
                        onClick={() => onViewOrder && onViewOrder(notification.orderObjectId || notification.id)}
                      >
                        <Package className="w-3.5 h-3.5" />
                        View Order Details
                      </Button>
                      {status !== 'COMPLETED' && (
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1.5 px-3 bg-[#003a70] hover:bg-blue-900 text-white font-medium shadow-sm"
                          onClick={() => handleStartPTPretest(notification)}
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          {getStartButtonLabel(notification)}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          }

          // Otherwise keep unchanged for other modules/roles
          return (
            <Card
              key={notification.id}
              className={`p-4 ${!notification.isRead ? 'border-l-4 border-l-blue-600 bg-blue-50/30' : ''}`}
            >
              <div className="space-y-3">
                {/* Notification Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${!notification.isRead ? 'bg-blue-500' : 'bg-gray-400'}`}>
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          {/* <h3 className="text-gray-900 mb-1">{notification.message}</h3> */}
                          <h3 className="text-sm font-semibold text-gray-900 mb-0.5">You have a new testing task assigned</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs text-gray-600 font-medium">{notification.jobId}</p>
                          </div>
                        </div>
                        {!notification.isRead && (
                          <Badge className="bg-blue-600 text-white text-[10px] px-1.5 py-0 h-5">New</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span>From {notification.fromStage}: {notification.fromEmployee}</span>
                        <span>•</span>
                        <span>{notification.timestamp}</span>
                      </div>
                    </div>
                  </div>
                  {!notification.isRead && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="gap-1.5 ml-2 h-7 text-xs px-2"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Mark as Read
                    </Button>
                  )}
                </div>

                {/* Transformer Details */}
                <div className="p-3 bg-white rounded-md border border-gray-100 shadow-sm">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Client Name</p>
                      <p className="text-sm font-medium text-gray-900">{notification.clientName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Transformer</p>
                      <p className="text-sm font-medium text-gray-900">{notification.transformerName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Quantity</p>
                      <div className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{notification.quantity} units</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => onViewOrder && onViewOrder(notification.orderObjectId || notification.id)}
                  >
                    <Package className="w-4 h-4" />
                    View Order Details
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {notifications.length === 0 && (
        <Card className="p-12">
          <div className="text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No notifications</p>
            <p className="text-sm mt-1">New testing tasks will appear here</p>
          </div>
        </Card>
      )}
    </div>
  );
}

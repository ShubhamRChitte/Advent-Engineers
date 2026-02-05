import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { OrderDetailsDialog } from './OrderDetailsDialog';
import axios from 'axios';
import {
  Bell,
  Package,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  User,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

interface TaskNotification {
  _id: string; // Add _id because backend returns it
  id: string;
  orderId: string; // The Job ID usually
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
  isRead: boolean;
  priority: 'High' | 'Medium' | 'Low';

  // Extended fields for details view
  mountingDetails?: string;
  overallDimension?: string;
  nominalSystemVoltage?: number;
  burden?: number;
  accuracyClass?: string;
  ratio?: string[];
  coreDetails?: Array<{
    coreType: string;
    [key: string]: any;
  }>;
  ratedPrimaryCurrent?: number;
  ratedSecondaryCurrent?: number;
  isStandard?: string;
}

interface TesterNotificationsProps {
  userRole: string;
  userName: string;
}

export function TesterNotifications({ userRole, userName }: TesterNotificationsProps) {
  const [notifications, setNotifications] = useState<TaskNotification[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<TaskNotification | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

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

  useEffect(() => {
    axios
      .get("http://localhost:3002/api/assigneed_orders", { withCredentials: true })
      .then((res) => {
        // Map backend response if needed, or assume it matches partially
        // The backend returns full Order objects. We might need to adapt some fields if names don't match.
        // Assuming the backend 'orders' are close enough to TaskNotification.
        // We might need to ensure 'id' vs '_id' usages.
        setNotifications(res.data);
      })
      .catch((err) => {
        console.error("API ERROR:", err);
      });
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (notificationId: string) => {
    // In a real app, this would make an API call
    setNotifications(notifications.map(n =>
      (n.id === notificationId || n._id === notificationId) ? { ...n, isRead: true } : n
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const handleViewDetails = (order: TaskNotification) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
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
      <OrderDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        order={selectedOrder}
      />

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-red-700">High Priority</p>
              <h3 className="mt-1 text-red-900">
                {notifications.filter(n => n.priority === 'High').length}
              </h3>
            </div>
            <div className="p-3 bg-red-500 rounded-lg">
              <AlertCircle className="w-6 h-6 text-white" />
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
      <div className="space-y-4">
        {notifications.map((notification) => (
          <Card
            key={notification._id || notification.id}
            className={`p-6 ${!notification.isRead ? 'border-l-4 border-l-blue-600 bg-blue-50/30' : ''}`}
          >
            <div className="space-y-4">
              {/* Notification Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-lg ${!notification.isRead ? 'bg-blue-500' : 'bg-gray-400'}`}>
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-gray-900 mb-1">You have a new testing task assigned</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm text-gray-600">{notification.jobId}</p>
                          <span className="text-gray-400">•</span>
                          {/* Use _id or orderId if available as order identifier */}
                          <p className="text-sm text-gray-600">{notification.jobId}</p>
                          <Badge className={getPriorityColor(notification.priority)}>
                            {notification.priority} Priority
                          </Badge>
                        </div>
                      </div>
                      {!notification.isRead && (
                        <Badge className="bg-blue-600 text-white">New</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>From {notification.fromStage || 'Admin'}: {notification.fromEmployee || 'System'}</span>
                      <span>•</span>
                      <span>{notification.timestamp || new Date().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                {!notification.isRead && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAsRead(notification._id || notification.id)}
                    className="gap-2 ml-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark as Read
                  </Button>
                )}
              </div>

              {/* Transformer Details */}
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <h4 className="text-sm text-gray-700 mb-3">Transformer Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Client Name</p>
                    <p className="text-sm font-medium text-gray-900">{notification.clientName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Transformer</p>
                    <p className="text-sm font-medium text-gray-900">{notification.transformerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Quantity</p>
                    <div className="flex items-center gap-1">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{notification.quantity} units</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Type</p>
                    <p className="text-sm font-medium text-gray-900">{notification.transformerType}</p>
                  </div>
                </div>
              </div>

              {/* Deadline */}
              <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Deadline</h4>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-900">{new Date(notification.deadline).toLocaleDateString()}</span>
                      <Badge className="bg-orange-100 text-orange-700 border-orange-300">
                        {Math.ceil((new Date(notification.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              {notification.instructions && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Instructions & Notes</h4>
                      <p className="text-sm text-gray-700">{notification.instructions}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Button className="bg-blue-600 hover:bg-blue-700 gap-2" >
                  <FileText className="w-4 h-4" />
                  Start Testing
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handleViewDetails(notification)}
                >
                  <Package className="w-4 h-4" />
                  View Order Details
                </Button>
              </div>
            </div>
          </Card>
        ))}
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

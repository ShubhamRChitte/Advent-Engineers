<<<<<<< HEAD
import { useState, useEffect } from 'react';
import { OrderDetailsDialog, OrderDetails } from './OrderDetailsDialog';
=======
import { useState } from 'react';
import React, { useEffect } from 'react';
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
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
  User,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

<<<<<<< HEAD


interface TaskNotification {
  _id: string; // Backend _id
=======
interface TaskNotification {
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
  id: string;
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
  isRead: boolean;
  priority: 'High' | 'Medium' | 'Low';
<<<<<<< HEAD
  // Add other fields as they come from backend Order object
  orderDate?: string;
  status?: string;
=======
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
}

interface TesterNotificationsProps {
  userRole: string;
  userName: string;
}

export function TesterNotifications({ userRole, userName }: TesterNotificationsProps) {
<<<<<<< HEAD
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
=======
  // ... (existing code handles notifications loading) ...



  // ... (existing rendering code) ...

>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1

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

<<<<<<< HEAD
  const [notifications, setNotifications] = useState<TaskNotification[]>([]);

  useEffect(() => {
    axios
      .get("http://localhost:3002/api/assigneed_orders", { withCredentials: true })
      .then((res) => {
        setNotifications(res.data);
=======
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
  //     .get("http://localhost:3002/allorders")
  //     .then((res) => {
  //       setNotifications(res.data);
  //     })
  //     .catch((err) => {
  //       console.error("API ERROR:", err);
  //     });
  // }, []);



  useEffect(() => {
    axios
      .get("http://localhost:3002/api/assigneed_orders?type=active", { withCredentials: true })
      .then((res) => {
        // Map Order[] to TaskNotification[]
        const mappedNotifications: TaskNotification[] = res.data.map((order: any) => ({
          id: order._id,
          orderId: order.jobId, // redundancy for UI compatibility
          jobId: order.jobId,
          message: 'You have a new testing task assigned',
          clientName: order.clientName,
          transformerName: order.transformerName,
          transformerType: order.transformerType,
          quantity: order.quantity,
          deadline: order.deadline,
          instructions: order.instructions || 'Standard testing procedure.',
          fromStage: 'Admin', // Static for now, could be dynamic based on history
          fromEmployee: 'Admin',
          timestamp: new Date(order.createdAt).toLocaleString(),
          isRead: false, // Default to false since we don't track per-tester read status yet
          priority: order.priority || 'Medium'
        }));
        setNotifications(mappedNotifications);
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
      })
      .catch((err) => {
        console.error("API ERROR:", err);
      });
  }, []);

<<<<<<< HEAD
=======



>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(notifications.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

<<<<<<< HEAD
  const handleViewOrderDetails = (notification: TaskNotification) => {
    // Map notification to OrderDetails
    // Cast to unknown first to avoid partial overlap issues, although intersection is better.
    // relying on runtime availability of fields from backend
    const orderDetails: OrderDetails = {
      ...notification,
      instructions: notification.instructions || "",
    } as unknown as OrderDetails;

    setSelectedOrder(orderDetails);
    setIsDetailsOpen(true);
  };

=======
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
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
<<<<<<< HEAD
            key={notification._id || notification.id}
=======
            key={notification.id}
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
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
                        {/* <h3 className="text-gray-900 mb-1">{notification.message}</h3> */}
                        <h3 className="text-gray-900 mb-1">You have a new testing task assigned</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm text-gray-600">{notification.jobId}</p>
                          <span className="text-gray-400">•</span>
                          <p className="text-sm text-gray-600">{notification.orderId}</p>
                          <Badge className={getPriorityColor(notification.priority)}>
<<<<<<< HEAD
                            {notification.priority || 'Medium'} Priority
=======
                            {notification.priority} Priority
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
                          </Badge>
                        </div>
                      </div>
                      {!notification.isRead && (
                        <Badge className="bg-blue-600 text-white">New</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
<<<<<<< HEAD
                      <span>From {notification.fromStage || 'System'}: {notification.fromEmployee || 'Admin'}</span>
                      <span>•</span>
                      <span>{notification.timestamp || new Date().toLocaleDateString()}</span>
=======
                      <span>From {notification.fromStage}: {notification.fromEmployee}</span>
                      <span>•</span>
                      <span>{notification.timestamp}</span>
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
                    </div>
                  </div>
                </div>
                {!notification.isRead && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAsRead(notification.id)}
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
<<<<<<< HEAD
                <Button
                  className="bg-blue-600 hover:bg-blue-700 gap-2"
                  onClick={() => handleViewOrderDetails(notification)}
=======
                {/* <Button
                  className="bg-blue-600 hover:bg-blue-700 gap-2"
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
                >
                  <FileText className="w-4 h-4" />
                  Start Testing
                  <ChevronRight className="w-4 h-4" />
<<<<<<< HEAD
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handleViewOrderDetails(notification)}
                >
=======
                </Button> */}
                <Button variant="outline" className="gap-2">
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
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
<<<<<<< HEAD
      <OrderDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        order={selectedOrder}
      />
=======
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
    </div>
  );
}

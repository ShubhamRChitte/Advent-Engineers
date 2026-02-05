import { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { 
  Bell, 
  Package, 
  Users, 
  Calendar,
  Edit,
  CheckCircle,
  Clock,
  Zap,
  Shield,
  Award,
  User,
  ChevronRight,
  X
} from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
}

interface TestAssignment {
  testStage: 'Core Test' | 'Secondary Test' | 'After Primary Test' | 'Final Test';
  assignedEmployee: Employee;
  status: 'Pending' | 'In Progress' | 'Completed';
  icon: any;
  color: string;
}

interface OrderNotification {
  id: string;
  orderId: string;
  message: string;
  clientName: string;
  transformerName: string;
  transformerType: string;
  quantity: number;
  orderDate: string;
  addedBy: string;
  timestamp: string;
  isRead: boolean;
  isApproved: boolean;
  testAssignments: TestAssignment[];
}

export function NotificationsModule() {
  const [notifications, setNotifications] = useState<OrderNotification[]>([
    {
      id: '1',
      orderId: 'ORD-2024-007',
      message: 'A new order has been added',
      clientName: 'MSEB Power Distribution Ltd.',
      transformerName: 'Outdoor Epoxy Resin Cast CT',
      transformerType: 'Current Transformer',
      quantity: 45,
      orderDate: '2024-11-24',
      addedBy: 'Entry Operator',
      timestamp: '2024-11-24 09:30 AM',
      isRead: false,
      isApproved: false,
      testAssignments: [
        {
          testStage: 'Core Test',
          assignedEmployee: { id: '1', name: 'Rajesh Kumar', role: 'Core Tester', department: 'Testing' },
          status: 'Pending',
          icon: Zap,
          color: 'purple',
        },
        {
          testStage: 'Secondary Test',
          assignedEmployee: { id: '2', name: 'Priya Sharma', role: 'Secondary Tester', department: 'Testing' },
          status: 'Pending',
          icon: Shield,
          color: 'blue',
        },
        {
          testStage: 'After Primary Test',
          assignedEmployee: { id: '3', name: 'Amit Patel', role: 'After Primary Tester', department: 'Testing' },
          status: 'Pending',
          icon: Clock,
          color: 'orange',
        },
        {
          testStage: 'Final Test',
          assignedEmployee: { id: '4', name: 'Sunita Desai', role: 'Final Tester', department: 'Testing' },
          status: 'Pending',
          icon: Award,
          color: 'green',
        },
      ],
    },
    {
      id: '2',
      orderId: 'ORD-2024-008',
      message: 'A new order has been added',
      clientName: 'Tata Power Company',
      transformerName: 'Dead Tank Type-3',
      transformerType: 'Current Transformer',
      quantity: 30,
      orderDate: '2024-11-24',
      addedBy: 'Entry Operator',
      timestamp: '2024-11-24 11:15 AM',
      isRead: false,
      isApproved: false,
      testAssignments: [
        {
          testStage: 'Core Test',
          assignedEmployee: { id: '1', name: 'Rajesh Kumar', role: 'Core Tester', department: 'Testing' },
          status: 'Pending',
          icon: Zap,
          color: 'purple',
        },
        {
          testStage: 'Secondary Test',
          assignedEmployee: { id: '2', name: 'Priya Sharma', role: 'Secondary Tester', department: 'Testing' },
          status: 'Pending',
          icon: Shield,
          color: 'blue',
        },
        {
          testStage: 'After Primary Test',
          assignedEmployee: { id: '3', name: 'Amit Patel', role: 'After Primary Tester', department: 'Testing' },
          status: 'Pending',
          icon: Clock,
          color: 'orange',
        },
        {
          testStage: 'Final Test',
          assignedEmployee: { id: '4', name: 'Sunita Desai', role: 'Final Tester', department: 'Testing' },
          status: 'Pending',
          icon: Award,
          color: 'green',
        },
      ],
    },
    {
      id: '3',
      orderId: 'ORD-2024-006',
      message: 'A new order has been added',
      clientName: 'Gujarat Energy Transmission Corp.',
      transformerName: 'Live Tank Type CT',
      transformerType: 'Current Transformer',
      quantity: 25,
      orderDate: '2024-11-23',
      addedBy: 'Entry Operator',
      timestamp: '2024-11-23 02:45 PM',
      isRead: true,
      isApproved: false,
      testAssignments: [
        {
          testStage: 'Core Test',
          assignedEmployee: { id: '5', name: 'Vikram Singh', role: 'Core Tester', department: 'Testing' },
          status: 'Completed',
          icon: Zap,
          color: 'purple',
        },
        {
          testStage: 'Secondary Test',
          assignedEmployee: { id: '6', name: 'Anjali Mehta', role: 'Secondary Tester', department: 'Testing' },
          status: 'In Progress',
          icon: Shield,
          color: 'blue',
        },
        {
          testStage: 'After Primary Test',
          assignedEmployee: { id: '3', name: 'Amit Patel', role: 'After Primary Tester', department: 'Testing' },
          status: 'Pending',
          icon: Clock,
          color: 'orange',
        },
        {
          testStage: 'Final Test',
          assignedEmployee: { id: '4', name: 'Sunita Desai', role: 'Final Tester', department: 'Testing' },
          status: 'Pending',
          icon: Award,
          color: 'green',
        },
      ],
    },
  ]);

  const [selectedNotification, setSelectedNotification] = useState<OrderNotification | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<TestAssignment | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  // Available employees by role
  const availableEmployees: { [key: string]: Employee[] } = {
    'Core Test': [
      { id: '1', name: 'Rajesh Kumar', role: 'Core Tester', department: 'Testing' },
      { id: '5', name: 'Vikram Singh', role: 'Core Tester', department: 'Testing' },
      { id: '7', name: 'Rahul Verma', role: 'Core Tester', department: 'Testing' },
    ],
    'Secondary Test': [
      { id: '2', name: 'Priya Sharma', role: 'Secondary Tester', department: 'Testing' },
      { id: '6', name: 'Anjali Mehta', role: 'Secondary Tester', department: 'Testing' },
      { id: '8', name: 'Pooja Reddy', role: 'Secondary Tester', department: 'Testing' },
    ],
    'After Primary Test': [
      { id: '3', name: 'Amit Patel', role: 'After Primary Tester', department: 'Testing' },
      { id: '9', name: 'Karan Joshi', role: 'After Primary Tester', department: 'Testing' },
    ],
    'Final Test': [
      { id: '4', name: 'Sunita Desai', role: 'Final Tester', department: 'Testing' },
      { id: '10', name: 'Neha Gupta', role: 'Final Tester', department: 'Testing' },
    ],
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(notifications.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    ));
  };

  const handleEditAssignment = (notification: OrderNotification, assignment: TestAssignment) => {
    setSelectedNotification(notification);
    setEditingAssignment(assignment);
    setSelectedEmployee(assignment.assignedEmployee.id);
    setIsEditDialogOpen(true);
  };

  const handleSaveAssignment = () => {
    if (!selectedNotification || !editingAssignment || !selectedEmployee) return;

    const newEmployee = availableEmployees[editingAssignment.testStage].find(
      e => e.id === selectedEmployee
    );

    if (!newEmployee) return;

    setNotifications(notifications.map(n => {
      if (n.id === selectedNotification.id) {
        return {
          ...n,
          testAssignments: n.testAssignments.map(a => 
            a.testStage === editingAssignment.testStage
              ? { ...a, assignedEmployee: newEmployee }
              : a
          ),
        };
      }
      return n;
    }));

    setIsEditDialogOpen(false);
    setEditingAssignment(null);
    setSelectedEmployee('');
  };

  const handleApproveOrder = (notificationId: string) => {
    setNotifications(notifications.map(n => 
      n.id === notificationId ? { ...n, isApproved: true, isRead: true } : n
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'In Progress':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getTestColor = (color: string) => {
    switch (color) {
      case 'purple':
        return 'bg-purple-500';
      case 'blue':
        return 'bg-blue-500';
      case 'orange':
        return 'bg-orange-500';
      case 'green':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2>Notifications & Updates</h2>
          <p className="text-gray-500 mt-1">New orders and employee assignments</p>
        </div>
        <Badge className="bg-blue-600 text-white px-4 py-2 text-sm">
          <Bell className="w-4 h-4 mr-2" />
          {unreadCount} New
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-blue-700">Total Notifications</p>
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
              <p className="text-sm text-green-700">New Orders</p>
              <h3 className="mt-1 text-green-900">
                {notifications.filter(n => !n.isRead).length}
              </h3>
            </div>
            <div className="p-3 bg-green-500 rounded-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.map((notification) => (
          <Card 
            key={notification.id} 
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
                        <h3 className="text-gray-900 mb-1">{notification.message}</h3>
                        <p className="text-sm text-gray-600">{notification.orderId}</p>
                      </div>
                      {!notification.isRead && (
                        <Badge className="bg-blue-600 text-white">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      Added by {notification.addedBy} • {notification.timestamp}
                    </p>
                  </div>
                </div>
                {!notification.isRead && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark as Read
                  </Button>
                )}
              </div>

              {/* Order Details */}
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <h4 className="text-sm text-gray-700 mb-3">Order Details</h4>
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
                    <p className="text-xs text-gray-500 mb-1">Order Date</p>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{notification.orderDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Test Assignments */}
              <div>
                <h4 className="text-sm text-gray-700 mb-3">Employee Assignments</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {notification.testAssignments.map((assignment, index) => {
                    const Icon = assignment.icon;
                    return (
                      <div 
                        key={index}
                        className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 ${getTestColor(assignment.color)} rounded-lg`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{assignment.testStage}</p>
                              <Badge className={`mt-1 ${getStatusColor(assignment.status)}`}>
                                {assignment.status}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditAssignment(notification, assignment)}
                            className="gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            Change
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <User className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{assignment.assignedEmployee.name}</p>
                            <p className="text-xs text-gray-500">{assignment.assignedEmployee.role}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Approval Section */}
              {!notification.isApproved ? (
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Order Approval Required</h4>
                      <p className="text-sm text-gray-600">
                        This order will be confirmed and processed after your approval.
                      </p>
                    </div>
                    <Button
                      onClick={() => handleApproveOrder(notification.id)}
                      className="bg-green-600 hover:bg-green-700 gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve Order
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border-2 border-green-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <h4 className="text-sm font-medium text-green-900">Order Approved</h4>
                      <p className="text-sm text-green-700">
                        This order has been confirmed and is being processed.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {notifications.length === 0 && (
        <Card className="p-12">
          <div className="text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No notifications</p>
            <p className="text-sm mt-1">New order notifications will appear here</p>
          </div>
        </Card>
      )}

      {/* Edit Assignment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              Change Employee Assignment
            </DialogTitle>
          </DialogHeader>
          {editingAssignment && selectedNotification && (
            <div className="space-y-4 mt-4">
              {/* Test Stage Info */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {(() => {
                    const Icon = editingAssignment.icon;
                    return <Icon className="w-5 h-5 text-blue-600" />;
                  })()}
                  <h3 className="text-gray-900">{editingAssignment.testStage}</h3>
                </div>
                <p className="text-sm text-gray-600">Order: {selectedNotification.orderId}</p>
                <p className="text-sm text-gray-600">Client: {selectedNotification.clientName}</p>
              </div>

              {/* Current Assignment */}
              <div>
                <label className="text-sm text-gray-700 mb-2 block">Current Employee</label>
                <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {editingAssignment.assignedEmployee.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {editingAssignment.assignedEmployee.role}
                    </p>
                  </div>
                </div>
              </div>

              {/* New Assignment Selection */}
              <div>
                <label className="text-sm text-gray-700 mb-2 block">Select New Employee</label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose an employee...</option>
                  {availableEmployees[editingAssignment.testStage].map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} - {employee.role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2"
                  onClick={handleSaveAssignment}
                  disabled={!selectedEmployee}
                >
                  <CheckCircle className="w-4 h-4" />
                  Save Assignment
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingAssignment(null);
                    setSelectedEmployee('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
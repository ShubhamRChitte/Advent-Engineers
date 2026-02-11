import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
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
  _id: string; // Changed to match API
  fullName: string; // Changed to match API
  designation: string; // Changed to match API
  department: string;
}

interface TestAssignment {
  testStage: 'Core Test' | 'Secondary Test' | 'After Primary Test' | 'Final Test';
  assignedEmployees: Employee[]; // Changed to Array to support split assignments
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
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Fetch Data
  useEffect(() => {
    fetchTesters();
    fetchNotifications();
  }, []);

  const fetchTesters = async () => {
    try {
      const response = await axios.get('http://localhost:3002/auth/testers');
      if (response.data.success) {
        setEmployees(response.data.users);
      }
    } catch (error) {
      console.error("Failed to fetch testers", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('http://localhost:3002/api/admin/notifications', {
        withCredentials: true
      });

      const pendingOrders = response.data || [];
      const transformed: OrderNotification[] = pendingOrders.map((order: any) => ({
        id: order._id,
        orderId: order.jobId,
        message: 'A new order has been added',
        clientName: order.clientName,
        transformerName: `Transformer (x${order.noOfCores || order.numberOfCores || '?'})`,
        transformerType: order.isStandard,
        quantity: order.quantity || 1,
        orderDate: new Date(order.createdAt).toLocaleDateString(),
        addedBy: 'Entry Operator',
        timestamp: new Date(order.createdAt).toLocaleString(),
        isRead: order.isRead || false,
        isApproved: order.status !== 'Pending Approval',
        testAssignments: (() => {
          const stages = ['Core Test', 'Secondary Test', 'After Primary Test', 'Final Test'] as const;
          const stageMap: Record<string, string> = {
            'core': 'Core Test',
            'secondary': 'Secondary Test',
            'primary': 'After Primary Test',
            'final': 'Final Test'
          };

          return stages.map(stageName => {
            // Find ALL assignments for this stage (Split Assignments Support)
            const stageKey = Object.keys(stageMap).find(key => stageMap[key] === stageName);
            const foundAssignments = order.assignments?.filter((a: any) => stageMap[a.stage] === stageName) || [];

            let assignedEmps: Employee[] = [];

            if (foundAssignments.length > 0) {
              assignedEmps = foundAssignments.map((a: any) => ({
                _id: a.testerName, // Using name as ID if ID not present, mainly for display
                fullName: a.testerName,
                designation: stageName.replace('Test', 'Tester'),
                department: 'Testing'
              }));
            } else {
              assignedEmps = [{ _id: 'unassigned', fullName: 'Unassigned', designation: 'Tester', department: 'Testing' }];
            }

            let icon = Zap;
            let color = 'purple';
            if (stageName === 'Secondary Test') { icon = Shield; color = 'blue'; }
            if (stageName === 'After Primary Test') { icon = Clock; color = 'orange'; }
            if (stageName === 'Final Test') { icon = Award; color = 'green'; }

            return {
              testStage: stageName,
              assignedEmployees: assignedEmps,
              status: foundAssignments.length > 0 ? 'Assigned' : 'Pending',
              icon,
              color
            };
          });
        })()
      }));
      setNotifications(transformed);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  const [selectedNotification, setSelectedNotification] = useState<OrderNotification | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<TestAssignment | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(notifications.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    ));
  };

  const handleEditAssignment = (notification: OrderNotification, assignment: TestAssignment) => {
    setSelectedNotification(notification);
    setEditingAssignment(assignment);
    // If multiple, just select the first one or empty? Default to empty to force selection
    setSelectedEmployee('');
    setIsEditDialogOpen(true);
  };

  // Save Assignment Change
  const handleSaveAssignment = async () => {
    if (!selectedNotification || !editingAssignment || !selectedEmployee) return;

    const newEmployee = employees.find(e => e._id === selectedEmployee);

    if (!newEmployee) return;

    const stageKeyMap: Record<string, string> = {
      'Core Test': 'core_tester',
      'Secondary Test': 'secondary_tester',
      'After Primary Test': 'primary_tester',
      'Final Test': 'final_tester'
    };

    const assignKey = stageKeyMap[editingAssignment.testStage];

    // NOTE: This currently updates the "Legacy" single assignment field if the backend supports it,
    // OR it might need to update the array. 
    // Given the previous code used `assignments.${assignKey}`, it likely targets the object structure.
    // If we want to support split assignments fully in EDIT, we'd need a more complex UI.
    // For now, this acts as "Override all with this single tester" or "Add to legacy field".

    if (assignKey) {
      try {
        await axios.put(`http://localhost:3002/api/orders/${selectedNotification.id}`, {
          [`assignments.${assignKey}`]: newEmployee.fullName // Store Name
        }, { withCredentials: true });

        toast.success("Assignment updated!");
      } catch (e) {
        console.error("Failed to update assignment", e);
        toast.error("Failed to update assignment");
      }
    }

    // Optimistic Update
    setNotifications(notifications.map(n => {
      if (n.id === selectedNotification.id) {
        return {
          ...n,
          testAssignments: n.testAssignments.map(a =>
            a.testStage === editingAssignment.testStage
              ? { ...a, assignedEmployees: [newEmployee] } // Replaces list with single new user
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

  const handleApproveOrder = async (notificationId: string) => {
    try {
      const response = await axios.put(`http://localhost:3002/api/orders/${notificationId}/approve`, {}, {
        withCredentials: true
      });

      if (response.data.success) {
        toast.success("Order approved and transformers generated!");
        setNotifications(notifications.map(n =>
          n.id === notificationId ? { ...n, isApproved: true, isRead: true } : n
        ));
        fetchNotifications(); // Refresh entire list
      }
    } catch (error: any) {
      console.error("Approval failed", error);
      toast.error("Approval failed: " + (error.response?.data?.message || error.message));
    }
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

                        {/* List all assigned employees */}
                        <div className="space-y-1">
                          {assignment.assignedEmployees.map((emp, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                              <User className="w-4 h-4 text-gray-500" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{emp.fullName}</p>
                                <p className="text-xs text-gray-500">{emp.designation}</p>
                              </div>
                            </div>
                          ))}
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

              {/* Current Assignments */}
              <div>
                <label className="text-sm text-gray-700 mb-2 block">Current Employee(s)</label>
                <div className="space-y-2">
                  {editingAssignment.assignedEmployees.map((emp, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                      <User className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {emp.fullName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {emp.designation}
                        </p>
                      </div>
                    </div>
                  ))}
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
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.fullName} - {employee.designation}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Note: This will override existing assignments for this stage (Legacy Mode).
                </p>
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
import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Eye, PlayCircle, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import { User } from '../../App';

interface UserReading {
  coreId: string;
  date: string;
  result: 'P' | 'F';
  type: string;
  readingValue?: string;
}

interface Order {
  _id: string;
  jobId: string;
  clientName: string;
  transformerType: string;
  quantity: number;
  transformerQuantity?: number; // fallback
  assignedDate?: string;
  createdAt: string;
  status: string;
  priority: string;
  deadline: string;
  currentStage: string;
  assignments: any; // Allow both Object (legacy) and Array (new)
  userStats?: {
    testsCompleted: number;
    passed: number;
    failed: number;
    userReadings: UserReading[];
  };
  assignedUnitIds?: string[]; // Added for granular filtering
}

interface CoreOrdersListProps {
  onStartTesting: (order: any) => void;
  user?: User;
  type?: 'active' | 'history';
}

export function CoreOrdersList({ onStartTesting, user, type = 'active' }: CoreOrdersListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [type]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3002/api/assigneed_orders', {
        params: { type },
        withCredentials: true
      });
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      case 'Core Testing In Progress': return 'bg-blue-100 text-blue-700';
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Core Testing Completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-700';
      case 'Medium': return 'bg-orange-100 text-orange-700';
      case 'Low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Check if the current user is the ACTIVE assigned tester
  const isAssignedTester = (order: Order) => {
    if (!user || !order.assignments) return false;

    // Check Legacy Object Format
    if (!Array.isArray(order.assignments)) {
      return order.assignments.core_tester === user.name;
    }

    // Check New Array Format
    return order.assignments.some((a: any) =>
      a.stage === 'core' && a.testerName === user.name
    );
  };

  // Check if order is editable
  const isEditable = (order: Order) => {
    if (type === 'history') return false; // History is always read-only
    const isActive = order.currentStage === 'core' &&
      order.status !== 'Completed' &&
      order.status !== 'Core Testing Completed';
    return isAssignedTester(order) && isActive;
  };

  const handleAction = (order: Order) => {
    const editable = isEditable(order);
    // Pass extra flag to indicate read-only mode if not editable
    onStartTesting({ ...order, isReadOnly: !editable });
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2>{type === 'history' ? 'Order History' : 'Assigned Orders'}</h2>
        <p className="text-gray-500 mt-1">
          {type === 'history'
            ? 'View your completed tests and audit logs'
            : 'View and start testing on assigned core orders'}
        </p>
      </div>

      {/* Orders Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-8"></th>{/* Expand chevron */}
                <th className="text-left p-4 text-sm">Job ID</th>
                <th className="text-left p-4 text-sm">Client</th>
                <th className="text-left p-4 text-sm">Type</th>
                <th className="text-center p-4 text-sm">Tests Completed</th>{/* Personalized */}
                <th className="text-center p-4 text-sm">Pass / Fail</th>{/* Personalized */}
                <th className="text-left p-4 text-sm">Status</th>
                <th className="text-center p-4 text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const isExpanded = expandedOrderId === order._id;
                const stats = order.userStats || { testsCompleted: 0, passed: 0, failed: 0, userReadings: [] };

                return (
                  <>
                    <tr key={order._id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-gray-50' : ''}`}>
                      <td className="p-4 text-center">
                        <Button variant="ghost" size="sm" onClick={() => toggleExpand(order._id)} className="h-8 w-8 p-0">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </td>
                      <td className="p-4 font-medium">{order.jobId}</td>
                      <td className="p-4 text-sm">{order.clientName}</td>
                      <td className="p-4 text-sm">{order.transformerType}</td>

                      {/* Personalized Stats */}
                      <td className="p-4 text-center">
                        <div className="font-medium text-gray-900">{stats.testsCompleted}</div>
                        <div className="text-xs text-gray-500">tests by you</div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-green-600 font-medium">{stats.passed}</span>
                          <span className="text-gray-300">/</span>
                          <span className="text-red-600 font-medium">{stats.failed}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-center">
                          {isEditable(order) ? (
                            <Button
                              size="sm"
                              onClick={() => handleAction(order)}
                              className="bg-[#003a70] hover:bg-[#002850]"
                            >
                              <PlayCircle className="w-4 h-4 mr-2" />
                              Start
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(order)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* EXPANDED ROW - AUDIT VIEW */}
                    {isExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan={8} className="p-4 pl-12">
                          <div className="bg-white rounded border border-gray-200 overflow-hidden">
                            <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 text-xs font-semibold text-gray-600">
                              My Test History (Ordered by Date)
                            </div>
                            {stats.userReadings.length > 0 ? (
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-gray-100">
                                    <th className="p-2 text-left w-32">Date</th>
                                    <th className="p-2 text-left">Core ID</th>
                                    <th className="p-2 text-left">Type</th>
                                    <th className="p-2 text-left">Readings</th>
                                    <th className="p-2 text-left">Result</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {stats.userReadings.map((reading, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 last:border-0">
                                      <td className="p-2 text-gray-600">{new Date(reading.date).toLocaleDateString('en-GB')}</td>
                                      <td className="p-2 font-mono text-gray-700">{reading.coreId}</td>
                                      <td className="p-2 text-gray-600">{reading.type}</td>
                                      <td className="p-2 text-gray-600 font-mono text-xs">{reading.readingValue || '-'}</td>
                                      <td className="p-2">
                                        {reading.result === 'P' ? (
                                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px] px-1.5 flex w-fit gap-1 items-center">
                                            <CheckCircle className="w-3 h-3" /> Pass
                                          </Badge>
                                        ) : (
                                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-[10px] px-1.5 flex w-fit gap-1 items-center">
                                            <XCircle className="w-3 h-3" /> Fail
                                          </Badge>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <div className="p-4 text-center text-gray-500 text-sm">
                                No test history found for you on this order.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}

              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    No assigned orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

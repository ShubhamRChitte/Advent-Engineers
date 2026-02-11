import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { PlayCircle, Eye, Loader2 } from 'lucide-react';
import axios from 'axios';

interface Order {
  _id: string; // Updated to match backend
  jobId: string;
  clientName: string;
  quantity: number;
  transformerQuantity?: number;
  assignedDate: string;
  deadline: string;
  status: string;
  priority: string;
  assignedUnitIds?: string[];
  transformerCount?: number; // legacy support if needed
  client?: string; // legacy support if needed
}

interface FinalOrdersListProps {
  onStartTesting: (order: Order) => void;
}

export function FinalOrdersList({ onStartTesting }: FinalOrdersListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Ensure we are hitting the correct endpoint. 
      // Assuming the backend handles "Final" stage filtering based on the logged-in user's role 
      // or returns all assigned orders which we might need to filter if the backend doesn't.
      // For now, mirroring SecondaryOrdersList behavior.
      const response = await axios.get("http://localhost:3002/api/assigneed_orders", {
        withCredentials: true
      });
      setOrders(response.data);
      setError(null);
    } catch (err) {
      console.error("API ERROR:", err);
      setError("Failed to fetch assigned orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-700';
      case 'in-testing': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low': return 'bg-green-100 text-green-700';
      case 'Medium': return 'bg-orange-100 text-orange-700';
      case 'High': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading final testing orders...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        {error}
        <Button variant="link" onClick={fetchOrders}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2>Assigned Orders</h2>
        <p className="text-gray-500 mt-1">View and start final testing on assigned orders</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-600">Assigned Orders</p>
          <p className="text-2xl mt-1 text-blue-700">
            {orders.length}
          </p>
        </Card>
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <p className="text-sm text-yellow-600">In Progress</p>
          <p className="text-2xl mt-1 text-yellow-700">
            {orders.filter(o => o.status === 'in-testing').length}
          </p>
        </Card>
        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-sm text-green-600">Completed</p>
          <p className="text-2xl mt-1 text-green-700">
            {orders.filter(o => o.status === 'completed').length}
          </p>
        </Card>
      </div>

      {/* Orders Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 text-sm">Job ID</th>
                <th className="text-left p-4 text-sm">Client</th>
                <th className="text-center p-4 text-sm">Assigned / Total</th>
                <th className="text-left p-4 text-sm">Deadline</th>
                <th className="text-left p-4 text-sm">Status</th>
                <th className="text-left p-4 text-sm">Priority</th>
                <th className="text-center p-4 text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((order) => {
                  const totalQty = order.quantity || order.transformerQuantity || order.transformerCount || 0;
                  const assignedQty = order.assignedUnitIds ? order.assignedUnitIds.length : totalQty;

                  return (
                    <tr key={order._id || order.jobId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4 font-medium">{order.jobId}</td>
                      <td className="p-4">{order.clientName || order.client}</td>
                      <td className="p-4 text-center">
                        <Badge variant="outline" className="bg-blue-50">
                          {assignedQty} / {totalQty}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {order.deadline && !isNaN(new Date(order.deadline).getTime())
                          ? new Date(order.deadline).toLocaleDateString()
                          : (order.assignedDate ? new Date(order.assignedDate).toLocaleDateString() : 'N/A')}
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={getPriorityColor(order.priority)}>
                          {order.priority}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            onClick={() => onStartTesting(order)}
                            className="bg-[#003a70] hover:bg-[#002850]"
                          >
                            <PlayCircle className="w-4 h-4 mr-2" />
                            Start Testing
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    No assigned final orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Info Box */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white">i</span>
          </div>
          <div>
            <h4 className="mb-1">Final Testing</h4>
            <p className="text-sm text-gray-700">
              This is the final stage of transformer testing. Complete all required tests including
              Polarity Testing, Meggar Test, H.V. Tests, O.V.I.T. Test, and Accuracy Test for each transformer.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { PlayCircle } from 'lucide-react';

interface Order {
  _id: string;
  jobId: string;
  clientName: string;
  transformerType: string;
  quantity: number;
  status: string;
  priority: string;
}

interface PTAssignedOrdersProps {
  onStartTesting?: (order: any) => void;
}

export function PTAssignedOrders({ onStartTesting }: PTAssignedOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3002/api/assigneed_orders', {
        params: { type: 'active' },
        withCredentials: true
      });
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching PT orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-700';
    if (status.includes('Progress')) return 'bg-blue-100 text-blue-700';
    if (status.includes('Completed')) return 'bg-green-100 text-green-700';
    return 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading your assigned PT orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2>Assigned PT Orders</h2>
        <p className="text-gray-500 mt-1">View your assigned PT orders</p>
      </div>
      
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Job ID</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Client</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Type</th>
                <th className="text-center p-4 text-sm font-medium text-gray-600">Quantity</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                <th className="text-center p-4 text-sm font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-medium">{order.jobId}</td>
                  <td className="p-4 text-sm">{order.clientName}</td>
                  <td className="p-4 text-sm">{order.transformerType}</td>
                  <td className="p-4 text-center text-sm">{order.quantity}</td>
                  <td className="p-4">
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center">
                      <Button 
                        size="sm" 
                        className="bg-[#003a70] hover:bg-[#002850]"
                        onClick={() => onStartTesting && onStartTesting(order)}
                        disabled={order.status.includes('Completed')}
                      >
                        <PlayCircle className="w-4 h-4 mr-2" />
                        {order.status.includes('Completed') ? 'Completed' : 'Start Testing'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No assigned PT orders found.
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

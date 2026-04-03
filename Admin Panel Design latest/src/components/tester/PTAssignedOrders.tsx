import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { PlayCircle, Eye } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Use the stage-unrestricted endpoint so we see all PT orders regardless of
      // which stage the transformers are currently at.
      const response = await axios.get('http://localhost:3002/api/heating-record/assigned-orders?type=PT', {
        withCredentials: true
      });

      const allOrders: Order[] = response.data.success ? response.data.orders : [];

      if (activeTab === 'active') {
        // Show orders NOT yet fully completed
        setOrders(allOrders.filter(o =>
          !o.status.includes('PT Testing Completed')
        ));
      } else {
        // Show fully completed PT testing orders
        setOrders(allOrders.filter(o =>
          o.status.includes('PT Testing Completed') || o.status.includes('Completed')
        ));
      }
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
      <div className={`flex justify-between items-center p-6 rounded-xl border shadow-sm transition-colors duration-300 ${activeTab === 'completed' ? 'bg-green-50/50 border-green-200' : 'bg-gray-50/50 border-gray-200'}`}>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight uppercase">Assigned PT Orders</h2>
          <p className="text-gray-600 mt-2 text-base">Select your active tasks or review completed ones.</p>
        </div>
        <div className="flex space-x-3 bg-white/60 p-1.5 rounded-xl">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide uppercase transition-all duration-200 ${
              activeTab === 'active' 
                ? 'bg-white text-[#003a70] shadow-md border-b-2 border-[#003a70]' 
                : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
            }`}
          >
            Assigned Orders
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide uppercase transition-all duration-200 ${
              activeTab === 'completed' 
                ? 'bg-green-100 text-green-800 shadow-md border-b-2 border-green-600' 
                : 'text-gray-500 hover:text-green-700 hover:bg-green-50/50'
            }`}
          >
            Completed Orders
          </button>
        </div>
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
                        className={order.status.includes('Completed') ? "bg-green-600 hover:bg-green-700" : "bg-[#003a70] hover:bg-[#002850]"}
                        onClick={() => onStartTesting && onStartTesting(order)}
                      >
                        {order.status.includes('Completed') ? <Eye className="w-4 h-4 mr-2" /> : <PlayCircle className="w-4 h-4 mr-2" />}
                        {order.status.includes('Completed') ? 'View / Edit Report' : 'Start Testing'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    {activeTab === 'active' ? 'No assigned PT orders found.' : 'No completed PT orders found.'}
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

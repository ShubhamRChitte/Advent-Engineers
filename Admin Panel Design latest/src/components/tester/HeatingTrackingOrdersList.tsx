import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { PlayCircle, ChevronDown, ChevronUp, Search, Filter, Loader2 } from 'lucide-react';
import axios from 'axios';
import { User } from '../../App';
import { Order } from './HeatingTrackingModule';

interface HeatingTrackingOrdersListProps {
  onStartTesting: (order: Order) => void;
  user?: User;
}

export function HeatingTrackingOrdersList({ onStartTesting, user }: HeatingTrackingOrdersListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState<'assigned' | 'completed'>('assigned');
  const [completedOrderIds, setCompletedOrderIds] = useState<string[]>([]);
  
  useEffect(() => {
    fetchOrders();
  }, [currentTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const endpoint = currentTab === 'assigned' ? 'orders' : 'completed';
      const response = await axios.get(`http://localhost:3002/api/heating-record/${endpoint}`, {
        withCredentials: true
      });
      
      const eligibleOrders = response.data.orders || [];
      setOrders(eligibleOrders);
      setCompletedOrderIds([]); // No longer needed as separate array
    } catch (error) {
      console.error("Error fetching heating orders:", error);
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

  const displayedOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (order.jobId || '').toLowerCase().includes(q) ||
      (order.clientName || '').toLowerCase().includes(q) ||
      (order.transformerType || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2>Heating Section Tracking</h2>
          <p className="text-gray-500 mt-1">
            View orders and select individual transformers to record heating data.
          </p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setCurrentTab('assigned')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              currentTab === 'assigned' 
                ? 'bg-white shadow-sm text-gray-900 border border-gray-200' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Active Testing
          </button>
          <button
            onClick={() => setCurrentTab('completed')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              currentTab === 'completed' 
                ? 'bg-white shadow-sm text-gray-900 border border-gray-200' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Completed Testing
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search by Job ID, Client, or Type..."
            className="pl-9 w-full bg-white shadow-sm border-gray-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card className="overflow-hidden border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#003a70] text-white">
              <tr>
                <th className="text-left p-4 text-sm font-medium">Job ID</th>
                <th className="text-left p-4 text-sm font-medium">Client</th>
                <th className="text-left p-4 text-sm font-medium">Type & Voltage</th>
                <th className="text-left p-4 text-sm font-medium">Total Qty</th>
                <th className="text-left p-4 text-sm font-medium">Status</th>
                <th className="text-center p-4 text-sm font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedOrders.length > 0 ? (
                displayedOrders.map((order) => (
                  <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold">{order.jobId}</td>
                    <td className="p-4 text-sm">{order.clientName}</td>
                    <td className="p-4">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-semibold">
                        {order.nominalSystemVoltage}KV {order.transformerType}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-center font-medium">{order.quantity}</td>
                    <td className="p-4">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status || 'Pending'}
                      </Badge>
                    </td>
                    <td className="p-4 text-center">
                      <Button
                        size="sm"
                        onClick={() => onStartTesting(order)}
                        className={currentTab === 'completed' ? "bg-green-600 hover:bg-green-700" : "bg-[#003a70] hover:bg-[#002850]"}
                      >
                        <PlayCircle className="w-4 h-4 mr-2" />
                        {currentTab === 'completed' ? 'View Details' : 'Start'}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No matching orders found.
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

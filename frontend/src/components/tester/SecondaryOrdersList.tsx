import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { PlayCircle, Search } from 'lucide-react';
import axios from '@/utils/axiosConfig';

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
  assignedUnitIds?: string[]; // Added
}

interface SecondaryOrdersListProps {
  onStartTesting: (order: Order) => void;
  onViewReports?: (order: Order) => void;
  refreshTrigger?: number; // Added to trigger re-fetch
}

export function SecondaryOrdersList({ onStartTesting, refreshTrigger = 0 }: SecondaryOrdersListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
  }, [refreshTrigger]);

  const fetchOrders = async () => {
    try {
      // The backend /assigneed_orders route automatically filters by the user's role (secondary)
      // and finding orders in the 'secondary' stage.
      const response = await axios.get(`/assigneed_orders?type=active`, {
        withCredentials: true
      });
      setOrders(response.data);
    } catch (err) {
      console.error("API ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase().trim();
    const status = order.status || '';

    let matchesSearch = true;
    if (q) {
      const normalJobId = (order.jobId || '').toLowerCase().replace(/\s+/g, '');
      const normalQuery = q.replace(/\s+/g, '');

      const extractedJobMatch = q.match(/job-?\d{4}-?\d{1,4}/i)?.[0];
      const isTransformerSearch = q.startsWith('tr-') && q.includes(normalJobId);

      const jobMatch = normalJobId.includes(normalQuery) ||
        (normalQuery.length > 5 && normalJobId.length > 0 && normalQuery.includes(normalJobId)) ||
        (extractedJobMatch && normalJobId.includes(extractedJobMatch.toLowerCase().replace(/\s+/g, '')));

      matchesSearch = jobMatch || isTransformerSearch || (order.clientName || '').toLowerCase().includes(q);
    }

    if (selectedStatus === 'all') return matchesSearch;
    if (selectedStatus === 'assigned') return matchesSearch && (status === 'assigned' || status === 'assigned to Secondary');
    if (selectedStatus === 'in-testing') return matchesSearch && status === 'in-testing';
    if (selectedStatus === 'completed') return matchesSearch && status === 'completed';
    return matchesSearch && status === selectedStatus;
  });

  const statusCounts = {
    all: orders.length,
    assigned: orders.filter((o) => (o.status || '') === 'assigned' || (o.status || '') === 'assigned to Secondary').length,
    inTesting: orders.filter((o) => (o.status || '') === 'in-testing').length,
    completed: orders.filter((o) => (o.status || '') === 'completed').length,
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading secondary orders...</div>;
  }

  return (
    <div className="space-y-6">


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedStatus('all')}>
          <p className="text-sm text-gray-600">All Orders</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{statusCounts.all}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedStatus('assigned')}>
          <p className="text-sm text-gray-600">Active / Assigned</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{statusCounts.assigned}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedStatus('in-testing')}>
          <p className="text-sm text-gray-600">In Testing</p>
          <p className="text-2xl font-bold text-purple-700 mt-1">{statusCounts.inTesting}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-300 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedStatus('completed')}>
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{statusCounts.completed}</p>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search by Job ID or Transformer ID..."
            className="pl-9 w-full bg-white shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
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
                <th className="text-left p-4 text-sm">Order Date</th>
                <th className="text-center p-4 text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const totalQty = order.quantity || order.transformerQuantity || 0;
                  const assignedQty = order.assignedUnitIds ? order.assignedUnitIds.length : totalQty;

                  return (
                    <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4 font-medium">{order.jobId}</td>
                      <td className="p-4">{order.clientName}</td>
                      <td className="p-4 text-center">
                        <Badge variant="outline" className="bg-blue-50">
                          {assignedQty} / {totalQty}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm">
                        {new Date((order as any).createdAt || order.assignedDate).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => onStartTesting(order)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <PlayCircle className="w-4 h-4 mr-2" />
                            Start / Continue
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No assigned secondary orders found.
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

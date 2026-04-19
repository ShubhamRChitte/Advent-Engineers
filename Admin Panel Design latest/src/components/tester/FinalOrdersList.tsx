import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { PlayCircle, Loader2, Search } from 'lucide-react';
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
  onViewReports?: (order: Order) => void;
}

export function FinalOrdersList({ onStartTesting }: FinalOrdersListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

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
      const response = await axios.get("http://localhost:5000/api/assigneed_orders", {
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

      matchesSearch = jobMatch || isTransformerSearch || (order.clientName || order.client || '').toLowerCase().includes(q);
    }

    const normalizedStatus = (order.status || '').toLowerCase();
    const isCompleted = normalizedStatus === 'completed' || normalizedStatus === 'shipped';

    if (selectedStatus === 'all') return matchesSearch;
    if (selectedStatus === 'assigned') return matchesSearch && !isCompleted;
    if (selectedStatus === 'in-testing') return matchesSearch && !isCompleted;
    if (selectedStatus === 'completed') return matchesSearch && isCompleted;
    return matchesSearch && (status === selectedStatus.toLowerCase());
  });

  const statusCounts = {
    all: orders.length,
    assigned: orders.filter((o) => (o.status || '').toLowerCase() !== 'completed' && (o.status || '').toLowerCase() !== 'shipped').length,
    inTesting: orders.filter((o) => (o.status || '').toLowerCase() !== 'completed').length,
    completed: orders.filter((o) => (o.status || '').toLowerCase() === 'completed' || (o.status || '').toLowerCase() === 'shipped').length,
  };

  return (
    <div className="space-y-6">


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedStatus('all')}>
          <p className="text-sm text-gray-600">All Orders</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{statusCounts.all}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedStatus('assigned')}>
          <p className="text-sm text-gray-600">Assigned</p>
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
                      <td className="p-4 text-sm">
                        {new Date((order as any).createdAt || order.assignedDate || order.deadline).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
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
                  <td colSpan={6} className="p-8 text-center text-gray-500">
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

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { OrderDetailView } from './OrderDetailView';
import {
  Search,
  Eye,
  Edit,
  Calendar,
  Package,
  User,
  Filter,
  Download,
} from 'lucide-react';

interface Order {
  _id: string;
  jobId: string;
  clientName: string;
  transformerName: string;
  transformerType: string;
  quantity: number;
  createdAt: string;
  status: string;
  priority: string;
  deadline?: string;
  // Add other fields as needed
}

interface OrdersListViewProps {
  onViewOrder?: (order: Order) => void; // Update type locally if needed, but passing any is safer for now or matching Order
  onEditOrder?: (order: Order) => void;
}

export function OrdersListView({ onViewOrder, onEditOrder }: OrdersListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Orders
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // Using admin/orders or a generic orders endpoint. Assuming Entry Operator can access this.
      const response = await axios.get('http://localhost:3002/api/admin/orders', {
        withCredentials: true
      });
      setOrders(response.data);
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const s = status || 'Pending';
    if (s.includes('Pending')) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    if (s.includes('Assigned') || s.includes('Progress')) return 'bg-blue-100 text-blue-700 border-blue-300';
    if (s.includes('Testing')) return 'bg-purple-100 text-purple-700 border-purple-300';
    if (s.includes('Completed')) return 'bg-green-100 text-green-700 border-green-300';
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-700';
      case 'Medium': return 'bg-orange-100 text-orange-700';
      case 'Low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      (order.jobId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.clientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.transformerName || '').toLowerCase().includes(searchQuery.toLowerCase());

    // Simple status filter mapping
    if (selectedStatus === 'all') return matchesSearch;
    // Map Frontend Filter to Backend Status
    const status = order.status || '';
    if (selectedStatus === 'Pending') return matchesSearch && status.includes('Pending');
    if (selectedStatus === 'Assigned') return matchesSearch && (status.includes('Assigned') || status === 'In Progress');
    if (selectedStatus === 'In Testing') return matchesSearch && status.includes('Testing');
    if (selectedStatus === 'Completed') return matchesSearch && status === 'Completed';

    return matchesSearch && status === selectedStatus;
  });

  const statusCounts = {
    all: orders.length,
    Pending: orders.filter((o) => (o.status || '').includes('Pending')).length,
    Assigned: orders.filter((o) => (o.status || '').includes('Assigned') || (o.status || '') === 'In Progress').length,
    'In Testing': orders.filter((o) => (o.status || '').includes('Testing')).length,
    Completed: orders.filter((o) => (o.status || '') === 'Completed').length,
  };

  // If an order is selected, show the detail view
  if (selectedOrder) {
    return (
      <OrderDetailView
        order={{
          ...selectedOrder,
          id: selectedOrder._id, // Map for view compatibility
          orderId: selectedOrder.jobId,
          orderDate: new Date(selectedOrder.createdAt).toLocaleDateString()
        }}
        onBack={() => setSelectedOrder(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2>Orders List</h2>
          <p className="text-gray-500 mt-1">View and manage all transformer orders</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={fetchOrders}>
          <Download className="w-4 h-4" />
          Refresh List
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300">
          <p className="text-sm text-gray-600">All Orders</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{statusCounts.all}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-700 mt-1">{statusCounts.Pending}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300">
          <p className="text-sm text-gray-600">Assigned</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{statusCounts.Assigned}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300">
          <p className="text-sm text-gray-600">In Testing</p>
          <p className="text-2xl font-bold text-purple-700 mt-1">{statusCounts['In Testing']}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-300">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{statusCounts.Completed}</p>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            className="pl-10 h-12"
            placeholder="Search by Order ID, Client Name, or Transformer"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'Pending', 'Assigned', 'In Testing', 'Completed'].map((status) => (
            <Button
              key={status}
              variant={selectedStatus === status ? 'default' : 'outline'}
              className={selectedStatus === status ? 'bg-blue-600 hover:bg-blue-700' : ''}
              onClick={() => setSelectedStatus(status)}
            >
              <Filter className="w-4 h-4 mr-2" />
              {status === 'all' ? 'All' : status}
            </Button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-gray-700">Order ID</th>
                <th className="text-left p-4 text-sm font-medium text-gray-700">Client Name</th>
                <th className="text-left p-4 text-sm font-medium text-gray-700">Transformer</th>
                <th className="text-left p-4 text-sm font-medium text-gray-700">Quantity</th>
                <th className="text-left p-4 text-sm font-medium text-gray-700">Order Date</th>
                <th className="text-left p-4 text-sm font-medium text-gray-700">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-700">Priority</th>
                <th className="text-left p-4 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center">Loading...</td></tr>
              ) : filteredOrders.map((order, index) => (
                <tr
                  key={order._id}
                  className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                >
                  <td className="p-4">
                    <p className="font-mono text-sm font-medium">{order.jobId}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{order.clientName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-medium">{order.transformerName}</p>
                    <p className="text-sm text-gray-500">{order.transformerType}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{order.quantity}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
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
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                        className="gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filteredOrders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No orders found</p>
            <p className="text-sm mt-1">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </Card>
    </div>
  );
}

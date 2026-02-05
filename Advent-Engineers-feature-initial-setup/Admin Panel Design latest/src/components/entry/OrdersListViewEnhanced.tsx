import { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { OrderDetailView } from './OrderDetailView';
import { OrderStatusTracker } from '../order/OrderStatusTracker';
import { 
  Search,
  Eye,
  Edit,
  Calendar,
  Package,
  User,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Order {
  id: string;
  orderId: string;
  clientName: string;
  transformerName: string;
  transformerType: string;
  quantity: number;
  orderDate: string;
  status: 'Pending' | 'Assigned' | 'In Testing' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  testingStage: 'order-created' | 'core-testing' | 'secondary-testing' | 'after-primary-testing' | 'final-testing' | 'completed';
  expectedCompletion?: string;
}

interface OrdersListViewEnhancedProps {
  onViewOrder?: (order: Order) => void;
  onEditOrder?: (order: Order) => void;
}

export function OrdersListViewEnhanced({ onViewOrder, onEditOrder }: OrdersListViewEnhancedProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const orders: Order[] = [
    {
      id: '1',
      orderId: 'ORD-1732157890123',
      clientName: 'MSEB Power Distribution Ltd.',
      transformerName: 'Outdoor Epoxy Resin Cast',
      transformerType: 'Current Transformer',
      quantity: 25,
      orderDate: '2024-11-15',
      status: 'In Testing',
      priority: 'High',
      testingStage: 'secondary-testing',
      expectedCompletion: '2024-12-15'
    },
    {
      id: '2',
      orderId: 'ORD-1732157890456',
      clientName: 'Gujarat Energy Transmission Corp.',
      transformerName: 'Indoor Epoxy Resin Cast',
      transformerType: 'Current Transformer',
      quantity: 50,
      orderDate: '2024-11-14',
      status: 'In Testing',
      priority: 'Medium',
      testingStage: 'core-testing',
      expectedCompletion: '2024-12-20'
    },
    {
      id: '3',
      orderId: 'ORD-1732157890789',
      clientName: 'Tata Power Company',
      transformerName: 'Dead Tank Type-1',
      transformerType: 'Current Transformer',
      quantity: 30,
      orderDate: '2024-11-13',
      status: 'Completed',
      priority: 'High',
      testingStage: 'completed',
      expectedCompletion: '2024-11-28'
    },
    {
      id: '4',
      orderId: 'ORD-1732157891012',
      clientName: 'Reliance Infrastructure',
      transformerName: 'Live Tank Type CT',
      transformerType: 'Current Transformer',
      quantity: 15,
      orderDate: '2024-11-12',
      status: 'Pending',
      priority: 'Low',
      testingStage: 'order-created',
      expectedCompletion: '2024-12-10'
    },
    {
      id: '5',
      orderId: 'ORD-1732157891345',
      clientName: 'Adani Transmission Ltd.',
      transformerName: 'Dead Tank Type-2',
      transformerType: 'Current Transformer',
      quantity: 40,
      orderDate: '2024-11-11',
      status: 'In Testing',
      priority: 'High',
      testingStage: 'final-testing',
      expectedCompletion: '2024-11-30'
    },
  ];

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Assigned':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'In Testing':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'Completed':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-700';
      case 'Medium':
        return 'bg-orange-100 text-orange-700';
      case 'Low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.transformerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      selectedStatus === 'all' || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: orders.length,
    Pending: orders.filter((o) => o.status === 'Pending').length,
    Assigned: orders.filter((o) => o.status === 'Assigned').length,
    'In Testing': orders.filter((o) => o.status === 'In Testing').length,
    Completed: orders.filter((o) => o.status === 'Completed').length,
  };

  // If an order is selected, show the detail view
  if (selectedOrder) {
    return (
      <OrderDetailView
        order={selectedOrder}
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
          <p className="text-gray-500 mt-1">View and manage all transformer orders with status tracking</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export Orders
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

      {/* Orders List with Status Trackers */}
      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const isExpanded = expandedOrders.has(order.id);
          
          return (
            <Card key={order.id} className="overflow-hidden">
              {/* Order Summary Row */}
              <div className="p-4 bg-white hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 flex-1">
                    {/* Order ID */}
                    <div className="min-w-[180px]">
                      <p className="text-xs text-gray-500 mb-1">Order ID</p>
                      <p className="font-mono text-sm font-medium">{order.orderId}</p>
                    </div>

                    {/* Client */}
                    <div className="flex items-center gap-2 min-w-[250px]">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Client</p>
                        <p className="font-medium text-sm">{order.clientName}</p>
                      </div>
                    </div>

                    {/* Transformer */}
                    <div className="flex-1 min-w-[200px]">
                      <p className="text-xs text-gray-500 mb-1">Transformer</p>
                      <p className="font-medium text-sm">{order.transformerName}</p>
                    </div>

                    {/* Quantity */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Qty</p>
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-sm">{order.quantity}</span>
                      </div>
                    </div>

                    {/* Date */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Order Date</p>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{order.orderDate}</span>
                      </div>
                    </div>

                    {/* Status & Priority */}
                    <div className="flex flex-col gap-2">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <Badge className={getPriorityColor(order.priority)}>
                        {order.priority}
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                      className="gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleOrderExpansion(order.id)}
                      className="gap-1"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Hide Status
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Show Status
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Expanded Order Status Tracker */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  <OrderStatusTracker
                    currentStage={order.testingStage}
                    orderDate={order.orderDate}
                    expectedCompletion={order.expectedCompletion}
                    orderId={order.orderId}
                  />
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <Card className="p-12">
          <div className="text-center text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No orders found</p>
            <p className="text-sm mt-1">Try adjusting your search or filter criteria</p>
          </div>
        </Card>
      )}
    </div>
  );
}

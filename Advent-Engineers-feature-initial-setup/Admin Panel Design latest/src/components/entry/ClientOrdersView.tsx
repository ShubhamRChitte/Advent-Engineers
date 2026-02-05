import { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { OrderReportsView } from './OrderReportsView';
import { 
  ArrowLeft, 
  Package, 
  Calendar, 
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Activity,
  ChevronRight
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  contactNumber: string;
  totalOrders: number;
  completedOrders: number;
  inProgressOrders: number;
  email: string;
}

interface Order {
  id: string;
  orderId: string;
  transformerName: string;
  transformerType: string;
  quantity: number;
  orderDate: string;
  testStatus: 'Completed' | 'In Progress' | 'Pending';
  testingStage: string;
  completedTests: number;
  totalTests: number;
}

interface ClientOrdersViewProps {
  client: Client;
  onBack: () => void;
  dateFilter: '3months' | '1month' | 'custom';
  customDateFrom: string;
  customDateTo: string;
}

export function ClientOrdersView({ 
  client, 
  onBack, 
  dateFilter, 
  customDateFrom, 
  customDateTo 
}: ClientOrdersViewProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Sample orders for the client
  const allOrders: Order[] = [
    {
      id: '1',
      orderId: 'ORD-2024-001',
      transformerName: 'Outdoor Epoxy Resin Cast',
      transformerType: 'Current Transformer',
      quantity: 25,
      orderDate: '2024-09-15',
      testStatus: 'Completed',
      testingStage: 'Final Testing',
      completedTests: 4,
      totalTests: 4,
    },
    {
      id: '2',
      orderId: 'ORD-2024-002',
      transformerName: 'Indoor Epoxy Resin Cast',
      transformerType: 'Current Transformer',
      quantity: 30,
      orderDate: '2024-10-01',
      testStatus: 'Completed',
      testingStage: 'Final Testing',
      completedTests: 4,
      totalTests: 4,
    },
    {
      id: '3',
      orderId: 'ORD-2024-003',
      transformerName: 'Dead Tank Type-1',
      transformerType: 'Current Transformer',
      quantity: 20,
      orderDate: '2024-10-15',
      testStatus: 'In Progress',
      testingStage: 'Secondary Testing',
      completedTests: 2,
      totalTests: 4,
    },
    {
      id: '4',
      orderId: 'ORD-2024-004',
      transformerName: 'Live Tank Type CT',
      transformerType: 'Current Transformer',
      quantity: 15,
      orderDate: '2024-11-01',
      testStatus: 'In Progress',
      testingStage: 'Core Testing',
      completedTests: 1,
      totalTests: 4,
    },
    {
      id: '5',
      orderId: 'ORD-2024-005',
      transformerName: 'Dead Tank Type-2',
      transformerType: 'Current Transformer',
      quantity: 40,
      orderDate: '2024-11-10',
      testStatus: 'Pending',
      testingStage: 'Order Created',
      completedTests: 0,
      totalTests: 4,
    },
    {
      id: '6',
      orderId: 'ORD-2024-006',
      transformerName: 'Outdoor Current Transformer',
      transformerType: 'Current Transformer',
      quantity: 35,
      orderDate: '2024-11-20',
      testStatus: 'Pending',
      testingStage: 'Order Created',
      completedTests: 0,
      totalTests: 4,
    },
  ];

  // Filter orders based on date range
  const filterOrdersByDate = (orders: Order[]) => {
    const today = new Date();
    
    if (dateFilter === '3months') {
      const threeMonthsAgo = new Date(today);
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      return orders.filter(order => new Date(order.orderDate) >= threeMonthsAgo);
    }
    
    if (dateFilter === '1month') {
      const oneMonthAgo = new Date(today);
      oneMonthAgo.setMonth(today.getMonth() - 1);
      return orders.filter(order => new Date(order.orderDate) >= oneMonthAgo);
    }
    
    if (dateFilter === 'custom' && customDateFrom && customDateTo) {
      const fromDate = new Date(customDateFrom);
      const toDate = new Date(customDateTo);
      return orders.filter(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate >= fromDate && orderDate <= toDate;
      });
    }
    
    return orders;
  };

  const orders = filterOrdersByDate(allOrders);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'In Progress':
        return <Activity className="w-5 h-5 text-blue-600" />;
      case 'Pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  // If an order is selected, show its reports
  if (selectedOrder) {
    return (
      <OrderReportsView
        order={selectedOrder}
        clientName={client.name}
        onBack={() => setSelectedOrder(null)}
      />
    );
  }

  const completedCount = orders.filter(o => o.testStatus === 'Completed').length;
  const inProgressCount = orders.filter(o => o.testStatus === 'In Progress').length;
  const pendingCount = orders.filter(o => o.testStatus === 'Pending').length;

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <button onClick={onBack} className="hover:text-blue-600 transition-colors">
          Client Reports
        </button>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">{client.name}</span>
      </div>

      {/* Header with Back Button */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Clients
            </Button>
          </div>
          <h2>{client.name}</h2>
          <p className="text-gray-500 mt-1">View all orders and test reports</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-blue-700">Total Orders</p>
              <h3 className="mt-1 text-blue-900">{orders.length}</h3>
            </div>
            <div className="p-3 bg-blue-500 rounded-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-green-700">Completed</p>
              <h3 className="mt-1 text-green-900">{completedCount}</h3>
            </div>
            <div className="p-3 bg-green-500 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-blue-700">In Progress</p>
              <h3 className="mt-1 text-blue-900">{inProgressCount}</h3>
            </div>
            <div className="p-3 bg-blue-500 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-yellow-700">Pending</p>
              <h3 className="mt-1 text-yellow-900">{pendingCount}</h3>
            </div>
            <div className="p-3 bg-yellow-500 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Orders List */}
      <div>
        <h3 className="text-gray-900 mb-4">Orders List</h3>
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {/* Status Icon */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    {getStatusIcon(order.testStatus)}
                  </div>

                  {/* Order Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-gray-900">{order.orderId}</h3>
                          <Badge className={getStatusColor(order.testStatus)}>
                            {order.testStatus}
                          </Badge>
                        </div>
                        <p className="text-gray-600">{order.transformerName}</p>
                        <p className="text-sm text-gray-500">{order.transformerType}</p>
                      </div>
                    </div>

                    {/* Order Info Grid */}
                    <div className="grid grid-cols-4 gap-4 p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Quantity</p>
                        <div className="flex items-center gap-1">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">{order.quantity} units</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Order Date</p>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">{order.orderDate}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Testing Stage</p>
                        <span className="text-sm font-medium">{order.testingStage}</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Test Progress</p>
                        <span className="text-sm font-medium">
                          {order.completedTests}/{order.totalTests} completed
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* View Reports Button */}
                <Button
                  className="ml-4 bg-blue-600 hover:bg-blue-700 gap-2"
                  onClick={() => setSelectedOrder(order)}
                >
                  <FileText className="w-4 h-4" />
                  View Reports
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {orders.length === 0 && (
        <Card className="p-12">
          <div className="text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No orders found</p>
            <p className="text-sm mt-1">No orders match the selected date range</p>
          </div>
        </Card>
      )}
    </div>
  );
}

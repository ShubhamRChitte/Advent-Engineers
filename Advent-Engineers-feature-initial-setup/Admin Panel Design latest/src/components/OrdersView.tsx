import { useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Eye, Plus, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface Order {
  id: string;
  orderNumber: string;
  transformerType: string;
  quantity: number;
  client: string;
  orderDate: string;
  deliveryDate: string;
  status: 'pending' | 'in-progress' | 'testing' | 'completed' | 'dispatched';
  priority: 'low' | 'medium' | 'high';
  assignedWorkers: string[];
  testingStage: number;
}

export function OrdersView() {
  const [filter, setFilter] = useState('all');
  
  const orders: Order[] = [
    {
      id: '1',
      orderNumber: 'ORD-2025-001',
      transformerType: 'Dead Tank Type-1',
      quantity: 5,
      client: 'PowerGrid Corp',
      orderDate: '2025-01-10',
      deliveryDate: '2025-02-15',
      status: 'in-progress',
      priority: 'high',
      assignedWorkers: ['John Doe', 'Jane Smith'],
      testingStage: 2,
    },
    {
      id: '2',
      orderNumber: 'ORD-2025-002',
      transformerType: 'Live Tank Type',
      quantity: 3,
      client: 'City Electric Ltd',
      orderDate: '2025-01-12',
      deliveryDate: '2025-02-20',
      status: 'testing',
      priority: 'medium',
      assignedWorkers: ['Mike Johnson'],
      testingStage: 3,
    },
    {
      id: '3',
      orderNumber: 'ORD-2025-003',
      transformerType: 'Dead Tank Type-2',
      quantity: 8,
      client: 'National Grid',
      orderDate: '2025-01-08',
      deliveryDate: '2025-02-10',
      status: 'completed',
      priority: 'high',
      assignedWorkers: ['Sarah Wilson', 'Tom Brown'],
      testingStage: 4,
    },
    {
      id: '4',
      orderNumber: 'ORD-2025-004',
      transformerType: 'Indoor ERC',
      quantity: 10,
      client: 'Metro Power',
      orderDate: '2025-01-15',
      deliveryDate: '2025-02-25',
      status: 'pending',
      priority: 'low',
      assignedWorkers: [],
      testingStage: 0,
    },
    {
      id: '5',
      orderNumber: 'ORD-2025-005',
      transformerType: 'Outdoor ERC',
      quantity: 6,
      client: 'Industrial Solutions',
      orderDate: '2025-01-14',
      deliveryDate: '2025-02-22',
      status: 'in-progress',
      priority: 'medium',
      assignedWorkers: ['Alex Turner'],
      testingStage: 1,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-700';
      case 'in-progress': return 'bg-blue-100 text-blue-700';
      case 'testing': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'dispatched': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-700';
      case 'medium': return 'bg-orange-100 text-orange-700';
      case 'high': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Order Management</h2>
          <p className="text-gray-500 mt-1">Manage and track all transformer orders</p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700">
          <Plus className="w-4 h-4 mr-2" />
          New Order
        </Button>
      </div>

      {/* Filter Section */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="testing">Testing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="dispatched">Dispatched</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-sm text-gray-500">
            Showing {filteredOrders.length} of {orders.length} orders
          </div>
        </div>
      </Card>

      {/* Orders Grid */}
      <div className="grid gap-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3>{order.orderNumber}</h3>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.replace('-', ' ')}
                  </Badge>
                  <Badge className={getPriorityColor(order.priority)}>
                    {order.priority} priority
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Transformer Type</p>
                    <p className="mt-1">{order.transformerType}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Client</p>
                    <p className="mt-1">{order.client}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Quantity</p>
                    <p className="mt-1">{order.quantity} units</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Delivery Date</p>
                    <p className="mt-1">{new Date(order.deliveryDate).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Testing Progress */}
                {order.testingStage > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-500">Testing Progress</span>
                      <span>{order.testingStage}/4 stages</span>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map((stage) => (
                        <div
                          key={stage}
                          className={`h-2 flex-1 rounded ${
                            stage <= order.testingStage ? 'bg-red-600' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Assigned Workers */}
                {order.assignedWorkers.length > 0 && (
                  <div className="mt-4 flex items-center gap-2">
                    <p className="text-sm text-gray-500">Assigned:</p>
                    <div className="flex gap-2">
                      {order.assignedWorkers.map((worker, idx) => (
                        <Badge key={idx} variant="outline">{worker}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Order Details - {order.orderNumber}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Client</p>
                        <p className="mt-1">{order.client}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Transformer Type</p>
                        <p className="mt-1">{order.transformerType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Quantity</p>
                        <p className="mt-1">{order.quantity} units</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Order Date</p>
                        <p className="mt-1">{new Date(order.orderDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Expected Delivery</p>
                        <p className="mt-1">{new Date(order.deliveryDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <Badge className={`${getStatusColor(order.status)} mt-1`}>
                          {order.status.replace('-', ' ')}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Testing Stages</p>
                      <div className="space-y-2">
                        {['Visual Inspection', 'Electrical Test', 'Performance Test', 'Final QC'].map((stage, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              idx + 1 <= order.testingStage ? 'bg-green-500 text-white' : 'bg-gray-200'
                            }`}>
                              {idx + 1}
                            </div>
                            <span className={idx + 1 <= order.testingStage ? '' : 'text-gray-400'}>
                              {stage}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

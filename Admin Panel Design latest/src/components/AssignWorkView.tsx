import { useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { UserPlus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface Order {
  id: string;
  orderNumber: string;
  transformerType: string;
  quantity: number;
  client: string;
  priority: 'low' | 'medium' | 'high';
  assignedWorkers: string[];
}

interface Worker {
  id: string;
  name: string;
  expertise: string[];
  status: 'available' | 'busy';
  currentLoad: number;
}

export function AssignWorkView() {
  const [orders] = useState<Order[]>([
    {
      id: '1',
      orderNumber: 'ORD-2025-001',
      transformerType: 'Dead Tank Type-1',
      quantity: 5,
      client: 'PowerGrid Corp',
      priority: 'high',
      assignedWorkers: [],
    },
    {
      id: '2',
      orderNumber: 'ORD-2025-004',
      transformerType: 'Indoor ERC',
      quantity: 10,
      client: 'Metro Power',
      priority: 'medium',
      assignedWorkers: [],
    },
    {
      id: '3',
      orderNumber: 'ORD-2025-006',
      transformerType: 'Live Tank Type',
      quantity: 4,
      client: 'Industrial Solutions',
      priority: 'low',
      assignedWorkers: ['John Doe'],
    },
  ]);

  const [workers] = useState<Worker[]>([
    {
      id: '1',
      name: 'John Doe',
      expertise: ['Dead Tank Type-1', 'Live Tank Type'],
      status: 'busy',
      currentLoad: 2,
    },
    {
      id: '2',
      name: 'Jane Smith',
      expertise: ['Dead Tank Type-1', 'Indoor ERC'],
      status: 'available',
      currentLoad: 0,
    },
    {
      id: '3',
      name: 'Mike Johnson',
      expertise: ['Live Tank Type', 'Outdoor ERC'],
      status: 'available',
      currentLoad: 1,
    },
    {
      id: '4',
      name: 'Emma Davis',
      expertise: ['Live Tank Type', 'Indoor ERC'],
      status: 'available',
      currentLoad: 0,
    },
    {
      id: '5',
      name: 'Chris Lee',
      expertise: ['Dead Tank Type-1', 'Dead Tank Type-2'],
      status: 'available',
      currentLoad: 0,
    },
  ]);

  const [selectedWorker, setSelectedWorker] = useState<{ [orderId: string]: string }>({});

  const handleAssignWorker = (orderId: string) => {
    const workerId = selectedWorker[orderId];
    if (!workerId) {
      toast.error('Please select a worker first');
      return;
    }

    const worker = workers.find(w => w.id === workerId);
    if (worker) {
      toast.success(`${worker.name} assigned successfully!`);
      setSelectedWorker({ ...selectedWorker, [orderId]: '' });
    }
  };

  const getAvailableWorkers = (transformerType: string) => {
    return workers.filter(w => 
      w.expertise.includes(transformerType) || w.expertise.length === 0
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-700';
      case 'medium': return 'bg-orange-100 text-orange-700';
      case 'high': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2>Assign Work to Testing Engineers</h2>
        <p className="text-gray-500 mt-1">Assign workers to orders based on their expertise and availability</p>
      </div>

      {/* Available Workers Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Available Workers</p>
          <h3 className="mt-2 text-green-600">{workers.filter(w => w.status === 'available').length}</h3>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Busy Workers</p>
          <h3 className="mt-2 text-yellow-600">{workers.filter(w => w.status === 'busy').length}</h3>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Unassigned Orders</p>
          <h3 className="mt-2 text-red-600">{orders.filter(o => o.assignedWorkers.length === 0).length}</h3>
        </Card>
      </div>

      {/* Orders to Assign */}
      <Card className="p-6">
        <h3 className="mb-4">Orders Requiring Assignment</h3>
        <div className="space-y-4">
          {orders.map((order) => {
            const availableWorkers = getAvailableWorkers(order.transformerType);
            
            return (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h4>{order.orderNumber}</h4>
                      <Badge className={getPriorityColor(order.priority)}>
                        {order.priority} priority
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">{order.client}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Transformer Type</p>
                    <p className="mt-1">{order.transformerType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Quantity</p>
                    <p className="mt-1">{order.quantity} units</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Available Workers</p>
                    <p className="mt-1">{availableWorkers.filter(w => w.status === 'available').length} suitable</p>
                  </div>
                </div>

                {order.assignedWorkers.length > 0 ? (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Assigned to: {order.assignedWorkers.join(', ')}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Select
                      value={selectedWorker[order.id] || ''}
                      onValueChange={(value) => setSelectedWorker({ ...selectedWorker, [order.id]: value })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a worker..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableWorkers.map((worker) => (
                          <SelectItem key={worker.id} value={worker.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{worker.name}</span>
                              <span className="ml-2">
                                <Badge
                                  variant="outline"
                                  className={worker.status === 'available' ? 'text-green-600' : 'text-yellow-600'}
                                >
                                  {worker.status}
                                </Badge>
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => handleAssignWorker(order.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Assign
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Worker Expertise Reference */}
      <Card className="p-6">
        <h3 className="mb-4">Worker Expertise Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workers.map((worker) => (
            <div key={worker.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">{worker.name}</p>
                <Badge className={worker.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                  {worker.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Expertise:</p>
                <div className="flex flex-wrap gap-1">
                  {worker.expertise.map((exp, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {exp}
                    </Badge>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Current Load: {worker.currentLoad} order(s)</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

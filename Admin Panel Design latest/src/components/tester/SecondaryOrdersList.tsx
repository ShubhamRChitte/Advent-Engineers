import { useState } from 'react';
import React, {useEffect} from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Eye, PlayCircle } from 'lucide-react';
import axios from 'axios';

interface Order {
  jobId: string;
  clientName: string;
  quantity: number;
  assignedDate: string;
  status: 'assigned' | 'in-testing' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

interface SecondaryOrdersListProps {
  onStartTesting: (order: Order) => void;
}

export function SecondaryOrdersList({ onStartTesting }: SecondaryOrdersListProps) {
  // const [orders] = useState<Order[]>([
  //   {
  //     jobId: 'JOB-2025-001',
  //     client: 'PowerGrid Corporation',
  //     transformerCount: 5,
  //     assignedDate: '2025-11-15',
  //     status: 'assigned',
  //     priority: 'high',
  //   },
  //   {
  //     jobId: 'JOB-2025-002',
  //     client: 'City Electric Ltd',
  //     transformerCount: 3,
  //     assignedDate: '2025-11-16',
  //     status: 'assigned',
  //     priority: 'medium',
  //   },
  //   {
  //     jobId: 'JOB-2025-003',
  //     client: 'National Grid',
  //     transformerCount: 4,
  //     assignedDate: '2025-11-14',
  //     status: 'in-testing',
  //     priority: 'high',
  //   },
  //   {
  //     jobId: 'JOB-2025-004',
  //     client: 'Metro Power',
  //     transformerCount: 2,
  //     assignedDate: '2025-11-13',
  //     status: 'completed',
  //     priority: 'low',
  //   },
  // ]);






  const [orders, setOrders] = useState<CoreTestingOrder[]>([]);
  
    useEffect(() => {
      axios
        .get("http://localhost:3002/allorders")
        .then((res) => {
          setOrders(res.data);
        })
        .catch((err) => {
          console.error("API ERROR:", err);
        });
    }, []);

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
      case 'low': return 'bg-gray-100 text-gray-700';
      case 'medium': return 'bg-orange-100 text-orange-700';
      case 'high': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2>Assigned Orders</h2>
        <p className="text-gray-500 mt-1">View and start secondary testing on assigned orders</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-600">Assigned Orders</p>
          <p className="text-2xl mt-1 text-blue-700">
            {orders.filter(o => o.status === 'assigned').length}
          </p>
        </Card>
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <p className="text-sm text-yellow-600">In Testing</p>
          <p className="text-2xl mt-1 text-yellow-700">
            {orders.filter(o => o.status === 'in-testing').length}
          </p>
        </Card>
        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-sm text-green-600">Completed</p>
          <p className="text-2xl mt-1 text-green-700">
            {orders.filter(o => o.status === 'completed').length}
          </p>
        </Card>
      </div>

      {/* Orders Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 text-sm">Job ID</th>
                <th className="text-left p-4 text-sm">Client</th>
                <th className="text-center p-4 text-sm">Transformers</th>
                <th className="text-left p-4 text-sm">Assigned Date</th>
                <th className="text-left p-4 text-sm">Status</th>
                <th className="text-left p-4 text-sm">Priority</th>
                <th className="text-center p-4 text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.jobId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-medium">{order.jobId}</td>
                  <td className="p-4">{order.clientName}</td>
                  <td className="p-4 text-center">{order.quantity}</td>
                  <td className="p-4">{new Date(order.deadline).toLocaleDateString()}</td>
                  <td className="p-4">
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.replace('-', ' ')}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge className={getPriorityColor(order.priority)}>
                      {order.priority}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2 justify-center">
                      {order.status === 'assigned' || order.status === 'in-testing' ? (
                        <Button
                          size="sm"
                          onClick={() => onStartTesting(order)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <PlayCircle className="w-4 h-4 mr-2" />
                          {order.status === 'assigned' ? 'Start Testing' : 'Continue Testing'}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Report
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

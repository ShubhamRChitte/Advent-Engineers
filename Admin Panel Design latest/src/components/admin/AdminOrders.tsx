import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Eye, Download } from 'lucide-react';
import { Button } from '../ui/button';

interface Order {
  jobId: string;
  client: string;
  isStandard: string;
  voltage: string;
  cores: number;
  status: string;
  createdDate: string;
  assignedTo: string;
}

export function AdminOrders() {
  const orders: Order[] = [
    {
      jobId: 'JOB-2025-001',
      client: 'PowerGrid Corporation',
      isStandard: 'IS 2705',
      voltage: '11kV',
      cores: 3,
      status: 'Core Testing',
      createdDate: '2025-01-10',
      assignedTo: 'John Smith',
    },
    {
      jobId: 'JOB-2025-002',
      client: 'City Electric Ltd',
      isStandard: 'IS 2705',
      voltage: '33kV',
      cores: 2,
      status: 'Secondary Testing',
      createdDate: '2025-01-12',
      assignedTo: 'Mike Wilson',
    },
    {
      jobId: 'JOB-2025-003',
      client: 'National Grid',
      isStandard: 'IS 2705',
      voltage: '22kV',
      cores: 4,
      status: 'Final Testing',
      createdDate: '2025-01-08',
      assignedTo: 'Emma Davis',
    },
    {
      jobId: 'JOB-2025-004',
      client: 'Metro Power',
      isStandard: 'IS 2705',
      voltage: '11kV',
      cores: 3,
      status: 'Completed',
      createdDate: '2025-01-05',
      assignedTo: 'Emma Davis',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Core Testing':
        return 'bg-blue-100 text-blue-700';
      case 'Secondary Testing':
        return 'bg-purple-100 text-purple-700';
      case 'Final Testing':
        return 'bg-orange-100 text-orange-700';
      case 'Completed':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2>Order Management</h2>
        <p className="text-gray-500 mt-1">View and manage all transformer testing orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Orders</p>
          <h3 className="mt-1">{orders.length}</h3>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">In Testing</p>
          <h3 className="mt-1 text-blue-600">{orders.filter(o => o.status.includes('Testing')).length}</h3>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Completed</p>
          <h3 className="mt-1 text-green-600">{orders.filter(o => o.status === 'Completed').length}</h3>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Cores</p>
          <h3 className="mt-1">{orders.reduce((sum, o) => sum + o.cores, 0)}</h3>
        </Card>
      </div>

      {/* Orders Table */}
      <Card className="p-6">
        <h3 className="mb-4">All Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left pb-3 text-sm text-gray-500">Job ID</th>
                <th className="text-left pb-3 text-sm text-gray-500">Client</th>
                <th className="text-left pb-3 text-sm text-gray-500">IS Standard</th>
                <th className="text-left pb-3 text-sm text-gray-500">Voltage</th>
                <th className="text-center pb-3 text-sm text-gray-500">Cores</th>
                <th className="text-left pb-3 text-sm text-gray-500">Status</th>
                <th className="text-left pb-3 text-sm text-gray-500">Assigned To</th>
                <th className="text-left pb-3 text-sm text-gray-500">Created</th>
                <th className="text-right pb-3 text-sm text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.jobId} className="border-b border-gray-100">
                  <td className="py-4">
                    <span className="font-medium">{order.jobId}</span>
                  </td>
                  <td className="py-4">{order.client}</td>
                  <td className="py-4">{order.isStandard}</td>
                  <td className="py-4">{order.voltage}</td>
                  <td className="py-4 text-center">{order.cores}</td>
                  <td className="py-4">
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="py-4">{order.assignedTo}</td>
                  <td className="py-4">{new Date(order.createdDate).toLocaleDateString()}</td>
                  <td className="py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
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

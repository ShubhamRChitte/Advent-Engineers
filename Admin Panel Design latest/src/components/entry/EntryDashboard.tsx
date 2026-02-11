import { Card } from '../ui/card';
import { Package, Users, CheckCircle2 } from 'lucide-react';
import { Badge } from '../ui/badge';

export function EntryDashboard() {
  const stats = [
    { label: 'Orders Created', value: '28', icon: Package, color: 'blue' },
    { label: 'Registered Vendors', value: '12', icon: Users, color: 'purple' },
    { label: 'Active Orders', value: '156', icon: CheckCircle2, color: 'green' },
    { label: 'Pending Assignment', value: '8', icon: Package, color: 'orange' },
  ];

  const recentOrders = [
    { jobId: 'JOB-2025-001', client: 'PowerGrid Corporation', voltage: '11kV', cores: 3, status: 'Assigned' },
    { jobId: 'JOB-2025-002', client: 'City Electric Ltd', voltage: '33kV', cores: 2, status: 'Pending' },
    { jobId: 'JOB-2025-003', client: 'National Grid', voltage: '22kV', cores: 4, status: 'Assigned' },
    { jobId: 'JOB-2025-004', client: 'Metro Power', voltage: '11kV', cores: 3, status: 'Assigned' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2>Dashboard Overview</h2>
        <p className="text-gray-500 mt-1">Welcome! Manage orders and core assignments.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          
          return (
            <Card key={stat.label} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <h3 className="mt-2">{stat.value}</h3>
                </div>
                <div className={`p-3 bg-${stat.color}-50 rounded-lg`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Orders */}
      <Card className="p-6">
        <h3 className="mb-4">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left p-3 text-sm">Job ID</th>
                <th className="text-left p-3 text-sm">Client</th>
                <th className="text-left p-3 text-sm">Voltage</th>
                <th className="text-center p-3 text-sm">Cores</th>
                <th className="text-left p-3 text-sm">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.jobId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium">{order.jobId}</td>
                  <td className="p-3">{order.client}</td>
                  <td className="p-3">{order.voltage}</td>
                  <td className="p-3 text-center">{order.cores}</td>
                  <td className="p-3">
                    <Badge className={order.status === 'Assigned' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                      {order.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-[#003a70]">
          <Package className="w-8 h-8 text-[#003a70] mb-3" />
          <h4>Add New Order</h4>
          <p className="text-sm text-gray-500 mt-1">Create a new transformer order</p>
        </Card>
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-[#003a70]">
          <Users className="w-8 h-8 text-[#003a70] mb-3" />
          <h4>Manage Vendors</h4>
          <p className="text-sm text-gray-500 mt-1">Register and manage core vendors</p>
        </Card>
      </div>
    </div>
  );
}
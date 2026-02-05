import { Card } from './ui/card';
import { Package, UserPlus, Clock, CheckCircle } from 'lucide-react';
import { Badge } from './ui/badge';

export function EntryLevelDashboard() {
  const stats = [
    { label: 'Pending Orders', value: '8', icon: Package, color: 'blue' },
    { label: 'Unassigned Work', value: '5', icon: UserPlus, color: 'orange' },
    { label: 'In Progress', value: '12', icon: Clock, color: 'yellow' },
    { label: 'Completed Today', value: '6', icon: CheckCircle, color: 'green' },
  ];

  const recentOrders = [
    {
      orderNumber: 'ORD-2025-001',
      client: 'PowerGrid Corp',
      type: 'Dead Tank Type-1',
      quantity: 5,
      status: 'pending',
      priority: 'high',
    },
    {
      orderNumber: 'ORD-2025-002',
      client: 'City Electric Ltd',
      type: 'Live Tank Type',
      quantity: 3,
      status: 'assigned',
      priority: 'medium',
    },
    {
      orderNumber: 'ORD-2025-003',
      client: 'National Grid',
      type: 'Dead Tank Type-2',
      quantity: 8,
      status: 'in-progress',
      priority: 'high',
    },
  ];

  const pendingAssignments = [
    { order: 'ORD-2025-004', type: 'Indoor ERC', quantity: 10, urgency: 'high' },
    { order: 'ORD-2025-005', type: 'Outdoor ERC', quantity: 6, urgency: 'medium' },
    { order: 'ORD-2025-006', type: 'Live Tank Type', quantity: 4, urgency: 'low' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2>Entry Level Dashboard</h2>
        <p className="text-gray-500 mt-1">Manage orders and assign work to testing engineers</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="p-6">
          <h3 className="mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.orderNumber} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">{order.client}</p>
                  </div>
                  <Badge
                    className={
                      order.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : order.status === 'assigned'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }
                  >
                    {order.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{order.type}</span>
                  <span className="text-gray-600">{order.quantity} units</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Pending Assignments */}
        <Card className="p-6">
          <h3 className="mb-4">Pending Work Assignments</h3>
          <div className="space-y-3">
            {pendingAssignments.map((item) => (
              <div key={item.order} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{item.order}</p>
                    <p className="text-sm text-gray-500">{item.type}</p>
                  </div>
                  <Badge
                    className={
                      item.urgency === 'high'
                        ? 'bg-red-100 text-red-700'
                        : item.urgency === 'medium'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-700'
                    }
                  >
                    {item.urgency}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{item.quantity} units to assign</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors">
            <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Create New Order</p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors">
            <UserPlus className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Assign Workers</p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Update Status</p>
          </button>
        </div>
      </Card>
    </div>
  );
}

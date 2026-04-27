import { Card } from '../ui/card';
import { Package, Users, CheckCircle2 } from 'lucide-react';
import { Badge } from '../ui/badge';

interface EntryDashboardProps {
  onAddOrder?: () => void;
}

/* 
  Updated to fetch dynamic data from Backend 
*/
import { useState, useEffect } from 'react';
import axios from 'axios';

export function EntryDashboard({ onAddOrder }: EntryDashboardProps) {
  const [statsData, setStatsData] = useState({
    totalOrders: 0,
    vendorCount: 0,
    activeOrders: 0,
    pendingAssignment: 0
  });

  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Use withCredentials to ensure auth cookie is sent if needed, 
        // though dashboard routes might not require it if not strict, but usually they do.
        const res = await axios.get('http://localhost:5001/api/dashboard/entry-stats', { withCredentials: true });
        if (res.data.success) {
          setStatsData(res.data.stats);
          setRecentOrders(res.data.recentOrders);
        }
      } catch (err) {
        console.error("Error fetching entry dashboard:", err);
      }
    };
    fetchDashboardData();
  }, []);

  const stats = [
    { label: 'Orders Created', value: statsData.totalOrders.toString(), icon: Package, color: 'blue' },
    { label: 'Registered Vendors', value: statsData.vendorCount.toString(), icon: Users, color: 'purple' },
    { label: 'Active Orders', value: statsData.activeOrders.toString(), icon: CheckCircle2, color: 'green' },
    { label: 'Pending Assignment', value: statsData.pendingAssignment.toString(), icon: Package, color: 'orange' },
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
        <Card
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-[#003a70]"
          onClick={onAddOrder}
        >
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

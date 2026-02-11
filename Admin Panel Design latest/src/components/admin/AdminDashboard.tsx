import { useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Users, Package, ClipboardCheck, TrendingUp, AlertCircle, CheckCircle2, PlusCircle, List, ArrowRight } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { analyticsService, DashboardStats, ProductionData, TestingProgress, RecentActivity } from '../../utils/analyticsService';

interface AdminDashboardProps {
  setActiveView?: (view: string) => void;
}

export function AdminDashboard({ setActiveView }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [productionData, setProductionData] = useState<ProductionData[]>([]);
  const [testingProgress, setTestingProgress] = useState<TestingProgress[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, prodData, progressData, activityData] = await Promise.all([
          analyticsService.getDashboardStats(),
          analyticsService.getProductionOverview(),
          analyticsService.getTestingProgress(),
          analyticsService.getRecentActivity()
        ]);

        setStats(statsData);
        setProductionData(prodData);
        setTestingProgress(progressData);
        setRecentActivity(activityData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        // toast.error("Failed to load dashboard data"); 
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    { label: 'Current Orders', value: stats?.currentOrders || 0, icon: Package, color: 'blue', change: 'Active' },
    { label: 'Active Workers', value: stats?.activeWorkers || 0, icon: Users, color: 'purple', change: 'On Shift' },
    { label: 'Pending Tests', value: stats?.pendingTests || 0, icon: AlertCircle, color: 'orange', change: 'In Progress' },
    { label: 'Dispatched Today', value: stats?.dispatchedToday || 0, icon: CheckCircle2, color: 'green', change: 'Completed' },
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-96">Loading dashboard data...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2>Dashboard Overview</h2>
        <p className="text-gray-500 mt-1">Welcome back! Here's your testing system summary.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          
          return (
            <Card key={stat.label} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <h3 className="mt-2 text-2xl font-bold">{stat.value}</h3>
                  <p className="text-sm text-gray-500 mt-2">{stat.change}</p>
                </div>
                <div className={`p-3 bg-${stat.color}-50 rounded-lg`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      {setActiveView && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 bg-gradient-to-br from-[#003a70] to-[#005a9c] border-2 border-[#003a70] hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveView('add-order')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                  <PlusCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-white text-lg font-semibold">Add New Order</h3>
                  <p className="text-white/90 text-sm mt-1">Create and assign transformer orders</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-white" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveView('view-orders')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-purple-500 rounded-full flex items-center justify-center">
                  <List className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-purple-900 text-lg font-semibold">View All Orders</h3>
                  <p className="text-purple-700 text-sm mt-1">Track order status and reports</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-purple-600" />
            </div>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Production Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={productionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="production" stroke="#3b82f6" strokeWidth={2} name="Total Units" />
              <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} name="Orders" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Current Testing Stage Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={testingProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="pending" name="Pending" fill="#fbbf24" />
              <Bar dataKey="completed" name="Completed" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Recent Activity</h3>
        <div className="space-y-4">
          {recentActivity.map((activity, idx) => (
            <div key={idx} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                activity.type === 'success' ? 'bg-green-500' :
                activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
              }`} />
              <div className="flex-1">
                <p className="font-medium">{activity.action}</p>
                <p className="text-sm text-gray-500">{activity.detail}</p>
              </div>
              <span className="text-sm text-gray-400">{activity.time}</span>
            </div>
          ))}
          {recentActivity.length === 0 && (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </Card>
    </div>
  );
}
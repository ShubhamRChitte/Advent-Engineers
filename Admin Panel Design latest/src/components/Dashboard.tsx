<<<<<<< HEAD
import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { TrendingUp, TrendingDown, Package, Users, Truck, AlertCircle } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { analyticsService, DashboardStats, ProductionData, TransformerDistribution, TestingProgress, RecentActivity as ActivityType } from '../utils/analyticsService';

export function Dashboard() {
  const [stats, setStats] = useState([
    { label: 'Current Orders', value: '...', change: '...', trending: 'up', icon: Package },
    { label: 'Active Workers', value: '...', change: '...', trending: 'up', icon: Users },
    { label: 'Pending Tests', value: '...', change: '...', trending: 'down', icon: AlertCircle },
    { label: 'Dispatched Today', value: '...', change: '...', trending: 'up', icon: Truck },
  ]);

  const [productionData, setProductionData] = useState<ProductionData[]>([]);
  const [transformerTypes, setTransformerTypes] = useState<TransformerDistribution[]>([]);
  const [testingProgress, setTestingProgress] = useState<TestingProgress[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, prodData, distData, progressData, activityData] = await Promise.all([
          analyticsService.getDashboardStats(),
          analyticsService.getProductionOverview(),
          analyticsService.getTransformerDistribution(),
          analyticsService.getTestingProgress(),
          analyticsService.getRecentActivity()
        ]);

        setStats([
            { label: 'Current Orders', value: statsData.currentOrders.toString(), change: '+0%', trending: 'up', icon: Package },
            { label: 'Active Workers', value: statsData.activeWorkers.toString(), change: '+0%', trending: 'up', icon: Users },
            { label: 'Pending Tests', value: statsData.pendingTests.toString(), change: '-0%', trending: 'down', icon: AlertCircle },
            { label: 'Dispatched Today', value: statsData.dispatchedToday.toString(), change: '+0%', trending: 'up', icon: Truck },
        ]);
        setProductionData(prodData);
        setTransformerTypes(distData);
        setTestingProgress(progressData);
        setRecentActivity(activityData);

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
      return <div className="p-6">Loading dashboard data...</div>;
  }
=======
import { Card } from './ui/card';
import { TrendingUp, TrendingDown, Package, Users, Truck, AlertCircle } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function Dashboard() {
  const stats = [
    { label: 'Current Orders', value: '25', change: '+15%', trending: 'up', icon: Package },
    { label: 'Active Workers', value: '18', change: '+8%', trending: 'up', icon: Users },
    { label: 'Pending Tests', value: '36', change: '-6%', trending: 'down', icon: AlertCircle },
    { label: 'Dispatched Today', value: '12', change: '+20%', trending: 'up', icon: Truck },
  ];

  const productionData = [
    { month: 'Jan', production: 45 },
    { month: 'Feb', production: 52 },
    { month: 'Mar', production: 48 },
    { month: 'Apr', production: 61 },
    { month: 'May', production: 55 },
    { month: 'Jun', production: 67 },
  ];

  const transformerTypes = [
    { name: 'Dead Tank Type-1', value: 30, color: '#ff6b6b' },
    { name: 'Dead Tank Type-2', value: 20, color: '#4ecdc4' },
    { name: 'Live Tank Type', value: 15, color: '#45b7d1' },
    { name: 'Indoor ERC', value: 10, color: '#96ceb4' },
    { name: 'Outdoor ERC', value: 25, color: '#ffeaa7' },
  ];

  const testingProgress = [
    { stage: 'Visual Inspection', completed: 28, pending: 8 },
    { stage: 'Electrical Test', completed: 22, pending: 14 },
    { stage: 'Performance Test', completed: 18, pending: 18 },
    { stage: 'Final QC', completed: 15, pending: 21 },
  ];
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1

  return (
    <div className="space-y-6">
      <div>
        <h2>Dashboard Overview</h2>
        <p className="text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trending === 'up' ? TrendingUp : TrendingDown;
          
          return (
            <Card key={stat.label} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <h3 className="mt-2">{stat.value}</h3>
                  <div className={`flex items-center gap-1 mt-2 text-sm ${
                    stat.trending === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendIcon className="w-4 h-4" />
                    <span>{stat.change}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${
                  stat.trending === 'up' ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    stat.trending === 'up' ? 'text-green-600' : 'text-red-600'
                  }`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Overview */}
        <Card className="p-6">
          <h3 className="mb-4">Production Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={productionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="production" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Transformer Distribution */}
        <Card className="p-6">
          <h3 className="mb-4">Transformer Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={transformerTypes}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {transformerTypes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Testing Progress */}
      <Card className="p-6">
        <h3 className="mb-4">Testing Progress by Stage</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={testingProgress}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="stage" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="completed" fill="#10b981" name="Completed" />
            <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="mb-4">Recent Activity</h3>
        <div className="space-y-4">
<<<<<<< HEAD
          {recentActivity.map((activity, idx) => (
=======
          {[
            { action: 'New order received', detail: 'Dead Tank Type-1 - Order #1234', time: '5 min ago', type: 'success' },
            { action: 'Testing completed', detail: 'Live Tank Type - Order #1230', time: '1 hour ago', type: 'info' },
            { action: 'Worker assigned', detail: 'John Doe assigned to Order #1235', time: '2 hours ago', type: 'info' },
            { action: 'Dispatch scheduled', detail: 'Order #1228 scheduled for tomorrow', time: '3 hours ago', type: 'warning' },
          ].map((activity, idx) => (
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
            <div key={idx} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                activity.type === 'success' ? 'bg-green-500' :
                activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
              }`} />
              <div className="flex-1">
                <p>{activity.action}</p>
                <p className="text-sm text-gray-500">{activity.detail}</p>
              </div>
              <span className="text-sm text-gray-400">{activity.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

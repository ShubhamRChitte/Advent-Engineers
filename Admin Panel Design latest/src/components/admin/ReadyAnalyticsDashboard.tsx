import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, Package, Clock, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { Skeleton } from '../ui/skeleton';

interface AnalyticsData {
  total: number;
  available: number;
  used: number;
  reserved: number;
  usageRate: number;
}

export default function ReadyAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get(`/ready-transformers/analytics`, {
          withCredentials: true
        });
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-[#003a70]" />
          <h2 className="text-xl font-bold text-gray-900">Inventory Performance Analytics</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-4 flex flex-col items-center justify-center space-y-2">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-20 h-4" />
              <Skeleton className="w-12 h-8" />
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <Skeleton className="w-32 h-6 mb-4" />
            <Skeleton className="w-full h-[300px] rounded-full mx-auto max-w-[300px]" />
          </Card>
          <Card className="p-6">
            <Skeleton className="w-40 h-6 mb-4" />
            <Skeleton className="w-full h-[300px]" />
          </Card>
        </div>
      </div>
    );
  }
  if (!data) return <div className="p-10 text-center text-red-500">Failed to load analytics data</div>;

  const pieData = [
    { name: 'Available', value: data.available, color: '#10b981' },
    { name: 'Used', value: data.used, color: '#3b82f6' },
    { name: 'Reserved', value: data.reserved, color: '#f59e0b' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-[#003a70]" />
        <h2 className="text-xl font-bold text-gray-900">Inventory Performance Analytics</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col items-center justify-center space-y-1">
          <Package className="w-8 h-8 text-blue-500" />
          <p className="text-sm text-gray-500">Total Stock</p>
          <p className="text-3xl font-bold">{data.total}</p>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center space-y-1">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-green-500" />
          </div>
          <p className="text-sm text-gray-500">Usage Rate</p>
          <p className="text-3xl font-bold">{data.usageRate.toFixed(1)}%</p>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center space-y-1">
          <Clock className="w-8 h-8 text-amber-500" />
          <p className="text-sm text-gray-500">Pending Reservations</p>
          <p className="text-3xl font-bold">{data.reserved}</p>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center space-y-1">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm text-gray-500">Critical Replacements</p>
          <p className="text-3xl font-bold">{data.used}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Stock Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-600">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Core Type Breakdown</h3>
          {/* Placeholder for core type chart - could add this to analytics API later */}
          <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <p className="text-sm text-gray-400 italic">Core type distribution metrics loading...</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

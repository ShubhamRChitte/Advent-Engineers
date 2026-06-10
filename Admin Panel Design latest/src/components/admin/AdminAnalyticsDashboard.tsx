import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  TrendingUp, 
  Package, 
  CheckCircle2, 
  AlertCircle, 
  Truck, 
  Layers, 
  Activity, 
  PieChart as PieChartIcon,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  AreaChart,
  Area
} from 'recharts';
import ReadyAnalyticsDashboard from './ReadyAnalyticsDashboard';

export function AdminAnalyticsDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/dashboard/analytics/detailed`, { withCredentials: true });
      setData(res.data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Analyzing Production Data...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Failed to load analytics.</div>;

  const completionRate = Math.round((data.completedUnits / data.totalUnits) * 100) || 0;

  // Prepare data for the Stage Distribution Chart
  const stageChartData = data.stageDistribution.map((item: any) => {
    const stageName = item._id || 'Unknown';
    return {
      name: stageName.charAt(0).toUpperCase() + stageName.slice(1),
      count: item.count
    };
  }).sort((a: any, b: any) => b.count - a.count);

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

  return (
    <div className="space-y-8 p-1">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-[#003a70] to-[#005a9c] bg-clip-text text-transparent">
            Production Intelligence
          </h2>
          <p className="text-gray-500 mt-1">Advanced metrics and real-time manufacturing insights</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
          <Badge variant="outline" className="px-3 py-1 bg-green-50 text-green-700 border-green-100 animate-pulse">
            LIVE UPDATES
          </Badge>
          <span className="text-xs text-gray-400">Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* High-Level Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 overflow-hidden relative group hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-br from-blue-600 to-blue-700">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-125 duration-500" />
          <div className="relative z-10">
            <div className="p-2 bg-white/20 w-fit rounded-lg mb-4">
              <Package className="w-6 h-6 text-white" />
            </div>
            <p className="text-blue-100 text-sm font-medium">Total Transformers</p>
            <h3 className="text-3xl font-bold text-white mt-1">{data.totalUnits}</h3>
            <div className="flex items-center gap-1 mt-4 text-blue-100 text-xs">
              <ArrowUpRight className="w-3 h-3" />
              <span>Across {data.totalOrders} active orders</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 overflow-hidden relative group hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-br from-indigo-600 to-indigo-700">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-125 duration-500" />
          <div className="relative z-10">
            <div className="p-2 bg-white/20 w-fit rounded-lg mb-4">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <p className="text-indigo-100 text-sm font-medium">In Progress</p>
            <h3 className="text-3xl font-bold text-white mt-1">{data.pendingUnits}</h3>
            <div className="w-full bg-white/20 h-1.5 rounded-full mt-4 overflow-hidden">
                <div className="bg-white h-full transition-all duration-1000" style={{ width: `${100 - completionRate}%` }} />
            </div>
          </div>
        </Card>

        <Card className="p-6 overflow-hidden relative group hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-br from-emerald-600 to-emerald-700">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-125 duration-500" />
          <div className="relative z-10">
            <div className="p-2 bg-white/20 w-fit rounded-lg mb-4">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <p className="text-emerald-100 text-sm font-medium">Units Shipped</p>
            <h3 className="text-3xl font-bold text-white mt-1">{data.completedUnits}</h3>
            <div className="flex items-center gap-1 mt-4 text-emerald-100 text-xs">
              <Award className="w-3 h-3" />
              <span>{completionRate}% overall efficiency</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 overflow-hidden relative group hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-br from-rose-600 to-rose-700">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-125 duration-500" />
          <div className="relative z-10">
            <div className="p-2 bg-white/20 w-fit rounded-lg mb-4">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <p className="text-rose-100 text-sm font-medium">Admin Review</p>
            <h3 className="text-3xl font-bold text-white mt-1">{data.rejectedUnits}</h3>
            <div className="flex items-center gap-1 mt-4 text-rose-100 text-xs">
              <ArrowDownRight className="w-3 h-3" />
              <span>Requires immediate attention</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-8 shadow-sm hover:shadow-md transition-shadow border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Layers className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-900">Production Funnel</h4>
              <p className="text-xs text-gray-400">Unit distribution across stages</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageChartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={12} width={100} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={32}>
                  {stageChartData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-8 shadow-sm hover:shadow-md transition-shadow border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-purple-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-900">Completion Growth</h4>
              <p className="text-xs text-gray-400">Monthly units passed final testing</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyTrend.reverse()}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                    dataKey="_id" 
                    tickFormatter={(val) => `Month ${val.month}`}
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                    tick={{ fill: '#94a3b8' }}
                />
                <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#94a3b8' }} />
                <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#8b5cf6" 
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                    strokeWidth={3}
                    name="Completed Units"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Details Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 border-none bg-slate-50">
              <div className="flex items-center gap-4">
                  <div className="p-4 bg-white rounded-2xl shadow-sm text-blue-600">
                      <BarChart3 className="w-6 h-6" />
                  </div>
                  <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Load</p>
                      <h4 className="text-2xl font-bold">{data.totalUnits} Units</h4>
                  </div>
              </div>
          </Card>
          
          <Card className="p-6 border-none bg-slate-50">
              <div className="flex items-center gap-4">
                  <div className="p-4 bg-white rounded-2xl shadow-sm text-emerald-600">
                      <Truck className="w-6 h-6" />
                  </div>
                  <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Active Orders</p>
                      <h4 className="text-2xl font-bold">{data.totalOrders} Projects</h4>
                  </div>
              </div>
          </Card>

          <Card className="p-6 border-none bg-slate-50">
              <div className="flex items-center gap-4">
                  <div className="p-4 bg-white rounded-2xl shadow-sm text-purple-600">
                      <PieChartIcon className="w-6 h-6" />
                  </div>
                  <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Ready to Ship</p>
                      <h4 className="text-2xl font-bold">{data.completedUnits} Units</h4>
                  </div>
              </div>
          </Card>
      </div>

      {/* Ready Inventory Analytics Section */}
      <div className="pt-8 border-t border-gray-200">
        <ReadyAnalyticsDashboard />
      </div>
    </div>
  );
}

// Re-using Award icon since I don't want to import separate icons for now
const Award = ({ className }: { className?: string }) => (
    <Activity className={className} />
);

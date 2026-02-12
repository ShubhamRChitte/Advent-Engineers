<<<<<<< HEAD
import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Clock, Award, AlertCircle, LucideIcon, PieChart, Activity } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { analyticsService, ProductionData, WorkerPerformance, KPI } from '../utils/analyticsService';

export function AdvancedAnalytics() {
  const [performanceData, setPerformanceData] = useState<ProductionData[]>([]);
  const [workerPerformance, setWorkerPerformance] = useState<WorkerPerformance[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);

  // Mapped icons for dynamic rendering
  const iconMap: Record<string, LucideIcon> = {
      'DollarSign': DollarSign,
      'Clock': Clock,
      'Award': Award,
      'AlertCircle': AlertCircle,
      'TrendingUp': TrendingUp, 
      'TrendingDown': TrendingDown,
      'PieChart': PieChart,
      'Activity': Activity
  };


  useEffect(() => {
    const fetchData = async () => {
        try {
            const [prodData, advancedData] = await Promise.all([
                analyticsService.getProductionOverview(),
                analyticsService.getAdvancedAnalytics()
            ]);

            setPerformanceData(prodData);
            setWorkerPerformance(advancedData.workerPerformance);
            setKpis(advancedData.kpis);

        } catch (error) {
            console.error("Failed to fetch advanced analytics:", error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);
=======
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Clock, Award, AlertCircle } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export function AdvancedAnalytics() {
  const performanceData = [
    { month: 'Jan', orders: 45, revenue: 450, efficiency: 85 },
    { month: 'Feb', orders: 52, revenue: 520, efficiency: 88 },
    { month: 'Mar', orders: 48, revenue: 480, efficiency: 82 },
    { month: 'Apr', orders: 61, revenue: 610, efficiency: 90 },
    { month: 'May', orders: 55, revenue: 550, efficiency: 87 },
    { month: 'Jun', orders: 67, revenue: 670, efficiency: 92 },
  ];

  const workerPerformance = [
    { name: 'John Doe', completed: 156, efficiency: 95, quality: 98 },
    { name: 'Jane Smith', completed: 98, efficiency: 92, quality: 96 },
    { name: 'Mike Johnson', completed: 67, efficiency: 88, quality: 94 },
    { name: 'Sarah Wilson', completed: 234, efficiency: 97, quality: 99 },
    { name: 'Tom Brown', completed: 89, efficiency: 85, quality: 92 },
  ];
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1

  const qualityMetrics = [
    { metric: 'Visual Inspection', score: 95 },
    { metric: 'Electrical Tests', score: 92 },
    { metric: 'Performance', score: 88 },
    { metric: 'Safety Standards', score: 98 },
    { metric: 'Documentation', score: 90 },
  ];

<<<<<<< HEAD
=======
  const kpis = [
    {
      label: 'Average Order Value',
      value: '$12,500',
      change: '+18%',
      trending: 'up',
      icon: DollarSign,
    },
    {
      label: 'Avg. Testing Time',
      value: '14.2 hrs',
      change: '-12%',
      trending: 'up',
      icon: Clock,
    },
    {
      label: 'Quality Score',
      value: '96.5%',
      change: '+5%',
      trending: 'up',
      icon: Award,
    },
    {
      label: 'Defect Rate',
      value: '2.1%',
      change: '-8%',
      trending: 'up',
      icon: AlertCircle,
    },
  ];

>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
  const testingEfficiency = [
    { stage: 'Visual', avgTime: 2.5, target: 3 },
    { stage: 'Electrical', avgTime: 5.2, target: 6 },
    { stage: 'Performance', avgTime: 7.1, target: 8 },
    { stage: 'QC', avgTime: 1.8, target: 2 },
  ];

<<<<<<< HEAD
  if (loading) return <div className="p-6">Loading analytics...</div>;

=======
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
  return (
    <div className="space-y-6">
      <div>
        <h2>Advanced Analytics</h2>
        <p className="text-gray-500 mt-1">Deep insights into operations and performance</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
<<<<<<< HEAD
          const Icon = iconMap[kpi.icon] || AlertCircle;
=======
          const Icon = kpi.icon;
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
          const TrendIcon = kpi.trending === 'up' ? TrendingUp : TrendingDown;
          const isPositive = kpi.trending === 'up';
          
          return (
            <Card key={kpi.label} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{kpi.label}</p>
                  <h3 className="mt-2">{kpi.value}</h3>
                  <div className={`flex items-center gap-1 mt-2 text-sm ${
                    isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendIcon className="w-4 h-4" />
                    <span>{kpi.change}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${
                  isPositive ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    isPositive ? 'text-green-600' : 'text-red-600'
                  }`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="mb-4">Orders & Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
<<<<<<< HEAD
              <Area type="monotone" dataKey="production" stroke="#ef4444" fillOpacity={1} fill="url(#colorOrders)" name="Orders" />
               {/* Revenue is not yet fully dynamically mapped in productionData for this chart, using orders as proxy for now or need to updating aggregation */}
=======
              <Area type="monotone" dataKey="orders" stroke="#ef4444" fillOpacity={1} fill="url(#colorOrders)" name="Orders" />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue (K)" />
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4">Operational Efficiency</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
<<<<<<< HEAD
              {/* Mocking efficiency as it's not yet in the production endpoint */}
              <Line type="monotone" dataKey="production" stroke="#10b981" strokeWidth={3} name="Efficiency (Proxy)" />
=======
              <Line type="monotone" dataKey="efficiency" stroke="#10b981" strokeWidth={3} name="Efficiency %" />
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Worker Performance & Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="mb-4">Top Performing Workers</h3>
          <div className="space-y-4">
            {workerPerformance.map((worker, idx) => (
              <div key={worker.name} className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-600">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium">{worker.name}</p>
<<<<<<< HEAD
                    <Badge variant="outline">{worker.completed} tasks</Badge>
=======
                    <Badge variant="outline">{worker.completed} tests</Badge>
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
                  </div>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>Efficiency: {worker.efficiency}%</span>
                    <span>Quality: {worker.quality}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4">Quality Metrics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={qualityMetrics}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="Score" dataKey="score" stroke="#ef4444" fill="#ef4444" fillOpacity={0.5} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Testing Efficiency */}
      <Card className="p-6">
        <h3 className="mb-4">Testing Stage Efficiency (Avg. Time vs Target)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={testingEfficiency}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="stage" />
            <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="avgTime" fill="#10b981" name="Average Time" />
            <Bar dataKey="target" fill="#94a3b8" name="Target Time" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <h4 className="text-green-900">Strong Performance</h4>
              <p className="text-sm text-green-700 mt-1">
                Testing efficiency up 12% this month. Workers are completing tasks faster than target times.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Award className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <h4 className="text-blue-900">Quality Excellence</h4>
              <p className="text-sm text-blue-700 mt-1">
                Maintaining 96.5% quality score across all testing stages. Outstanding performance!
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
            <div>
              <h4 className="text-yellow-900">Attention Needed</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Dead Tank Type-2 inventory running low. Consider increasing production.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

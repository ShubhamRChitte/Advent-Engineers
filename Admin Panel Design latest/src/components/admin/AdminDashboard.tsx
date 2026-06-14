import { useState } from 'react';
import useSWR from 'swr';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Users, Package, ClipboardCheck, TrendingUp, AlertCircle, CheckCircle2, PlusCircle, List, ArrowRight } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AdminDashboardProps {
  setActiveView?: (view: string) => void;
}

const ICON_MAP: any = {
  Users: Users,
  Package: Package,
  CheckCircle2: CheckCircle2,
  AlertCircle: AlertCircle
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function AdminDashboard({ setActiveView }: AdminDashboardProps) {
  const [trendTimeframe, setTrendTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const { data, error, isLoading } = useSWR(
    `/dashboard/stats`,
    fetcher
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading || (!data && !error)) {
    return (
      <div className="space-y-6 animate-pulse">
        <div>
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-6 h-32 bg-gray-100 border-none"></Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 h-24 bg-gray-100 border-none"></Card>
          <Card className="p-6 h-24 bg-gray-100 border-none"></Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 h-80 bg-gray-100 border-none"></Card>
          <Card className="p-6 h-80 bg-gray-100 border-none"></Card>
        </div>
      </div>
    );
  }

  const stats = data?.stats || [];
  const wipData = data?.wipData || [];
  const testerData = data?.testerData || [];
  const trendData = data?.productionTrend?.[trendTimeframe] || [];
  const activities = data?.recentActivity || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard Overview</h2>
        <p className="text-gray-500 mt-1">Welcome back! Here's your testing system summary.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.filter((stat: any) => stat.label !== 'Tests Completed').map((stat: any) => {
          const Icon = ICON_MAP[stat.icon] || AlertCircle;

          return (
            <Card key={stat.label} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <h3 className="text-xl font-bold mt-2">{stat.value}</h3>
                  <p className="text-sm text-green-600 mt-2">{stat.change} this month</p>
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
                  <h3 className="text-white font-bold text-lg">Add New Order</h3>
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
                  <h3 className="text-purple-900 font-bold text-lg">View All Orders</h3>
                  <p className="text-purple-700 text-sm mt-1">Track order status and reports</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-purple-600" />
            </div>
          </Card>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Active WIP by Stage */}
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-800">Active Work-in-Progress (WIP) by Stage</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              layout="vertical"
              data={wipData}
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} vertical={true} />
              <XAxis type="number" allowDecimals={false} stroke="#94a3b8" />
              <YAxis dataKey="stage" type="category" width={160} stroke="#94a3b8" fontSize={12} />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="count" fill="#003a70" radius={[0, 4, 4, 0]} name="Active Units" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* 2. Tester Performance */}
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-800">Top Tester Performance</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              layout="vertical"
              data={testerData}
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} vertical={true} />
              <XAxis type="number" allowDecimals={false} stroke="#94a3b8" />
              <YAxis dataKey="tester" type="category" width={120} stroke="#94a3b8" fontSize={12} />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border border-gray-100 rounded-lg shadow-lg text-sm space-y-1">
                        <p className="font-bold text-gray-800">{d.tester}</p>
                        <p className="text-gray-600"><span className="font-medium text-[#8b5cf6]">Units Tested:</span> {d.unitsTested}</p>
                        <p className="text-gray-600"><span className="font-medium text-amber-600">Average Delay:</span> {d.averageDelay} min</p>
                        <p className="text-gray-600"><span className="font-medium text-red-500">Total Delay:</span> {d.totalDelay} min</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="unitsTested" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Units Tested" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* 3. Daily Production Output Trend */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Production Output Trend</h3>
            <p className="text-sm text-gray-500 mt-0.5">Completed and approved transformers over time</p>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg self-start sm:self-center">
            {(['daily', 'weekly', 'monthly'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTrendTimeframe(t)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${
                  trendTimeframe === t
                    ? 'bg-white text-[#003a70] shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="top" height={36} />
            <Line type="monotone" dataKey="ct" stroke="#3b82f6" strokeWidth={3} name="CT Completed Units" activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="pt" stroke="#ec4899" strokeWidth={3} name="PT Completed Units" activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>


      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent activity.</p>
          ) : (
            activities.map((activity: any, idx: number) => (
              <div key={idx} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                <div className={`w-2 h-2 rounded-full mt-2 ${activity.type === 'success' ? 'bg-green-500' :
                  activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                <div className="flex-1">
                  <p className="font-medium">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.detail}</p>
                </div>
                <span className="text-sm text-gray-400 whitespace-nowrap">{formatTime(activity.time)}</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

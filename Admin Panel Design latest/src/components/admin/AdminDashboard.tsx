import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Users, Package, ClipboardCheck, TrendingUp, AlertCircle, CheckCircle2, PlusCircle, List, ArrowRight } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AdminDashboardProps {
  setActiveView?: (view: string) => void;
}

export function AdminDashboard({ setActiveView }: AdminDashboardProps) {
  const stats = [
    { label: 'Total Employees', value: '45', icon: Users, color: 'blue', change: '+5' },
    { label: 'Active Orders', value: '28', icon: Package, color: 'purple', change: '+12' },
    { label: 'Tests Completed', value: '156', icon: CheckCircle2, color: 'green', change: '+23' },
    { label: 'Pending Tests', value: '12', icon: AlertCircle, color: 'orange', change: '-3' },
  ];

  const testingData = [
    { month: 'Jan', core: 45, secondary: 42, final: 40 },
    { month: 'Feb', core: 52, secondary: 48, final: 45 },
    { month: 'Mar', core: 48, secondary: 45, final: 43 },
    { month: 'Apr', core: 61, secondary: 58, final: 55 },
    { month: 'May', core: 55, secondary: 52, final: 50 },
    { month: 'Jun', core: 67, secondary: 64, final: 61 },
  ];

  const orderData = [
    { name: 'Pending', value: 8 },
    { name: 'Core Testing', value: 12 },
    { name: 'Secondary Testing', value: 6 },
    { name: 'Final Testing', value: 10 },
    { name: 'Completed', value: 15 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2>Dashboard Overview</h2>
        <p className="text-gray-500 mt-1">Welcome back! Here's your testing system summary.</p>
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
                  <h3 className="text-white">Add New Order</h3>
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
                  <h3 className="text-purple-900">View All Orders</h3>
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
          <h3 className="mb-4">Testing Progress Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={testingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="core" stroke="#3b82f6" strokeWidth={2} name="Core Tests" />
              <Line type="monotone" dataKey="secondary" stroke="#8b5cf6" strokeWidth={2} name="Secondary Tests" />
              <Line type="monotone" dataKey="final" stroke="#10b981" strokeWidth={2} name="Final Tests" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4">Order Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={orderData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[
            { action: 'New order created', detail: 'Order #JOB-2025-001 by Sarah Johnson', time: '10 min ago', type: 'success' },
            { action: 'Core test completed', detail: 'Core #CORE-2025-156 passed testing', time: '25 min ago', type: 'info' },
            { action: 'Employee added', detail: 'New tester John Doe added to team', time: '1 hour ago', type: 'info' },
            { action: 'Test failed', detail: 'Core #CORE-2025-155 failed - sent for rework', time: '2 hours ago', type: 'warning' },
          ].map((activity, idx) => (
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
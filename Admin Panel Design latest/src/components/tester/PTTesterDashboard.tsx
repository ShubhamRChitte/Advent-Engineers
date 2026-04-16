import { Card } from '../ui/card';
import { ClipboardCheck, Activity, Clock, CheckCircle2 } from 'lucide-react';

interface PTTesterDashboardProps {
  setActiveView: (view: string) => void;
  stats: { activeTests: number; completedTests: number };
  recentActivity: any[];
  loading: boolean;
}

export function PTTesterDashboard({ setActiveView, stats, recentActivity, loading }: PTTesterDashboardProps) {
  const renderRecentActivity = () => {
    if (loading) return <p className="text-sm text-gray-500">Loading activity...</p>;
    if (recentActivity.length === 0) return <p className="text-sm text-gray-500">No recent activity found.</p>;

    return (
      <div className="space-y-3">
        {recentActivity.map((act, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100">
            <div>
              <p className="font-medium text-sm">{act.id}</p>
              <p className="text-xs text-gray-500">{act.client}</p>
            </div>
            <div className="text-right">
              <span className={`text-xs px-2 py-1 rounded-full ${act.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                {act.status}
              </span>
              <p className="text-[10px] text-gray-400 mt-1">{new Date(act.time).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">PT Testing Dashboard</h2>
        <p className="text-gray-500 mt-1">Manage PT testing for assigned transformers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 hover:shadow-lg transition-all cursor-pointer border-t-4 border-t-purple-600" onClick={() => setActiveView('testing')}>
          <ClipboardCheck className="w-10 h-10 text-purple-600 mb-4" />
          <h3 className="font-semibold text-gray-800">Assigned Orders</h3>
          <p className="text-gray-500 text-sm mt-2">View and perform testing on assigned PT orders</p>
        </Card>

        <Card className="p-6 bg-white border-l-4 border-l-blue-500 shadow-sm">
          <Activity className="w-10 h-10 text-blue-500 mb-4" />
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Active Units</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">{loading ? '...' : stats.activeTests}</p>
          <div className="flex items-center mt-2 text-xs text-blue-600">
            <Clock className="w-3 h-3 mr-1" />
            Currently at PT testing stage
          </div>
        </Card>

        <Card className="p-6 bg-white border-l-4 border-l-green-500 shadow-sm">
          <CheckCircle2 className="w-10 h-10 text-green-500 mb-4" />
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Units Completed</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">{loading ? '...' : stats.completedTests}</p>
          <div className="flex items-center mt-2 text-xs text-green-600">
            <Activity className="w-3 h-3 mr-1" />
            Verified this month
          </div>
        </Card>
      </div>

      <Card className="p-6 overflow-hidden border-none shadow-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-gray-800">Recent Activity</h3>
          <span className="text-xs text-gray-400 font-medium uppercase">Last 5 actions</span>
        </div>
        {renderRecentActivity()}
      </Card>
    </div>
  );
}

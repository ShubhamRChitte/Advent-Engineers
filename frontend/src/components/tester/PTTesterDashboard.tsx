import { Card } from '../ui/card';
import { ClipboardCheck, Activity, Clock, CheckCircle2, ArrowRight, Zap, Inbox } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface PTTesterDashboardProps {
  setActiveView: (view: string) => void;
  stats: { activeTests: number; completedTests: number };
  recentActivity: any[];
  loading: boolean;
}

export function PTTesterDashboard({ setActiveView, stats, recentActivity, loading }: PTTesterDashboardProps) {
  const renderRecentActivity = () => {
    if (loading) return (
        <div className="flex flex-col items-center justify-center py-10 space-y-3">
            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-gray-500">Loading your activity...</p>
        </div>
    );
    if (recentActivity.length === 0) return (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Inbox className="w-6 h-6 text-gray-400" />
            </div>
            <h4 className="text-gray-700 font-semibold">No Recent Activity</h4>
            <p className="text-sm text-gray-500 max-w-[250px] mt-1">When you perform actions on transformers, they will appear here.</p>
        </div>
    );

    return (
      <div className="space-y-4">
        {recentActivity.map((act, idx) => (
          <div key={idx} className="group flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${act.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {act.client ? act.client.charAt(0).toUpperCase() : 'T'}
                </div>
                <div>
                    <p className="font-semibold text-gray-800 group-hover:text-purple-700 transition-colors">{act.id}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{act.client || 'Unknown Client'}</p>
                </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${act.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                {act.status}
              </span>
              <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1 font-medium">
                <Clock className="w-3 h-3" />
                {new Date(act.time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-700" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Final PT Testing Dashboard</h2>
                <p className="text-gray-500 text-sm mt-1">Manage and verify Final PT testing for assigned transformers.</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Action Card */}
        <Card 
            className="group p-4 bg-white border-2 border-purple-100 hover:border-purple-300 cursor-pointer shadow-sm hover:shadow-md transition-all duration-200" 
            onClick={() => setActiveView('testing')}
        >
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ClipboardCheck className="w-5 h-5 text-purple-600" />
          </div>
          
          <h3 className="text-base font-bold text-gray-800 mb-1">Assigned Orders</h3>
          <p className="text-gray-500 text-xs mb-3">View and perform testing on assigned PT orders.</p>
          
          <div className="flex items-center text-xs font-semibold text-purple-700 group-hover:gap-2 transition-all">
            Start Testing <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </Card>

        {/* Stat Card 1 */}
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <span className="bg-blue-50 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>
          </div>
          <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Units Pending</h3>
          <div className="flex items-end gap-3">
            {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.activeTests}</p>}
          </div>
          <div className="flex items-center mt-2.5 text-[11px] font-medium text-gray-500">
            <Clock className="w-3 h-3 mr-1 text-blue-500" />
            Currently awaiting tests
          </div>
        </Card>

        {/* Stat Card 2 */}
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <span className="bg-green-50 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Done</span>
          </div>
          <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Units Completed</h3>
          <div className="flex items-end gap-3">
            {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.completedTests}</p>}
          </div>
          <div className="flex items-center mt-2.5 text-[11px] font-medium text-gray-500">
            <Activity className="w-3 h-3 mr-1 text-green-500" />
            Successfully verified
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-white border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-gray-400" />
            <h3 className="font-bold text-gray-800">Recent Activity Timeline</h3>
          </div>
          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded font-medium uppercase tracking-wider">Last 5 Actions</span>
        </div>
        <div>
            {renderRecentActivity()}
        </div>
      </Card>
    </div>
  );
}

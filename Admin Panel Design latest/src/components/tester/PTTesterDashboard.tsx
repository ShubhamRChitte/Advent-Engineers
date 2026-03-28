import { Card } from '../ui/card';
import { ClipboardCheck, FileText, Activity } from 'lucide-react';

interface PTTesterDashboardProps {
  setActiveView: (view: string) => void;
}

export function PTTesterDashboard({ setActiveView }: PTTesterDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2>PT Testing Dashboard</h2>
        <p className="text-gray-500 mt-1">Welcome to your PT testing workspace</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveView('testing')}>
          <ClipboardCheck className="w-12 h-12 text-[#003a70] mb-4" />
          <h3 className="mb-2">Assigned Orders</h3>
          <p className="text-gray-500 text-sm">View and perform testing on assigned PT orders</p>
        </Card>

        <Card className="p-6 bg-blue-50 border-blue-200">
          <Activity className="w-12 h-12 text-blue-600 mb-4" />
          <h3 className="mb-2">Active Tests</h3>
          <p className="text-2xl text-blue-700">0</p>
          <p className="text-gray-500 text-sm mt-1">Currently in progress</p>
        </Card>

        <Card className="p-6 bg-green-50 border-green-200">
          <FileText className="w-12 h-12 text-green-600 mb-4" />
          <h3 className="mb-2">Completed</h3>
          <p className="text-2xl text-green-700">0</p>
          <p className="text-gray-500 text-sm mt-1">Tests this month</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <p className="text-sm text-gray-500">No recent activity.</p>
        </div>
      </Card>
    </div>
  );
}

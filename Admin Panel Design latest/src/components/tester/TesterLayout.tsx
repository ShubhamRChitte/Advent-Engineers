import { useState } from 'react';
import { User } from '../../App';
import { TesterSidebar } from './TesterSidebar';
import { TesterHeader } from './TesterHeader';
import { CoreTestingModule } from './CoreTestingModule';
import { SecondaryTestingModule } from './SecondaryTestingModule';
import { AfterPrimaryTestingModule } from './AfterPrimaryTestingModule';
import { FinalTestingModule } from './FinalTestingModule';
import { TesterNotifications } from './TesterNotifications';
import { SecondaryReportsList } from './SecondaryReportsList';
import { CoreTrackingDashboard } from '../testing/CoreTrackingDashboard';
import { Card } from '../ui/card';
import { ClipboardCheck, Activity, Clock, CheckCircle2 } from 'lucide-react';
import { AfterPrimaryReportsList } from './reports/AfterPrimaryReportsList';
import { FinalReportsList } from './reports/FinalReportsList';
import { FailedCoresPage } from '../../pages/FailedCoresPage';
import { PTTesterDashboard } from './PTTesterDashboard';
import { PTTestingModule } from './PTTestingModule';
import { PTReportsList } from './PTReportsList';
import { OrdersListViewEnhanced } from '../entry/OrdersListViewEnhanced';
import { OrderDetailsView } from './OrderDetailsView';
import { useTesterStats } from './useTesterStats';

interface TesterLayoutProps {
  user: User;
  onLogout: () => void;
}

export function TesterLayout({ user, onLogout }: TesterLayoutProps) {
  const [activeView, _setActiveView] = useState(() => {
    return localStorage.getItem(`${user.role}_activeView`) || 'home';
  });

  const { stats, recentActivity, loading } = useTesterStats(user.role, user.name);

  const [selectedOrderId, _setSelectedOrderId] = useState<string | null>(() => {
    return localStorage.getItem(`${user.role}_selectedOrderId`);
  });

  const setActiveView = (view: string) => {
    localStorage.setItem(`${user.role}_activeView`, view);
    _setActiveView(view);
  };

  const handleViewOrder = (orderId: string) => {
    localStorage.setItem(`${user.role}_selectedOrderId`, orderId);
    _setSelectedOrderId(orderId);
    setActiveView('order-details');
  };
  const setViewHome = () => {
    localStorage.removeItem(`${user.role}_selectedOrderId`);
    _setSelectedOrderId(null);
    setActiveView('home');
  };

  const renderRecentActivity = (activities: any[]) => {
    if (loading) return <p className="text-sm text-gray-500">Loading activity...</p>;
    if (activities.length === 0) return <p className="text-sm text-gray-500">No recent activity found.</p>;

    return (
      <div className="space-y-3">
        {activities.map((act, idx) => (
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

  const renderView = () => {
    // Notifications view for all testers
    if (activeView === 'notifications') {
      return <TesterNotifications 
        userRole={user.role} 
        userName={user.name} 
        onViewOrder={handleViewOrder}
      />;
    }

    if (activeView === 'order-details' && selectedOrderId) {
      return (
        <OrderDetailsView 
          orderId={selectedOrderId} 
          onBack={() => setActiveView('notifications')} 
        />
      );
    }


    // PT Tester
    if (user.role === 'pt-tester') {
      if (activeView === 'home') return <PTTesterDashboard setActiveView={setActiveView} stats={stats} recentActivity={recentActivity} loading={loading} />;
      if (activeView === 'testing') return <PTTestingModule user={user} />;

      if (activeView === 'view-orders') return <OrdersListViewEnhanced userRole={user.role} />;
      if (activeView === 'reports') return <PTReportsList onBack={setViewHome} />;
      return <PTTesterDashboard setActiveView={setActiveView} stats={stats} recentActivity={recentActivity} loading={loading} />;
    }

    // Core Tester Views
    if (user.role === 'core-tester') {
      if (activeView === 'home') {
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Core Testing Dashboard</h2>
              <p className="text-gray-500 mt-1">Real-time status of your assigned core testing tasks</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 hover:shadow-lg transition-all cursor-pointer border-t-4 border-t-[#003a70]" onClick={() => setActiveView('core-tracking')}>
                <ClipboardCheck className="w-10 h-10 text-[#003a70] mb-4" />
                <h3 className="font-semibold text-gray-800">Assigned Orders</h3>
                <p className="text-gray-500 text-sm mt-2">View and perform testing on assigned core orders</p>
              </Card>

              <Card className="p-6 bg-white border-l-4 border-l-blue-500 shadow-sm">
                <Activity className="w-10 h-10 text-blue-500 mb-4" />
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Active Units</h3>
                <p className="text-3xl font-bold text-gray-900 mt-1">{loading ? '...' : stats.activeTests}</p>
                <div className="flex items-center mt-2 text-xs text-blue-600">
                  <Clock className="w-3 h-3 mr-1" />
                  Currently at core testing stage
                </div>
              </Card>

              <Card className="p-6 bg-white border-l-4 border-l-green-500 shadow-sm">
                <CheckCircle2 className="w-10 h-10 text-green-500 mb-4" />
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Completed (Month)</h3>
                <p className="text-3xl font-bold text-gray-900 mt-1">{loading ? '...' : stats.completedTests}</p>
                <div className="flex items-center mt-2 text-xs text-green-600">
                  <Activity className="w-3 h-3 mr-1" />
                  Successfully tested this month
                </div>
              </Card>
            </div>

            <Card className="p-6 overflow-hidden border-none shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-800">Recent Activity</h3>
                <span className="text-xs text-gray-400 font-medium uppercase">Last 5 actions</span>
              </div>
              {renderRecentActivity(recentActivity)}
            </Card>
          </div>
        );
      } else if (activeView === 'orders') {
        return <CoreTestingModule user={user} />;
      } else if (activeView === 'core-tracking') {
        return <CoreTrackingDashboard user={user} />;
      } else if (activeView === 'view-orders') {
        return <OrdersListViewEnhanced userRole={user.role} />;
      } else if (activeView === 'failed-cores') {
        return <FailedCoresPage />;
      }
    }

    // Secondary Tester
    if (user.role === 'secondary-tester') {
      if (activeView === 'home') {
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Secondary Testing Dashboard</h2>
              <p className="text-gray-500 mt-1">Manage secondary testing for assigned transformers</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 hover:shadow-lg transition-all cursor-pointer border-t-4 border-t-purple-600" onClick={() => setActiveView('testing')}>
                <ClipboardCheck className="w-10 h-10 text-purple-600 mb-4" />
                <h3 className="font-semibold text-gray-800">Assigned Orders</h3>
                <p className="text-gray-500 text-sm mt-2">View and perform secondary testing on assigned orders</p>
              </Card>

              <Card className="p-6 bg-white border-l-4 border-l-blue-500 shadow-sm">
                <Activity className="w-10 h-10 text-blue-500 mb-4" />
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Units In Progress</h3>
                <p className="text-3xl font-bold text-gray-900 mt-1">{loading ? '...' : stats.activeTests}</p>
                <div className="flex items-center mt-2 text-xs text-blue-600">
                  <Clock className="w-3 h-3 mr-1" />
                  Currently at secondary stage
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
                <h3 className="font-bold text-gray-800">Recent Production</h3>
                <span className="text-xs text-gray-400 font-medium uppercase">Latest updates</span>
              </div>
              {renderRecentActivity(recentActivity)}
            </Card>
          </div>
        );
      } else if (activeView === 'testing') {
        return <SecondaryTestingModule userName={user.name} />;
      } else if (activeView === 'reports') {
        return <SecondaryReportsList onBack={setViewHome} />;
      } else if (activeView === 'view-orders') {
        return <OrdersListViewEnhanced userRole={user.role} />;
      } else if (activeView === 'failed-cores') {
        return <FailedCoresPage />;
      }
    }

    // Final Tester
    if (user.role === 'final-tester') {
      if (activeView === 'home') {
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Final Testing Hub</h2>
              <p className="text-gray-500 mt-1">Final inspection and quality assurance dashboard</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 hover:shadow-lg transition-all cursor-pointer border-t-4 border-t-green-600" onClick={() => setActiveView('testing')}>
                <ClipboardCheck className="w-10 h-10 text-green-600 mb-4" />
                <h3 className="font-semibold text-gray-800">Ready for Final Test</h3>
                <p className="text-gray-500 text-sm mt-2">Inspect and approve units for shipping</p>
              </Card>

              <Card className="p-6 bg-white border-l-4 border-l-blue-500 shadow-sm">
                <Activity className="w-10 h-10 text-blue-500 mb-4" />
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Active Inspections</h3>
                <p className="text-3xl font-bold text-gray-900 mt-1">{loading ? '...' : stats.activeTests}</p>
                <div className="flex items-center mt-2 text-xs text-blue-600">
                  <Clock className="w-3 h-3 mr-1" />
                  Units in final stage
                </div>
              </Card>

              <Card className="p-6 bg-white border-l-4 border-l-green-500 shadow-sm">
                <CheckCircle2 className="w-10 h-10 text-green-500 mb-4" />
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Shipped / Completed</h3>
                <p className="text-3xl font-bold text-gray-900 mt-1">{loading ? '...' : stats.completedTests}</p>
                <div className="flex items-center mt-2 text-xs text-green-600">
                  <Activity className="w-3 h-3 mr-1" />
                  Finalized this month
                </div>
              </Card>
            </div>

            <Card className="p-6 overflow-hidden border-none shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-800">Final Test Log</h3>
                <span className="text-xs text-gray-400 font-medium uppercase">Quality checks</span>
              </div>
              {renderRecentActivity(recentActivity)}
            </Card>
          </div>
        );
      } else if (activeView === 'testing') {
        return <FinalTestingModule userName={user.name} />;
      } else if (activeView === 'reports') {
        return <FinalReportsList />;
      } else if (activeView === 'view-orders') {
        return <OrdersListViewEnhanced userRole={user.role} />;
      } else if (activeView === 'failed-cores') {
        return <FailedCoresPage />;
      }
    }

    // After Primary Tester
    if (user.role === 'after-primary-tester') {
      if (activeView === 'home') {
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Primary Testing Hub</h2>
              <p className="text-gray-500 mt-1">Managing units after primary testing phase</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 hover:shadow-lg transition-all cursor-pointer border-t-4 border-t-orange-500" onClick={() => setActiveView('testing')}>
                <ClipboardCheck className="w-10 h-10 text-orange-500 mb-4" />
                <h3 className="font-semibold text-gray-800">Assigned Units</h3>
                <p className="text-gray-500 text-sm mt-2">Perform testing on units after primary phase</p>
              </Card>

              <Card className="p-6 bg-white border-l-4 border-l-blue-500 shadow-sm">
                <Activity className="w-10 h-10 text-blue-500 mb-4" />
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Units in Primary</h3>
                <p className="text-3xl font-bold text-gray-900 mt-1">{loading ? '...' : stats.activeTests}</p>
                <div className="flex items-center mt-2 text-xs text-blue-600">
                  <Clock className="w-3 h-3 mr-1" />
                  Currently at primary stage
                </div>
              </Card>

              <Card className="p-6 bg-white border-l-4 border-l-green-500 shadow-sm">
                <CheckCircle2 className="w-10 h-10 text-green-500 mb-4" />
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Month Completions</h3>
                <p className="text-3xl font-bold text-gray-900 mt-1">{loading ? '...' : stats.completedTests}</p>
                <div className="flex items-center mt-2 text-xs text-green-600">
                  <Activity className="w-3 h-3 mr-1" />
                  Primary tests finished
                </div>
              </Card>
            </div>

            <Card className="p-6 overflow-hidden border-none shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-800">Work History</h3>
                <span className="text-xs text-gray-400 font-medium uppercase">Recent primary tests</span>
              </div>
              {renderRecentActivity(recentActivity)}
            </Card>
          </div>
        );
      } else if (activeView === 'testing') {
        return <AfterPrimaryTestingModule userName={user.name} />;
      } else if (activeView === 'reports') {
        return <AfterPrimaryReportsList />;
      } else if (activeView === 'view-orders') {
        return <OrdersListViewEnhanced userRole={user.role} />;
      } else if (activeView === 'failed-cores') {
        return <FailedCoresPage />;
      }
    }

    return <CoreTestingModule />;
  };

  return (
    <div className="flex h-screen bg-gray-50 print:h-auto print:block print:bg-white">
      <div className="print:hidden">
        <TesterSidebar activeView={activeView} setActiveView={setActiveView} userRole={user.role} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible print:block">
        <div className="print:hidden">
          <TesterHeader user={user} onLogout={onLogout} />
        </div>
        <main className="flex-1 overflow-y-auto p-6 print:overflow-visible print:h-auto print:p-0">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

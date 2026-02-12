import { useState } from 'react';
import { User } from '../../App';
import { TesterSidebar } from './TesterSidebar';
import { TesterHeader } from './TesterHeader';
import { CoreTestingModule } from './CoreTestingModule';
import { SecondaryTestingModule } from './SecondaryTestingModule';
import { AfterPrimaryTestingModule } from './AfterPrimaryTestingModule';
import { FinalTestingModule } from './FinalTestingModule';
import { TesterNotifications } from './TesterNotifications';
<<<<<<< HEAD
import { CoreTrackingDashboard } from '../testing/CoreTrackingDashboard';
import { Card } from '../ui/card';
import { ClipboardCheck, FileText, Activity } from 'lucide-react';
=======
import { SecondaryReportsList } from './SecondaryReportsList';
import { CoreTrackingDashboard } from '../testing/CoreTrackingDashboard';
import { Card } from '../ui/card';
import { ClipboardCheck, FileText, Activity } from 'lucide-react';
import { AfterPrimaryReportsList } from './reports/AfterPrimaryReportsList';
import { FinalReportsList } from './reports/FinalReportsList';
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1

interface TesterLayoutProps {
  user: User;
  onLogout: () => void;
}

export function TesterLayout({ user, onLogout }: TesterLayoutProps) {
  const [activeView, setActiveView] = useState(user.role === 'core-tester' ? 'home' : 'home');

  const renderView = () => {
    // Notifications view for all testers
    if (activeView === 'notifications') {
      return <TesterNotifications userRole={user.role} userName={user.name} />;
    }

    // Core Tester Views
    if (user.role === 'core-tester') {
      if (activeView === 'home') {
        return (
          <div className="space-y-6">
            <div>
              <h2>Core Testing Dashboard</h2>
              <p className="text-gray-500 mt-1">Welcome to your core testing workspace</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveView('core-tracking')}>
                <ClipboardCheck className="w-12 h-12 text-[#003a70] mb-4" />
                <h3 className="mb-2">Assigned Orders</h3>
                <p className="text-gray-500 text-sm">View and perform testing on assigned core orders</p>
              </Card>

              <Card className="p-6 bg-blue-50 border-blue-200">
                <Activity className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="mb-2">Active Tests</h3>
                <p className="text-2xl text-blue-700">3</p>
                <p className="text-gray-500 text-sm mt-1">Currently in progress</p>
              </Card>

              <Card className="p-6 bg-green-50 border-green-200">
                <FileText className="w-12 h-12 text-green-600 mb-4" />
                <h3 className="mb-2">Completed</h3>
                <p className="text-2xl text-green-700">12</p>
                <p className="text-gray-500 text-sm mt-1">Tests this month</p>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">JOB-2025-003</p>
                    <p className="text-sm text-gray-500">National Grid - 8 cores</p>
                  </div>
                  <span className="text-sm text-yellow-600">In Progress</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">JOB-2025-004</p>
                    <p className="text-sm text-gray-500">Metro Power - 6 cores</p>
                  </div>
                  <span className="text-sm text-green-600">Completed</span>
                </div>
              </div>
            </Card>
          </div>
        );
      } else if (activeView === 'orders') {
        return <CoreTestingModule user={user} />;
      } else if (activeView === 'core-tracking') {
        return <CoreTrackingDashboard user={user} />;
      }
    }

    // Secondary Tester
    if (user.role === 'secondary-tester') {
      if (activeView === 'home') {
        return (
          <div className="space-y-6">
            <div>
              <h2>Secondary Testing Dashboard</h2>
              <p className="text-gray-500 mt-1">Welcome to your secondary testing workspace</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveView('testing')}>
                <ClipboardCheck className="w-12 h-12 text-[#003a70] mb-4" />
                <h3 className="mb-2">Assigned Orders</h3>
                <p className="text-gray-500 text-sm">View and perform secondary testing on assigned orders</p>
              </Card>

              <Card className="p-6 bg-blue-50 border-blue-200">
                <Activity className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="mb-2">Active Tests</h3>
                <p className="text-2xl text-blue-700">5</p>
                <p className="text-gray-500 text-sm mt-1">Currently in progress</p>
              </Card>

              <Card className="p-6 bg-green-50 border-green-200">
                <FileText className="w-12 h-12 text-green-600 mb-4" />
                <h3 className="mb-2">Completed</h3>
                <p className="text-2xl text-green-700">18</p>
                <p className="text-gray-500 text-sm mt-1">Tests this month</p>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">JOB-2025-003</p>
                    <p className="text-sm text-gray-500">National Grid - 4 transformers</p>
                  </div>
                  <span className="text-sm text-yellow-600">In Progress</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">JOB-2025-004</p>
                    <p className="text-sm text-gray-500">Metro Power - 2 transformers</p>
                  </div>
                  <span className="text-sm text-green-600">Completed</span>
                </div>
              </div>
            </Card>
          </div>
        );
      } else if (activeView === 'testing') {
        return <SecondaryTestingModule userName={user.name} />;
      } else if (activeView === 'reports') {
<<<<<<< HEAD
        return (
          <div className="space-y-6">
            <div>
              <h2>My Test Reports</h2>
              <p className="text-gray-500 mt-1">View your submitted test reports</p>
            </div>
            <Card className="p-6">
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3>No Reports Yet</h3>
                <p className="text-gray-500 mt-2">Your completed test reports will appear here</p>
              </div>
            </Card>
          </div>
        );
=======
        return <SecondaryReportsList userName={user.name} />;
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
      }
    }

    // Final Tester
    if (user.role === 'final-tester') {
      if (activeView === 'home') {
        return (
          <div className="space-y-6">
            <div>
              <h2>Final Testing Dashboard</h2>
              <p className="text-gray-500 mt-1">Welcome to your final testing workspace</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveView('testing')}>
                <ClipboardCheck className="w-12 h-12 text-[#003a70] mb-4" />
                <h3 className="mb-2">Assigned Orders</h3>
                <p className="text-gray-500 text-sm">View and perform final testing on assigned orders</p>
              </Card>

              <Card className="p-6 bg-blue-50 border-blue-200">
                <Activity className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="mb-2">Active Tests</h3>
                <p className="text-2xl text-blue-700">3</p>
                <p className="text-gray-500 text-sm mt-1">Currently in progress</p>
              </Card>

              <Card className="p-6 bg-green-50 border-green-200">
                <FileText className="w-12 h-12 text-green-600 mb-4" />
                <h3 className="mb-2">Completed</h3>
                <p className="text-2xl text-green-700">14</p>
                <p className="text-gray-500 text-sm mt-1">Tests this month</p>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">JOB-2025-001</p>
                    <p className="text-sm text-gray-500">PowerGrid Corporation - 5 transformers</p>
                  </div>
                  <span className="text-sm text-yellow-600">In Progress</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">JOB-2025-003</p>
                    <p className="text-sm text-gray-500">National Grid - 4 transformers</p>
                  </div>
                  <span className="text-sm text-green-600">Completed</span>
                </div>
              </div>
            </Card>
          </div>
        );
      } else if (activeView === 'testing') {
        return <FinalTestingModule userName={user.name} />;
      } else if (activeView === 'reports') {
<<<<<<< HEAD
        return (
          <div className="space-y-6">
            <div>
              <h2>My Test Reports</h2>
              <p className="text-gray-500 mt-1">View your submitted final test reports</p>
            </div>
            <Card className="p-6">
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3>No Reports Yet</h3>
                <p className="text-gray-500 mt-2">Your completed test reports will appear here</p>
              </div>
            </Card>
          </div>
        );
=======
        return <FinalReportsList />;
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
      }
    }

    // After Primary Tester
    if (user.role === 'after-primary-tester') {
      if (activeView === 'home') {
        return (
          <div className="space-y-6">
            <div>
              <h2>After Primary Testing Dashboard</h2>
              <p className="text-gray-500 mt-1">Welcome to your after primary testing workspace</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveView('testing')}>
                <ClipboardCheck className="w-12 h-12 text-[#003a70] mb-4" />
                <h3 className="mb-2">Assigned Orders</h3>
                <p className="text-gray-500 text-sm">View and perform after primary testing on assigned orders</p>
              </Card>

              <Card className="p-6 bg-blue-50 border-blue-200">
                <Activity className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="mb-2">Active Tests</h3>
                <p className="text-2xl text-blue-700">4</p>
                <p className="text-gray-500 text-sm mt-1">Currently in progress</p>
              </Card>

              <Card className="p-6 bg-green-50 border-green-200">
                <FileText className="w-12 h-12 text-green-600 mb-4" />
                <h3 className="mb-2">Completed</h3>
                <p className="text-2xl text-green-700">15</p>
                <p className="text-gray-500 text-sm mt-1">Tests this month</p>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">JOB-2025-001</p>
                    <p className="text-sm text-gray-500">PowerGrid Corporation - 5 transformers</p>
                  </div>
                  <span className="text-sm text-yellow-600">In Progress</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">JOB-2025-002</p>
                    <p className="text-sm text-gray-500">City Electric Ltd - 3 transformers</p>
                  </div>
                  <span className="text-sm text-green-600">Completed</span>
                </div>
              </div>
            </Card>
          </div>
        );
      } else if (activeView === 'testing') {
        return <AfterPrimaryTestingModule userName={user.name} />;
      } else if (activeView === 'reports') {
<<<<<<< HEAD
        return (
          <div className="space-y-6">
            <div>
              <h2>My Test Reports</h2>
              <p className="text-gray-500 mt-1">View your submitted after primary test reports</p>
            </div>
            <Card className="p-6">
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3>No Reports Yet</h3>
                <p className="text-gray-500 mt-2">Your completed test reports will appear here</p>
              </div>
            </Card>
          </div>
        );
=======
        return <AfterPrimaryReportsList />;
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
      }
    }

    return <CoreTestingModule />;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <TesterSidebar activeView={activeView} setActiveView={setActiveView} userRole={user.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TesterHeader user={user} onLogout={onLogout} />
        <main className="flex-1 overflow-y-auto p-6">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { User } from '../../App';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminDashboard } from './AdminDashboard';
import { AdminAnalyticsDashboard } from './AdminAnalyticsDashboard';
import { EmployeeManagement } from './EmployeeManagement';
import { EmployeePerformance } from './EmployeePerformance';
import { EnhancedStockManagement } from './EnhancedStockManagement';
import { OrderManagementModule } from '../entry/OrderManagementModule';
import { OrdersListViewEnhanced } from '../entry/OrdersListViewEnhanced';
import { ReportsModule } from '../entry/ReportsModule';
import { NotificationsModule } from './NotificationsModule';
import { FailedCoresPage } from '../../pages/FailedCoresPage';

interface AdminLayoutProps {
  user: User;
  onLogout: () => void;
}

export function AdminLayout({ user, onLogout }: AdminLayoutProps) {
  const [activeView, _setActiveView] = useState(() => {
    return localStorage.getItem(`${user.role}_activeView`) || 'dashboard';
  });

  const setActiveView = (view: string) => {
    localStorage.setItem(`${user.role}_activeView`, view);
    _setActiveView(view);
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <AdminDashboard setActiveView={setActiveView} />;
      case 'analytics':
        return <AdminAnalyticsDashboard />;
      case 'employees':
        return <EmployeeManagement />;
      case 'performance':
        return <EmployeePerformance />;
      case 'add-order':
        return <OrderManagementModule isAdmin={true} />;
      case 'view-orders':
        return <OrdersListViewEnhanced />;
      case 'stock':
        return <EnhancedStockManagement />;
      case 'reports':
        return <ReportsModule />;
      case 'notifications':
        return <NotificationsModule />;
      case 'failed-cores':
        return <FailedCoresPage />;
      default:
        return <AdminDashboard setActiveView={setActiveView} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <AdminSidebar activeView={activeView} setActiveView={setActiveView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader
          user={user}
          onLogout={onLogout}
          onNotificationClick={() => setActiveView('notifications')}
        />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

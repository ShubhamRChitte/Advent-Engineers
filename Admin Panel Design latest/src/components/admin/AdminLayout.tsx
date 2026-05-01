import { useState } from 'react';
import { User } from '../../App';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminDashboard } from './AdminDashboard';
import { AdminAnalyticsDashboard } from './AdminAnalyticsDashboard';
import { EmployeeManagement } from './EmployeeManagement';
import { OrderManagementModule } from '../entry/OrderManagementModule';
import { OrdersListViewEnhanced } from '../entry/OrdersListViewEnhanced';
import { ReportsModule } from '../entry/ReportsModule';
import { NotificationsModule } from './NotificationsModule';
import { FailedCoresPage } from '../../pages/FailedCoresPage';
import ReadyStockView from '../inventory/ReadyStockView';

interface AdminLayoutProps {
  user: User;
  onLogout: () => void;
}

export function AdminLayout({ user, onLogout }: AdminLayoutProps) {
  const [activeView, _setActiveView] = useState(() => {
    return localStorage.getItem(`${user.role}_activeView`) || 'dashboard';
  });

  // State to handle navigation from notifications to a specific order
  const [selectedOrderIdForNav, setSelectedOrderIdForNav] = useState<string | null>(null);

  const setActiveView = (view: string) => {
    localStorage.setItem(`${user.role}_activeView`, view);
    _setActiveView(view);
  };

  /**
   * Handles navigation to a specific order from a notification
   * fulfill requirement: "Remove LocalStorage navigation"
   */
  const handleOrderNavigation = (orderId: string) => {
    setSelectedOrderIdForNav(orderId);
    setActiveView('view-orders');
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <AdminDashboard setActiveView={setActiveView} />;
      case 'analytics':
        return <AdminAnalyticsDashboard />;
      case 'employees':
        return <EmployeeManagement />;
      case 'add-order':
        return <OrderManagementModule isAdmin={true} />;
      case 'view-orders':
        return (
          <OrdersListViewEnhanced 
            userRole="admin" 
            initialOrderId={selectedOrderIdForNav} 
            onClearNav={() => setSelectedOrderIdForNav(null)}
          />
        );
      case 'reports':
        return <ReportsModule />;
      case 'notifications':
        return (
          <NotificationsModule 
            onNavigateToOrder={handleOrderNavigation}
            isActive={activeView === 'notifications'}
          />
        );
      case 'failed-cores':
        return <FailedCoresPage />;
      case 'ready-stock':
        return <ReadyStockView />;
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

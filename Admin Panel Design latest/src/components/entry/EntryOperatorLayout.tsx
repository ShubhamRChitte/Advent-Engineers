import { useState } from 'react';
import { User } from '../../App';
import { EntrySidebar } from './EntrySidebar';
import { EntryHeader } from './EntryHeader';
import { EntryDashboard } from './EntryDashboard';
import { VendorManagement } from './VendorManagement';
import { OrderManagementModule } from './OrderManagementModule';
import { OrdersListViewEnhanced } from './OrdersListViewEnhanced';
import { ReportsModule } from './ReportsModule';
import { EmployeeManagement } from '../admin/EmployeeManagement';

interface EntryOperatorLayoutProps {
  user: User;
  onLogout: () => void;
}

export function EntryOperatorLayout({ user, onLogout }: EntryOperatorLayoutProps) {
  const [activeView, setActiveView] = useState('dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <EntryDashboard />;
      case 'add-order':
        return <OrderManagementModule />;
      case 'orders-list':
        return <OrdersListViewEnhanced />;
      case 'vendors':
        return <VendorManagement />;
      case 'reports':
        return <ReportsModule />;
      case 'employees':
        return <EmployeeManagement />;
      default:
        return <EntryDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <EntrySidebar activeView={activeView} setActiveView={setActiveView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <EntryHeader user={user} onLogout={onLogout} />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
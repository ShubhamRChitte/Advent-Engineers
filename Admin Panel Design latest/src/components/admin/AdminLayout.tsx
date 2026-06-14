import { useState } from 'react';
import { User } from '../../App';
import axios from '../../utils/axiosConfig';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminDashboard } from './AdminDashboard';
import { AdminAnalyticsDashboard } from './AdminAnalyticsDashboard';
import { EmployeeManagement } from './EmployeeManagement';
import { OrderManagementModule } from '../entry/OrderManagementModule';
import { OrdersListViewEnhanced } from '../entry/OrdersListViewEnhanced';
import { EnhancedOrderForm } from '../entry/EnhancedOrderForm';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { ReportsModule } from '../entry/ReportsModule';
import { NotificationsModule } from './NotificationsModule';
import { FailedCoresPage } from '../../pages/FailedCoresPage';
import ReadyStockView from '../inventory/ReadyStockView';
import { CustomerReportsPage } from './CustomerReportsPage';
import { PTDelayDashboard } from './PTDelayDashboard';
import { CTDelayDashboard } from './CTDelayDashboard';
import { FailedTransformersSection } from '../tester/FailedTransformersSection';

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
  const [editingOrder, setEditingOrder] = useState<any>(null);

  const [allVendors, setAllVendors] = useState<any[]>([]);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await axios.get(`/core-vendors`);
        const data = response.data;
        if (data.success) {
          setAllVendors(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch vendors:", err);
      }
    };
    fetchVendors();
  }, []);

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

  const handleUpdateOrder = async (updatedData: any) => {
    try {
      // Construct payload similar to OrderManagementModule
      const payload: any = {
        clientName: updatedData.clientName,
        clientContactNo: updatedData.clientContact,
        transformerName: updatedData.transformerName,
        transformerType: updatedData.transformerType,
        quantity: parseInt(updatedData.quantity),
        noOfCores: parseInt(updatedData.numberOfCores),
        coreDetails: updatedData.coreDetails,
        primaryCurrents: updatedData.primaryCurrents || [],
        ratio: updatedData.ratio,
        voltageRating: updatedData.voltageRating,
        nominalSystemVoltage: parseFloat(updatedData.parameters?.nominalVoltage) || 0,
        burden: parseFloat(updatedData.parameters?.burden) || 0,
        stc: updatedData.parameters?.stc || '',
        ratedPrimaryVoltage: updatedData.parameters?.ratedPrimaryVoltage || '',
        ratedSecondaryVoltage: updatedData.parameters?.ratedSecondaryVoltage || '',
        isStandard: updatedData.isStandard,
        indoorOutdoor: updatedData.indoorOutdoor,
        insulationType: updatedData.insulationType,
        tankType: updatedData.tankType,
        coreVendors: updatedData.coreVendors
      };

      const response = await axios.put(`/orders/${editingOrder._id}`, payload, {
        withCredentials: true
      });

      if (response.data.success) {
        toast.success("Order updated successfully");
        setEditingOrder(null);
        setActiveView('view-orders');
      } else {
        toast.error(response.data.error || "Failed to update order");
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("An error occurred while updating the order");
    }
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
            onEditOrder={(order) => {
              setEditingOrder(order);
              setActiveView('edit-order');
            }}
          />
        );
      case 'edit-order':
        return editingOrder ? (
          <EnhancedOrderForm
            transformer={null as any}
            allVendors={allVendors}
            initialData={editingOrder}
            onSubmit={handleUpdateOrder}
            onBack={() => {
              setEditingOrder(null);
              setActiveView('view-orders');
            }}
          />
        ) : (
          <div className="p-8 text-center text-gray-500">No order selected for editing.</div>
        );
      case 'reports':
        return <ReportsModule />;
      case 'customer-reports':
        return <CustomerReportsPage onBack={() => setActiveView('dashboard')} />;
      case 'notifications':
        return (
          <NotificationsModule 
            onNavigateToOrder={handleOrderNavigation}
            isActive={activeView === 'notifications'}
          />
        );
      case 'failed-cores':
        return <FailedCoresPage />;
      case 'failed-transformers':
        return <FailedTransformersSection user={user} />;
      case 'ready-stock':
        return <ReadyStockView />;
      case 'pt-delay-tracker':
        return <PTDelayDashboard />;
      case 'ct-delay-tracker':
        return <CTDelayDashboard />;
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

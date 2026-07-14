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
import { AssignTestingWorkflow } from '../entry/AssignTestingWorkflow';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { ReportsModule } from '../entry/ReportsModule';
import { NotificationsModule } from './NotificationsModule';
import { FailedCoresPage } from '../../pages/FailedCoresPage';
import ReadyStockView from '../inventory/ReadyStockView';
import { CustomerReportsPage } from './CustomerReportsPage';
import { DelayTrackerPage } from './DelayTrackerPage';
import { FailedTransformersSection } from '../tester/FailedTransformersSection';
import { DataCleanupPage } from '@/pages/DataCleanupPage';
import { SystemConfigurationsPage } from '@/pages/SystemConfigurationsPage';

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
  const [editStep, setEditStep] = useState<'form' | 'assignments'>('form');
  const [editedOrderData, setEditedOrderData] = useState<any>(null);

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

  const handleUpdateOrder = (updatedData: any) => {
    setEditedOrderData({
      ...updatedData,
      originalQuantity: editingOrder.quantity,
      assignments: editingOrder.assignments || []
    });
    setEditStep('assignments');
  };

  const handleSaveEditedOrder = async (assignments: any[]) => {
    try {
      const assignmentsByStage = assignments.reduce((acc: any[], stage) => {
        let start = 1;
        const stageAssignments = stage.workers.map((w: any) => {
          const range = { from: start, to: start + w.transformerCount - 1 };
          start += w.transformerCount;
          const stageEnumMap: Record<string, string> = {
            'Core Test': 'core',
            'After Secondary Test': 'secondary',
            'Secondary Test': 'secondary',
            'After Primary Test': 'primary',
            'Final Test': 'final',
            'PT Test': 'pt',
            'PT Pretest': 'pt_pretest'
          };
          return {
            testerName: w.worker.name,
            stage: stageEnumMap[stage.testType] || 'core',
            unitRange: range,
            status: 'Assigned'
          };
        });
        return [...acc, ...stageAssignments];
      }, []);

      const payload: any = {
        clientName: editedOrderData.clientName,
        clientContactNo: editedOrderData.clientContact,
        transformerName: editedOrderData.transformerName,
        transformerType: editedOrderData.transformerType,
        quantity: parseInt(editedOrderData.quantity),
        noOfCores: parseInt(editedOrderData.numberOfCores),
        coreDetails: editedOrderData.coreDetails,
        primaryCurrents: editedOrderData.primaryCurrents || [],
        ratio: editedOrderData.ratio,
        voltageRating: editedOrderData.voltageRating,
        nominalSystemVoltage: parseFloat(editedOrderData.parameters?.nominalVoltage) || 0,
        burden: parseFloat(editedOrderData.parameters?.burden) || 0,
        stc: editedOrderData.parameters?.stc || '',
        ratedPrimaryVoltage: editedOrderData.parameters?.ratedPrimaryVoltage || '',
        ratedSecondaryVoltage: editedOrderData.parameters?.ratedSecondaryVoltage || '',
        isStandard: editedOrderData.isStandard,
        indoorOutdoor: editedOrderData.indoorOutdoor,
        insulationType: editedOrderData.insulationType,
        tankType: editedOrderData.tankType,
        coreVendors: editedOrderData.coreVendors,
        assignments: assignmentsByStage
      };

      const response = await axios.put(`/orders/${editingOrder._id}`, payload, {
        withCredentials: true
      });

      if (response.data.success) {
        toast.success("Order and assignments updated successfully");
        setEditingOrder(null);
        setEditedOrderData(null);
        setEditStep('form');
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
              setEditStep('form');
              setEditedOrderData(null);
              setActiveView('edit-order');
            }}
          />
        );
      case 'edit-order':
        if (!editingOrder) {
          return <div className="p-8 text-center text-gray-500">No order selected for editing.</div>;
        }
        if (editStep === 'form') {
          return (
            <EnhancedOrderForm
              transformer={null as any}
              allVendors={allVendors}
              initialData={editingOrder}
              onSubmit={handleUpdateOrder}
              onBack={() => {
                setEditingOrder(null);
                setEditStep('form');
                setEditedOrderData(null);
                setActiveView('view-orders');
              }}
            />
          );
        } else {
          return (
            <AssignTestingWorkflow
              orderData={editedOrderData}
              onComplete={handleSaveEditedOrder}
              onBack={() => setEditStep('form')}
            />
          );
        }
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
      case 'delay-tracker':
        return <DelayTrackerPage onBack={() => setActiveView('dashboard')} />;
      case 'data-cleanup':
        return <DataCleanupPage />;
      case 'system-configs':
        return <SystemConfigurationsPage />;
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
          onAddOrderClick={() => setActiveView('add-order')}
        />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

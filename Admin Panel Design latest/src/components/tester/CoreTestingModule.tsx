import { useState } from 'react';
import { CoreOrdersList } from './CoreOrdersList';
import { CoreTestingReport } from './CoreTestingReport';
import { OrderReportsView } from '../entry/OrderReportsView';
import { User } from '../../App';

interface Order {
  id?: string;
  _id?: string;
  jobId: string;
  client: string;
  clientName?: string;
  transformerType: string;
  coresRequired: number;
  assignedDate: string;
  status: string;
  priority: string;
  userStats?: any;
}

interface CoreTestingModuleProps {
  user?: User;
}

type ViewType = 'orders' | 'testing' | 'order-reports';

export function CoreTestingModule({ user }: CoreTestingModuleProps) {
  const [currentView, setCurrentView] = useState<ViewType>('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleStartTesting = (order: Order) => {
    setSelectedOrder(order);
    setCurrentView('testing');
  };

  const handleViewReports = (order: Order) => {
    // Ensure id maps to _id for older components
    const mappedOrder = { ...order, id: order._id || order.id || '' };
    setSelectedOrder(mappedOrder);
    setCurrentView('order-reports');
  };

  const handleBack = () => {
    setSelectedOrder(null);
    setCurrentView('orders');
  };

  if (currentView === 'testing' && selectedOrder) {
    return <CoreTestingReport order={selectedOrder as any} onBack={handleBack} />;
  }

  if (currentView === 'order-reports' && selectedOrder) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <OrderReportsView
          order={selectedOrder}
          clientName={selectedOrder.clientName || selectedOrder.client || 'Unknown'}
          onBack={handleBack}
        />
      </div>
    );
  }

  return <CoreOrdersList onStartTesting={handleStartTesting} onViewReports={handleViewReports} user={user!} />;
}

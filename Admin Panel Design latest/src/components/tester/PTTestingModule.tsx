import { useState } from 'react';
import { User } from '../../App';
import { PTAssignedOrders } from './PTAssignedOrders';
import { PTTestingReport } from './PTTestingReport';

interface PTTestingModuleProps {
  user?: User;
}

export function PTTestingModule({ user }: PTTestingModuleProps) {
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const handleStartTesting = (order: any) => {
    setSelectedOrder(order);
  };

  const handleBack = () => {
    setSelectedOrder(null);
  };

  if (selectedOrder) {
    return <PTTestingReport order={selectedOrder} onBack={handleBack} user={user} />;
  }

  return <PTAssignedOrders onStartTesting={handleStartTesting} />;
}

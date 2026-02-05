import { useState } from 'react';
import { CoreOrdersList } from './CoreOrdersList';
import { CoreTestingReport } from './CoreTestingReport';
import { User } from '../../App';

interface Order {
  jobId: string;
  client: string;
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

export function CoreTestingModule({ user }: CoreTestingModuleProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleStartTesting = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleBack = () => {
    setSelectedOrder(null);
  };

  if (selectedOrder) {
    return <CoreTestingReport order={selectedOrder} onBack={handleBack} />;
  }

  return <CoreOrdersList onStartTesting={handleStartTesting} user={user} />;
}

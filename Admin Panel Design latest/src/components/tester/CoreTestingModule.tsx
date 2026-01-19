import { useState } from 'react';
import { CoreOrdersList } from './CoreOrdersList';
import { CoreTestingReport } from './CoreTestingReport';

interface Order {
  jobId: string;
  client: string;
  transformerType: string;
  coresRequired: number;
  assignedDate: string;
  status: string;
  priority: string;
}

export function CoreTestingModule() {
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

  return <CoreOrdersList onStartTesting={handleStartTesting} />;
}

import { useState } from 'react';
import { User } from '../../App';
import { PTAssignedOrders } from './PTAssignedOrders';
import { PTTestingReport } from './PTTestingReport';
import { PTTransformersList, Transformer } from './PTTransformersList';

interface PTTestingModuleProps {
  user?: User;
}

export function PTTestingModule({ user }: PTTestingModuleProps) {
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedTransformer, setSelectedTransformer] = useState<Transformer | null>(null);

  const handleStartTesting = (order: any, transformer?: Transformer) => {
    setSelectedOrder(order);
    if (transformer) {
      setSelectedTransformer(transformer);
    }
  };

  const handleTransformerSelect = (transformer: Transformer) => {
    setSelectedTransformer(transformer);
  };

  const handleBackToOrders = () => {
    setSelectedOrder(null);
    setSelectedTransformer(null);
  };

  const handleBackToList = () => {
    setSelectedTransformer(null);
    setSelectedOrder(null);
  };

  if (selectedTransformer) {
    return <PTTestingReport order={selectedOrder} transformer={selectedTransformer} onBack={handleBackToList} user={user} />;
  }

  if (selectedOrder) {
    return <PTTransformersList order={selectedOrder} onStartTest={handleTransformerSelect} onBack={handleBackToOrders} />;
  }

  return <PTAssignedOrders onStartTesting={handleStartTesting} />;
}

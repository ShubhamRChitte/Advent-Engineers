import { useState } from 'react';
import { User } from '../../App';
import { PTAssignedOrders } from './PTAssignedOrders';
import { PTPretestReport } from './PTPretestReport';
import { PTTransformersList, Transformer } from './PTTransformersList';

interface PTPretestModuleProps {
  user?: User;
}

export function PTPretestModule({ user }: PTPretestModuleProps) {
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedTransformer, setSelectedTransformer] = useState<Transformer | null>(null);

  const handleStartTesting = (order: any) => {
    setSelectedOrder(order);
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
  };

  if (selectedTransformer) {
    return <PTPretestReport order={selectedOrder} transformer={selectedTransformer} onBack={handleBackToList} user={user} />;
  }

  if (selectedOrder) {
    return <PTTransformersList order={selectedOrder} onStartTest={handleTransformerSelect} onBack={handleBackToOrders} testStage="pretest" />;
  }

  return <PTAssignedOrders onStartTesting={handleStartTesting} endpoint={`/pt-pretests/assigned-orders`} />;
}


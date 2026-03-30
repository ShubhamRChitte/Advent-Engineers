import { useState } from 'react';
import { HeatingTrackingOrdersList } from './HeatingTrackingOrdersList';
import { HeatingTransformersList } from './HeatingTransformersList';
import { HeatingTrackingReport } from './HeatingTrackingReport';
import { User } from '../../App';

export interface Order {
  _id: string;
  jobId: string;
  clientName: string;
  transformerType: string;
  nominalSystemVoltage: number | string;
  quantity: number;
  assignedDate: string;
  deadline: string;
  status: string;
  currentStage: string;
  assignedUnitIds?: string[];
}

export interface Transformer {
  _id: string;
  uniqueId: string;
  name: string;
  rating: string;
  status: 'pending' | 'in-progress' | 'completed' | 'approved';
}

interface HeatingTrackingModuleProps {
  user?: User;
}

type ViewType = 'orders' | 'transformers' | 'report';

export function HeatingTrackingModule({ user }: HeatingTrackingModuleProps) {
  const [currentView, setCurrentView] = useState<ViewType>('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedTransformer, setSelectedTransformer] = useState<Transformer | null>(null);

  const handleStartOrder = (order: Order) => {
    setSelectedOrder(order);
    setCurrentView('transformers');
  };

  const handleStartTest = (transformer: Transformer) => {
    setSelectedTransformer(transformer);
    setCurrentView('report');
  };

  const handleBackToOrders = () => {
    setSelectedOrder(null);
    setCurrentView('orders');
  };

  const handleBackToTransformers = () => {
    setSelectedTransformer(null);
    setCurrentView('transformers');
  };

  if (currentView === 'report' && selectedOrder && selectedTransformer) {
    return (
      <HeatingTrackingReport 
        order={selectedOrder} 
        transformer={selectedTransformer} 
        user={user!}
        onBack={handleBackToTransformers} 
      />
    );
  }

  if (currentView === 'transformers' && selectedOrder) {
    return (
      <HeatingTransformersList 
        order={selectedOrder} 
        onStartTest={handleStartTest} 
        onBack={handleBackToOrders} 
      />
    );
  }

  return (
    <HeatingTrackingOrdersList 
      onStartTesting={handleStartOrder} 
      user={user} 
    />
  );
}

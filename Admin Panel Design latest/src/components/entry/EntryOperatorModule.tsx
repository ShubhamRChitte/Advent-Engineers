import { useState } from 'react';
import { TransformerSelectionGrid } from './TransformerSelectionGrid';
import { OrderForm } from './OrderForm';
import { AssignTestingModule } from './AssignTestingModule';

type ViewType = 'selection' | 'order-form' | 'assign-testing';

interface Transformer {
  id: string;
  name: string;
  type: string;
  capacity: string;
  voltageRating: string;
  hvVoltage: string;
  lvVoltage: string;
  cores: number;
  phase: string;
  model: string;
  status: string;
  image: string;
  coolingType: string;
}

interface OrderData {
  orderId: string;
  clientName: string;
  clientContact?: string;
  orderDate: string;
  transformer: any;
  parameters: any[];
}

export function EntryOperatorModule() {
  const [currentView, setCurrentView] = useState<ViewType>('selection');
  const [selectedTransformer, setSelectedTransformer] = useState<Transformer | null>(null);
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  const handleSelectTransformer = (transformer: Transformer) => {
    setSelectedTransformer(transformer);
    setCurrentView('order-form');
  };

  const handleSubmitOrder = (data: OrderData) => {
    setOrderData(data);
    setCurrentView('assign-testing');
  };

  const handleCancelOrder = () => {
    setCurrentView('selection');
    setSelectedTransformer(null);
  };

  const handleCompleteAssignment = () => {
    // Reset to selection view
    setCurrentView('selection');
    setSelectedTransformer(null);
    setOrderData(null);
  };

  const handleBackFromAssignment = () => {
    setCurrentView('order-form');
  };

  // Transformer Selection Grid View
  if (currentView === 'selection') {
    return <TransformerSelectionGrid onSelectTransformer={handleSelectTransformer} />;
  }

  // Order Form View
  if (currentView === 'order-form' && selectedTransformer) {
    return (
      <OrderForm
        transformer={selectedTransformer}
        onSubmit={handleSubmitOrder}
        onCancel={handleCancelOrder}
      />
    );
  }

  // Assign Testing View
  if (currentView === 'assign-testing' && orderData) {
    return (
      <AssignTestingModule
        orderData={orderData}
        onComplete={handleCompleteAssignment}
        onBack={handleBackFromAssignment}
      />
    );
  }

  // Default fallback
  return <TransformerSelectionGrid onSelectTransformer={handleSelectTransformer} />;
}

import { useState } from 'react';
import { TransformerSelectionGrid } from './TransformerSelectionGrid';
import { OrderForm } from './OrderForm';
import { AssignTestingModule } from './AssignTestingModule';
<<<<<<< HEAD

type ViewType = 'selection' | 'order-form' | 'assign-testing';
=======
import { AddOrderForm } from './AddOrderForm';
import { EntryDashboard } from './EntryDashboard';

type ViewType = 'selection' | 'order-form' | 'assign-testing' | 'add-order' | 'dashboard';
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1

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
<<<<<<< HEAD
  const [currentView, setCurrentView] = useState<ViewType>('selection');
=======
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
  const [selectedTransformer, setSelectedTransformer] = useState<Transformer | null>(null);
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  const handleSelectTransformer = (transformer: Transformer) => {
    setSelectedTransformer(transformer);
    setCurrentView('order-form');
  };

<<<<<<< HEAD
=======
  // Handler for dashboard action
  const handleAddNewOrder = () => {
    // Reset selection just in case
    setSelectedTransformer(null);
    setCurrentView('add-order');
  };

>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
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

<<<<<<< HEAD
=======
  // View: Add New Order (Directly using AddOrderForm)
  if (currentView === 'add-order') {
    return (
      <div className="p-6">
        <AddOrderForm
          onCancel={handleCancelOrder}
          onSuccess={handleCompleteAssignment} // Or navigate to dashboard
        />
      </div>
    );
  }

  // Dashboard View (Default)
  if (currentView === 'dashboard') {
    return <EntryDashboard onAddOrder={handleAddNewOrder} />;
  }

>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
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
<<<<<<< HEAD
  return <TransformerSelectionGrid onSelectTransformer={handleSelectTransformer} />;
=======
  return <EntryDashboard onAddOrder={handleAddNewOrder} />;
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
}

import { useState } from 'react';
import { TransformerListView } from './TransformerListView';
import { EnhancedOrderForm } from './EnhancedOrderForm';
import { AssignTestingWorkflow } from './AssignTestingWorkflow';
import { OrderSummaryView } from './OrderSummaryView';
import { OrdersListView } from './OrdersListView';

type ViewType = 'transformer-list' | 'order-form' | 'assign-testing' | 'order-summary' | 'orders-list';

interface Transformer {
  id: string;
  name: string;
  type: string;
  capacity: string;
  voltageRating: string;
  cores: number;
  phase: string;
  serialNumber: string;
}

interface WorkerAssignment {
  worker: any;
  transformerCount: number;
}

interface TestAssignment {
  testType: string;
  workers: WorkerAssignment[];
}

export function OrderManagementModule() {
  const [currentView, setCurrentView] = useState<ViewType>('transformer-list');
  const [selectedTransformer, setSelectedTransformer] = useState<Transformer | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [testAssignments, setTestAssignments] = useState<TestAssignment[]>([]);

  const handleOrderTransformer = (transformer: Transformer) => {
    setSelectedTransformer(transformer);
    setCurrentView('order-form');
  };

  const handleSubmitOrder = (data: any) => {
    setOrderData(data);
    setCurrentView('assign-testing');
  };

  const handleCompleteAssignment = (assignments: TestAssignment[]) => {
    setTestAssignments(assignments);
    setCurrentView('order-summary');
  };

  const handleSaveOrder = () => {
    // In a real app, this would save to database
    alert('Order saved successfully!\n\nOrder ID: ' + orderData.orderId);
    // Reset and show orders list
    setCurrentView('orders-list');
    setSelectedTransformer(null);
    setOrderData(null);
    setTestAssignments([]);
  };

  const handleBackToList = () => {
    setCurrentView('transformer-list');
    setSelectedTransformer(null);
  };

  const handleBackToOrderForm = () => {
    setCurrentView('order-form');
  };

  // Transformer List View
  if (currentView === 'transformer-list') {
    return <TransformerListView onOrderTransformer={handleOrderTransformer} />;
  }

  // Order Form View
  if (currentView === 'order-form' && selectedTransformer) {
    return (
      <EnhancedOrderForm
        transformer={selectedTransformer}
        onSubmit={handleSubmitOrder}
        onBack={handleBackToList}
      />
    );
  }

  // Assign Testing View
  if (currentView === 'assign-testing' && orderData) {
    return (
      <AssignTestingWorkflow
        orderData={orderData}
        onComplete={handleCompleteAssignment}
        onBack={handleBackToOrderForm}
      />
    );
  }

  // Order Summary View
  if (currentView === 'order-summary' && orderData && testAssignments.length > 0) {
    return (
      <OrderSummaryView
        orderData={orderData}
        testAssignments={testAssignments}
        onSaveOrder={handleSaveOrder}
      />
    );
  }

  // Orders List View
  if (currentView === 'orders-list') {
    return <OrdersListView />;
  }

  // Default fallback
  return <TransformerListView onOrderTransformer={handleOrderTransformer} />;
}

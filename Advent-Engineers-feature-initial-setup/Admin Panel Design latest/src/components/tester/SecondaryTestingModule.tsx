import { useState } from 'react';
import { SecondaryOrdersList } from './SecondaryOrdersList';
import { SecondaryTransformersList, Transformer } from './SecondaryTransformersList';
import { SecondaryCoreSelection } from './SecondaryCoreSelection';
import { SecondaryMeteringReport } from './SecondaryMeteringReport';
import { SecondaryPSReport } from './SecondaryPSReport';
import { SecondaryProtectionReport } from './SecondaryProtectionReport';

interface Order {
  _id: string;
  jobId: string;
  clientName: string;
  quantity: number;
  transformerQuantity?: number;
  assignedDate: string;
  deadline: string;
  status: string;
  priority: string;
}

type ViewType = 'orders' | 'transformers' | 'core-selection' | 'report';
type ReportType = 'metering' | 'ps' | 'protection';

export function SecondaryTestingModule() {
  const [currentView, setCurrentView] = useState<ViewType>('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedTransformer, setSelectedTransformer] = useState<Transformer | null>(null);
  const [selectedCoreNumber, setSelectedCoreNumber] = useState<number>(0);
  const [selectedCoreType, setSelectedCoreType] = useState<ReportType>('metering');
  const [enteredCoreId, setEnteredCoreId] = useState<string>('');

  const handleStartTesting = (order: Order) => {
    setSelectedOrder(order);
    setCurrentView('transformers');
  };

  const handleStartTest = (transformer: Transformer) => {
    setSelectedTransformer(transformer);
    setCurrentView('core-selection');
  };

  const handleCoreSelect = (coreNumber: number, coreType: string, coreId: string) => {
    setSelectedCoreNumber(coreNumber);
    setSelectedCoreType(coreType as ReportType);
    setEnteredCoreId(coreId);
    setCurrentView('report');
  };

  const handleBackToOrders = () => {
    setCurrentView('orders');
    setSelectedOrder(null);
    setSelectedTransformer(null);
    setSelectedCoreNumber(0);
    setEnteredCoreId('');
  };

  const handleBackToTransformers = () => {
    setCurrentView('transformers');
    setSelectedTransformer(null);
    setSelectedCoreNumber(0);
    setEnteredCoreId('');
  };

  const handleBackFromReport = () => {
    setCurrentView('core-selection');
    setSelectedCoreNumber(0);
    setEnteredCoreId('');
  };

  // Orders List View
  if (currentView === 'orders') {
    return <SecondaryOrdersList onStartTesting={handleStartTesting} />;
  }

  // Transformers List View
  if (currentView === 'transformers' && selectedOrder) {
    return (
      <SecondaryTransformersList
        order={selectedOrder}
        onStartTest={handleStartTest}
        onBack={handleBackToOrders}
      />
    );
  }

  // Core Selection View
  if (currentView === 'core-selection' && selectedTransformer) {
    return (
      <SecondaryCoreSelection
        transformer={selectedTransformer}
        onCoreSelect={handleCoreSelect}
        onBack={handleBackToTransformers}
      />
    );
  }

  // Report View - Route to appropriate report based on core type
  if (currentView === 'report' && selectedTransformer) {
    const testerName = 'Mike Wilson'; // This should come from logged-in user

    if (selectedCoreType === 'metering') {
      return (
        <SecondaryMeteringReport
          transformer={selectedTransformer}
          coreNumber={selectedCoreNumber}
          coreId={enteredCoreId}
          testerName={testerName}
          onBack={handleBackFromReport}
        />
      );
    }

    if (selectedCoreType === 'ps') {
      return (
        <SecondaryPSReport
          transformer={selectedTransformer}
          coreNumber={selectedCoreNumber}
          coreId={enteredCoreId}
          testerName={testerName}
          onBack={handleBackFromReport}
        />
      );
    }

    if (selectedCoreType === 'protection') {
      return (
        <SecondaryProtectionReport
          transformer={selectedTransformer}
          coreNumber={selectedCoreNumber}
          coreId={enteredCoreId}
          testerName={testerName}
          onBack={handleBackFromReport}
        />
      );
    }
  }

  // Default fallback
  return <SecondaryOrdersList onStartTesting={handleStartTesting} />;
}

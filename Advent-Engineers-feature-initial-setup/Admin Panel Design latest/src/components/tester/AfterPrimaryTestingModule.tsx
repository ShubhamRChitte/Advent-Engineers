import { useState } from 'react';
import { AfterPrimaryOrdersList } from './AfterPrimaryOrdersList';
import { AfterPrimaryTransformersList, AfterPrimaryTransformer } from './AfterPrimaryTransformersList';
import { AfterPrimaryCoreSelection } from './AfterPrimaryCoreSelection';
import { AfterPrimaryMeteringReport } from './AfterPrimaryMeteringReport';
import { AfterPrimaryPSReport } from './AfterPrimaryPSReport';
import { AfterPrimaryProtectionReport } from './AfterPrimaryProtectionReport';

interface Order {
  jobId: string;
  client: string;
  transformerCount: number;
  assignedDate: string;
  status: string;
  priority: string;
}

interface CoreConfig {
  coreNumber: number;
  coreType: 'metering' | 'ps' | 'protection';
  coreId: string;
}

type ViewType = 'orders' | 'transformers' | 'cores' | 'report';

export function AfterPrimaryTestingModule() {
  const [currentView, setCurrentView] = useState<ViewType>('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedTransformer, setSelectedTransformer] = useState<AfterPrimaryTransformer | null>(null);
  const [selectedCore, setSelectedCore] = useState<CoreConfig | null>(null);

  const handleStartTesting = (order: Order) => {
    setSelectedOrder(order);
    setCurrentView('transformers');
  };

  const handleStartTest = (transformer: AfterPrimaryTransformer) => {
    setSelectedTransformer(transformer);
    setCurrentView('cores');
  };

  const handleSelectCore = (core: CoreConfig) => {
    setSelectedCore(core);
    setCurrentView('report');
  };

  const handleBackToOrders = () => {
    setCurrentView('orders');
    setSelectedOrder(null);
    setSelectedTransformer(null);
    setSelectedCore(null);
  };

  const handleBackToTransformers = () => {
    setCurrentView('transformers');
    setSelectedTransformer(null);
    setSelectedCore(null);
  };

  const handleBackToCores = () => {
    setCurrentView('cores');
    setSelectedCore(null);
  };

  // Orders List View
  if (currentView === 'orders') {
    return <AfterPrimaryOrdersList onStartTesting={handleStartTesting} />;
  }

  // Transformers List View
  if (currentView === 'transformers' && selectedOrder) {
    return (
      <AfterPrimaryTransformersList
        order={selectedOrder}
        onStartTest={handleStartTest}
        onBack={handleBackToOrders}
      />
    );
  }

  // Core Selection View
  if (currentView === 'cores' && selectedTransformer && selectedOrder) {
    return (
      <AfterPrimaryCoreSelection
        transformer={selectedTransformer}
        order={selectedOrder}
        onSelectCore={handleSelectCore}
        onBack={handleBackToTransformers}
      />
    );
  }

  // Report View - Route to correct report based on core type
  if (currentView === 'report' && selectedTransformer && selectedCore) {
    const testerName = 'David Martinez'; // This should come from logged-in user

    // Route to the appropriate report based on core type
    if (selectedCore.coreType === 'metering') {
      return (
        <AfterPrimaryMeteringReport
          transformer={selectedTransformer}
          core={selectedCore}
          testerName={testerName}
          onBack={handleBackToCores}
        />
      );
    }

    if (selectedCore.coreType === 'ps') {
      return (
        <AfterPrimaryPSReport
          transformer={selectedTransformer}
          core={selectedCore}
          testerName={testerName}
          onBack={handleBackToCores}
        />
      );
    }

    if (selectedCore.coreType === 'protection') {
      return (
        <AfterPrimaryProtectionReport
          transformer={selectedTransformer}
          core={selectedCore}
          testerName={testerName}
          onBack={handleBackToCores}
        />
      );
    }
  }

  // Default fallback
  return <AfterPrimaryOrdersList onStartTesting={handleStartTesting} />;
}
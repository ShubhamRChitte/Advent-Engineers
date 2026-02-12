import { useState } from 'react';
import { AfterPrimaryOrdersList } from './AfterPrimaryOrdersList';
import { AfterPrimaryTransformersList, AfterPrimaryTransformer } from './AfterPrimaryTransformersList';
import { AfterPrimaryCoreSelection } from './AfterPrimaryCoreSelection';
import { AfterPrimaryMeteringReport } from './AfterPrimaryMeteringReport';
import { AfterPrimaryPSReport } from './AfterPrimaryPSReport';
import { AfterPrimaryProtectionReport } from './AfterPrimaryProtectionReport';

// Updated to match the API response structure
interface Order {
  _id: string; // Added _id
  jobId: string;
  clientName: string; // Changed from client
  transformerCount?: number; // Optional
  assignedDate: string;
  status: string;
  priority: string;
  assignedUnitIds?: string[]; // Added
  // Add other fields as necessary from the API response
  quantity?: number;
  transformerQuantity?: number;
  deadline?: string;
  transformerName?: string;
  ratio?: string[];
  nominalSystemVoltage?: number | string;
  coreDetails?: any[];
}

interface CoreConfig {
  coreNumber: number;
  coreType: 'metering' | 'ps' | 'protection';
  coreId: string;
}

type ViewType = 'orders' | 'transformers' | 'cores' | 'report';

interface AfterPrimaryTestingModuleProps {
  userName?: string;
}

export function AfterPrimaryTestingModule({ userName }: AfterPrimaryTestingModuleProps) {
  const [currentView, setCurrentView] = useState<ViewType>('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedTransformer, setSelectedTransformer] = useState<AfterPrimaryTransformer | null>(null);
  const [selectedCore, setSelectedCore] = useState<CoreConfig | null>(null);

  const handleStartTesting = (order: any) => {
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
    const testerName = userName || 'Primary Tester';

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
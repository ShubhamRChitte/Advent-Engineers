import { useState } from 'react';
import { FinalOrdersList } from './FinalOrdersList';
import { FinalTransformersList, FinalTransformer } from './FinalTransformersList';
import { FinalCoreSelection } from './FinalCoreSelection';
import { FinalMeteringReport } from './FinalMeteringReport';
import { FinalPSReport } from './FinalPSReport';
import { FinalProtectionReport } from './FinalProtectionReport';
import { FinalTestReport } from './FinalTestReport';

interface Order {
  _id: string; // Updated to match API
  jobId: string;
  clientName: string; // Updated to match API
  client?: string; // Legacy fallback
  transformerCount?: number; // Legacy
  quantity?: number; // API
  transformerQuantity?: number; // API
  assignedDate: string;
  status: string;
  priority: string;
}

interface CoreConfig {
  coreNumber: number;
  coreType: 'metering' | 'ps' | 'protection';
  coreId: string;
}

type ViewType = 'orders' | 'transformers' | 'cores' | 'core-report' | 'comprehensive-report';

interface FinalTestingModuleProps {
  userName?: string;
}

export function FinalTestingModule({ userName }: FinalTestingModuleProps) {
  const [currentView, setCurrentView] = useState<ViewType>('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedTransformer, setSelectedTransformer] = useState<FinalTransformer | null>(null);
  const [selectedCore, setSelectedCore] = useState<CoreConfig | null>(null);

  const handleStartTesting = (order: any) => {
    // Cast to any to handle Order type mismatches during transition
    setSelectedOrder(order);
    setCurrentView('transformers');
  };

  const handleStartTest = (transformer: FinalTransformer) => {
    setSelectedTransformer(transformer);
    setCurrentView('cores');
  };

  const handleSelectCore = (core: CoreConfig) => {
    setSelectedCore(core);
    setCurrentView('core-report');
  };

  const handleOpenComprehensiveReport = () => {
    setCurrentView('comprehensive-report');
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

  const testerName = userName || 'Final Tester';

  // Orders List View
  if (currentView === 'orders') {
    return <FinalOrdersList onStartTesting={handleStartTesting} />;
  }

  // Transformers List View
  if (currentView === 'transformers' && selectedOrder) {
    return (
      <FinalTransformersList
        order={selectedOrder}
        onStartTest={handleStartTest}
        onBack={handleBackToOrders}
      />
    );
  }

  // Core Selection View
  if (currentView === 'cores' && selectedTransformer && selectedOrder) {
    return (
      <FinalCoreSelection
        transformer={selectedTransformer}
        order={selectedOrder}
        onSelectCore={handleSelectCore}
        onOpenComprehensiveReport={handleOpenComprehensiveReport}
        onBack={handleBackToTransformers}
      />
    );
  }

  // Core-Wise Report View - Route to correct report based on core type
  if (currentView === 'core-report' && selectedTransformer && selectedCore) {

    // Route to the appropriate report based on core type
    if (selectedCore.coreType === 'metering') {
      return (
        <FinalMeteringReport
          transformer={selectedTransformer}
          core={selectedCore}
          testerName={testerName}
          onBack={handleBackToCores}
        />
      );
    }

    if (selectedCore.coreType === 'ps') {
      return (
        <FinalPSReport
          transformer={selectedTransformer}
          core={selectedCore}
          testerName={testerName}
          onBack={handleBackToCores}
        />
      );
    }

    if (selectedCore.coreType === 'protection') {
      return (
        <FinalProtectionReport
          transformer={selectedTransformer}
          core={selectedCore}
          testerName={testerName}
          onBack={handleBackToCores}
        />
      );
    }
  }

  // Comprehensive Report View
  if (currentView === 'comprehensive-report' && selectedTransformer) {
    return (
      <FinalTestReport
        transformer={selectedTransformer}
        testerName={testerName}
        onBack={handleBackToCores}
      />
    );
  }

  // Default fallback
  return <FinalOrdersList onStartTesting={handleStartTesting} />;
}

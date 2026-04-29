import { useState } from 'react';
import { AfterPrimaryOrdersList } from './AfterPrimaryOrdersList';
import { AfterPrimaryTransformersList, Transformer as AfterPrimaryTransformer } from './AfterPrimaryTransformersList';
import { AfterPrimaryCoreSelection } from './AfterPrimaryCoreSelection';
import { AfterPrimaryMeteringReport } from './AfterPrimaryMeteringReport';
import { AfterPrimaryPSReport } from './AfterPrimaryPSReport';
import { AfterPrimaryProtectionReport } from './AfterPrimaryProtectionReport';

// Updated to match the API response structure
interface Order {
  _id: string; 
  jobId: string;
  clientName: string; 
  transformerCount?: number; 
  assignedDate: string;
  status: string;
  priority: string;
  assignedUnitIds?: string[]; 
  quantity?: number;
  transformerQuantity?: number;
  deadline?: string;
  transformerName?: string;
  ratio?: string[];
  primaryCurrents?: string[];
  ratedSecondaryCurrent?: number;
  nominalSystemVoltage?: number | string;
  coreDetails?: any[];
}

interface CoreConfig {
  coreNumber: number;
  coreType: 'metering' | 'ps' | 'protection';
  coreId: string;
  accuracyClass?: string | undefined;
}

import { OrderReportsView } from '../entry/OrderReportsView';

type ViewType = 'orders' | 'transformers' | 'cores' | 'report' | 'order-reports';

interface AfterPrimaryTestingModuleProps {
  userName?: string;
}

export function AfterPrimaryTestingModule({ userName }: AfterPrimaryTestingModuleProps) {
  const [currentView, setCurrentView] = useState<ViewType>('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedTransformer, setSelectedTransformer] = useState<AfterPrimaryTransformer | null>(null);
  const [selectedCore, setSelectedCore] = useState<CoreConfig | null>(null);
  const [selectedPrimary, setSelectedPrimary] = useState<string>('');
  const [selectedSecondary, setSelectedSecondary] = useState<string>('');


  const handleStartTesting = (order: any) => {
    setSelectedOrder(order);
    setCurrentView('transformers');
  };

  const handleViewReports = (order: Order) => {
    setSelectedOrder(order);
    setCurrentView('order-reports');
  };

  const handleStartTest = (transformer: AfterPrimaryTransformer) => {
    setSelectedTransformer(transformer);
    setCurrentView('cores');
  };

  const handleSelectCore = (core: CoreConfig, primary: string, secondary: string) => {
    setSelectedCore(core);
    setSelectedPrimary(primary);
    setSelectedSecondary(secondary);
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
    return <AfterPrimaryOrdersList onStartTesting={handleStartTesting} onViewReports={handleViewReports} />;
  }

  // Reports View
  if (currentView === 'order-reports' && selectedOrder) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <OrderReportsView
          order={selectedOrder}
          clientName={selectedOrder.clientName || 'Unknown'}
          onBack={handleBackToOrders}
        />
      </div>
    );
  }

  // Transformers List View
  if (currentView === 'transformers' && selectedOrder) {
    return (
      <AfterPrimaryTransformersList
        order={selectedOrder as any}
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
        order={selectedOrder as any}
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
          order={selectedOrder}
          primaryCurrent={selectedPrimary}
          secondaryCurrent={selectedSecondary}
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
          order={selectedOrder}
          primaryCurrent={selectedPrimary}
          secondaryCurrent={selectedSecondary}
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
          order={selectedOrder}
          primaryCurrent={selectedPrimary}
          secondaryCurrent={selectedSecondary}
        />
      );
    }
  }

  // Default fallback
  return <AfterPrimaryOrdersList onStartTesting={handleStartTesting} onViewReports={handleViewReports} />;
}

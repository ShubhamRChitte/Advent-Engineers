import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FinalOrdersList } from './FinalOrdersList';
import { FinalTransformersList, FinalTransformer } from './FinalTransformersList';
import { FinalCoreSelection } from './FinalCoreSelection';
import { FinalMeteringReport } from './FinalMeteringReport';
import { FinalPSReport } from './FinalPSReport';
import { FinalProtectionReport } from './FinalProtectionReport';
import { FinalTestReport } from './FinalTestReport';
import { OrderReportsView } from '../entry/OrderReportsView';
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
  // Sync with FinalTransformersList
  assignedUnitIds?: string[];
  transformerName?: string;
  ratio?: string[];
  nominalSystemVoltage?: number | string;
  coreDetails?: any[];
}

interface CoreConfig {
  coreNumber: number;
  coreType: 'metering' | 'ps' | 'protection';
  coreId?: string;
  accuracyClass?: string | undefined;
}

type ViewType = 'orders' | 'transformers' | 'cores' | 'core-report' | 'comprehensive-report' | 'order-reports';

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

  const handleViewReports = (order: Order) => {
    setSelectedOrder(order);
    setCurrentView('order-reports');
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

  const handleApproveTransformer = async (t?: FinalTransformer) => {
    const target = t || selectedTransformer;
    if (!target) return;

    try {
      // Updated to use the real endpoint
      console.log('Approving transformer:', target.uniqueId);

      const response = await axios.put(`http://localhost:5001/api/transformers/${target.uniqueId}/approve-stage`, {
        stage: 'final',
        nextStage: 'shipped' // or 'completed' depending on workflow
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        toast.success(`Transformer ${target.uniqueId} approved successfully!`);
        // Return to list to refresh data
        handleBackToTransformers();
      } else {
        toast.error('Approval failed: ' + response.data.message);
      }

    } catch (error: any) {
      console.error('Approval failed:', error);
      toast.error(error.response?.data?.message || 'Failed to approve transformer');
    }

  };

  const testerName = userName || 'Final Tester';

  // Orders List View
  if (currentView === 'orders') {
    return <FinalOrdersList onStartTesting={handleStartTesting} onViewReports={handleViewReports} />;
  }

  // Reports View
  if (currentView === 'order-reports' && selectedOrder) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <OrderReportsView
          order={selectedOrder as any}
          clientName={selectedOrder.clientName || selectedOrder.client || 'Unknown'}
          onBack={handleBackToOrders}
        />
      </div>
    );
  }

  // Transformers List View
  if (currentView === 'transformers' && selectedOrder) {
    return (
      <FinalTransformersList
        order={selectedOrder}
        onStartTest={handleStartTest}
        onBack={handleBackToOrders}
        onApprove={handleApproveTransformer}
      />
    );
  }

  // Core Selection View
  if (currentView === 'cores' && selectedTransformer && selectedOrder) {
    return (
      <FinalCoreSelection
        transformer={selectedTransformer}
        order={{
          ...selectedOrder,
          client: selectedOrder.clientName || selectedOrder.client || '',
          // Added ratios property to the order object being passed to FinalCoreSelection
          // This assumes 't' is a FinalTransformer and 'order' is the selectedOrder.
          // The original snippet was a bit fragmented, so this is an interpretation
          // of how `ratios` might be passed if `t` was available in this scope.
          // Since `t` is not available here, I'm using `selectedOrder.ratio` if it exists.
          ratios: selectedOrder.ratio || [],
        } as any}
        onSelectCore={handleSelectCore}
        onOpenComprehensiveReport={handleOpenComprehensiveReport}
        onBack={handleBackToTransformers}
        onApprove={() => handleApproveTransformer()}
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
          core={selectedCore as any} // Cast if minor type mismatch occurs from optional ID
          testerName={testerName}
          onBack={handleBackToCores}
        />
      );
    }

    if (selectedCore.coreType === 'ps') {
      return (
        <FinalPSReport
          transformer={selectedTransformer}
          core={selectedCore as any}
          testerName={testerName}
          onBack={handleBackToCores}
        />
      );
    }

    if (selectedCore.coreType === 'protection') {
      return (
        <FinalProtectionReport
          transformer={selectedTransformer}
          core={selectedCore as any}
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
        onApprove={() => handleApproveTransformer(selectedTransformer)}
      />
    );
  }

  // Default fallback
  return <FinalOrdersList onStartTesting={handleStartTesting} onViewReports={handleViewReports} />;
}

import { useState } from 'react';
<<<<<<< HEAD
=======
import axios from 'axios';
import { toast } from 'sonner';
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
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
<<<<<<< HEAD
=======
  // Sync with FinalTransformersList
  assignedUnitIds?: string[];
  transformerName?: string;
  ratio?: string[];
  nominalSystemVoltage?: number | string;
  coreDetails?: any[];
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
}

interface CoreConfig {
  coreNumber: number;
  coreType: 'metering' | 'ps' | 'protection';
<<<<<<< HEAD
  coreId: string;
=======
  coreId?: string; // Optional to match other files
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
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

<<<<<<< HEAD
=======
  const handleApproveTransformer = async (t?: FinalTransformer) => {
    const target = t || selectedTransformer;
    if (!target) return;

    try {
      // Updated to use the real endpoint
      console.log('Approving transformer:', target.uniqueId);

      const response = await axios.put(`http://localhost:3002/api/transformers/${target.uniqueId}/approve-stage`, {
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

>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
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
<<<<<<< HEAD
=======
        onApprove={handleApproveTransformer}
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
      />
    );
  }

  // Core Selection View
  if (currentView === 'cores' && selectedTransformer && selectedOrder) {
    return (
      <FinalCoreSelection
        transformer={selectedTransformer}
<<<<<<< HEAD
        order={selectedOrder}
        onSelectCore={handleSelectCore}
        onOpenComprehensiveReport={handleOpenComprehensiveReport}
        onBack={handleBackToTransformers}
=======
        order={{
          ...selectedOrder,
          client: selectedOrder.clientName || selectedOrder.client || ''
        } as any}
        onSelectCore={handleSelectCore}
        onOpenComprehensiveReport={handleOpenComprehensiveReport}
        onBack={handleBackToTransformers}
        onApprove={() => handleApproveTransformer()}
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
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
<<<<<<< HEAD
          core={selectedCore}
=======
          core={selectedCore as any} // Cast if minor type mismatch occurs from optional ID
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
          testerName={testerName}
          onBack={handleBackToCores}
        />
      );
    }

    if (selectedCore.coreType === 'ps') {
      return (
        <FinalPSReport
          transformer={selectedTransformer}
<<<<<<< HEAD
          core={selectedCore}
=======
          core={selectedCore as any}
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
          testerName={testerName}
          onBack={handleBackToCores}
        />
      );
    }

    if (selectedCore.coreType === 'protection') {
      return (
        <FinalProtectionReport
          transformer={selectedTransformer}
<<<<<<< HEAD
          core={selectedCore}
=======
          core={selectedCore as any}
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
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

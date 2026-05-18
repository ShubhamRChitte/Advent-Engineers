import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { FinalOrdersList } from './FinalOrdersList';
import { FinalTransformersList, FinalTransformer } from './FinalTransformersList';
import { FinalCoreSelection } from './FinalCoreSelection';
import { FinalMeteringReport } from './FinalMeteringReport';
import { FinalPSReport } from './FinalPSReport';
import { FinalProtectionReport } from './FinalProtectionReport';
import { FinalTestReport } from './FinalTestReport';
import { OrderReportsView } from '../entry/OrderReportsView';
import { useCTTimer } from '../../utils/useCTTimer';
import { CTTimerBadge } from './CTTimerBadge';
interface Order {
  _id: string; 
  jobId: string;
  clientName: string; 
  client?: string; 
  transformerCount?: number; 
  quantity?: number; 
  transformerQuantity?: number; 
  assignedDate: string;
  status: string;
  priority: string;
  assignedUnitIds?: string[];
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
  const [selectedPrimary, setSelectedPrimary] = useState<string>('');
  const [selectedSecondary, setSelectedSecondary] = useState<string>('');

  // ── CT Delay Timer ──────────────────────────────────────────────────
  const finalCoreCount = (selectedTransformer as any)?.cores?.length
    || (selectedTransformer as any)?.coreDetails?.length
    || 1;
  const { timeLeftMs: ctTimeLeftMs, isOverdue: ctIsOverdue, expectedMinutes: ctExpectedMinutes, endTimer: ctEndTimer } = useCTTimer({
    transformerId: selectedTransformer?._id || selectedTransformer?.uniqueId || '',
    orderId:       selectedOrder?._id || '',
    jobId:         selectedOrder?.jobId || '',
    stage:         'final',
    testerName:    userName || 'Final Tester',
    role:          'final-tester',
    coreCount:     finalCoreCount,
    enabled:       !!selectedTransformer && currentView !== 'orders' && currentView !== 'transformers'
  });


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

  const handleSelectCore = (core: CoreConfig, primary: string, secondary: string) => {
    setSelectedCore(core);
    setSelectedPrimary(primary);
    setSelectedSecondary(secondary);
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
      console.log('Approving transformer:', target.uniqueId);

      const response = await axios.put(`http://localhost:5001/api/transformers/${target.uniqueId}/approve-stage`, {
        stage: 'final',
        nextStage: 'shipped'
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        toast.success(`Transformer ${target.uniqueId} approved successfully!`);
        await ctEndTimer(); // Stop the CT timer on approval
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

  const HeaderWithTimer = ({ title, onBack }: { title: string; onBack: () => void }) => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{selectedTransformer?.uniqueId}</p>
        </div>
      </div>
    </div>
  );

  // The CTTimerBadge is rendered once at the top of all active test views
  const timerBadge = (currentView === 'cores' || currentView === 'core-report' || currentView === 'comprehensive-report') ? (
    <CTTimerBadge timeLeftMs={ctTimeLeftMs} isOverdue={ctIsOverdue} expectedMinutes={ctExpectedMinutes} title="Final Testing" />
  ) : null;


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
      <div className="space-y-6">
        {timerBadge}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <HeaderWithTimer title="Select Core for Final Testing" onBack={handleBackToTransformers} />
          <FinalCoreSelection
            transformer={selectedTransformer}
            order={{
              ...selectedOrder,
              client: selectedOrder.clientName || selectedOrder.client || '',
              ratios: selectedOrder.ratio || [],
            } as any}
            onSelectCore={handleSelectCore}
            onOpenComprehensiveReport={handleOpenComprehensiveReport}
            onBack={handleBackToTransformers}
            onApprove={() => handleApproveTransformer()}
          />
        </div>
      </div>
    );
  }

  // Core-Wise Report View
  if (currentView === 'core-report' && selectedTransformer && selectedCore) {
    return (
      <div className="space-y-6">
        {timerBadge}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <HeaderWithTimer title={`${selectedCore.coreType.toUpperCase()} Core Test`} onBack={handleBackToCores} />
          {selectedCore.coreType === 'metering' && (
            <FinalMeteringReport
              transformer={selectedTransformer}
              core={selectedCore as any} 
              testerName={testerName}
              onBack={handleBackToCores}
              order={selectedOrder}
              primaryCurrent={selectedPrimary}
              secondaryCurrent={selectedSecondary}
            />
          )}
          {selectedCore.coreType === 'ps' && (
            <FinalPSReport
              transformer={selectedTransformer}
              core={selectedCore as any}
              testerName={testerName}
              onBack={handleBackToCores}
              order={selectedOrder}
              primaryCurrent={selectedPrimary}
              secondaryCurrent={selectedSecondary}
            />
          )}
          {selectedCore.coreType === 'protection' && (
            <FinalProtectionReport
              transformer={selectedTransformer}
              core={selectedCore as any}
              testerName={testerName}
              onBack={handleBackToCores}
              order={selectedOrder}
              primaryCurrent={selectedPrimary}
              secondaryCurrent={selectedSecondary}
            />
          )}
        </div>
      </div>
    );
  }

  // Comprehensive Report View
  if (currentView === 'comprehensive-report' && selectedTransformer) {
    return (
      <div className="space-y-6">
        {timerBadge}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <HeaderWithTimer title="Comprehensive Final Test Report" onBack={handleBackToCores} />
          <FinalTestReport
            transformer={selectedTransformer}
            testerName={testerName}
            onBack={handleBackToCores}
            onApprove={() => handleApproveTransformer(selectedTransformer)}
          />
        </div>
      </div>
    );
  }

  // Default fallback
  return <FinalOrdersList onStartTesting={handleStartTesting} onViewReports={handleViewReports} />;
}

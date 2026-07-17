import { useState } from 'react';
import axios from '@/utils/axiosConfig';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { FinalOrdersList } from './FinalOrdersList';
import { FinalTransformersList, FinalTransformer } from './FinalTransformersList';
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

type ViewType = 'orders' | 'transformers' | 'core-report' | 'comprehensive-report' | 'order-reports';

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
    transformerId: (selectedTransformer as any)?._id || selectedTransformer?.uniqueId || '',
    orderId:       selectedOrder?._id || '',
    jobId:         selectedOrder?.jobId || '',
    stage:         'final',
    testerName:    userName || 'Final Tester',
    role:          'final-tester',
    coreCount:     finalCoreCount,
    enabled:       !!selectedTransformer && currentView !== 'orders' && currentView !== 'transformers'
  });


  const handleStartTesting = (order: any) => {
    setSelectedOrder(order);
    setCurrentView('transformers');
  };

  const handleViewReports = (order: Order) => {
    setSelectedOrder(order);
    setCurrentView('order-reports');
  };

  const handleStartTest = (transformer: FinalTransformer) => {
    setSelectedTransformer(transformer);
    setCurrentView('comprehensive-report');
  };

  const handleBackToOrders = () => {
    setCurrentView('orders');
    setSelectedOrder(null);
    setSelectedTransformer(null);
    setSelectedCore(null);
  };

  const refreshTransformer = async () => {
    if (selectedTransformer?.uniqueId) {
      try {
        const res = await axios.get(`/transformers/${selectedTransformer.uniqueId}`, { withCredentials: true });
        if (res.data) {
          setSelectedTransformer(prev => {
            if (!prev) return res.data;
            return {
              ...prev,
              ...res.data,
              cores: prev.cores
            };
          });
          return res.data;
        }
      } catch (err) {
        console.error('[FinalModule] Failed to refresh transformer:', err);
      }
    }
    return null;
  };

  const handleBackToTransformers = async () => {
    await refreshTransformer();
    setCurrentView('transformers');
    setSelectedTransformer(null);
    setSelectedCore(null);
  };

  const handleApproveTransformer = async (t?: FinalTransformer) => {
    const target = t || selectedTransformer;
    if (!target) return;

    try {
      console.log('Approving transformer:', target.uniqueId);

      const response = await axios.put(`/transformers/${target.uniqueId}/approve-stage`, {
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
  const timerBadge = (currentView === 'core-report' || currentView === 'comprehensive-report') ? (
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

  // Core-Wise Report View
  if (currentView === 'core-report' && selectedTransformer && selectedCore) {
    // Find if there is a next core for this transformer
    const currentIndex = selectedTransformer.cores.findIndex(
      c => c.coreNumber === selectedCore.coreNumber
    );
    const hasNext = currentIndex !== -1 && currentIndex < selectedTransformer.cores.length - 1;
    const onNext = hasNext ? () => {
      const nextCore = selectedTransformer.cores[currentIndex + 1];
      const coreFromOrder = selectedOrder?.coreDetails?.[nextCore.coreNumber - 1];
      const secondaryVal = coreFromOrder?.secondaryCurrent || selectedOrder?.ratedSecondaryCurrent || '1';
      const primaryVal = coreFromOrder?.primaryCurrent || selectedOrder?.primaryCurrents?.[0] || (selectedOrder?.ratio?.[0]?.split('/')[0] || '');
      
      setSelectedCore(nextCore as any);
      setSelectedPrimary(String(primaryVal));
      setSelectedSecondary(String(secondaryVal));
    } : undefined;

    const onPrev = async () => {
      if (currentIndex > 0) {
        const prevCore = selectedTransformer.cores[currentIndex - 1];
        const coreFromOrder = selectedOrder?.coreDetails?.[prevCore.coreNumber - 1];
        const secondaryVal = coreFromOrder?.secondaryCurrent || selectedOrder?.ratedSecondaryCurrent || '1';
        const primaryVal = coreFromOrder?.primaryCurrent || selectedOrder?.primaryCurrents?.[0] || (selectedOrder?.ratio?.[0]?.split('/')[0] || '');
        
        setSelectedCore(prevCore as any);
        setSelectedPrimary(String(primaryVal));
        setSelectedSecondary(String(secondaryVal));
      } else {
        setSelectedCore(null);
        await refreshTransformer();
        setCurrentView('comprehensive-report');
      }
    };

    const reportKey = `${selectedTransformer.uniqueId}-${selectedCore.coreId}`;

    return (
      <div className="space-y-6">
        {timerBadge}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <HeaderWithTimer title={`${selectedCore.coreType.toUpperCase()} Core Test`} onBack={handleBackToTransformers} />
          {selectedCore.coreType === 'metering' && (
            <FinalMeteringReport
              key={reportKey}
              transformer={selectedTransformer as any}
              core={selectedCore as any} 
              testerName={testerName}
              onBack={handleBackToTransformers}
              onFail={handleBackToOrders}
              order={selectedOrder}
              primaryCurrent={selectedPrimary}
              secondaryCurrent={selectedSecondary}
              onNext={onNext}
              onPrev={onPrev}
            />
          )}
          {selectedCore.coreType === 'ps' && (
            <FinalPSReport
              key={reportKey}
              transformer={selectedTransformer as any}
              core={selectedCore as any}
              testerName={testerName}
              onBack={handleBackToTransformers}
              onFail={handleBackToOrders}
              order={selectedOrder}
              primaryCurrent={selectedPrimary}
              secondaryCurrent={selectedSecondary}
              onNext={onNext}
              onPrev={onPrev}
            />
          )}
          {selectedCore.coreType === 'protection' && (
            <FinalProtectionReport
              key={reportKey}
              transformer={selectedTransformer as any}
              core={selectedCore as any}
              testerName={testerName}
              onBack={handleBackToTransformers}
              onFail={handleBackToOrders}
              order={selectedOrder}
              primaryCurrent={selectedPrimary}
              secondaryCurrent={selectedSecondary}
              onNext={onNext}
              onPrev={onPrev}
            />
          )}
        </div>
      </div>
    );
  }

  // Comprehensive Report View
  if (currentView === 'comprehensive-report' && selectedTransformer) {
    const hasNext = selectedTransformer.cores && selectedTransformer.cores.length > 0;
    const onNext = hasNext ? async () => {
      const firstCore = selectedTransformer.cores[0];
      const coreFromOrder = selectedOrder?.coreDetails?.[firstCore.coreNumber - 1];
      const secondaryVal = coreFromOrder?.secondaryCurrent || selectedOrder?.ratedSecondaryCurrent || '1';
      const primaryVal = coreFromOrder?.primaryCurrent || selectedOrder?.primaryCurrents?.[0] || (selectedOrder?.ratio?.[0]?.split('/')[0] || '');
      
      setSelectedCore(firstCore as any);
      setSelectedPrimary(String(primaryVal));
      setSelectedSecondary(String(secondaryVal));
      await refreshTransformer();
      setCurrentView('core-report');
    } : undefined;

    return (
        <div className="space-y-6 print:space-y-0">
          {timerBadge}
          <div className="bg-white p-6 rounded-lg shadow-sm print:p-0 print:shadow-none print:bg-transparent">
            <div className="no-print">
              <HeaderWithTimer title="Comprehensive Final Test Report" onBack={handleBackToTransformers} />
            </div>
            <FinalTestReport
              transformer={selectedTransformer}
              testerName={testerName}
              onBack={handleBackToTransformers}
              onApprove={() => handleApproveTransformer(selectedTransformer)}
              onNext={onNext}
              onSaveSuccess={refreshTransformer}
            />
        </div>
      </div>
    );
  }

  // Default fallback
  return <FinalOrdersList onStartTesting={handleStartTesting} onViewReports={handleViewReports} />;
}

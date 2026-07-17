import { useState, useEffect } from 'react';
import axios from '@/utils/axiosConfig';
import { AfterPrimaryOrdersList } from './AfterPrimaryOrdersList';
import { AfterPrimaryTransformersList, Transformer as AfterPrimaryTransformer } from './AfterPrimaryTransformersList';
import { AfterPrimaryMeteringReport } from './AfterPrimaryMeteringReport';
import { AfterPrimaryPSReport } from './AfterPrimaryPSReport';
import { AfterPrimaryProtectionReport } from './AfterPrimaryProtectionReport';
import { useCTTimer } from '../../utils/useCTTimer';
import { CTTimerBadge } from './CTTimerBadge';
import { toast } from 'sonner';

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

type ViewType = 'orders' | 'transformers' | 'report' | 'order-reports';

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

  // ── CT Delay Timer (after_primary: coreCount drives 5min vs 20min) ────────
  const apCoreCount = (selectedTransformer as any)?.cores?.length
    || (selectedTransformer as any)?.coreDetails?.length
    || 1;
  const { timeLeftMs: ctTimeLeftMs, isOverdue: ctIsOverdue, expectedMinutes: ctExpectedMinutes, endTimer: ctEndTimer } = useCTTimer({
    transformerId: (selectedTransformer as any)?._id || selectedTransformer?.uniqueId || '',
    orderId:       selectedOrder?._id || '',
    jobId:         selectedOrder?.jobId || '',
    stage:         'after_primary',
    testerName:    userName || 'After-Primary Tester',
    role:          'after-primary-tester',
    coreCount:     apCoreCount,
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

  const handleStartTest = async (transformer: AfterPrimaryTransformer) => {
    setSelectedTransformer(transformer);
    if (transformer.cores && transformer.cores.length > 0) {
      const firstCore = transformer.cores[0];
      const coreFromOrder = selectedOrder?.coreDetails?.[firstCore.coreNumber - 1];
      const secondaryVal = coreFromOrder?.secondaryCurrent || selectedOrder?.ratedSecondaryCurrent || '1';
      const primaryVal = coreFromOrder?.primaryCurrent || selectedOrder?.primaryCurrents?.[0] || (selectedOrder?.ratio?.[0]?.split('/')[0] || '');
      
      setSelectedCore(firstCore);
      setSelectedPrimary(String(primaryVal));
      setSelectedSecondary(String(secondaryVal));
      setCurrentView('report');
    } else {
      toast.error("No cores configured for this transformer.");
    }
  };

  const handleBackToOrders = () => {
    setCurrentView('orders');
    setSelectedOrder(null);
    setSelectedTransformer(null);
    setSelectedCore(null);
  };

  const handleBackToTransformers = async () => {
    // Re-fetch fresh transformer data so AfterPrimaryTransformersList sees latest test results
    if (selectedTransformer?.uniqueId) {
      try {
        const res = await axios.get(`/transformers/${selectedTransformer.uniqueId}`, { withCredentials: true });
        if (res.data) {
          setSelectedTransformer(prev => prev ? { ...prev, testHistory: res.data.testHistory } : prev);
        }
      } catch (err) {
        console.error('[AfterPrimaryModule] Failed to refresh transformer after report:', err);
      }
    }
    setCurrentView('transformers');
    setSelectedTransformer(null);
    setSelectedCore(null);
  };

  const renderView = () => {
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

    // Report View - Route to correct report based on core type
    if (currentView === 'report' && selectedTransformer && selectedCore) {
      const testerName = userName || 'Primary Tester';

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
        
        setSelectedCore(nextCore);
        setSelectedPrimary(String(primaryVal));
        setSelectedSecondary(String(secondaryVal));
      } : undefined;

      const hasPrev = currentIndex > 0;
      const onPrev = hasPrev ? () => {
        const prevCore = selectedTransformer.cores[currentIndex - 1];
        const coreFromOrder = selectedOrder?.coreDetails?.[prevCore.coreNumber - 1];
        const secondaryVal = coreFromOrder?.secondaryCurrent || selectedOrder?.ratedSecondaryCurrent || '1';
        const primaryVal = coreFromOrder?.primaryCurrent || selectedOrder?.primaryCurrents?.[0] || (selectedOrder?.ratio?.[0]?.split('/')[0] || '');
        
        setSelectedCore(prevCore);
        setSelectedPrimary(String(primaryVal));
        setSelectedSecondary(String(secondaryVal));
      } : undefined;

      const reportKey = `${selectedTransformer.uniqueId}-${selectedCore.coreId}`;

      if (selectedCore.coreType === 'metering') {
        return (
          <AfterPrimaryMeteringReport
            key={reportKey}
            transformer={selectedTransformer}
            core={selectedCore}
            testerName={testerName}
            onBack={handleBackToTransformers}
            onFail={handleBackToOrders}
            order={selectedOrder}
            primaryCurrent={selectedPrimary}
            secondaryCurrent={selectedSecondary}
            onCompleteTimer={ctEndTimer}
            onNext={onNext}
            onPrev={onPrev}
          />
        );
      }

      if (selectedCore.coreType === 'ps') {
        return (
          <AfterPrimaryPSReport
            key={reportKey}
            transformer={selectedTransformer}
            core={selectedCore}
            testerName={testerName}
            onBack={handleBackToTransformers}
            onFail={handleBackToOrders}
            order={selectedOrder}
            primaryCurrent={selectedPrimary}
            secondaryCurrent={selectedSecondary}
            onCompleteTimer={ctEndTimer}
            onNext={onNext}
            onPrev={onPrev}
          />
        );
      }

      if (selectedCore.coreType === 'protection') {
        return (
          <AfterPrimaryProtectionReport
            key={reportKey}
            transformer={selectedTransformer}
            core={selectedCore}
            testerName={testerName}
            onBack={handleBackToTransformers}
            onFail={handleBackToOrders}
            order={selectedOrder}
            primaryCurrent={selectedPrimary}
            secondaryCurrent={selectedSecondary}
            onCompleteTimer={ctEndTimer}
            onNext={onNext}
            onPrev={onPrev}
          />
        );
      }
    }

    // Default fallback
    return <AfterPrimaryOrdersList onStartTesting={handleStartTesting} onViewReports={handleViewReports} />;
  };

  return (
    <>
    <div className="space-y-6">
      {(currentView === 'report') && (
        <CTTimerBadge timeLeftMs={ctTimeLeftMs} isOverdue={ctIsOverdue} expectedMinutes={ctExpectedMinutes} title="Primary Testing" />
      )}
      {renderView()}
    </div>
    </>
  );
}

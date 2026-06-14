import { useState, useEffect } from 'react';
import axios from '@/utils/axiosConfig';
import { AfterPrimaryOrdersList } from './AfterPrimaryOrdersList';
import { AfterPrimaryTransformersList, Transformer as AfterPrimaryTransformer } from './AfterPrimaryTransformersList';
import { AfterPrimaryCoreSelection } from './AfterPrimaryCoreSelection';
import { AfterPrimaryMeteringReport } from './AfterPrimaryMeteringReport';
import { AfterPrimaryPSReport } from './AfterPrimaryPSReport';
import { AfterPrimaryProtectionReport } from './AfterPrimaryProtectionReport';
import { useCTTimer } from '../../utils/useCTTimer';
import { CTTimerBadge } from './CTTimerBadge';

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


  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

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

  const handleBackToTransformers = async () => {
    setCurrentView('transformers');
    setSelectedTransformer(null);
    setSelectedCore(null);
  };

  const handleBackToCores = async () => {
    // Re-fetch fresh transformer data so AfterPrimaryCoreSelection sees latest test results
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
    setCurrentView('cores');
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
            onCompleteTimer={ctEndTimer}
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
            onCompleteTimer={ctEndTimer}
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
            onCompleteTimer={ctEndTimer}
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
      {(currentView === 'cores' || currentView === 'report') && (
        <CTTimerBadge timeLeftMs={ctTimeLeftMs} isOverdue={ctIsOverdue} expectedMinutes={ctExpectedMinutes} title="Primary Testing" />
      )}
      {renderView()}
    </div>
    </>
  );
}

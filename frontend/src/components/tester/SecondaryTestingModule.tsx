import { useState, useEffect } from 'react';
import axios from '@/utils/axiosConfig';
import { Clock, RefreshCw } from 'lucide-react';
import { SecondaryOrdersList } from './SecondaryOrdersList';
import { SecondaryTransformersList, Transformer } from './SecondaryTransformersList';
import { SecondaryCoreTestingWorkflow } from './SecondaryCoreTestingWorkflow';
import { SecondaryCoreSelection } from './SecondaryCoreSelection';
import { SecondaryMeteringReport } from './SecondaryMeteringReport';
import { SecondaryPSReport } from './SecondaryPSReport';
import { SecondaryProtectionReport } from './SecondaryProtectionReport';
import { SecondaryReportsDashboard } from './reports/SecondaryReportsDashboard';
import { OrderReportsView } from '../entry/OrderReportsView';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { useCTTimer } from '../../utils/useCTTimer';
import { CTTimerBadge } from './CTTimerBadge';

interface Order {
  _id: string;
  jobId: string;
  clientName: string;
  quantity: number;
  transformerQuantity?: number;
  assignedDate: string;
  deadline: string;
  status: string;
  priority: string;
}

type ViewType = 'orders' | 'transformers' | 'core-selection' | 'report' | 'order-reports';
type ReportType = 'metering' | 'ps' | 'protection';

interface SecondaryTestingModuleProps {
  userName: string;
}

export function SecondaryTestingModule({ userName }: SecondaryTestingModuleProps) {
  const [currentView, setCurrentView] = useState<ViewType>('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedTransformer, setSelectedTransformer] = useState<Transformer | null>(null);
  const [selectedCoreNumber, setSelectedCoreNumber] = useState<number>(0);
  const [selectedCoreType, setSelectedCoreType] = useState<ReportType>('metering');
  const [enteredCoreId, setEnteredCoreId] = useState<string>('');
  const [selectedAccuracyClass, setSelectedAccuracyClass] = useState<string | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // ── CT Delay Timer ──────────────────────────────────────────────────
  const { timeLeftMs: ctTimeLeftMs, isOverdue: ctIsOverdue, expectedMinutes: ctExpectedMinutes, endTimer: ctEndTimer, completeCore: ctCompleteCore } = useCTTimer({
    transformerId: selectedTransformer?._id || selectedTransformer?.uniqueId || '',
    orderId:       selectedOrder?._id || '',
    jobId:         selectedOrder?.jobId || '',
    stage:         'secondary',
    testerName:    userName || 'Secondary Tester',
    role:          'secondary-tester',
    coreCount:     selectedTransformer?.cores?.length || 1,
    enabled:       !!selectedTransformer && currentView !== 'orders' && currentView !== 'transformers',
    autoStart:     true
  });

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  const handleStartTesting = (order: Order) => {
    setSelectedOrder(order);
    setCurrentView('transformers');
  };

  const handleViewReports = (order: Order) => {
    setSelectedOrder(order);
    setCurrentView('order-reports');
  };

  const handleStartTest = async (transformer: Transformer) => {
    setSelectedTransformer(transformer);
    setCurrentView('core-selection');
  };

  const handleCoreSelect = (coreNumber: number, coreType: string, coreId: string, uniqueId: string, accuracyClass?: string) => {
    setSelectedCoreNumber(coreNumber);
    setSelectedCoreType(coreType as ReportType);
    setEnteredCoreId(coreId);
    setSelectedAccuracyClass(accuracyClass);
    setCurrentView('report');
  };

  const handleBackToOrders = () => {
    setCurrentView('orders');
    setSelectedOrder(null);
    setSelectedTransformer(null);
    setSelectedCoreNumber(0);
    setEnteredCoreId('');
  };

  const handleBackToTransformers = async () => {
    if (selectedTransformer) {
      setCurrentView('transformers');
      setSelectedTransformer(null);
      setSelectedCoreNumber(0);
      setEnteredCoreId('');
    }
  };

  const handleBackFromReport = async () => {
    // Re-fetch fresh transformer data so SecondaryCoreSelection sees latest test results
    if (selectedTransformer?.uniqueId) {
      try {
        const res = await axios.get(`/transformers/${selectedTransformer.uniqueId}`, { withCredentials: true });
        if (res.data) {
          setSelectedTransformer(prev => prev ? { ...prev, testHistory: res.data.testHistory } : prev);
        }
      } catch (err) {
        console.error('[SecondaryModule] Failed to refresh transformer after report:', err);
      }
    }
    setCurrentView('core-selection');
    setSelectedCoreNumber(0);
    setEnteredCoreId('');
    setSelectedAccuracyClass(undefined);
  };

  const handleNextTransformerCore = () => {
    if (selectedTransformer && selectedCoreNumber < (selectedTransformer.cores?.length || 1)) {
      const nextCoreNum = selectedCoreNumber + 1;
      const nextConfig = selectedTransformer.cores.find(c => c.coreNumber === nextCoreNum);
      if (nextConfig) {
        setSelectedCoreNumber(nextCoreNum);
        setSelectedCoreType(nextConfig.coreType as ReportType);
        setEnteredCoreId(nextConfig.coreId || '');
        setSelectedAccuracyClass(nextConfig.accuracyClass);
        return;
      }
    }
    handleBackFromReport();
  };

  return (
    <>
    <div className="space-y-6">
      {(currentView === 'core-selection' || currentView === 'report') && (
        <CTTimerBadge 
          timeLeftMs={ctTimeLeftMs} 
          isOverdue={ctIsOverdue} 
          expectedMinutes={ctExpectedMinutes} 
          title="Secondary Testing"
        />
      )}

      {/* Top Navigation Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Secondary Testing</h1>
          <p className="text-sm text-gray-500">Welcome, {userName}</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[600px]">

        {currentView === 'orders' && (
          <SecondaryOrdersList
            onStartTesting={handleStartTesting}
            onViewReports={handleViewReports}
            refreshTrigger={refreshTrigger}
          />
        )}

        {currentView === 'order-reports' && selectedOrder && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <OrderReportsView
              order={selectedOrder}
              clientName={selectedOrder.clientName || 'Unknown'}
              onBack={handleBackToOrders}
            />
          </div>
        )}

        {currentView === 'transformers' && selectedOrder && (
          <SecondaryCoreTestingWorkflow
            order={selectedOrder}
            userName={userName}
            onBack={handleBackToOrders}
            onRefreshOrders={triggerRefresh}
          />
        )}

        {currentView === 'core-selection' && selectedTransformer && (
          <SecondaryCoreSelection
            transformer={selectedTransformer}
            onCoreSelect={handleCoreSelect}
            onBack={handleBackToTransformers}
            onRefreshOrders={triggerRefresh}
            onEndTimer={ctEndTimer}
          />
        )}

        {currentView === 'report' && selectedTransformer && (
          <div className="bg-white rounded-lg shadow-sm">
            {selectedCoreType === 'metering' && (
              <SecondaryMeteringReport
                transformer={selectedTransformer}
                coreNumber={selectedCoreNumber}
                coreId={enteredCoreId}
                testerName={userName || 'Unknown Tester'}
                onBack={handleBackFromReport}
                onNext={handleNextTransformerCore}
                onFail={handleBackToOrders}
                stage="secondary"
                accuracyClass={selectedAccuracyClass}
                onRefresh={triggerRefresh}
                onCompleteTimer={() => ctCompleteCore(enteredCoreId)}
              />
            )}
            {selectedCoreType === 'ps' && (
              <SecondaryPSReport
                transformer={selectedTransformer}
                coreNumber={selectedCoreNumber}
                coreId={enteredCoreId}
                testerName={userName || 'Unknown Tester'}
                onBack={handleBackFromReport}
                onNext={handleNextTransformerCore}
                onFail={handleBackToOrders}
                stage="secondary"
                accuracyClass={selectedAccuracyClass}
                onRefresh={triggerRefresh}
                onCompleteTimer={() => ctCompleteCore(enteredCoreId)}
              />
            )}
            {selectedCoreType === 'protection' && (
              <SecondaryProtectionReport
                transformer={selectedTransformer}
                coreNumber={selectedCoreNumber}
                coreId={enteredCoreId}
                testerName={userName || 'Unknown Tester'}
                onBack={handleBackFromReport}
                onNext={handleNextTransformerCore}
                onFail={handleBackToOrders}
                stage="secondary"
                accuracyClass={selectedAccuracyClass}
                onRefresh={triggerRefresh}
                onCompleteTimer={() => ctCompleteCore(enteredCoreId)}
              />
            )}
          </div>
        )}
      </div>
    </div>

  </>
  );
}


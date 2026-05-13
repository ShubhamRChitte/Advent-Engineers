import { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, RefreshCw } from 'lucide-react';
import { SecondaryOrdersList } from './SecondaryOrdersList';
import { SecondaryTransformersList, Transformer } from './SecondaryTransformersList';
import { SecondaryCoreSelection } from './SecondaryCoreSelection';
import { SecondaryMeteringReport } from './SecondaryMeteringReport';
import { SecondaryPSReport } from './SecondaryPSReport';
import { SecondaryProtectionReport } from './SecondaryProtectionReport';
import { SecondaryReportsDashboard } from './reports/SecondaryReportsDashboard';
import { OrderReportsView } from '../entry/OrderReportsView';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'; // Import Tabs components

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

  const [timerData, setTimerData] = useState<{ 
    startTime: string | null; 
    accumulatedTimeMs: number; 
    allocatedMinutes: number;
    timerStatus: string; // The backend uses timerStatus
  } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

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
    try {
      const response = await axios.post(`http://localhost:5001/api/transformers/${transformer.uniqueId}/update-timer`, {
        action: 'start',
        stage: 'secondary_test'
      }, { withCredentials: true });
      if (response.data.success) {
        setTimerData(response.data.data);
      }
    } catch (err) {
      console.error("Failed to start timer:", err);
    }
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
      try {
        const response = await axios.post(`http://localhost:5001/api/transformers/${selectedTransformer.uniqueId}/update-timer`, {
          action: 'pause',
          stage: 'secondary_test'
        }, { withCredentials: true });
        if (response.data.success) {
          setTimerData(response.data.data);
        }
      } catch (err) {
        console.error("Failed to pause timer:", err);
      }
    }
    setCurrentView('transformers');
    setSelectedTransformer(null);
    setSelectedCoreNumber(0);
    setEnteredCoreId('');
  };

  useEffect(() => {
    if (!timerData) return;

    if (timerData.timerStatus !== "In Progress" || !timerData.startTime) {
      const allocatedMs = (timerData.allocatedMinutes || 15) * 60 * 1000;
      const elapsed = timerData.accumulatedTimeMs || 0;
      setTimeLeft(allocatedMs - elapsed);
      return;
    }

    const interval = setInterval(() => {
      const start = new Date(timerData.startTime!).getTime();
      const accumulated = timerData.accumulatedTimeMs || 0;
      const allocatedMs = (timerData.allocatedMinutes || 15) * 60 * 1000;
      const now = Date.now();
      
      const totalElapsed = accumulated + (now - start);
      setTimeLeft(allocatedMs - totalElapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [timerData]);

  const formatTime = (ms: number) => {
    const isNegative = ms < 0;
    const absMs = Math.abs(ms);
    const totalSeconds = Math.floor(absMs / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${isNegative ? '-' : ''}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const TimerDisplay = () => {
    if (timeLeft === null || !['core-selection', 'report'].includes(currentView)) return null;
    const isOver = timeLeft < 0;
    const isPaused = timerData?.timerStatus === "Paused";

    return (
      <div className={`mb-4 px-4 py-2 rounded-lg border-2 flex items-center justify-between transition-all ${
        isOver ? 'bg-red-50 border-red-500 text-red-600 animate-pulse' : 
        isPaused ? 'bg-amber-50 border-amber-300 text-amber-600' :
        'bg-green-50 border-green-500 text-green-600'
      }`}>
        <div className="flex items-center gap-2 font-bold">
          {isPaused ? <Clock className="w-4 h-4" /> : <RefreshCw className={`w-4 h-4 ${!isOver ? 'animate-spin-slow' : ''}`} />}
          <span className="text-sm uppercase tracking-wider">
            Secondary Testing Time {isPaused ? '(Paused)' : 'Limit'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium opacity-80">Remaining:</span>
          <span className="text-2xl font-mono font-black tabular-nums">{formatTime(timeLeft)}</span>
        </div>
      </div>
    );
  };

  const handleBackFromReport = () => {
    setCurrentView('core-selection');
    setSelectedCoreNumber(0);
    setEnteredCoreId('');
    setSelectedAccuracyClass(undefined);
  };

  return (
    <div className="space-y-6">

      {/* Top Navigation Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Secondary Testing</h1>
          <p className="text-sm text-gray-500">Welcome, {userName}</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[600px]">
        <TimerDisplay />

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
          <SecondaryTransformersList
            order={selectedOrder}
            onStartTest={handleStartTest}
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
                stage="secondary"
                accuracyClass={selectedAccuracyClass}
                onRefresh={triggerRefresh}
              />
            )}
            {selectedCoreType === 'ps' && (
              <SecondaryPSReport
                transformer={selectedTransformer}
                coreNumber={selectedCoreNumber}
                coreId={enteredCoreId}
                testerName={userName || 'Unknown Tester'}
                onBack={handleBackFromReport}
                stage="secondary"
                accuracyClass={selectedAccuracyClass}
                onRefresh={triggerRefresh}
              />
            )}
            {selectedCoreType === 'protection' && (
              <SecondaryProtectionReport
                transformer={selectedTransformer}
                coreNumber={selectedCoreNumber}
                coreId={enteredCoreId}
                testerName={userName || 'Unknown Tester'}
                onBack={handleBackFromReport}
                stage="secondary"
                accuracyClass={selectedAccuracyClass}
                onRefresh={triggerRefresh}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}


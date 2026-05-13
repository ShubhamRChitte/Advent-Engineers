import { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock } from 'lucide-react';
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


  const [timerData, setTimerData] = useState<{ 
    startTime: string | null; 
    accumulatedTimeMs: number; 
    allocatedMinutes: number;
    timerStatus?: string;
  } | null>(null);

  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  const handleStartTesting = (order: any) => {
    setSelectedOrder(order);
    setCurrentView('transformers');
  };

  const handleViewReports = (order: Order) => {
    setSelectedOrder(order);
    setCurrentView('order-reports');
  };

  const handleStartTest = async (transformer: AfterPrimaryTransformer) => {
    try {
      const response = await axios.post(`http://localhost:5001/api/transformers/${transformer.uniqueId}/update-timer`, {
        action: 'start',
        stage: 'primary_test'
      }, { withCredentials: true });
      if (response.data.success) {
        setTimerData(response.data.data);
      }
    } catch (err) {
      console.error("Failed to start timer:", err);
    }
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
    setTimerData(null);
  };

  const handleBackToTransformers = async () => {
    if (selectedTransformer) {
      try {
        const response = await axios.post(`http://localhost:5001/api/transformers/${selectedTransformer.uniqueId}/update-timer`, {
          action: 'pause',
          stage: 'primary_test'
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
    setSelectedCore(null);
  };

  const handleBackToCores = () => {
    setCurrentView('cores');
    setSelectedCore(null);
  };

  // Timer Component
  const TimerDisplay = () => {
    if (!timerData || currentView === 'orders' || currentView === 'transformers') return null;

    const [timeLeft, setTimeLeft] = useState(0);
    const [overdueTime, setOverdueTime] = useState(0);

    useEffect(() => {
      const calculateTime = () => {
        if (!timerData.startTime) {
          const totalMs = timerData.allocatedMinutes * 60000;
          const elapsed = timerData.accumulatedTimeMs || 0;
          if (elapsed > totalMs) {
            setOverdueTime(elapsed - totalMs);
            setTimeLeft(0);
          } else {
            setOverdueTime(0);
            setTimeLeft(totalMs - elapsed);
          }
          return;
        }
        
        const now = Date.now();
        const start = new Date(timerData.startTime).getTime();
        const elapsed = now - start + (timerData.accumulatedTimeMs || 0);
        const totalMs = timerData.allocatedMinutes * 60000;
        
        if (elapsed > totalMs) {
          setOverdueTime(elapsed - totalMs);
          setTimeLeft(0);
        } else {
          setOverdueTime(0);
          setTimeLeft(totalMs - elapsed);
        }
      };

      calculateTime();

      if (timerData.timerStatus !== "Paused") {
        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
      }
    }, [timerData]);

    const formatTime = (ms: number) => {
      const totalSeconds = Math.floor(ms / 1000);
      const m = Math.floor(totalSeconds / 60);
      const s = totalSeconds % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const isOver = timeLeft === 0 && overdueTime > 0;
    const isPaused = timerData?.timerStatus === "Paused";

    return (
      <div className={`mb-4 px-4 py-2 rounded-lg border-2 flex items-center justify-between transition-all ${
        isOver ? 'bg-red-50 border-red-500 text-red-600 animate-pulse' : 
        isPaused ? 'bg-amber-50 border-amber-300 text-amber-600' :
        'bg-green-50 border-green-500 text-green-600'
      }`}>
        <div className="flex items-center gap-2 font-bold">
          {isPaused ? <Clock className="w-4 h-4" /> : <Clock className={`w-4 h-4 ${!isOver ? 'animate-spin-slow' : ''}`} />}
          <span className="text-sm uppercase tracking-wider">
            Primary Testing Time {isPaused ? '(Paused)' : 'Limit'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isOver ? (
            <>
              <span className="text-xs font-bold uppercase">Delayed By:</span>
              <span className="text-2xl font-mono font-black tabular-nums text-red-600">
                {formatTime(overdueTime)}
              </span>
            </>
          ) : (
            <>
              <span className="text-xs font-medium opacity-80">Remaining:</span>
              <span className="text-2xl font-mono font-black tabular-nums">{formatTime(timeLeft)}</span>
            </>
          )}
        </div>
      </div>
    );
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
  };

  return (
    <div className="space-y-6">
      <TimerDisplay />
      {renderView()}
    </div>
  );
}

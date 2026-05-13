import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Clock, ArrowLeft } from 'lucide-react';
import { FinalOrdersList } from './FinalOrdersList';
import { FinalTransformersList, FinalTransformer } from './FinalTransformersList';
import { FinalCoreSelection } from './FinalCoreSelection';
import { FinalMeteringReport } from './FinalMeteringReport';
import { FinalPSReport } from './FinalPSReport';
import { FinalProtectionReport } from './FinalProtectionReport';
import { FinalTestReport } from './FinalTestReport';
import { OrderReportsView } from '../entry/OrderReportsView';
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
  const [timerData, setTimerData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const handleTimerAction = async (transformer: FinalTransformer, action: 'start' | 'pause' | 'complete') => {
    try {
      const response = await axios.post(`http://localhost:5001/api/transformers/${transformer.uniqueId}/update-timer`, {
        stage: 'final_test',
        action
      }, { withCredentials: true });
      
      if (response.data.success) {
        setTimerData(response.data.data);
      }
    } catch (error) {
      console.error(`Failed to ${action} timer:`, error);
    }
  };

  useEffect(() => {
    let interval: any;
    if (timerData && timerData.timerStatus === "In Progress" && timerData.startTime) {
      interval = setInterval(() => {
        const allocatedMs = timerData.allocatedMinutes * 60 * 1000;
        const elapsed = (timerData.accumulatedTimeMs || 0) + (Date.now() - new Date(timerData.startTime).getTime());
        setTimeLeft(allocatedMs - elapsed);
      }, 1000);
    } else if (timerData) {
      const allocatedMs = timerData.allocatedMinutes * 60 * 1000;
      const elapsed = timerData.accumulatedTimeMs || 0;
      setTimeLeft(allocatedMs - elapsed);
    } else {
      setTimeLeft(null);
    }
    return () => clearInterval(interval);
  }, [timerData]);


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
    handleTimerAction(transformer, 'start');
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
    if (selectedTransformer) {
      handleTimerAction(selectedTransformer, 'pause');
    }
    setCurrentView('orders');
    setSelectedOrder(null);
    setSelectedTransformer(null);
    setSelectedCore(null);
    setTimerData(null);
    setTimeLeft(null);
  };

  const handleBackToTransformers = () => {
    if (selectedTransformer) {
      handleTimerAction(selectedTransformer, 'pause');
    }
    setCurrentView('transformers');
    setSelectedTransformer(null);
    setSelectedCore(null);
    setTimerData(null);
    setTimeLeft(null);
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
        // Stop the timer
        handleTimerAction(target, 'complete');
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

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const TimerDisplay = () => {
    if (timeLeft === null) return null;
    const isOvertime = timeLeft <= 0;
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm ${
        isOvertime ? 'bg-red-50 border-red-200 text-red-600' : 'bg-blue-50 border-blue-200 text-blue-700'
      }`}>
        <Clock className="w-4 h-4" />
        <span className="text-sm font-bold font-mono">
          {isOvertime ? `Overtime: ${formatTime(Math.abs(timeLeft))}` : `Time Left: ${formatTime(timeLeft)}`}
        </span>
      </div>
    );
  };


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
      <TimerDisplay />
    </div>
  );


  // Core Selection View
  if (currentView === 'cores' && selectedTransformer && selectedOrder) {
    return (
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
    );
  }

  // Core-Wise Report View - Route to correct report based on core type
  if (currentView === 'core-report' && selectedTransformer && selectedCore) {
    return (
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
    );
  }

  // Comprehensive Report View
  if (currentView === 'comprehensive-report' && selectedTransformer) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <HeaderWithTimer title="Comprehensive Final Test Report" onBack={handleBackToCores} />
        <FinalTestReport
          transformer={selectedTransformer}
          testerName={testerName}
          onBack={handleBackToCores}
          onApprove={() => handleApproveTransformer(selectedTransformer)}
        />
      </div>
    );
  }

  // Default fallback
  return <FinalOrdersList onStartTesting={handleStartTesting} onViewReports={handleViewReports} />;
}

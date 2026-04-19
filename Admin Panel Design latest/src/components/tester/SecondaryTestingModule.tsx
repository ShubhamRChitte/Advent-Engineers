import { useState } from 'react';
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

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  const handleStartTesting = (order: Order) => {
    setSelectedOrder(order);
    setCurrentView('transformers');
  };

  const handleViewReports = (order: Order) => {
    setSelectedOrder(order);
    setCurrentView('order-reports');
  };

  const handleStartTest = (transformer: Transformer) => {
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

  const handleBackToTransformers = () => {
    setCurrentView('transformers');
    setSelectedTransformer(null);
    setSelectedCoreNumber(0);
    setEnteredCoreId('');
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
              />
            )}
            {selectedCoreType === 'protection' && (
              <SecondaryProtectionReport
                transformer={selectedTransformer}
                coreId={enteredCoreId}
                testerName={userName || 'Unknown Tester'}
                onBack={handleBackFromReport}
                stage="secondary"
                accuracyClass={selectedAccuracyClass}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}


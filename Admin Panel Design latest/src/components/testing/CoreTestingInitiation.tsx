import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Zap, 
  Shield, 
  AlertTriangle,
  Printer,
  FileText,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { PrintableCoreLabels } from './PrintableCoreLabels';
import { ToroidalCoreTestingForm } from './ToroidalCoreTestingForm';
import { toast } from 'sonner@2.0.3';

interface CoreConfiguration {
  type: 'Metering' | 'PS' | 'Protection';
  quantity: number;
  coreIds: string[];
  tested: number;
}

interface Order {
  orderId: string;
  clientName: string;
  transformerName: string;
  quantity: number;
}

interface CoreTestingInitiationProps {
  order: Order;
  onBack: () => void;
}

export function CoreTestingInitiation({ order, onBack }: CoreTestingInitiationProps) {
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedCoreType, setSelectedCoreType] = useState<string | null>(null);
  const [showTestingForm, setShowTestingForm] = useState(false);
  const [selectedCoreId, setSelectedCoreId] = useState<string | null>(null);

  // Generate unique core IDs based on date and type
  const generateCoreId = (type: string, index: number): string => {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    
    const typeCode = type === 'Metering' ? 'MTR' : type === 'PS' ? 'PS' : 'PRT';
    const serialNumber = String(index + 1).padStart(3, '0');
    
    return `AE-${day}${month}${year}-${typeCode}-${serialNumber}`;
  };

  // Example configuration based on order
  // In real scenario, this would come from order details
  const coreConfigurations: CoreConfiguration[] = [
    {
      type: 'Metering',
      quantity: order.quantity, // 1 metering core per transformer
      coreIds: Array.from({ length: order.quantity }, (_, i) => generateCoreId('Metering', i)),
      tested: 0,
    },
    {
      type: 'PS',
      quantity: order.quantity * 2, // 2 PS cores per transformer
      coreIds: Array.from({ length: order.quantity * 2 }, (_, i) => generateCoreId('PS', i)),
      tested: 0,
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Metering':
        return Zap;
      case 'PS':
        return Shield;
      case 'Protection':
        return AlertTriangle;
      default:
        return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Metering':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'PS':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Protection':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handlePrintLabels = (coreType: string) => {
    setSelectedCoreType(coreType);
    setShowPrintDialog(true);
  };

  const handleStartTesting = (coreId: string, coreType: string) => {
    setSelectedCoreId(coreId);
    setSelectedCoreType(coreType);
    setShowTestingForm(true);
  };

  const handleTestingComplete = () => {
    toast.success('Core testing completed successfully!');
    setShowTestingForm(false);
    setSelectedCoreId(null);
    setSelectedCoreType(null);
  };

  if (showTestingForm && selectedCoreId && selectedCoreType) {
    return (
      <ToroidalCoreTestingForm
        coreId={selectedCoreId}
        coreType={selectedCoreType}
        orderId={order.orderId}
        clientName={order.clientName}
        onBack={() => {
          setShowTestingForm(false);
          setSelectedCoreId(null);
          setSelectedCoreType(null);
        }}
        onComplete={handleTestingComplete}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
          <h1 className="text-3xl text-[#003a70]">ADVENT ENGINEERS</h1>
          <p className="text-sm text-gray-600 mt-1">Core Testing Initiation</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Order ID</p>
            <p className="font-semibold font-mono">{order.orderId}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Client Name</p>
            <p className="font-semibold">{order.clientName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Transformer Quantity</p>
            <p className="font-semibold">{order.quantity}</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> Each transformer requires specific core types. The system has automatically generated unique IDs for each core based on your order configuration.
          </p>
        </div>
      </Card>

      {/* Core Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {coreConfigurations.map((config) => {
          const Icon = getTypeIcon(config.type);
          const colorClass = getTypeColor(config.type);

          return (
            <Card key={config.type} className={`p-6 border-2 ${colorClass}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-lg ${colorClass}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{config.type} Core Testing</h3>
                  <p className="text-sm text-gray-600">
                    Total Required: {config.quantity} cores
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div>
                    <p className="text-sm text-gray-600">Total Cores</p>
                    <p className="text-2xl font-bold">{config.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Tested</p>
                    <p className="text-2xl font-bold text-green-600">{config.tested}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-red-600">
                      {config.quantity - config.tested}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full transition-all flex items-center justify-end pr-2"
                    style={{ width: `${(config.tested / config.quantity) * 100}%` }}
                  >
                    {config.tested > 0 && (
                      <span className="text-xs text-white font-semibold">
                        {Math.round((config.tested / config.quantity) * 100)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => handlePrintLabels(config.type)}
                  >
                    <Printer className="w-4 h-4" />
                    Print IDs ({config.quantity})
                  </Button>
                  <Button
                    className="flex-1 gap-2 bg-[#003a70] hover:bg-[#002850]"
                    onClick={() => {
                      // Show list of core IDs for testing
                      const firstUntested = config.coreIds.find((_, index) => index >= config.tested);
                      if (firstUntested) {
                        handleStartTesting(firstUntested, config.type);
                      }
                    }}
                  >
                    <FileText className="w-4 h-4" />
                    Start Testing
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Core IDs Preview */}
                <div className="bg-white border rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-700 mb-2">
                    Generated Core IDs (Sample):
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {config.coreIds.slice(0, 10).map((coreId, index) => (
                      <div
                        key={coreId}
                        className="flex items-center justify-between text-xs font-mono bg-gray-50 p-2 rounded border hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleStartTesting(coreId, config.type)}
                      >
                        <span>{coreId}</span>
                        {index < config.tested ? (
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                        ) : (
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                    ))}
                  </div>
                  {config.coreIds.length > 10 && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      + {config.coreIds.length - 10} more core IDs
                    </p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Print Dialog */}
      {showPrintDialog && selectedCoreType && (
        <PrintableCoreLabels
          coreIds={
            coreConfigurations.find((c) => c.type === selectedCoreType)?.coreIds || []
          }
          coreType={selectedCoreType}
          orderId={order.orderId}
          clientName={order.clientName}
          onClose={() => {
            setShowPrintDialog(false);
            setSelectedCoreType(null);
          }}
        />
      )}

      {/* Back Button */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={onBack}>
          Back to Order Details
        </Button>
      </div>
    </div>
  );
}

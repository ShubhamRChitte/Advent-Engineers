import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  ArrowLeft,
  Zap,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { CoreTestingOrder } from './CoreTestingOrders';

interface CoreTypeSelectionProps {
  order: CoreTestingOrder;
  onSelectCoreType: (coreType: 'Metering' | 'PS' | 'Protection') => void;
  onBack: () => void;
}

export function CoreTypeSelection({ order, onSelectCoreType, onBack }: CoreTypeSelectionProps) {
  const getCoreTypeIcon = (type: string) => {
    switch (type) {
      case 'Metering':
        return <Zap className="w-5 h-5" />;
      case 'PS':
        return <Shield className="w-5 h-5" />;
      case 'Protection':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getCoreTypeColor = (type: string) => {
    switch (type) {
      case 'Metering':
        return {
          bg: 'bg-purple-50',
          text: 'text-purple-700',
          border: 'border-purple-200',
          button: 'bg-purple-600 hover:bg-purple-700',
        };
      case 'PS':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          button: 'bg-blue-600 hover:bg-blue-700',
        };
      case 'Protection':
        return {
          bg: 'bg-orange-50',
          text: 'text-orange-700',
          border: 'border-orange-200',
          button: 'bg-orange-600 hover:bg-orange-700',
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          border: 'border-gray-200',
          button: 'bg-gray-600 hover:bg-gray-700',
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <Button
          variant="outline"
          onClick={onBack}
          size="sm"
          className="mb-3 gap-1"
        >
          <ArrowLeft className="w-3 h-3" />
          Back
        </Button>
        <h2 className="text-xl">Select Test Type</h2>
        <p className="text-sm text-gray-600 mt-1">{order.jobId} - {order.clientName}</p>
      </div>

      {/* Order Summary */}
      <Card className="p-4">
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500">Transformer</p>
            <p className="text-gray-900 mt-0.5">{order.transformerName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Client</p>
            <p className="text-gray-900 mt-0.5">{order.clientName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Quantity</p>
            <p className="text-gray-900 mt-0.5">{order.quantity} units</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Deadline</p>
            <p className="text-gray-900 mt-0.5">{new Date(order.deadline).toLocaleDateString()}</p>
          </div>
        </div>
      </Card>

      {/* Core Type Selection */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {order.coreConfiguration.map((config, idx) => {
          const colors = getCoreTypeColor(config.type);
          return (
            <Card
              key={idx}
              className={`p-4 ${colors.bg} ${colors.border} border hover:shadow-md transition-shadow`}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={colors.text}>
                    {getCoreTypeIcon(config.type)}
                  </div>
                  <h3 className={`text-base font-medium ${colors.text}`}>{config.type}</h3>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cores to Test</span>
                    <span className="font-medium text-gray-900">{order.transformerQuantity} cores</span>
                  </div>
                </div>

                <Button
                  className={`w-full ${colors.button} text-white`}
                  size="sm"
                  onClick={() => onSelectCoreType(config.type)}
                >
                  Start Testing
                </Button>
              </div>
            </Card>
          );
        })}
      </div> */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
  {order.coreDetails?.map((core, idx) => {
    const colors = getCoreTypeColor(core.coreType);

    return (
      <Card
        key={idx}
        className={`p-4 ${colors.bg} ${colors.border} border hover:shadow-md transition-shadow`}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className={colors.text}>
              {getCoreTypeIcon(core.coreType)}
            </div>
            <h3 className={`text-base font-medium ${colors.text}`}>
              {core.coreType}
            </h3>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Cores to Test</span>
              <span className="font-medium text-gray-900">
                {order.quantity} cores
              </span>
            </div>
          </div>

          <Button
            className={`w-full ${colors.button} text-white`}
            size="sm"
            onClick={() => onSelectCoreType(core.coreType)}
          >
            Start Testing
          </Button>
        </div>
      </Card>
    );
  })}
</div>

      {/* Instructions */}
      {order.instructions && (
        <Card className="p-3 bg-blue-50 border-blue-200">
          <p className="text-xs text-gray-700">{order.instructions}</p>
        </Card>
      )}
    </div>
  );
}
import { CheckCircle, Circle, Clock, Package, Zap, Shield, Award, Truck } from 'lucide-react';
import { Badge } from '../ui/badge';

interface OrderStatusTrackerProps {
  currentStage: 'order-created' | 'core-testing' | 'secondary-testing' | 'after-primary-testing' | 'final-testing' | 'completed';
  orderDate: string;
  expectedCompletion?: string | undefined;
  orderId: string;
  compact?: boolean | undefined;
  transformerType?: string | undefined;
  status?: string | undefined;
}

export function OrderStatusTracker({
  currentStage,
  orderDate,
  expectedCompletion,
  orderId,
  compact = false,
  transformerType = 'CT',
  status
}: OrderStatusTrackerProps) {
  const ctStages = [
    {
      id: 'created',
      label: 'Order Created',
      icon: Package,
      color: 'blue',
      description: 'Order registered in system'
    },
    {
      id: 'core',
      label: 'Core Testing',
      icon: Zap,
      color: 'purple',
      description: 'Core winding tests in progress'
    },
    {
      id: 'secondary',
      label: 'Secondary Testing',
      icon: Shield,
      color: 'indigo',
      description: 'Secondary winding verification'
    },
    {
      id: 'primary',
      label: 'After Primary Testing',
      icon: Clock,
      color: 'orange',
      description: 'Primary side testing'
    },
    {
      id: 'heating',
      label: 'After Heating Testing',
      icon: Zap,
      color: 'red',
      description: 'Oven heating process'
    },
    {
      id: 'final',
      label: 'Final Testing',
      icon: Award,
      color: 'amber',
      description: 'Final quality checks'
    },
    {
      id: 'completed',
      label: 'Completed',
      icon: Truck,
      color: 'green',
      description: 'Ready for delivery'
    },
  ];

  const ptStages = [
    {
      id: 'order-created',
      label: 'Order Created',
      icon: Package,
      color: 'blue',
      description: 'Order registered in system'
    },
    {
      id: 'pt',
      label: 'PT Testing',
      icon: Zap,
      color: 'purple',
      description: 'Pre-Test and Final-Test'
    },
    {
      id: 'completed',
      label: 'Completed',
      icon: CheckCircle,
      color: 'green',
      description: 'Ready for delivery'
    }
  ];

  const stages = (transformerType || '').toUpperCase() === 'PT' ? ptStages : ctStages;

  // Improved mapping function to handle backend vs frontend stage names
  const getStageIndex = () => {
    // 1. Direct match
    let idx = stages.findIndex((stage: any) => stage.id === currentStage);
    if (idx !== -1) return idx;

    // 2. Handle specific backend names mapping to UI
    const mapping: Record<string, string> = {
        'core': 'core',
        'secondary': 'secondary',
        'primary': 'primary',
        'heating': 'heating',
        'final': 'final',
        'shipped': 'completed',
        'completed': 'completed'
    };
    
    const mappedId = mapping[currentStage as string];
    if (mappedId) {
        idx = stages.findIndex((stage: any) => stage.id === mappedId);
        if (idx !== -1) return idx;
    }

    // 3. Fallback based on Status String (Only if it strictly means Order is Finished)
    if (status === 'Completed' || status === 'Shipped') {
      return stages.length - 1;
    }

    return 0; // Default to first stage
  };

  const currentStageIndex = getStageIndex();

  const getStageStatus = (index: number) => {
    if (index < currentStageIndex) return 'completed';
    if (index === currentStageIndex) return 'current';
    return 'pending';
  };

  if (compact) {
    return (
      <div className="relative">
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-4">
          {stages.map((stage, index) => {
            const status = getStageStatus(index);
            const Icon = stage.icon;
            const isLast = index === stages.length - 1;

            return (
              <div key={stage.id} className="flex items-center flex-1">
                {/* Stage Node */}
                <div className="relative flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${status === 'completed'
                        ? 'bg-green-500 border-green-500'
                        : status === 'current'
                          ? 'bg-blue-500 border-blue-500 animate-pulse'
                          : 'bg-gray-200 border-gray-300'
                      }`}
                  >
                    {status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : status === 'current' ? (
                      <Icon className="w-5 h-5 text-white" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Connector Line */}
                {!isLast && (
                  <div className="flex-1 h-0.5 mx-2">
                    <div
                      className={`h-full transition-all ${index < currentStageIndex ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Stage Labels */}
        <div className="flex items-center justify-between">
          {stages.map((stage, index) => {
            const status = getStageStatus(index);
            return (
              <div key={stage.id} className="flex-1 text-center">
                <p
                  className={`text-xs ${status === 'completed' || status === 'current'
                      ? 'text-gray-900 font-medium'
                      : 'text-gray-500'
                    }`}
                >
                  {stage.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-gray-900">Order ID: {orderId}</h3>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500">Order Date</p>
            <Badge className="bg-blue-600 text-white mt-1">{orderDate}</Badge>
          </div>
          {expectedCompletion && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Expected Completion</p>
              <Badge className="bg-green-600 text-white mt-1">{expectedCompletion}</Badge>
            </div>
          )}
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="relative">
        <div className="flex items-start justify-between">
          {stages.map((stage, index) => {
            const status = getStageStatus(index);
            const Icon = stage.icon;
            const isLast = index === stages.length - 1;

            return (
              <div key={stage.id} className="flex items-start flex-1">
                {/* Stage */}
                <div className="flex flex-col items-center flex-1">
                  {/* Node */}
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all shadow-lg ${status === 'completed'
                        ? 'bg-green-500 border-green-500'
                        : status === 'current'
                          ? 'bg-blue-500 border-blue-500 ring-4 ring-blue-200 animate-pulse'
                          : 'bg-white border-gray-300'
                      }`}
                  >
                    {status === 'completed' ? (
                      <CheckCircle className="w-8 h-8 text-white" />
                    ) : status === 'current' ? (
                      <Icon className="w-8 h-8 text-white" />
                    ) : (
                      <Icon className="w-8 h-8 text-gray-400" />
                    )}
                  </div>

                  {/* Label */}
                  <div className="mt-3 text-center">
                    <p
                      className={`text-sm font-medium ${status === 'completed' || status === 'current'
                          ? 'text-gray-900'
                          : 'text-gray-500'
                        }`}
                    >
                      {stage.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{stage.description}</p>
                    {status === 'current' && (
                      <Badge className="bg-blue-600 text-white mt-2">
                        In Progress
                      </Badge>
                    )}
                    {status === 'completed' && (
                      <Badge className="bg-green-600 text-white mt-2">
                        Completed
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Connector Line */}
                {!isLast && (
                  <div className="flex items-center justify-center" style={{ marginTop: '28px', flex: '0 0 40px' }}>
                    <div
                      className={`h-1 w-full transition-all ${index < currentStageIndex ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Status Description */}
      <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Current Status</p>
            <p className="text-sm text-gray-600 mt-1">
              {stages[currentStageIndex]?.label} - {stages[currentStageIndex]?.description}
            </p>
            <div className="flex gap-2 mt-2">
              <Badge className="bg-gray-100 text-gray-700">
                {currentStageIndex + 1} of {stages.length} stages
              </Badge>
              <Badge className="bg-blue-100 text-blue-700">
                {Math.round(((currentStageIndex + 1) / stages.length) * 100)}% Complete
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, PlayCircle } from 'lucide-react';
import { AfterPrimaryTransformer } from './AfterPrimaryTransformersList';

interface Order {
  jobId: string;
  client: string;
  transformerCount: number;
  assignedDate: string;
  status: string;
  priority: string;
}

interface CoreConfig {
  coreNumber: number;
  coreType: 'metering' | 'ps' | 'protection';
  coreId: string;
}

interface AfterPrimaryCoreSelectionProps {
  transformer: AfterPrimaryTransformer;
  order: Order;
  onSelectCore: (core: CoreConfig) => void;
  onBack: () => void;
}

export function AfterPrimaryCoreSelection({
  transformer,
  order,
  onSelectCore,
  onBack,
}: AfterPrimaryCoreSelectionProps) {
  const getCoreTypeColor = (type: string) => {
    switch (type) {
      case 'metering': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'ps': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'protection': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getCoreTypeLabel = (type: string) => {
    switch (type) {
      case 'metering': return 'Metering Core';
      case 'ps': return 'PS Core';
      case 'protection': return 'Protection Core';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Transformers
        </Button>
      </div>

      <div>
        <h2>Select Core for Testing</h2>
        <p className="text-gray-500 mt-1">Choose a core to begin after primary testing</p>
      </div>

      {/* Transformer Info */}
      <Card className="p-4 bg-gray-50 border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Job ID</p>
            <p className="font-medium mt-1">{order.jobId}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Transformer</p>
            <p className="font-medium mt-1">{transformer.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Rating</p>
            <p className="font-medium mt-1">{transformer.rating}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Unique ID</p>
            <p className="font-medium mt-1">{transformer.uniqueId}</p>
          </div>
        </div>
      </Card>

      {/* Cores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {transformer.cores.map((core) => (
          <Card
            key={core.coreNumber}
            className={`p-6 hover:shadow-lg transition-all cursor-pointer border-2 ${getCoreTypeColor(core.coreType)}`}
            onClick={() => onSelectCore(core)}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Core Number</p>
                <h3 className="mt-1">{core.coreNumber}</h3>
              </div>
              <Badge className={getCoreTypeColor(core.coreType)}>
                {core.coreType.toUpperCase()}
              </Badge>
            </div>

            <div className="space-y-2 mb-4">
              <div>
                <p className="text-sm text-gray-600">Core Type</p>
                <p className="font-medium">{getCoreTypeLabel(core.coreType)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Core ID (from Secondary)</p>
                <p className="font-medium text-blue-600">{core.coreId}</p>
              </div>
            </div>

            <Button
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={(e) => {
                e.stopPropagation();
                onSelectCore(core);
              }}
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              Start Test
            </Button>
          </Card>
        ))}
      </div>

      {/* Info Box */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white">i</span>
          </div>
          <div>
            <h4 className="mb-1">Auto-Loaded Core Information</h4>
            <p className="text-sm text-gray-700">
              All core IDs shown above were automatically loaded from the Secondary Test data. 
              When you select a core, the appropriate report template will open with the core information pre-filled.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

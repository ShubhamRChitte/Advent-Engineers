import { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ArrowLeft, PlayCircle } from 'lucide-react';

interface CoreConfig {
  coreNumber: number;
  coreType: 'metering' | 'ps' | 'protection';
}

export interface Transformer {
  id: string;
  name: string;
  rating: string;
  uniqueId: string;
  voltageClass: string;
  cores: CoreConfig[];
  status: 'pending' | 'in-progress' | 'completed';
}

interface Order {
  jobId: string;
  client: string;
  transformerCount: number;
  assignedDate: string;
  status: string;
  priority: string;
}

interface SecondaryTransformersListProps {
  order: Order;
  onStartTest: (transformer: Transformer) => void;
  onBack: () => void;
}

export function SecondaryTransformersList({ order, onStartTest, onBack }: SecondaryTransformersListProps) {
  // Mock transformer data - in real app, this would be fetched based on order
  const [transformers] = useState<Transformer[]>([
    {
      id: 'T1',
      name: '33 KV CT',
      rating: '800-400-200/1-1-1A, 30VA',
      uniqueId: 'TR-2025-001',
      voltageClass: '33kV',
      cores: [
        { coreNumber: 1, coreType: 'metering' },
        { coreNumber: 2, coreType: 'metering' },
        { coreNumber: 3, coreType: 'metering' },
      ],
      status: 'pending',
    },
    {
      id: 'T2',
      name: '33 KV CT',
      rating: '800-400-200/1-1-1A, 30VA',
      uniqueId: 'TR-2025-002',
      voltageClass: '33kV',
      cores: [
        { coreNumber: 1, coreType: 'ps' },
        { coreNumber: 2, coreType: 'ps' },
        { coreNumber: 3, coreType: 'ps' },
      ],
      status: 'pending',
    },
    {
      id: 'T3',
      name: '33 KV CT',
      rating: '800-400-200/1-1-1A, 30VA',
      uniqueId: 'TR-2025-003',
      voltageClass: '33kV',
      cores: [
        { coreNumber: 1, coreType: 'protection' },
        { coreNumber: 2, coreType: 'protection' },
        { coreNumber: 3, coreType: 'protection' },
      ],
      status: 'in-progress',
    },
    {
      id: 'T4',
      name: '33 KV CT',
      rating: '800-400-200/1-1-1A, 30VA',
      uniqueId: 'TR-2025-004',
      voltageClass: '33kV',
      cores: [
        { coreNumber: 1, coreType: 'metering' },
        { coreNumber: 2, coreType: 'ps' },
        { coreNumber: 3, coreType: 'protection' },
      ],
      status: 'pending',
    },
    {
      id: 'T5',
      name: '33 KV CT',
      rating: '800-400-200/1-1-1A, 30VA',
      uniqueId: 'TR-2025-005',
      voltageClass: '33kV',
      cores: [
        { coreNumber: 1, coreType: 'metering' },
        { coreNumber: 2, coreType: 'metering' },
      ],
      status: 'completed',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-700';
      case 'in-progress': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCoreTypeLabel = (type: string) => {
    switch (type) {
      case 'metering': return 'Metering';
      case 'ps': return 'PS';
      case 'protection': return 'Protection';
      default: return type;
    }
  };

  const getCoreTypeColor = (type: string) => {
    switch (type) {
      case 'metering': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ps': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'protection': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Button>
      </div>

      <div>
        <h2>Transformers for {order.jobId}</h2>
        <p className="text-gray-500 mt-1">Select a transformer to begin secondary testing</p>
      </div>

      {/* Order Info Card */}
      <Card className="p-4 bg-gray-50 border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Job ID</p>
            <p className="font-medium mt-1">{order.jobId}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Client</p>
            <p className="font-medium mt-1">{order.client}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Transformers</p>
            <p className="font-medium mt-1">{order.transformerCount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Assigned Date</p>
            <p className="font-medium mt-1">{new Date(order.assignedDate).toLocaleDateString()}</p>
          </div>
        </div>
      </Card>

      {/* Transformers Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 text-sm">Transformer Name</th>
                <th className="text-left p-4 text-sm">Rating</th>
                <th className="text-left p-4 text-sm">Unique ID</th>
                <th className="text-left p-4 text-sm">Core Configuration</th>
                <th className="text-left p-4 text-sm">Status</th>
                <th className="text-center p-4 text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {transformers.map((transformer) => (
                <tr key={transformer.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-medium">{transformer.name}</td>
                  <td className="p-4">{transformer.rating}</td>
                  <td className="p-4">{transformer.uniqueId}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {transformer.cores.map((core) => (
                        <Badge
                          key={core.coreNumber}
                          className={`${getCoreTypeColor(core.coreType)} text-xs`}
                        >
                          Core {core.coreNumber}: {getCoreTypeLabel(core.coreType)}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge className={getStatusColor(transformer.status)}>
                      {transformer.status.replace('-', ' ')}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center">
                      <Button
                        size="sm"
                        onClick={() => onStartTest(transformer)}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={transformer.status === 'completed'}
                      >
                        <PlayCircle className="w-4 h-4 mr-2" />
                        {transformer.status === 'pending' ? 'Start Test' : 
                         transformer.status === 'in-progress' ? 'Continue Test' : 
                         'View Report'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Info Box */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white">i</span>
          </div>
          <div>
            <h4 className="mb-1">Testing Instructions</h4>
            <p className="text-sm text-gray-700">
              Each transformer has a specific core configuration defined during order entry. 
              The system will automatically route you to the appropriate report (Metering, PS, or Protection) 
              based on the core type you select.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ArrowLeft, PlayCircle } from 'lucide-react';

// Core configuration from Secondary Test
interface CoreConfig {
  coreNumber: number;
  coreType: 'metering' | 'ps' | 'protection';
  coreId: string; // Core number from Secondary Test (e.g., M-2082, PS-1660)
}

export interface AfterPrimaryTransformer {
  id: string;
  name: string;
  rating: string;
  uniqueId: string;
  voltageClass: string;
  bsat: string;
  vaRating: string;
  classRating: string;
  stc: string;
  cores: CoreConfig[]; // Auto-loaded from Secondary Test
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

interface AfterPrimaryTransformersListProps {
  order: Order;
  onStartTest: (transformer: AfterPrimaryTransformer) => void;
  onBack: () => void;
}

export function AfterPrimaryTransformersList({ order, onStartTest, onBack }: AfterPrimaryTransformersListProps) {
  // Mock transformer data with auto-loaded core info from Secondary Test
  const [transformers] = useState<AfterPrimaryTransformer[]>([
    {
      id: 'T1',
      name: '33 KV CT',
      rating: '800-400-200/1-1-1A',
      uniqueId: 'TR-2026-001',
      voltageClass: '33kV',
      bsat: '800-400-200/1-1-1',
      vaRating: '00/30/30',
      classRating: 'PS/0.2s/5P20',
      stc: 'Job No.',
      cores: [
        { coreNumber: 1, coreType: 'metering', coreId: 'M-2082' },
        { coreNumber: 2, coreType: 'metering', coreId: 'M-2083' },
        { coreNumber: 3, coreType: 'metering', coreId: 'M-2084' },
      ],
      status: 'pending',
    },
    {
      id: 'T2',
      name: '33 KV CT',
      rating: '800-400-200/1-1-1A',
      uniqueId: 'TR-2026-002',
      voltageClass: '33kV',
      bsat: '800-400-200/1-1-1',
      vaRating: '00/30/30',
      classRating: 'PS/0.2s/5P20',
      stc: 'Job No.',
      cores: [
        { coreNumber: 1, coreType: 'ps', coreId: 'PS-1660' },
        { coreNumber: 2, coreType: 'ps', coreId: 'PS-1661' },
        { coreNumber: 3, coreType: 'ps', coreId: 'PS-1662' },
      ],
      status: 'pending',
    },
    {
      id: 'T3',
      name: '33 KV CT',
      rating: '800-400-200/1-1-1A',
      uniqueId: 'TR-2026-003',
      voltageClass: '33kV',
      bsat: '800-400-200/1-1-1',
      vaRating: '00/30/30',
      classRating: 'PS/0.2s/5P20',
      stc: 'Job No.',
      cores: [
        { coreNumber: 1, coreType: 'protection', coreId: 'PR-2001' },
        { coreNumber: 2, coreType: 'protection', coreId: 'PR-2002' },
        { coreNumber: 3, coreType: 'protection', coreId: 'PR-2003' },
      ],
      status: 'in-progress',
    },
    {
      id: 'T4',
      name: '33 KV CT',
      rating: '800-400-200/1-1-1A',
      uniqueId: 'TR-2026-004',
      voltageClass: '33kV',
      bsat: '800-400-200/1-1-1',
      vaRating: '00/30/30',
      classRating: 'PS/0.2s/5P20',
      stc: 'Job No.',
      cores: [
        { coreNumber: 1, coreType: 'metering', coreId: 'M-2085' },
        { coreNumber: 2, coreType: 'ps', coreId: 'PS-1663' },
        { coreNumber: 3, coreType: 'protection', coreId: 'PR-2004' },
      ],
      status: 'pending',
    },
    {
      id: 'T5',
      name: '33 KV CT',
      rating: '800-400-200/1-1-1A',
      uniqueId: 'TR-2026-005',
      voltageClass: '33kV',
      bsat: '800-400-200/1-1-1',
      vaRating: '00/30/30',
      classRating: 'PS/0.2s/5P20',
      stc: 'Job No.',
      cores: [
        { coreNumber: 1, coreType: 'metering', coreId: 'M-2086' },
        { coreNumber: 2, coreType: 'metering', coreId: 'M-2087' },
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
      case 'metering': return 'M';
      case 'ps': return 'PS';
      case 'protection': return 'P';
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
        <p className="text-gray-500 mt-1">Select a transformer to begin after primary testing</p>
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
                <th className="text-left p-4 text-sm">Core Details (from Secondary)</th>
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
                          {getCoreTypeLabel(core.coreType)}-{core.coreId}
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
            <h4 className="mb-1">Auto-Loaded Core Information</h4>
            <p className="text-sm text-gray-700">
              All core configurations and core numbers shown above were automatically loaded from the Secondary Test data.
              When you start testing, the report will open with this information pre-filled. You only need to enter the
              actual test measurement values.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

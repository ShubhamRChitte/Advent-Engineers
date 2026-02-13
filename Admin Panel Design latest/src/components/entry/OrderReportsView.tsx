import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Zap,
  Shield,
  Award,
  ChevronRight,
  Box
} from 'lucide-react';
import { TestReportModal } from '../common/TestReportModal';

interface Order {
  id: string;
  orderId: string;
  transformerName: string;
  transformerType: string;
  quantity: number;
  orderDate: string;
  testStatus: string;
  testingStage: string;
  completedTests: number;
  totalTests: number;
}

interface Transformer {
  _id: string;
  uniqueId: string;
  serialNumber?: string;
  status: string; // Global status or stage-specific?
  currentStage: string;
  testHistory?: {
    core_test?: { status: string; timestamp: string; tester: string };
    secondary_test?: { status: string; timestamp: string; tester: string };
    primary_test?: { status: string; timestamp: string; tester: string };
    final_test?: { status: string; timestamp: string; tester: string };
  };
}

interface OrderReportsViewProps {
  order: Order;
  clientName: string;
  onBack: () => void;
}

export function OrderReportsView({ order, clientName, onBack }: OrderReportsViewProps) {
  const [transformers, setTransformers] = useState<Transformer[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedTransformer, setSelectedTransformer] = useState<Transformer | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTestType, setSelectedTestType] = useState<'core' | 'secondary' | 'primary' | 'final'>('core');

  useEffect(() => {
    const fetchTransformers = async () => {
      try {
        // Fetch transformers for this order
        // Ensure we use the correct ID field. 'order.id' from props might be _id.
        const response = await fetch(`http://localhost:3002/api/orders/${order.id}/transformers`);
        const data = await response.json();

        if (Array.isArray(data)) {
          setTransformers(data);
        }
      } catch (error) {
        console.error("Error fetching transformers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransformers();
  }, [order.id]);

  const handleOpenReport = (transformer: Transformer, type: 'core' | 'secondary' | 'primary' | 'final') => {
    setSelectedTransformer(transformer);
    setSelectedTestType(type);
    setModalOpen(true);
  };

  const getStatusColor = (status?: string) => {
    // Status in testHistory is usually 'Completed'
    if (status === 'Completed' || status === 'Pass') return 'bg-green-100 text-green-700 border-green-300';
    if (status === 'In Progress') return 'bg-blue-100 text-blue-700 border-blue-300';
    if (status === 'Failed') return 'bg-red-100 text-red-700 border-red-300';
    return 'bg-gray-100 text-gray-500 border-gray-200'; // Pending or unknown
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <button onClick={onBack} className="hover:text-blue-600 transition-colors">
          {clientName}
        </button>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">{order.orderId}</span>
      </div>

      {/* Header with Back Button */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Orders
            </Button>
          </div>
          <h2>Transformer Reports - {order.orderId}</h2>
          <p className="text-gray-500 mt-1">{order.transformerName} ({order.quantity} units)</p>
        </div>
      </div>

      {/* Transformers List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10">Loading transformers...</div>
        ) : transformers.length === 0 ? (
          <Card className="p-12">
            <div className="text-center text-gray-500">
              <Box className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No transformers found for this order.</p>
            </div>
          </Card>
        ) : (
          transformers.map((transformer) => (
            <Card key={transformer._id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                {/* Transformer Info */}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Box className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{transformer.uniqueId}</h3>
                    <p className="text-sm text-gray-500">Serial: {transformer.serialNumber || 'N/A'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="bg-gray-50">
                        {transformer.currentStage || 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Report Status Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1 max-w-3xl">
                  {/* Core Test */}
                  <div className="border rounded-lg p-3 bg-gray-50/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Core
                      </span>
                      <Badge className={`text-[10px] px-1.5 py-0 h-5 ${getStatusColor(transformer.testHistory?.core_test?.status)}`}>
                        {transformer.testHistory?.core_test?.status === 'Completed' ? <CheckCircle className="w-3 h-3" /> : 'Pending'}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-7 text-xs bg-white"
                      disabled={!transformer.testHistory?.core_test || transformer.testHistory.core_test.status !== 'Completed'}
                      onClick={() => handleOpenReport(transformer, 'core')}
                    >
                      View Report
                    </Button>
                  </div>

                  {/* Secondary Test */}
                  <div className="border rounded-lg p-3 bg-gray-50/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Secondary
                      </span>
                      <Badge className={`text-[10px] px-1.5 py-0 h-5 ${getStatusColor(transformer.testHistory?.secondary_test?.status)}`}>
                        {transformer.testHistory?.secondary_test?.status === 'Completed' ? <CheckCircle className="w-3 h-3" /> : 'Pending'}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-7 text-xs bg-white"
                      disabled={!transformer.testHistory?.secondary_test || transformer.testHistory.secondary_test.status !== 'Completed'}
                      onClick={() => handleOpenReport(transformer, 'secondary')}
                    >
                      View Report
                    </Button>
                  </div>

                  {/* After Primary Test */}
                  <div className="border rounded-lg p-3 bg-gray-50/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Primary
                      </span>
                      <Badge className={`text-[10px] px-1.5 py-0 h-5 ${getStatusColor(transformer.testHistory?.primary_test?.status)}`}>
                        {transformer.testHistory?.primary_test?.status === 'Completed' ? <CheckCircle className="w-3 h-3" /> : 'Pending'}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-7 text-xs bg-white"
                      disabled={!transformer.testHistory?.primary_test || transformer.testHistory.primary_test.status !== 'Completed'}
                      onClick={() => handleOpenReport(transformer, 'primary')}
                    >
                      View Report
                    </Button>
                  </div>

                  {/* Final Test */}
                  <div className="border rounded-lg p-3 bg-gray-50/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                        <Award className="w-3 h-3" /> Final
                      </span>
                      <Badge className={`text-[10px] px-1.5 py-0 h-5 ${getStatusColor(transformer.testHistory?.final_test?.status)}`}>
                        {transformer.testHistory?.final_test?.status === 'Completed' ? <CheckCircle className="w-3 h-3" /> : 'Pending'}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-7 text-xs bg-white"
                      disabled={!transformer.testHistory?.final_test || transformer.testHistory.final_test.status !== 'Completed'}
                      onClick={() => handleOpenReport(transformer, 'final')}
                    >
                      View Report
                    </Button>
                  </div>

                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Report Modal */}
      {selectedTransformer && (
        <TestReportModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          transformer={{
            ...selectedTransformer,
            orderId: { _id: order.id } // Pass mock orderId object if needed by Core fetcher logic in modal
          }}
          testType={selectedTestType}
        />
      )}
    </div>
  );
}

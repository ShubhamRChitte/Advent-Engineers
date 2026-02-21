import { useState, useEffect } from 'react';
import axios from 'axios';
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
  Box,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  Download,
  Search
} from 'lucide-react';
import { TestReportModal } from '../common/TestReportModal';
import { Input } from '../ui/input';

interface TransformerUnit {
  id: string;
  transformerId: string;
  coreTestStatus: 'Complete' | 'Pending' | 'In Progress' | 'Rejected';
  secondaryTestStatus: 'Complete' | 'Pending' | 'In Progress' | 'Rejected';
  primaryTestStatus: 'Complete' | 'Pending' | 'In Progress' | 'Rejected';
  finalTestStatus: 'Complete' | 'Pending' | 'In Progress' | 'Rejected';
  reportStatus: 'Open' | 'In Progress' | 'Pending';
  raw: any;
}

interface OrderReportsViewProps {
  order: any;
  clientName: string;
  onBack: () => void;
}

export function OrderReportsView({ order, clientName, onBack }: OrderReportsViewProps) {
  const [transformerUnits, setTransformerUnits] = useState<TransformerUnit[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedTransformer, setSelectedTransformer] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTestType, setSelectedTestType] = useState<'core' | 'secondary' | 'primary' | 'final'>('core');

  useEffect(() => {
    const fetchTransformers = async () => {
      try {
        console.log("Fetching transformers for order:", order.id, order.orderId);
        // Use the same endpoint as OrderDetailView
        // Note: order.id is used here. Ensure it's the correct ID (ObjectId).
        const response = await axios.get(`http://localhost:3002/api/transformers/order/${order.id}`, {
          withCredentials: true
        });

        // Define the progression of stages
        const stageOrder = ['core', 'secondary', 'primary', 'final', 'completed', 'shipped'];

        const getStatusForStage = (targetStage: string, currentStage: string, historyStatus?: string) => {
          // 1. Explicit History Check
          if (historyStatus === 'Rejected') return 'Rejected';
          if (historyStatus === 'Completed') return 'Complete';

          // Legacy/Alternative status check
          if (historyStatus === 'Pass') return 'Complete';
          if (historyStatus === 'Fail') return 'Rejected';

          // 2. Stage Progression Check
          const targetIndex = stageOrder.indexOf(targetStage);
          const currentIndex = stageOrder.indexOf(currentStage);

          if (targetIndex === -1 || currentIndex === -1) return 'Pending'; // Safety fallback

          if (currentIndex > targetIndex) {
            return 'Complete'; // If we are passed this stage, it's done
          }
          if (currentIndex === targetIndex) {
            // If we are IN this stage, it's In Progress
            return 'In Progress';
          }

          return 'Pending'; // Not reached yet
        };

        const mappedUnits: TransformerUnit[] = response.data.map((t: any) => ({
          id: t._id,
          // Use the uniqueId from DB (TR-JOB-...), fallback to constructing it if missing
          transformerId: t.uniqueId || `TR-${t.jobId || 'UNKNOWN'}-${String(t.internalCoreNo || '').split('-').pop() || '???'}`,
          coreTestStatus: getStatusForStage('core', t.currentStage, t.testHistory?.core_test?.status),
          secondaryTestStatus: getStatusForStage('secondary', t.currentStage, t.testHistory?.secondary_test?.status),
          primaryTestStatus: getStatusForStage('primary', t.currentStage, t.testHistory?.primary_test?.status),
          finalTestStatus: getStatusForStage('final', t.currentStage, t.testHistory?.final_test?.status),
          reportStatus: (t.currentStage === 'completed' || t.currentStage === 'shipped') ? 'Open' : 'Pending',
          raw: t
        }));

        setTransformerUnits(mappedUnits);
      } catch (error: any) {
        console.error("Error fetching transformers:", error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          alert("Session expired or unauthorized. Please log in again.");
          // Optional: window.location.href = '/login'; 
        } else {
          // Fallback on other errors
          console.warn("API Request failed. Using STATIC MOCK DATA as fallback.");
          // setTransformerUnits(MOCK_TRANSFORMERS); // If we had mock data adapted for this
        }
      } finally {
        setLoading(false);
      }
    };

    if (order.id) {
      fetchTransformers();
    }
  }, [order.id]);

  const handleOpenReport = (transformer: Transformer, type: 'core' | 'secondary' | 'primary' | 'final') => {
    setSelectedTransformer(transformer);
    setSelectedTestType(type);
    setModalOpen(true);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Completed':
      case 'Complete':
      case 'Pass':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'Pending':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'In Progress':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Rejected':
      case 'Fail':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'Open':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'Completed':
      case 'Complete':
      case 'Pass':
        return <CheckCircle2 className="w-3 h-3" />;
      case 'Pending':
        return <Clock className="w-3 h-3" />;
      case 'In Progress':
        return <AlertCircle className="w-3 h-3" />;
      case 'Rejected':
      case 'Fail':
        return <XCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };



  const handleDownloadFullReport = (transformerId: string) => {
    alert(`Downloading complete report for ${transformerId}`);
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
      {/* Transformers Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="text-left p-4 font-medium text-gray-700">Transformer Id ⬆</th>
                <th className="text-center p-4 font-medium text-gray-700">Core Testing</th>
                <th className="text-center p-4 font-medium text-gray-700">After Secondary Testing</th>
                <th className="text-center p-4 font-medium text-gray-700">After Primary Testing</th>
                <th className="text-center p-4 font-medium text-gray-700">Final Testing</th>
                <th className="text-center p-4 font-medium text-gray-700">Report</th>
              </tr>
            </thead>
            <tbody>
              {transformerUnits.map((unit, index) => {
                // Check if all tests are complete for Report generation logic
                const allComplete =
                  unit.coreTestStatus === 'Complete' &&
                  unit.secondaryTestStatus === 'Complete' &&
                  unit.primaryTestStatus === 'Complete' &&
                  unit.finalTestStatus === 'Complete';

                return (
                  <tr
                    key={unit.id}
                    className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  >
                    {/* Transformer ID */}
                    <td className="p-4">
                      <p className="font-medium font-mono">{unit.transformerId}</p>
                    </td>

                    {/* Core Test */}
                    <td className="p-4">
                      <div className="flex flex-col items-center gap-2">
                        <Badge className={`${getStatusColor(unit.coreTestStatus)} flex items-center gap-1`}>
                          {getStatusIcon(unit.coreTestStatus)}
                          {unit.coreTestStatus}
                        </Badge>
                        {unit.coreTestStatus === 'Complete' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 gap-1"
                            onClick={() => handleOpenReport(unit.raw, 'core')}
                          >
                            <FileText className="w-3 h-3" />
                            View Report
                          </Button>
                        )}
                      </div>
                    </td>

                    {/* After Secondary Test */}
                    <td className="p-4">
                      <div className="flex flex-col items-center gap-2">
                        <Badge className={`${getStatusColor(unit.secondaryTestStatus)} flex items-center gap-1`}>
                          {getStatusIcon(unit.secondaryTestStatus)}
                          {unit.secondaryTestStatus}
                        </Badge>
                        {unit.secondaryTestStatus === 'Complete' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 gap-1"
                            onClick={() => handleOpenReport(unit.raw, 'secondary')}
                          >
                            <FileText className="w-3 h-3" />
                            View Report
                          </Button>
                        )}
                      </div>
                    </td>

                    {/* After Primary Test */}
                    <td className="p-4">
                      <div className="flex flex-col items-center gap-2">
                        <Badge className={`${getStatusColor(unit.primaryTestStatus)} flex items-center gap-1`}>
                          {getStatusIcon(unit.primaryTestStatus)}
                          {unit.primaryTestStatus}
                        </Badge>
                        {unit.primaryTestStatus === 'Complete' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 gap-1"
                            onClick={() => handleOpenReport(unit.raw, 'primary')}
                          >
                            <FileText className="w-3 h-3" />
                            View Report
                          </Button>
                        )}
                      </div>
                    </td>

                    {/* Final Test */}
                    <td className="p-4">
                      <div className="flex flex-col items-center gap-2">
                        <Badge className={`${getStatusColor(unit.finalTestStatus)} flex items-center gap-1`}>
                          {getStatusIcon(unit.finalTestStatus)}
                          {unit.finalTestStatus}
                        </Badge>
                        {unit.finalTestStatus === 'Complete' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 gap-1"
                            onClick={() => handleOpenReport(unit.raw, 'final')}
                          >
                            <FileText className="w-3 h-3" />
                            View Report
                          </Button>
                        )}
                      </div>
                    </td>

                    {/* Report Status & Full Report */}
                    <td className="p-4">
                      <div className="flex flex-col items-center gap-2">
                        <Badge className={`${getStatusColor(unit.reportStatus)} flex items-center gap-1`}>
                          {unit.reportStatus}
                        </Badge>
                        {allComplete && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-xs h-8 gap-1"
                            onClick={() => handleDownloadFullReport(unit.transformerId)}
                          >
                            <Download className="w-3 h-3" />
                            Download Full Report
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {transformerUnits.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No transformers found for this order.</p>
          </div>
        )}
      </Card>

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

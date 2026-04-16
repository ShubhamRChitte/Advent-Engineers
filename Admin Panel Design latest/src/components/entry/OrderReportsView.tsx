import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  ArrowLeft,
  Clock,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  Download,
  Search
} from 'lucide-react';
import { Input } from '../ui/input';

interface TransformerUnit {
  id: string;
  transformerId: string;
  coreTestStatus: 'Complete' | 'Pending' | 'In Progress' | 'Rejected';
  secondaryTestStatus: 'Complete' | 'Pending' | 'In Progress' | 'Rejected';
  primaryTestStatus: 'Complete' | 'Pending' | 'In Progress' | 'Rejected';
  heatingStatus: 'Complete' | 'Pending' | 'In Progress' | 'Rejected';
  finalTestStatus: 'Complete' | 'Pending' | 'In Progress' | 'Rejected';
  ptTestStatus?: 'Complete' | 'Pending' | 'In Progress' | 'Rejected';
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

  const isPTOrder = (t?: any) => {
    const rawType = String(t?.transformerType || t?.type || order?.transformerType || '').toLowerCase();
    return rawType === 'pt' || rawType.includes('potential');
  };

  useEffect(() => {
    const fetchTransformers = async () => {
      try {
        console.log("Fetching transformers for order:", order.id, order.orderId);
        // Use the same endpoint as OrderDetailView
        // Note: order.id is used here. Ensure it's the correct ID (ObjectId).
        const response = await axios.get(`http://localhost:5000/api/transformers/order/${order.id}`, {
          withCredentials: true
        });

        // Define the progression of stages
        const stageOrder = ['core', 'secondary', 'primary', 'heating', 'final', 'completed', 'shipped'];

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

        const mappedUnits: TransformerUnit[] = response.data.map((t: any) => {
          // Heating Logic
          const hasHeating = t.processHistory?.heatingRecord?.length > 0;
          const heatingStatus = getStatusForStage('heating', t.currentStage, hasHeating ? 'Completed' : undefined);

          return {
            id: t._id,
            transformerId: t.uniqueId || `TR-${t.jobId || 'UNKNOWN'}-${String(t.internalCoreNo || '').split('-').pop() || '???'}`,
            coreTestStatus: getStatusForStage('core', t.currentStage, t.testHistory?.core_test?.status),
            secondaryTestStatus: getStatusForStage('secondary', t.currentStage, t.testHistory?.secondary_test?.status),
            primaryTestStatus: getStatusForStage('primary', t.currentStage, t.testHistory?.primary_test?.status),
            heatingStatus: heatingStatus as any,
            finalTestStatus: getStatusForStage('final', t.currentStage, t.testHistory?.final_test?.status),
            ptTestStatus: (t.currentStage === 'shipped' || t.currentStage === 'completed' || (t.testHistory?.pt_test && Object.keys(t.testHistory.pt_test).length > 0))
              ? 'Complete'
              : t.currentStage === 'pt'
                ? 'In Progress'
                : 'Pending',
            reportStatus: (t.currentStage === 'completed' || t.currentStage === 'shipped') ? 'Open' : 'Pending',
            raw: t
          };
        });

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
      }
    };

    if (order.id) {
      fetchTransformers();
    }
  }, [order.id]);

  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenReport = (transformer: any, type: 'core' | 'secondary' | 'primary' | 'final' | 'heating' | 'pt' | 'all') => {
    const id = transformer._id || transformer.id;
    window.location.href = `/admin/report/${id}?type=${type}`;
  };

  const filteredUnits = transformerUnits.filter((unit) => {
    const query = searchQuery.toLowerCase();

    // Check Transformer ID
    const matchTransformerId = unit.transformerId.toLowerCase().includes(query);

    // Check Job ID
    const matchJobId = order.orderId?.toLowerCase().includes(query) ||
      unit.raw?.jobId?.toLowerCase().includes(query);

    // Check Core Number (usually found as internalCoreNo in raw data)
    const matchCoreNo = unit.raw?.internalCoreNo?.toLowerCase().includes(query) ||
      unit.raw?.coreDetails?.some((core: any) => core.coreId?.toLowerCase().includes(query) || String(core.coreNumber).includes(query));

    return matchTransformerId || matchJobId || matchCoreNo;
  });

  const isPTContext = isPTOrder() || transformerUnits.some((u) => isPTOrder(u.raw));

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
    const unit = transformerUnits.find(u => u.transformerId === transformerId);
    if (unit && unit.raw) {
      handleOpenReport(unit.raw, 'all' as any);
    }
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

      {/* Reports Dashboard Toolbar */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Unit Test Status</h3>
        <div className="relative w-64">
          <Input
            placeholder="Search Transformer ID, Job ID, or Core..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Transformers Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="text-left p-4 font-medium text-gray-700">Transformer Id ⬆</th>
                {isPTContext ? (
                  <th className="text-center p-4 font-medium text-gray-700">PT Testing</th>
                ) : (
                  <>
                    <th className="text-center p-4 font-medium text-gray-700">Core Testing</th>
                    <th className="text-center p-4 font-medium text-gray-700">After Secondary</th>
                    <th className="text-center p-4 font-medium text-gray-700">After Primary</th>
                    <th className="text-center p-4 font-medium text-gray-700">After Heating</th>
                    <th className="text-center p-4 font-medium text-gray-700">Final Testing</th>
                  </>
                )}
                <th className="text-center p-4 font-medium text-gray-700">Report</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnits.map((unit, index) => {
                // Check if all tests are complete for Report generation logic
                const allComplete = isPTOrder(unit.raw)
                  ? unit.ptTestStatus === 'Complete'
                  : (
                    unit.coreTestStatus === 'Complete' &&
                    unit.secondaryTestStatus === 'Complete' &&
                    unit.primaryTestStatus === 'Complete' &&
                    unit.heatingStatus === 'Complete' &&
                    unit.finalTestStatus === 'Complete'
                  );

                return (
                  <tr
                    key={unit.id}
                    className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  >
                    {/* Transformer ID */}
                    <td className="p-4">
                      <p className="font-medium font-mono">{unit.transformerId}</p>
                    </td>

                    {isPTOrder(unit.raw) ? (
                      <td className="p-4">
                        <div className="flex flex-col items-center gap-2">
                          <Badge className={`${getStatusColor(unit.ptTestStatus || 'Pending')} flex items-center gap-1`}>
                            {getStatusIcon(unit.ptTestStatus || 'Pending')}
                            {unit.ptTestStatus || 'Pending'}
                          </Badge>
                          {unit.ptTestStatus === 'Complete' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 gap-1"
                              onClick={() => handleOpenReport(unit.raw, 'pt')}
                            >
                              <FileText className="w-3 h-3" />
                              View Report
                            </Button>
                          )}
                        </div>
                      </td>
                    ) : (
                      <>
                        {/* Core Test */}
                        <td className="p-4">
                          <div className="flex flex-col items-center gap-2">
                            <Badge className={`${getStatusColor(unit.coreTestStatus)} flex items-center gap-1`}>
                              {getStatusIcon(unit.coreTestStatus)}
                              {unit.coreTestStatus}
                            </Badge>
                            {unit.raw?.testHistory?.core_test?.tester && unit.coreTestStatus === 'Complete' && (
                              <span className="text-[10px] text-gray-500 font-medium">By: {unit.raw.testHistory.core_test.tester}</span>
                            )}
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
                            {unit.raw?.testHistory?.secondary_test?.tester && unit.secondaryTestStatus === 'Complete' && (
                              <span className="text-[10px] text-gray-500 font-medium">By: {unit.raw.testHistory.secondary_test.tester}</span>
                            )}
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
                            {unit.raw?.testHistory?.primary_test?.tester && unit.primaryTestStatus === 'Complete' && (
                              <span className="text-[10px] text-gray-500 font-medium">By: {unit.raw.testHistory.primary_test.tester}</span>
                            )}
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

                        {/* After Heating Test */}
                        <td className="p-4">
                          <div className="flex flex-col items-center gap-2">
                            <Badge className={`${getStatusColor(unit.heatingStatus)} flex items-center gap-1`}>
                              {getStatusIcon(unit.heatingStatus)}
                              {unit.heatingStatus}
                            </Badge>
                            {unit.raw?.processHistory?.heatingRecord?.[0]?.preparedBy && unit.heatingStatus === 'Complete' && (
                              <span className="text-[10px] text-gray-500 font-medium">By: {unit.raw.processHistory.heatingRecord[0].preparedBy}</span>
                            )}
                            {unit.heatingStatus === 'Complete' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7 gap-1"
                                onClick={() => handleOpenReport(unit.raw, 'heating')}
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
                            {unit.raw?.testHistory?.final_test?.tester && unit.finalTestStatus === 'Complete' && (
                              <span className="text-[10px] text-gray-500 font-medium">By: {unit.raw.testHistory.final_test.tester}</span>
                            )}
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
                      </>
                    )}

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

        {filteredUnits.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>{searchQuery ? "No transformers found matching your search." : "No transformers found for this order."}</p>
          </div>
        )}
      </Card>

      {/* Report Modal removed */}
    </div>
  );
}

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  ArrowLeft,
  Search,
  FileText,
  Download,
  Calendar,
  User,
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Printer,
  Play,
} from 'lucide-react';
import { CoreTestingInitiation } from '../testing/CoreTestingInitiation';
import { TestReportModal } from '../common/TestReportModal';

interface TransformerUnit {
  id: string;
  transformerId: string;
  coreTestStatus: 'Complete' | 'Pending' | 'In Progress' | 'Rejected';
  secondaryTestStatus: 'Complete' | 'Pending' | 'In Progress' | 'Rejected';
  primaryTestStatus: 'Complete' | 'Pending' | 'In Progress' | 'Rejected';
  finalTestStatus: 'Complete' | 'Pending' | 'In Progress' | 'Rejected';
  ptTestStatus?: 'Complete' | 'Pending' | 'In Progress' | 'Rejected';
  reportStatus: 'Open' | 'In Progress' | 'Pending';
}

interface Order {
  id: string;
  orderId: string;
  clientName: string;
  transformerName: string;
  transformerType: string;
  quantity: number;
  orderDate: string;
  status: string;
}

interface OrderDetailViewProps {
  order: Order;
  onBack: () => void;
}

export function OrderDetailView({ order, onBack }: OrderDetailViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCoreTestingInitiation, setShowCoreTestingInitiation] = useState(false);
  const isPT = order.transformerType === 'PT';

  // Generate transformer units based on quantity
  const [transformerUnits, setTransformerUnits] = useState<TransformerUnit[]>([]);
  const [rawTransformers, setRawTransformers] = useState<any[]>([]);
  const [reportModal, setReportModal] = useState<{ isOpen: boolean; transformer: any; order?: any; type: 'core' | 'secondary' | 'primary' | 'final' | 'all' | 'pt' }>({
    isOpen: false,
    transformer: null,
    order: null,
    type: 'core'
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransformers = async () => {
      try {
        const response = await axios.get(`http://localhost:3002/api/transformers/order/${order.id}`, {
          withCredentials: true
        });

        // Define the progression of stages
        const stageOrder = ['core', 'secondary', 'primary', 'final', 'completed', 'shipped'];

        const getStatusForStage = (targetStage: string, currentStage: string, historyStatus?: string, t?: any) => {
          // 1. Explicit History Check
          if (historyStatus === 'Rejected') return 'Rejected';
          if (historyStatus === 'Completed') return 'Complete';

          // Handle admin_review specially
          if (currentStage === 'admin_review' && t?.adminReviewDetails) {
            if (t.adminReviewDetails.failedStage === targetStage) return 'Admin Review';
            const targetIndex = stageOrder.indexOf(targetStage);
            const returnIndex = stageOrder.indexOf(t.adminReviewDetails.returnTargetStage);
            if (targetIndex < returnIndex) return 'Complete';
            return 'Pending';
          }

          // 2. Stage Progression Check
          const targetIndex = stageOrder.indexOf(targetStage);
          const currentIndex = stageOrder.indexOf(currentStage);

          if (targetIndex === -1 || currentIndex === -1) return 'Pending'; // Safety fallback

          if (currentIndex > targetIndex) {
            return 'Complete'; // If we are passed this stage, it's done
          }
          if (currentIndex === targetIndex) {
            // If history says Pending/Empty but we are IN this stage, it's In Progress
            // (Unless history explicitly says otherwise, which we checked above)
            return 'In Progress';
          }

          return 'Pending'; // Not reached yet
        };

        const mappedUnits: TransformerUnit[] = response.data.map((t: any) => ({
          id: t._id,
          // Use the uniqueId from DB (TR-JOB-...), fallback to constructing it if missing
          transformerId: t.uniqueId || `TR-${t.jobId || 'UNKNOWN'}-${String(t.internalCoreNo || '').split('-').pop() || '???'}`,
          coreTestStatus: getStatusForStage('core', t.currentStage, t.testHistory?.core_test?.status, t),
          secondaryTestStatus: getStatusForStage('secondary', t.currentStage, t.testHistory?.secondary_test?.status, t),
          primaryTestStatus: getStatusForStage('primary', t.currentStage, t.testHistory?.primary_test?.status, t),
          finalTestStatus: getStatusForStage('final', t.currentStage, t.testHistory?.final_test?.status, t),
          ptTestStatus: (t.currentStage === 'shipped' || t.currentStage === 'completed' || (t.testHistory?.pt_test && Object.keys(t.testHistory.pt_test).length > 0)) ? 'Complete' : t.currentStage === 'pt' ? 'In Progress' : 'Pending',
          reportStatus: (t.currentStage === 'completed' || t.currentStage === 'shipped') ? 'Open' : 'Pending'
        }));

        setRawTransformers(response.data);
        setTransformerUnits(mappedUnits);
      } catch (error) {
        console.error("Error fetching transformers:", error);
      } finally {
        setLoading(false);
      }
    };

    if (order.id) {
      fetchTransformers();
    }
  }, [order.id]);

  const filteredUnits = transformerUnits.filter(unit =>
    unit.transformerId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Complete':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'Pending':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'In Progress':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Rejected':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'Open':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'Admin Review':
        return 'bg-red-200 text-red-900 border-red-500 font-bold';
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Complete':
        return <CheckCircle2 className="w-3 h-3" />;
      case 'Pending':
        return <Clock className="w-3 h-3" />;
      case 'In Progress':
        return <AlertCircle className="w-3 h-3" />;
      case 'Rejected':
        return <XCircle className="w-3 h-3" />;
      case 'Admin Review':
        return <AlertCircle className="w-3 h-3 text-red-700" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const isAllTestsComplete = (unit: TransformerUnit) => {
    if (isPT) return unit.ptTestStatus === 'Complete';
    return (
      unit.coreTestStatus === 'Complete' &&
      unit.secondaryTestStatus === 'Complete' &&
      unit.primaryTestStatus === 'Complete' &&
      unit.finalTestStatus === 'Complete'
    );
  };

  const handleViewReport = (transformerId: string, testType: string) => {
    // Find the full transformer object
    // Note: transformerId passed here is the DISPLAY ID (uniqueId)
    // We should look it up in rawTransformers
    const transformer = rawTransformers.find(t =>
      t.uniqueId === transformerId ||
      `TR-${t.jobId || 'UNKNOWN'}-${String(t.internalCoreNo || '').split('-').pop() || '???'}` === transformerId
    );

    if (transformer) {
      let type: 'core' | 'secondary' | 'primary' | 'final' | 'all' | 'pt' = 'core';
      if (testType.includes('Core')) type = 'core';
      else if (testType.includes('Secondary')) type = 'secondary';
      else if (testType.includes('Primary')) type = 'primary';
      else if (testType.includes('Final')) type = 'final';
      else if (testType.includes('PT')) type = 'pt';

      setReportModal({
        isOpen: true,
        transformer,
        order,
        type
      });
    } else {
      console.error("Transformer not found for ID:", transformerId);
    }
  };

  const handleDownloadFullReport = (transformerId: string) => {
    const transformer = rawTransformers.find(t =>
      t.uniqueId === transformerId ||
      `TR-${t.jobId || 'UNKNOWN'}-${String(t.internalCoreNo || '').split('-').pop() || '???'}` === transformerId
    );

    if (transformer) {
      setReportModal({
        isOpen: true,
        transformer,
        order,
        type: 'all'
      });
    }
  };

  const completedCount = transformerUnits.filter(isAllTestsComplete).length;

  // Calculate testing states
  const getTestingStateStats = () => {
    let coreComplete = 0;
    let secondaryComplete = 0;
    let primaryComplete = 0;
    let finalComplete = 0;
    let ptComplete = 0;

    transformerUnits.forEach(unit => {
      if (unit.coreTestStatus === 'Complete') coreComplete++;
      if (unit.secondaryTestStatus === 'Complete') secondaryComplete++;
      if (unit.primaryTestStatus === 'Complete') primaryComplete++;
      if (unit.finalTestStatus === 'Complete') finalComplete++;
      if (unit.ptTestStatus === 'Complete') ptComplete++;
    });

    return {
      coreComplete,
      secondaryComplete,
      primaryComplete,
      finalComplete,
      ptComplete,
      coreRemaining: order.quantity - coreComplete,
      secondaryRemaining: order.quantity - secondaryComplete,
      primaryRemaining: order.quantity - primaryComplete,
      finalRemaining: order.quantity - finalComplete,
      ptRemaining: order.quantity - ptComplete,
    };
  };

  const testingStats = getTestingStateStats();

  if (showCoreTestingInitiation) {
    return (
      <CoreTestingInitiation
        order={order}
        onBack={() => setShowCoreTestingInitiation(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Button>
        {!isPT && (
          <Button
            onClick={() => setShowCoreTestingInitiation(true)}
            className="gap-2 bg-[#003a70] hover:bg-[#002850] ml-auto"
          >
            <Play className="w-4 h-4" />
            Start Core Testing
          </Button>
        )}
      </div>

      {/* ADVENT ENGINEERS Header */}
      <Card className="p-6">
        <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
          <h1 className="text-red-600 text-3xl">ADVENT ENGINEERS</h1>
        </div>

        {/* Order Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Client</p>
                <p className="font-medium text-lg">{order.clientName}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Order ID</p>
              <p className="font-medium font-mono">{order.orderId}</p>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{order.orderDate}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="font-medium text-lg">{order.transformerType}</p>
            </div>
            <div className="flex items-start gap-2">
              <Package className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Quantity</p>
                <p className="font-medium text-lg">{order.quantity}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Completion Status</p>
              <p className="text-2xl font-bold text-blue-600">
                {completedCount}/{order.quantity}
              </p>
              <p className="text-sm text-gray-600 mt-1">Units Completed</p>
            </div>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="By Transformer Id"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Printer className="w-4 h-4" />
              Print All
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Transformers Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="text-left p-4 font-medium text-gray-700">Transformer Id ⬆</th>
                {isPT ? (
                  <th className="text-center p-4 font-medium text-gray-700">PT Testing</th>
                ) : (
                  <>
                    <th className="text-center p-4 font-medium text-gray-700">Core Testing</th>
                    <th className="text-center p-4 font-medium text-gray-700">After Secondary Testing</th>
                    <th className="text-center p-4 font-medium text-gray-700">After Primary Testing</th>
                    <th className="text-center p-4 font-medium text-gray-700">Final Testing</th>
                  </>
                )}
                <th className="text-center p-4 font-medium text-gray-700">Report</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnits.map((unit, index) => {
                const allComplete = isAllTestsComplete(unit);

                return (
                  <tr
                    key={unit.id}
                    className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                  >
                    {/* Transformer ID */}
                    <td className="p-4">
                      <p className="font-medium font-mono">{unit.transformerId}</p>
                    </td>

                    {/* PT Test Or CT Tests */}
                    {isPT ? (
                      <td className="p-4">
                        <div className="flex flex-col items-center gap-2">
                          <Badge className={`${getStatusColor(unit.ptTestStatus || 'Pending')} flex items-center gap-1`}>
                            {getStatusIcon(unit.ptTestStatus || 'Pending')}
                            {unit.ptTestStatus || 'Pending'}
                          </Badge>
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
                            {unit.coreTestStatus === 'Complete' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7 gap-1"
                                onClick={() => handleViewReport(unit.transformerId, 'Core Test')}
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
                                onClick={() => handleViewReport(unit.transformerId, 'After Secondary Test')}
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
                                onClick={() => handleViewReport(unit.transformerId, 'After Primary Test')}
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
                                onClick={() => handleViewReport(unit.transformerId, 'Final Test')}
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
            <p>No transformers found</p>
            <p className="text-sm mt-1">Try adjusting your search criteria</p>
          </div>
        )}
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">All Tests Complete</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{completedCount}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                {transformerUnits.filter(u =>
                  isPT 
                    ? u.ptTestStatus === 'In Progress' 
                    : [u.coreTestStatus, u.secondaryTestStatus, u.primaryTestStatus, u.finalTestStatus]
                        .includes('In Progress')
                ).length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-red-700 mt-1">
                {order.quantity - completedCount}
              </p>
            </div>
            <Clock className="w-8 h-8 text-red-600" />
          </div>
        </Card>

        <Card className="p-4 bg-gray-50 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-700 mt-1">
                {transformerUnits.filter(u =>
                  isPT
                    ? u.ptTestStatus === 'Rejected'
                    : [u.coreTestStatus, u.secondaryTestStatus, u.primaryTestStatus, u.finalTestStatus]
                        .includes('Rejected')
                ).length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-gray-600" />
          </div>
        </Card>
      </div>

      {/* Testing State Tracking */}
      <Card className="p-6">
        <h3 className="mb-4">Testing Progress Tracking</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current State of Testing */}
          <div>
            <h4 className="mb-3 text-blue-700">Current State of Testing</h4>
            <div className="space-y-3">
              {isPT ? (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">PT Testing</span>
                    <Badge className="bg-purple-600 text-white">{testingStats.ptComplete} Completed</Badge>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${(testingStats.ptComplete / order.quantity) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {testingStats.ptComplete} out of {order.quantity} transformers
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Core Testing</span>
                      <Badge className="bg-blue-600 text-white">{testingStats.coreComplete} Completed</Badge>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${(testingStats.coreComplete / order.quantity) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {testingStats.coreComplete} out of {order.quantity} transformers
                    </p>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">After Secondary Testing</span>
                      <Badge className="bg-purple-600 text-white">{testingStats.secondaryComplete} Completed</Badge>
                    </div>
                    <div className="w-full bg-purple-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${(testingStats.secondaryComplete / order.quantity) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {testingStats.secondaryComplete} out of {order.quantity} transformers
                    </p>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">After Primary Testing</span>
                      <Badge className="bg-orange-600 text-white">{testingStats.primaryComplete} Completed</Badge>
                    </div>
                    <div className="w-full bg-orange-200 rounded-full h-2">
                      <div
                        className="bg-orange-600 h-2 rounded-full transition-all"
                        style={{ width: `${(testingStats.primaryComplete / order.quantity) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {testingStats.primaryComplete} out of {order.quantity} transformers
                    </p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Final Testing</span>
                      <Badge className="bg-green-600 text-white">{testingStats.finalComplete} Completed</Badge>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${(testingStats.finalComplete / order.quantity) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {testingStats.finalComplete} out of {order.quantity} transformers
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Remaining State of Testing */}
          <div>
            <h4 className="mb-3 text-red-700">Remaining State of Testing</h4>
            <div className="space-y-3">
              {isPT ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">PT Testing</span>
                    <Badge className="bg-red-600 text-white">{testingStats.ptRemaining} Remaining</Badge>
                  </div>
                  <div className="w-full bg-red-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full transition-all"
                      style={{ width: `${(testingStats.ptRemaining / order.quantity) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {testingStats.ptRemaining} out of {order.quantity} transformers pending
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Core Testing</span>
                      <Badge className="bg-red-600 text-white">{testingStats.coreRemaining} Remaining</Badge>
                    </div>
                    <div className="w-full bg-red-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full transition-all"
                        style={{ width: `${(testingStats.coreRemaining / order.quantity) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {testingStats.coreRemaining} out of {order.quantity} transformers pending
                    </p>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">After Secondary Testing</span>
                      <Badge className="bg-red-600 text-white">{testingStats.secondaryRemaining} Remaining</Badge>
                    </div>
                    <div className="w-full bg-red-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full transition-all"
                        style={{ width: `${(testingStats.secondaryRemaining / order.quantity) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {testingStats.secondaryRemaining} out of {order.quantity} transformers pending
                    </p>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">After Primary Testing</span>
                      <Badge className="bg-red-600 text-white">{testingStats.primaryRemaining} Remaining</Badge>
                    </div>
                    <div className="w-full bg-red-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full transition-all"
                        style={{ width: `${(testingStats.primaryRemaining / order.quantity) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {testingStats.primaryRemaining} out of {order.quantity} transformers pending
                    </p>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Final Testing</span>
                      <Badge className="bg-red-600 text-white">{testingStats.finalRemaining} Remaining</Badge>
                    </div>
                    <div className="w-full bg-red-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full transition-all"
                        style={{ width: `${(testingStats.finalRemaining / order.quantity) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {testingStats.finalRemaining} out of {order.quantity} transformers pending
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Report Modal */}
      <TestReportModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal({ ...reportModal, isOpen: false })}
        transformer={reportModal.transformer}
        testType={reportModal.type}
      />
    </div>
  );
}

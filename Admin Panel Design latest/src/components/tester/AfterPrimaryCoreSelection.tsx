import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { ArrowLeft, PlayCircle, Loader2, CheckCircle, FileText, AlertTriangle } from 'lucide-react';
import { Transformer as AfterPrimaryTransformer } from './AfterPrimaryTransformersList';
import { toast } from 'sonner';

interface Order {
  _id: string;
  jobId: string;
  clientName: string;
  quantity: number;
  transformerQuantity?: number;
  assignedDate: string;
  deadline: string;
  status: string;
  priority: string;
  primaryCurrents?: string[];
  ratedSecondaryCurrent?: string;
  coreDetails?: any[];
  ratio?: string[];
}

interface CoreConfig {
  coreNumber: number;
  coreType: 'metering' | 'ps' | 'protection';
  coreId: string;
  accuracyClass?: string | undefined;
}

interface AfterPrimaryCoreSelectionProps {
  transformer: AfterPrimaryTransformer;
  order: Order;
  onSelectCore: (core: CoreConfig, primaryCurrent: string, secondaryCurrent: string) => void;
  onBack: () => void;
}

export function AfterPrimaryCoreSelection({
  transformer: initialTransformer,
  order,
  onSelectCore,
  onBack,
}: AfterPrimaryCoreSelectionProps) {

  const [transformer, setTransformer] = useState<AfterPrimaryTransformer>(initialTransformer);
  const [isLoading, setIsLoading] = useState(false);

  // Sync when parent passes updated testHistory (e.g., after saving a report and navigating back)
  useEffect(() => {
    setTransformer(prev => ({
      ...prev,
      testHistory: initialTransformer.testHistory
    }));
  }, [initialTransformer.testHistory]);

  // Fetch latest transformer data to ensure status is up-to-date
  useEffect(() => {
    const fetchTransformerData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/transformers/${initialTransformer.uniqueId}`, {
          withCredentials: true
        });
        if (response.data) {
          setTransformer(prev => ({
            ...prev,
            testHistory: response.data.testHistory
          }));
        }
      } catch (error) {
        console.error("Failed to refresh transformer data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransformerData();
  }, [initialTransformer.uniqueId]);


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

  const checkCoreStatus = (core: CoreConfig) => {
    const history = transformer.testHistory?.primary_test;
    if (!history) return 'pending';

    const hasValue = (v: any) => v !== undefined && v !== null && v !== '';

    if (core.coreType === 'metering') {
      const results = history.metering_results || [];
      const coreResults = results.filter((r: any) => r.internalCoreNo === core.coreId || r.coreId === core.coreId);
      if (coreResults.length === 0) return 'pending';
      for (const res of coreResults) {
        if (!res.rows || res.rows.length === 0) return 'pending';
        for (const row of res.rows) {
          if (!hasValue(row.r100) || !hasValue(row.p100) || !hasValue(row.r25) || !hasValue(row.p25)) return 'pending';
        }
      }
      return 'completed';
    }

    if (core.coreType === 'ps') {
      const results = history.ps_results || [];
      const coreResults = results.filter((r: any) => r.internalCoreNo === core.coreId || r.coreId === core.coreId);
      if (coreResults.length === 0) return 'pending';
      for (const res of coreResults) {
        // Only require the 3 core measurement fields
        if (!hasValue(res.turnRatioError) || !hasValue(res.vk) || !hasValue(res.iexVk)) return 'pending';
      }
      return 'completed';
    }

    if (core.coreType === 'protection') {
      const results = history.protection_results || [];
      const coreResults = results.filter((r: any) => r.internalCoreNo === core.coreId || r.coreId === core.coreId);
      if (coreResults.length === 0) return 'pending';
      for (const res of coreResults) {
        // Require key protection fields
        if (!hasValue(res.ratioError100) || !hasValue(res.resistance) ||
            (!hasValue(res.secondaryLimitingVtg) && !hasValue(res.secondaryLimitingVoltage))) return 'pending';
      }
      return 'completed';
    }

    return 'pending';
  };

  const checkCoreFailures = (core: CoreConfig) => {
    const history = transformer.testHistory?.primary_test;
    if (!history) return false;

    if (core.coreType === 'metering') {
      const results = history.metering_results || [];
      const coreResults = results.filter((r: any) => r.internalCoreNo === core.coreId || r.coreId === core.coreId);
      return coreResults.some((res: any) => res.rows?.some((row: any) => 
        row.r100_r_pass === false || row.r100_p_pass === false || row.r100_pass === false || 
        row.r25_r_pass === false || row.r25_p_pass === false || row.r25_pass === false
      ));
    }

    if (core.coreType === 'ps') {
      const results = history.ps_results || [];
      const coreResults = results.filter((r: any) => r.internalCoreNo === core.coreId || r.coreId === core.coreId);
      return coreResults.some((res: any) => res.isPass === false);
    }

    if (core.coreType === 'protection') {
      const results = history.protection_results || [];
      const coreResults = results.filter((r: any) => r.internalCoreNo === core.coreId || r.coreId === core.coreId);
      return coreResults.some((res: any) => res.isPass === false);
    }

    return false;
  };

  const handleStrictApproval = async () => {
    try {
      if (!confirm("Are you sure you want to request strict approval for this transformer?")) return;

      let failureReasons: string[] = [];
      transformer.cores.forEach(core => {
        const history = transformer.testHistory?.primary_test;
        if (!history) return;

        if (core.coreType === 'metering') {
          const results = history.metering_results?.filter((r: any) => r.internalCoreNo === core.coreId) || [];
          results.forEach((res: any) => {
            res.rows?.forEach((row: any) => {
              if (row.r100_r_pass === false || row.r100_p_pass === false) {
                failureReasons.push(`Core ${core.coreNumber} (Metering 100%): ${row.r100_reason || 'Ratio/Phase Error Limit Exceeded'}`);
              }
              if (row.r25_r_pass === false || row.r25_p_pass === false) {
                failureReasons.push(`Core ${core.coreNumber} (Metering 25%): ${row.r25_reason || 'Ratio/Phase Error Limit Exceeded'}`);
              }
            });
          });
        } else if (core.coreType === 'ps') {
          const results = history.ps_results?.filter((r: any) => r.internalCoreNo === core.coreId) || [];
          results.forEach((res: any) => {
            if (res.isPass === false && res.reason) failureReasons.push(`Core ${core.coreNumber} (PS): ${res.reason}`);
          });
        } else if (core.coreType === 'protection') {
          const results = history.protection_results?.filter((r: any) => r.internalCoreNo === core.coreId) || [];
          results.forEach((res: any) => {
            if (res.isPass === false && res.reason) failureReasons.push(`Core ${core.coreNumber} (Protection): ${res.reason}`);
          });
        }
      });

      const finalReason = failureReasons.length > 0 ? [...new Set(failureReasons)].join(' | ') : "Accuracy Limits Exceeded during Primary Test";

      const payload = {
        orderId: order._id,
        jobId: order.jobId,
        clientName: order.clientName,
        coreType: 'Multiple',
        testType: 'Primary Testing',
        failureReason: finalReason,
        testData: transformer.testHistory?.primary_test,
        requestedBy: 'Primary Tester'
      };

      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/strict-approvals/request`, payload, { withCredentials: true });
      
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/transformers/${transformer.uniqueId}/approve-stage`, {
        stage: 'primary',
        nextStage: 'admin_review'
      }, { withCredentials: true });

      toast.success("Strict Approval Requested!");
      onBack();
    } catch (error) {
      console.error("Strict approval request failed", error);
      toast.error("Failed to request strict approval.");
    }
  };

  const handleApproveTransformer = async () => {
    try {
      if (!confirm(`Are you sure you want to approve Transformer ${transformer.uniqueId} and move it to Final Testing?`)) return;
      const response = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/transformers/${transformer.uniqueId}/approve-stage`, {
        stage: 'primary',
        nextStage: 'final'
      }, { withCredentials: true });
      if (response.data.success) {
        toast.success("Transformer Approved successfully!");
        onBack();
      }
    } catch (err) {
      console.error("Approval failed", err);
      toast.error("Failed to approve transformer");
    }
  };

  const isAllCoresCompleted = transformer.cores.every(core => checkCoreStatus(core) === 'completed');
  const hasAnyFailures = transformer.cores.some(core => checkCoreFailures(core));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onBack} 
          className="gap-2"
          disabled={!isAllCoresCompleted}
          title={!isAllCoresCompleted ? "You must complete all cores before going back" : ""}
        >
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
      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {transformer.cores.map((core) => {
            const status = checkCoreStatus(core);
            const isCompleted = status === 'completed';
            const hasFailure = checkCoreFailures(core);

            // Automatic detection of parameters
            const coreFromOrder = order?.coreDetails?.[core.coreNumber - 1];
            const secondaryVal = coreFromOrder?.secondaryCurrent || order?.ratedSecondaryCurrent || '1';
            const primaryVal = coreFromOrder?.primaryCurrent || order?.primaryCurrents?.[0] || (order?.ratio?.[0]?.split('/')[0] || '');

            return (
              <Card
                key={core.coreNumber}
                className={`p-6 hover:shadow-lg transition-all cursor-pointer border-2 ${
                  isCompleted ? (hasFailure ? 'border-amber-400 bg-amber-50' : 'border-green-400 bg-green-50') : 
                  getCoreTypeColor(core.coreType)
                }`}
                onClick={() => onSelectCore(core, String(primaryVal), String(secondaryVal))}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Core Number</p>
                    <h3 className="mt-1 text-xl font-bold">Core {core.coreNumber}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={getCoreTypeColor(core.coreType)}>
                      {core.coreType.toUpperCase()}
                    </Badge>
                    {isCompleted && (
                      <Badge className={hasFailure ? "bg-amber-600 text-white" : "bg-green-600 text-white"}>
                        {hasFailure ? <AlertTriangle className="w-3 h-3 mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                        {hasFailure ? 'Failed' : 'Passed'}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">Core Type</p>
                    <p className="font-medium">{getCoreTypeLabel(core.coreType)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Core ID (from Secondary)</p>
                    <p className="font-medium text-blue-600">{core.coreId}</p>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2 rounded border border-gray-100 shadow-sm">
                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Secondary Current</span>
                    <Badge variant="outline" className="text-blue-700 font-bold border-blue-200 bg-blue-50">
                      {secondaryVal}A
                    </Badge>
                  </div>
                </div>

                <Button
                  className={`w-full ${isCompleted ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCore(core, '', String(secondaryVal));
                  }}
                >
                  {isCompleted ? (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Edit Report
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Complete Test
                    </>
                  )}
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Approval Section */}
      {isAllCoresCompleted && !hasAnyFailures && (
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-10 h-10 text-green-600" />
              <div>
                <h4 className="font-semibold text-green-900">Transformer Ready for Approval</h4>
                <p className="text-sm text-green-700">All cores have passed accuracy limits. Move to Final Testing stage.</p>
              </div>
            </div>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white gap-2 px-8 py-6 text-lg font-bold shadow-lg"
              onClick={handleApproveTransformer}
            >
              Approve Transformer
            </Button>
          </div>
        </Card>
      )}

      {isAllCoresCompleted && hasAnyFailures && (
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-10 h-10 text-red-600" />
              <div>
                <h4 className="font-semibold text-red-900">Strict Approval Required</h4>
                <p className="text-sm text-red-700">One or more cores have failed accuracy limits. You must request admin approval.</p>
              </div>
            </div>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white gap-2 px-8 py-6 text-lg font-bold shadow-lg"
              onClick={handleStrictApproval}
            >
              Request Strict Approval
            </Button>
          </div>
        </Card>
      )}

      {/* Info Box */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold">i</span>
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Testing Instructions</h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              1. Click on a core card to open its test report.
              <br />
              2. The report automatically uses the Secondary Current specified for that core in the order.
              <br />
              3. If a core fails accuracy limits, the card will turn orange. All cores must be completed before requesting approval.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

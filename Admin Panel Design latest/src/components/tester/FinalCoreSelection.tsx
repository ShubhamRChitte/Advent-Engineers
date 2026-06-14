import React, { useState, useEffect } from 'react';
import axios from '@/utils/axiosConfig';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { ArrowLeft, PlayCircle, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { FinalTransformer } from './FinalTransformersList';
import { toast } from 'sonner';

interface Order {
  _id?: string;
  jobId: string;
  client: string;
  assignedDate: string;
  status: string;
  priority: string;
  ratio?: string[];
  accuracyClass?: string;
  primaryCurrents?: string[];
  ratedSecondaryCurrent?: string;
  clientName?: string;
  coreDetails?: any[];
}

interface CoreConfig {
  coreNumber: number;
  coreType: 'metering' | 'ps' | 'protection';
  coreId?: string;
  accuracyClass?: string | undefined;
}

interface FinalCoreSelectionProps {
  transformer: FinalTransformer;
  order: Order;
  onSelectCore: (core: CoreConfig, primaryCurrent: string, secondaryCurrent: string) => void;
  onOpenComprehensiveReport: () => void;
  onBack: () => void;
  onApprove: () => void;
}

export function FinalCoreSelection({
  transformer: initialTransformer,
  order,
  onSelectCore,
  onOpenComprehensiveReport,
  onBack,
  onApprove,
}: FinalCoreSelectionProps) {

  const [transformer, setTransformer] = useState<FinalTransformer>(initialTransformer);
  // Refresh transformer data
  useEffect(() => {
    const fetchTransformerData = async () => {
      try {
        const response = await axios.get(`/transformers/${initialTransformer.uniqueId}`, {
          withCredentials: true
        });
        if (response.data) {
          setTransformer(prev => ({
            ...prev,
            testHistory: response.data.testHistory,
            currentStage: response.data.currentStage
          }));
        }
      } catch (error) {
        console.error("Failed to refresh transformer data", error);
      }
    };
    fetchTransformerData();
  }, [initialTransformer.uniqueId]);

  const checkCoreCompletion = (core: CoreConfig) => {
    const finalHistory = transformer.testHistory?.final_test || {};
    const results = [
      ...(finalHistory.metering_results || []),
      ...(finalHistory.ps_results || []),
      ...(finalHistory.protection_results || [])
    ];
    return results.some(r => r.internalCoreNo === core.coreId || r.coreId === core.coreId);
  };

  const checkCoreFailures = (core: CoreConfig) => {
    const finalHistory = transformer.testHistory?.final_test;
    if (!finalHistory) return false;

    const results = [
      ...(finalHistory.metering_results || []),
      ...(finalHistory.ps_results || []),
      ...(finalHistory.protection_results || [])
    ].filter(r => r.internalCoreNo === core.coreId || r.coreId === core.coreId);

    return results.some((res: any) => {
        if (res.isPass === false) return true;
        if (res.rows) return res.rows.some((row: any) => 
            row.r100_r_pass === false || row.r100_p_pass === false || row.r100_pass === false || 
            row.r25_r_pass === false || row.r25_p_pass === false || row.r25_pass === false
        );
        return false;
    });
  };

  const handleStrictApproval = async () => {
    try {
      if (!confirm("Are you sure you want to request strict approval for this unit at Final stage?")) return;

      let failureReasons: string[] = [];
      transformer.cores.forEach(core => {
        const history = transformer.testHistory?.final_test;
        if (!history) return;

        const results = [
            ...(history.metering_results || []),
            ...(history.ps_results || []),
            ...(history.protection_results || [])
        ].filter(r => r.internalCoreNo === core.coreId);

        results.forEach((res: any) => {
            if (res.isPass === false && res.reason) {
                failureReasons.push(`Core ${core.coreNumber}: ${res.reason}`);
            }
            if (res.rows) {
                res.rows.forEach((row: any) => {
                    if (row.r100_r_pass === false || row.r100_p_pass === false || row.r100_pass === false) {
                        failureReasons.push(`Core ${core.coreNumber} (Metering 100%): ${row.r100_reason || 'Ratio/Phase Error Exceeded'}`);
                    }
                    if (row.r25_r_pass === false || row.r25_p_pass === false || row.r25_pass === false) {
                        failureReasons.push(`Core ${core.coreNumber} (Metering 25%): ${row.r25_reason || 'Ratio/Phase Error Exceeded'}`);
                    }
                });
            }
        });
      });

      const finalReason = failureReasons.length > 0 ? [...new Set(failureReasons)].join(' | ') : "Accuracy Limits Exceeded during Final Test";

      const payload = {
        orderId: order._id || (transformer as any).orderId?._id || (transformer as any).orderId,
        jobId: order.jobId,
        clientName: order.clientName || order.client || 'N/A',
        coreType: 'Multiple',
        testType: 'Final Testing',
        failureReason: finalReason,
        testData: transformer.testHistory?.final_test,
        requestedBy: 'Final Tester'
      };

      await axios.post(`/strict-approvals/request`, payload, { withCredentials: true });
      
      await axios.put(`/transformers/${transformer.uniqueId}/approve-stage`, {
        stage: 'final',
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
      if (!confirm(`Are you sure you want to approve Transformer ${transformer.uniqueId} as Finalized and move to Shipped stage?`)) return;
      const response = await axios.put(`/transformers/${transformer.uniqueId}/approve-stage`, {
        stage: 'final',
        nextStage: 'shipped'
      }, { withCredentials: true });
      if (response.data.success) {
        toast.success("Transformer Finalized and moved to Shipped stage!");
        onBack();
      }
    } catch (err) {
      console.error("Finalization failed", err);
      toast.error("Failed to finalize transformer");
    }
  };

  const getCoreTypeColor = (type: string, isComplete: boolean, hasFailure: boolean) => {
    if (isComplete) {
        return hasFailure 
            ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-md' 
            : 'bg-green-50 text-green-700 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]';
    }
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

  const isAllCoresCompleted = transformer.cores.every(core => checkCoreCompletion(core));
  const hasAnyFailures = transformer.cores.some(core => checkCoreFailures(core));

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
        <h2>Final Testing - Select Core or Comprehensive Report</h2>
        <p className="text-gray-500 mt-1">Choose a core for individual testing or open the comprehensive report</p>
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



      {/* Comprehensive Report Card */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-400 hover:shadow-xl transition-all shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center shadow-inner">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-green-900 mb-1">Comprehensive Final Test Report</h3>
              <p className="text-sm text-green-800">
                Complete final testing report including Polarity, Meggar, H.V. Tests, O.V.I.T.
              </p>
            </div>
          </div>
          <Button
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white font-bold h-14 px-8 shadow-lg transition-all hover:scale-105"
            onClick={onOpenComprehensiveReport}
          >
            <FileText className="w-5 h-5 mr-2" />
            OPEN FULL REPORT
          </Button>
        </div>
      </Card>


      {/* Cores Grid */}
      <div>
        <h3 className="mb-4 text-lg font-bold flex items-center gap-2">
          Core-Wise Accuracy Testing
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {transformer.cores.map((core) => {
            const isComplete = checkCoreCompletion(core);
            const hasFailure = checkCoreFailures(core);

            // Automatic detection of parameters
            const coreFromOrder = order?.coreDetails?.[core.coreNumber - 1];
            const secondaryVal = coreFromOrder?.secondaryCurrent || order?.ratedSecondaryCurrent || '1';
            const primaryVal = coreFromOrder?.primaryCurrent || order?.primaryCurrents?.[0] || (order?.ratio?.[0]?.split('/')[0] || '');

            return (
              <Card
                key={core.coreNumber}
                className={`p-6 hover:shadow-lg transition-all cursor-pointer border-2 ${getCoreTypeColor(core.coreType, isComplete, hasFailure)}`}
                onClick={() => onSelectCore(core, String(primaryVal), String(secondaryVal))}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm opacity-80">Core Number</p>
                    <h3 className="mt-1 text-2xl font-black">{core.coreNumber}</h3>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <Badge className={isComplete ? (hasFailure ? 'bg-amber-600' : 'bg-green-600') : ''}>
                      {core.coreType.toUpperCase()}
                    </Badge>
                    {isComplete && (
                      <Badge className={hasFailure ? "bg-amber-600" : "bg-green-600"}>
                        {hasFailure ? <AlertTriangle className="w-3 h-3 mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                        {hasFailure ? 'Limit Exceeded' : 'Pass'}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div>
                    <p className="text-sm opacity-80">Core Type</p>
                    <p className="font-bold">{getCoreTypeLabel(core.coreType)}</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-80">Core ID</p>
                    <p className="font-bold text-blue-600">{core.coreId}</p>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2 rounded border border-gray-100 shadow-sm">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Secondary Current</span>
                    <Badge variant="outline" className="text-blue-700 font-bold border-blue-200 bg-blue-50">
                      {secondaryVal}A
                    </Badge>
                  </div>
                </div>

                <Button
                  className={`w-full font-bold ${isComplete ? (hasFailure ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700') : 'bg-red-600 hover:bg-red-700'}`}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onSelectCore(core, '', String(secondaryVal));
                  }}
                >
                  {isComplete ? (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      View Core Report
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Start Core Test
                    </>
                  )}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Approval Section */}
      {isAllCoresCompleted && !hasAnyFailures && (
        <Card className="p-6 bg-green-50 border-green-200 border-l-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-12 h-12 text-green-600" />
              <div>
                <h4 className="font-black text-green-900 text-xl uppercase">Transformer Ready for Dispatch</h4>
                <p className="text-sm text-green-700 font-bold italic">All cores have passed final verification. Move to shipping stage.</p>
              </div>
            </div>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white gap-2 px-10 py-7 text-xl font-black shadow-xl"
              onClick={handleApproveTransformer}
            >
              Approve & Dispatch
            </Button>
          </div>
        </Card>
      )}

      {isAllCoresCompleted && hasAnyFailures && (
        <Card className="p-6 bg-red-50 border-red-200 border-l-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-12 h-12 text-red-600" />
              <div>
                <h4 className="font-black text-red-900 text-xl uppercase">Strict Approval Required</h4>
                <p className="text-sm text-red-700 font-bold italic">This unit has core failures. Move to Admin Review stage for decision.</p>
              </div>
            </div>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white gap-2 px-10 py-7 text-xl font-black shadow-xl"
              onClick={handleStrictApproval}
            >
              Request Strict Approval
            </Button>
          </div>
        </Card>
      )}

      {/* Info Box */}
      <Card className="p-6 bg-blue-50 border-blue-200 border-l-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="text-white font-black">i</span>
          </div>
          <div>
            <h4 className="font-bold text-blue-900 text-lg mb-1">Final Testing Instructions</h4>
            <p className="text-sm text-blue-800 leading-relaxed font-medium">
                Ensure all cores are tested before approving the unit.
                If accuracy limits are exceeded, use the <strong>Strict Approval</strong> button to notify the admin.
                The reports automatically use the Secondary Current specified for each core.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  ArrowLeft,
  Zap,
  Shield,
  AlertTriangle,
  CheckCircle,
  Check,
  Loader2
} from 'lucide-react';
import { CoreTestingOrder } from './CoreTestingOrders';

interface CoreTypeSelectionProps {
  order: CoreTestingOrder;
  onSelectCoreType: (coreType: 'Metering' | 'PS' | 'Protection') => void;
  onBack: () => void;
}

export function CoreTypeSelection({ order, onSelectCoreType, onBack }: CoreTypeSelectionProps) {
  const [completionStatus, setCompletionStatus] = useState<Record<string, boolean>>({});
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isApproving, setIsApproving] = useState(false);

  // Helper to extract the safe ID
  const getTxnOrderId = () => (order as any).mainOrderId || (order as any).orderId?._id || (order as any)._id;

  // Helper to calculate required rows for a specific type
  const getRequiredRows = (type: string) => {
    // Priority: Granular Assignment > Total Quantity
    const validQuantity = order.assignedUnitIds?.length || order.quantity || order.transformerQuantity || 0;
    const details = order.coreDetails || order.coreConfiguration || [];

    // Count occurrences of this specific core type in the configuration
    // Note: We need to handle the PS detection logic here too to match strict counting
    const coresPerTransformer = details.filter((c: any) => {
      const cType = c.coreType || c.type;
      const isPS = cType === 'Protection' && (c.iexLimit || c.leLimit || c.class === 'PS' || (c.description && c.description.includes('PS')));

      if (type === 'PS') return isPS || cType === 'PS';
      if (type === 'Protection') return cType === 'Protection' && !isPS;
      return cType === type;
    }).length;

    return validQuantity * coresPerTransformer;
  };

  useEffect(() => {
    const fetchCompletionStatus = async () => {
      setLoadingStatus(true);
      const statusUpdate: Record<string, boolean> = {};
      const txnOrderId = getTxnOrderId();

      if (!txnOrderId) {
        console.error("No valid order ID found for status check");
        setLoadingStatus(false);
        return;
      }

      // Determine unique types present
      const details = order.coreDetails || order.coreConfiguration || [];
      const uniqueTypes = Array.from(new Set(details.map((c: any) => {
        const type = c.coreType || c.type;
        if (type === 'Protection' && (c.iexLimit || c.leLimit || c.class === 'PS' || (c.description && c.description.includes('PS')))) {
          return 'PS';
        }
        return type;
      })));

      try {
        await Promise.all(uniqueTypes.map(async (type) => {
          const isMetering = type === 'Metering';
          const endpoint = isMetering ? '/metering-tests' : '/protection-tests';
          const typeParam = !isMetering ? `?type=${type}` : '';


          try {
            const res = await axios.get(`http://localhost:5000/api${endpoint}/${txnOrderId}${typeParam}`, {
              withCredentials: true
            });

            const savedData = res.data;
            let savedCount = 0;

            if (savedData && savedData.readings) {
              // GRANULAR COMPLETION CHECK
              // 1. Get Assigned Transformer Indices
              const assignedParams = (order as any).assignedUnitIds || (order as any).order?.assignedUnitIds;

              if (assignedParams && assignedParams.length > 0) {
                // Start granular check
                const assignedIndices = assignedParams.map((id: string) => {
                  const match = id.match(/[/\-](\d+)$/);
                  return match ? parseInt(match[1]) : null;
                }).filter((n: any) => n !== null);

                // 2. Determine Cores Per Transformer (for ID generation logic)
                const coresPerTransformer = details.filter((c: any) => {
                  const cType = c.coreType || c.type;
                  const isPS = cType === 'Protection' && (c.iexLimit || c.leLimit || c.class === 'PS' || (c.description && c.description.includes('PS')));
                  if (type === 'PS') return isPS || cType === 'PS';
                  if (type === 'Protection') return cType === 'Protection' && !isPS;
                  return cType === type;
                }).length || 1;

                // 3. Generate Expected IDs for THIS user
                const jobSuffix = order?.jobId?.split('-').pop() ?? '000';
                const upperType = (type as string).toUpperCase();
                let prefix = 'P';
                if (upperType === 'METERING') prefix = 'M';
                else if (upperType.includes('PS')) prefix = 'PS';

                const expectedIds = new Set<string>();

                assignedIndices.forEach((k: number) => {
                  const startSeq = (k - 1) * coresPerTransformer + 1;
                  for (let j = 0; j < coresPerTransformer; j++) {
                    const seqNum = startSeq + j;
                    const genId = `${prefix}-${jobSuffix}-${String(seqNum).padStart(3, '0')}`;
                    expectedIds.add(genId);
                  }
                });

                // 4. Count only readings that match Expected IDs
                const completedRows = savedData.readings.filter((r: any) =>
                  (r.result || r.remark) && expectedIds.has(r.internalCoreNo)
                ).length;

                savedCount = completedRows;

              } else {
                // Fallback to legacy total count
                const completedRows = savedData.readings.filter((r: any) => r.result || r.remark).length;
                savedCount = completedRows;
              }
            }

            const required = getRequiredRows(type as string);
            // Mark as complete if we have enough saved, completed rows
            statusUpdate[type as string] = savedCount >= required && required > 0;

          } catch (err) {
            console.warn(`Failed to fetch status for ${type}`, err);
            statusUpdate[type as string] = false;
          }
        }));

        setCompletionStatus(statusUpdate);
      } catch (error) {
        console.error("Error checking core status:", error);
      } finally {
        setLoadingStatus(false);
      }
    };

    fetchCompletionStatus();
  }, [order]);

  const handleGlobalApprove = async () => {
    if (!window.confirm("Are you sure you want to approve this order? This will move it to the Secondary stage.")) {
      return;
    }

    setIsApproving(true);
    const txnOrderId = getTxnOrderId();

    try {
      const response = await axios.put(`http://localhost:5000/api/core-tests/approve/${txnOrderId}`, {}, { withCredentials: true });

      if (response.status === 200) {
        alert("Order approved successfully! Moving to Secondary stage.");
        onBack(); // Return to dashboard
      }
    } catch (error: any) {
      console.error("Approval failed:", error);
      alert(error.response?.data?.message || "Failed to approve order.");
    } finally {
      setIsApproving(false);
    }
  };

  const getCoreTypeIcon = (type: string) => {
    switch (type) {
      case 'Metering': return <Zap className="w-5 h-5" />;
      case 'PS': return <Shield className="w-5 h-5" />;
      case 'Protection': return <AlertTriangle className="w-5 h-5" />;
      default: return null;
    }
  };

  const getCoreTypeColor = (type: string) => {
    switch (type) {
      case 'Metering':
        return {
          bg: 'bg-purple-50',
          text: 'text-purple-700',
          border: 'border-purple-200',
          button: 'bg-purple-600 hover:bg-purple-700',
        };
      case 'PS':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          button: 'bg-blue-600 hover:bg-blue-700',
        };
      case 'Protection':
        return {
          bg: 'bg-orange-50',
          text: 'text-orange-700',
          border: 'border-orange-200',
          button: 'bg-orange-600 hover:bg-orange-700',
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          border: 'border-gray-200',
          button: 'bg-gray-600 hover:bg-gray-700',
        };
    }
  };

  // Determine unique types for rendering
  const details = order.coreDetails || order.coreConfiguration || [];
  const uniqueTypes = Array.from(new Set(details.map((c: any) => {
    const type = c.coreType || c.type;
    if (type === 'Protection' && (c.iexLimit || c.leLimit || c.class === 'PS' || (c.description && c.description.includes('PS')))) {
      return 'PS';
    }
    return type;
  })));

  const allTypesComplete = uniqueTypes.length > 0 && uniqueTypes.every(type => completionStatus[type as string]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <Button
          variant="outline"
          onClick={onBack}
          size="sm"
          className="mb-3 gap-1"
        >
          <ArrowLeft className="w-3 h-3" />
          Back
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl">Select Test Type</h2>
            <p className="text-sm text-gray-600 mt-1">{order.jobId} - {order.clientName}</p>
          </div>
          {/* Global Approve Button - Top Right (Optional placement, but bottom is requested) */}
        </div>
      </div>

      {/* Order Summary */}
      <Card className="p-4">
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500">Transformer</p>
            <p className="text-gray-900 mt-0.5">{order.transformerName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Client</p>
            <p className="text-gray-900 mt-0.5">{order.clientName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">
              {order.assignedUnitIds?.length ? 'Assigned Qty' : 'Quantity'}
            </p>
            <p className="text-gray-900 mt-0.5">
              {order.assignedUnitIds?.length || order.quantity} units
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Deadline</p>
            <p className="text-gray-900 mt-0.5">{new Date(order.deadline).toLocaleDateString()}</p>
          </div>
        </div>
      </Card>

      {/* Core Type Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {uniqueTypes.map((type, idx) => {
          const requiredCount = getRequiredRows(type as string);
          const isComplete = completionStatus[type as string];
          const colors = getCoreTypeColor(type as string);

          return (
            <Card
              key={idx}
              className={`p-4 ${colors.bg} ${colors.border} border hover:shadow-md transition-shadow relative overflow-hidden`}
            >
              {/* Completion Badge */}
              {isComplete && (
                <div className="absolute top-0 right-0 p-2">
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Completed
                  </Badge>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={colors.text}>
                    {getCoreTypeIcon(type as string)}
                  </div>
                  <h3 className={`text-base font-medium ${colors.text}`}>
                    {type}
                  </h3>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {order.assignedUnitIds?.length ? 'Your Assigned Cores' : 'Total Cores'}
                    </span>
                    <span className="font-medium text-gray-900">
                      {requiredCount} cores
                    </span>
                  </div>
                </div>

                <Button
                  className={`w-full ${colors.button} text-white`}
                  size="sm"
                  onClick={() => onSelectCoreType(type as any)}
                >
                  {isComplete ? 'Review / Edit Testing' : 'Start Testing'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Global Action Footer */}
      <Card className="p-4 bg-gray-50 flex flex-col md:flex-row items-center justify-between gap-4 border-t-2 border-gray-100">
        <div className="text-sm text-gray-600">
          {loadingStatus ? (
            <span className="flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Checking completion status...</span>
          ) : allTypesComplete ? (
            <span className="text-green-600 font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> All core types tested. Ready for approval.
            </span>
          ) : (
            <span>Complete testing for all core types to enable approval.</span>
          )}
        </div>

        <Button
          size="lg"
          className={`gap-2 ${allTypesComplete ? 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          disabled={!allTypesComplete || isApproving}
          onClick={handleGlobalApprove}
        >
          {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Approve & Move to Secondary
        </Button>
      </Card>

      {/* Instructions */}
      {order.instructions && (
        <Card className="p-3 bg-blue-50 border-blue-200">
          <p className="text-xs text-gray-700">{order.instructions}</p>
        </Card>
      )}
    </div>
  );
}

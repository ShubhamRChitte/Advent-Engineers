import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ArrowLeft, PlayCircle, Loader2, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface CoreConfig {
  coreNumber: number;
  coreType: 'metering' | 'ps' | 'protection';
  coreId?: string;
  accuracyClass?: string | undefined;
}

export interface Transformer {
  id: string;
  name: string;
  rating: string;
  uniqueId: string;
  voltageClass: string;
  cores: CoreConfig[];
  status: 'pending' | 'in-progress' | 'completed';
  ratios: string[]; // Added dynamic ratios
  canApprove?: boolean; // New flag
  testHistory?: any;
  availableCoreIdsPool?: {
    metering: string[];
    ps: string[];
    protection: string[];
  };
  accuracyClass?: string | undefined; // Added for metering tests dynamic limits
  jobId?: string;
  clientName?: string;
  currentStage: string;
  orderId?: any; // Added for ratio fallback
  stc?: string;
  voltageRating?: string;
  burden?: number | string;
  ratedPrimaryCurrent?: number | string;
  ratedSecondaryCurrent?: number | string;
}

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
  assignedUnitIds?: string[]; // Added for granular filtering
  // Added fields for mapping
  transformerName?: string;
  ratio?: string[];
  nominalSystemVoltage?: number | string;
  coreDetails?: any[];
  stc?: string;
  burden?: number;
  voltageRating?: string;
  ratedPrimaryCurrent?: number;
  ratedSecondaryCurrent?: number;
}

interface SecondaryTransformersListProps {
  order: Order;
  onStartTest: (transformer: Transformer) => void;
  onBack: () => void;
  onRefreshOrders?: () => void; // Added
}

export function SecondaryTransformersList({ order, onStartTest, onBack, onRefreshOrders }: SecondaryTransformersListProps) {
  const [transformers, setTransformers] = useState<Transformer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransformers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const orderId = order._id;
        const response = await axios.get(`http://localhost:3002/api/orders/${orderId}/transformers`, {
          withCredentials: true
        });

        const dbTransformers = response.data;

        console.log("Fetched Transformers:", dbTransformers);

        // Map DB data + Order Specs to UI Model
        const mappedTransformers: Transformer[] = dbTransformers.map((t: any) => {
          // Determine Status
          // Logic: If currentStage is 'secondary', it's pending/in-progress. 
          // If 'primary' or 'final', it's completed for secondary.
          let status: 'pending' | 'in-progress' | 'completed' = 'pending';

          // Initial default status, will be refined below based on counts
          if (['primary', 'final', 'shipped'].includes(t.currentStage)) {
            status = 'completed';
          }

          // Build Core Config from Order Details
          // The Order has `coreDetails` array. 
          // We flatten it to a list of cores: Core 1, Core 2...
          let currentCoreNum = 1;
          const coresList: CoreConfig[] = [];
          if (order.coreDetails && Array.isArray(order.coreDetails)) {
            order.coreDetails.forEach((coreGroup: any) => {
              // Assuming coreGroup has property like count/quantity or just implies 1?
              // Looking at schema `coreDetails: [{ coreType: ... }]`. 
              // This implies each item in array is a core? 
              // OR does it imply a group? The schema line 17 says `coreDetails: [ { coreType: ... } ]`.
              // Let's assume each entry is one core for now or check quantity logic if it exists.
              // Schema check: just `coreType`. so map 1:1.
              const typeStr = (coreGroup.coreType || 'Metering').toLowerCase();
              let mappedType: 'metering' | 'ps' | 'protection' = 'metering';
              if (typeStr.includes('protection')) mappedType = 'protection';
              else if (typeStr.includes('ps')) mappedType = 'ps';

              coresList.push({
                coreNumber: currentCoreNum++,
                coreType: mappedType,
                accuracyClass: coreGroup.accuracyClass || '0.5'
              });
            });
          }

          // Fallback if no core details
          if (coresList.length === 0) {
            coresList.push({ coreNumber: 1, coreType: 'metering' });
          }
          // Check Granular Completion (STRICT COUNT)
          const secTest = t.testHistory?.secondary_test || {};

          // Count required cores by type from the config
          const requiredMeteringCount = coresList.filter(c => c.coreType === 'metering').length;
          const requiredProtectionCount = coresList.filter(c => c.coreType === 'protection').length;
          const requiredPsCount = coresList.filter(c => c.coreType === 'ps').length;

          // Count completed results (ensure arrays exist)
          const completedMeteringCount = secTest.metering_results?.length || 0;
          const completedProtectionCount = secTest.protection_results?.length || 0;
          const completedPsCount = secTest.ps_results?.length || 0;

          // Validate: Completed must correspond to Required AND be fully filled
          const checkStrictCompletion = (type: 'metering' | 'ps' | 'protection', results: any[]) => {
            if (!results || results.length === 0) return false;

            // Must have enough results to cover all cores of this type
            const requiredCount = coresList.filter(c => c.coreType === type).length;
            if (results.length < requiredCount) return false;

            // And every result must be fully filled
            if (type === 'metering') {
              return results.every((res: any) =>
                res.rows && res.rows.length > 0 && res.rows.every((row: any) =>
                  row.r100 && row.p100 && row.r25 && row.p25
                )
              );
            } else if (type === 'protection') {
              return results.every((res: any) =>
                res.ratioError100 && res.phaseError && res.resistance &&
                (res.secondaryLimitingVoltage || res.secondaryLimitingVtg) &&
                res.excitationCurrent && res.compositeError && res.alf
              );
            } else if (type === 'ps') {
              return results.every((res: any) =>
                res.turnRatioError && res.resistance && res.vk &&
                res.vkVal && res.iexVk && res.iex11Vk
              );
            }
            return true;
          };

          const meteringDone = requiredMeteringCount === 0 || checkStrictCompletion('metering', secTest.metering_results);
          const protectionDone = requiredProtectionCount === 0 || checkStrictCompletion('protection', secTest.protection_results);
          const psDone = requiredPsCount === 0 || checkStrictCompletion('ps', secTest.ps_results);

          const canApprove = meteringDone && protectionDone && psDone && t.currentStage === 'secondary';

          // Refined Status Logic based on granular counts
          // Note: Ignoring `t.testHistory.secondary_test.status` because backend might set it prematurely.
          if (['primary', 'final', 'shipped'].includes(t.currentStage)) {
            status = 'completed';
          } else if (canApprove) {
            status = 'completed';
          } else if (completedMeteringCount > 0 || completedProtectionCount > 0 || completedPsCount > 0) {
            status = 'in-progress';
          } else {
            status = 'pending';
          }

          // --- DYNAMIC CORE ID POOL GENERATION ---
          // 1. Helper to generate ID
          const generateCoreId = (type: 'metering' | 'ps' | 'protection', seqNum: number) => {
            let prefix = 'P';
            if (type === 'metering') prefix = 'M';
            else if (type === 'ps') prefix = 'PS';

            // Extract Job Suffix
            const jobSuffix = order.jobId?.split('-').pop() ?? '000';
            return `${prefix}-${jobSuffix}-${String(seqNum).padStart(3, '0')}`;
          };

          // 2. Generate ALL possible IDs for this Order
          const totalQty = order.quantity || order.transformerQuantity || 0;
          const allMeteringIds = Array.from({ length: totalQty }, (_, i) => generateCoreId('metering', i + 1));
          const allPsIds = Array.from({ length: totalQty }, (_, i) => generateCoreId('ps', i + 1));
          const allProtectionIds = Array.from({ length: totalQty }, (_, i) => generateCoreId('protection', i + 1));

          // 3. Find IDs used by OTHER transformers (in this order)
          // Fix: Ensure we are checking the LATEST data.
          // The 'dbTransformers' variable holds the fresh data from the API response.
          // The 'transformers' state variable might be stale during the initial render or if not updated.
          // We should use 'dbTransformers' for the "used" check because that is the source of truth for THIS render cycle.

          const getUsedIds = (targetType: 'metering' | 'ps' | 'protection') => {
            const used = new Set<string>();

            // Iterate over ALL transformers from the DB response, not just the mapped ones
            dbTransformers.forEach((otherT: any) => {
              if (otherT.uniqueId === t.uniqueId) return; // Don't count self

              // Check history for this type
              const secTest = otherT.testHistory?.secondary_test || {};
              let ids: string[] = [];

              if (targetType === 'metering' && secTest.metering_results) {
                // Handle both direct ID strings and object structures (just in case)
                ids = secTest.metering_results.map((r: any) => {
                  if (typeof r === 'string') return r;
                  return r.internalCoreNo || (r.rows && r.rows[0]?.internalCoreNo);
                });
              } else if (targetType === 'ps' && secTest.ps_results) {
                ids = secTest.ps_results.map((r: any) => r.internalCoreNo);
              } else if (targetType === 'protection' && secTest.protection_results) {
                ids = secTest.protection_results.map((r: any) => r.internalCoreNo);
              }

              ids.filter(Boolean).forEach(id => used.add(id));
            });
            return used;
          };

          const usedMetering = getUsedIds('metering');
          const usedPs = getUsedIds('ps');
          const usedProtection = getUsedIds('protection');

          const availablePool = {
            metering: allMeteringIds.filter(id => !usedMetering.has(id)),
            ps: allPsIds.filter(id => !usedPs.has(id)),
            protection: allProtectionIds.filter(id => !usedProtection.has(id))
          };


          return {
            id: t._id,
            uniqueId: t.uniqueId,
            name: order.transformerName || 'Transformer',
            rating: Array.isArray(order.ratio) ? order.ratio.join('/') : (order.ratio || 'N/A'),
            voltageClass: order.nominalSystemVoltage ? `${order.nominalSystemVoltage}kV` : 'N/A',
            cores: coresList,
            status: status,
            ratios: t.ratios || (Array.isArray(order.ratio) ? order.ratio : (order.ratio ? [order.ratio] : ['N/A'])),
            canApprove,
            testHistory: t.testHistory,
            availableCoreIdsPool: availablePool,
            orderId: order._id, // explicitly passing orderId for failed core requests
            jobId: order.jobId,
            clientName: order.clientName,
            currentStage: t.currentStage,
            stc: order.stc,
            voltageRating: order.voltageRating,
            burden: order.burden,
            ratedPrimaryCurrent: order.ratedPrimaryCurrent,
            ratedSecondaryCurrent: order.ratedSecondaryCurrent,
          };
        });

        // Filter 1: Only show transformers currently in the 'secondary' stage for this view
        const activeUnitsOnly = mappedTransformers.filter((t: any) => t.currentStage === 'secondary');

        // Apply Granular Visibility Logic (Filter 2)
        // If assignedUnitIds is present, filter.
        const filtered = (!order.assignedUnitIds || order.assignedUnitIds.length === 0)
          ? activeUnitsOnly
          : activeUnitsOnly.filter(t => order.assignedUnitIds?.some(assignedId =>
            assignedId === t.uniqueId || assignedId.includes(t.uniqueId)
          ));

        setTransformers(filtered);
      } catch (err: any) {
        console.error("Error fetching transformers:", err);
        setError("Failed to load transformers. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (order && order._id) {
      fetchTransformers();
    }
  }, [order]);


  const handleApproveTransformer = async (transformer: Transformer) => {
    try {
      if (!confirm(`Are you sure you want to approve Transformer ${transformer.uniqueId} and move it to Primary Testing?`)) return;

      const response = await axios.put(`http://localhost:3002/api/transformers/${transformer.uniqueId}/approve-stage`, {
        stage: 'secondary',
        nextStage: 'primary'
      }, { withCredentials: true });

      if (response.data.success) {
        toast.success("Transformer Approved successfully!");
        // Refresh the parent's orders list
        if (onRefreshOrders) onRefreshOrders();

        // Refresh or update local state
        setTransformers(prev => prev.map(t =>
          t.uniqueId === transformer.uniqueId ? { ...t, status: 'completed' } : t
        ));
      }
    } catch (err) {
      console.error("Approval failed", err);
      toast.error("Failed to approve transformer");
    }
  };



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
            <p className="font-medium mt-1">{order.clientName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Transformers</p>
            <p className="font-medium mt-1">
              {order.assignedUnitIds ? (
                <span className="text-blue-600">Assigned: {order.assignedUnitIds.length}</span>
              ) : (
                <span>{order.quantity || order.transformerQuantity}</span>
              )}
              <span className="text-gray-400 text-xs ml-1">
                / Total: {order.quantity || order.transformerQuantity}
              </span>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Assigned Date</p>
            {/* <p className="font-medium mt-1">{new Date(order.assignedDate).toLocaleDateString()}</p> */}
            <p className="font-medium mt-1">
              {order.deadline && !isNaN(new Date(order.deadline).getTime())
                ? new Date(order.deadline).toLocaleDateString('en-GB') // Results in DD/MM/YYYY
                : "Select Date"}
            </p>
          </div>
        </div>
      </Card>

      {/* Transformers Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading transformers...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            {error}
            <Button variant="link" onClick={() => window.location.reload()}>Retry</Button>
          </div>
        ) : transformers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No transformers found for this order.
          </div>
        ) : (
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

                        {transformer.cores.map((core) => {
                          const results = transformer.testHistory?.secondary_test?.[`${core.coreType}_results`] || [];

                          // Improved Completion Logic (Matching SecondaryCoreSelection.tsx)
                          // 1. Identify the applicable Core ID
                          const typeCores = transformer.cores.filter(c => c.coreType === core.coreType);
                          const typeIndex = typeCores.findIndex(c => c.coreNumber === core.coreNumber);
                          const expectedId = transformer.availableCoreIdsPool?.[core.coreType]?.[typeIndex];
                          const suffix = `-${String(core.coreNumber).padStart(3, '0')}`;
                          const typeSeq = typeIndex + 1;
                          const typeSuffix = `-${String(typeSeq).padStart(3, '0')}`;

                          // Find ALL results that belong to this Core (by ID matching)
                          const coreResults = results.filter((r: any) => {
                            const id = r.internalCoreNo || r.coreId || '';
                            return (expectedId && id === expectedId) ||
                              id.endsWith(suffix) || id.includes(suffix) ||
                              id.endsWith(typeSuffix) || id.includes(typeSuffix);
                          });

                          // 2. Strict Check: Are there results AND are they fully filled?
                          let isCompleted = false;
                          if (coreResults.length > 0) {
                            if (core.coreType === 'metering') {
                              isCompleted = coreResults.every((res: any) =>
                                res.rows && res.rows.length > 0 && res.rows.every((row: any) =>
                                  row.r100 && row.p100 && row.r25 && row.p25
                                )
                              );
                            } else if (core.coreType === 'protection') {
                              isCompleted = coreResults.every((res: any) =>
                                res.ratioError100 && res.phaseError && res.resistance &&
                                (res.secondaryLimitingVoltage || res.secondaryLimitingVtg) &&
                                res.excitationCurrent && res.compositeError && res.alf
                              );
                            } else if (core.coreType === 'ps') {
                              isCompleted = coreResults.every((res: any) =>
                                res.turnRatioError && res.resistance && res.vk &&
                                res.vkVal && res.iexVk && res.iex11Vk
                              );
                            }
                          }

                          return (
                            <Badge
                              key={core.coreNumber}
                              className={`${isCompleted
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : getCoreTypeColor(core.coreType)} text-xs transition-colors duration-300`}
                            >
                              {isCompleted && <CheckCircle className="w-3 h-3 mr-1 inline-block" />}
                              Core {core.coreNumber}: {getCoreTypeLabel(core.coreType)}
                            </Badge>
                          );
                        })}
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
                          className={transformer.status === 'completed' ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}
                          disabled={false} // Always allow viewing
                        >
                          {transformer.status === 'completed' ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" /> View Report
                            </>
                          ) : (
                            <>
                              <PlayCircle className="w-4 h-4 mr-2" />
                              {transformer.status === 'pending' ? 'Start Test' : 'Continue Test'}
                            </>
                          )}
                        </Button>

                        {transformer.canApprove && (
                          <Button
                            size="sm"
                            className="ml-2 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleApproveTransformer(transformer)}
                          >
                            Approve
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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


import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ArrowLeft, PlayCircle, Loader2, FileText } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

// Core configuration
interface CoreConfig {
  coreNumber: number;
  coreType: 'metering' | 'ps' | 'protection';
  coreId: string;
  accuracyClass?: string | undefined;
}

export interface Transformer {
  id: string; // internal DB ID
  orderId?: string; // Add orderId to support failure reporting
  uniqueId: string; // TR-JOB-...
  name: string;
  rating: string;
  ratios: string[]; // Added ratios array
  voltageClass: string;
  cores: CoreConfig[];
  status: 'pending' | 'in-progress' | 'completed';
  canApprove: boolean;
  testHistory?: any;
  currentStage: string;
  stc?: string;
  voltageRating?: string;
  burden?: string;
  ratedPrimaryCurrent?: string;
  ratedSecondaryCurrent?: string;
  clientName?: string;
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
  assignedUnitIds?: string[];
  transformerName?: string;
  ratio?: string[];
  nominalSystemVoltage?: number | string;
  coreDetails?: any[];
  accuracyClass?: string;
}

interface AfterPrimaryTransformersListProps {
  order: Order;
  onStartTest: (transformer: Transformer) => void;
  onBack: () => void;
}

export function AfterPrimaryTransformersList({ order, onStartTest, onBack }: AfterPrimaryTransformersListProps) {
  const [transformers, setTransformers] = useState<Transformer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransformers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const orderId = order._id;
        const response = await axios.get(`http://localhost:5000/api/orders/${orderId}/transformers`, {
          withCredentials: true
        });

        const dbTransformers = response.data;

        // Map DB data + Order Specs to UI Model
        const mappedTransformers: Transformer[] = dbTransformers.map((t: any) => {
          // --- Core Configuration & IDs ---
          let currentCoreNum = 1;
          const coresList: CoreConfig[] = [];

          // Helper to get real ID from Secondary History
          const secTest = t.testHistory?.secondary_test || {};

          // Flatten secondary results for easy lookup
          const meteringResults = secTest.metering_results || [];
          const psResults = secTest.ps_results || [];
          const protectionResults = secTest.protection_results || [];

          // Counters for indexing into results
          let mIndex = 0, psIndex = 0, pIndex = 0;

          if (Array.isArray(order.coreDetails) && order.coreDetails.length > 0) {
            order.coreDetails.forEach((coreGroup: any) => {
              const typeStr = (coreGroup.coreType || 'Metering').toLowerCase();
              let mappedType: 'metering' | 'ps' | 'protection' = 'metering';

              if (typeStr.includes('protection')) mappedType = 'protection';
              else if (typeStr.includes('ps')) mappedType = 'ps';

              // Try to find the real ID from secondary results
              let coreId = 'Pending';
              let accuracyClass = '0.5'; // fallback

              if (mappedType === 'metering') {
                if (mIndex < meteringResults.length) {
                  const res = meteringResults[mIndex];
                  // Result might be object with internalCoreNo or string/other structure depending on save format
                  coreId = res.internalCoreNo || (res.rows && res.rows[0]?.internalCoreNo) || 'M-Pending';
                  accuracyClass = res.accuracyClass || res.classOption || '0.5';
                  mIndex++;
                }

                // If still not found or default, check coreDetails in Order
                if (coreId === 'Pending' || accuracyClass === '0.5') {
                  const coreDetail = order.coreDetails?.[currentCoreNum - 1];
                  if (coreDetail && coreDetail.accuracyClass) {
                    accuracyClass = coreDetail.accuracyClass;
                  }
                }
              } else if (mappedType === 'ps') {
                if (psIndex < psResults.length) {
                  const res = psResults[psIndex];
                  coreId = res.internalCoreNo || 'PS-Pending';
                  psIndex++;
                }
                const coreDetail = order.coreDetails?.[currentCoreNum - 1];
                if (coreDetail && coreDetail.accuracyClass) {
                  accuracyClass = coreDetail.accuracyClass;
                }
              } else { // This is the 'protection' case
                if (pIndex < protectionResults.length) {
                  const res = protectionResults[pIndex];
                  coreId = res.internalCoreNo || 'P-Pending';
                  pIndex++;
                }
                const coreDetail = order.coreDetails?.[currentCoreNum - 1];
                if (coreDetail && coreDetail.accuracyClass) {
                  accuracyClass = coreDetail.accuracyClass;
                }

                // Fallback: If still not found, try extracting from the main Order's accuracyClass string
                if (accuracyClass === 'N/A' || !accuracyClass || accuracyClass === '0.5') { // Check if accuracyClass is still default or undefined
                  const orderClass = order.accuracyClass || ''; // Use order.accuracyClass
                  // Simple extraction for common Metering classes
                  if (orderClass.includes('0.2S')) accuracyClass = '0.2S';
                  else if (orderClass.includes('0.5S')) accuracyClass = '0.5S';
                  else if (orderClass.includes('0.2')) accuracyClass = '0.2';
                  else if (orderClass.includes('0.5')) accuracyClass = '0.5';
                  else if (orderClass.includes('0.1')) accuracyClass = '0.1';
                  else if (orderClass.includes('1')) accuracyClass = '1';
                }
              }

              coresList.push({
                coreNumber: currentCoreNum++,
                coreType: mappedType,
                coreId: coreId,
                accuracyClass: accuracyClass || '0.5'
              });
            });
          }

          // Fallback if no core details (should satisfy basic view)
          if (coresList.length === 0) {
            coresList.push({ coreNumber: 1, coreType: 'metering', coreId: 'M-Default' });
          }

          let status: 'pending' | 'in-progress' | 'completed' = 'pending';

          const checkCompleteness = () => {
            const primaryTest = t.testHistory?.primary_test || {};

            if (coresList.length === 0) return primaryTest.status === 'Completed';

            return coresList.every(core => {
              if (core.coreType === 'metering') {
                const results = primaryTest.metering_results?.filter((r: any) =>
                  r.coreId === core.coreId || r.internalCoreNo === core.coreId
                );
                if (!results || results.length === 0) return false;

                // Use strict check against empty string to allow '0' or 0
                return results.every((res: any) =>
                  Array.isArray(res.rows) && res.rows.length > 0 && res.rows.every((row: any) =>
                    row.r100 !== '' && row.p100 !== '' && row.r25 !== '' && row.p25 !== '' &&
                    row.r100 !== undefined && row.p100 !== undefined && row.r25 !== undefined && row.p25 !== undefined
                  )
                );
              } else if (core.coreType === 'ps') {
                const results = primaryTest.ps_results?.filter((r: any) =>
                  r.coreId === core.coreId || r.internalCoreNo === core.coreId
                );
                if (!results || results.length === 0) return false;

                return results.every((res: any) =>
                  res.turnRatioError !== '' && res.resistance !== '' && res.vk !== '' && 
                  res.iexVk !== '' && res.iex11Vk !== '' &&
                  res.turnRatioError !== undefined && res.resistance !== undefined && 
                  res.vk !== undefined && res.iexVk !== undefined && res.iex11Vk !== undefined
                );
              } else if (core.coreType === 'protection') {
                const results = primaryTest.protection_results?.filter((r: any) =>
                  r.coreId === core.coreId || r.internalCoreNo === core.coreId
                );
                if (!results || results.length === 0) return false;

                return results.every((res: any) =>
                  res.ratioError100 !== '' && res.phaseError !== '' && res.resistance !== '' &&
                  (res.secondaryLimitingVoltage !== '' || res.secondaryLimitingVtg !== '' || res.secondaryLimitingVoltage !== undefined || res.secondaryLimitingVtg !== undefined) &&
                  res.excitationCurrent !== '' && res.compositeError !== '' && res.alf !== '' &&
                  res.ratioError100 !== undefined && res.phaseError !== undefined && res.resistance !== undefined &&
                  res.excitationCurrent !== undefined && res.compositeError !== undefined && res.alf !== undefined
                );
              }
              return true;
            });
          };

          const isFullyComplete = checkCompleteness();

          if (t.currentStage === 'primary') {
            const primTest = t.testHistory?.primary_test || {};
            if (isFullyComplete) status = 'completed';
            else if (
              (primTest.metering_results && primTest.metering_results.length > 0) ||
              (primTest.protection_results && primTest.protection_results.length > 0) ||
              (primTest.ps_results && primTest.ps_results.length > 0)
            ) {
              status = 'in-progress';
            }
          } else if (['final', 'shipped'].includes(t.currentStage)) {
            status = 'completed';
          }

          // Can Approve logic?
          // Allow approval if status is 'completed' (locally) AND currentStage is 'primary'
          const canApprove = status === 'completed' && t.currentStage === 'primary';

          return {
            id: t._id,
            orderId: order._id,
            uniqueId: t.uniqueId,
            name: order.transformerName || 'Transformer',
            rating: Array.isArray(order.ratio) ? order.ratio.join('/') : (order.ratio || 'N/A'),
            ratios: Array.isArray(order.ratio) ? order.ratio : [],
            voltageClass: order.nominalSystemVoltage ? `${order.nominalSystemVoltage}kV` : 'N/A',
            cores: coresList,
            status: status,
            canApprove,
            testHistory: t.testHistory,
            currentStage: t.currentStage,
            stc: (t as any).stc || (order as any).stc || 'N/A',
            voltageRating: (order as any).nominalSystemVoltage || '33',
            burden: (order as any).burden || '30',
            ratedPrimaryCurrent: (order as any).ratedPrimaryCurrent || (order.ratio && order.ratio[0] ? order.ratio[0].split('/')[0] : '800'),
            ratedSecondaryCurrent: (order as any).ratedSecondaryCurrent || (order.ratio && order.ratio[0] ? order.ratio[0].split('/')[1] : '1'),
            clientName: order.clientName || 'N/A'
          };
        });

        // Filter by assignedUnitIds
        const filtered = (!order.assignedUnitIds || order.assignedUnitIds.length === 0)
          ? mappedTransformers
          : mappedTransformers.filter(t => order.assignedUnitIds?.some(assignedId =>
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
      if (!confirm(`Are you sure you want to approve Transformer ${transformer.uniqueId} and move it to Heating?`)) return;

      const response = await axios.put(`http://localhost:5000/api/transformers/${transformer.uniqueId}/approve-stage`, {
        stage: 'primary',
        nextStage: 'heating'
      }, { withCredentials: true });

      if (response.data.success) {
        toast.success("Transformer Approved to Heating Stage!");
        setTransformers(prev => prev.map(t =>
          t.uniqueId === transformer.uniqueId ? { ...t, status: 'completed', canApprove: false } : t
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
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-semibold italic">Order Date</p>
            <p className="font-medium mt-1">
              {order.createdAt && !isNaN(new Date(order.createdAt).getTime()) 
                ? new Date(order.createdAt).toLocaleDateString('en-GB') 
                : (order.assignedDate && !isNaN(new Date(order.assignedDate).getTime()) 
                    ? new Date(order.assignedDate).toLocaleDateString('en-GB') 
                    : (order.deadline && !isNaN(new Date(order.deadline).getTime())
                        ? new Date(order.deadline).toLocaleDateString('en-GB')
                        : 'N/A'))}
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
                  <th className="text-left p-4 text-sm">Core Details</th>
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
                          onClick={() => {
                            if (transformer.status === 'completed') {
                              window.location.href = `/admin/report/${transformer.id}?type=primary`;
                            } else {
                              onStartTest(transformer);
                            }
                          }}
                          className={transformer.status === 'completed' ? "bg-green-600 hover:bg-green-700 font-medium" : "bg-blue-600 hover:bg-blue-700"}
                          disabled={false}
                        >
                          {transformer.status === 'completed' ? (
                            <>
                              <FileText className="w-4 h-4 mr-2" /> View Report
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

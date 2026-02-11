import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ArrowLeft, PlayCircle, Loader2, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

// Core configuration
interface CoreConfig {
  coreNumber: number;
  coreType: 'metering' | 'ps' | 'protection';
  coreId: string; // Generated Core ID (e.g., M-001-001)
}

export interface AfterPrimaryTransformer {
  id: string; // internal DB ID
  uniqueId: string; // TR-JOB-...
  name: string;
  rating: string;
  ratios: string[]; // Added ratios array
  voltageClass: string;
  cores: CoreConfig[];
  status: 'pending' | 'in-progress' | 'completed';
  canApprove: boolean;
  testHistory?: any;
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
}

interface AfterPrimaryTransformersListProps {
  order: Order;
  onStartTest: (transformer: AfterPrimaryTransformer) => void;
  onBack: () => void;
}

export function AfterPrimaryTransformersList({ order, onStartTest, onBack }: AfterPrimaryTransformersListProps) {
  const [transformers, setTransformers] = useState<AfterPrimaryTransformer[]>([]);
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

        // Map DB data + Order Specs to UI Model
        const mappedTransformers: AfterPrimaryTransformer[] = dbTransformers.map((t: any) => {
          // --- Status Logic for Primary Testing ---
          // 1. If stage is beyond 'primary' (i.e. 'final', 'shipped'), it's completed.
          // 2. If primary_test.status is 'Completed', it's completed.
          // 3. If partial results, 'in-progress'.

          let status: 'pending' | 'in-progress' | 'completed' = 'pending';
          const primTest = t.testHistory?.primary_test || {};

          const isStageCompleted = ['final', 'shipped'].includes(t.currentStage);
          const isTestCompleted = primTest.status === 'Completed';

          if (isStageCompleted || isTestCompleted) {
            status = 'completed';
          } else if (
            (primTest.metering_results && primTest.metering_results.length > 0) ||
            (primTest.protection_results && primTest.protection_results.length > 0) ||
            (primTest.ps_results && primTest.ps_results.length > 0)
          ) {
            status = 'in-progress';
          }

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

          if (order.coreDetails && Array.isArray(order.coreDetails)) {
            order.coreDetails.forEach((coreGroup: any) => {
              const typeStr = (coreGroup.coreType || 'Metering').toLowerCase();
              let mappedType: 'metering' | 'ps' | 'protection' = 'metering';

              if (typeStr.includes('protection')) mappedType = 'protection';
              else if (typeStr.includes('ps')) mappedType = 'ps';

              // Try to find the real ID from secondary results
              let coreId = 'Pending';

              if (mappedType === 'metering') {
                if (mIndex < meteringResults.length) {
                  const res = meteringResults[mIndex];
                  // Result might be object with internalCoreNo or string/other structure depending on save format
                  coreId = res.internalCoreNo || (res.rows && res.rows[0]?.internalCoreNo) || 'M-Pending';
                  mIndex++;
                }
              } else if (mappedType === 'ps') {
                if (psIndex < psResults.length) {
                  const res = psResults[psIndex];
                  coreId = res.internalCoreNo || 'PS-Pending';
                  psIndex++;
                }
              } else {
                if (pIndex < protectionResults.length) {
                  const res = protectionResults[pIndex];
                  coreId = res.internalCoreNo || 'P-Pending';
                  pIndex++;
                }
              }

              coresList.push({
                coreNumber: currentCoreNum++,
                coreType: mappedType,
                coreId: coreId
              });
            });
          }

          // Fallback if no core details (should satisfy basic view)
          if (coresList.length === 0) {
            coresList.push({ coreNumber: 1, coreType: 'metering', coreId: 'M-Default' });
          }

          // Can Approve logic?
          // Allow approval if status is 'completed' (locally) AND currentStage is 'primary'
          const canApprove = status === 'completed' && t.currentStage === 'primary';

          return {
            id: t._id,
            uniqueId: t.uniqueId,
            name: order.transformerName || 'Transformer',
            rating: Array.isArray(order.ratio) ? order.ratio.join('/') : (order.ratio || 'N/A'),
            ratios: Array.isArray(order.ratio) ? order.ratio : [],
            voltageClass: order.nominalSystemVoltage ? `${order.nominalSystemVoltage}kV` : 'N/A',
            cores: coresList,
            status: status,
            canApprove,
            testHistory: t.testHistory
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

  const handleApproveTransformer = async (transformer: AfterPrimaryTransformer) => {
    try {
      if (!confirm(`Are you sure you want to approve Transformer ${transformer.uniqueId} and move it to Final Testing?`)) return;

      const response = await axios.put(`http://localhost:3002/api/transformers/${transformer.uniqueId}/approve-stage`, {
        stage: 'primary',
        nextStage: 'final'
      }, { withCredentials: true });

      if (response.data.success) {
        toast.success("Transformer Approved to Final Stage!");
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
            <p className="text-sm text-gray-500">Assigned Date</p>
            <p className="font-medium mt-1">
              {order.deadline && !isNaN(new Date(order.deadline).getTime())
                ? new Date(order.deadline).toLocaleDateString('en-GB')
                : "N/A"}
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
                          onClick={() => onStartTest(transformer)}
                          className={transformer.status === 'completed' ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}
                          disabled={false}
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

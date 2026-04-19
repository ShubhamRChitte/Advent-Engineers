import { useState, useEffect } from 'react'; // React removed to fix unused warning
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ArrowLeft, PlayCircle, Loader2, FileText } from 'lucide-react';
import axios from 'axios';

interface CoreConfig {
  coreNumber: number;
  coreType: 'metering' | 'ps' | 'protection';
  coreId?: string;
  accuracyClass?: string;
}

export interface FinalTransformer {
  id: string;
  uniqueId: string;
  name: string;
  rating: string;
  voltageClass: string;
  cores: CoreConfig[];
  status: 'pending' | 'in-progress' | 'completed';
  ratios: string[];
  testHistory?: any;
  jobId?: string;
  clientName?: string;
  orderId?: any;
  currentStage: string;
  stc?: string;
  voltageRating?: string;
  burden?: string;
  ratedPrimaryCurrent?: string;
  ratedSecondaryCurrent?: string;
}

interface Order {
  _id: string;
  jobId: string;
  client?: string;
  transformerCount?: number;
  assignedDate: string;
  status: string;
  priority: string;
  assignedUnitIds?: string[]; // Granular filtering
  transformerName?: string;
  ratio?: string[];
  nominalSystemVoltage?: number | string;
  coreDetails?: any[];
  clientName?: string;
  quantity?: number;
  transformerQuantity?: number;
}

interface FinalTransformersListProps {
  order: Order;
  onStartTest: (transformer: FinalTransformer) => void;
  onBack: () => void;
  onApprove: (transformer: FinalTransformer) => void;
}

export function FinalTransformersList({ order, onStartTest, onBack, onApprove }: FinalTransformersListProps) {
  const [transformers, setTransformers] = useState<FinalTransformer[]>([]);
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
        const mappedTransformers: FinalTransformer[] = dbTransformers.map((t: any) => {
          let status: 'pending' | 'in-progress' | 'completed' = 'pending';

          if (t.currentStage === 'final') {
            if (t.testHistory?.final_test?.status === 'Completed') status = 'completed';
            else if (t.testHistory?.final_test?.status === 'Pending' && t.testHistory?.final_test?.tester) status = 'in-progress';
          } else if (t.currentStage === 'shipped') {
            status = 'completed';
          }

          // Helper to get real ID from Secondary History
          const secTest = t.testHistory?.secondary_test || {};
          const meteringResults = secTest.metering_results || [];
          const psResults = secTest.ps_results || [];
          const protectionResults = secTest.protection_results || [];

          let currentCoreNum = 1;
          // Track indices to find next available result of each type
          let mIndex = 0;
          let psIndex = 0;
          let pIndex = 0;

          const coresList: CoreConfig[] = [];
          if (order.coreDetails && Array.isArray(order.coreDetails)) {
            order.coreDetails.forEach((coreGroup: any) => {
              const typeStr = (coreGroup.coreType || 'Metering').toLowerCase();
              let mappedType: 'metering' | 'ps' | 'protection' = 'metering';
              if (typeStr.includes('protection')) mappedType = 'protection';
              else if (typeStr.includes('ps')) mappedType = 'ps';

              let coreId = 'Pending';
              let accuracyClass = '0.5';

              // Prioritize accuracyClass from coreGroup (the new granular storage)
              if (coreGroup.accuracyClass) {
                accuracyClass = coreGroup.accuracyClass;
              } else if (mappedType === 'metering') {
                if (mIndex < meteringResults.length) {
                  const res = meteringResults[mIndex];
                  coreId = res.internalCoreNo || (res.rows && res.rows[0]?.internalCoreNo) || 'M-Pending';
                  accuracyClass = res.accuracyClass || res.classOption || '0.5';
                  mIndex++;
                }
              } else if (mappedType === 'ps') {
                if (psIndex < psResults.length) {
                  const res = psResults[psIndex];
                  coreId = res.internalCoreNo || 'PS-Pending';
                  psIndex++;
                }
              } else if (mappedType === 'protection') {
                if (pIndex < protectionResults.length) {
                  const res = protectionResults[pIndex];
                  coreId = res.internalCoreNo || 'P-Pending';
                  accuracyClass = res.protectionClass || '5P';
                  pIndex++;
                }
              }

              // Fallback: Default to '0.5' if still not found
              const fallbackClass = '0.5';

              coresList.push({
                coreNumber: currentCoreNum++,
                coreType: mappedType,
                coreId: coreId,
                accuracyClass: accuracyClass || fallbackClass
              });
            });
          }
          if (coresList.length === 0) {
            coresList.push({ coreNumber: 1, coreType: 'metering', coreId: 'M-Default', accuracyClass: '0.5' });
          }


          // New logic: Check if all critical readings are filled in testHistory
          const finalHistory = t.testHistory?.final_test || {};
          
          // Helper for non-empty string check
          const isValidValue = (val: any) => val !== undefined && val !== null && String(val).trim() !== "" && String(val) !== "N/A";

          // NEW: Completion check for "Ready for Approval"
          // Must have ALL comprehensive fields AND ALL core tests.
          const comprehensiveComplete = 
            isValidValue(finalHistory.polarityResult) && 
            isValidValue(finalHistory.hvSecondaryWinding) &&
            isValidValue(finalHistory.hvPrimaryWinding) &&
            isValidValue(finalHistory.hvBetweenCore) &&
            isValidValue(finalHistory.ovitTest) &&
            isValidValue(finalHistory.meggarPrimaryToSecondary) &&
            isValidValue(finalHistory.meggarPrimaryToEarth) &&
            isValidValue(finalHistory.meggarSecondaryToEarth) &&
            isValidValue(finalHistory.meggarCoreToCore);

          const expectedCoresCount = coresList.length;
          const meteringCores = new Set((finalHistory.metering_results || []).map((r: any) => r.internalCoreNo || r.coreId));
          const psCores = new Set((finalHistory.ps_results || []).map((r: any) => r.internalCoreNo || r.coreId));
          const protectionCores = new Set((finalHistory.protection_results || []).map((r: any) => r.internalCoreNo || r.coreId));
          const actualCoresCount = new Set([...meteringCores, ...psCores, ...protectionCores]).size;
          
          const coresComplete = actualCoresCount >= expectedCoresCount;
          
          const isFilled = comprehensiveComplete && coresComplete;
          
          // Strict completion: Must have 'Completed' status or all fields + core tests
          const isFullyComplete = finalHistory.status === 'Completed';

          if (t.currentStage === 'final') {
            if (isFullyComplete) status = 'completed';
            else if (isFilled) status = 'in-progress'; 
            else status = 'pending';
          } else if (t.currentStage === 'shipped' || t.currentStage === 'completed') {
            status = 'completed';
          } else {
            // Not yet in Final stage
            status = 'locked'; 
          }

          return {
            id: t._id,
            uniqueId: t.uniqueId,
            name: order.transformerName || 'Transformer',
            rating: Array.isArray(order.ratio) ? order.ratio.join('/') : (order.ratio || 'N/A'),
            voltageClass: order.nominalSystemVoltage ? `${order.nominalSystemVoltage}kV` : 'N/A',
            cores: coresList,
            status: status,
            isFilled: isFilled, // Pass this to UI
            ratios: t.ratios || (Array.isArray(order.ratio) ? order.ratio : [order.ratio]),
            testHistory: t.testHistory,
            orderId: order,
            currentStage: t.currentStage,
            stc: (t as any).stc || (order as any).stc || 'N/A',
            voltageRating: (order as any).nominalSystemVoltage || '33',
            burden: (order as any).burden || '30',
            ratedPrimaryCurrent: (order as any).ratedPrimaryCurrent || (order.ratio && order.ratio[0] ? order.ratio[0].split('/')[0] : '800'),
            ratedSecondaryCurrent: (order as any).ratedSecondaryCurrent || (order.ratio && order.ratio[0] ? order.ratio[0].split('/')[1] : '1'),
            clientName: order.clientName || order.client || 'N/A'
          };
        });

        // Filter: ONLY show transformers that are actually in the 'final' stage.
        // Once approved, they move to 'shipped' and will vanish from this list automatically.
        const activeUnitsOnly = mappedTransformers.filter(t => t.currentStage === 'final');
        
        // Also apply granular assignment filter if present
        const filtered = (!order.assignedUnitIds || order.assignedUnitIds.length === 0)
          ? activeUnitsOnly
          : activeUnitsOnly.filter(t => order.assignedUnitIds?.some(assignedId =>
            assignedId === t.uniqueId || assignedId.includes(t.uniqueId)
          ));

        setTransformers(filtered);
      } catch (err: any) {
        console.error("Error fetching transformers:", err);
        setError("Failed to load transformers.");
      } finally {
        setIsLoading(false);
      }
    };

    if (order && order._id) {
      fetchTransformers();
    }
  }, [order]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-700';
      case 'in-progress': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'locked': return 'bg-gray-100 text-gray-500 border-dashed';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string, currentStage: string) => {
    if (status === 'locked') return `In ${currentStage} Stage`;
    if (status === 'completed') return 'Approved';
    if (status === 'in-progress') return 'Ready for Approval';
    return 'Pending';
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
        <p className="text-gray-500 mt-1">Select a transformer to begin final testing</p>
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
            <p className="font-medium mt-1">{order.clientName || order.client}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Transformers (Assigned / Total)</p>
            <p className="font-medium mt-1">
              <span className="text-blue-600 font-bold">{transformers.length}</span>
              <span className="text-gray-400 mx-1">/</span>
              {order.quantity || order.transformerQuantity || order.transformerCount}
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
      <Card className="overflow-hidden mt-6">
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
          <div className="p-8 text-center text-gray-500 italic">
            No pending transformers for this order.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#003a70] text-white">
                <tr>
                  <th className="text-left p-4 font-semibold">Transformer Name</th>
                  <th className="text-left p-4 font-semibold">Rating</th>
                  <th className="text-left p-4 font-semibold">Unique Transformer ID</th>
                  <th className="text-left p-4 font-semibold">Voltage Class</th>
                  <th className="text-center p-4 font-semibold">Status</th>
                  <th className="text-right p-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {transformers.map((transformer) => (
                  <tr key={transformer.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium">{transformer.name}</td>
                    <td className="p-4">{transformer.rating}</td>
                    <td className="p-4 font-medium text-blue-600">{transformer.uniqueId}</td>
                    <td className="p-4">{transformer.voltageClass}</td>
                    <td className="p-4 text-center">
                      <Badge className={getStatusColor(transformer.status)}>
                        {getStatusText(transformer.status, transformer.currentStage)}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onStartTest(transformer)}
                          className="border-[#003a70] text-[#003a70] hover:bg-blue-50"
                        >
                          <PlayCircle className="w-4 h-4 mr-2" />
                          {transformer.status === 'pending' ? 'Start Test' : 'Edit / Continue'}
                        </Button>

                        {(transformer.status === 'in-progress' || transformer.isFilled) && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-md"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              onApprove(transformer);
                            }}
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
            <h4 className="mb-1">Final Testing Process</h4>
            <p className="text-sm text-gray-700">
              When you start testing, a comprehensive final test report will open containing all required
              tests: Polarity Testing, Meggar Test, H.V. Tests (on Secondary Winding, Primary Winding,
              between Core), O.V.I.T. Test, and Accuracy Test.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

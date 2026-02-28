import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ArrowLeft, PlayCircle, Loader2, CheckCircle } from 'lucide-react';
import axios from 'axios';

interface CoreConfig {
  coreNumber: number;
  coreType: 'metering' | 'ps' | 'protection';
  coreId?: string; // Optional now as per DB or legacy
}

export interface FinalTransformer {
  id: string;
  name: string;
  rating: string;
  uniqueId: string;
  voltageClass: string;
  status: 'pending' | 'in-progress' | 'completed';
  cores: CoreConfig[];
  ratios?: string[];
  testHistory?: any;
  orderId?: any;
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
        const response = await axios.get(`http://localhost:3002/api/orders/${orderId}/transformers`, {
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
              if (mappedType === 'metering') {
                if (mIndex < meteringResults.length) {
                  const res = meteringResults[mIndex];
                  // Check structure: is it flat or nested rows? Secondary logic usually flat or has internalCoreNo
                  coreId = res.internalCoreNo || (res.rows && res.rows[0]?.internalCoreNo) || 'M-Pending';
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
          if (coresList.length === 0) {
            coresList.push({ coreNumber: 1, coreType: 'metering', coreId: 'M-Default' });
          }


          // Helper to check completeness - MOVED OUTSIDE RETURN
          const checkCompleteness = () => {
            const finalTest = t.testHistory?.final_test || {};

            // If no cores defined (shouldn't happen), use strict backend status
            if (coresList.length === 0) return t.testHistory?.final_test?.status === 'Completed';

            // Check EVERY core
            return coresList.every(core => {
              if (core.coreType === 'metering') {
                const results = finalTest.metering_results?.filter((r: any) =>
                  r.coreId === core.coreId || r.internalCoreNo === core.coreId
                );
                if (!results || results.length === 0) return false;

                // Check for empty fields in rows
                return results.every((res: any) =>
                  Array.isArray(res.rows) && res.rows.every((row: any) =>
                    row.r100 && row.p100 && row.r25 && row.p25
                  )
                );

              } else if (core.coreType === 'ps') {
                const results = finalTest.ps_results?.filter((r: any) =>
                  r.coreId === core.coreId || r.internalCoreNo === core.coreId
                );
                if (!results || results.length === 0) return false;

                return results.every((res: any) =>
                  // Simple check for key fields
                  res.turnRatioError && res.resistance && res.vk && res.iexVk
                );
              }
              // Protection logic if needed...
              return true;
            });
          };

          const isFullyComplete = checkCompleteness();

          if (t.currentStage === 'final') {
            if (isFullyComplete) status = 'completed';
            else if (t.testHistory?.final_test?.tester) status = 'in-progress';
          } else if (t.currentStage === 'shipped') {
            status = 'completed';
          }

          return {
            id: t._id,
            uniqueId: t.uniqueId,
            name: order.transformerName || 'Transformer',
            rating: Array.isArray(order.ratio) ? order.ratio.join('/') : (order.ratio || 'N/A'),
            voltageClass: order.nominalSystemVoltage ? `${order.nominalSystemVoltage}kV` : 'N/A',
            cores: coresList,
            status: status,
            ratios: t.ratios || (Array.isArray(order.ratio) ? order.ratio : [order.ratio]),
            testHistory: t.testHistory,
            orderId: order
          };
        });

        const filtered = (!order.assignedUnitIds || order.assignedUnitIds.length === 0)
          ? mappedTransformers
          : mappedTransformers.filter(t => order.assignedUnitIds?.some(assignedId =>
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
      default: return 'bg-gray-100 text-gray-700';
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
            <p className="text-sm text-gray-500">Assigned Date</p>
            <p className="font-medium mt-1">{new Date(order.assignedDate).toLocaleDateString()}</p>
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
                  <th className="text-left p-4 text-sm">Unique Transformer ID</th>
                  <th className="text-left p-4 text-sm">Voltage Class</th>
                  <th className="text-left p-4 text-sm">Status</th>
                  <th className="text-center p-4 text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {transformers.map((transformer) => (
                  <tr key={transformer.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-medium">{transformer.name}</td>
                    <td className="p-4">{transformer.rating}</td>
                    <td className="p-4 font-medium text-blue-600">{transformer.uniqueId}</td>
                    <td className="p-4">{transformer.voltageClass}</td>
                    <td className="p-4">
                      <Badge className={getStatusColor(transformer.status)}>
                        {transformer.status.replace('-', ' ')}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => onStartTest(transformer)}
                          className={transformer.status === 'completed' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                          disabled={false}
                        >
                          {transformer.status === 'completed' ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              View Report
                            </>
                          ) : (
                            <>
                              <PlayCircle className="w-4 h-4 mr-2" />
                              {transformer.status === 'pending' ? 'Start Test' : 'Continue Test'}
                            </>
                          )}
                        </Button>

                        {transformer.status === 'completed' && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
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

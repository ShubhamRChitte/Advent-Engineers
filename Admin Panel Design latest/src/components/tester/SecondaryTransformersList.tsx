import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ArrowLeft, PlayCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

interface CoreConfig {
  coreNumber: number;
  coreType: 'metering' | 'ps' | 'protection';
}

export interface Transformer {
  id: string;
  name: string;
  rating: string;
  uniqueId: string;
  voltageClass: string;
  cores: CoreConfig[];
  status: 'pending' | 'in-progress' | 'completed';
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
}

interface SecondaryTransformersListProps {
  order: Order;
  onStartTest: (transformer: Transformer) => void;
  onBack: () => void;
}

export function SecondaryTransformersList({ order, onStartTest, onBack }: SecondaryTransformersListProps) {
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
          if (t.currentStage === 'secondary') {
            // Check if any secondary tests started? 
            // uniqueId check in Test Models would be ideal, but for now 'pending' is safe start.
            // If testHistory.secondary_test has status 'Completed', then completed.
            if (t.testHistory?.secondary_test?.status === 'Completed') status = 'completed';
            else if (t.testHistory?.secondary_test?.status === 'Pending' && t.testHistory?.secondary_test?.tester) status = 'in-progress';
            else status = 'pending';
          } else if (['primary', 'final', 'shipped'].includes(t.currentStage)) {
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
                coreType: mappedType
              });
            });
          }

          // Fallback if no core details
          if (coresList.length === 0) {
            coresList.push({ coreNumber: 1, coreType: 'metering' });
          }

          return {
            id: t._id,
            uniqueId: t.uniqueId,
            name: order.transformerName || 'Transformer',
            rating: Array.isArray(order.ratio) ? order.ratio.join('/') : (order.ratio || 'N/A'),
            voltageClass: order.nominalSystemVoltage ? `${order.nominalSystemVoltage}kV` : 'N/A',
            cores: coresList,
            status: status
          };
        });

        // Apply Granular Visibility Logic
        // If assignedUnitIds is present, filter.
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
            <p className="font-medium mt-1">{order._id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Client</p>
            <p className="font-medium mt-1">{order.clientName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Transformers</p>
            <p className="font-medium mt-1">{order.quantity || order.transformerQuantity}</p>
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
                        {transformer.cores.map((core) => (
                          <Badge
                            key={core.coreNumber}
                            className={`${getCoreTypeColor(core.coreType)} text-xs`}
                          >
                            Core {core.coreNumber}: {getCoreTypeLabel(core.coreType)}
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
                          className="bg-red-600 hover:bg-red-700"
                          disabled={transformer.status === 'completed'}
                        >
                          <PlayCircle className="w-4 h-4 mr-2" />
                          {transformer.status === 'pending' ? 'Start Test' :
                            transformer.status === 'in-progress' ? 'Continue Test' :
                              'View Report'}
                        </Button>
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


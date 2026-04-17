import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ArrowLeft, PlayCircle, Loader2, CheckCircle } from 'lucide-react';
import axios from 'axios';

interface CoreConfig {
  coreNumber: number;
  coreType: string;
  coreId: string;
  accuracyClass?: string;
}

export interface Transformer {
  _id: string; 
  uniqueId: string; 
  name: string;
  rating: string;
  ratios: string[]; 
  cores: CoreConfig[];
  status: 'pending' | 'in-progress' | 'completed' | 'approved';
  testHistory?: any;
  currentStage: string;
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
  coreDetails?: any[];
  accuracyClass?: string;
}

interface PTTransformersListProps {
  order: Order;
  onStartTest: (transformer: Transformer) => void;
  onBack: () => void;
}

export function PTTransformersList({ order, onStartTest, onBack }: PTTransformersListProps) {
  const [transformers, setTransformers] = useState<Transformer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransformers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const orderId = order._id;
        const response = await axios.get(`http://localhost:5000/api/transformers/order/${orderId}`, {
          withCredentials: true
        });

        const dbTransformers = response.data;

        const mappedTransformers: Transformer[] = dbTransformers.map((t: any) => {
          let currentCoreNum = 1;
          const coresList: CoreConfig[] = [];

          if (Array.isArray(order.coreDetails) && order.coreDetails.length > 0) {
            order.coreDetails.forEach((coreGroup: any) => {
              const typeStr = (coreGroup.coreType || 'Metering').toLowerCase();
              let mappedType = 'metering';
              if (typeStr.includes('protection')) mappedType = 'protection';
              
              coresList.push({
                coreNumber: currentCoreNum++,
                coreType: mappedType,
                coreId: `Core-${currentCoreNum-1}`,
                accuracyClass: coreGroup.accuracyClass || order.accuracyClass || '0.5'
              });
            });
          } else {
             coresList.push({ coreNumber: 1, coreType: 'metering', coreId: 'M-1' });
          }

          const hasPtTest = t.testHistory && t.testHistory.pt_test && Object.keys(t.testHistory.pt_test).length > 0;
          const isApproved = t.testHistory?.pt_test?.approved === true || t.testHistory?.pt_test?.approved === "true";
          const currentStatus: 'pending' | 'in-progress' | 'completed' | 'approved' = isApproved ? 'approved' : hasPtTest ? 'completed' : 'pending';

          return {
            _id: t._id,
            uniqueId: t.uniqueId,
            name: order.transformerName || 'PT Transformer',
            rating: Array.isArray(order.ratio) ? order.ratio.join('/') : (order.ratio || 'N/A'),
            ratios: Array.isArray(order.ratio) ? order.ratio : [],
            cores: coresList,
            status: currentStatus,
            testHistory: t.testHistory,
            currentStage: t.currentStage,
          };
        });

        // Filter 1: Only show active units that have not been approved yet (CT Equivalent logic)
        const activeUnitsOnly = mappedTransformers.filter(t => t.status !== 'approved');

        // Filter 2: Filter by assignedUnitIds if needed
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

    if (order && order._id) fetchTransformers();
  }, [order]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-700';
      case 'in-progress': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'approved': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleApproveTransformer = async (transformer: Transformer) => {
    try {
      if (!window.confirm(`Are you sure you want to approve Transformer ${transformer.uniqueId}?`)) return;
      await axios.put(`http://localhost:5000/api/pt-tests/transformer/${transformer._id}/approve`, {}, { withCredentials: true });
      alert("Transformer approved successfully!");
      // Update local state to reflect approval (remove from active list)
      setTransformers(prev => prev.filter(t => t._id !== transformer._id));
    } catch (e: any) {
      console.error("Error approving transformer:", e);
      alert(e.response?.data?.message || "Failed to approve transformer.");
    }
  };

  const allTestsCompleted = transformers.length > 0 && transformers.every(t => t.status === 'completed' || t.status === 'approved');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4 w-full">
          <Button variant="outline" size="sm" onClick={onBack} className="gap-2 shrink-0">
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Button>
          <div className="flex-1">
            <h2 className="text-xl font-bold">Transformers for {order.jobId}</h2>
            <p className="text-gray-500 mt-1">Select a PT unit to begin testing</p>
          </div>
        </div>
        
        {/*
        <Button onClick={printAllReports} className="bg-slate-800 text-white hover:bg-slate-900 gap-2">
            <Printer className="w-4 h-4" /> Print All Completed
        </Button>
        */}
      </div>

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
              {order.assignedDate && !isNaN(new Date(order.assignedDate).getTime())
                ? new Date(order.assignedDate).toLocaleDateString('en-GB')
                : "N/A"}
            </p>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading PT units...</span>
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
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-4 text-sm font-semibold text-gray-600">Transformer Name</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Unique ID</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Cores</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {transformers.map((transformer) => (
                  <tr key={transformer._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium">{transformer.name}</td>
                    <td className="p-4">{transformer.uniqueId}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {transformer.cores.map((core) => (
                          <Badge key={core.coreNumber} variant="outline" className="bg-gray-50 text-xs">
                            {core.coreType === 'metering' ? 'M' : 'P'} - {core.accuracyClass}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={getStatusColor(transformer.status)}>
                        {transformer.status === 'pending' ? 'Pending' : transformer.status === 'completed' ? 'Completed' : 'Approved'}
                      </Badge>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <Button
                          size="sm"
                          onClick={() => onStartTest(transformer)}
                          className={(transformer.status === 'completed' || transformer.status === 'approved') ? "bg-green-600 hover:bg-green-700 text-white" : "bg-[#003a70] hover:bg-[#002850] text-white"}
                        >
                          {(transformer.status === 'completed' || transformer.status === 'approved') ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" /> View Report
                            </>
                          ) : (
                            <>
                              <PlayCircle className="w-4 h-4 mr-2" /> Start Test
                            </>
                          )}
                        </Button>
                        
                        {transformer.status === 'completed' && (
                          <Button
                            size="sm"
                            onClick={() => handleApproveTransformer(transformer)}
                            className="bg-purple-600 hover:bg-purple-700 text-white whitespace-nowrap"
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
    </div>
  );
}

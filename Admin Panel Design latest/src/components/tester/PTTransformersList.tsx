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
  testStage?: 'pretest' | 'final';
}

export function PTTransformersList({ order, onStartTest, onBack, testStage = 'final' }: PTTransformersListProps) {
  const [transformers, setTransformers] = useState<Transformer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heatingRecords, setHeatingRecords] = useState<any[]>([]);

  const historyKey = testStage === 'pretest' ? 'pt_pretest_test' : 'pt_test';

  const checkIfPTReportIsComplete = (transformer: any, isHeatingApproved: boolean) => {
    const ptTest = transformer.testHistory?.[historyKey];

    // If no core test data at all, obviously not complete
    if (!ptTest) return false;

    // 1. Check Pre-Testing
    const preTesting = ptTest.preTesting || {};
    
    if (testStage === 'pretest') {
        let hasSavedData = false;
        Object.values(preTesting).forEach((coreData: any) => {
            if (coreData && (coreData.ratioError100 || coreData.phaseError100 || coreData.ratioError25 || coreData.phaseError25)) {
                hasSavedData = true;
            }
        });
        return hasSavedData;
    }

    // For Final Testing, check if pre-testing has at least one core filled
    const hasAnyPreTest = Object.keys(preTesting).length > 0;

    // 2. Check Final Testing (All checkpoints must be filled)
    const final = ptTest.finalTesting || {};
    const mandatoryFinalFields = [
      'leakage',
      'terminalMarking',
      'polarityTesting',
      'insulationResistance',
      'primaryToSecondary',
      'primaryToEarth',
      'secondaryToEarth',
      'hvSecondary', 
      'hvPrimary', 
      'inducedOverVoltage'
    ];
    
    // Check if fields exist and aren't just whitespace or 'N/A'
    const finalCompleted = mandatoryFinalFields.every(field => {
        const val = final[field];
        return val !== undefined && val !== null && val.toString().trim() !== '' && val.toString() !== 'N/A';
    });
    if (!finalCompleted) return false;

    // 3. Check Accuracy Test
    const accuracy = ptTest.accuracyTest || {};
    let accuracyCompleted = false;
    
    // Ensure every core has at least some accuracy data
    if (transformer.cores && transformer.cores.length > 0) {
       accuracyCompleted = transformer.cores.every((c: any) => {
           const coreData = accuracy[c.coreType] || accuracy[`${c.coreType} ${c.coreNumber}`] || accuracy[c.coreType === 'metering' ? 'metering' : `protection ${c.coreNumber}`] || accuracy[c.coreId] || accuracy['metering'];
           return coreData && Object.keys(coreData).length > 0;
       });
    } else {
       accuracyCompleted = Object.keys(accuracy).length > 0;
    }
    
    if (!accuracyCompleted) return false;

    // 4. Heating Status is no longer a blocker
    // if (!isHeatingApproved) return false;


    return true;
  };

  useEffect(() => {
    const fetchTransformersAndHeating = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const orderId = order._id;
        
        // Parallel fetch for transformers and heating records
        const [transformersRes, heatingRes] = await Promise.all([
          axios.get(`http://localhost:5001/api/transformers/order/${orderId}`, { withCredentials: true }),
          axios.get(`http://localhost:5001/api/heating-record/${orderId}/33KV_PT`, { withCredentials: true }).catch(err => {
             console.warn("No heating record found or error:", err);
             return { data: { success: false, data: { blocks: [] } } };
          })
        ]);

        const dbTransformers = transformersRes.data;
        const blocks = (heatingRes.data?.data?.blocks || heatingRes.data?.blocks || []);
        setHeatingRecords(blocks);

        const mappedTransformers: Transformer[] = dbTransformers.map((t: any) => {
          // ... (keep previous core matching logic)
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

          const hasPtTest = !!(t.testHistory && t.testHistory[historyKey] && Object.keys(t.testHistory[historyKey]).length > 0);
          
          const getTrailingNum = (str: string) => {
            const match = str?.toString().match(/(\d+)$/);
            return match ? parseInt(match[1], 10) : null;
          };
          const tNum = getTrailingNum(t.uniqueId);
          const tSuffix = t.uniqueId?.slice(-3);

          const hasHeating = blocks.some((b: any) => {
              if (!b.serialNumber) return false;
              const bSerial = b.serialNumber.toString();
              if (bSerial === t.uniqueId) return true;
              if (t.uniqueId && t.uniqueId.includes(bSerial)) return true;
              if (bSerial.includes(t.uniqueId)) return true;
              const bNum = getTrailingNum(bSerial);
              if (tNum !== null && bNum !== null && tNum === bNum) return true;
              if (tSuffix && bSerial.includes(tSuffix)) return true;
              if (tSuffix && tSuffix.includes(bSerial)) return true;
              return false;
          });

          const isApproved = t.testHistory?.[historyKey]?.approved === true || t.testHistory?.[historyKey]?.approved === "true";
          const isHeatingApproved = t.isHeatingApproved === true || t.isHeatingApproved === "true" || t.testHistory?.heating_test?.status === "Approved";
          
          let currentStatus: 'pending' | 'in-progress' | 'completed' | 'approved' = 'pending';
          if (isApproved) {
            currentStatus = 'approved';
          } else if (hasPtTest || isHeatingApproved) {
            const isComplete = checkIfPTReportIsComplete({ ...t, cores: coresList }, isHeatingApproved);
            currentStatus = isComplete ? 'completed' : 'in-progress';
          }

          return {
            _id: t._id,
            uniqueId: t.uniqueId,
            name: order.transformerName || 'PT Transformer',
            cores: coresList,
            status: currentStatus,
            hasPtTest,
            testHistory: t.testHistory
          };
        });

        // Filter: ONLY show transformers that are NOT yet approved for this stage.
        // Once approved, they should vanish from the PT Pretest list.
        const activeUnitsOnly = mappedTransformers.filter(t => t.status !== 'approved');

        const filtered = (!order.assignedUnitIds || order.assignedUnitIds.length === 0)
          ? activeUnitsOnly
          : activeUnitsOnly.filter(t => order.assignedUnitIds?.some(assignedId =>
            assignedId === t.uniqueId || assignedId.includes(t.uniqueId)
          ));

        setTransformers(filtered);
      } catch (err: any) {
        console.error("Error fetching transformers:", err);
        const detail = err.response?.data?.message || err.response?.data?.error || err.message || "";
        setError(`Failed to load transformers: ${detail}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (order && order._id) fetchTransformersAndHeating();
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
      const apiBasePath = testStage === 'pretest' ? 'pt-pretests' : 'pt-tests';
      await axios.put(`http://localhost:5001/api/${apiBasePath}/transformer/${transformer._id}/approve`, {}, { withCredentials: true });
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
            <h2 className="text-xl font-bold flex items-center gap-2">
              Transformers for {order.jobId}
              <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                H: {heatingRecords.length}
              </span>
            </h2>
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
                        {transformer.status === 'pending' ? 'Pending' : 
                         transformer.status === 'in-progress' ? 'In Progress' : 
                         transformer.status === 'completed' ? 'Completed' : 'Approved'}
                      </Badge>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <Button
                          size="sm"
                          onClick={() => onStartTest(transformer)}
                          className={(transformer.status === 'completed' || transformer.status === 'approved') ? "bg-green-600 hover:bg-green-700 text-white" : "bg-[#003a70] hover:bg-[#002850] text-white"}
                        >
                          {transformer.status === 'completed' || transformer.status === 'approved' ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" /> View Report
                            </>
                          ) : transformer.status === 'in-progress' ? (
                            <>
                              <PlayCircle className="w-4 h-4 mr-2" /> Continue Test
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
                            className="bg-purple-600 hover:bg-purple-700 text-white whitespace-nowrap shadow-md transition-all hover:scale-105"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve Unit
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

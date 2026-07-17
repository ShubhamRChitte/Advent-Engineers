import { useState, useEffect } from 'react'; // React removed to fix unused warning
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ArrowLeft, PlayCircle, Loader2, FileText } from 'lucide-react';
import axios from '@/utils/axiosConfig';
import { toast } from 'sonner';

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
  status: 'pending' | 'in-progress' | 'completed' | 'locked' | 'ready-for-approval';
  ratios: string[];
  testHistory?: any;
  jobId?: string;
  canApprove?: boolean;
  canRequestStrictApproval?: boolean;
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
  primaryCurrents?: string[];
  nominalSystemVoltage?: number | string;
  coreDetails?: any[];
  clientName?: string;
  quantity?: number;
  transformerQuantity?: number;
  voltageRating?: string;
  createdAt?: string;
  deadline?: string;
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
  const [meteringLimits, setMeteringLimits] = useState<any[]>([]);
  const [psLimits, setPsLimits] = useState<any[]>([]);
  const [protectionLimits, setProtectionLimits] = useState<any[]>([]);

  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const [mRes, psRes, pRes] = await Promise.all([
          axios.get(`/accuracy-limits/metering`, { withCredentials: true }),
          axios.get(`/accuracy-limits/ps`, { withCredentials: true }),
          axios.get(`/accuracy-limits/protection`, { withCredentials: true })
        ]);
        setMeteringLimits(mRes.data);
        setPsLimits(psRes.data);
        setProtectionLimits(pRes.data);
      } catch (err) {
        console.error("Failed to fetch limits in list view", err);
      }
    };
    fetchLimits();
  }, []);

  useEffect(() => {
    const fetchTransformers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const orderId = order._id;
        const response = await axios.get(`/orders/${orderId}/transformers`, {
          withCredentials: true
        });

        const dbTransformers = response.data;

        // Map DB data + Order Specs to UI Model
        const mappedTransformers: FinalTransformer[] = dbTransformers.map((t: any) => {
          let status: 'pending' | 'in-progress' | 'completed' | 'locked' | 'ready-for-approval' = 'pending';

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
              let accuracyClass = coreGroup.accuracyClass || '0.5';

              // Try to find the real ID from secondary results based on type
              if (mappedType === 'metering') {
                if (secTest.meteringCoreId) {
                  coreId = secTest.meteringCoreId;
                } else if (mIndex < meteringResults.length) {
                  const res = meteringResults[mIndex];
                  coreId = res.internalCoreNo || (res.rows && res.rows[0]?.internalCoreNo) || 'M-Pending';
                  // Only update accuracyClass from history if not already set by order spec
                  if (!coreGroup.accuracyClass) {
                    accuracyClass = res.accuracyClass || res.classOption || '0.5';
                  }
                  mIndex++;
                } else {
                  coreId = 'M-Pending';
                }
              } else if (mappedType === 'ps') {
                if (secTest.psCoreId) {
                  coreId = secTest.psCoreId;
                } else if (psIndex < psResults.length) {
                  const res = psResults[psIndex];
                  coreId = res.internalCoreNo || 'PS-Pending';
                  psIndex++;
                } else {
                  coreId = 'PS-Pending';
                }
              } else if (mappedType === 'protection') {
                if (secTest.protectionCoreId) {
                  coreId = secTest.protectionCoreId;
                } else if (pIndex < protectionResults.length) {
                  const res = protectionResults[pIndex];
                  coreId = res.internalCoreNo || 'P-Pending';
                  // Only update accuracyClass from history if not already set by order spec
                  if (!coreGroup.accuracyClass) {
                    accuracyClass = res.protectionClass || '5P';
                  }
                  pIndex++;
                } else {
                  coreId = 'P-Pending';
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
          
          const checkFailures = () => {
            const finalTest = t.testHistory?.final_test || {};
            return coresList.some(core => {
              const type = core.coreType;
              const results = finalTest[`${type}_results`]?.filter((r: any) =>
                r.coreId === core.coreId || r.internalCoreNo === core.coreId
              ) || [];

              if (type === 'metering') {
                return results.some((res: any) => {
                  if (!res.rows) return false;
                  const rawClass = res.accuracyClass || core.accuracyClass || '0.5';
                  const cleanClass = rawClass.toString().toUpperCase().replace(/\s+/g, '');
                  const limitConfig = meteringLimits.find((l: any) => l.accuracyClass.toString().toUpperCase().replace(/\s+/g, '') === cleanClass);

                  return res.rows.some((row: any) => {
                    if (row.r100_r_pass === false || row.r100_p_pass === false || 
                        row.r25_r_pass === false || row.r25_p_pass === false ||
                        row.r100_pass === false || row.r25_pass === false) return true;

                    const r100 = parseFloat(row.r100);
                    const p100 = parseFloat(row.p100);
                    const r25 = parseFloat(row.r25);
                    const p25 = parseFloat(row.p25);

                    if (limitConfig && row.current) {
                      const loadLimit = limitConfig.limits.find((l: any) => l.load.toString() === row.current.toString());
                      if (loadLimit) {
                        if (!isNaN(r100) && Math.abs(r100) >= (loadLimit.ratioLimit || 999)) return true;
                        if (!isNaN(p100) && Math.abs(p100) >= (loadLimit.phaseLimit || 999)) return true;
                        if (!isNaN(r25) && Math.abs(r25) >= (loadLimit.ratioLimit || 999)) return true;
                        if (!isNaN(p25) && Math.abs(p25) >= (loadLimit.phaseLimit || 999)) return true;
                      }
                    } else {
                      if (!isNaN(r100) && Math.abs(r100) > 5) return true;
                      if (!isNaN(r25) && Math.abs(r25) > 5) return true;
                    }
                    return false;
                  });
                });
              }

              if (type === 'ps') {
                return results.some((res: any) => {
                  if (res.isPass === false) return true;
                  const ratioError = parseFloat(res.turnRatioError);
                  const iexVk = parseFloat(res.iexVk);
                  const iex11Vk = parseFloat(res.iex11Vk);
                  
                  const psLimit = psLimits[0];
                  const limitRatio = psLimit?.psRatioErrorLimit ?? 0.25;
                  const limitMulti = psLimit?.psExcitationMultiplier ?? 1.5;

                  if (!isNaN(ratioError) && Math.abs(ratioError) >= limitRatio) return true;
                  if (!isNaN(iexVk) && !isNaN(iex11Vk) && (iexVk * limitMulti) < iex11Vk) return true;
                  return false;
                });
              }

              if (type === 'protection') {
                return results.some((res: any) => {
                  if (res.isPass === false) return true;
                  const ratioError = parseFloat(res.ratioError100);
                  const phaseError = parseFloat(res.phaseError);
                  const compositeError = parseFloat(res.compositeError);
                  
                  const rawClass = res.protectionClass || core.accuracyClass || '5P';
                  const cleanClass = rawClass.toString().toUpperCase().replace(/\s+/g, '');
                  const limitConfig = protectionLimits.find((l: any) => l.protectionClass.toString().toUpperCase().replace(/\s+/g, '') === cleanClass);

                  if (limitConfig) {
                    if (!isNaN(ratioError) && Math.abs(ratioError) >= (limitConfig.maxCurrentError || 999)) return true;
                    if (!isNaN(phaseError) && Math.abs(phaseError) >= (limitConfig.maxPhaseError || 999)) return true;
                    if (!isNaN(compositeError) && Math.abs(compositeError) >= (limitConfig.maxCompositeError || 999)) return true;
                  } else {
                    if (!isNaN(ratioError) && Math.abs(ratioError) > 5) return true;
                    if (!isNaN(compositeError) && Math.abs(compositeError) > 10) return true;
                  }
                  return false;
                });
              }
              return false;
            });
          };

          const hasFailures = checkFailures();
          const isFilled = comprehensiveComplete && coresComplete;
          
          // Strict completion: Must have 'Completed' status or all fields + core tests
          const isFullyComplete = finalHistory.status === 'Completed';

          if (t.currentStage === 'final') {
            if (isFullyComplete) status = 'completed';
            else if (isFilled) status = 'ready-for-approval'; 
            else if (finalHistory.status === 'In Progress' || finalHistory.tester) status = 'in-progress';
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
            rating: (() => {
              // 1. Determine Primary (Support multiple primaries like 200-400-800)
              let primary = 'N/A';
              let pArray = (order as any).primaryCurrents;
              
              // Handle possible stringified array or nested array
              if (pArray && Array.isArray(pArray) && pArray.length > 0) {
                const first = pArray[0];
                if (typeof first === 'string' && first.startsWith('[')) {
                  try {
                    const parsed = JSON.parse(first);
                    primary = Array.isArray(parsed) ? parsed.join('-') : parsed;
                  } catch (e) {
                    primary = first.replace(/[\[\]"]/g, '');
                  }
                } else {
                  primary = pArray.join('-');
                }
              } else if (order.ratio && order.ratio[0]) {
                primary = order.ratio?.[0]?.split('/')[0]?.replace(/[\[\]"]/g, '') || 'N/A';
              }
              
              // Final cleanup of primary string
              primary = primary.replace(/[\[\]"]/g, '');

              // 2. Determine Secondaries (Combine all core secondary currents)
              let secondaries: string[] = [];
              if (order.coreDetails && Array.isArray(order.coreDetails) && order.coreDetails.length > 0) {
                secondaries = order.coreDetails.map((c: any) => {
                  const val = c.secondaryCurrent || (c.ratio && c.ratio.includes('/') ? c.ratio.split('/')[1] : null);
                  return val || '1';
                });
              } else if (order.ratio && Array.isArray(order.ratio) && order.ratio.length > 0) {
                secondaries = order.ratio.map((r: string) => r.split('/')[1]).filter(s => s) as string[];
              }

              if (secondaries.length > 0) {
                return `${primary}/${secondaries.join('-')}`;
              }
              return primary !== 'N/A' ? `${primary}/1` : 'N/A';
            })(),
            voltageClass: (order.voltageRating || order.nominalSystemVoltage) 
              ? (String(order.voltageRating || order.nominalSystemVoltage).includes('kV') 
                  ? (order.voltageRating || order.nominalSystemVoltage) 
                  : `${order.voltageRating || order.nominalSystemVoltage}kV`)
              : 'N/A',
            cores: coresList,
            status: status,
            isFilled: isFilled,
            hasFailures: hasFailures,
            canRequestStrictApproval: isFilled && hasFailures && t.currentStage === 'final',
            canApprove: isFilled && !hasFailures && t.currentStage === 'final',
            ratios: t.ratios || (Array.isArray(order.ratio) ? order.ratio : [order.ratio]),
            testHistory: t.testHistory,
            orderId: order,
            currentStage: t.currentStage,
            stc: (t as any).stc || (order as any).stc || (order as any).STC || 'N/A',
            voltageRating: order.voltageRating || order.nominalSystemVoltage || '33',
            burden: (order as any).burden || t.burden || 'N/A',
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
  }, [order, meteringLimits, psLimits, protectionLimits]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-700';
      case 'in-progress': return 'bg-yellow-100 text-yellow-700';
      case 'ready-for-approval': return 'bg-green-100 text-green-700 border border-green-300';
      case 'completed': return 'bg-green-600 text-white';
      case 'locked': return 'bg-gray-100 text-gray-500 border-dashed';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string, currentStage: string) => {
    if (status === 'locked') return `In ${currentStage} Stage`;
    if (status === 'completed') return 'Approved';
    if (status === 'ready-for-approval') return 'Ready for Approval';
    if (status === 'in-progress') return 'In Progress (Draft)';
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
                          className={transformer.status === 'completed' ? "bg-green-600 hover:bg-green-700 text-white font-medium border-green-600" : "border-[#003a70] text-[#003a70] hover:bg-blue-50"}
                        >
                          {transformer.status === 'completed' ? (
                            <>
                              <FileText className="w-4 h-4 mr-2 text-white" /> View
                            </>
                          ) : (
                            <>
                              <PlayCircle className="w-4 h-4 mr-2" />
                              {transformer.status === 'pending' ? 'Start Test' : 'Edit / Continue'}
                            </>
                          )}
                        </Button>

                        {transformer.canApprove && (
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
                        {transformer.canRequestStrictApproval && (
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white font-bold shadow-md"
                            onClick={async (e: React.MouseEvent) => {
                              e.stopPropagation();
                              if (!confirm("Are you sure you want to request Strict Admin Approval for this Final test?")) return;
                              
                              let reasons: string[] = [];
                              transformer.cores.forEach(core => {
                                const type = core.coreType;
                                const results = transformer.testHistory?.final_test?.[`${type}_results`]?.filter((r: any) => 
                                  r.coreId === core.coreId || r.internalCoreNo === core.coreId
                                ) || [];
                                
                                results.forEach((res: any) => {
                                  const accClass = res.accuracyClass || res.protectionClass || core.accuracyClass || 'N/A';
                                  const coreName = `Core ${core.coreNumber} (${type.toUpperCase()})`;
                                  
                                  if (type === 'metering' && res.rows) {
                                    res.rows.forEach((row: any) => {
                                      const load = row.current || 'N/A';
                                      if (row.r100_r_pass === false) reasons.push(`${coreName} [Class ${accClass}]: 100% Ratio Error at ${load}`);
                                      if (row.r100_p_pass === false) reasons.push(`${coreName} [Class ${accClass}]: 100% Phase Error at ${load}`);
                                      if (row.r25_r_pass === false) reasons.push(`${coreName} [Class ${accClass}]: 25% Ratio Error at ${load}`);
                                      if (row.r25_p_pass === false) reasons.push(`${coreName} [Class ${accClass}]: 25% Phase Error at ${load}`);
                                    });
                                  } else if (res.isPass === false) {
                                    reasons.push(`${coreName} [Class ${accClass}]: ${res.reason || 'Limit Failure'}`);
                                  }
                                });
                              });
                              const finalReason = reasons.length > 0 ? [...new Set(reasons)].join(' | ') : "Accuracy Limits Exceeded during Final Test";

                              const extractedTypes = new Set<string>();
                              reasons.forEach(r => {
                                if (r.toLowerCase().includes('metering')) extractedTypes.add('METERING');
                                else if (r.toLowerCase().includes('protection')) extractedTypes.add('PROTECTION');
                                else if (r.toLowerCase().includes('ps')) extractedTypes.add('PS');
                              });
                              const uniqueTypes = Array.from(extractedTypes);
                              const dynamicCoreType = uniqueTypes.length === 1 ? uniqueTypes[0] : (uniqueTypes.length > 1 ? 'Multiple' : 'COMPLETE UNIT');

                              try {
                                await axios.post(`/strict-approvals/request`, {
                                  orderId: transformer.orderId?._id || transformer.orderId,
                                  jobId: order.jobId,
                                  unitId: transformer.uniqueId,
                                  clientName: order.clientName,
                                  coreType: dynamicCoreType,
                                  testType: 'Final Testing',
                                  failureReason: finalReason,
                                  testData: transformer.testHistory?.final_test,
                                  requestedBy: 'Final Tester'
                                }, { withCredentials: true });

                                await axios.put(`/transformers/${transformer.uniqueId}/approve-stage`, { 
                                  stage: 'final', 
                                  nextStage: 'admin_review' 
                                }, { withCredentials: true });

                                toast.success("Strict Approval Requested!");
                                window.location.reload();
                              } catch (err) {
                                console.error("Strict approval request failed", err);
                                toast.error("Failed to request strict approval.");
                              }
                            }}
                          >
                            Strict Approve
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

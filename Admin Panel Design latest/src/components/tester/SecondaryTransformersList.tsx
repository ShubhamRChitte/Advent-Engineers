import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ArrowLeft, PlayCircle, Loader2, CheckCircle, FileText } from 'lucide-react';
import axios from '@/utils/axiosConfig';
import { toast } from 'sonner';
import { Skeleton } from '../ui/skeleton';

interface CoreConfig {
  coreNumber: number;
  coreType: 'metering' | 'ps' | 'protection';
  coreId?: string;
  accuracyClass?: string | undefined;
}

export interface Transformer {
  _id?: string;
  id: string;
  name: string;
  rating: string;
  uniqueId: string;
  voltageClass: string;
  cores: CoreConfig[];
  status: 'pending' | 'in-progress' | 'completed';
  ratios: string[]; // Added dynamic ratios
  canApprove?: boolean; // New flag
  canRequestStrictApproval?: boolean; // Added for strict approval workflow
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
  primaryCurrents?: string[];
  fullOrder?: any;
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
  primaryCurrents?: string[];
  createdAt?: string;
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

  const fetchTransformers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const orderId = order._id;

      const [response, failedRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/orders/${orderId}/transformers`, {
          withCredentials: true
        }),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/failed-transformers?stage=SECONDARY_TESTING`, {
          withCredentials: true
        })
      ]);


      const dbTransformers = response.data;
      const failedRecords = failedRes.data.success ? failedRes.data.data : [];
      const activeFailedIds = new Set(
        failedRecords
          .filter((f: any) => f.status === 'FAILED')
          .map((f: any) => f.transformerUniqueId || f.transformerId?.uniqueId)
          .filter(Boolean)
      );

      const mappedTransformers: Transformer[] = dbTransformers.map((t: any) => {
        let status: 'pending' | 'in-progress' | 'completed' = 'pending';
        
        let currentCoreNum = 1;
        const coresList: CoreConfig[] = [];
        if (order.coreDetails && Array.isArray(order.coreDetails)) {
          order.coreDetails.forEach((coreGroup: any) => {
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

        if (coresList.length === 0) {
          coresList.push({ coreNumber: 1, coreType: 'metering' });
        }

        const secTest = t.testHistory?.secondary_test || {};
        const requiredMeteringCount = coresList.filter(c => c.coreType === 'metering').length;
        const requiredProtectionCount = coresList.filter(c => c.coreType === 'protection').length;
        const requiredPsCount = coresList.filter(c => c.coreType === 'ps').length;

        const completedMeteringCount = secTest.metering_results?.length || 0;
        const completedProtectionCount = secTest.protection_results?.length || 0;
        const completedPsCount = secTest.ps_results?.length || 0;

        const checkStrictCompletion = (type: 'metering' | 'ps' | 'protection', results: any[]) => {
          if (!results || results.length === 0) return false;
          const requiredCount = coresList.filter(c => c.coreType === type).length;
          if (results.length < requiredCount) return false;

          const isFilled = (val: any) => val !== undefined && val !== null && String(val).trim() !== '';

          if (type === 'metering') {
            return results.every((res: any) =>
              res.rows && res.rows.length > 0 && res.rows.every((row: any) =>
                isFilled(row.r100) && isFilled(row.p100) && isFilled(row.r25) && isFilled(row.p25)
              )
            );
          } else if (type === 'protection') {
            return results.every((res: any) =>
              isFilled(res.ratioError100) && isFilled(res.alf)
            );
          } else if (type === 'ps') {
            return results.every((res: any) =>
              isFilled(res.turnRatioError) && isFilled(res.resistance) && isFilled(res.vk) &&
              isFilled(res.vkVal) && isFilled(res.iexVk) && isFilled(res.iex11Vk)
            );
          }
          return true;
        };

        const meteringDone = requiredMeteringCount === 0 || checkStrictCompletion('metering', secTest.metering_results);
        const protectionDone = requiredProtectionCount === 0 || checkStrictCompletion('protection', secTest.protection_results);
        const psDone = requiredPsCount === 0 || checkStrictCompletion('ps', secTest.ps_results);

        const hasFailures = coresList.some(core => {
          const results = secTest?.[`${core.coreType}_results`] || [];
          
          if (core.coreType === 'metering') {
            return results.some((res: any) => {
              if (!res.rows) return false;
              // Clean Accuracy Class (e.g. "0.5 S" -> "0.5S")
              const rawClass = res.accuracyClass || core.accuracyClass || '0.5';
              const cleanClass = String(rawClass).toUpperCase().replace(/\s+/g, '');
              const limitConfig = meteringLimits.find(l => {
                const lClass = l.accuracyClass ? String(l.accuracyClass).toUpperCase().replace(/\s+/g, '') : '';
                return lClass === cleanClass;
              });

              return res.rows.some((row: any) => {
                // 1. Check DB pass flags explicitly
                if (row.r100_r_pass === false || row.r100_p_pass === false || 
                    row.r25_r_pass === false || row.r25_p_pass === false ||
                    row.r100_pass === false || row.r25_pass === false) return true;

                // 2. Manual Check against Limits
                const r100 = parseFloat(row.r100);
                const p100 = parseFloat(row.p100);
                const r25 = parseFloat(row.r25);
                const p25 = parseFloat(row.p25);

                if (limitConfig && row.current) {
                  const loadLimit = limitConfig.limits.find((l: any) => String(l.load) === String(row.current));
                  if (loadLimit) {
                    if (!isNaN(r100) && Math.abs(r100) >= (loadLimit.ratioLimit || 999)) return true;
                    if (!isNaN(p100) && Math.abs(p100) >= (loadLimit.phaseLimit || 999)) return true;
                    if (!isNaN(r25) && Math.abs(r25) >= (loadLimit.ratioLimit || 999)) return true;
                    if (!isNaN(p25) && Math.abs(p25) >= (loadLimit.phaseLimit || 999)) return true;
                  }
                } else {
                  // Fallback: If no limit config found but values are very high, assume fail
                  if (!isNaN(r100) && Math.abs(r100) > 5) return true;
                  if (!isNaN(r25) && Math.abs(r25) > 5) return true;
                }
                return false;
              });
            });
          }

          if (core.coreType === 'ps') {
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

          if (core.coreType === 'protection') {
            return results.some((res: any) => {
              if (res.isPass === false) return true;
              const ratioError = parseFloat(res.ratioError100);
              const phaseError = parseFloat(res.phaseError);
              const compositeError = parseFloat(res.compositeError);
              
              const rawClass = res.protectionClass || core.accuracyClass || '5P';
              const cleanClass = rawClass.toString().toUpperCase().replace(/\s+/g, '');
              const limitConfig = protectionLimits.find(l => l.protectionClass.toString().toUpperCase().replace(/\s+/g, '') === cleanClass);

              if (limitConfig) {
                if (!isNaN(ratioError) && Math.abs(ratioError) >= (limitConfig.maxCurrentError || 999)) return true;
                if (!isNaN(phaseError) && Math.abs(phaseError) >= (limitConfig.maxPhaseError || 999)) return true;
                if (!isNaN(compositeError) && Math.abs(compositeError) >= (limitConfig.maxCompositeError || 999)) return true;
              } else {
                // Fallback for Protection
                if (!isNaN(ratioError) && Math.abs(ratioError) > 5) return true;
                if (!isNaN(compositeError) && Math.abs(compositeError) > 10) return true;
              }
              return false;
            });
          }
          return false;
        });

        const canApprove = meteringDone && protectionDone && psDone && !hasFailures && t.currentStage === 'secondary';
        const canRequestStrictApproval = meteringDone && protectionDone && psDone && hasFailures && t.currentStage === 'secondary';

        if (['primary', 'final', 'shipped', 'shipped_from_factory'].includes(t.currentStage)) {
          status = 'completed';
        } else if (canApprove) {
          status = 'completed';
        } else if (completedMeteringCount > 0 || completedProtectionCount > 0 || completedPsCount > 0) {
          status = 'in-progress';
        } else {
          status = 'pending';
        }

        const generateCoreId = (type: string, seqNum: number) => {
          let prefix = type === 'metering' ? 'M' : (type === 'ps' ? 'PS' : 'P');
          const jobSuffix = order.jobId?.split('-').pop() ?? '000';
          return `${prefix}-${jobSuffix}-${String(seqNum).padStart(3, '0')}`;
        };

        const getUsedIds = (targetType: 'metering' | 'ps' | 'protection') => {
          const used = new Set<string>();
          dbTransformers.forEach((otherT: any) => {
            if (otherT.uniqueId === t.uniqueId) return; // Don't exclude IDs used by self
            const secTest = otherT.testHistory?.secondary_test || {};
            let results: any[] = [];
            if (targetType === 'metering') results = secTest.metering_results || [];
            else if (targetType === 'ps') results = secTest.ps_results || [];
            else if (targetType === 'protection') results = secTest.protection_results || [];
            
            results.forEach((r: any) => {
              const id = r.internalCoreNo || r.coreId;
              if (id) used.add(id);
            });
          });
          return used;
        };

        const totalQty = order.quantity || order.transformerQuantity || 0;
        const availablePool = {
          metering: Array.from({ length: totalQty }, (_, i) => generateCoreId('metering', i + 1)).filter(id => !getUsedIds('metering').has(id)),
          ps: Array.from({ length: totalQty }, (_, i) => generateCoreId('ps', i + 1)).filter(id => !getUsedIds('ps').has(id)),
          protection: Array.from({ length: totalQty }, (_, i) => generateCoreId('protection', i + 1)).filter(id => !getUsedIds('protection').has(id))
        };

        return {
          id: t._id,
          uniqueId: t.uniqueId,
          name: order.transformerName || 'Transformer',
          rating: (() => {
            // 1. Determine Primary (Support multiple primaries like 200-400-800)
            let primary = 'N/A';
            let pArray = order.primaryCurrents;
            
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
            } else if (order.ratedPrimaryCurrent) {
              primary = order.ratedPrimaryCurrent.toString();
            } else if (order.ratio && order.ratio[0]) {
              primary = (order.ratio[0] || '').split('/')[0]?.replace(/[\[\]"]/g, '') || '';
            }
            
            // Final cleanup of primary string
            primary = primary.replace(/[\[\]"]/g, '');

            // 2. Determine Secondaries (Combine all core secondary currents)
            let secondaries: string[] = [];
            if (order.coreDetails && Array.isArray(order.coreDetails) && order.coreDetails.length > 0) {
              secondaries = order.coreDetails.map((c: any) => {
                const val = c.secondaryCurrent || (c.ratio && c.ratio.includes('/') ? c.ratio.split('/')[1] || null : null);
                return val || '1';
              });
            } else if (order.ratio && Array.isArray(order.ratio) && order.ratio.length > 0) {
              secondaries = order.ratio.map((r: string) => r.split('/')[1] || '').filter(s => s);
            }

            if (secondaries.length > 0) {
              return `${primary}/${secondaries.join('-')}`;
            }
            return primary !== 'N/A' ? `${primary}/1` : 'N/A';
          })(),
          voltageClass: (order.voltageRating || order.nominalSystemVoltage) 
            ? `${order.voltageRating || order.nominalSystemVoltage}kV` 
            : 'N/A',
          cores: coresList,
          status: status,
          ratios: t.ratios || (Array.isArray(order.ratio) ? order.ratio : (order.ratio ? [order.ratio] : ['N/A'])),
          canApprove,
          canRequestStrictApproval,
          testHistory: t.testHistory,
          availableCoreIdsPool: availablePool,
          orderId: order._id,
          jobId: order.jobId,
          clientName: order.clientName,
          currentStage: t.currentStage,
          fullOrder: order,
          voltageRating: order.voltageRating
        };
      });

      setTransformers(
        mappedTransformers.filter(
          (t: any) => (t.currentStage === 'secondary' || t.currentStage === 'admin_review') && !activeFailedIds.has(t.uniqueId)
        )
      );
    } catch (err) {
      console.error("Failed to fetch transformers", err);
      setError("Failed to load transformers.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransformers();
  }, [order._id]);

  const handleApproveTransformer = async (transformer: Transformer) => {
    try {
      if (!confirm(`Are you sure you want to approve Transformer ${transformer.uniqueId} and move it to Primary Testing?`)) return;
      const response = await axios.put(`/transformers/${transformer.uniqueId}/approve-stage`, {
        stage: 'secondary',
        nextStage: 'primary'
      }, { withCredentials: true });
      if (response.data.success) {
        toast.success("Transformer Approved successfully!");
        if (onRefreshOrders) onRefreshOrders();
        fetchTransformers();
      }
    } catch (err) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Button>
      </div>

      <div>
        <h2 className="text-xl font-bold">Transformers for {order.jobId}</h2>
        <p className="text-gray-500 mt-1">Select a transformer to begin secondary testing</p>
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
            <p className="font-medium mt-1">{order.quantity || order.transformerQuantity}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Order Date</p>
            <p className="font-medium mt-1">
              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB') : 'N/A'}
            </p>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4"><Skeleton className="h-4 w-32" /></th>
                  <th className="text-left p-4"><Skeleton className="h-4 w-24" /></th>
                  <th className="text-left p-4"><Skeleton className="h-4 w-28" /></th>
                  <th className="text-left p-4"><Skeleton className="h-4 w-40" /></th>
                  <th className="text-left p-4"><Skeleton className="h-4 w-20" /></th>
                  <th className="text-center p-4"><Skeleton className="h-4 w-24 mx-auto" /></th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4].map((i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="p-4"><div className="flex gap-1"><Skeleton className="h-6 w-20 rounded-full" /><Skeleton className="h-6 w-20 rounded-full" /></div></td>
                    <td className="p-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                    <td className="p-4"><div className="flex justify-center"><Skeleton className="h-8 w-28" /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
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
                          <Badge key={core.coreNumber} className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                            Core {core.coreNumber}: {core.coreType}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={getStatusColor(transformer.status)}>
                        {transformer.currentStage === 'admin_review' ? 'Admin Review' : transformer.status.replace('-', ' ')}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center">
                        <Button
                          size="sm"
                          onClick={() => onStartTest(transformer)}
                          className={transformer.status === 'completed' ? "bg-green-600 hover:bg-green-700 font-medium" : "bg-blue-600 hover:bg-blue-700"}
                          disabled={transformer.currentStage === 'admin_review'}
                        >
                          {transformer.status === 'completed' ? (
                            <>
                              <FileText className="w-4 h-4 mr-2" /> View
                            </>
                          ) : (
                            <>
                              <PlayCircle className="w-4 h-4 mr-2" />
                              {transformer.status === 'pending' ? 'Start Test' : 'Continue Test'}
                            </>
                          )}
                        </Button>

                        {transformer.canApprove && (
                          <Button size="sm" className="ml-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApproveTransformer(transformer)}>Approve</Button>
                        )}
                        
                        {transformer.canRequestStrictApproval && (
                          <Button
                            size="sm"
                            className="ml-2 bg-red-600 hover:bg-red-700 text-white"
                            onClick={async () => {
                              if (!confirm("Are you sure you want to request Strict Admin Approval?")) return;
                              let reasons: string[] = [];
                              transformer.cores.forEach(core => {
                                const type = core.coreType ? core.coreType.toLowerCase() : '';
                                const results = transformer.testHistory?.secondary_test?.[`${type}_results`] || [];
                                
                                results.forEach((res: any) => {
                                  const accClass = res.accuracyClass || res.protectionClass || core.accuracyClass || 'N/A';
                                  const coreName = `Core ${core.coreNumber} (${type.toUpperCase()})`;
                                  
                                  if (type === 'metering' && res.rows) {
                                    res.rows.forEach((row: any) => {
                                      const load = row.current || 'N/A';
                                      if (row.r100_r_pass === false) {
                                        const msg = row.r100_reason ? row.r100_reason.replace('Ratio Error', 'Current Error') : `Current Error at ${load}`;
                                        reasons.push(`${coreName}: ${msg}`);
                                      }
                                      if (row.r100_p_pass === false) {
                                        const msg = row.r100_reason ? row.r100_reason.replace('Phase Error', 'Phase Error') : `Phase Error at ${load}`;
                                        reasons.push(`${coreName}: ${msg}`);
                                      }
                                      if (row.r25_r_pass === false) {
                                        const msg = row.r25_reason ? row.r25_reason.replace('Ratio Error', 'Current Error') : `Current Error at ${load}`;
                                        reasons.push(`${coreName}: ${msg}`);
                                      }
                                      if (row.r25_p_pass === false) {
                                        const msg = row.r25_reason ? row.r25_reason.replace('Phase Error', 'Phase Error') : `Phase Error at ${load}`;
                                        reasons.push(`${coreName}: ${msg}`);
                                      }
                                    });
                                  } else if (res.isPass === false) {
                                    const msg = res.reason || `Limit Failure [Class ${accClass}]`;
                                    reasons.push(`${coreName}: ${msg}`);
                                  }
                                });
                              });
                              const finalReason = reasons.length > 0 ? [...new Set(reasons)].join(' | ') : "Limits Exceeded";
                              
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
                                  orderId: order._id,
                                  jobId: order.jobId,
                                  unitId: transformer.uniqueId,
                                  clientName: order.clientName,
                                  coreType: dynamicCoreType,
                                  testType: 'Secondary Testing',
                                  failureReason: finalReason,
                                  testData: transformer.testHistory?.secondary_test,
                                  requestedBy: transformer.testHistory?.secondary_test?.tester || JSON.parse(localStorage.getItem('user') || '{}').name || 'Tester'
                                }, { withCredentials: true });

                                await axios.put(`/transformers/${transformer.uniqueId}/approve-stage`, { 
                                  stage: 'secondary', 
                                  nextStage: 'admin_review' 
                                }, { withCredentials: true });

                                toast.success("Strict Approval Requested!");
                                fetchTransformers();
                              } catch (err) {
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
    </div>
  );
}

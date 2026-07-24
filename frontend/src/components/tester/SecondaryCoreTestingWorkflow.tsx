import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, PlayCircle, CheckCircle, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from '@/utils/axiosConfig';
import { toast } from 'sonner';
import { SecondaryMeteringReport } from './SecondaryMeteringReport';
import { SecondaryPSReport } from './SecondaryPSReport';
import { SecondaryProtectionReport } from './SecondaryProtectionReport';

interface Order {
  _id: string;
  jobId: string;
  clientName: string;
  quantity: number;
  transformerQuantity?: number;
  createdAt?: string;
  assignedDate?: string;
  coreDetails?: Array<{
    coreType: 'Metering' | 'PS' | 'Protection' | string;
    accuracyClass?: string;
    secondaryCurrent?: string;
    iexLimit?: string;
    leLimit?: string;
    class?: string;
    description?: string;
  }>;
  primaryCurrents?: string[];
  ratio?: string[] | string;
  ratedSecondaryCurrent?: number | string;
  transformerName?: string;
  voltageRating?: string;
  nominalSystemVoltage?: number | string;
}

interface CoreConfig {
  coreNumber: number;
  coreType: 'metering' | 'ps' | 'protection';
  accuracyClass: string;
}

interface Transformer {
  _id: string;
  id?: string;
  uniqueId: string;
  name: string;
  rating: string;
  voltageRating?: string;
  currentStage: string;
  status: string;
  cores: CoreConfig[];
  testHistory?: {
    secondary_test?: {
      status?: string;
      tester?: string;
      timestamp?: string;
      meteringCoreId?: string;
      psCoreId?: string;
      protectionCoreId?: string;
      metering_results?: any[];
      ps_results?: any[];
      protection_results?: any[];
    };
  };
}

interface SecondaryCoreTestingWorkflowProps {
  order: Order;
  userName: string;
  onBack: () => void;
  onRefreshOrders?: () => void;
}

export function SecondaryCoreTestingWorkflow({ order, userName, onBack, onRefreshOrders }: SecondaryCoreTestingWorkflowProps) {
  const [transformers, setTransformers] = useState<Transformer[]>([]);
  const [readyStock, setReadyStock] = useState<{ metering: any[]; ps: any[]; protection: any[] }>({
    metering: [],
    ps: [],
    protection: []
  });
  const [approvedIds, setApprovedIds] = useState<{ metering: string[]; ps: string[]; protection: string[] }>({
    metering: [],
    ps: [],
    protection: []
  });
  const [loading, setLoading] = useState(true);

  // Testing Stepper State
  const [activeTestMode, setActiveTestMode] = useState<{ coreType: 'metering' | 'ps' | 'protection'; index: number } | null>(null);

  useEffect(() => {
    fetchData();
  }, [order._id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [transRes, stockRes, approvedRes, failedRes] = await Promise.all([
        axios.get(`/orders/${order._id}/transformers`, { withCredentials: true }),
        axios.get(`/secondary-core-tests/ready-stock/${order._id}`, { withCredentials: true }),
        axios.get(`/core-tests/approved-ids/${order._id}`, { withCredentials: true }),
        axios.get(`/failed-transformers?stage=SECONDARY_TESTING`, { withCredentials: true })
      ]);

      if (approvedRes.data?.success) {
        setApprovedIds({
          metering: approvedRes.data.metering || [],
          ps: approvedRes.data.ps || [],
          protection: approvedRes.data.protection || []
        });
      }

      const failedRecords = failedRes.data?.success ? failedRes.data.data : [];
      const activeFailedIds = new Set(
        failedRecords
          .map((f: any) => f.transformerUniqueId || f.transformerId?.uniqueId)
          .filter(Boolean)
      );

      const totalQty = order.quantity || order.transformerQuantity || 0;
      const details = order.coreDetails || [];

      // Map coresList exactly like in SecondaryTransformersList
      const mappedTrans: Transformer[] = transRes.data.map((t: any) => {
        let currentCoreNum = 1;
        const coresList: CoreConfig[] = [];
        details.forEach((coreGroup: any) => {
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

        if (coresList.length === 0) {
          coresList.push({ coreNumber: 1, coreType: 'metering', accuracyClass: '0.5' });
        }

        // Determine status
        const secTest = t.testHistory?.secondary_test || {};
        const meteringAssigned = coresList.some(c => c.coreType === 'metering') ? !!secTest.meteringCoreId : true;
        const psAssigned = coresList.some(c => c.coreType === 'ps') ? !!secTest.psCoreId : true;
        const protectionAssigned = coresList.some(c => c.coreType === 'protection') ? !!secTest.protectionCoreId : true;

        let status = 'pending';
        if (t.currentStage === 'primary' || t.currentStage === 'final' || t.currentStage === 'shipped') {
          status = 'completed';
        } else if (meteringAssigned && psAssigned && protectionAssigned) {
          status = 'completed';
        } else if (secTest.meteringCoreId || secTest.psCoreId || secTest.protectionCoreId) {
          status = 'in-progress';
        }

        const ratingText = (() => {
          let primary = 'N/A';
          let pArray = order.primaryCurrents;
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
          } else if (order.ratio) {
            const firstRatio = Array.isArray(order.ratio) ? order.ratio[0] : order.ratio;
            if (firstRatio) {
              primary = String(firstRatio).split('/')[0] || 'N/A';
            }
          }

          let secondary = '1';
          if (order.coreDetails && order.coreDetails.length > 0) {
            const secVals = order.coreDetails
              .map((c: any) => c.secondaryCurrent)
              .filter(Boolean)
              .map((s: string) => s.replace(/A/i, ''));
            if (secVals.length > 0) {
              secondary = secVals.join('-');
            } else if (order.ratedSecondaryCurrent) {
              secondary = String(order.ratedSecondaryCurrent).replace(/A/i, '');
            }
          } else if (order.ratedSecondaryCurrent) {
            secondary = String(order.ratedSecondaryCurrent).replace(/A/i, '');
          }
          return `${primary}/${secondary} A`;
        })();

        return {
          _id: t._id,
          uniqueId: t.uniqueId,
          name: t.name || 'Transformer',
          rating: ratingText,
          voltageRating: t.voltageRating,
          currentStage: t.currentStage,
          status,
          cores: coresList,
          testHistory: t.testHistory
        };
      });

      setTransformers(
        mappedTrans.filter(t => t.currentStage === 'secondary' && !activeFailedIds.has(t.uniqueId))
      );
      setReadyStock(stockRes.data);
    } catch (err) {
      console.error("Failed to load data for workflow", err);
      toast.error("Failed to load transformers and core tests");
    } finally {
      setLoading(false);
    }
  };

  const getCoresCountForType = (type: string) => {
    return order.coreDetails?.filter((c: any) => {
      const cType = (c.coreType || '').toLowerCase();
      const isPS = cType === 'protection' && (c.iexLimit || c.leLimit || c.class === 'PS' || (c.description && c.description.includes('PS')));
      if (type === 'ps') return isPS || cType === 'ps';
      if (type === 'protection') return cType === 'protection' && !isPS;
      return cType === type;
    }).length || 0;
  };

  const coreCount = (() => {
    if (order.coreDetails && Array.isArray(order.coreDetails) && order.coreDetails.length > 0) {
      return order.coreDetails.length;
    }
    if ((order as any).coreConfiguration && Array.isArray((order as any).coreConfiguration) && (order as any).coreConfiguration.length > 0) {
      return (order as any).coreConfiguration.length;
    }
    if (transformers && transformers.length > 0 && transformers[0]?.cores && transformers[0].cores.length > 0) {
      return transformers[0].cores.length;
    }
    return 1;
  })();

  const isMultiCore = coreCount > 1;

  const totalQty = order.quantity || order.transformerQuantity || 0;
  const reqMetering = getCoresCountForType('metering') * totalQty;
  const reqPs = getCoresCountForType('ps') * totalQty;
  const reqProtection = getCoresCountForType('protection') * totalQty;

  const activeCount = transformers.length;
  const displayReqMetering = getCoresCountForType('metering') * activeCount;
  const displayReqPs = getCoresCountForType('ps') * activeCount;
  const displayReqProtection = getCoresCountForType('protection') * activeCount;

  const isCoreRecordCompleted = (r: any, type: 'metering' | 'ps' | 'protection') => {
    if (!r) return false;
    if (r.status === 'Pass' || r.status === 'PASS' || r.status === 'Fail' || r.status === 'FAILED') return true;
    if (type === 'metering' && r.metering_results) {
      return r.metering_results.some((mr: any) => mr.rows && mr.rows.some((rw: any) => 
        (rw.r100 !== undefined && rw.r100 !== null && String(rw.r100).trim() !== '') || 
        (rw.p100 !== undefined && rw.p100 !== null && String(rw.p100).trim() !== '') || 
        (rw.r25 !== undefined && rw.r25 !== null && String(rw.r25).trim() !== '') || 
        (rw.p25 !== undefined && rw.p25 !== null && String(rw.p25).trim() !== '')
      ));
    }
    if (type === 'ps' && r.ps_results) {
      return r.ps_results.some((pr: any) => 
        (pr.turnRatioError && String(pr.turnRatioError).trim() !== '') || 
        (pr.resistance && String(pr.resistance).trim() !== '') || 
        (pr.vk && String(pr.vk).trim() !== '') || 
        (pr.iexVk && String(pr.iexVk).trim() !== '')
      );
    }
    if (type === 'protection' && r.protection_results) {
      return r.protection_results.some((pr: any) => 
        (pr.ratioError100 && String(pr.ratioError100).trim() !== '') || 
        (pr.phaseError && String(pr.phaseError).trim() !== '') || 
        (pr.resistance && String(pr.resistance).trim() !== '') || 
        (pr.excitationCurrent && String(pr.excitationCurrent).trim() !== '')
      );
    }
    return false;
  };

  const getAvailableCoreIds = (type: 'metering' | 'ps' | 'protection') => {
    const list = approvedIds[type] || [];
    const totalReq = type === 'metering' ? reqMetering : (type === 'ps' ? reqPs : reqProtection);
    
    let availableIds = list.filter(Boolean);

    if (totalReq > 0 && availableIds.length > totalReq) {
      availableIds = availableIds.slice(0, totalReq);
    }

    return availableIds;
  };

  const getCompletedCoreCount = (type: 'metering' | 'ps' | 'protection') => {
    const availableIds = getAvailableCoreIds(type);
    const testedRecords = readyStock[type] || [];
    const completedSet = new Set(
      testedRecords
        .filter((r: any) => isCoreRecordCompleted(r, type))
        .map((r: any) => r.coreId)
    );
    return availableIds.filter(id => completedSet.has(id)).length;
  };

  const displayTestedMetering = getCompletedCoreCount('metering');
  const displayTestedPs = getCompletedCoreCount('ps');
  const displayTestedProtection = getCompletedCoreCount('protection');

  const getFirstUntestedIndex = (type: 'metering' | 'ps' | 'protection') => {
    const availableIds = getAvailableCoreIds(type);
    const testedRecords = readyStock[type] || [];
    const completedCoreIds = new Set(
      testedRecords
        .filter((r: any) => isCoreRecordCompleted(r, type))
        .map((r: any) => r.coreId)
    );

    for (let i = 0; i < availableIds.length; i++) {
      if (!completedCoreIds.has(availableIds[i])) {
        return i;
      }
    }
    return 0;
  };

  // Dropdown ready stocks list: unassigned OR currently assigned to this transformer
  const getAvailableStockForDropdown = (type: 'metering' | 'ps' | 'protection', tUniqueId: string) => {
    const list = readyStock[type] || [];
    return list.filter(core => !core.isAssigned || core.assignedUniqueId === tUniqueId);
  };

  const handleCoreAssignmentChange = async (tUniqueId: string, type: 'metering' | 'ps' | 'protection', value: string) => {
    const trans = transformers.find(t => t.uniqueId === tUniqueId);
    if (!trans) return;

    const currentAssignments = {
      meteringCoreId: type === 'metering' ? value : trans.testHistory?.secondary_test?.meteringCoreId,
      psCoreId: type === 'ps' ? value : trans.testHistory?.secondary_test?.psCoreId,
      protectionCoreId: type === 'protection' ? value : trans.testHistory?.secondary_test?.protectionCoreId
    };

    try {
      const res = await axios.put(`/transformers/${tUniqueId}/assign-secondary-cores`, currentAssignments, { withCredentials: true });
      if (res.data.success) {
        toast.success("Core assigned successfully");
        fetchData();
      }
    } catch (err) {
      console.error("Assignment failed", err);
      toast.error("Failed to assign core");
    }
  };

  const handleAutoAssign = async () => {
    // 1. Get copies of available stock lists (unassigned ready stock cores)
    const availableMetering = (readyStock.metering || []).filter((c: any) => !c.isAssigned && c.status !== 'In-Progress');
    const availablePs = (readyStock.ps || []).filter((c: any) => !c.isAssigned && c.status !== 'In-Progress');
    const availableProtection = (readyStock.protection || []).filter((c: any) => !c.isAssigned && c.status !== 'In-Progress');

    let mIdx = 0;
    let psIdx = 0;
    let pIdx = 0;

    const promises = [];
    let assignedCount = 0;

    for (const t of transformers) {
      const secTest = t.testHistory?.secondary_test || {};
      const hasMeteringReq = t.cores.some(c => c.coreType === 'metering');
      const hasPsReq = t.cores.some(c => c.coreType === 'ps');
      const hasProtectionReq = t.cores.some(c => c.coreType === 'protection');

      let currentMeteringId = secTest.meteringCoreId || '';
      let currentPsId = secTest.psCoreId || '';
      let currentProtectionId = secTest.protectionCoreId || '';

      let changed = false;

      if (hasMeteringReq && !currentMeteringId) {
        if (mIdx < availableMetering.length) {
          currentMeteringId = availableMetering[mIdx].coreId;
          mIdx++;
          changed = true;
        }
      }

      if (hasPsReq && !currentPsId) {
        if (psIdx < availablePs.length) {
          currentPsId = availablePs[psIdx].coreId;
          psIdx++;
          changed = true;
        }
      }

      if (hasProtectionReq && !currentProtectionId) {
        if (pIdx < availableProtection.length) {
          currentProtectionId = availableProtection[pIdx].coreId;
          pIdx++;
          changed = true;
        }
      }

      if (changed) {
        const payload = {
          meteringCoreId: currentMeteringId || null,
          psCoreId: currentPsId || null,
          protectionCoreId: currentProtectionId || null
        };
        promises.push(
          axios.put(`/transformers/${t.uniqueId}/assign-secondary-cores`, payload, { withCredentials: true })
        );
        assignedCount++;
      }
    }

    if (assignedCount === 0) {
      toast.info("No new cores could be auto-assigned. Make sure tested ready stock is available.");
      return;
    }

    try {
      const toastId = toast.loading("Auto-assigning cores...");
      await Promise.all(promises);
      toast.dismiss(toastId);
      toast.success(`Successfully auto-assigned cores to ${assignedCount} transformer(s)!`);
      fetchData();
    } catch (err) {
      toast.dismiss();
      console.error("Auto assignment failed", err);
      toast.error("Some core assignments failed to save.");
      fetchData();
    }
  };

  const handleApproveTransformer = async (transformer: Transformer) => {
    try {
      if (!confirm(`Are you sure you want to approve Transformer ${transformer.uniqueId} and move it to Primary Testing?`)) return;

      const response = await axios.put(`/transformers/${transformer.uniqueId}/approve-stage`, {
        stage: 'secondary',
        nextStage: 'final'
      }, { withCredentials: true });

      if (response.data.success) {
        toast.success("Transformer Approved successfully!");
        if (onRefreshOrders) onRefreshOrders();
        fetchData();
      }
    } catch (err) {
      console.error("Approval failed", err);
      toast.error("Failed to approve transformer");
    }
  };

  const getFailureReasons = (transformer: Transformer) => {
    let reasons: string[] = [];
    transformer.cores.forEach(core => {
      const type = core.coreType;
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
    return reasons;
  };

  const handleStrictApproval = async (transformer: Transformer) => {
    try {
      if (!confirm("Are you sure you want to request Strict Admin Approval?")) return;
      
      const reasons = getFailureReasons(transformer);
      const finalReason = reasons.length > 0 ? [...new Set(reasons)].join(' | ') : "Limits Exceeded";
      
      const extractedTypes = new Set<string>();
      reasons.forEach(r => {
        if (r.toLowerCase().includes('metering')) extractedTypes.add('METERING');
        else if (r.toLowerCase().includes('protection')) extractedTypes.add('PROTECTION');
        else if (r.toLowerCase().includes('ps')) extractedTypes.add('PS');
      });
      const uniqueTypes = Array.from(extractedTypes);
      const dynamicCoreType = uniqueTypes.length === 1 ? uniqueTypes[0] : (uniqueTypes.length > 1 ? 'Multiple' : 'COMPLETE UNIT');
      
      await axios.post(`/strict-approvals/request`, {
        orderId: order._id,
        jobId: order.jobId,
        unitId: transformer.uniqueId,
        clientName: order.clientName,
        coreType: dynamicCoreType,
        testType: 'Secondary Testing',
        failureReason: finalReason,
        testData: transformer.testHistory?.secondary_test,
        requestedBy: userName || 'Testing Engineer'
      }, { withCredentials: true });

      await axios.put(`/transformers/${transformer.uniqueId}/approve-stage`, { 
        stage: 'secondary', 
        nextStage: 'admin_review' 
      }, { withCredentials: true });

      toast.success("Strict Approval Requested!");
      fetchData();
    } catch (err) {
      console.error("Strict approval request failed", err);
      toast.error("Failed to request strict approval.");
    }
  };

  const handleMoveToFailed = async (transformer: Transformer) => {
    try {
      if (!confirm("Are you sure you want to move this transformer to Failed Transformers?")) return;
      
      const reasons = getFailureReasons(transformer);
      const finalReason = reasons.length > 0 ? [...new Set(reasons)].join(' | ') : "Accuracy Limits Exceeded";

      const payload = {
        transformerId: transformer._id || transformer.id,
        transformerUniqueId: transformer.uniqueId,
        orderId: order._id,
        jobNumber: order.jobId,
        clientName: order.clientName,
        coreType: "Multiple",
        testType: "Secondary Testing",
        failureParameters: { transformer },
        failureReason: finalReason,
        reportedBy: userName || 'Testing Engineer',
        stage: "SECONDARY_TESTING",
        status: "FAILED"
      };

      const response = await axios.post(`/failed-transformers`, payload, { withCredentials: true });
      if (response.data.success) {
        toast.success("Transformer moved to failed list successfully.");
        fetchData();
      } else {
        toast.error("Failed to add to failed transformers.");
      }
    } catch (err) {
      console.error("Move to failed failed", err);
      toast.error("Failed to move to failed transformers.");
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

  // Rendering report screen for unassigned core
  if (activeTestMode) {
    const { coreType, index } = activeTestMode;
    const availableIds = getAvailableCoreIds(coreType);
    
    const getCoreId = () => {
      return availableIds[index] || '';
    };
    const coreId = getCoreId();

    const getActiveCoreNumber = () => {
      if (!order.coreDetails) return 1;
      const typeCores = order.coreDetails.filter(c => {
        const cType = (c.coreType || '').toLowerCase();
        const isPS = cType === 'protection' && (c.iexLimit || c.leLimit || c.class === 'PS' || (c.description && c.description.includes('PS')));
        if (coreType === 'ps') return isPS || cType === 'ps';
        if (coreType === 'protection') return cType === 'protection' && !isPS;
        return cType === coreType;
      });
      if (typeCores.length === 0) return 1;
      
      const activeCoreConfig = typeCores[index % typeCores.length];
      if (!activeCoreConfig) return 1;
      const orderIndex = order.coreDetails.indexOf(activeCoreConfig);
      return orderIndex !== -1 ? orderIndex + 1 : 1;
    };
    
    const coreNumber = getActiveCoreNumber();

    // Create a dummy transformer representation matching properties report components read
    const dummyTransformer: any = {
      isDummy: true,
      uniqueId: coreId,
      name: order.jobId,
      transformerName: order.transformerName || 'Transformer',
      rating: order.transformerName || 'N/A',
      voltageRating: order.voltageRating || order.nominalSystemVoltage,
      orderId: order, // Passing full order object
      fullOrder: order, // Passing full order object
      jobId: order.jobId,
      clientName: order.clientName,
      cores: order.coreDetails?.map((c, i) => ({
        coreNumber: i + 1,
        coreType: (() => {
          const typeStr = (c.coreType || 'Metering').toLowerCase();
          if (typeStr.includes('protection')) return 'protection';
          if (typeStr.includes('ps')) return 'ps';
          return 'metering';
        })(),
        accuracyClass: c.accuracyClass || '0.5'
      })) || [{ coreNumber: 1, coreType: coreType, accuracyClass: '0.5' }],
      testHistory: {
        secondary_test: {}
      }
    };

    const handleBackFromReport = () => {
      setActiveTestMode(null);
      fetchData();
    };

    const maxIndex = availableIds.length > 0 ? availableIds.length - 1 : 0;

    const handleNextCore = () => {
      fetchData();
      if (index < maxIndex) {
        setActiveTestMode({ coreType, index: index + 1 });
      } else {
        toast.info(`Completed testing all available ${coreType.toUpperCase()} cores.`);
        setActiveTestMode(null);
      }
    };

    const currentTotalReq = coreType === 'metering' ? reqMetering : (coreType === 'ps' ? reqPs : reqProtection);

    const handlePrevCore = () => {
      if (activeTestMode && activeTestMode.index > 0) {
        setActiveTestMode({
          coreType: activeTestMode.coreType,
          index: activeTestMode.index - 1
        });
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <Button variant="outline" size="sm" onClick={handleBackFromReport} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
          <span className="font-semibold text-sm flex items-center gap-2">
            Testing {coreType.toUpperCase()} Core {(() => {
              const allList = approvedIds[coreType] || [];
              const pos = allList.indexOf(coreId);
              return pos !== -1 ? pos + 1 : index + 1;
            })()} of {currentTotalReq > 0 ? currentTotalReq : (maxIndex + 1)} ({coreId})
            {readyStock[coreType]?.some((c: any) => c.coreId === coreId && c.status === 'Fail') && (
              <Badge variant="destructive">FAILED</Badge>
            )}
          </span>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          {coreType === 'metering' && (
            <SecondaryMeteringReport
              key={coreId}
              transformer={dummyTransformer}
              coreNumber={coreNumber}
              coreId={coreId}
              testerName={userName}
              onBack={handleBackFromReport}
              onPrev={handlePrevCore}
              onNext={handleNextCore}
              stage="secondary"
              onRefresh={fetchData}
            />
          )}
          {coreType === 'ps' && (
            <SecondaryPSReport
              key={coreId}
              transformer={dummyTransformer}
              coreNumber={coreNumber}
              coreId={coreId}
              testerName={userName}
              onBack={handleBackFromReport}
              onPrev={handlePrevCore}
              onNext={handleNextCore}
              stage="secondary"
              onRefresh={fetchData}
            />
          )}
          {coreType === 'protection' && (
            <SecondaryProtectionReport
              key={coreId}
              transformer={dummyTransformer}
              coreNumber={coreNumber}
              coreId={coreId}
              testerName={userName}
              onBack={handleBackFromReport}
              onPrev={handlePrevCore}
              onNext={handleNextCore}
              stage="secondary"
              onRefresh={fetchData}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Button>
      </div>

      <div>
        <h2 className="text-xl font-bold">Secondary Testing Dashboard: {order.jobId}</h2>
        <p className="text-gray-500 mt-1">Test order cores and assign them to individual transformers</p>
      </div>

      {/* Order Specs */}
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
            <p className="text-sm text-gray-500">Total Quantity</p>
            <p className="font-medium mt-1">{totalQty}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Order Date</p>
            <p className="font-medium mt-1">
              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB') : 'N/A'}
            </p>
          </div>
        </div>
      </Card>

      {/* Core Testing Section */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">Core Testing Progress</h3>
          {((displayReqMetering === 0 || displayTestedMetering >= displayReqMetering) &&
            (displayReqPs === 0 || displayTestedPs >= displayReqPs) &&
            (displayReqProtection === 0 || displayTestedProtection >= displayReqProtection)) && (
            <Button
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-2.5 gap-2 shadow-md hover:shadow-lg transition-all"
              onClick={async () => {
                try {
                  if (!confirm(`Are you sure you want to approve all cores for Job ${order.jobId} and move to Primary Testing?`)) return;

                  const toastId = toast.loading("Approving all cores and updating order...");

                  if (transformers.length > 0) {
                    await handleAutoAssign();
                  }

                  await axios.put(`/secondary-core-tests/complete-batch/${order._id}`, {}, { withCredentials: true });

                  toast.dismiss(toastId);
                  toast.success(`All cores approved successfully for ${order.jobId}! Order moved to Primary Testing.`);

                  if (onRefreshOrders) onRefreshOrders();
                  onBack();
                } catch (err) {
                  toast.dismiss();
                  console.error("Approve all cores failed", err);
                  toast.error("Failed to approve all cores.");
                }
              }}
            >
              <CheckCircle className="w-5 h-5" /> Approve All Cores & Move to Primary Testing
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {displayReqMetering > 0 && (
            <Card className="p-5 flex flex-col justify-between h-40 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div>
                <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Metering Cores</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{displayTestedMetering} / {displayReqMetering} Tested</p>
              </div>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                onClick={() => setActiveTestMode({ coreType: 'metering', index: getFirstUntestedIndex('metering') })}
              >
                <PlayCircle className="w-4 h-4 mr-2" /> Start / Continue Testing
              </Button>
            </Card>
          )}

          {displayReqPs > 0 && (
            <Card className="p-5 flex flex-col justify-between h-40 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div>
                <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">PS Cores</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{displayTestedPs} / {displayReqPs} Tested</p>
              </div>
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white w-full"
                onClick={() => setActiveTestMode({ coreType: 'ps', index: getFirstUntestedIndex('ps') })}
              >
                <PlayCircle className="w-4 h-4 mr-2" /> Start / Continue Testing
              </Button>
            </Card>
          )}

          {displayReqProtection > 0 && (
            <Card className="p-5 flex flex-col justify-between h-40 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div>
                <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Protection Cores</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{displayTestedProtection} / {displayReqProtection} Tested</p>
              </div>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white w-full"
                onClick={() => setActiveTestMode({ coreType: 'protection', index: getFirstUntestedIndex('protection') })}
              >
                <PlayCircle className="w-4 h-4 mr-2" /> Start / Continue Testing
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Transformers & Core Assignment - Only for Single Core Transformers */}
      {!isMultiCore && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Transformers & Core Assignment</h3>
            {transformers.length > 0 && (
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-sm"
                onClick={handleAutoAssign}
              >
                Auto-Assign Cores
              </Button>
            )}
          </div>
          <Card className="overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold">Transformer Unique ID</th>
                    <th className="text-left p-4 text-sm font-semibold">Name / Rating</th>
                    <th className="text-left p-4 text-sm font-semibold">Core Assignments</th>
                    <th className="text-left p-4 text-sm font-semibold">Status</th>
                    <th className="text-center p-4 text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transformers.length > 0 ? (
                    transformers.map((transformer) => {
                      const secTest = transformer.testHistory?.secondary_test || {};
                      const hasMeteringReq = transformer.cores.some(c => c.coreType === 'metering');
                      const hasPsReq = transformer.cores.some(c => c.coreType === 'ps');
                      const hasProtectionReq = transformer.cores.some(c => c.coreType === 'protection');

                      // Check validation and fail state
                      const hasFailures = transformer.cores.some(core => {
                        const assignedCoreId = secTest[`${core.coreType}CoreId`];
                        if (assignedCoreId) {
                          const assignedCoreObj = getAvailableStockForDropdown(core.coreType as any, transformer.uniqueId).find(c => c.coreId === assignedCoreId);
                          if (assignedCoreObj && assignedCoreObj.status === 'Fail') return true;
                        }

                        const results = secTest[`${core.coreType}_results`] || [];
                        if (core.coreType === 'metering') {
                          return results.some((res: any) => res.rows?.some((row: any) =>
                            row.r100_r_pass === false || row.r100_p_pass === false ||
                            row.r25_r_pass === false || row.r25_p_pass === false ||
                            row.r100_pass === false || row.r25_pass === false
                          ));
                        }
                        return results.some((res: any) => res.isPass === false);
                      });

                      const allRequiredAssigned =
                        (!hasMeteringReq || !!secTest.meteringCoreId) &&
                        (!hasPsReq || !!secTest.psCoreId) &&
                        (!hasProtectionReq || !!secTest.protectionCoreId);

                      const canApprove = allRequiredAssigned && !hasFailures && transformer.currentStage === 'secondary';
                      const canRequestStrictApproval = allRequiredAssigned && hasFailures && transformer.currentStage === 'secondary';

                      return (
                        <tr key={transformer.uniqueId} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-4 font-medium">{transformer.uniqueId}</td>
                          <td className="p-4">
                            <div>
                              <p className="font-semibold text-gray-800">{transformer.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{transformer.rating}</p>
                            </div>
                          </td>
                          <td className="p-4 space-y-3">
                            {hasMeteringReq && (
                              <div className="flex flex-col gap-1 max-w-xs">
                                <label className="text-[10px] font-semibold text-blue-700 uppercase">Metering Core</label>
                                <select
                                  className="p-2 text-xs rounded border border-gray-300 bg-white"
                                  value={secTest.meteringCoreId || ""}
                                  onChange={(e) => handleCoreAssignmentChange(transformer.uniqueId, 'metering', e.target.value)}
                                >
                                  <option value="">-- Select Metering Core --</option>
                                  {getAvailableStockForDropdown('metering', transformer.uniqueId).map((core) => {
                                    const isFailed = core.status === 'Fail';
                                    return (
                                      <option key={core.coreId} value={core.coreId} className={isFailed ? "text-red-600 font-bold" : ""}>
                                        {core.coreId} {core.turnsUsed ? `(${core.turnsUsed} Turns)` : ''} {isFailed ? '(FAILED)' : ''}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>
                            )}

                            {hasPsReq && (
                              <div className="flex flex-col gap-1 max-w-xs">
                                <label className="text-[10px] font-semibold text-purple-700 uppercase">PS Core</label>
                                <select
                                  className="p-2 text-xs rounded border border-gray-300 bg-white"
                                  value={secTest.psCoreId || ""}
                                  onChange={(e) => handleCoreAssignmentChange(transformer.uniqueId, 'ps', e.target.value)}
                                >
                                  <option value="">-- Select PS Core --</option>
                                  {getAvailableStockForDropdown('ps', transformer.uniqueId).map((core) => {
                                    const isFailed = core.status === 'Fail';
                                    return (
                                      <option key={core.coreId} value={core.coreId} className={isFailed ? "text-red-600 font-bold" : ""}>
                                        {core.coreId} {core.turnsUsed ? `(${core.turnsUsed} Turns)` : ''} {isFailed ? '(FAILED)' : ''}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>
                            )}

                            {hasProtectionReq && (
                              <div className="flex flex-col gap-1 max-w-xs">
                                <label className="text-[10px] font-semibold text-green-700 uppercase">Protection Core</label>
                                <select
                                  className="p-2 text-xs rounded border border-gray-300 bg-white"
                                  value={secTest.protectionCoreId || ""}
                                  onChange={(e) => handleCoreAssignmentChange(transformer.uniqueId, 'protection', e.target.value)}
                                >
                                  <option value="">-- Select Protection Core --</option>
                                  {getAvailableStockForDropdown('protection', transformer.uniqueId).map((core) => {
                                    const isFailed = core.status === 'Fail';
                                    return (
                                      <option key={core.coreId} value={core.coreId} className={isFailed ? "text-red-600 font-bold" : ""}>
                                        {core.coreId} {core.turnsUsed ? `(${core.turnsUsed} Turns)` : ''} {isFailed ? '(FAILED)' : ''}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <Badge className={getStatusColor(transformer.status)}>
                              {transformer.currentStage === 'admin_review' ? 'Admin Review' : transformer.status.replace('-', ' ')}
                            </Badge>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex flex-col gap-2 justify-center items-center">
                              {canApprove && (
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white w-full max-w-[150px]"
                                  onClick={() => handleApproveTransformer(transformer)}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" /> Approve
                                </Button>
                              )}

                              {canRequestStrictApproval && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-orange-500 hover:bg-orange-600 text-white w-full max-w-[150px]"
                                    onClick={() => handleStrictApproval(transformer)}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" /> Strict Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="bg-red-600 hover:bg-red-700 text-white w-full max-w-[150px]"
                                    onClick={() => handleMoveToFailed(transformer)}
                                  >
                                    Move to Failed
                                  </Button>
                                </>
                              )}

                              {!canApprove && !canRequestStrictApproval && (
                                <span className="text-xs text-gray-400 italic">Assign all cores to approve</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        No active transformers in Secondary Testing stage.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

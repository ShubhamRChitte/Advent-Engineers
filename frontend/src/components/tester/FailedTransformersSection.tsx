import { useState, useEffect } from 'react';
import axios from '@/utils/axiosConfig';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  AlertTriangle,
  ArrowLeft,
  Search,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Layers,
  Wrench,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

import { SecondaryMeteringReport } from './SecondaryMeteringReport';
import { SecondaryProtectionReport } from './SecondaryProtectionReport';
import { SecondaryPSReport } from './SecondaryPSReport';

interface FailedTransformersSectionProps {
  user: {
    role: string;
    name: string;
    fullName?: string;
  };
}

const findResultForCore = (results: any[], coreNumber: number, coreType: string, coreDetails: any[]) => {
  if (!results || !Array.isArray(results) || results.length === 0) return null;

  const typeCores = coreDetails.filter((c: any) => {
    const t = (c.coreType || 'Metering').toLowerCase();
    if (coreType === 'ps') return t.includes('ps');
    if (coreType === 'protection') return t.includes('protection');
    return !t.includes('ps') && !t.includes('protection');
  });

  const typeIndex = typeCores.findIndex((c: any) => {
    for (let i = 0; i < coreDetails.length; i++) {
      if (coreDetails[i] === c) {
        if (i + 1 === coreNumber) return true;
      }
    }
    return false;
  });

  const suffix = `-${String(coreNumber).padStart(3, '0')}`;
  const typeSeq = typeIndex !== -1 ? typeIndex + 1 : 1;
  const typeSuffix = `-${String(typeSeq).padStart(3, '0')}`;

  const match = results.find((r: any) => {
    const id = r.internalCoreNo || r.coreId || '';
    return id.endsWith(suffix) || id.includes(suffix) ||
      id.endsWith(typeSuffix) || id.includes(typeSuffix);
  });

  if (match) return match;
  if (typeIndex !== -1 && results[typeIndex]) return results[typeIndex];
  return null;
};

export function FailedTransformersSection({ user }: FailedTransformersSectionProps) {
  const [failedList, setFailedList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [coreTypeFilter, setCoreTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('FAILED');
  const [retestingTransformer, setRetestingTransformer] = useState<any | null>(null);

  // Retest View States
  const [activeReport, setActiveReport] = useState<any | null>(null);
  const [selectedCore, setSelectedCore] = useState<number | null>(null);
  const [retestAvailablePool, setRetestAvailablePool] = useState<any>(null);
  const [enteredCoreId, setEnteredCoreId] = useState('');

  // Core Replacement States
  const [replacingCoreItem, setReplacingCoreItem] = useState<any | null>(null);
  const [selectedCoreToReplace, setSelectedCoreToReplace] = useState<number | "">("");
  const [selectedNewCoreId, setSelectedNewCoreId] = useState<string>("");
  const [availableCoresPool, setAvailableCoresPool] = useState<any[]>([]);
  const [loadingPool, setLoadingPool] = useState(false);
  const [submittingReplacement, setSubmittingReplacement] = useState(false);

  // Reason Modal State
  const [reasonModalData, setReasonModalData] = useState<{
    isOpen: boolean;
    reason: string;
    serialNo: string;
  } | null>(null);

  // Column Visibility State
  const [visibleColumns, setVisibleColumns] = useState({
    dateFailed: true, // Non-unselectable
    serialNo: true,   // Non-unselectable
    jobNumber: false,
    clientName: false,
    coreType: true,   // Default selected
    failedIn: true,   // Default selected
    failureReason: false,
    status: true,     // Default selected
    actions: true     // Non-unselectable
  });

  const toggleColumn = (colName: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [colName]: !prev[colName] }));
  };



  const fetchAvailablePool = async (item: any, selectedCoreNum: number) => {
    if (!item || !selectedCoreNum) return;
    try {
      setLoadingPool(true);
      const orderId = item.orderId?._id || item.orderId;


      const orderRes = await axios.get(`/orders/${orderId}`, { withCredentials: true });

      const order = orderRes.data?.data || item.orderId;

      const coreDetails = order?.coreDetails || [];
      const coreGroup = coreDetails[selectedCoreNum - 1];
      if (!coreGroup) return;

      const typeStr = (coreGroup.coreType || 'Metering').toLowerCase();
      let targetType = 'Metering';
      if (typeStr.includes('protection')) targetType = 'Protection';
      else if (typeStr.includes('ps')) targetType = 'PS';

      // Fetch from Ready Stock API
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `/ready-transformers/available`,
        {
          params: { coreType: targetType },
          withCredentials: true,
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        }
      );

      const pool = (res.data || []).map((core: any) => {
        const turns = core.specifications?.turns || '';
        const label = turns ? `${core.coreId} (Turns: ${turns})` : core.coreId;
        return {
          _id: core._id,
          id: core.coreId,
          label: label
        };
      });

      setAvailableCoresPool(pool);
    } catch (err) {
      console.error("Failed to fetch available core pool from ready stock", err);
      toast.error("Failed to load available ready stock.");
    } finally {
      setLoadingPool(false);
    }
  };

  const getCoresForItem = (item: any) => {
    if (!item || !item.orderId || !item.transformerId) return [];
    const order = item.orderId;
    const transformer = item.transformerId;
    const coreDetails = order.coreDetails || [];
    // For PRIMARY_TESTING failures, read from primary_test; for FINAL_TESTING from final_test; otherwise secondary_test
    const testStageKey = item.stage === 'PRIMARY_TESTING' ? 'primary_test'
      : item.stage === 'FINAL_TESTING' ? 'final_test'
      : 'secondary_test';

    return coreDetails.map((coreGroup: any, idx: number) => {
      const coreNum = idx + 1;
      const typeStr = (coreGroup.coreType || 'Metering').toLowerCase();
      let mappedType: 'metering' | 'ps' | 'protection' = 'metering';
      if (typeStr.includes('protection')) mappedType = 'protection';
      else if (typeStr.includes('ps')) mappedType = 'ps';

      // Find current core ID from the appropriate stage results
      const results = transformer.testHistory?.[testStageKey]?.[`${mappedType}_results`] || [];

      let foundResult = findResultForCore(results, coreNum, mappedType, coreDetails);

      // Fallback chain: if the primary stage didn't have a result, try secondary_test
      // If FINAL_TESTING didn't have a result, try secondary_test then primary_test
      if (!foundResult || !(foundResult.internalCoreNo || foundResult.coreId)) {
        const secResults = transformer.testHistory?.secondary_test?.[`${mappedType}_results`] || [];
        foundResult = findResultForCore(secResults, coreNum, mappedType, coreDetails);
        
        if (!foundResult) {
          const primResults = transformer.testHistory?.primary_test?.[`${mappedType}_results`] || [];
          foundResult = findResultForCore(primResults, coreNum, mappedType, coreDetails);
        }
      }

      return {
        coreNumber: coreNum,
        coreType: mappedType,
        currentCoreId: foundResult ? (foundResult.internalCoreNo || foundResult.coreId) : 'N/A'
      };
    });
  };

  // Triggered when replacingCoreItem changes to auto-select core to replace and fetch pool
  useEffect(() => {
    if (replacingCoreItem) {
      const initReplacement = async () => {
        try {
          setLoadingPool(true);
          const orderId = replacingCoreItem.orderId?._id || replacingCoreItem.orderId;


          const orderRes = await axios.get(`/orders/${orderId}`, { withCredentials: true });

          const order = orderRes.data?.data || replacingCoreItem.orderId;

          const updatedItem = { ...replacingCoreItem, orderId: order };
          const cores = getCoresForItem(updatedItem);
          const rawType = (replacingCoreItem.coreType || '').toLowerCase();

          const matchedCore = cores.find((c: any) => c.currentCoreId === replacingCoreItem.failureParameters?.coreId)
            || cores.find((c: any) => c.coreType.toLowerCase() === rawType)
            || cores[0];

          const coreNum = matchedCore ? matchedCore.coreNumber : 1;
          setSelectedCoreToReplace(coreNum);

          if (coreNum) {
            await fetchAvailablePool(updatedItem, coreNum);
          }
        } catch (err) {
          console.error("Failed to initialize core replacement", err);
        } finally {
          setLoadingPool(false);
        }
      };
      initReplacement();
    } else {
      setSelectedCoreToReplace("");
      setSelectedNewCoreId("");
      setAvailableCoresPool([]);
    }
  }, [replacingCoreItem]);

  // Load available core IDs pool for retesting transformer
  useEffect(() => {
    if (retestingTransformer) {
      const fetchRetestPool = async () => {
        try {
          const orderId = retestingTransformer.orderId?._id || retestingTransformer.orderId;
          const transformerObj = retestingTransformer.transformerId;
          if (!orderId || !transformerObj) return;

          const response = await axios.get(`/orders/${orderId}/transformers`, {
            withCredentials: true
          });
          const dbTransformers = response.data || [];

          const generateCoreId = (type: string, seqNum: number) => {
            let prefix = type === 'metering' ? 'M' : (type === 'ps' ? 'PS' : 'P');
            const jobSuffix = retestingTransformer.jobNumber?.split('-').pop() ?? '000';
            return `${prefix}-${jobSuffix}-${String(seqNum).padStart(3, '0')}`;
          };

          const getUsedIds = (targetType: 'metering' | 'ps' | 'protection') => {
            const used = new Set<string>();
            dbTransformers.forEach((otherT: any) => {
              if (otherT.uniqueId === transformerObj.uniqueId) return; // Don't exclude IDs used by self
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

          const totalQty = retestingTransformer.orderId?.quantity || retestingTransformer.orderId?.transformerQuantity || 0;
          const pool = {
            metering: Array.from({ length: totalQty }, (_, i) => generateCoreId('metering', i + 1)).filter(id => !getUsedIds('metering').has(id)),
            ps: Array.from({ length: totalQty }, (_, i) => generateCoreId('ps', i + 1)).filter(id => !getUsedIds('ps').has(id)),
            protection: Array.from({ length: totalQty }, (_, i) => generateCoreId('protection', i + 1)).filter(id => !getUsedIds('protection').has(id))
          };
          setRetestAvailablePool(pool);
        } catch (err) {
          console.error("Failed to fetch retest available pool:", err);
        }
      };
      fetchRetestPool();
    } else {
      setRetestAvailablePool(null);
    }
  }, [retestingTransformer]);

  const getMergedTestData = (transformer: any, stage: string) => {
    const primaryData = transformer.testHistory?.primary_test || {};
    const finalData = transformer.testHistory?.final_test || {};
    const secondaryData = transformer.testHistory?.secondary_test || {};

    // If they failed in secondary, we only care about secondary
    if (stage === 'SECONDARY_TESTING') return secondaryData;

    // If they failed in primary or final, their retests are in secondary. We need to merge them.
    const mergeType = (type: string) => {
      const baseData = stage === 'FINAL_TESTING' ? finalData[type] || [] : primaryData[type] || [];
      const sRes = secondaryData[type] || [];
      
      // Get all core IDs that have secondary test results
      const secondaryCoreIds = new Set(sRes.map((r: any) => r.internalCoreNo || r.coreId));

      // Keep base results ONLY for cores that DO NOT have secondary results
      const merged = baseData.filter((baseRow: any) => !secondaryCoreIds.has(baseRow.internalCoreNo || baseRow.coreId));

      // Add all secondary results
      merged.push(...sRes);
      return merged;
    };

    return {
      metering_results: mergeType('metering_results'),
      protection_results: mergeType('protection_results'),
      ps_results: mergeType('ps_results')
    };
  };

  const checkIsAllCoresCompleted = (transformer: any, order: any, stage: string) => {
    if (!transformer || !order) return false;
    const coreDetails = order.coreDetails || [];
    const testData = getMergedTestData(transformer, stage);

    const requiredMeteringCount = coreDetails.filter((c: any) => {
      const t = (c.coreType || 'Metering').toLowerCase();
      return !t.includes('ps') && !t.includes('protection');
    }).length;
    const requiredProtectionCount = coreDetails.filter((c: any) => (c.coreType || 'Metering').toLowerCase().includes('protection')).length;
    const requiredPsCount = coreDetails.filter((c: any) => (c.coreType || 'Metering').toLowerCase().includes('ps')).length;

    const isFilled = (val: any) => val !== undefined && val !== null && String(val).trim() !== '';

    const checkTypeCompleted = (results: any[], requiredCount: number, type: string) => {
      if (requiredCount === 0) return true;
      if (!results || results.length < requiredCount) return false;

      if (type === 'metering') {
        return results.every((res: any) =>
          res.rows && res.rows.length > 0 && res.rows.every((row: any) =>
            isFilled(row.r100) && isFilled(row.p100) && isFilled(row.r25) && isFilled(row.p25)
          )
        );
      } else if (type === 'protection') {
        return results.every((res: any) =>
          isFilled(res.ratioError100) &&
          isFilled(res.resistance) &&
          (isFilled(res.secondaryLimitingVoltage) || isFilled(res.secondaryLimitingVtg))
        );
      } else if (type === 'ps') {
        return results.every((res: any) =>
          isFilled(res.turnRatioError) && isFilled(res.vk) && isFilled(res.iexVk)
        );
      }
      return true;
    };

    const meteringDone = checkTypeCompleted(testData.metering_results || [], requiredMeteringCount, 'metering');
    const protectionDone = checkTypeCompleted(testData.protection_results || [], requiredProtectionCount, 'protection');
    const psDone = checkTypeCompleted(testData.ps_results || [], requiredPsCount, 'ps');

    return meteringDone && protectionDone && psDone;
  };

  const checkHasFailures = (transformer: any, order: any, stage: string) => {
    if (!transformer || !order) return false;
    const testData = getMergedTestData(transformer, stage);

    const meteringFail = (testData.metering_results || []).some((res: any) =>
      res.rows && res.rows.some((row: any) =>
        row.r100_r_pass === false || row.r100_p_pass === false ||
        row.r25_r_pass === false || row.r25_p_pass === false ||
        row.r100_pass === false || row.r25_pass === false || row.p100_pass === false || row.p25_pass === false
      )
    );

    const protectionFail = (testData.protection_results || []).some((res: any) => res.isPass === false);
    const psFail = (testData.ps_results || []).some((res: any) => res.isPass === false);

    return meteringFail || protectionFail || psFail;
  };

  const refreshRetestingTransformer = async () => {
    if (!retestingTransformer) return;
    try {
      const res = await axios.get(
        `/failed-transformers/${retestingTransformer._id}`,
        { withCredentials: true }
      );
      if (res.data.success) {
        setRetestingTransformer(res.data.data);
      }
    } catch (err) {
      console.error("Failed to refresh retesting transformer:", err);
    }
  };

  const getCoreTypeColor = (type: string) => {
    switch (type) {
      case 'metering': return 'bg-blue-50 border-blue-300';
      case 'ps': return 'bg-purple-50 border-purple-300';
      case 'protection': return 'bg-green-50 border-green-300';
      default: return 'bg-gray-50 border-gray-300';
    }
  };

  const getCoreTypeLabel = (type: string) => {
    switch (type) {
      case 'metering': return 'Metering Test Report';
      case 'ps': return 'PS Test Report';
      case 'protection': return 'Protection Test Report';
      default: return type;
    }
  };

  const getTransformerRating = (_transformer: any, order: any) => {
    if (!order) return 'N/A';

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
      secondaries = order.ratio.map((r: string) => r.split('/')[1] || '').filter((s: string) => s);
    }

    if (secondaries.length > 0) {
      return `${primary}/${secondaries.join('-')}`;
    }
    return primary !== 'N/A' ? `${primary}/1` : 'N/A';
  };

  const handleConfirmCoreReplacement = async () => {
    if (!replacingCoreItem || !selectedCoreToReplace || !selectedNewCoreId) {
      toast.error("Please select a replacement core ID.");
      return;
    }

    try {
      setSubmittingReplacement(true);
      const orderId = replacingCoreItem.orderId?._id || replacingCoreItem.orderId;


      const orderRes = await axios.get(`/orders/${orderId}`, { withCredentials: true });

      const order = orderRes.data?.data || replacingCoreItem.orderId;
      const updatedItem = { ...replacingCoreItem, orderId: order };

      const cores = getCoresForItem(updatedItem);
      const targetCore = cores.find((c: any) => c.coreNumber === selectedCoreToReplace);
      if (!targetCore) {
        toast.error("Target core not found.");
        return;
      }

      const selectedPoolItem = availableCoresPool.find(p => p.id === selectedNewCoreId);

      // Reserve and use in Ready Stock
      if (selectedPoolItem && selectedPoolItem._id) {
        try {
          const token = localStorage.getItem('token');
          await axios.post(
            `/ready-transformers/reserve/${selectedPoolItem._id}`,
            {},
            {
              withCredentials: true,
              headers: { 'Authorization': token ? `Bearer ${token}` : '' }
            }
          );

          const oldCoreId = targetCore.currentCoreId === 'N/A' ? '' : targetCore.currentCoreId;
          await axios.post(
            `/ready-transformers/use/${selectedPoolItem._id}`,
            {
              orderId: orderId,
              replacedCoreId: oldCoreId
            },
            {
              withCredentials: true,
              headers: { 'Authorization': token ? `Bearer ${token}` : '' }
            }
          );
        } catch (stockErr) {
          console.warn("Could not reserve/use core in ready stock tracking:", stockErr);
        }
      }

      const payload = {
        coreNumber: targetCore.coreNumber,
        coreType: targetCore.coreType,
        oldCoreId: targetCore.currentCoreId === 'N/A' ? '' : targetCore.currentCoreId,
        newCoreId: selectedNewCoreId,
        treatedBy: user.name || user.fullName || "Secondary Tester"
      };

      const res = await axios.put(
        `/failed-transformers/${replacingCoreItem._id}/replace-core`,
        payload,
        { withCredentials: true }
      );

      if (res.data.success) {
        toast.success(`Core replaced successfully! Core serial is now ${selectedNewCoreId}.`);

        // Fetch the updated failed transformer item and open retest view immediately!
        const retestRes = await axios.get(
          `/failed-transformers/${replacingCoreItem._id}`,
          { withCredentials: true }
        );

        if (retestRes.data.success) {
          const updatedItem = retestRes.data.data;
          setRetestingTransformer(updatedItem);
          setSelectedCore(selectedCoreToReplace);
          setEnteredCoreId(selectedNewCoreId);

          // Open the report directly for the replaced core
          const order = updatedItem.orderId;
          const accuracyClass = order?.coreDetails?.[selectedCoreToReplace - 1]?.accuracyClass || '0.5';
          setActiveReport({
            coreNumber: selectedCoreToReplace,
            coreType: targetCore.coreType,
            coreId: selectedNewCoreId,
            accuracyClass
          });
        }

        setReplacingCoreItem(null);
        setSelectedCoreToReplace("");
        setSelectedNewCoreId("");
        setAvailableCoresPool([]);
        fetchFailedTransformers();
      } else {
        toast.error("Failed to replace core.");
      }
    } catch (err: any) {
      console.error("Error replacing core:", err);
      toast.error(err.response?.data?.message || "Failed to replace core.");
    } finally {
      setSubmittingReplacement(false);
    }
  };

  const fetchFailedTransformers = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(

        `/failed-transformers?stage=SECONDARY_TESTING,PRIMARY_TESTING,FINAL_TESTING`,

        { withCredentials: true }
      );

      if (res.data.success) {
        setFailedList(res.data.data || []);
      } else {
        setError("Failed to load records.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch failed transformers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFailedTransformers();
  }, []);

  const handleApproveTransformerDirect = async (item: any) => {
    try {
      const transformerObj = item.transformerId;
      if (!transformerObj) {
        toast.error("Transformer detail not loaded. Cannot approve.");
        return;
      }

      // All failed transformer approvals go to Primary Testing (with secondary values preserved),
      // so primary + final testing can be done fresh with the retested/replaced cores.
      const stageLabel = item.stage === 'FINAL_TESTING' ? 'Final Testing'
        : item.stage === 'PRIMARY_TESTING' ? 'Primary Testing'
        : 'Secondary Testing';

      if (!confirm(
        `Are you sure you want to approve Transformer ${transformerObj?.uniqueId}?\n\n` +
        `This will:\n` +
        `• Mark the failed ${stageLabel} record as TREATED\n` +
        `• Preserve all secondary retest values (latest passing values for all cores)\n` +
        `• Reset primary and final test data for fresh retesting\n` +
        `• Move transformer back to Primary Testing`
      )) return;

      // Update Failed Transformer record status to TREATED.
      // The backend status route handles:
      //   1. Moving transformer to 'primary' stage
      //   2. Clearing primary_test + final_test history
      //   3. Preserving secondary_test (retest) values
      await axios.put(
        `/failed-transformers/${item._id}/status`,
        {
          status: "TREATED",
          treatedBy: user.name || user.fullName || "Testing Engineer",
          resolutionRemarks: `Retest completed successfully. All cores passed. Approved from Failed Section — returning to Primary Testing.`
        },
        { withCredentials: true }
      );

      toast.success(`Transformer ${transformerObj?.uniqueId} approved! Moving to Primary Testing with fresh data.`);
      fetchFailedTransformers();
    } catch (err) {
      console.error("Failed to approve transformer:", err);
      toast.error("Failed to approve transformer.");
    }
  };

  const handleRequestStrictApprovalDirect = async (item: any) => {
    try {
      const transformerObj = item.transformerId;
      const orderObj = item.orderId;
      if (!transformerObj || !orderObj) {
        toast.error("Required details not loaded. Cannot request strict approval.");
        return;
      }
      if (!confirm("Are you sure you want to request Strict Admin Approval?")) return;

      const isFinalFail = item.stage === 'FINAL_TESTING';
      const isPrimaryFail = item.stage === 'PRIMARY_TESTING';
      // Retest data is always stored in secondary_test; final failures read from final_test for the reason
      const testStageKey = isFinalFail ? 'final_test' : isPrimaryFail ? 'primary_test' : 'secondary_test';
      const testTypeLabel = isFinalFail ? 'Final Testing' : isPrimaryFail ? 'After Primary Testing' : 'Secondary Testing';

      // Generate reasons
      let failureReasons: string[] = [];
      const cores = getCoresForItem(item);
      cores.forEach((core: any) => {
        const results = transformerObj?.testHistory?.[testStageKey]?.[`${core.coreType}_results`] || [];
        if (core.coreType === 'metering') {
          results.forEach((res: any) => {
            if (res.rows) {
              res.rows.forEach((row: any) => {
                if (row.r100_r_pass === false || row.r100_p_pass === false) {
                  failureReasons.push(`Core ${core.coreNumber} (Metering 100%): ${row.r100_reason || 'Limits Exceeded'}`);
                }
                if (row.r25_r_pass === false || row.r25_p_pass === false) {
                  failureReasons.push(`Core ${core.coreNumber} (Metering 25%): ${row.r25_reason || 'Limits Exceeded'}`);
                }
              });
            }
          });
        } else {
          results.forEach((res: any) => {
            if (res.isPass === false && res.reason) {
              failureReasons.push(`Core ${core.coreNumber} (${core.coreType.toUpperCase()}): ${res.reason}`);
            }
          });
        }
      });

      const finalReason = failureReasons.length > 0
        ? [...new Set(failureReasons)].join(' | ')
        : "Accuracy Limits Exceeded";

      const extractedTypes = new Set<string>();
      failureReasons.forEach(r => {
        if (r.toLowerCase().includes('metering')) extractedTypes.add('METERING');
        else if (r.toLowerCase().includes('protection')) extractedTypes.add('PROTECTION');
        else if (r.toLowerCase().includes('ps')) extractedTypes.add('PS');
      });
      const uniqueTypes = Array.from(extractedTypes);
      const dynamicCoreType = uniqueTypes.length === 1 ? uniqueTypes[0] : (uniqueTypes.length > 1 ? 'Multiple' : 'COMPLETE UNIT');

      // 1. Post strict approval request
      await axios.post(`/strict-approvals/request`, {
        orderId: orderObj?._id || orderObj,
        jobId: transformerObj?.jobId,
        unitId: transformerObj?.uniqueId,
        clientName: orderObj?.clientName || 'N/A',
        coreType: dynamicCoreType,
        testType: testTypeLabel,
        failureReason: finalReason,
        testData: transformerObj?.testHistory?.[testStageKey],
        requestedBy: user.name || user.fullName || 'Testing Engineer'
      }, { withCredentials: true });

      // 2. Set failed transformer record status to TREATED and move to admin_review
      // (Backend status route handles moving to primary; we override with approve-stage to admin_review)
      await axios.put(
        `/failed-transformers/${item._id}/status`,
        {
          status: "TREATED",
          treatedBy: user.name || user.fullName || "Testing Engineer",
          resolutionRemarks: "Strict approval requested from Failed Section table."
        },
        { withCredentials: true }
      );

      // 3. Override to admin_review stage (strict approval bypasses normal primary flow)
      await axios.put(`/transformers/${transformerObj?.uniqueId}/approve-stage`, {
        stage: 'primary',
        nextStage: 'admin_review'
      }, { withCredentials: true });

      toast.success("Strict Approval Requested successfully!");
      fetchFailedTransformers();
    } catch (err) {
      console.error("Strict approval failed:", err);
      toast.error("Failed to request strict approval.");
    }
  };


  const handleRetestCoreSelect = (coreNumber: number) => {
    if (!retestingTransformer) return;
    setSelectedCore(coreNumber);

    const order = retestingTransformer.orderId;
    const transformer = retestingTransformer.transformerId;
    const cores = getCoresForItem(retestingTransformer);
    const config = cores.find((c: any) => c.coreNumber === coreNumber);
    if (!config) return;

    // Retest-save always writes to secondary_test, so check there first for saved retest values.
    // Then fall back to the original failure stage results.
    const testStageKey = retestingTransformer.stage === 'PRIMARY_TESTING' ? 'primary_test'
      : retestingTransformer.stage === 'FINAL_TESTING' ? 'final_test'
      : 'secondary_test';
    const coreDetails = order.coreDetails || [];
    const typeCores = coreDetails.filter((c: any) => {
      const t = (c.coreType || 'Metering').toLowerCase();
      if (config.coreType === 'ps') return t.includes('ps');
      if (config.coreType === 'protection') return t.includes('protection');
      return !t.includes('ps') && !t.includes('protection');
    });
    // Check secondary_test first (retest-save always writes here)
    const secResults = transformer.testHistory?.secondary_test?.[`${config.coreType}_results`] || [];
    const secResult = findResultForCore(secResults, coreNumber, config.coreType, coreDetails);

    // Then check original failure stage results
    const stageResults = transformer.testHistory?.[testStageKey]?.[`${config.coreType}_results`] || [];
    const stageResult = findResultForCore(stageResults, coreNumber, config.coreType, coreDetails);

    // Prefer secondary_test (latest saved retest), then original stage, then currentCoreId from getCoresForItem
    const foundResult = secResult || stageResult;

    if (foundResult && (foundResult.internalCoreNo || foundResult.coreId)) {
      setEnteredCoreId(foundResult.internalCoreNo || foundResult.coreId);
    } else if (config.currentCoreId && config.currentCoreId !== 'N/A') {
      setEnteredCoreId(config.currentCoreId);
    } else {
      // Find the typeIndex to fall back to the available pool
      const typeCores = coreDetails.filter((c: any) => {
        const t = (c.coreType || 'Metering').toLowerCase();
        if (config.coreType === 'ps') return t.includes('ps');
        if (config.coreType === 'protection') return t.includes('protection');
        return !t.includes('ps') && !t.includes('protection');
      });
      const typeIndex = typeCores.findIndex((c: any) => {
        for (let i = 0; i < coreDetails.length; i++) {
          if (coreDetails[i] === c) {
            if (i + 1 === coreNumber) return true;
          }
        }
        return false;
      });
      
      const expectedId = retestAvailablePool?.[config.coreType]?.[typeIndex];
      if (expectedId) {
        setEnteredCoreId(expectedId);
      } else {
        setEnteredCoreId('');
      }
    }
  };

  const handleStartRetest = () => {
    if (selectedCore !== null && enteredCoreId.trim() && retestingTransformer) {
      const cores = getCoresForItem(retestingTransformer);
      const core = cores.find((c: any) => c.coreNumber === selectedCore);
      const order = retestingTransformer.orderId;
      const accuracyClass = order?.coreDetails?.[selectedCore - 1]?.accuracyClass || '0.5';
      if (core) {
        setActiveReport({
          coreNumber: selectedCore,
          coreType: core.coreType,
          coreId: enteredCoreId,
          accuracyClass
        });
      }
    }
  };

  // Filter list locally
  const filteredList = failedList.filter(item => {
    const searchLow = searchTerm.toLowerCase();
    const serialNo = String(item.transformerUniqueId || '').toLowerCase();
    const jobNo = String(item.jobNumber || '').toLowerCase();
    const client = String(item.clientName || '').toLowerCase();
    const reason = String(item.failureReason || '').toLowerCase();

    const matchesSearch =
      serialNo.includes(searchLow) ||
      jobNo.includes(searchLow) ||
      client.includes(searchLow) ||
      reason.includes(searchLow);

    const matchesCoreType =
      coreTypeFilter === 'ALL' ||
      String(item.coreType || '').toUpperCase() === coreTypeFilter;

    const tStage = item.transformerId?.currentStage;
    const isApproved = !!(tStage && tStage !== 'secondary' && tStage !== 'secondary_failed' && tStage !== 'admin_review');

    const matchesStatus = (() => {
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'FAILED') {
        return item.status === 'FAILED' || (item.status === 'TREATED' && !isApproved);
      }
      if (statusFilter === 'TREATED') {
        return item.status === 'TREATED' && isApproved;
      }
      return String(item.status || '').toUpperCase() === statusFilter;
    })();

    // Robust protection: Hide old secondary failures if there is a newer primary failure
    const hasNewerFailure = failedList.some(other =>
      other.transformerUniqueId === item.transformerUniqueId &&
      other.stage === 'PRIMARY_TESTING' &&
      item.stage === 'SECONDARY_TESTING'
    );

    if (hasNewerFailure) {
      return false;
    }

    return matchesSearch && matchesCoreType && matchesStatus;
  });

  if (retestingTransformer) {
    const transformerObj = retestingTransformer.transformerId;
    const orderObj = retestingTransformer.orderId;
    const cores = getCoresForItem(retestingTransformer);

    // If activeReport is set, show the report view
    if (activeReport) {
      return (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <Button
              variant="outline"
              onClick={async () => { await refreshRetestingTransformer(); setActiveReport(null); }}
              size="sm"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Retest Dashboard
            </Button>
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Testing Core {activeReport.coreNumber} ({activeReport.coreType.toUpperCase()})
              </h2>
              <p className="text-xs text-gray-500">
                Transformer: {transformerObj?.uniqueId} | Core ID: {activeReport.coreId}
              </p>
            </div>
          </div>
          {activeReport.coreType === 'metering' && (
            <SecondaryMeteringReport
              transformer={transformerObj}
              coreNumber={activeReport.coreNumber}
              coreId={activeReport.coreId}
              testerName={user.name || user.fullName || 'Testing Engineer'}
              onBack={async () => { await refreshRetestingTransformer(); setActiveReport(null); }}
              stage={retestingTransformer.stage === 'PRIMARY_TESTING' ? 'primary' : retestingTransformer.stage === 'FINAL_TESTING' ? 'final' : 'secondary'}
              order={orderObj}
              onRefresh={refreshRetestingTransformer}
              accuracyClass={activeReport.accuracyClass}
              sourceStage={retestingTransformer.stage === 'PRIMARY_TESTING' ? 'primary' : retestingTransformer.stage === 'FINAL_TESTING' ? 'final' : 'secondary'}
              isFailedSection={true}
              failedTransformerId={retestingTransformer._id}
              failedStatus={retestingTransformer.status}
              isFailedCore={retestingTransformer.coreType ? retestingTransformer.coreType.toLowerCase().includes('meter') : false}
              retestHistory={retestingTransformer.retestHistory}
            />
          )}
          {activeReport.coreType === 'protection' && (
            <SecondaryProtectionReport
              transformer={transformerObj}
              coreNumber={activeReport.coreNumber}
              coreId={activeReport.coreId}
              testerName={user.name || user.fullName || 'Testing Engineer'}
              onBack={async () => { await refreshRetestingTransformer(); setActiveReport(null); }}
              stage={retestingTransformer.stage === 'PRIMARY_TESTING' ? 'primary' : retestingTransformer.stage === 'FINAL_TESTING' ? 'final' : 'secondary'}
              order={orderObj}
              onRefresh={refreshRetestingTransformer}
              accuracyClass={activeReport.accuracyClass}
              sourceStage={retestingTransformer.stage === 'PRIMARY_TESTING' ? 'primary' : retestingTransformer.stage === 'FINAL_TESTING' ? 'final' : 'secondary'}
              isFailedSection={true}
              failedTransformerId={retestingTransformer._id}
              failedStatus={retestingTransformer.status}
              isFailedCore={retestingTransformer.coreType ? retestingTransformer.coreType.toLowerCase().includes('protect') : false}
              retestHistory={retestingTransformer.retestHistory}
            />
          )}
          {activeReport.coreType === 'ps' && (
            <SecondaryPSReport
              transformer={transformerObj}
              coreNumber={activeReport.coreNumber}
              coreId={activeReport.coreId}
              testerName={user.name || user.fullName || 'Testing Engineer'}
              onBack={async () => { await refreshRetestingTransformer(); setActiveReport(null); }}
              stage={retestingTransformer.stage === 'PRIMARY_TESTING' ? 'primary' : retestingTransformer.stage === 'FINAL_TESTING' ? 'final' : 'secondary'}
              order={orderObj}
              onRefresh={refreshRetestingTransformer}
              accuracyClass={activeReport.accuracyClass}
              sourceStage={retestingTransformer.stage === 'PRIMARY_TESTING' ? 'primary' : retestingTransformer.stage === 'FINAL_TESTING' ? 'final' : 'secondary'}
              isFailedSection={true}
              failedTransformerId={retestingTransformer._id}
              failedStatus={retestingTransformer.status}
              isFailedCore={retestingTransformer.coreType ? retestingTransformer.coreType.toLowerCase().includes('ps') : false}
              retestHistory={retestingTransformer.retestHistory}
            />
          )}
        </div>
      );
    }

    const isAllCompleted = checkIsAllCoresCompleted(transformerObj, orderObj, retestingTransformer.stage);
    const hasFailures = checkHasFailures(transformerObj, orderObj, retestingTransformer.stage);

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setRetestingTransformer(null);
                fetchFailedTransformers();
              }}
              size="sm"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Failed List
            </Button>
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Retesting/Treatment Dashboard: <span className="font-mono text-red-600">{transformerObj?.uniqueId}</span>
              </h2>
              <p className="text-xs text-gray-500">
                Job: {retestingTransformer.jobNumber} | Client: {retestingTransformer.clientName}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={refreshRetestingTransformer}
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Transformer Info */}
        <Card className="p-6 bg-gray-50 border-gray-200">
          <h3 className="mb-4">Transformer Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Transformer Name</p>
              <p className="font-medium mt-1">{transformerObj?.name || 'Transformer'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Rating</p>
              <p className="font-medium mt-1">{getTransformerRating(transformerObj, orderObj)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Unique ID</p>
              <p className="font-medium mt-1">{transformerObj?.uniqueId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Nominal System Voltage</p>
              <p className="font-medium mt-1">{(orderObj?.voltageRating || orderObj?.nominalSystemVoltage) ? `${orderObj.voltageRating || orderObj.nominalSystemVoltage}kV` : 'N/A'}</p>
            </div>
          </div>
        </Card>

        {/* Cores List */}
        <Card className="p-6">
          <h3 className="mb-4">Select Core to Test</h3>
          <p className="text-sm text-gray-600 mb-4">
            This transformer has {cores.length} core(s). Click on a core to select it for testing.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cores.map((core: any) => {
              // Determine completion/failure state for UI
              const results = transformerObj?.testHistory?.secondary_test?.[`${core.coreType}_results`] || [];
              const coreDetails = orderObj?.coreDetails || [];
              const typeCores = coreDetails.filter((c: any) => {
                const t = (c.coreType || 'Metering').toLowerCase();
                if (core.coreType === 'ps') return t.includes('ps');
                if (core.coreType === 'protection') return t.includes('protection');
                return !t.includes('ps') && !t.includes('protection');
              });
              const typeIndex = typeCores.findIndex((c: any) => {
                for (let i = 0; i < coreDetails.length; i++) {
                  if (coreDetails[i] === c) {
                    if (i + 1 === core.coreNumber) return true;
                  }
                }
                return false;
              });

              const suffix = `-${String(core.coreNumber).padStart(3, '0')}`;
              const typeSeq = typeIndex !== -1 ? typeIndex + 1 : 1;
              const typeSuffix = `-${String(typeSeq).padStart(3, '0')}`;

              const coreResults = results.filter((r: any) => {
                const id = r.internalCoreNo || r.coreId || '';
                return id === core.currentCoreId ||
                  id.endsWith(suffix) || id.includes(suffix) ||
                  id.endsWith(typeSuffix) || id.includes(typeSuffix);
              });

              let isCompleted = false;
              if (coreResults.length > 0) {
                const hasValue = (v: any) => v !== undefined && v !== null && v !== '';
                if (core.coreType === 'metering') {
                  isCompleted = coreResults.every((res: any) =>
                    res.rows && res.rows.length > 0 && res.rows.every((row: any) =>
                      hasValue(row.r100) && hasValue(row.p100) && hasValue(row.r25) && hasValue(row.p25)
                    )
                  );
                } else if (core.coreType === 'protection') {
                  isCompleted = coreResults.every((res: any) =>
                    hasValue(res.ratioError100) &&
                    hasValue(res.resistance) &&
                    (hasValue(res.secondaryLimitingVoltage) || hasValue(res.secondaryLimitingVtg))
                  );
                } else if (core.coreType === 'ps') {
                  isCompleted = coreResults.every((res: any) =>
                    hasValue(res.turnRatioError) && hasValue(res.vk) && hasValue(res.iexVk)
                  );
                }
              }

              const coreColorClass = (() => {
                const baseColor = getCoreTypeColor(core.coreType);
                if (selectedCore === core.coreNumber) return 'ring-2 ring-red-500 ' + baseColor;
                return baseColor + ' hover:shadow-md';
              })();

              return (
                <Card
                  key={core.coreNumber}
                  className={`p-4 cursor-pointer transition-all ${coreColorClass} ${isCompleted ? 'bg-green-50' : ''}`}
                  onClick={() => handleRetestCoreSelect(core.coreNumber)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">Core {core.coreNumber}</span>
                        {(selectedCore === core.coreNumber || isCompleted) && (
                          <CheckCircle2 className={`w-5 h-5 ${isCompleted ? 'text-green-600' : 'text-gray-400'}`} />
                        )}
                      </div>
                      <p className="text-sm font-medium mb-1">{getCoreTypeLabel(core.coreType)}</p>
                      <p className="text-xs text-gray-600">
                        Type: {core.coreType.toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 font-mono">
                        Core ID: {core.currentCoreId}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>

        {/* Selected Core ID Selection & Action */}
        {selectedCore !== null && (() => {
          const config = cores.find((c: any) => c.coreNumber === selectedCore);
          if (!config) return null;

          return (
            <Card className="p-6 bg-yellow-50/50 border-yellow-200">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Configure and Start Test for Core {selectedCore}</h3>
              <div className="max-w-md space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-400 block mb-1">Internal Core No</label>
                  {retestingTransformer.stage === 'PRIMARY_TESTING' ? (
                    <div className="bg-gray-100 border border-gray-300 rounded-lg p-2.5 text-sm font-semibold text-gray-800 font-mono">
                      {enteredCoreId || config.currentCoreId || 'N/A'}
                    </div>
                  ) : (
                    <select
                      value={enteredCoreId}
                      onChange={(e) => setEnteredCoreId(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-red-500"
                    >
                      <option value="">-- Select Core ID --</option>
                      {(() => {
                        let pool: string[] = [];
                        if (retestAvailablePool) {
                          if (config.coreType === 'metering') pool = retestAvailablePool.metering;
                          else if (config.coreType === 'ps') pool = retestAvailablePool.ps;
                          else if (config.coreType === 'protection') pool = retestAvailablePool.protection;
                        }

                        const showList = [...pool];
                        if (enteredCoreId && !showList.includes(enteredCoreId)) {
                          showList.unshift(enteredCoreId);
                        }
                        if (config.currentCoreId && config.currentCoreId !== 'N/A' && !showList.includes(config.currentCoreId)) {
                          showList.unshift(config.currentCoreId);
                        }
                        const uniqueList = Array.from(new Set(showList)).sort();

                        return uniqueList.map((id, idx) => (
                          <option key={idx} value={id}>{id}</option>
                        ));
                      })()}
                    </select>
                  )}
                </div>

                <Button
                  onClick={handleStartRetest}
                  disabled={!enteredCoreId.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                >
                  {(() => {
                    const testStageKey = retestingTransformer.stage === 'PRIMARY_TESTING' ? 'primary_test' : 'secondary_test';
                    const results = transformerObj?.testHistory?.[testStageKey]?.[`${config.coreType}_results`] || [];
                    const isTested = results.some((r: any) => r.internalCoreNo === enteredCoreId || r.coreId === enteredCoreId);
                    return isTested ? "View / Edit Test Report" : "Start Core Retest";
                  })()}
                </Button>
              </div>
            </Card>
          );
        })()}

        {/* Approval Footer inside Dashboard */}
        {retestingTransformer.status !== 'FAILED' && isAllCompleted && !hasFailures && (
          <Card className="p-6 bg-green-50 border-green-200 shadow-sm animate-in fade-in">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-green-950">Transformer Ready for Final Approval</h4>
                <p className="text-sm text-green-700 mt-1">All cores have been successfully treated and validated within limits.</p>
              </div>
              <Button
                onClick={async () => {
                  try {
                    const targetStage = 'secondary';
                    const nextStage = 'primary';
                    const displayNext = 'Primary Testing';

                    if (!confirm(`Are you sure you want to approve Transformer ${transformerObj?.uniqueId} and move to ${displayNext}?`)) return;

                    // 1. Update Failed Transformer record status to TREATED
                    await axios.put(
                      `/failed-transformers/${retestingTransformer._id}/status`,
                      {
                        status: "TREATED",
                        treatedBy: user.name || user.fullName || "Testing Engineer",
                        resolutionRemarks: "Retest completed successfully. Approved from Failed Section."
                      },
                      { withCredentials: true }
                    );

                    // 2. Approve stage of transformer (move to next stage)
                    await axios.put(`/transformers/${transformerObj?.uniqueId}/approve-stage`, {
                      stage: targetStage,
                      nextStage: nextStage
                    }, { withCredentials: true });

                    toast.success("Transformer Approved successfully!");
                    setRetestingTransformer(null);
                    fetchFailedTransformers();
                  } catch (err) {
                    console.error("Failed to approve transformer:", err);
                    toast.error("Failed to approve transformer.");
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 shadow-md"
              >
                Approve Transformer
              </Button>
            </div>
          </Card>
        )}

        {retestingTransformer.status !== 'FAILED' && isAllCompleted && hasFailures && (
          <Card className="p-6 bg-red-50 border-red-200 shadow-sm animate-in fade-in">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-red-950">Strict Approval Required</h4>
                <p className="text-sm text-red-700 mt-1">Some cores exceed accuracy limits. You must request Admin Strict Approval.</p>
              </div>
              <Button
                onClick={async () => {
                  try {
                    if (!confirm("Are you sure you want to request Strict Admin Approval?")) return;

                    const isPrimaryFail = retestingTransformer.stage === 'PRIMARY_TESTING';
                    const testStageKey = isPrimaryFail ? 'primary_test' : 'secondary_test';

                    // Generate reasons
                    let failureReasons: string[] = [];
                    cores.forEach((core: any) => {
                      const results = transformerObj?.testHistory?.[testStageKey]?.[`${core.coreType}_results`] || [];
                      if (core.coreType === 'metering') {
                        results.forEach((res: any) => {
                          if (res.rows) {
                            res.rows.forEach((row: any) => {
                              if (row.r100_r_pass === false || row.r100_p_pass === false) {
                                failureReasons.push(`Core ${core.coreNumber} (Metering 100%): ${row.r100_reason || 'Limits Exceeded'}`);
                              }
                              if (row.r25_r_pass === false || row.r25_p_pass === false) {
                                failureReasons.push(`Core ${core.coreNumber} (Metering 25%): ${row.r25_reason || 'Limits Exceeded'}`);
                              }
                            });
                          }
                        });
                      } else {
                        results.forEach((res: any) => {
                          if (res.isPass === false && res.reason) {
                            failureReasons.push(`Core ${core.coreNumber} (${core.coreType.toUpperCase()}): ${res.reason}`);
                          }
                        });
                      }
                    });

                    const finalReason = failureReasons.length > 0
                      ? [...new Set(failureReasons)].join(' | ')
                      : "Accuracy Limits Exceeded";

                    const extractedTypes = new Set<string>();
                    failureReasons.forEach(r => {
                      if (r.toLowerCase().includes('metering')) extractedTypes.add('METERING');
                      else if (r.toLowerCase().includes('protection')) extractedTypes.add('PROTECTION');
                      else if (r.toLowerCase().includes('ps')) extractedTypes.add('PS');
                    });
                    const uniqueTypes = Array.from(extractedTypes);
                    const dynamicCoreType = uniqueTypes.length === 1 ? uniqueTypes[0] : (uniqueTypes.length > 1 ? 'Multiple' : 'COMPLETE UNIT');

                    // 1. Post strict approval
                    await axios.post(`/strict-approvals/request`, {
                      orderId: orderObj?._id || orderObj,
                      jobId: transformerObj?.jobId,
                      unitId: transformerObj?.uniqueId,
                      clientName: orderObj?.clientName || 'N/A',
                      coreType: dynamicCoreType,
                      testType: isPrimaryFail ? 'After Primary Testing' : 'Secondary Testing',
                      failureReason: finalReason,
                      testData: transformerObj?.testHistory?.[testStageKey],
                      requestedBy: user.name || user.fullName || 'Testing Engineer'
                    }, { withCredentials: true });

                    // 2. Set failed transformer record status to TREATED
                    await axios.put(
                      `/failed-transformers/${retestingTransformer._id}/status`,
                      {
                        status: "TREATED",
                        treatedBy: user.name || user.fullName || "Testing Engineer",
                        resolutionRemarks: "Strict approval requested from Failed Section."
                      },
                      { withCredentials: true }
                    );

                    // 3. Set transformer stage to admin_review
                    await axios.put(`/transformers/${transformerObj?.uniqueId}/approve-stage`, {
                      stage: isPrimaryFail ? 'primary' : 'secondary',
                      nextStage: 'admin_review'
                    }, { withCredentials: true });

                    toast.success("Strict Approval Requested successfully!");
                    setRetestingTransformer(null);
                    fetchFailedTransformers();
                  } catch (err) {
                    console.error("Strict approval failed:", err);
                    toast.error("Failed to request strict approval.");
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 shadow-md"
              >
                Request Strict Approval
              </Button>
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            Failed Transformers
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and perform re-testing/treatment for failed transformer units
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-red-100 bg-red-50/50">
          <div className="text-sm text-red-600 font-medium">Active Failures</div>
          <div className="text-3xl font-bold text-red-700 mt-1">
            {failedList.filter(x => {
              const tStage = x.transformerId?.currentStage;
              const isApproved = !!(tStage && tStage !== 'secondary' && tStage !== 'secondary_failed' && tStage !== 'admin_review');
              return x.status === 'FAILED' || (x.status === 'TREATED' && !isApproved);
            }).length}
          </div>
        </Card>
        <Card className="p-4 border-green-100 bg-green-50/50">
          <div className="text-sm text-green-600 font-medium">Treated / Resolved</div>
          <div className="text-3xl font-bold text-green-700 mt-1">
            {failedList.filter(x => {
              const tStage = x.transformerId?.currentStage;
              const isApproved = !!(tStage && tStage !== 'secondary' && tStage !== 'secondary_failed' && tStage !== 'admin_review');
              return x.status === 'TREATED' && isApproved;
            }).length}
          </div>
        </Card>
        <Card className="p-4 border-gray-100 bg-gray-50">
          <div className="text-sm text-gray-500 font-medium">Total Registered</div>
          <div className="text-3xl font-bold text-gray-700 mt-1">{failedList.length}</div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 flex flex-col gap-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Serial No, Job ID, Client, or Reason..."
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1 uppercase">Core Type</label>
              <select
                value={coreTypeFilter}
                onChange={(e) => setCoreTypeFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-red-500"
              >
                <option value="ALL">All Cores</option>
                <option value="METERING">Metering</option>
                <option value="PROTECTION">Protection</option>
                <option value="PS">PS</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1 uppercase">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-red-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="FAILED">Failed</option>
                <option value="TREATED">Treated</option>
              </select>
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={fetchFailedTransformers}
            size="sm"
            className="gap-2 shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh List
          </Button>
        </div>
      </Card>

      {/* Main Table Card */}
      <Card className="p-0 border-gray-200 shadow-sm bg-white mb-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-4" />
            <p className="text-gray-500">Loading failed transformers...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600 bg-red-50 m-4 rounded border border-red-100">
            <p className="font-bold">Error Loading Data</p>
            <p className="text-sm mt-1">{error}</p>
            <Button size="sm" variant="outline" className="mt-4" onClick={fetchFailedTransformers}>
              Retry
            </Button>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-16 px-4 bg-gray-50 m-4 rounded-lg border border-dashed border-gray-300">
            <div className="mx-auto w-12 h-12 bg-gray-100 flex items-center justify-center rounded-full mb-3">
              <CheckCircle2 className="w-6 h-6 text-gray-400" />
            </div>
            <p className="font-semibold text-gray-700">No Failed Transformers</p>
            <p className="text-sm text-gray-500 mt-1">
              There are currently no transformers marked as failed that match your filters.
            </p>
          </div>
        ) : (
          <div className="w-full">
            <table className="w-full text-sm border-separate" style={{ borderSpacing: 0 }}>
              <thead className="bg-white">
                <tr className="bg-white">
                  <th colSpan={10} className="px-4 py-3 font-normal text-left bg-white border-b border-gray-100">
                    <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                      <span className="text-sm font-semibold text-gray-500 mr-2 whitespace-nowrap">Visible Columns:</span>
                      
                      <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed select-none whitespace-nowrap">
                        Date Failed
                      </div>
                      <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed select-none whitespace-nowrap">
                        Serial No
                      </div>

                      {[
                        { id: 'jobNumber', label: 'Job Number' },
                        { id: 'clientName', label: 'Client Name' },
                        { id: 'coreType', label: 'Core Type' },
                        { id: 'failedIn', label: 'Failed In' },
                        { id: 'failureReason', label: 'Failure Reason' },
                        { id: 'status', label: 'Status' }
                      ].map((col) => (
                        <button
                          key={col.id}
                          onClick={() => toggleColumn(col.id as keyof typeof visibleColumns)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                            visibleColumns[col.id as keyof typeof visibleColumns]
                              ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {col.label}
                        </button>
                      ))}

                      <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed select-none whitespace-nowrap">
                        Actions
                      </div>
                    </div>
                  </th>
                </tr>
                <tr className="bg-gray-50">
                  {visibleColumns.dateFailed && <th className="px-4 py-3 text-left font-semibold text-gray-600 bg-gray-50 border-b border-gray-200">Date Failed</th>}
                  {visibleColumns.serialNo && <th className="px-4 py-3 text-left font-semibold text-gray-600 bg-gray-50 border-b border-gray-200">Serial No</th>}
                  {visibleColumns.jobNumber && <th className="px-4 py-3 text-left font-semibold text-gray-600 bg-gray-50 border-b border-gray-200">Job Number</th>}
                  {visibleColumns.clientName && <th className="px-4 py-3 text-left font-semibold text-gray-600 bg-gray-50 border-b border-gray-200">Client Name</th>}
                  {visibleColumns.coreType && <th className="px-4 py-3 text-left font-semibold text-gray-600 bg-gray-50 border-b border-gray-200">Core Type</th>}
                  {visibleColumns.failedIn && <th className="px-4 py-3 text-left font-semibold text-gray-600 bg-gray-50 border-b border-gray-200">Failed In</th>}
                  {visibleColumns.failureReason && <th className="px-4 py-3 text-left font-semibold text-gray-600 bg-gray-50 border-b border-gray-200">Failure Reason</th>}
                  {visibleColumns.status && <th className="px-4 py-3 text-left font-semibold text-gray-600 bg-gray-50 border-b border-gray-200">Status</th>}
                  {visibleColumns.actions && <th className="px-4 py-3 text-center font-semibold text-gray-600 bg-gray-50 border-b border-gray-200">Actions</th>}
                </tr>
              </thead>
              <tbody className="[&>tr>td]:border-b [&>tr>td]:border-gray-100 [&>tr:last-child>td]:border-b-0">
                {filteredList.map((item) => {
                  const dateToUse = item.date || item.updatedAt || item.createdAt;
                  const dateStr = dateToUse
                    ? new Date(dateToUse).toLocaleDateString('en-GB')
                    : '-';

                  const tStage = item.transformerId?.currentStage;
                  const isApproved = !!(tStage && tStage !== 'secondary' && tStage !== 'secondary_failed' && tStage !== 'admin_review');

                  return (
                    <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                      {visibleColumns.dateFailed && (
                        <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                          {dateStr}
                        </td>
                      )}
                      {visibleColumns.serialNo && (
                        <td className="px-4 py-3 font-mono font-semibold text-red-600">
                          {item.transformerUniqueId || (item.transformerId && item.transformerId.uniqueId) || '-'}
                        </td>
                      )}
                      {visibleColumns.jobNumber && <td className="px-4 py-3 text-gray-600 font-medium">{item.jobNumber || '-'}</td>}
                      {visibleColumns.clientName && <td className="px-4 py-3 text-gray-600">{item.clientName || '-'}</td>}
                      {visibleColumns.coreType && (
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
                            <Layers className="w-3 h-3" />
                            {item.coreType || '-'}
                          </span>
                        </td>
                      )}
                      {visibleColumns.failedIn && (
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                            item.stage === 'PRIMARY_TESTING' 
                              ? 'bg-amber-50 text-amber-700 border-amber-100' 
                              : item.stage === 'FINAL_TESTING'
                                ? 'bg-purple-50 text-purple-700 border-purple-100'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                          }`}>
                            {item.stage === 'PRIMARY_TESTING' ? 'After Primary' : item.stage === 'FINAL_TESTING' ? 'Final Testing' : 'Secondary'}
                          </span>
                        </td>
                      )}
                      {visibleColumns.failureReason && (
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-1.5 h-8 px-2"
                            onClick={() => setReasonModalData({ 
                              isOpen: true, 
                              reason: item.failureReason || '', 
                              serialNo: item.transformerUniqueId || (item.transformerId && item.transformerId.uniqueId) || '-' 
                            })}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Reason
                          </Button>
                        </td>
                      )}
                      {visibleColumns.status && (
                        <td className="px-4 py-3">
                          {(() => {
                            if (item.status === 'FAILED') {
                              return (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">
                                  ❌ Failed
                                </span>
                              );
                            } else if (isApproved) {
                              return (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                  Approved
                                </span>
                              );
                            } else {
                              return (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                                  🔄 Retesting
                                </span>
                              );
                            }
                          })()}
                        </td>
                      )}
                      {visibleColumns.actions && (
                        <td className="px-4 py-3 text-center">
                        {(() => {
                          if (isApproved) {
                            return <span className="text-xs text-gray-400 italic">Resolved</span>;
                          }

                          // Compute completion states
                          const transformerObj = item.transformerId;
                          const orderObj = item.orderId;
                          const isAllCompleted = transformerObj && orderObj ? checkIsAllCoresCompleted(transformerObj, orderObj, item.stage) : false;
                          const hasFailures = transformerObj && orderObj ? (item.status === 'FAILED' || checkHasFailures(transformerObj, orderObj, item.stage)) : false;

                          return (
                            <div className="flex items-center justify-center gap-2.5">
                              <Button
                                onClick={() => {
                                  if (!item.transformerId) {
                                    toast.error("Transformer detail not loaded. Cannot re-test.");
                                    return;
                                  }
                                  setRetestingTransformer(item);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-4 flex items-center justify-center gap-1.5 rounded-md shadow-sm transition-all hover:scale-105 active:scale-95 font-semibold"
                                size="sm"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Treat / Retest
                              </Button>
                              <Button
                                onClick={() => {
                                  if (!item.transformerId) {
                                    toast.error("Transformer detail not loaded. Cannot replace core.");
                                    return;
                                  }
                                  setReplacingCoreItem(item);
                                }}
                                className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-8 px-4 flex items-center justify-center gap-1.5 rounded-md shadow-sm transition-all hover:scale-105 active:scale-95 font-semibold"
                                size="sm"
                              >
                                <Wrench className="w-3.5 h-3.5" />
                                Core Replace
                              </Button>

                              {item.status !== 'FAILED' && isAllCompleted && !hasFailures && (
                                <Button
                                  onClick={() => handleApproveTransformerDirect(item)}
                                  className="bg-green-600 hover:bg-green-700 text-white text-xs h-8 px-4 flex items-center justify-center gap-1.5 rounded-md shadow-sm transition-all hover:scale-105 active:scale-95 font-semibold"
                                  size="sm"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Approve
                                </Button>
                              )}

                              {item.status !== 'FAILED' && isAllCompleted && hasFailures && (
                                <Button
                                  onClick={() => handleRequestStrictApprovalDirect(item)}
                                  className="bg-red-600 hover:bg-red-700 text-white text-xs h-8 px-4 flex items-center justify-center gap-1.5 rounded-md shadow-sm transition-all hover:scale-105 active:scale-95 font-semibold"
                                  size="sm"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Strict Approve
                                </Button>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Core Replacement Modal */}
      {replacingCoreItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 bg-white shadow-2xl rounded-xl border border-gray-100 flex flex-col gap-4 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange-500" />
                Core Replacement
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Replace the failed physical core for transformer <span className="font-mono font-bold text-red-600">{replacingCoreItem.transformerUniqueId}</span>.
              </p>
            </div>            <div className="space-y-4 my-2">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-xs font-bold text-red-800 uppercase">Failed Core Info:</div>
                <div className="text-sm text-red-700 mt-1">
                  <strong>Type:</strong> {replacingCoreItem.coreType} <br />
                  <strong>Core Serial No:</strong> {replacingCoreItem.failureParameters?.coreId || 'N/A'}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-gray-400 block mb-1">Choose Core (from Ready Stock)</label>
                {loadingPool ? (
                  <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                    Loading ready stock...
                  </div>
                ) : availableCoresPool.length === 0 ? (
                  <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 mt-1">
                    No available cores in the Ready Stock matching this core type ({replacingCoreItem.coreType}).
                  </p>
                ) : (
                  <select
                    value={selectedNewCoreId}
                    onChange={(e) => setSelectedNewCoreId(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-orange-500"
                  >
                    <option value="">-- Choose Core --</option>
                    {availableCoresPool.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => {
                  setReplacingCoreItem(null);
                  setSelectedCoreToReplace("");
                  setSelectedNewCoreId("");
                  setAvailableCoresPool([]);
                }}
                disabled={submittingReplacement}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmCoreReplacement}
                disabled={submittingReplacement || !selectedCoreToReplace || !selectedNewCoreId}
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs gap-1.5"
              >
                {submittingReplacement ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Replacing...
                  </>
                ) : (
                  <>
                    <Wrench className="w-3.5 h-3.5" />
                    Confirm Replace
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Reason Modal */}
      {reasonModalData?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-2xl p-6 bg-white shadow-2xl rounded-xl border border-gray-100 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h2 className="text-xl font-bold text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Failure Reason
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Detailed reason for failure for transformer <span className="font-mono font-bold text-red-600">{reasonModalData.serialNo}</span>.
              </p>
            </div>
            
            <div className="bg-red-50/50 border border-red-100 rounded-lg p-4 my-2 max-h-[60vh] overflow-y-auto">
              {reasonModalData.reason ? (
                <ul className="list-disc pl-5 space-y-2 text-sm text-red-800 font-medium">
                  {reasonModalData.reason.split(' | ').map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">No reason provided.</p>
              )}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => setReasonModalData(null)}
                className="text-sm font-semibold"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

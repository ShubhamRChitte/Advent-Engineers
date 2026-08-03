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
  Eye,
  XCircle
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
    if (coreType === 'protection') return t.match(/protection|prt/);
    return !t.includes('ps') && !t.match(/protection|prt/);
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
  // selectedCore removed
  const [enteredCoreIds, setEnteredCoreIds] = useState<Record<number, string>>({});
  const [retestAvailablePool, setRetestAvailablePool] = useState<any>(null);
  // enteredCoreId removed

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
    remark?: string;
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
      if (typeStr.match(/protection|prt/)) targetType = 'Protection';
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
      if (typeStr.match(/protection|prt/)) mappedType = 'protection';
      else if (typeStr.includes('ps')) mappedType = 'ps';

      // Find current core ID from the appropriate stage results
      const results = transformer.testHistory?.[testStageKey]?.[`${mappedType}_results`] || [];

      let foundResult = findResultForCore(results, coreNum, mappedType, coreDetails);

      // Fallback chain: if the primary stage didn't have a result, try secondary_test
      // If FINAL_TESTING didn't have a result, try secondary_test then primary_test
      if (!foundResult || !(foundResult.internalCoreNo || foundResult.coreId)) {
        const secResults = transformer.testHistory?.secondary_test?.[`${mappedType}_results`] || [];
        foundResult = findResultForCore(secResults, coreNum, mappedType, coreDetails);
        
        if (!foundResult || !(foundResult.internalCoreNo || foundResult.coreId)) {
          const primResults = transformer.testHistory?.primary_test?.[`${mappedType}_results`] || [];
          foundResult = findResultForCore(primResults, coreNum, mappedType, coreDetails);
        }
      }
      
      let fallbackId = 'N/A';
      const secTest = transformer?.testHistory?.secondary_test;
      if (mappedType === 'metering') {
        fallbackId = secTest?.meteringCoreId || transformer?.meteringCoreId || 'N/A';
      } else if (mappedType === 'ps') {
        fallbackId = secTest?.psCoreId || transformer?.psCoreId || 'N/A';
      } else if (mappedType === 'protection') {
        fallbackId = secTest?.protectionCoreId || transformer?.protectionCoreId || 'N/A';
      }

      const currentId = foundResult ? (foundResult.internalCoreNo || foundResult.coreId) : null;
      let resolvedId = currentId || fallbackId;

      // Check retestHistory for any replacements
      const historyArr = transformer?.retestHistory || item?.retestHistory;
      if (historyArr && Array.isArray(historyArr)) {
        const replacements = historyArr.filter((h: any) =>
          h.action === 'Core Replaced' && (h.coreNumber === coreNum || (resolvedId !== 'N/A' && h.oldCoreId === resolvedId))
        );
        if (replacements.length > 0) {
          const lastRep = replacements[replacements.length - 1];
          if (lastRep.newCoreId) resolvedId = lastRep.newCoreId;
        }
      }

      return {
        coreNumber: coreNum,
        coreType: mappedType,
        currentCoreId: resolvedId
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

          const coreNum = selectedCoreToReplace || (matchedCore ? matchedCore.coreNumber : 1);
          setSelectedCoreToReplace(Number(coreNum));

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

          const [response, approvedRes] = await Promise.all([
            axios.get(`/orders/${orderId}/transformers`, { withCredentials: true }),
            axios.get(`/core-tests/approved-ids/${orderId}`, { withCredentials: true })
          ]);

          const dbTransformers = response.data || [];
          const approvedData = approvedRes.data?.success ? approvedRes.data : { metering: [], ps: [], protection: [] };

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

          const getPool = (type: 'metering' | 'ps' | 'protection') => {
            const backendPool = transformerObj.availableCoreIdsPool?.[type];
            if (backendPool && Array.isArray(backendPool) && backendPool.length > 0) {
              return backendPool.filter((id: string) => !getUsedIds(type).has(id));
            }
            const approvedList = approvedData[type] || [];
            return approvedList.filter((id: string) => !getUsedIds(type).has(id));
          };

          const pool = {
            metering: getPool('metering'),
            ps: getPool('ps'),
            protection: getPool('protection')
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

    if (stage === 'PRIMARY_TESTING') {
      return primaryData;
    }

    if (stage === 'FINAL_TESTING') {
      return finalData;
    }

    return secondaryData;
  };

  const getActiveCoreIds = (transformer: any) => {
    if (!transformer) return [];
    const secTest = transformer.testHistory?.secondary_test || {};
    
    // The user selects these cores initially from ready stock.
    const initialCores = [
      secTest.meteringCoreId,
      secTest.psCoreId,
      secTest.protectionCoreId
    ].filter(Boolean);

    return initialCores.map((coreId: string) => {
      let currentCoreId = coreId;
      if (transformer.retestHistory && Array.isArray(transformer.retestHistory)) {
        const replacements = transformer.retestHistory.filter((h: any) => 
          h.action === 'Core Replaced' && (h.oldCoreId === currentCoreId || h.details?.includes(currentCoreId))
        );
        if (replacements.length > 0) {
          const lastReplacement = replacements[replacements.length - 1];
          if (lastReplacement.newCoreId) {
            currentCoreId = lastReplacement.newCoreId;
          }
        }
      }
      return currentCoreId;
    });
  };

  const filterActiveResults = (results: any[], activeCoreIds: string[]) => {
    const filtered = (results || []).filter((r: any) => {
      const id = r.internalCoreNo || r.coreId || '';
      if (!id) return false;
      return activeCoreIds.includes(id) || activeCoreIds.some(cid => cid.endsWith(id.slice(-4)));
    });

    if (activeCoreIds.length > 0) {
      return filtered;
    }

    return filtered;
  };

  const checkIsAllCoresCompleted = (transformer: any, order: any, stage: string) => {
    if (!transformer || !order) return false;
    const coreDetails = order.coreDetails || [];
    const testData = getMergedTestData(transformer, stage);
    const activeCoreIds = getActiveCoreIds(transformer);

    const requiredMeteringCount = coreDetails.filter((c: any) => {
      const t = (c.coreType || 'Metering').toLowerCase();
      return !t.includes('ps') && !t.match(/protection|prt/);
    }).length;
    const requiredProtectionCount = coreDetails.filter((c: any) => (c.coreType || 'Metering').toLowerCase().match(/protection|prt/)).length;
    const requiredPsCount = coreDetails.filter((c: any) => (c.coreType || 'Metering').toLowerCase().includes('ps')).length;

    const isFilled = (val: any) => val !== undefined && val !== null && String(val).trim() !== '';

    const deduplicate = (results: any[]) => {
      const map = new Map<string, any>();
      results.forEach(res => {
        const id = res.internalCoreNo || res.coreId || '';
        const match = id.match(/-(\d{3})$/);
        const suffix = match ? match[1] : id;
        const key = res.ratioValue ? `${suffix}-${res.ratioValue}` : suffix;
        map.set(key, res);
      });
      return Array.from(map.values());
    };

    const checkTypeCompleted = (rawResults: any[], requiredCount: number, type: string) => {
      if (requiredCount === 0) return true;
      const activeResults = filterActiveResults(rawResults, activeCoreIds);
      const results = deduplicate(activeResults);
      
      const uniqueCoresTested = new Set(results.map(r => {
        const id = r.internalCoreNo || r.coreId || '';
        const match = id.match(/-(\d{3})$/);
        return match ? match[1] : id;
      })).size;

      if (uniqueCoresTested < requiredCount) return false;

      if (type === 'metering') {
        return results.every((res: any) =>
          res.isPass !== false && res.isPass !== 'false' &&
          res.rows && res.rows.length > 0 && res.rows.every((row: any) =>
            isFilled(row.r100) && isFilled(row.p100) && isFilled(row.r25) && isFilled(row.p25) &&
            row.r100_r_pass !== false && row.r100_p_pass !== false &&
            row.r25_r_pass !== false && row.r25_p_pass !== false &&
            row.r100_pass !== false && row.p100_pass !== false &&
            row.r25_pass !== false && row.p25_pass !== false &&
            row.r100_pass !== 'false' && row.p100_pass !== 'false' &&
            row.r25_pass !== 'false' && row.p25_pass !== 'false' &&
            row.isPass !== false && row.isPass !== 'false'
          )
        );
      } else if (type === 'protection') {
        return results.every((res: any) =>
          res.isPass !== false && res.isPass !== 'false' &&
          isFilled(res.ratioError100) &&
          isFilled(res.phaseError) &&
          isFilled(res.resistance) &&
          isFilled(res.alf) &&
          isFilled(res.excitationCurrent) &&
          (isFilled(res.secondaryLimitingVoltage) || isFilled(res.secondaryLimitingVtg)) &&
          isFilled(res.compositeError)
        );
      } else if (type === 'ps') {
        return results.every((res: any) =>
          res.isPass !== false && res.isPass !== 'false' &&
          isFilled(res.turnRatioError) &&
          isFilled(res.resistance) &&
          isFilled(res.vk) &&
          isFilled(res.iexVk) &&
          isFilled(res.iex11Vk)
        );
      }
      return false;
    };

    const meteringDone = checkTypeCompleted(testData.metering_results, requiredMeteringCount, 'metering');
    const protectionDone = checkTypeCompleted(testData.protection_results, requiredProtectionCount, 'protection');
    const psDone = checkTypeCompleted(testData.ps_results, requiredPsCount, 'ps');

    return meteringDone && protectionDone && psDone;
  };

  const checkHasFailures = (transformer: any, order: any, stage: string, itemRecord?: any) => {
    if (!transformer || !order) return false;
    const testData = getMergedTestData(transformer, stage);
    const activeCoreIds = getActiveCoreIds(transformer);

    const deduplicate = (results: any[]) => {
      const activeResults = filterActiveResults(results, activeCoreIds);
      const map = new Map<string, any>();
      activeResults.forEach(res => {
        const id = res.internalCoreNo || res.coreId || '';
        const match = id.match(/-(\d{3})$/);
        const suffix = match ? match[1] : id;
        const key = res.ratioValue ? `${suffix}-${res.ratioValue}` : suffix;
        map.set(key, res);
      });
      return Array.from(map.values());
    };

    const meteringResults = deduplicate(testData.metering_results);
    const protectionResults = deduplicate(testData.protection_results);
    const psResults = deduplicate(testData.ps_results);

    const meteringFail = meteringResults.some((res: any) =>
      res.isPass === false || res.isPass === 'false' ||
      (res.rows && res.rows.some((row: any) =>
        row.r100_r_pass === false || row.r100_p_pass === false ||
        row.r25_r_pass === false || row.r25_p_pass === false ||
        row.r100_pass === false || row.p100_pass === false ||
        row.r25_pass === false || row.p25_pass === false ||
        row.r100_pass === 'false' || row.p100_pass === 'false' ||
        row.r25_pass === 'false' || row.p25_pass === 'false' ||
        row.isPass === false || row.isPass === 'false' ||
        (row.r100_reason && row.r100_reason !== 'OK' && row.r100_reason !== '') ||
        (row.r25_reason && row.r25_reason !== 'OK' && row.r25_reason !== '')
      ))
    );

    const protectionFail = protectionResults.some((res: any) =>
      res.isPass === false || res.isPass === 'false' ||
      (res.reason && typeof res.reason === 'string' && res.reason.toLowerCase().includes('fail'))
    );
    const psFail = psResults.some((res: any) =>
      res.isPass === false || res.isPass === 'false' ||
      (res.reason && typeof res.reason === 'string' && res.reason.toLowerCase().includes('fail'))
    );

    if (meteringFail || protectionFail || psFail) {
      return true;
    }

    // Check if any core has NOT been tested yet AND metadata records it as failed
    const itemToUse = itemRecord || { orderId: order, transformerId: transformer, stage };
    const cores = getCoresForItem(itemToUse);
    const untestedCoreFailed = cores.some((core: any) => {
      const suffix = `-${String(core.coreNumber).padStart(3, '0')}`;

      // 1. Check if this core has test results already
      let hasResults = false;
      if (core.coreType === 'metering') hasResults = meteringResults.length > 0;
      else if (core.coreType === 'protection') hasResults = protectionResults.length > 0;
      else if (core.coreType === 'ps') hasResults = psResults.length > 0;

      if (hasResults) {
        // Test results exist and passed 100% (since meteringFail, protectionFail, psFail were all false above)
        return false;
      }

      // 2. Check if this core was replaced in retestHistory
      const historyArr = transformer?.retestHistory || itemToUse?.retestHistory;
      const isReplaced = historyArr && Array.isArray(historyArr) &&
        historyArr.some((h: any) => h.action === 'Core Replaced' && (h.newCoreId === core.currentCoreId || h.coreNumber === core.coreNumber));
      if (isReplaced) return false;

      // 3. Metadata failure for untested core
      const tCoreType = (itemToUse?.coreType || '').toUpperCase();
      const cCoreType = (core.coreType || '').toUpperCase();
      const failureReason = (itemToUse?.failureReason || '').toLowerCase();
      const failureParamCoreId = itemToUse?.failureParameters?.coreId;

      if (failureParamCoreId && (failureParamCoreId === core.currentCoreId || failureParamCoreId.endsWith(suffix))) {
        return true;
      }
      if (failureReason.includes(`core ${core.coreNumber}`) || failureReason.includes(`core-${core.coreNumber}`)) {
        return true;
      }
      if (tCoreType === cCoreType || (tCoreType.includes(cCoreType) && !['MULTIPLE', 'COMPLETE UNIT', 'PT_FINAL'].includes(tCoreType))) {
        return true;
      }
      if (['MULTIPLE', 'COMPLETE UNIT', 'PT_FINAL'].includes(tCoreType)) {
        return true;
      }
      return false;
    });

    return untestedCoreFailed;
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

      // Reserve core in Ready Stock for this order
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
        } catch (stockErr) {
          console.warn("Could not reserve core in ready stock tracking:", stockErr);
        }
      }

      let resolvedOldCoreId = targetCore.currentCoreId && targetCore.currentCoreId !== 'N/A' ? targetCore.currentCoreId : '';
      if (!resolvedOldCoreId) {
        resolvedOldCoreId = getDefaultCoreId(targetCore.coreNumber, targetCore) || enteredCoreIds[targetCore.coreNumber] || '';
      }

      const payload = {
        coreNumber: targetCore.coreNumber,
        coreType: targetCore.coreType,
        oldCoreId: resolvedOldCoreId === 'N/A' ? '' : resolvedOldCoreId,
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
          // setSelectedCore removed
          setEnteredCoreIds(prev => ({...prev, [selectedCoreToReplace as number]: selectedNewCoreId}));

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

        `/failed-transformers?stage=PRIMARY_TESTING,FINAL_TESTING`,

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
        else if (r.toLowerCase().match(/protection|prt/)) extractedTypes.add('PROTECTION');
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


  
  const getDefaultCoreId = (coreNumber: number, config: any) => {
    if (!retestingTransformer) return '';
    if (config?.currentCoreId && config.currentCoreId !== 'N/A' && config.currentCoreId.trim() !== '') {
      return config.currentCoreId;
    }

    const order = retestingTransformer.orderId;
    const transformer = retestingTransformer.transformerId;
    const testStageKey = retestingTransformer.stage === 'PRIMARY_TESTING' ? 'primary_test'
      : retestingTransformer.stage === 'FINAL_TESTING' ? 'final_test'
      : 'secondary_test';
    const coreDetails = order?.coreDetails || [];
    
    const secResults = transformer?.testHistory?.secondary_test?.[`${config.coreType}_results`] || [];
    const secResult = findResultForCore(secResults, coreNumber, config.coreType, coreDetails);
    
    const stageResults = transformer?.testHistory?.[testStageKey]?.[`${config.coreType}_results`] || [];
    const stageResult = findResultForCore(stageResults, coreNumber, config.coreType, coreDetails);
    
    const foundResult = secResult || stageResult;

    if (foundResult && (foundResult.internalCoreNo || foundResult.coreId)) {
      return foundResult.internalCoreNo || foundResult.coreId;
    } else {
      const typeCores = coreDetails.filter((c: any) => {
        const t = (c.coreType || 'Metering').toLowerCase();
        if (config.coreType === 'ps') return t.includes('ps');
        if (config.coreType === 'protection') return t.match(/protection|prt/);
        return !t.includes('ps') && !t.match(/protection|prt/);
      });
      const typeIndex = typeCores.findIndex((c: any) => {
        for (let i = 0; i < coreDetails.length; i++) {
          if (coreDetails[i] === c) {
            if (i + 1 === coreNumber) return true;
          }
        }
        return false;
      });
      return retestAvailablePool?.[config.coreType]?.[typeIndex] || '';
    }
  };

  const handleStartRetest = (coreNumber: number, coreId: string) => {
    if (!retestingTransformer || !coreId.trim()) return;
    const cores = getCoresForItem(retestingTransformer);
    const config = cores.find((c: any) => c.coreNumber === coreNumber);
    if (!config) return;

    const order = retestingTransformer.orderId;
    const accuracyClass = order?.coreDetails?.[coreNumber - 1]?.accuracyClass || '0.5';
    
    setActiveReport({
      coreNumber: coreNumber,
      coreType: config.coreType,
      coreId: coreId,
      accuracyClass
    });
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
    const isApproved = !!(
      tStage &&
      tStage !== 'secondary' &&
      tStage !== 'secondary_failed' &&
      tStage !== 'admin_review' &&
      tStage !== 'pt_pretest_failed' &&
      tStage !== 'pt_failed'
    );

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

  let mainContent = null;

  if (retestingTransformer) {
    const transformerObj = retestingTransformer.transformerId;
    const orderObj = retestingTransformer.orderId;
    const coreDetails = orderObj?.coreDetails || [];
    const cores = getCoresForItem(retestingTransformer);

    // If activeReport is set, show the report view
    if (activeReport) {
      mainContent = (
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
              isFailedCore={['METERING', 'COMPLETE UNIT', 'PT_FINAL', 'MULTIPLE'].includes(retestingTransformer.coreType?.toUpperCase() || '') || (retestingTransformer.coreType?.toLowerCase().includes('meter') || false)}
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
              isFailedCore={retestingTransformer.coreType?.toUpperCase().match(/PROTECTION|PRT/) || ['COMPLETE UNIT', 'PT_FINAL', 'MULTIPLE'].includes(retestingTransformer.coreType?.toUpperCase() || '')}
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
              isFailedCore={['PS', 'COMPLETE UNIT', 'PT_FINAL', 'MULTIPLE'].includes(retestingTransformer.coreType?.toUpperCase() || '') || (retestingTransformer.coreType?.toLowerCase().includes('ps') || false)}
              retestHistory={retestingTransformer.retestHistory}
            />
          )}
        </div>
      );
    } else {

    const isAllCompleted = checkIsAllCoresCompleted(transformerObj, orderObj, retestingTransformer.stage);
    const hasFailures = checkHasFailures(transformerObj, orderObj, retestingTransformer.stage, retestingTransformer);

      mainContent = (
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

        {/* Failure Details & Remark Alert */}
        {(retestingTransformer.failureReason || retestingTransformer.remark) && (
          <Card className="p-4 bg-red-50/70 border-red-200 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Failure Details</span>
            </div>
            {retestingTransformer.failureReason && (
              <p className="text-xs text-red-800">
                <span className="font-bold">Reason:</span> {retestingTransformer.failureReason}
              </p>
            )}
            {retestingTransformer.remark && (
              <p className="text-xs text-amber-900 bg-amber-100/70 p-2.5 rounded-md border border-amber-200/80 font-medium">
                <span className="font-bold text-amber-950">Remark:</span> {retestingTransformer.remark}
              </p>
            )}
          </Card>
        )}

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
              const suffix = `-${String(core.coreNumber).padStart(3, '0')}`;
              const typeCores = coreDetails.filter((c: any) => {
                const t = (c.coreType || 'Metering').toLowerCase();
                if (core.coreType === 'ps') return t.includes('ps');
                if (core.coreType === 'protection') return t.match(/protection|prt/);
                return !t.includes('ps') && !t.match(/protection|prt/);
              });
              const typeIndex = typeCores.findIndex((c: any) => {
                for (let i = 0; i < coreDetails.length; i++) {
                  if (coreDetails[i] === c) {
                    if (i + 1 === core.coreNumber) return true;
                  }
                }
                return false;
              });

              const typeSeq = typeIndex !== -1 ? typeIndex + 1 : 1;
              const typeSuffix = `-${String(typeSeq).padStart(3, '0')}`;
              
              const normType = (core.coreType || 'metering').toLowerCase();
              const targetField = normType.includes('ps') ? 'ps_results' : normType.includes('protect') ? 'protection_results' : 'metering_results';

              const mergedTestData = getMergedTestData(transformerObj, retestingTransformer.stage);
              const results = mergedTestData?.[targetField] || [];

              const rawCoreResults = results.filter((r: any) => {
                const id = String(r.internalCoreNo || r.coreId || '').trim();
                return id === core.currentCoreId ||
                  id === String(core.coreNumber) ||
                  id.endsWith(suffix) || id.includes(suffix) ||
                  id.endsWith(typeSuffix) || id.includes(typeSuffix);
              });

              // Extract retest/treated readings from retestHistory for this core
              const retestReadings: any[] = [];
              if (retestingTransformer.retestHistory && Array.isArray(retestingTransformer.retestHistory)) {
                retestingTransformer.retestHistory.forEach((h: any) => {
                  const readings = h.newTreatmentReadings || h.treatedReadings || h.readings || [];
                  if (Array.isArray(readings)) {
                    readings.forEach((r: any) => {
                      const id = String(r.internalCoreNo || r.coreId || '').trim();
                      const matchesId = !id || id === core.currentCoreId || id === String(core.coreNumber) || (suffix && id.endsWith(suffix)) || (typeSuffix && id.endsWith(typeSuffix));
                      const isPsReading = normType.includes('ps') && (r.turnRatioError !== undefined || r.vk !== undefined || r.iexVk !== undefined);
                      const isProtectionReading = (normType.includes('protect') || normType.includes('prt')) && (r.ratioError100 !== undefined || r.phaseError !== undefined || r.excitationCurrent !== undefined || r.compositeError !== undefined);
                      const isMeteringReading = normType.includes('meter') && (r.rows !== undefined || r.r100 !== undefined);

                      if (matchesId || isPsReading || isProtectionReading || isMeteringReading) {
                        retestReadings.push(r);
                      }
                    });
                  }
                });
              }

              // If retest readings exist in retestHistory, prioritize them over old stage history!
              const coreResults = retestReadings.length > 0 ? retestReadings : rawCoreResults;

              // Check if core is failed or completed
              const tCoreType = (retestingTransformer.coreType || '').toUpperCase();
              const cCoreType = (core.coreType || '').toUpperCase();
              const failureReason = (retestingTransformer.failureReason || '').toLowerCase();
              const failureParamCoreId = retestingTransformer.failureParameters?.coreId;

              const hasValue = (v: any) => v !== undefined && v !== null && String(v).trim() !== '';

              let hasTestResults = false;
              let testResultFailed = false;
              let isCompleted = false;

              if (coreResults.length > 0) {
                if (normType.includes('meter')) {
                  const hasAnyRows = coreResults.some((res: any) => res.rows && res.rows.length > 0);
                  if (hasAnyRows) {
                    hasTestResults = true;
                    testResultFailed = coreResults.some((res: any) =>
                      res.isPass === false || res.isPass === 'false' ||
                      (res.rows && res.rows.length > 0 && res.rows.some((row: any) =>
                        row.r100_r_pass === false || row.r100_p_pass === false ||
                        row.r25_r_pass === false || row.r25_p_pass === false ||
                        row.r100_pass === false || row.p100_pass === false ||
                        row.r25_pass === false || row.p25_pass === false ||
                        row.r100_pass === 'false' || row.p100_pass === 'false' ||
                        row.r25_pass === 'false' || row.p25_pass === 'false' ||
                        row.isPass === false || row.isPass === 'false' ||
                        (row.r100_reason && row.r100_reason !== 'OK' && row.r100_reason !== '') ||
                        (row.r25_reason && row.r25_reason !== 'OK' && row.r25_reason !== '')
                      ))
                    );
                    isCompleted = !testResultFailed && coreResults.every((res: any) =>
                      res.isPass !== false && res.isPass !== 'false' &&
                      res.rows && res.rows.length > 0 && res.rows.every((row: any) =>
                        hasValue(row.r100) && hasValue(row.p100) && hasValue(row.r25) && hasValue(row.p25)
                      )
                    );
                  }
                } else if (normType.includes('protect') || normType.includes('prt')) {
                  hasTestResults = true;
                  testResultFailed = coreResults.some((res: any) => {
                    if (res.isPass === false || res.isPass === 'false') return true;
                    if (res.reason && typeof res.reason === 'string' && res.reason.toLowerCase().includes('fail')) return true;
                    if (res.ratioError100 || res.ratioError) {
                      const rVal = Math.abs(parseFloat(res.ratioError100 || res.ratioError || '0'));
                      if (!isNaN(rVal) && rVal > 1.0) return true;
                    }
                    if (res.phaseError) {
                      const pVal = Math.abs(parseFloat(res.phaseError || '0'));
                      if (!isNaN(pVal) && pVal > 60) return true;
                    }
                    return false;
                  });
                  isCompleted = !testResultFailed && coreResults.every((res: any) =>
                    res.isPass !== false && res.isPass !== 'false' &&
                    (hasValue(res.ratioError100) || hasValue(res.ratioError) || hasValue(res.ratio)) &&
                    hasValue(res.phaseError)
                  );
                } else if (normType.includes('ps')) {
                  hasTestResults = true;
                  testResultFailed = coreResults.some((res: any) => {
                    if (res.isPass === false || res.isPass === 'false') return true;
                    if (res.reason && typeof res.reason === 'string' && res.reason.toLowerCase().includes('fail')) return true;
                    if (res.turnRatioError && String(res.turnRatioError).trim() !== '') {
                      const errVal = Math.abs(parseFloat(res.turnRatioError || '0'));
                      if (!isNaN(errVal) && errVal > 0.25) return true;
                    }
                    return false;
                  });
                  isCompleted = !testResultFailed && coreResults.every((res: any) =>
                    res.isPass !== false && res.isPass !== 'false' &&
                    hasValue(res.turnRatioError)
                  );
                }
              }

              // Determine metadata failure specifically for this core
              let recordSaysFailed = false;
              const failureReasonLow = failureReason.toLowerCase();
              if (failureParamCoreId && (failureParamCoreId === core.currentCoreId || failureParamCoreId.endsWith(suffix))) {
                recordSaysFailed = true;
              } else if (failureReasonLow.includes(`core ${core.coreNumber}`) || failureReasonLow.includes(`core-${core.coreNumber}`)) {
                recordSaysFailed = true;
              } else if (tCoreType.toLowerCase().includes(normType) || failureReasonLow.includes(normType)) {
                recordSaysFailed = true;
              } else if (['MULTIPLE', 'COMPLETE UNIT', 'PT_FINAL'].includes(tCoreType)) {
                const mentionsOtherCoreSpecifically = /core\s*[1-9]/i.test(failureReasonLow);
                if (mentionsOtherCoreSpecifically) {
                  if (failureReasonLow.includes(`core ${core.coreNumber}`) || failureReasonLow.includes(`core-${core.coreNumber}`)) {
                    recordSaysFailed = true;
                  }
                } else {
                  recordSaysFailed = true;
                }
              }

              let isCoreFailed = false;
              const isReplaced = retestingTransformer.retestHistory && Array.isArray(retestingTransformer.retestHistory) &&
                retestingTransformer.retestHistory.some((h: any) => h.action === 'Core Replaced' && (h.newCoreId === core.currentCoreId || h.coreNumber === core.coreNumber));

              if (hasTestResults) {
                // When test results exist for a core (whether original or replaced):
                // If the test values fail accuracy/pass checks, mark as failed!
                if (testResultFailed) {
                  isCoreFailed = true;
                } else if (!isReplaced && recordSaysFailed && !isCompleted) {
                  isCoreFailed = true;
                } else {
                  isCoreFailed = false;
                }
              } else if (isReplaced) {
                // Untested freshly replaced core
                isCoreFailed = false;
              } else {
                // Untested original core
                isCoreFailed = recordSaysFailed;
              }

              if (isCoreFailed) isCompleted = false;

              const coreColorClass = (() => {
                const baseColor = getCoreTypeColor(core.coreType);
                return baseColor;
              })();
              
              const defaultId = getDefaultCoreId(core.coreNumber, core);
              const currentEnteredId = enteredCoreIds[core.coreNumber] !== undefined ? enteredCoreIds[core.coreNumber] : defaultId;

              return (
                <div key={core.coreNumber} className="flex flex-col gap-2">
                  <Card
                    className={`p-4 transition-all ${coreColorClass} ${isCompleted ? 'bg-green-50 shadow-md' : 'shadow-sm'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">Core {core.coreNumber}</span>
                          {isCoreFailed ? (
                            <XCircle className="w-5 h-5 text-red-600" />
                          ) : isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : null}
                        </div>
                        <p className="text-sm font-medium mb-1">{getCoreTypeLabel(core.coreType)}</p>
                        <p className="text-xs text-gray-600">
                          Type: {core.coreType?.toUpperCase()}
                          <br />
                          Core ID: {core.currentCoreId}
                        </p>
                      </div>
                    </div>
                  </Card>
                  
                  {/* Configuration inline */}
                  <Card className="p-4 bg-yellow-50/50 border-yellow-200">
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">Configure and Start Test for Core {core.coreNumber}</h3>
                    <div className="w-full space-y-4">
                      <div>
                        <label className="text-xs font-bold uppercase text-gray-400 block mb-1">Internal Core No</label>
                        <div className="bg-gray-100 border border-gray-300 rounded-lg p-2.5 text-sm font-semibold text-gray-800 font-mono">
                          {currentEnteredId || 'N/A'}
                        </div>
                      </div>

                      <div className="flex flex-col xl:flex-row items-center gap-2 mt-4">
                        <Button
                          onClick={() => handleStartRetest(core.coreNumber, currentEnteredId)}
                          disabled={!currentEnteredId.trim()}
                          className="bg-red-600 hover:bg-red-700 text-white font-semibold flex-1 w-full"
                        >
                          {(() => {
                            const isTested = results.some((r: any) => r.internalCoreNo === currentEnteredId || r.coreId === currentEnteredId);
                            return isTested ? "View / Edit Test Report" : "Start Core Retest";
                          })()}
                        </Button>

                        {isCoreFailed && (
                          <Button
                            onClick={() => {
                              let coreNum: any = core.coreNumber;
                              setReplacingCoreItem(retestingTransformer);
                              setSelectedCoreToReplace(Number(coreNum));
                            }}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold flex-1 w-full flex items-center justify-center gap-1.5"
                          >
                            <Wrench className="w-4 h-4" /> Core Replace
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Approval Footer inside Dashboard */}
        {isAllCompleted && !hasFailures && (
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

                    // 1. Update Failed Transformer record status to TREATED and move transformer to primary stage
                    await axios.put(
                      `/failed-transformers/${retestingTransformer._id}/status`,
                      {
                        status: "TREATED",
                        treatedBy: user.name || user.fullName || "Testing Engineer",
                        resolutionRemarks: "Retest completed successfully. Approved from Failed Section."
                      },
                      { withCredentials: true }
                    );

                    toast.success("Transformer Approved successfully! Moving to Primary Testing.");
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

        {isAllCompleted && hasFailures && (
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
                      else if (r.toLowerCase().match(/protection|prt/)) extractedTypes.add('PROTECTION');
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
  } else {

  mainContent = (
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
                              remark: item.remark || '',
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
                                  <XCircle className="w-3.5 h-3.5 mr-1" />
                                  Failed
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
                                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                                  Retesting
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
                          const hasFailures = transformerObj && orderObj ? checkHasFailures(transformerObj, orderObj, item.stage, item) : true;

                          return (
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                onClick={() => {
                                  if (!item.transformerId) {
                                    toast.error("Transformer detail not loaded. Cannot re-test.");
                                    return;
                                  }
                                  setRetestingTransformer(item);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3 flex items-center justify-center gap-1.5 rounded-md shadow-sm transition-all font-semibold"
                                size="sm"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Treat / Retest
                              </Button>

                              {isAllCompleted && !hasFailures && (
                                <Button
                                  onClick={() => handleApproveTransformerDirect(item)}
                                  className="bg-green-600 hover:bg-green-700 text-white text-xs h-8 px-3 flex items-center justify-center gap-1.5 rounded-md shadow-sm transition-all font-semibold"
                                  size="sm"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Approve
                                </Button>
                              )}

                              {isAllCompleted && hasFailures && (
                                <Button
                                  onClick={() => handleRequestStrictApprovalDirect(item)}
                                  className="bg-red-600 hover:bg-red-700 text-white text-xs h-8 px-3 flex items-center justify-center gap-1.5 rounded-md shadow-sm transition-all font-semibold"
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
    </div>
  );
}

  return (
    <>
      {mainContent}

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
            
            <div className="space-y-4 my-2 max-h-[60vh] overflow-y-auto">
              <div className="bg-red-50/50 border border-red-100 rounded-lg p-4">
                <h4 className="text-xs font-bold text-red-900 uppercase tracking-wider mb-2">Failure Reason</h4>
                {reasonModalData.reason ? (
                  <ul className="list-disc pl-5 space-y-1.5 text-sm text-red-800 font-medium">
                    {reasonModalData.reason.split(' | ').map((r: string, i: number) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">No reason provided.</p>
                )}
              </div>

              {reasonModalData.remark && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">Tester Remark</h4>
                  <p className="text-sm text-amber-900 font-medium whitespace-pre-wrap">{reasonModalData.remark}</p>
                </div>
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
    </>
  );
}

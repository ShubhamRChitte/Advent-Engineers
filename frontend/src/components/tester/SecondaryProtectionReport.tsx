import axios from '@/utils/axiosConfig';
import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { ArrowLeft, Save, Printer, AlertTriangle, ChevronLeft, ChevronRight, CheckCircle, RefreshCw, Loader2, Wrench, Search } from 'lucide-react';
import { Transformer } from './SecondaryTransformersList';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { handleTableGridKeyDown, handleInputFocus } from '@/utils/tableKeyNavigation';

import {
  ReportHeader,
  ReportSectionTitle,
  CoreInformationBar,
  ReportSignatures,
  formatReportDate,
  secondaryReportPrintStyles,
  ReportSpecBox,
} from './SecondaryReportPrintLayout';

const renderVal = (v: any) => (v === null || v === undefined || String(v).trim() === '') ? 'Not recorded' : String(v);


interface SecondaryProtectionReportProps {
  transformer: Transformer;
  coreNumber?: number;
  coreId: string;
  testerName: string;
  onBack: () => void;
  readOnly?: boolean;
  stage?: 'secondary' | 'primary' | 'final' | 'inspection';
  accuracyClass?: string | undefined; // Optinally passed from list
  primaryCurrent?: string;
  secondaryCurrent?: string;
  order?: any;
  onRefresh?: () => void;
  onFail?: () => void;
  onCompleteTimer?: () => Promise<void>;
  sourceStage?: 'secondary' | 'primary' | 'final';
  isFailedSection?: boolean;
  failedTransformerId?: string;
  failedStatus?: string;
  isFailedCore?: boolean;
  retestHistory?: any[];
  isUnified?: boolean;
  onNext?: (() => void) | undefined;
  onPrev?: (() => void) | undefined;
}

interface ProtectionTestRow {
  ratio: string;
  ratioError100: string; // Was burden100_1
  phaseError: string;    // Was burden100_2
  resistance: string;
  alf: string;
  secondaryLimitingVoltage: string;
  excitationCurrent: string;
  compositeError: string;
  isPass?: boolean | null;
  reason?: string | null;
  protectionClass?: string;
}

export function validateProtectionUI(accClass: string, r100Str: string, pStr: string, compStr: string, dynamicLimits: any[] = []) {
  // Check if at least one field has been entered before throwing a fail
  if ((!r100Str || String(r100Str).trim() === '') &&
    (!pStr || String(pStr).trim() === '') &&
    (!compStr || String(compStr).trim() === '')) {
    return { isPass: null, reason: null };
  }

  const normalizedClass = accClass ? accClass.toUpperCase() : "5P";

  // Find limit config from DB
  let limitConfig = null;
  if (dynamicLimits.length > 0) {
    // Exact match first
    limitConfig = dynamicLimits.find(l => l.protectionClass === normalizedClass);

    // Fallback search if combined string or slightly different format
    if (!limitConfig) {
      if (normalizedClass.includes("15P")) limitConfig = dynamicLimits.find(l => l.protectionClass === "15P");
      else if (normalizedClass.includes("10P")) limitConfig = dynamicLimits.find(l => l.protectionClass === "10P");
      else if (normalizedClass.includes("5P")) limitConfig = dynamicLimits.find(l => l.protectionClass === "5P");
    }
  }

  if (!limitConfig) return { isPass: true, reason: null }; // Default Pass if unknown class

  let isPass = true;
  let reasons: string[] = [];

  // Ratio (Current) Error Validation
  if (r100Str && String(r100Str).trim() !== '') {
    const cVal = parseFloat(String(r100Str));
    if (!isNaN(cVal) && Math.abs(cVal) >= limitConfig.maxCurrentError) {
      isPass = false;
      reasons.push(`Current Error(${cVal} %) exceeds ±${limitConfig.maxCurrentError}% `);
    }
  }

  // Phase Error Validation
  if (limitConfig.maxPhaseError !== null && pStr && String(pStr).trim() !== '') {
    const pVal = parseFloat(String(pStr));
    if (!isNaN(pVal) && Math.abs(pVal) >= limitConfig.maxPhaseError) {
      isPass = false;
      reasons.push(`Phase Error(${pVal}m) exceeds ±${limitConfig.maxPhaseError} m`);
    }
  }

  // Composite Error Validation
  if (compStr && String(compStr).trim() !== '') {
    // Strip trailing % if present to parse cleanly
    const compClean = String(compStr).replace('%', '');
    const compNum = parseFloat(compClean);
    if (!isNaN(compNum) && Math.abs(compNum) >= limitConfig.maxCompositeError) {
      isPass = false;
      reasons.push(`Composite Error (${compNum}%) exceeds ≤${limitConfig.maxCompositeError}%`);
    }
  }

  return { isPass, reason: reasons.length > 0 ? reasons.join('; ') : null };
}

export function SecondaryProtectionReport({
  transformer,
  coreNumber,
  coreId,
  testerName,
  onBack,
  readOnly = false,
  stage = 'secondary',
  accuracyClass: explicitClass,
  primaryCurrent: manualPrimary,
  secondaryCurrent: manualSecondary,
  order: propOrder,
  onRefresh,
  onFail,
  onCompleteTimer,
  sourceStage,
  isFailedSection = false,
  failedTransformerId,
  failedStatus,
  isFailedCore,
  retestHistory,
  isUnified = false,
  onNext,
  onPrev
}: SecondaryProtectionReportProps) {
  const coreIndex = (coreNumber && coreNumber > 0) ? (coreNumber - 1) :
    (!isNaN(parseInt(coreId.replace(/[^0-9]/g, ''))) ? parseInt(coreId.replace(/[^0-9]/g, '')) - 1 : 0);

  const hasBeenRetested = !!(retestHistory?.some((h: any) =>
    Array.isArray(h.newTreatmentReadings) && h.newTreatmentReadings.some((r: any) =>
      r.internalCoreNo === coreId || r.coreId === coreId
    )
  ));

  const printRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Advent_Engineers_Test_Report_${transformer.uniqueId}`,
  });


  // Use ratios from the transformer object, falling back to a default if empty
  // Use ratios from the transformer object, falling back to a default if empty
  const ratiosToUse = React.useMemo(() => {
    const order = propOrder || transformer.fullOrder || transformer.orderId;
    const orderCores = order?.coreDetails || [];
    const coreFromOrder = orderCores[coreIndex];

    // Priority: Manual Prop -> Core Specific -> Order Level -> Fallback
    const secCurr = manualSecondary || 
      coreFromOrder?.secondaryCurrent ||
      order?.ratedSecondaryCurrent ||
      '1';

    // Priority: Manual Prop -> Order PrimaryCurrents -> Order Ratio -> Fallback
    const rawPrimaryCurrs = manualPrimary ? [manualPrimary] :
      ((order?.primaryCurrents && order.primaryCurrents.length > 0) ? order.primaryCurrents :
      (Array.isArray(order?.ratio) ? order.ratio.map((r: string) => String(r).split('/')[0]) : ['200']));

    let primaryCurrs = rawPrimaryCurrs.flatMap((pc: string) =>
      String(pc).replace(/[\[\]"']/g, '').split(/[- ,]+/).filter(v => v.trim() !== '')
    );
    primaryCurrs = [...new Set(primaryCurrs)];

    return primaryCurrs.map((p: string) => `${p}/${secCurr}`);
  }, [transformer, coreIndex, manualPrimary, manualSecondary]);


  const [testResults, setTestResults] = useState<ProtectionTestRow[]>([]);
  const [protectionClass, setProtectionClass] = useState<string>(() => {
    if (explicitClass) return explicitClass;

    // Fallback: Use the granular accuracyClass from coreDetails
    const order = propOrder || transformer.fullOrder || transformer.orderId;
    const orderCores = order?.coreDetails || [];
    const coreFromOrder = orderCores[coreIndex];
    const accClass = coreFromOrder?.accuracyClass || '';

    if (accClass.toUpperCase().includes('15P')) return '15P';
    if (accClass.toUpperCase().includes('10P')) return '10P';
    if (accClass.toUpperCase().includes('5P')) return '5P';
    return accClass || '5P';
  });
  const [dbLimits, setDbLimits] = useState<any[]>([]);

  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const response = await axios.get(`/accuracy-limits/protection`, { withCredentials: true });
        setDbLimits(response.data);
      } catch (error) {
        console.error('Failed to fetch dynamic protection limits', error);
      }
    };
    fetchLimits();
  }, []);



  const [approvedCores, setApprovedCores] = useState<string[]>([]);
  const [secondaryTestedCores, setSecondaryTestedCores] = useState<string[]>([]);
  const [selectedCoreId, setSelectedCoreId] = useState<string>(coreId);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [selectSearch, setSelectSearch] = useState('');

  // Replace Core Modal State
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [availableReadyCores, setAvailableReadyCores] = useState<any[]>([]);
  const [loadingReadyCores, setLoadingReadyCores] = useState(false);
  const [selectedNewCoreId, setSelectedNewCoreId] = useState('');
  const [isReplacingCore, setIsReplacingCore] = useState(false);
  const [coreSearchTerm, setCoreSearchTerm] = useState('');

  const filteredReadyCores = React.useMemo(() => {
    if (!coreSearchTerm.trim()) return availableReadyCores;
    const term = coreSearchTerm.toLowerCase();
    return availableReadyCores.filter((c: any) => {
      const idStr = (c.coreId || c.id || '').toLowerCase();
      const turnsStr = (c.specifications?.turns || '').toString().toLowerCase();
      const typeStr = (c.coreType || '').toLowerCase();
      return idStr.includes(term) || turnsStr.includes(term) || typeStr.includes(term);
    });
  }, [availableReadyCores, coreSearchTerm]);

  const handleOpenReplaceModal = async () => {
    setIsReplaceModalOpen(true);
    setLoadingReadyCores(true);
    setCoreSearchTerm('');
    setSelectedNewCoreId('');
    try {
      const res = await axios.get('/ready-transformers/available?coreType=Protection', { withCredentials: true });
      setAvailableReadyCores(res.data || []);
    } catch (err) {
      toast.error("Failed to load available ready stock cores");
    } finally {
      setLoadingReadyCores(false);
    }
  };

  const handleConfirmReplaceCore = async () => {
    if (!selectedNewCoreId) {
      toast.error("Please select a replacement core from Ready Stock");
      return;
    }
    try {
      setIsReplacingCore(true);
      const orderObj = propOrder || (transformer as any).fullOrder || (transformer as any).orderId;
      const orderId = (transformer as any).orderId?._id || (transformer as any).orderId || orderObj?._id || orderObj?.id;

      const res = await axios.post('/secondary-core-tests/replace-failed-core', {
        orderId,
        transformerId: transformer.id || (transformer as any)._id,
        uniqueId: transformer.uniqueId,
        oldCoreId: selectedCoreId,
        newCoreId: selectedNewCoreId,
        coreType: 'Protection',
        failureReason: "Failed Secondary Protection Test"
      }, { withCredentials: true });

      if (res.data?.success) {
        const replacedCoreId = selectedNewCoreId;
        toast.success(`Core ${selectedCoreId} moved to Failed Cores. Replaced with ${replacedCoreId}!`);
        setIsReplaceModalOpen(false);
        setSelectedCoreId(replacedCoreId);
        setTestResults(prev => prev.map(r => ({
          ...r,
          ratioError100: '',
          phaseError: '',
          compositeError: '',
          resistance: '',
          alf: '',
          secondaryLimitingVoltage: '',
          excitationCurrent: '',
          isPass: null,
          reason: ''
        })));
        await fetchApprovedCores();
        if (onRefresh) onRefresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to replace core");
    } finally {
      setIsReplacingCore(false);
    }
  };

  const fetchApprovedCores = React.useCallback(async () => {
    const order = propOrder || transformer.fullOrder || transformer.orderId;
    const orderId = order?._id || order;
    if (!orderId || readOnly) return;
    try {
      const [appRes, secRes] = await Promise.all([
        axios.get(`/core-tests/approved-ids/${orderId}`, { withCredentials: true }),
        axios.get(`/secondary-core-tests/ready-stock/${orderId}`, { withCredentials: true })
      ]);
      if (appRes.data?.success) {
        const ids = appRes.data.protection || [];
        setApprovedCores(ids);
      }
      if (secRes.data?.success) {
        const testedIds = (secRes.data.protection || [])
          .filter((c: any) => c.status === 'Pass' || c.status === 'PASS' || c.status === 'Completed')
          .map((c: any) => c.coreId);
        setSecondaryTestedCores(testedIds);
      }
    } catch (err) {
      console.error("Failed to fetch approved core IDs", err);
    }
  }, [propOrder, transformer.fullOrder, transformer.orderId, readOnly]);

  useEffect(() => {
    fetchApprovedCores();
  }, [fetchApprovedCores]);

  useEffect(() => {
    if (coreId && coreId.trim() !== '') {
      setSelectedCoreId(coreId);
    }
  }, [coreId]);  // ✅ LOAD DATA EFFECT for Read Only viewing OR Consistency
  useEffect(() => {
    let isCancelled = false;

    const fetchLatestData = async () => {
      const targetCoreId = coreId || selectedCoreId;
      try {
        const initialBlank = ratiosToUse.map((ratio: string) => ({
          ratio,
          ratioError100: '',
          phaseError: '',
          resistance: '',
          alf: '',
          secondaryLimitingVoltage: '',
          excitationCurrent: '',
          compositeError: ''
        }));

        if (stage === 'inspection') {
          let currentInspectionData = (transformer as any).inspectionData || {};
          try {
            const checkRes = await axios.get(`/final/inspection/${encodeURIComponent(transformer.uniqueId)}`, { withCredentials: true });
            if (checkRes.data.success && checkRes.data.data) {
              currentInspectionData = checkRes.data.data;
            }
          } catch (e) {
            console.error("Failed to fetch latest inspection data in fetchLatestData (Protection)", e);
          }
          if (isCancelled) return;
          const savedResults = (currentInspectionData as any).coreTests?.[targetCoreId];
          if (savedResults && savedResults.protection_results) {
            setTestResults(() => initialBlank.map((row: ProtectionTestRow, index: number) => {
              let saved = savedResults.protection_results.find((r: any) => r.ratioValue === row.ratio || r.ratio === row.ratio);
              if (!saved && savedResults.protection_results[index]) {
                saved = savedResults.protection_results[index];
              }
              if (saved) {
                const safeStr = (val: any) => (val !== undefined && val !== null) ? String(val) : '';
                return {
                  ...row,
                  ratioError100: safeStr(saved.ratioError100 || saved.ratioError),
                  phaseError: safeStr(saved.phaseError),
                  resistance: safeStr(saved.resistance),
                  alf: safeStr(saved.alf),
                  secondaryLimitingVoltage: safeStr(saved.secondaryLimitingVoltage || saved.secondaryLimitingVtg),
                  excitationCurrent: safeStr(saved.excitationCurrent || saved.excitingCurrent),
                  compositeError: safeStr(saved.compositeError)
                };
              }
              return row;
            }));
          } else {
            setTestResults(initialBlank);
          }
          return;
        }

        const order = propOrder || transformer.fullOrder || transformer.orderId;
        const orderId = order?._id || order;

        if (targetCoreId && targetCoreId.trim() !== '') {
          try {
            const res = await axios.get(`/secondary-core-tests/protection/${targetCoreId}${orderId ? `?orderId=${orderId}` : ''}`, { withCredentials: true });
            if (isCancelled) return;
            if (res.data?.success && res.data.data) {
              const testDoc = res.data.data;
              if (testDoc.protection_results && testDoc.protection_results.length > 0) {
                setTestResults(() => initialBlank.map((row: ProtectionTestRow, index: number) => {
                  let saved = testDoc.protection_results.find((r: any) => r.ratioValue === row.ratio || r.ratio === row.ratio);
                  if (!saved && testDoc.protection_results[index]) {
                    saved = testDoc.protection_results[index];
                  }
                  if (saved) {
                    const safeStr = (val: any) => (val !== undefined && val !== null) ? String(val) : '';
                    if (saved.protectionClass && saved.protectionClass !== protectionClass) {
                      setProtectionClass(saved.protectionClass);
                    }
                    return {
                      ...row,
                      ratioError100: safeStr(saved.ratioError100 ?? saved.burden100_1),
                      phaseError: safeStr(saved.phaseError ?? saved.burden100_2),
                      resistance: safeStr(saved.resistance),
                      alf: safeStr(saved.alf),
                      secondaryLimitingVoltage: safeStr(saved.secondaryLimitingVoltage ?? saved.secondaryLimitingVtg),
                      excitationCurrent: safeStr(saved.excitationCurrent ?? saved.excitationCurr),
                      compositeError: safeStr(saved.compositeError),
                      isPass: saved.isPass,
                      reason: saved.reason,
                      protectionClass: saved.protectionClass
                    };
                  }
                  return row;
                }));
                return;
              }
            }
          } catch (err) {
            console.warn("Could not fetch secondary protection test by coreId, falling back", err);
          }
          if (transformer.isDummy) {
            if (!isCancelled) setTestResults(initialBlank);
            return;
          }
        }

        const res = await axios.get(`/transformers/${transformer.uniqueId}`, { withCredentials: true });
        if (isCancelled) return;
        const freshTransformer = res.data.data || res.data;

        let myResults = [];
        let currentFailedStatus = failedStatus;
        let currentRetestHistory = retestHistory;

        if (isFailedSection && failedTransformerId) {
          try {
            const failRes = await axios.get(`/failed-transformers/${failedTransformerId}`, { withCredentials: true });
            if (failRes.data?.success && failRes.data?.data) {
              currentFailedStatus = failRes.data.data.status;
              currentRetestHistory = failRes.data.data.retestHistory;
            }
          } catch (e) {
            console.error("Failed to fetch latest failed record", e);
          }
          if (isCancelled) return;
        }

        const isMatch = (res: any, targetId: string) => {
          if (!res) return false;
          const id = String(res.internalCoreNo || res.coreId || '').trim();
          const target = String(targetId || '').trim();
          if (!id || !target) return false;
          if (id === target || id.endsWith(target) || target.endsWith(id)) return true;
          if (coreNumber) {
            const suffix = `-${String(coreNumber).padStart(3, '0')}`;
            if (id.endsWith(suffix) || target.endsWith(suffix) || id === String(coreNumber)) return true;
          }
          return false;
        };

        // Priority 1: Check if core was retested / updated in Failed Transformers section (retestHistory)
        if (isFailedSection && currentRetestHistory && Array.isArray(currentRetestHistory)) {
          const latestRetest = currentRetestHistory.slice().reverse().find((h: any) =>
            h.newTreatmentReadings && Array.isArray(h.newTreatmentReadings) &&
            h.newTreatmentReadings.some((r: any) => isMatch(r, targetCoreId))
          );
          if (latestRetest) {
            myResults = latestRetest.newTreatmentReadings.filter((res: any) => isMatch(res, targetCoreId));
          }
        }

        // Priority 2: If no retested readings saved yet, fetch strictly from stage history where it failed
        if (myResults.length === 0) {
          const stageKey = `${stage}_test` as keyof typeof freshTransformer.testHistory;
          const stageHistory = freshTransformer?.testHistory?.[stageKey] as any;
          if (stageHistory?.protection_results?.length > 0) {
            myResults = stageHistory.protection_results.filter((res: any) => isMatch(res, targetCoreId));
          }
        }

        if (myResults.length > 0) {
          setTestResults(() => initialBlank.map((row: ProtectionTestRow, index: number) => {
            let saved = myResults.find((r: any) => r.ratioValue === row.ratio || r.ratio === row.ratio);
            if (!saved && myResults[index]) {
              saved = myResults[index];
            }
            if (!saved && ratiosToUse.length === 1) {
              saved = myResults.find((r: any) => !r.ratioValue || r.ratioValue === 'N/A');
            }
            if (saved) {
              const safeStr = (val: any) => (val !== undefined && val !== null) ? String(val) : '';
              if (saved.protectionClass && saved.protectionClass !== protectionClass) {
                setProtectionClass(saved.protectionClass);
              }
              return {
                ...row,
                ratioError100: safeStr(saved.ratioError100 ?? saved.burden100_1),
                phaseError: safeStr(saved.phaseError ?? saved.burden100_2),
                resistance: safeStr(saved.resistance),
                alf: safeStr(saved.alf),
                secondaryLimitingVoltage: safeStr(saved.secondaryLimitingVoltage ?? saved.secondaryLimitingVtg),
                excitationCurrent: safeStr(saved.excitationCurrent ?? saved.excitationCurr),
                compositeError: safeStr(saved.compositeError),
                isPass: saved.isPass,
                reason: saved.reason,
                protectionClass: saved.protectionClass
              };
            }
            return row;
          }));
        } else {
          if (!isCancelled) setTestResults(initialBlank);
        }
      } catch (err) {
        if (!isCancelled) console.error("Failed to load existing protection data", err);
      }
    };

    fetchLatestData();

    return () => {
      isCancelled = true;
    };
  }, [transformer.uniqueId, selectedCoreId, coreId, stage, failedStatus, isFailedCore, retestHistory]);

  // Robust Parsing Helpers
  const parseRatedCurrent = (ratio: any): number => {
    if (!ratio) return 1;
    const str = String(ratio);
    // Extract number after the first forward slash. Handle formats like "200/1-1A" -> "1-1A" -> "1"
    const parts = str.split('/');
    if (parts.length >= 2 && parts[1]) {
      // split by "-" to get the first digit if multiple secondary cores exist
      const subParts = parts[1].split('-');
      const val = parseFloat(subParts[0] || '0');
      return (isNaN(val) || val === 0) ? 1 : val;
    }
    return 1;
  };

  const parseBurden = (burden: any): number => {
    if (burden === undefined || burden === null) return 0;

    // If it's an array of burdens (e.g. ['30VA', '30VA']), pick the first one
    const str = Array.isArray(burden) ? String(burden[0]) : String(burden);

    // Extract digits and dots. E.g., "30 VA" -> 30
    const match = str.match(/[\d.]+/);
    const val = match ? parseFloat(match[0]) : 0;
    return isNaN(val) ? 0 : val;
  };

  const getBurdenValue = () => {
    const order = propOrder || (transformer as any).fullOrder || transformer.orderId;
    let rawBurden = order?.burden;
    if (Array.isArray(rawBurden)) {
      // Use coreIndex if possible, else coreId suffix
      const coreIdx = (coreNumber && coreNumber > 0) ? (coreNumber - 1) : (parseInt(coreId.split('-').pop() || '1') - 1);
      rawBurden = rawBurden[Math.min(coreIdx, rawBurden.length - 1)];
    }
    const finalBurden = rawBurden || transformer.burden || '0';
    return parseBurden(finalBurden); 
  };

  const displayBurden = (() => {
    const order = propOrder || (transformer as any).fullOrder || transformer.orderId;
    let rawBurden = order?.burden;
    if (Array.isArray(rawBurden)) {
      const coreIdx = (coreNumber && coreNumber > 0) ? (coreNumber - 1) : (parseInt(coreId.split('-').pop() || '1') - 1);
      rawBurden = rawBurden[Math.min(coreIdx, rawBurden.length - 1)];
    }
    const val = rawBurden || transformer.burden;
    if (!val) return 'N/A';
    return String(val).replace(/VA/i, '').trim();
  })();

  const displaySTC = (() => {
    const order = propOrder || (transformer as any).fullOrder || transformer.orderId;
    return order?.stc || order?.STC || transformer.stc || 'N/A';
  })();
  const handleInputChange = (index: number, field: keyof ProtectionTestRow, value: string) => {
    if (readOnly) return;

    // Immutable State Update
    setTestResults(prev => prev.map((row, i) => {
      // 1. Return unchanged rows
      if (i !== index) return row;

      // 2. Create updated row copy
      const updatedRow = { ...row, [field]: value };

      // 3. Auto-Calculate Logic
      // Only recalculate if relevant fields change
      if (['resistance', 'alf', 'excitationCurrent'].includes(field as string)) {

        const iRated = parseRatedCurrent(updatedRow.ratio);
        // Ensure accurate parsing of Burden from Order ID (e.g. "30VA" -> 30)
        const burdenVal = getBurdenValue();

        // If any of the dependent inputs are completely empty, clear the calculated fields
        if (updatedRow.resistance === '' || updatedRow.alf === '' || updatedRow.excitationCurrent === '') {
          return {
            ...updatedRow,
            secondaryLimitingVoltage: '',
            compositeError: ''
          };
        }

        // Force Parsing: Wrap all table inputs in parseFloat()
        const r = parseFloat(updatedRow.resistance) || 0;
        const alf = parseFloat(updatedRow.alf) || 0;
        const ex = parseFloat(updatedRow.excitationCurrent) || 0;

        // Debug inputs for calculation verification
        console.log("Values used:", { burdenVal, iRated, resistance: r, alf });

        // Safety Constraint: If ALF or I_Rated is 0, results default to empty to avoid Infinity/NaN
        if (alf === 0 || iRated === 0) {
          return {
            ...updatedRow,
            secondaryLimitingVoltage: '',
            compositeError: ''
          };
        }

        // Formula: SLV = ((Burden / (I_Rated * I_Rated)) + (1.2 * Resistance)) * I_Rated * ALF
        // Strict order of operations: Burden divided by I_Rated squared, add 1.2 * Resistance, then multiply by I_Rated and ALF
        const calculatedSLV = ((burdenVal / (iRated * iRated)) + (1.2 * r)) * iRated * alf;

        // Formula: Composite Error = (ExcitationCurrent / (I_Rated * ALF)) * 100
        const compErr = (ex / (iRated * alf)) * 100;

        // Calculate auto validation bounds based on new values
        const validation = validateProtectionUI(protectionClass, updatedRow.ratioError100, updatedRow.phaseError, compErr.toFixed(3), dbLimits);

        // Update derived fields with precision
        return {
          ...updatedRow,
          secondaryLimitingVoltage: calculatedSLV.toFixed(2),
          compositeError: compErr.toFixed(3) + '%',
          isPass: validation.isPass,
          reason: validation.reason
        };
      } else if (['ratioError100', 'phaseError'].includes(field as string)) {
        // Direct validation trigger if entering manual error blocks
        const validation = validateProtectionUI(protectionClass, updatedRow.ratioError100, updatedRow.phaseError, updatedRow.compositeError, dbLimits);
        return {
          ...updatedRow,
          isPass: validation.isPass,
          reason: validation.reason
        };
      }

      return updatedRow;
    }));
  };



  const areAllReadingsFilled = () => {
    return testResults.every(row => 
      row.ratioError100 !== null && row.ratioError100 !== undefined && String(row.ratioError100).trim() !== '' &&
      row.phaseError !== null && row.phaseError !== undefined && String(row.phaseError).trim() !== '' &&
      row.resistance !== null && row.resistance !== undefined && String(row.resistance).trim() !== '' &&
      row.alf !== null && row.alf !== undefined && String(row.alf).trim() !== '' &&
      row.excitationCurrent !== null && row.excitationCurrent !== undefined && String(row.excitationCurrent).trim() !== ''
    );
  };

  const handleDatabaseSave = async (isApprove: boolean = false) => {
    if (readOnly) return;
    setSaving(true);
    console.log("handleDatabaseSave: STARTED (Protection)");
    try {
      // 1. Build the array based on your ProtectionBlockSchema
      const parseOrNull = (val: any) => (val === '' || val === null || val === undefined) ? null : parseFloat(val);

      const protectionResults = testResults.map(row => ({
        internalCoreNo: selectedCoreId, // Inject Core ID for persistence
        coreId: selectedCoreId,         // Inject Core ID for persistence
        ratioValue: row.ratio,
        protectionClass: protectionClass || '5P',

        // New Schema Mapping - Ensure Numeric Integrity
        ratioError100: parseOrNull(row.ratioError100),
        phaseError: parseOrNull(row.phaseError),

        resistance: parseOrNull(row.resistance),
        alf: parseOrNull(row.alf),
        excitationCurrent: parseOrNull(row.excitationCurrent),

        // Calculated fields (stored as strings in state, convert back to number)
        secondaryLimitingVoltage: parseOrNull(row.secondaryLimitingVoltage),
        compositeError: parseOrNull(row.compositeError),

        // Pass/Fail status for strict approval tracking
        isPass: row.isPass,
        reason: row.reason,

        // Legacy Field Mapping
        secondaryLimitingVtg: parseOrNull(row.secondaryLimitingVoltage)
      }));

      console.log("handleDatabaseSave: protectionResults built", protectionResults);

      const payload = {
        uniqueId: transformer.uniqueId,
        orderId: typeof transformer.orderId === 'object' && transformer.orderId ? (transformer.orderId as any)._id : transformer.orderId,
        loginType: `${stage}_login`, // Consistent with your schema path
        tester: testerName,
        coreId: selectedCoreId,
        status: isApprove ? "Pass" : "In-Progress",
        protection_results: protectionResults
      };

      console.log("handleDatabaseSave: Payload ready", payload);

      
      let response;
      if (stage === 'inspection') {
        let currentInspectionData = {};
        try {
          const checkRes = await axios.get(`/final/inspection/${encodeURIComponent(transformer.uniqueId)}`, { withCredentials: true });
          if (checkRes.data.success && checkRes.data.data) {
            currentInspectionData = checkRes.data.data;
          }
        } catch (e) {
          console.error("Failed to load existing inspection data for merge, using prop defaults", e);
          currentInspectionData = (transformer as any).inspectionData || {};
        }

        const updatedCoreTests = {
            ...((currentInspectionData as any).coreTests || {}),
            [selectedCoreId]: payload
        };
        const updatedInspectionData = {
            ...currentInspectionData,
            coreTests: updatedCoreTests
        };
        response = await axios.post(`/final/inspection/${encodeURIComponent(transformer.uniqueId)}`, updatedInspectionData, { withCredentials: true });
      } else if (isFailedSection && failedTransformerId) {
        // Save to retest-save endpoint
        response = await axios.put(`/failed-transformers/${failedTransformerId}/retest-save`, {
            treatedReadings: payload.protection_results,
            treatedBy: testerName,
            remarks: "Treated After Primary Failure via Protection Report",
            coreType: 'protection'
        }, { withCredentials: true });
      } else {
        const endpoint = `/transformer-${stage}-protection-tests`;
        console.log(`handleDatabaseSave: Sending Request to ${endpoint}...`);


        response = await axios.post(
          endpoint,
          payload,
          { withCredentials: true }
        );
      }
      if (onCompleteTimer) await onCompleteTimer();

      console.log("handleDatabaseSave: Response received", response);
      if (onRefresh) onRefresh();

      if (isApprove) {
        setSecondaryTestedCores(prev => [...new Set([...prev, selectedCoreId])]);
        toast.success("Protection Core Approved successfully!");
        if (onNext) onNext(); else onBack();
      } else {
        toast.success("Protection data saved to database successfully!");
      }

    } catch (error) {
      console.error("handleDatabaseSave: ERROR CAUGHT", error);
      toast.error("Failed to save protection data.");
    } finally {
      setSaving(false);
    }
  };



  // Failed Core Logic Match
  const hasFailures = React.useMemo(() => {
    const isOldCoreFailed = (selectedCoreId === coreId) && (isFailedCore || failedStatus === 'FAILED');
    if (isOldCoreFailed) return true;
    return testResults.some(row => {
      if (row.isPass === false) return true;
      const limitConfig = dbLimits.find(l => l.protectionClass === (protectionClass || '5P').toUpperCase()) ||
                          (protectionClass?.toUpperCase().includes("15P") && dbLimits.find(l => l.protectionClass === "15P")) ||
                          (protectionClass?.toUpperCase().includes("10P") && dbLimits.find(l => l.protectionClass === "10P")) ||
                          (protectionClass?.toUpperCase().includes("5P") && dbLimits.find(l => l.protectionClass === "5P"));
      if (row.ratioError100 && String(row.ratioError100).trim() !== '' && limitConfig) {
        const val = parseFloat(row.ratioError100);
        if (!isNaN(val) && Math.abs(val) > (limitConfig.ratioLimit ?? 1)) return true;
      }
      if (row.phaseError && String(row.phaseError).trim() !== '' && limitConfig) {
        const val = parseFloat(row.phaseError);
        if (!isNaN(val) && Math.abs(val) > (limitConfig.phaseLimit ?? 60)) return true;
      }
      return false;
    });
  }, [testResults, dbLimits, protectionClass, isFailedCore, failedStatus, selectedCoreId, coreId]);

  const [isFailModalOpen, setIsFailModalOpen] = useState(false);
  const [failRemark, setFailRemark] = useState('');

  const handleMarkAsFailed = () => {
    if (readOnly) return;
    setIsFailModalOpen(true);
  };

  const handleConfirmMarkAsFailed = async () => {
    try {
      // Gather all reasons across all failed rows
      const allReasons = testResults
        .filter(r => r.isPass === false && r.reason)
        .map(r => `Core ${transformer.orderId?.type || 'Protection'} (${r.ratio}): ${r.reason}`)
        .join(" | ");

      // Persist the entered test values to the transformer's history first
      await handleDatabaseSave();

      const orderObj = propOrder || transformer.fullOrder || transformer.orderId;

      const payload = {
        transformerId: transformer.id || transformer._id,
        transformerUniqueId: transformer.uniqueId,
        orderId: transformer.orderId?._id || transformer.orderId || orderObj?._id || orderObj?.id,
        jobNumber: transformer.jobId || orderObj?.jobId || '',
        clientName: transformer.clientName || orderObj?.clientName || '',
        coreType: "Protection",
        testType: stage === 'primary' ? "After Primary Protection" : stage === 'final' ? "Final Protection" : "Secondary Protection",
        failureParameters: { failureStage: `${stage}_protection_test`, dynamicValues: testResults, coreId: selectedCoreId },
        failureReason: allReasons || "Limits Exceeded",
        remark: failRemark.trim() || undefined,
        reportedBy: testerName,
        stage: stage === 'primary' ? "PRIMARY_TESTING" : stage === 'final' ? "FINAL_TESTING" : "SECONDARY_TESTING",
        status: "FAILED"
      };

      const response = await axios.post(`/failed-transformers`, payload, { withCredentials: true });
      setIsFailModalOpen(false);
      if (response.data.success) {
        toast.success(response.data.message || "Transformer marked as failed successfully.");
        if (onRefresh) onRefresh();
        if (onFail) onFail(); else onBack();
      } else {
        toast.error("Failed to add to failed transformers.");
      }
    } catch (err: any) {
      console.error("Mark as failed error:", err);
      toast.error(err.response?.data?.message || "Could not add to failed transformers");
    }
  };

  const failModalJSX = isFailModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
      <Card className="w-full max-w-md p-6 bg-white shadow-2xl rounded-xl border border-gray-100 flex flex-col gap-4 animate-in fade-in duration-200">
        <div>
          <h3 className="text-lg font-bold text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Add Transformer to Failed List
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Transformer: <span className="font-mono font-bold text-gray-800">{transformer.uniqueId}</span>
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-700">Optional Tester Remark / Note:</label>
          <textarea
            value={failRemark}
            onChange={(e) => setFailRemark(e.target.value)}
            placeholder="Enter optional remark or failure notes..."
            rows={3}
            className="w-full p-2.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={() => setIsFailModalOpen(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white font-bold"
            onClick={handleConfirmMarkAsFailed}
          >
            Confirm & Add to Failed
          </Button>
        </div>
      </Card>
    </div>
  );

  if (isUnified) {
    return (
      <div className="ae-section-container print:break-inside-avoid print:mt-6" style={{ pageBreakInside: 'avoid', marginTop: 24 }}>
        <ReportSectionTitle title={`${transformer.voltageRating || '33'} KV, CT, ${ratiosToUse.join('-')}A, ${displayBurden}VA, PROTECTION`} />
        <div className="mt-2 mb-2">
          <ReportSpecBox
            items={[
              { label: 'Core Number', value: `Core ${coreNumber || 1}` },
              { label: 'Core ID', value: coreId },
              { label: 'Core Type', value: 'Protection' },
              { label: 'CT Ratio', value: `${ratiosToUse.join('-')} A` },
              { label: 'Burden', value: `${displayBurden} VA` },
              { label: 'Class', value: protectionClass || '5P' },
              { label: 'STC', value: displaySTC }
            ]}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="ae-report-table secondary-report-table">
            <thead>
              <tr>
                <th colSpan={2}></th>
                <th className="text-center font-bold text-sm" colSpan={4}>
                  100 % Burden
                </th>
              </tr>
            </thead>
            <tbody>
              {testResults.map((row, index) => {
                const limitConfig = dbLimits.find(l => l.protectionClass === (protectionClass || '5P').toUpperCase()) ||
                                    (protectionClass?.toUpperCase().includes("15P") && dbLimits.find(l => l.protectionClass === "15P")) ||
                                    (protectionClass?.toUpperCase().includes("10P") && dbLimits.find(l => l.protectionClass === "10P")) ||
                                    (protectionClass?.toUpperCase().includes("5P") && dbLimits.find(l => l.protectionClass === "5P"));

                const isRatioErrorInvalid = (() => {
                  if (!row.ratioError100 || String(row.ratioError100).trim() === '') return false;
                  if (!limitConfig) return false;
                  const cVal = parseFloat(String(row.ratioError100));
                  return !isNaN(cVal) && Math.abs(cVal) >= limitConfig.maxCurrentError;
                })();

                const isPhaseErrorInvalid = (() => {
                  if (!row.phaseError || String(row.phaseError).trim() === '') return false;
                  if (!limitConfig || limitConfig.maxPhaseError === null) return false;
                  const pVal = parseFloat(String(row.phaseError));
                  return !isNaN(pVal) && Math.abs(pVal) >= limitConfig.maxPhaseError;
                })();

                const isCompositeErrorInvalid = (() => {
                  if (!row.compositeError || String(row.compositeError).trim() === '') return false;
                  if (!limitConfig) return false;
                  const compClean = String(row.compositeError).replace('%', '');
                  const compNum = parseFloat(compClean);
                  return !isNaN(compNum) && Math.abs(compNum) >= limitConfig.maxCompositeError;
                })();

                return (
                  <React.Fragment key={index}>
                    <tr>
                      <td rowSpan={3} className="bg-slate-50 font-bold text-center align-middle w-[150px]">
                        Protection Core<br />Ratio - {row.ratio}
                        {row.isPass !== undefined && row.isPass !== null && (
                          <div className={`mt-2 text-[10px] font-bold px-2 py-1 rounded ${row.isPass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {row.isPass ? 'PASS' : 'FAIL'}
                          </div>
                        )}
                        {row.isPass === false && row.reason && (
                          <div className="text-[9px] text-red-600 mt-1 leading-tight font-normal text-left break-words">
                            {row.reason}
                          </div>
                        )}
                      </td>

                      <td className="p-2 text-center bg-white font-bold text-xs w-[120px]">
                        100%
                      </td>

                      <td className="input-cell w-[120px]">
                        <div className={`p-2 text-center font-bold text-xs h-8 flex items-center justify-center ${isRatioErrorInvalid ? 'invalid-reading' : 'text-blue-800'}`}>
                          {renderVal(row.ratioError100)}
                        </div>
                      </td>

                      <td className="input-cell w-[120px]">
                        <div className={`p-2 text-center font-bold text-xs h-8 flex items-center justify-center ${isPhaseErrorInvalid ? 'invalid-reading' : 'text-blue-800'}`}>
                          {renderVal(row.phaseError)}
                        </div>
                      </td>

                      <td className="bg-white"></td>
                      <td className="bg-white"></td>
                    </tr>

                    <tr>
                      <td className="bg-slate-50 font-bold text-[10px]">
                        Resistance
                      </td>
                      <td className="bg-slate-50 font-bold text-[10px]">
                        ALF
                      </td>
                      <td className="bg-slate-50 font-bold text-[10px]">
                        Excitation Current
                      </td>
                      <td className="bg-slate-50 font-bold text-[10px]">
                        Secondary<br />Limiting Voltage
                      </td>
                      <td className="bg-slate-50 font-bold text-[10px]">
                        Composite Error
                      </td>
                    </tr>

                    <tr>
                      <td className="input-cell">
                        <div className="p-2 text-center text-blue-800 font-bold text-xs h-8 flex items-center justify-center">
                          {renderVal(row.resistance)}
                        </div>
                      </td>
                      <td className="input-cell">
                        <div className="p-2 text-center text-blue-800 font-bold text-xs h-8 flex items-center justify-center">
                          {renderVal(row.alf)}
                        </div>
                      </td>
                      <td className="input-cell">
                        <div className="p-2 text-center text-blue-800 font-bold text-xs h-8 flex items-center justify-center">
                          {renderVal(row.excitationCurrent)}
                        </div>
                      </td>
                      <td className="input-cell">
                        <div className="p-2 text-center text-blue-800 font-bold text-xs h-8 flex items-center justify-center bg-slate-50">
                          {renderVal(row.secondaryLimitingVoltage)}
                        </div>
                      </td>
                      <td className="input-cell">
                        <div className={`p-2 text-center font-bold text-xs h-8 flex items-center justify-center bg-slate-50 ${isCompositeErrorInvalid ? 'invalid-reading' : 'text-blue-800'}`}>
                          {renderVal(row.compositeError)}
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
    <div className="w-full overflow-x-auto bg-gray-50 py-4 flex justify-start md:justify-center no-print-scroll">
      <style>{secondaryReportPrintStyles}</style>

      <div className="print-container w-[210mm] min-w-[210mm] print:w-full print:min-w-0 print:max-w-full secondary-print-page">
        {!readOnly && (
          <div className="flex items-center justify-between no-print mb-4 w-full">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  if (!readOnly) await handleDatabaseSave(false);
                  onBack();
                }}
                disabled={saving}
                className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Testing
              </Button>
              {onPrev && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={async () => {
                    if (!readOnly) await handleDatabaseSave(false);
                    onPrev();
                  }}
                  disabled={saving || !onPrev}
                  className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous Core
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {!readOnly && (
                <>
                  <Button
                    onClick={() => handleDatabaseSave(false)}
                    disabled={saving}
                    variant="outline"
                    className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Draft'}
                  </Button>
                  {stage === 'secondary' && areAllReadingsFilled() && (
                    <Button
                      onClick={() => handleDatabaseSave(true)}
                      disabled={saving}
                      className="gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {saving ? 'Approving...' : 'Approve Core'}
                    </Button>
                  )}
                </>
              )}
              {onNext && (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={async () => {
                    if (!readOnly) await handleDatabaseSave(false);
                    onNext();
                  }} 
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all duration-200 hover:scale-105"
                >
                  {(stage === 'primary' || stage === 'final') ? 'Next' : 'Next Core'} <ChevronRight className="w-4 h-4" />
                </Button>
              )}
              {stage === 'secondary' && !readOnly && hasFailures && (
                <Button
                  onClick={handleOpenReplaceModal}
                  variant="outline"
                  size="sm"
                  className="gap-2 border-orange-500 text-orange-700 bg-orange-50 hover:bg-orange-100 font-bold shadow-sm"
                  title="Replace failed core with a new core from Ready Stock"
                >
                  <RefreshCw className="w-4 h-4 text-orange-600" />
                  Replace Core (Ready Stock)
                </Button>
              )}
              {stage !== 'secondary' && !readOnly && !transformer.isDummy && hasFailures && !isFailedSection && (
                <Button variant="destructive" size="sm" onClick={handleMarkAsFailed} className="gap-2">
                  <AlertTriangle className="w-4 h-4" /> Add to Failed Transformer
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                <Printer className="w-4 h-4" /> Print
              </Button>
            </div>
          </div>
        )}

        <div ref={printRef} id="secondary-printable-report" className="report-wrapper secondary-report-wrapper">
          <ReportHeader
            stage={stage}
            date={formatReportDate(transformer.testHistory?.[`${stage}_test` as keyof typeof transformer.testHistory]?.reportDate)}
            orderNo={transformer.jobId || transformer.uniqueId}
            client={transformer.clientName || 'N/A'}
            unitNo={transformer.uniqueId}
            accuracyClass={protectionClass || '5P'}
          />

          <div className="ae-section-container">
            <ReportSectionTitle index={1} title={`Secondary Winding Verification - ${selectedCoreId}`} />
            <ReportSpecBox
              items={[
                { label: 'Specification', value: `${transformer.voltageRating || '33'} KV ${transformer.clientName || 'N/A'}` },
                { label: 'CT Ratio', value: `${ratiosToUse.join('-')} A` },
                { label: 'Burden', value: `${displayBurden} VA` },
                { label: 'Class', value: protectionClass || '5P' },
                { label: 'STC', value: displaySTC }
              ]}
            />
          </div>

          <div className="ae-section-container">
            <ReportSectionTitle index={2} title="Protection Core Test" />
            {!readOnly && !isFailedSection && stage !== 'final' ? (
              <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-[#103b63]/20 shadow-sm max-w-md my-3 no-print relative">
                <span className="text-xs font-bold text-[#103b63] uppercase tracking-wide shrink-0">Select Core ID (from Core Testing):</span>
                <div className="relative flex-1">
                  <button
                    type="button"
                    onClick={() => setIsSelectOpen(!isSelectOpen)}
                    className="w-full p-2 text-xs font-bold rounded border border-gray-300 bg-white text-blue-800 text-left flex justify-between items-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <span>{selectedCoreId} {selectedCoreId === coreId ? '(Default)' : ''}</span>
                    <span className="text-gray-400">▼</span>
                  </button>

                  {isSelectOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsSelectOpen(false)} />
                      <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
                        <div className="p-2 border-b border-gray-200 bg-gray-50 shrink-0">
                          <input
                            type="text"
                            placeholder="Search Core ID..."
                            value={selectSearch}
                            onChange={(e) => setSelectSearch(e.target.value)}
                            className="w-full p-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        </div>
                        <div className="overflow-y-auto flex-1 max-h-40">
                          {(() => {
                            const isPrimaryOrFinal = stage === 'primary';
                            let availableList: string[] = [];
                            if (isPrimaryOrFinal) {
                              availableList.push(...secondaryTestedCores);
                              const secResults = (transformer.testHistory?.secondary_test as any)?.protection_results || [];
                              secResults.forEach((r: any) => { if (r.internalCoreNo) availableList.push(r.internalCoreNo); if (r.coreId) availableList.push(r.coreId); });
                              const secMetaId = (transformer.testHistory?.secondary_test as any)?.protectionCoreId;
                              if (secMetaId) availableList.push(secMetaId);
                              
                              const primResults = (transformer.testHistory?.primary_test as any)?.protection_results || [];
                              primResults.forEach((r: any) => { if (r.internalCoreNo) availableList.push(r.internalCoreNo); if (r.coreId) availableList.push(r.coreId); });
                              
                              if (selectedCoreId) availableList.push(selectedCoreId);
                            } else {
                              if (selectedCoreId && !secondaryTestedCores.includes(selectedCoreId)) {
                                availableList.push(selectedCoreId);
                              }
                              const untested = approvedCores.filter(id => !secondaryTestedCores.includes(id));
                              availableList.push(...untested);
                            }
                            return Array.from(new Set(availableList.filter(Boolean)));
                          })()
                            .filter(id => id.toLowerCase().includes(selectSearch.toLowerCase()))
                            .map(id => (
                              <button
                                key={id}
                                type="button"
                                onClick={() => {
                                  setSelectedCoreId(id);
                                  setIsSelectOpen(false);
                                  setSelectSearch('');
                                }}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-blue-50 hover:text-blue-800 transition-colors flex justify-between items-center ${
                                  id === selectedCoreId ? 'bg-blue-50 text-blue-800 font-bold' : 'text-gray-700'
                                }`}
                              >
                                <span>{id} {id === coreId ? '(Default)' : ''}</span>
                                {secondaryTestedCores.includes(id) && (
                                  <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Tested</span>
                                )}
                              </button>
                            ))
                          }
                          {approvedCores.length === 0 && secondaryTestedCores.length === 0 && !coreId && (
                            <div className="px-3 py-2 text-xs text-gray-500 italic text-center">
                              No matching cores
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <CoreInformationBar label="Protection Core No" value={selectedCoreId} />
            )}
            <div className="overflow-x-auto">
              <table className="ae-report-table secondary-report-table">
                <thead>
                  <tr>
                    <th colSpan={2}></th>
                    <th className="text-center font-bold text-sm" colSpan={4}>
                      100 % Burden
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {testResults.map((row, index) => {
                    const limitConfig = dbLimits.find(l => l.protectionClass === (protectionClass || '5P').toUpperCase()) ||
                                        (protectionClass?.toUpperCase().includes("15P") && dbLimits.find(l => l.protectionClass === "15P")) ||
                                        (protectionClass?.toUpperCase().includes("10P") && dbLimits.find(l => l.protectionClass === "10P")) ||
                                        (protectionClass?.toUpperCase().includes("5P") && dbLimits.find(l => l.protectionClass === "5P"));

                    const isRatioErrorInvalid = (() => {
                      if (!row.ratioError100 || String(row.ratioError100).trim() === '') return false;
                      if (!limitConfig) return false;
                      const cVal = parseFloat(String(row.ratioError100));
                      return !isNaN(cVal) && Math.abs(cVal) >= limitConfig.maxCurrentError;
                    })();

                    const isPhaseErrorInvalid = (() => {
                      if (!row.phaseError || String(row.phaseError).trim() === '') return false;
                      if (!limitConfig || limitConfig.maxPhaseError === null) return false;
                      const pVal = parseFloat(String(row.phaseError));
                      return !isNaN(pVal) && Math.abs(pVal) >= limitConfig.maxPhaseError;
                    })();

                    const isCompositeErrorInvalid = (() => {
                      if (!row.compositeError || String(row.compositeError).trim() === '') return false;
                      if (!limitConfig) return false;
                      const compClean = String(row.compositeError).replace('%', '');
                      const compNum = parseFloat(compClean);
                      return !isNaN(compNum) && Math.abs(compNum) >= limitConfig.maxCompositeError;
                    })();

                    return (
                      <React.Fragment key={index}>
                        <tr>
                          <td rowSpan={3} className="bg-slate-50 font-bold text-center align-middle w-[150px]">
                            Protection Core<br />Ratio - {row.ratio}
                            {row.isPass !== undefined && row.isPass !== null && (
                              <div className={`mt-2 text-[10px] font-bold px-2 py-1 rounded ${row.isPass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {row.isPass ? 'PASS' : 'FAIL'}
                              </div>
                            )}
                            {row.isPass === false && row.reason && (
                              <div className="text-[9px] text-red-600 mt-1 leading-tight font-normal text-left break-words">
                                {row.reason}
                              </div>
                            )}
                          </td>

                          <td className="p-2 text-center bg-white font-bold text-xs w-[120px]">
                            100%
                          </td>

                          <td className="input-cell w-[120px]">
                            {readOnly ? (
                              <div className={`p-2 text-center font-bold text-xs h-8 flex items-center justify-center ${isRatioErrorInvalid ? 'invalid-reading' : 'text-blue-800'}`}>
                                {renderVal(row.ratioError100)}
                              </div>
                            ) : (
                              <Input
                                className={`input-field text-blue-800 font-medium ${isRatioErrorInvalid ? 'invalid-reading' : ''}`}
                                value={row.ratioError100}
                                onKeyDown={handleTableGridKeyDown}
                                onFocus={handleInputFocus}
                                onChange={(e) => handleInputChange(index, 'ratioError100', e.target.value.replace(/[^0-9+\-.]/g, ''))}
                                placeholder=""
                                disabled={readOnly}
                              />
                            )}
                          </td>

                          <td className="input-cell w-[120px]">
                            {readOnly ? (
                              <div className={`p-2 text-center font-bold text-xs h-8 flex items-center justify-center ${isPhaseErrorInvalid ? 'invalid-reading' : 'text-blue-800'}`}>
                                {renderVal(row.phaseError)}
                              </div>
                            ) : (
                              <Input
                                className={`input-field text-blue-800 font-medium ${isPhaseErrorInvalid ? 'invalid-reading' : ''}`}
                                value={row.phaseError}
                                onKeyDown={handleTableGridKeyDown}
                                onFocus={handleInputFocus}
                                onChange={(e) => handleInputChange(index, 'phaseError', e.target.value.replace(/[^0-9+\-.]/g, ''))}
                                placeholder=""
                                disabled={readOnly}
                              />
                            )}
                          </td>

                          <td className="bg-white"></td>
                          <td className="bg-white"></td>
                        </tr>

                        <tr>
                          <td className="bg-slate-50 font-bold text-[10px]">
                            Resistance
                          </td>
                          <td className="bg-slate-50 font-bold text-[10px]">
                            ALF
                          </td>
                          <td className="bg-slate-50 font-bold text-[10px]">
                            Excitation Current
                          </td>
                          <td className="bg-slate-50 font-bold text-[10px]">
                            Secondary<br />Limiting Voltage
                          </td>
                          <td className="bg-slate-50 font-bold text-[10px]">
                            Composite Error
                          </td>
                        </tr>

                        <tr>
                          <td className="input-cell">
                            {readOnly ? (
                              <div className="p-2 text-center text-blue-800 font-bold text-xs h-8 flex items-center justify-center">
                                {renderVal(row.resistance)}
                              </div>
                            ) : (
                              <Input
                                className="input-field text-blue-800 font-bold"
                                value={row.resistance}
                                onKeyDown={handleTableGridKeyDown}
                                onFocus={handleInputFocus}
                                onChange={(e) => handleInputChange(index, 'resistance', e.target.value.replace(/[^0-9+\-.]/g, ''))}
                                disabled={readOnly}
                              />
                            )}
                          </td>
                          <td className="input-cell">
                            {readOnly ? (
                              <div className="p-2 text-center text-blue-800 font-bold text-xs h-8 flex items-center justify-center">
                                {renderVal(row.alf)}
                              </div>
                            ) : (
                              <Input
                                className="input-field text-blue-800 font-bold"
                                value={row.alf}
                                onKeyDown={handleTableGridKeyDown}
                                onFocus={handleInputFocus}
                                onChange={(e) => handleInputChange(index, 'alf', e.target.value.replace(/[^0-9+\-.]/g, ''))}
                                disabled={readOnly}
                              />
                            )}
                          </td>
                          <td className="input-cell">
                            {readOnly ? (
                              <div className="p-2 text-center text-blue-800 font-bold text-xs h-8 flex items-center justify-center">
                                {renderVal(row.excitationCurrent)}
                              </div>
                            ) : (
                              <Input
                                className="input-field text-blue-800 font-bold"
                                value={row.excitationCurrent}
                                onKeyDown={handleTableGridKeyDown}
                                onFocus={handleInputFocus}
                                onChange={(e) => handleInputChange(index, 'excitationCurrent', e.target.value.replace(/[^0-9+\-.]/g, ''))}
                                disabled={readOnly}
                              />
                            )}
                          </td>
                          <td className="input-cell">
                            {readOnly ? (
                              <div className="p-2 text-center text-blue-800 font-bold text-xs h-8 flex items-center justify-center bg-slate-50">
                                {renderVal(row.secondaryLimitingVoltage)}
                              </div>
                            ) : (
                              <Input
                                className="input-field text-blue-800 font-bold bg-slate-50"
                                value={row.secondaryLimitingVoltage}
                                onChange={() => { }}
                                readOnly={true}
                                disabled={readOnly}
                              />
                            )}
                          </td>
                          <td className="input-cell">
                            {readOnly ? (
                              <div className={`p-2 text-center font-bold text-xs h-8 flex items-center justify-center bg-slate-50 ${isCompositeErrorInvalid ? 'invalid-reading' : 'text-blue-800'}`}>
                                {renderVal(row.compositeError)}
                              </div>
                            ) : (
                              <Input
                                className={`input-field text-blue-800 font-bold bg-slate-50 ${isCompositeErrorInvalid ? 'invalid-reading' : ''}`}
                                value={row.compositeError}
                                onChange={() => { }}
                                readOnly={true}
                                disabled={readOnly}
                              />
                            )}
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <ReportSignatures testerName={testerName} hideStampAndSignature={true} />
        </div>
      </div>
    </div>

      {!readOnly && (
        <div className="no-print mt-6 mb-8 flex justify-center items-center gap-3">
          <Button
            onClick={async () => {
              await handleDatabaseSave(false);
              onBack();
            }}
            disabled={saving}
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-100 px-8 py-2.5 font-semibold text-sm shadow-sm gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Testing
          </Button>
          <Button
            onClick={() => handleDatabaseSave(false)}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white px-10 py-2.5 font-semibold text-sm shadow-sm gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
          {onNext && (
            <Button
              onClick={async () => {
                await handleDatabaseSave(false);
                onNext();
              }}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-2.5 font-semibold text-sm shadow-sm gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save & Next'}
            </Button>
          )}
        </div>
      )}
      {/* REPLACE CORE FROM READY STOCK MODAL */}
      {isReplaceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
          <div className="w-full max-w-md p-6 bg-white shadow-2xl rounded-xl border border-gray-100 flex flex-col gap-4 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange-500" />
                Core Replacement
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Replace failed core <span className="font-mono font-bold text-red-600">{selectedCoreId}</span> with a pre-tested core from Ready Stock.
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-xs font-bold text-red-800 uppercase">Failed Core Info:</div>
              <div className="text-sm text-red-700 mt-1 font-mono">
                <strong>Type:</strong> Protection <br />
                <strong>Core Serial No:</strong> {selectedCoreId}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-500 block">
                Choose Core (from Ready Stock)
              </label>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by Core Serial or Turns..."
                  value={coreSearchTerm}
                  onChange={(e) => setCoreSearchTerm(e.target.value)}
                  className="pl-9 text-xs font-mono border-gray-300 h-9"
                />
              </div>

              {loadingReadyCores ? (
                <div className="flex items-center gap-2 py-4 text-xs text-gray-500 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                  Loading ready stock cores...
                </div>
              ) : filteredReadyCores.length === 0 ? (
                <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 mt-1">
                  {coreSearchTerm ? 'No ready stock cores match your search.' : 'No available cores in Ready Stock matching this type.'}
                </p>
              ) : (
                <select
                  value={selectedNewCoreId}
                  onChange={(e) => setSelectedNewCoreId(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm font-mono outline-none focus:border-orange-500 shadow-sm"
                >
                  <option value="">-- Select Replacement Core ({filteredReadyCores.length}) --</option>
                  {filteredReadyCores.map((c: any) => (
                    <option key={c._id || c.id} value={c.coreId || c.id}>
                      {c.coreId || c.id} {c.specifications?.turns ? `(Turns: ${c.specifications.turns})` : ''} ({c.coreType})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => setIsReplaceModalOpen(false)}
                disabled={isReplacingCore}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmReplaceCore}
                disabled={isReplacingCore || !selectedNewCoreId}
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs gap-1.5 font-bold"
              >
                {isReplacingCore ? (
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
          </div>
        </div>
      )}
      {failModalJSX}
    </div>
  );
}

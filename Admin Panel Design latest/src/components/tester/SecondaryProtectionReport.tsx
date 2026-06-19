import axios from '@/utils/axiosConfig';
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ArrowLeft, Save, Printer, AlertTriangle } from 'lucide-react';
import { Transformer } from './SecondaryTransformersList';
import { toast } from 'sonner';

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
  stage?: 'secondary' | 'primary' | 'final';
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
  isUnified = false
}: SecondaryProtectionReportProps) {
  const coreIndex = (coreNumber && coreNumber > 0) ? (coreNumber - 1) :
    (!isNaN(parseInt(coreId.replace(/[^0-9]/g, ''))) ? parseInt(coreId.replace(/[^0-9]/g, '')) - 1 : 0);

  const hasBeenRetested = !!(retestHistory?.some((h: any) =>
    Array.isArray(h.newTreatmentReadings) && h.newTreatmentReadings.some((r: any) =>
      r.internalCoreNo === coreId || r.coreId === coreId
    )
  ));


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

  // Initialize Data
  useEffect(() => {
    // 1. Determine Ratios
    // 1. Determine Ratios for this core
    const dynamicRatios: string[] = (() => {

      const order = propOrder || transformer.fullOrder || transformer.orderId;
      const orderCores = order?.coreDetails || [];
      const coreFromOrder = orderCores[coreIndex];

      const secCurr = coreFromOrder?.secondaryCurrent ||
        order?.ratedSecondaryCurrent ||
        '1';

      const rawPrimaryCurrs = (order?.primaryCurrents && order.primaryCurrents.length > 0) ? order.primaryCurrents :
        (Array.isArray(order?.ratio) ? order.ratio.map((r: string) => r.split('/')[0]) : ['200']);

      let primaryCurrs = rawPrimaryCurrs.flatMap((pc: string) =>
        pc.replace(/[\[\]"']/g, '').split(/[- ,]+/).filter(v => v.trim() !== '')
      );
      primaryCurrs = [...new Set(primaryCurrs)];

      return primaryCurrs.map((p: string) => `${p}/${secCurr}`);
    })();

    // 2. Create Initial State
    const initialData = dynamicRatios.map((ratio: string) => ({
      ratio,
      ratioError100: '',
      phaseError: '',
      resistance: '',
      alf: '',
      secondaryLimitingVoltage: '',
      excitationCurrent: '',
      compositeError: ''
    }));

    // 3. Sync with prop if it has history (Fast Load)
    let myResults = [];
    
    // If we are in the failed section, treated readings are ALWAYS saved to secondary_test, even for primary failures, but only for the failed core.
    const shouldLoadFromTreated = isFailedSection && failedStatus === 'TREATED' && (isFailedCore || hasBeenRetested);
    if (shouldLoadFromTreated) {
      const secHistory = transformer.testHistory?.secondary_test;
      if (secHistory?.protection_results?.length > 0) {
        myResults = secHistory.protection_results.filter((res: any) =>
          res.internalCoreNo === coreId || res.coreId === coreId
        );
      }
    }

    if (myResults.length === 0) {
      const stageKey = `${stage}_test` as keyof typeof transformer.testHistory;
      const stageHistory = transformer.testHistory?.[stageKey];
      if (stageHistory?.protection_results?.length > 0) {
        myResults = stageHistory.protection_results.filter((res: any) =>
          res.internalCoreNo === coreId || res.coreId === coreId
        );
      }
    }

    // Fallback like Metering for sourceStage
    if (myResults.length === 0 && sourceStage && sourceStage !== stage) {
      const sourceHistory = transformer.testHistory?.[`${sourceStage}_test` as keyof typeof transformer.testHistory] as any;
      if (sourceHistory?.protection_results?.length > 0) {
        myResults = sourceHistory.protection_results.filter((res: any) =>
          res.internalCoreNo === coreId || res.coreId === coreId
        );
      }
    }

    if (myResults.length > 0) {
        const syncedData = initialData.map((row: ProtectionTestRow, index: number) => {
          let saved = myResults.find((r: any) => r.ratioValue === row.ratio);
          if (!saved && myResults[index]) {
            saved = myResults[index];
          }
          if (!saved && dynamicRatios.length === 1) {
            saved = myResults.find((r: any) => !r.ratioValue || r.ratioValue === 'N/A');
          }

          if (saved) {
            const safeStr = (val: any) => (val !== undefined && val !== null) ? String(val) : '';
            return {
              ...row,
              ratioError100: safeStr(saved.ratioError100 ?? saved.burden100_1),
              phaseError: safeStr(saved.phaseError ?? saved.burden100_2),
              resistance: safeStr(saved.resistance),
              alf: safeStr(saved.alf),
              secondaryLimitingVoltage: safeStr(saved.secondaryLimitingVoltage ?? saved.secondaryLimitingVtg),
              excitationCurrent: safeStr(saved.excitationCurrent),
              compositeError: safeStr(saved.compositeError),
              isPass: saved.isPass,
              reason: saved.reason,
              protectionClass: saved.protectionClass
            };
          }
          return row;
        });
        setTestResults(syncedData);
        return;
      }

    setTestResults(initialData);

  }, [transformer, coreId, stage, failedStatus, isFailedCore, retestHistory]);


  // ✅ LOAD DATA EFFECT for Read Only viewing OR Consistency
  useEffect(() => {
    const fetchLatestData = async () => {
      try {
        const res = await axios.get(`/transformers/${transformer.uniqueId}`, { withCredentials: true });
        const freshTransformer = res.data;

        let myResults = [];
        
        const shouldLoadFromTreated = isFailedSection && failedStatus === 'TREATED' && (isFailedCore || hasBeenRetested);
        if (shouldLoadFromTreated) {
          const secHistory = freshTransformer.testHistory?.secondary_test;
          if (secHistory?.protection_results?.length > 0) {
            myResults = secHistory.protection_results.filter((res: any) =>
              res.internalCoreNo === coreId || res.coreId === coreId
            );
          }
        }

        if (myResults.length === 0) {
          const stageKey = `${stage}_test` as keyof typeof freshTransformer.testHistory;
          const stageHistory = freshTransformer?.testHistory?.[stageKey];
          if (stageHistory?.protection_results?.length > 0) {
            myResults = stageHistory.protection_results.filter((res: any) =>
              res.internalCoreNo === coreId || res.coreId === coreId
            );
          }
        }

        if (myResults.length === 0 && sourceStage && sourceStage !== stage) {
          const sourceHistory = freshTransformer?.testHistory?.[`${sourceStage}_test`] as any;
          if (sourceHistory?.protection_results?.length > 0) {
            myResults = sourceHistory.protection_results.filter((res: any) =>
              res.internalCoreNo === coreId || res.coreId === coreId
            );
          }
        }

        if (myResults.length > 0) {
            setTestResults(prev => prev.map((row, index) => {
              // 1. Try Exact Match
              let saved = myResults.find((r: any) => r.ratioValue === row.ratio);

              // 1.5 Fallback: Match by index
              if (!saved && myResults[index]) {
                saved = myResults[index];
              }

              // 2. Fallback for "N/A" if checking against the single available ratio
              if (!saved && ratiosToUse.length === 1) {
                saved = myResults.find((r: any) => !r.ratioValue || r.ratioValue === 'N/A');
              }

              if (saved) {
                // Formatting helper for safe string conversion
                const safeStr = (val: any) => (val !== undefined && val !== null) ? String(val) : '';

                // Synchronize class from DB if it's different from the current guessed/initial state
                if (saved.protectionClass && saved.protectionClass !== protectionClass) {
                  setProtectionClass(saved.protectionClass);
                }

                return {
                  ...row,
                  // Map legacy burden fields to new error fields if necessary, or use new fields
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
          }
      } catch (err) {
        console.error("Failed to load existing protection data", err);
      }
    };
    fetchLatestData();
  }, [transformer.uniqueId, coreId, stage, failedStatus, isFailedCore, retestHistory]);

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



  const handleDatabaseSave = async () => {
    if (readOnly) return;
    console.log("handleDatabaseSave: STARTED (Protection)");
    try {
      // 1. Build the array based on your ProtectionBlockSchema
      const parseOrNull = (val: any) => (val === '' || val === null || val === undefined) ? null : parseFloat(val);

      const protectionResults = testResults.map(row => ({
        internalCoreNo: coreId, // Inject Core ID for persistence
        coreId: coreId,         // Inject Core ID for persistence
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
        loginType: `${stage}_login`, // Consistent with your schema path
        tester: testerName,
        coreId: coreId,
        protection_results: protectionResults
      };

      console.log("handleDatabaseSave: Payload ready", payload);

      
      let response;
      if (isFailedSection && failedTransformerId) {
        // Save to retest-save endpoint
        response = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/failed-transformers/${failedTransformerId}/retest-save`, {
            treatedReadings: payload.protection_results,
            treatedBy: testerName,
            remarks: "Treated After Primary Failure via Protection Report",
            coreType: 'protection'
        }, { withCredentials: true });
      } else {
        const baseUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
        const endpoint = `${baseUrl}/transformer-${stage}-protection-tests`;
        console.log(`handleDatabaseSave: Sending Request to ${endpoint}...`);


        response = await axios.post(
          endpoint,
          payload,
          { withCredentials: true }
        );
      }

      if (onCompleteTimer) await onCompleteTimer();

      console.log("handleDatabaseSave: Response received", response);
      toast.success("Protection data saved to database successfully!");
      if (onRefresh) onRefresh();

    } catch (error) {
      console.error("handleDatabaseSave: ERROR CAUGHT", error);
      toast.error("Failed to save protection data.");
    }
  };



  // Failed Core Logic Match
  const hasFailures = testResults.some(row => row.isPass === false);

  const handleMarkAsFailed = async () => {
    if (readOnly) return;
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
        failureParameters: { failureStage: `${stage}_protection_test`, dynamicValues: testResults, coreId: coreId },
        failureReason: allReasons || "Limits Exceeded",
        reportedBy: testerName,
        stage: stage === 'primary' ? "PRIMARY_TESTING" : stage === 'final' ? "FINAL_TESTING" : "SECONDARY_TESTING",
        status: "FAILED"
      };

      const response = await axios.post(`/failed-transformers`, payload, { withCredentials: true });
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
    <div className="w-full overflow-x-auto bg-gray-50 py-4 flex justify-start md:justify-center no-print-scroll">
      <style>{secondaryReportPrintStyles}</style>

      <div className="print-container w-[210mm] min-w-[210mm] secondary-print-page">
        {!readOnly && (
          <div className="flex items-center justify-between no-print mb-4 w-full">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDatabaseSave} className="gap-2">
                <Save className="w-4 h-4" /> Save
              </Button>
              {hasFailures && (
                <Button variant="destructive" size="sm" onClick={handleMarkAsFailed} className="gap-2">
                  <AlertTriangle className="w-4 h-4" /> Add to Failed Transformer
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
                <Printer className="w-4 h-4" /> Print
              </Button>
            </div>
          </div>
        )}

        <div id="secondary-printable-report" className="report-wrapper secondary-report-wrapper">
          <ReportHeader
            stage={stage}
            date={formatReportDate(transformer.testHistory?.[`${stage}_test` as keyof typeof transformer.testHistory]?.reportDate)}
            orderNo={transformer.jobId || transformer.uniqueId}
            client={transformer.clientName || 'N/A'}
            unitNo={transformer.uniqueId}
            accuracyClass={protectionClass || '5P'}
          />

          <div className="ae-section-container">
            <ReportSectionTitle index={1} title={`Secondary Winding Verification - ${coreId}`} />
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
            <CoreInformationBar label="Protection Core No" value={coreId} />
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
                                onKeyDown={(e) => {
                                  if (e.ctrlKey || e.metaKey || ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter", "."].includes(e.key)) return;
                                  if (!/^[0-9+\-]$/.test(e.key)) e.preventDefault();
                                }}
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
                                onKeyDown={(e) => {
                                  if (e.ctrlKey || e.metaKey || ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter", "."].includes(e.key)) return;
                                  if (!/^[0-9+\-]$/.test(e.key)) e.preventDefault();
                                }}
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
                                onKeyDown={(e) => {
                                  if (e.ctrlKey || e.metaKey || ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter", "."].includes(e.key)) return;
                                  if (!/^[0-9+\-]$/.test(e.key)) e.preventDefault();
                                }}
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
                                onKeyDown={(e) => {
                                  if (e.ctrlKey || e.metaKey || ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter", "."].includes(e.key)) return;
                                  if (!/^[0-9+\-]$/.test(e.key)) e.preventDefault();
                                }}
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
                                onKeyDown={(e) => {
                                  if (e.ctrlKey || e.metaKey || ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter", "."].includes(e.key)) return;
                                  if (!/^[0-9+\-]$/.test(e.key)) e.preventDefault();
                                }}
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
  );
}

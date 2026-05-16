import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ArrowLeft, Save, Printer, AlertTriangle } from 'lucide-react';
import { Transformer } from './SecondaryTransformersList';
import { toast } from 'sonner';
import logoImage from 'figma:asset/9d5dbd3020690d903579eb3ff66bac216cd36f83.png';
import { ImageWithFallback } from '../figma/ImageWithFallback';

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
}: SecondaryProtectionReportProps) {
  const coreIndex = (coreNumber && coreNumber > 0) ? (coreNumber - 1) :
    (!isNaN(parseInt(coreId.replace(/[^0-9]/g, ''))) ? parseInt(coreId.replace(/[^0-9]/g, '')) - 1 : 0);


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
        const response = await axios.get('http://localhost:5001/api/accuracy-limits/protection', { withCredentials: true });
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
    const stageKey = `${stage}_test` as keyof typeof transformer.testHistory;
    const stageHistory = transformer.testHistory?.[stageKey];

    if (stageHistory?.protection_results?.length > 0) {
      const myResults = stageHistory.protection_results.filter((res: any) =>
        res.internalCoreNo === coreId || res.coreId === coreId
      );

      if (myResults.length > 0) {
        const syncedData = initialData.map((row: ProtectionTestRow) => {
          let saved = myResults.find((r: any) => r.ratioValue === row.ratio);
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
    }

    setTestResults(initialData);

  }, [transformer, coreId, stage]);


  // ✅ LOAD DATA EFFECT for Read Only viewing OR Consistency
  useEffect(() => {
    const fetchLatestData = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/transformers/${transformer.uniqueId}`, { withCredentials: true });
        const freshTransformer = res.data;

        // Dynamic Path
        const stageKey = `${stage}_test` as keyof typeof freshTransformer.testHistory;
        const stageHistory = freshTransformer?.testHistory?.[stageKey];

        if (stageHistory?.protection_results?.length > 0) {
          const myResults = stageHistory.protection_results.filter((res: any) =>
            res.internalCoreNo === coreId || res.coreId === coreId
          );

          if (myResults.length > 0) {
            setTestResults(prev => prev.map(row => {
              // 1. Try Exact Match
              let saved = myResults.find((r: any) => r.ratioValue === row.ratio);

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
        }
      } catch (err) {
        console.error("Failed to load existing protection data", err);
      }
    };
    fetchLatestData();
  }, [transformer.uniqueId, coreId, stage]);

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

        // Force Parsing: Wrap all table inputs in parseFloat()
        const r = parseFloat(updatedRow.resistance) || 0;
        const alf = parseFloat(updatedRow.alf) || 0;
        const ex = parseFloat(updatedRow.excitationCurrent) || 0;

        // Debug inputs for calculation verification
        console.log("Values used:", { burdenVal, iRated, resistance: r, alf });

        // Safety Constraint: If ALF or I_Rated is 0, results default to 0 to avoid Infinity/NaN
        if (alf === 0 || iRated === 0) {
          return {
            ...updatedRow,
            secondaryLimitingVoltage: '0.000',
            compositeError: '0.000'
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
      const protectionResults = testResults.map(row => ({
        internalCoreNo: coreId, // Inject Core ID for persistence
        ratioValue: row.ratio,
        protectionClass: protectionClass || '5P',

        // New Schema Mapping - Ensure Numeric Integrity
        ratioError100: parseFloat(row.ratioError100) || 0,
        phaseError: parseFloat(row.phaseError) || 0,

        resistance: parseFloat(row.resistance) || 0,
        alf: parseFloat(row.alf) || 0,
        excitationCurrent: parseFloat(row.excitationCurrent) || 0,

        // Calculated fields (stored as strings in state, convert back to number)
        secondaryLimitingVoltage: parseFloat(row.secondaryLimitingVoltage) || 0,
        compositeError: parseFloat(row.compositeError) || 0,

        // Pass/Fail status for strict approval tracking
        isPass: row.isPass,
        reason: row.reason,

        // Legacy Field Mapping
        secondaryLimitingVtg: parseFloat(row.secondaryLimitingVoltage) || 0
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
      const endpoint = `http://localhost:5001/transformer-${stage}-protection-tests`;
      console.log(`handleDatabaseSave: Sending Request to ${endpoint}...`);

      const response = await axios.post(
        endpoint,
        payload,
        { withCredentials: true }
      );

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

      const payload = {
        orderId: transformer.orderId?._id || transformer.orderId,
        internalCoreNo: coreId,
        failureReason: allReasons || "Limits Exceeded",
        failureStage: `${stage}_protection_test`,
        dynamicValues: testResults
      };

      await axios.post(`http://localhost:5001/api/failed-cores`, payload, { withCredentials: true });
      toast.success("Added to Failed Cores!");
    } catch (err: any) {
      console.error("Mark as failed error:", err);
      toast.error(err.response?.data?.message || "Could not add to failed cores");
    }
  };

  return (
    <div className="space-y-6 p-4 bg-gray-50 flex justify-center">
      <style>{`
        .report-wrapper { background: white; width: 210mm; min-height: 297mm; padding: 15mm; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); color: black; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-sizing: border-box; }
        .report-header-top { display: flex; align-items: center; justify-content: center; position: relative; padding-bottom: 10px; border-bottom: 2px solid #000; margin-bottom: 5px; }
        .header-logo { position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 120px; height: 60px; display: flex; align-items: center; }
        .header-titles { text-align: center; }
        .header-titles h1 { font-size: 24px; font-weight: bold; color: #1e3a8a; margin: 0; letter-spacing: 1px; }
        .header-titles p { font-size: 12px; color: #4b5563; margin: 0; }
        .report-metadata { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .meta-column { width: 48%; }
        .meta-field { display: flex; margin-bottom: 4px; font-size: 12px; }
        .meta-label { font-weight: 600; width: 80px; }
        .meta-value { flex: 1; }
        .report-main-title { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; }
        .section-container { border: 1px solid #000; margin-bottom: 15px; }
        .section-title { padding: 4px; text-align: center; font-weight: bold; font-size: 13px; border-bottom: 1px solid #000; }
        .spec-table { width: 100%; border-collapse: collapse; }
        .spec-table td { border-bottom: 1px solid #000; padding: 4px 8px; font-size: 12px; }
        .spec-table tr:last-child td { border-bottom: none; }
        .nested-table { width: 100%; border-collapse: collapse; table-layout: fixed; border-top: 1px solid #000; }
        .nested-table th, .nested-table td { border: 1px solid #000; padding: 4px; text-align: center; font-size: 11px; }
        .nested-table th { font-weight: bold; }

        .input-cell { padding: 0 !important; }
        .input-field { width: 100%; height: 24px; text-align: center; border: none; background: transparent; font-size: 11px; outline: none; }
        .input-field:focus { background-color: #fef08a; }
        .footer-sig { margin-top: 60px; display: flex; justify-content: space-between; padding: 0 40px; page-break-inside: avoid; }
        .sig-block { text-align: center; width: 200px; display: flex; flex-direction: column; align-items: center; }
        .sig-name { font-size: 12px; font-weight: bold; min-height: 18px; margin-bottom: 5px; }
        .sig-line { width: 100%; border-top: 1px dashed #000; padding-top: 5px; font-weight: bold; font-size: 12px; }
        .bg-yellow { background-color: #f9fafb !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { background: white; margin: 0; padding: 0; }
          .print-container { width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .report-wrapper { box-shadow: none; width: 100%; min-height: auto; padding: 0; margin: 0; border: none; }
          .bg-gray-50 { background: white !important; }
          .no-print { display: none !important; }
          .overflow-x-auto { overflow: visible !important; }
          table { page-break-inside: avoid; width: 100% !important; }
          tr { page-break-inside: avoid; page-break-after: auto; }

          /* Strip browser default input box appearance for print */
          .nested-table input {
            -webkit-appearance: none !important;
            appearance: none !important;
            border: none !important;
            outline: none !important;
            background: transparent !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 2px 0 !important;
            margin: 0 !important;
            height: 28px !important;
            min-height: 28px !important;
            line-height: 28px !important;
            display: block !important;
            width: 100% !important;
            font-size: 11px !important;
            font-weight: bold !important;
            text-align: center !important;
            color: inherit !important;
          }

          /* Fix Protection table rowSpan heights (rowspan=3 → 84px, rowspan=2 → 56px) */
          .nested-table tbody td[rowspan="3"] {
            height: 84px !important;
            min-height: 84px !important;
            vertical-align: middle !important;
          }
          .nested-table tbody td[rowspan="2"] {
            height: 56px !important;
            min-height: 56px !important;
            vertical-align: middle !important;
          }
          .nested-table tbody td:not([rowspan]) {
            height: 28px !important;
            min-height: 28px !important;
            vertical-align: middle !important;
          }
          .nested-table tbody td .flex {
            display: flex !important;
            align-items: center !important;
            height: 28px !important;
            min-height: 28px !important;
          }
        }
      `}</style>
      
      <div className="print-container w-[210mm]">
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
                  <AlertTriangle className="w-4 h-4" /> Add to Failed Cores
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
                <Printer className="w-4 h-4" /> Print
              </Button>
            </div>
          </div>
        )}

        <div id="printable-report" className="report-wrapper">
          <div className="report-header-top">
            <div className="header-logo">
              <ImageWithFallback src={logoImage} alt="Advent Logo" className="max-w-full max-h-full object-contain" />
            </div>
            <div className="header-titles">
              <h1>ADVENT ENGINEERS</h1>
              <p>Excellence in Transformer Core Testing</p>
            </div>
          </div>

          <div className="report-metadata">
            <div className="meta-column">
              <div className="meta-field"><span className="meta-label">Date</span><span className="meta-value">: {stage && transformer.testHistory?.[`${stage}_test` as keyof typeof transformer.testHistory]?.reportDate
                  ? new Date(transformer.testHistory[`${stage}_test` as keyof typeof transformer.testHistory].reportDate).toLocaleDateString('en-GB')
                  : new Date().toLocaleDateString('en-GB')}</span></div>
              <div className="meta-field"><span className="meta-label">Order No</span><span className="meta-value">: {transformer.jobId || transformer.uniqueId}</span></div>
              <div className="meta-field"><span className="meta-label">Client</span><span className="meta-value">: {transformer.clientName || 'N/A'}</span></div>
            </div>
            <div className="meta-column">
              <div className="meta-field"><span className="meta-label">Unit No</span><span className="meta-value">: {transformer.uniqueId}</span></div>
              <div className="meta-field"><span className="meta-label">Class</span><span className="meta-value">: {protectionClass || '5P'}</span></div>
            </div>
          </div>

          <div className="report-main-title">PROTECTION CORE TEST REPORT</div>

          <div className="section-container">
            <div className="section-title bg-gray-100">Secondary Winding Verification - {coreId}</div>
            <table className="spec-table">
              <tbody>
                <tr>
                  <td colSpan={2}><span className="font-bold mr-2">Specification :</span> {transformer.voltageRating || '33'} KV {transformer.clientName || 'N/A'}</td>
                </tr>
                <tr>
                  <td colSpan={2}><span className="font-bold mr-2">CT Ratio :</span> {ratiosToUse.join('-')} A</td>
                </tr>
                <tr>
                  <td style={{ width: '50%', borderRight: '1px solid #000' }}><span className="font-bold mr-2">Burden :</span> {displayBurden} VA</td>
                  <td style={{ width: '50%' }}><span className="font-bold mr-2">Class :</span> {protectionClass || '5P'}</td>
                </tr>
                <tr>
                  <td colSpan={2}><span className="font-bold mr-2">STC :</span> {displaySTC}</td>
                </tr>
              </tbody>
            </table>
          </div>

        <div className="mt-4">

          <div className="overflow-x-auto">
            <table className="nested-table">
              <thead>

                {/* HEADER BOX ROW 2: SUB-HEADERS */}
                <tr className="bg-white">
                  {/* Left Space (Aligns with Ratio & 100% cols) */}
                  <th className="border border-gray-400 p-2" colSpan={2}></th>

                  {/* Middle: 100% Burden (Aligns with Burden input cols) */}
                  <th className="border border-gray-400 p-2 text-center font-bold text-sm" colSpan={2}>
                    100 % Burden
                  </th>

                  {/* Right: Protection Core No (Aligns with Result cols) */}
                  <th className="border border-gray-400 p-2 text-right" colSpan={2}>
                    <div className="flex justify-end items-center gap-2">
                      <span className="font-bold text-sm">protection core no.</span>
                      <span className="border-b border-gray-600 px-2 min-w-[60px] text-blue-700 font-medium">{coreId}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {testResults.map((row, index) => (
                  <React.Fragment key={index}>
                    {/* --- ROW 1: Ratio (Span 3), 100% Label, Burden 1, Burden 2, Empty --- */}
                    <tr className="border-t-2 border-gray-800"> {/* Thicker top border for separation between groups */}
                      {/* COL 1: Ratio (Spans 3 Rows) */}
                      <td rowSpan={3} className="bg-yellow font-bold text-center align-middle w-[150px]">
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

                      {/* COL 2: "100%" Label */}
                      <td className="border border-gray-400 p-2 text-center bg-white font-bold text-xs w-[120px]">
                        100%
                      </td>

                      {/* COL 3: Ratio Error (was Burden 1) */}
                      <td className="border border-gray-400 p-0 w-[120px]">
                        {readOnly ? (
                          <div className="p-2 text-center text-blue-800 font-bold text-xs h-8 flex items-center justify-center">
                            {row.ratioError100 || '-'}
                          </div>
                        ) : (
                          <Input
                            className="border-none text-center h-8 bg-transparent text-blue-800 font-medium w-full shadow-none"
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

                      {/* COL 4: Phase Error (was Burden 2) */}
                      <td className="border border-gray-400 p-0 w-[120px]">
                        {readOnly ? (
                          <div className="p-2 text-center text-blue-800 font-bold text-xs h-8 flex items-center justify-center">
                            {row.phaseError || '-'}
                          </div>
                        ) : (
                          <Input
                            className="border-none text-center h-8 bg-transparent text-blue-800 font-medium w-full shadow-none"
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

                      {/* COL 5 & 6: Empty Cells */}
                      <td className="border border-gray-400 bg-white"></td>
                      <td className="border border-gray-400 bg-white"></td>
                    </tr>

                    {/* --- ROW 2: Labels Only --- */}
                    <tr>
                      {/* Ratio occupied above */}
                      <td className="bg-gray-50 font-bold text-[10px]">
                        Resistance
                      </td>
                      <td className="bg-gray-50 font-bold text-[10px]">
                        ALF
                      </td>
                      <td className="bg-gray-50 font-bold text-[10px]">
                        Excitation Current
                      </td>
                      <td className="bg-gray-50 font-bold text-[10px]">
                        Secondary<br />Limiting Voltage
                      </td>
                      <td className="bg-gray-50 font-bold text-[10px]">
                        Composite Error
                      </td>
                    </tr>

                    {/* --- ROW 3: Values Inputs --- */}
                    <tr>
                      {/* Ratio occupied above */}
                      <td className="border border-gray-400 p-0">
                        {readOnly ? (
                          <div className="p-2 text-center text-blue-800 font-bold text-xs h-8 flex items-center justify-center">
                            {row.resistance || '-'}
                          </div>
                        ) : (
                          <Input
                            className="border-none text-center h-8 bg-transparent text-blue-800 font-bold w-full shadow-none"
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
                      <td className="border border-gray-400 p-0">
                        {/* ALF Input */}
                        {readOnly ? (
                          <div className="p-2 text-center text-blue-800 font-bold text-xs h-8 flex items-center justify-center">
                            {row.alf || '-'}
                          </div>
                        ) : (
                          <Input
                            className="border-none text-center h-8 bg-transparent text-blue-800 font-bold w-full shadow-none"
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
                      <td className="border border-gray-400 p-0">
                        {readOnly ? (
                          <div className="p-2 text-center text-blue-800 font-bold text-xs h-8 flex items-center justify-center">
                            {row.excitationCurrent || '-'}
                          </div>
                        ) : (
                          <Input
                            className="border-none text-center h-8 bg-transparent text-blue-800 font-bold w-full shadow-none"
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
                      <td className="border border-gray-400 p-0">
                        {/* MAPPED to secondaryLimitingVoltage */}
                        {readOnly ? (
                          <div className="p-2 text-center text-blue-800 font-bold text-xs h-8 flex items-center justify-center bg-gray-50">
                            {row.secondaryLimitingVoltage || '-'}
                          </div>
                        ) : (
                          <Input
                            className="border-none text-center h-8 bg-transparent text-blue-800 font-bold w-full bg-gray-50 shadow-none"
                            value={row.secondaryLimitingVoltage}
                            onChange={() => { }}
                            readOnly={true}
                            disabled={readOnly}
                          />
                        )}
                      </td>
                      <td className="border border-gray-400 p-0">
                        {readOnly ? (
                          <div className="p-2 text-center text-blue-800 font-bold text-xs h-8 flex items-center justify-center bg-gray-50">
                            {row.compositeError || '-'}
                          </div>
                        ) : (
                          <Input
                            className="border-none text-center h-8 bg-transparent text-blue-800 font-bold w-full bg-gray-50 shadow-none"
                            value={row.compositeError}
                            onChange={() => { }}
                            readOnly={true}
                            disabled={readOnly}
                          />
                        )}
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

          <div className="footer-sig">
            <div className="sig-block">
              <div className="sig-name">{testerName || 'Tester'}</div>
              <div className="sig-line">Tested By</div>
            </div>
            <div className="sig-block">
              <div className="sig-name italic text-gray-500 font-normal mt-1">Stamp & Signature</div>
              <div className="sig-line">Authorised Signatory</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

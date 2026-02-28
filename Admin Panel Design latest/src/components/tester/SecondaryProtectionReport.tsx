





import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ArrowLeft, Save, Printer } from 'lucide-react';
import { Transformer } from './SecondaryTransformersList';
import { toast } from 'sonner';

interface SecondaryProtectionReportProps {
  transformer: Transformer;
  coreId: string;
  testerName: string;
  onBack: () => void;
  readOnly?: boolean;
  stage?: 'secondary' | 'primary' | 'final';
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
  isPass?: boolean;
  reason?: string;
  protectionClass?: string;
}

export function SecondaryProtectionReport({
  transformer,
  coreId,
  testerName,
  onBack,
  readOnly = false,
  stage = 'secondary',
}: SecondaryProtectionReportProps) {

  // Use ratios from the transformer object, falling back to a default if empty
  const ratiosToUse = (transformer.ratios && transformer.ratios.length > 0)
    ? transformer.ratios
    : (transformer.orderId?.ratio || ['N/A']);


  const [testResults, setTestResults] = useState<ProtectionTestRow[]>([]);
  const [protectionClass, setProtectionClass] = useState<string>('5P');

  // Initialize Data
  useEffect(() => {
    // 1. Determine Ratios
    const dynamicRatios = (transformer.ratios && transformer.ratios.length > 0)
      ? transformer.ratios
      : (transformer.orderId?.ratio || ['N/A']);

    // Determine Protection Class
    const accClass = transformer.orderId?.accuracyClass || '';
    if (accClass.includes('15P')) setProtectionClass('15P');
    else if (accClass.includes('10P')) setProtectionClass('10P');
    else setProtectionClass('5P');

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

    setTestResults(initialData);

  }, [transformer]);


  // ✅ LOAD DATA EFFECT for Read Only viewing OR Consistency
  useEffect(() => {
    const fetchLatestData = async () => {
      try {
        const res = await axios.get(`http://localhost:3002/api/transformers/${transformer.uniqueId}`, { withCredentials: true });
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

                return {
                  ...row,
                  // Map legacy burden fields to new error fields if necessary, or use new fields
                  ratioError100: safeStr(saved.ratioError100 || saved.burden100_1),
                  phaseError: safeStr(saved.phaseError || saved.burden100_2),

                  resistance: safeStr(saved.resistance),
                  alf: safeStr(saved.alf),
                  secondaryLimitingVoltage: safeStr(saved.secondaryLimitingVoltage || saved.secondaryLimitingVtg),
                  excitationCurrent: safeStr(saved.excitationCurrent),
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
  }, [transformer.uniqueId, coreId, stage, ratiosToUse]);

  // Robust Parsing Helpers
  const parseRatedCurrent = (ratio: any): number => {
    if (!ratio) return 1;
    const str = String(ratio);
    // Extract number immediately after the first forward slash
    const parts = str.split('/');
    if (parts.length >= 2) {
      const val = parseFloat(parts[1] || '0');
      return (isNaN(val) || val === 0) ? 1 : val;
    }
    return 1;
  };

  const parseBurden = (burden: any): number => {
    if (burden === undefined || burden === null) return 0;
    const str = String(burden);
    // Robust regex parsing: extract digits and dots only
    const val = parseFloat(str.replace(/[^\d.]/g, '') || '0');
    return isNaN(val) ? 0 : val;
  };

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
        const burdenVal = parseBurden(transformer.orderId?.burden || '0');

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

        // Formula: SLV = ((Burden / (I_Rated * I_Rated)) + Resistance) * ALF
        // Strict order of operations: Burden divided by I_Rated squared, add Resistance, then multiply by ALF
        const calculatedSLV = ((burdenVal / (iRated * iRated)) + r) * alf;

        // Formula: Composite Error = (ExcitationCurrent / (I_Rated * ALF)) * 100
        const compErr = (ex / (iRated * alf)) * 100;

        // Update derived fields with precision
        return {
          ...updatedRow,
          secondaryLimitingVoltage: calculatedSLV.toFixed(3),
          compositeError: compErr.toFixed(3)
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
        protectionClass: protectionClass,

        // New Schema Mapping - Ensure Numeric Integrity
        // parseFloat parses "123.456" back to number. || 0 handles NaN or empty string.
        ratioError100: parseFloat(row.ratioError100) || 0,
        phaseError: parseFloat(row.phaseError) || 0,

        resistance: parseFloat(row.resistance) || 0,
        alf: parseFloat(row.alf) || 0,
        excitationCurrent: parseFloat(row.excitationCurrent) || 0,

        // Calculated fields (stored as fixed-point strings in state, convert back to number)
        secondaryLimitingVoltage: parseFloat(row.secondaryLimitingVoltage) || 0,
        compositeError: parseFloat(row.compositeError) || 0,

        // Legacy Field Mapping (Map new SLV to old field name for backward compatibility)
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
      const endpoint = `http://localhost:3002/transformer-${stage}-protection-tests`;
      console.log(`handleDatabaseSave: Sending Request to ${endpoint}...`);

      const response = await axios.post(
        endpoint,
        payload,
        { withCredentials: true }
      );

      console.log("handleDatabaseSave: Response received", response);
      toast.success("Protection data saved to database successfully!");

    } catch (error) {
      console.error("handleDatabaseSave: ERROR CAUGHT", error);
      toast.error("Failed to save protection data.");
    }
  };



  // Check Completion
  const isComplete = testResults.length > 0 && testResults.every(row =>
    row.ratioError100 &&
    (protectionClass === '10P' || protectionClass === '15P' ? true : row.phaseError) &&
    row.resistance &&
    row.secondaryLimitingVoltage && row.excitationCurrent && row.compositeError && row.alf
  );



  return (
    <div className="space-y-6 p-4">
      <style>{`
        #print-section {
          background: white;
          padding: 5mm 10mm;
          min-height: 297mm;
          width: 100%;
          box-sizing: border-box;
          color: black;
          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }
        
        .report-header-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border: 1.5px solid #000;
          margin-bottom: 0;
        }
        
        .header-left {
          padding: 10px;
          border-right: 1.5px solid #000;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .header-right {
          display: grid;
          grid-template-rows: repeat(5, 1fr);
        }
        
        .header-field {
          display: grid;
          grid-template-columns: 100px 1fr;
          border-bottom: 1px solid #000;
          font-size: 11px;
        }
        
        .header-field:last-child {
          border-bottom: none;
        }
        
        .field-label {
          padding: 4px 8px;
          border-right: 1px solid #000;
          text-align: right;
          font-weight: 600;
        }
        
        .field-value {
          padding: 4px 8px;
          font-weight: 500;
        }
        
        .report-title-banner {
          background-color: #ffffff !important; /* White */
          border-left: 1.5px solid #000;
          border-right: 1.5px solid #000;
          border-bottom: 2px solid #000;
          text-align: center;
          padding: 6px;
          font-weight: bold;
          font-size: 18px;
          text-transform: uppercase;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .description-banner {
          background-color: #f8fafc !important; /* Minimalist Light Gray */
          border-left: 1.5px solid #000;
          border-right: 1.5px solid #000;
          border-bottom: 1px solid #000;
          text-align: center;
          padding: 4px;
          font-weight: bold;
          font-size: 14px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .nested-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.5px solid #000;
          table-layout: fixed;
        }
        
        .nested-table td, .nested-table th {
          border: 1px solid #000;
          padding: 4px;
          text-align: center;
          font-size: 11px;
          height: 24px;
        }
        
        .bg-yellow { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .bg-blue { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .bg-green { background-color: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .bg-cyan { background-color: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

        .footer-sig {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
          padding: 0 40px;
        }
        
        .sig-item {
          text-align: center;
          width: 200px;
        }
        
        .sig-line {
          border-top: 1.5px solid #000;
          margin-top: 60px;
          padding-top: 5px;
          font-weight: bold;
          font-size: 13px;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body * {
            visibility: hidden;
          }
          #print-section, #print-section * {
            visibility: visible;
          }
          #print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 190mm;
          }
          input, select {
            border: none !important;
            background: transparent !important;
            outline: none !important;
            font-weight: 500 !important;
            text-align: center !important;
            width: 100% !important;
            color: black !important;
          }
        }
      `}</style>
      {/* Top Navigation */}
      <div className="flex items-center justify-between no-print">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
      </div>

      <div id="print-section">
        {/* Header Grid */}
        <div className="report-header-grid">
          <div className="header-left">
            <h1 className="text-2xl font-bold italic text-red-600 leading-tight">ADVENT ENGINEERS</h1>
          </div>

          <div className="text-right flex flex-col items-end">
            <div className="mb-2 flex items-center gap-2">
              <label className="text-xs font-bold text-gray-700">Class:</label>
              <select
                value={protectionClass}
                onChange={(e) => setProtectionClass(e.target.value)}
                className="border border-gray-400 rounded px-1 py-0.5 text-xs font-bold w-16"
                disabled={readOnly}
              >
                <option value="5P">5P</option>
                <option value="10P">10P</option>
                <option value="15P">15P</option>
              </select>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 uppercase">Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            {/* NEW TABLE STRUCTURE MATCHING HANDWRITTEN REFERENCE */}
            <thead>
              {/* HEADER BOX ROW 1: DYNAMIC SPECS */}
              <tr className="bg-white">
                <th className="border border-gray-400 p-2 text-center font-bold text-sm" colSpan={6}>
                  {/* Constructing dynamic string: Voltage, Type, Ratio, Burden, protection */}
                  {`${transformer.orderId?.voltage || '33KV'}, ${transformer.orderId?.type || 'CT'}, ${(Array.isArray(transformer.ratios) ? transformer.ratios.join('-') : transformer.orderId?.ratio?.join('-')) || '800-400-200'}/${transformer.orderId?.secondaryCurrent || '1-1-1A'}, ${transformer.orderId?.burden || '30VA'}, protection`}
                </th>
              </tr>

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
                    <td rowSpan={3} className="border border-gray-400 p-2 bg-white font-bold text-center align-middle w-[150px]">
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
                      <Input
                        className="border-none text-center h-8 bg-transparent text-blue-800 font-medium w-full"
                        value={row.ratioError100}
                        onChange={(e) => handleInputChange(index, 'ratioError100', e.target.value)}
                        placeholder=""
                        disabled={readOnly}
                      />
                    </td>

                    {/* COL 4: Phase Error (was Burden 2) */}
                    <td className="border border-gray-400 p-0 w-[120px]">
                      <Input
                        className="border-none text-center h-8 bg-transparent text-blue-800 font-medium w-full"
                        value={protectionClass === '10P' || protectionClass === '15P' ? 'N/A' : row.phaseError}
                        onChange={(e) => handleInputChange(index, 'phaseError', e.target.value)}
                        placeholder=""
                        disabled={readOnly || protectionClass === '10P' || protectionClass === '15P'}
                      />
                    </td>

                    {/* COL 5 & 6: Empty Cells */}
                    <td className="border border-gray-400 bg-white"></td>
                    <td className="border border-gray-400 bg-white"></td>
                  </tr>

                  {/* --- ROW 2: Labels Only --- */}
                  <tr>
                    {/* Ratio occupied above */}
                    <td className="border border-gray-400 p-1 text-center bg-gray-50 font-bold text-[10px]">
                      Resistance
                    </td>
                    <td className="border border-gray-400 p-1 text-center bg-gray-50 font-bold text-[10px]">
                      ALF
                    </td>
                    <td className="border border-gray-400 p-1 text-center bg-gray-50 font-bold text-[10px]">
                      Excitation Current
                    </td>
                    <td className="border border-gray-400 p-1 text-center bg-gray-50 font-bold text-[10px]">
                      Secondary<br />Limiting Voltage
                    </td>
                    <td className="border border-gray-400 p-1 text-center bg-gray-50 font-bold text-[10px]">
                      Composite Error
                    </td>
                  </tr>

                  {/* --- ROW 3: Values Inputs --- */}
                  <tr>
                    {/* Ratio occupied above */}
                    <td className="border border-gray-400 p-0">
                      <Input
                        className="border-none text-center h-8 bg-transparent text-blue-800 font-bold w-full"
                        value={row.resistance}
                        onChange={(e) => handleInputChange(index, 'resistance', e.target.value)}
                        disabled={readOnly}
                      />
                    </td>
                    <td className="border border-gray-400 p-0">
                      {/* ALF Input BOUND TO NEW FIELD */}
                      <Input
                        className="border-none text-center h-8 bg-transparent text-blue-800 font-bold w-full"
                        value={row.alf}
                        onChange={(e) => handleInputChange(index, 'alf', e.target.value)}
                        placeholder=""
                        disabled={readOnly}
                      />
                    </td>
                    <td className="border border-gray-400 p-0">
                      <Input
                        className="border-none text-center h-8 bg-transparent text-blue-800 font-bold w-full"
                        value={row.excitationCurrent}
                        onChange={(e) => handleInputChange(index, 'excitationCurrent', e.target.value)}
                        disabled={readOnly}
                      />
                    </td>
                    <td className="border border-gray-400 p-0">
                      {/* MAPPED to secondaryLimitingVoltage */}
                      <Input
                        className="border-none text-center h-8 bg-transparent text-blue-800 font-bold w-full bg-gray-50"
                        value={row.secondaryLimitingVoltage}
                        // onChange handler removed/ignored since it's auto-calculated
                        onChange={() => { }}
                        readOnly={true} // Strictly derived
                        disabled={readOnly} // Keeps styling consistent if whole form is readOnly
                      />
                    </td>
                    <td className="border border-gray-400 p-0">
                      <Input
                        className="border-none text-center h-8 bg-transparent text-blue-800 font-bold w-full bg-gray-50"
                        value={row.compositeError}
                        // onChange handler removed/ignored
                        onChange={() => { }}
                        readOnly={true} // Strictly derived
                        disabled={readOnly}
                      />
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>

        </div>
        <div className="description-banner">
          Secondary Verification - {coreId}
        </div>

        <div className="mt-4">

          <div className="overflow-x-auto">
            <table className="nested-table">
              <thead>
                <tr className="bg-yellow">
                  <th className="text-center font-bold" colSpan={6}>
                    {`${transformer.orderId?.voltage || '33KV'}, ${transformer.orderId?.type || 'CT'}, ${(Array.isArray(transformer.ratios) ? transformer.ratios.join('-') : transformer.orderId?.ratio?.join('-')) || '800-400-200'}/${transformer.orderId?.secondaryCurrent || '1-1-1A'}, ${transformer.orderId?.burden || '30VA'}, protection`}
                  </th>
                </tr>

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
                      </td>

                      {/* COL 2: "100%" Label */}
                      <td className="border border-gray-400 p-2 text-center bg-white font-bold text-xs w-[120px]">
                        100%
                      </td>

                      {/* COL 3: Ratio Error (was Burden 1) */}
                      <td className="border border-gray-400 p-0 w-[120px]">
                        <Input
                          className="border-none text-center h-8 bg-transparent text-blue-800 font-medium w-full"
                          value={row.ratioError100}
                          onChange={(e) => handleInputChange(index, 'ratioError100', e.target.value)}
                          placeholder=""
                          disabled={readOnly}
                        />
                      </td>

                      {/* COL 4: Phase Error (was Burden 2) */}
                      <td className="border border-gray-400 p-0 w-[120px]">
                        <Input
                          className="border-none text-center h-8 bg-transparent text-blue-800 font-medium w-full"
                          value={row.phaseError}
                          onChange={(e) => handleInputChange(index, 'phaseError', e.target.value)}
                          placeholder=""
                          disabled={readOnly}
                        />
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
                        <Input
                          className="border-none text-center h-8 bg-transparent text-blue-800 font-bold w-full"
                          value={row.resistance}
                          onChange={(e) => handleInputChange(index, 'resistance', e.target.value)}
                          disabled={readOnly}
                        />
                      </td>
                      <td className="border border-gray-400 p-0">
                        {/* ALF Input BOUND TO NEW FIELD */}
                        <Input
                          className="border-none text-center h-8 bg-transparent text-blue-800 font-bold w-full"
                          value={row.alf}
                          onChange={(e) => handleInputChange(index, 'alf', e.target.value)}
                          placeholder=""
                          disabled={readOnly}
                        />
                      </td>
                      <td className="border border-gray-400 p-0">
                        <Input
                          className="border-none text-center h-8 bg-transparent text-blue-800 font-bold w-full"
                          value={row.excitationCurrent}
                          onChange={(e) => handleInputChange(index, 'excitationCurrent', e.target.value)}
                          disabled={readOnly}
                        />
                      </td>
                      <td className="border border-gray-400 p-0">
                        {/* MAPPED to secondaryLimitingVoltage */}
                        <Input
                          className="border-none text-center h-8 bg-transparent text-blue-800 font-bold w-full bg-gray-50"
                          value={row.secondaryLimitingVoltage}
                          // onChange handler removed/ignored since it's auto-calculated
                          onChange={() => { }}
                          readOnly={true} // Strictly derived
                          disabled={readOnly} // Keeps styling consistent if whole form is readOnly
                        />
                      </td>
                      <td className="border border-gray-400 p-0">
                        <Input
                          className="border-none text-center h-8 bg-transparent text-blue-800 font-bold w-full bg-gray-50"
                          value={row.compositeError}
                          // onChange handler removed/ignored
                          onChange={() => { }}
                          readOnly={true} // Strictly derived
                          disabled={readOnly}
                        />
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Signatures */}
        <div className="footer-sig">
          <div className="sig-item">
            <div className="sig-line">Tested by</div>
            <div className="text-xs mt-1 font-bold">{testerName || 'Tester'}</div>
          </div>
          <div className="sig-item">
            <div className="sig-line">Authorised Signatory</div>
            <div className="text-[10px] mt-1 italic italic-bold text-gray-500">Stamp & Signature</div>
          </div>
        </div>
      </div>

      {/* Database Actions */}
      <div className="flex gap-3 no-print pt-4">
        {!readOnly && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDatabaseSave}
            className="gap-2"
          >
            <Save className="w-4 h-4" /> Save
          </Button>
        )}
      </div>
    </div>
  );
}

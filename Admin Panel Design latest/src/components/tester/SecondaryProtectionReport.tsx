// import { useState } from 'react';
// import { Card } from '../ui/card';
// import { Button } from '../ui/button';
// import { Input } from '../ui/input';
// import { ArrowLeft, Save, Download, Printer } from 'lucide-react';
// import { Transformer } from './SecondaryTransformersList';
// import { exportSecondaryProtectionReport } from '../../utils/pdfExport';
// import { toast } from 'sonner@2.0.3';

// interface SecondaryProtectionReportProps {
//   transformer: Transformer;
//   coreNumber: number;
//   coreId: string;
//   testerName: string;
//   onBack: () => void;
// }

// interface ProtectionTestRow {
//   ratio: string;
//   burden100: string;
//   secondaryLimitingVtg: string;
//   excitationCurrent: string;
//   compositeError: string;
// }

// export function SecondaryProtectionReport({
//   transformer,
//   coreNumber,
//   coreId,
//   testerName,
//   onBack,
// }: SecondaryProtectionReportProps) {
//   const [testData, setTestData] = useState<ProtectionTestRow[]>([
//     { ratio: '200/1', burden100: '', secondaryLimitingVtg: '', excitationCurrent: '', compositeError: '' },
//     { ratio: '400/1', burden100: '', secondaryLimitingVtg: '', excitationCurrent: '', compositeError: '' },
//     { ratio: '800/1', burden100: '', secondaryLimitingVtg: '', excitationCurrent: '', compositeError: '' },
//   ]);

//   const handleInputChange = (rowIndex: number, field: keyof ProtectionTestRow, value: string) => {
//     const newData = [...testData];
//     newData[rowIndex][field] = value;
//     setTestData(newData);
//   };

//   const handleSave = () => {
//     alert('Protection Report saved successfully!');
//   };

//   const handleGenerate = () => {
//     const reportData = {
//       transformerId: transformer.uniqueId,
//       coreNumber,
//       coreId,
//       testerName,
//       rating: transformer.rating,
//       testData,
//     };

//     exportSecondaryProtectionReport(reportData);
//     toast.success('Protection report downloaded successfully!');
//   };

//   const handlePrint = () => {
//     window.print();
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
//           <ArrowLeft className="w-4 h-4" />
//           Back
//         </Button>
//         <div className="flex gap-2">
//           <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
//             <Printer className="w-4 h-4" />
//             Print
//           </Button>
//         </div>
//       </div>

//       <div>
//         <h2>Protection Test Report</h2>
//         <p className="text-gray-500 mt-1">Secondary Testing - Protection Core Analysis</p>
//       </div>

//       {/* Report Header */}
//       <Card className="p-6">
//         <div className="text-center mb-6 pb-4 border-b border-gray-200">
//           <h3 className="text-red-600 mb-2">ADVENT ENGINEERS</h3>
//           <p className="text-sm text-gray-600">{transformer.rating}, Protection</p>
//         </div>

//         <div className="mb-4 flex items-center justify-between">
//           <div>
//             <p className="text-sm">
//               <strong>Protection Core No.:</strong> {coreId}
//             </p>
//           </div>
//           <div className="px-4 py-2 bg-red-100 border border-red-300 rounded">
//             <span className="text-red-700">Core ID: {coreId}</span>
//           </div>
//         </div>

//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
//           <div>
//             <p className="text-gray-600">Transformer ID:</p>
//             <p className="font-medium">{transformer.uniqueId}</p>
//           </div>
//           <div>
//             <p className="text-gray-600">Core Number:</p>
//             <p className="font-medium">Core {coreNumber}</p>
//           </div>
//           <div>
//             <p className="text-gray-600">Tester:</p>
//             <p className="font-medium">{testerName}</p>
//           </div>
//           <div>
//             <p className="text-gray-600">Date:</p>
//             <p className="font-medium">{new Date().toLocaleDateString()}</p>
//           </div>
//         </div>
//       </Card>

//       {/* Protection Test Results Table */}
//       <Card className="p-6">
//         <h3 className="mb-4">Protection Test Results</h3>

//         <div className="overflow-x-auto">
//           <table className="w-full border-collapse border border-gray-300">
//             <thead>
//               <tr className="bg-gray-100">
//                 <th className="border border-gray-300 p-3 text-left text-sm" rowSpan={2}></th>
//                 <th className="border border-gray-300 p-3 text-left text-sm" rowSpan={2}>100%</th>
//                 <th colSpan={3} className="border border-gray-300 p-3 text-center text-sm">100 % Burden</th>
//                 <th className="border border-gray-300 p-3 text-left text-sm" rowSpan={2}>Protection Core No.</th>
//               </tr>
//               <tr className="bg-gray-100">
//                 <th className="border border-gray-300 p-3 text-sm">Secondary Limiting Vtg</th>
//                 <th className="border border-gray-300 p-3 text-sm">Excitation Current</th>
//                 <th className="border border-gray-300 p-3 text-sm">Composite Error</th>
//               </tr>
//             </thead>
//             <tbody>
//               {testData.map((row, index) => (
//                 <tr key={index}>
//                   <td className="border border-gray-300 p-3 bg-green-100 font-medium text-sm">
//                     Protection Core<br />Ratio- {row.ratio}
//                   </td>
//                   <td className="border border-gray-300 p-2">
//                     <Input
//                       className="h-8 text-sm"
//                       placeholder="100%"
//                       value={row.burden100}
//                       onChange={(e) => handleInputChange(index, 'burden100', e.target.value)}
//                     />
//                   </td>
//                   <td className="border border-gray-300 p-2">
//                     <Input
//                       className="h-8 text-sm"
//                       placeholder="Secondary Limiting Vtg"
//                       value={row.secondaryLimitingVtg}
//                       onChange={(e) => handleInputChange(index, 'secondaryLimitingVtg', e.target.value)}
//                     />
//                   </td>
//                   <td className="border border-gray-300 p-2">
//                     <Input
//                       className="h-8 text-sm"
//                       placeholder="Excitation Current"
//                       value={row.excitationCurrent}
//                       onChange={(e) => handleInputChange(index, 'excitationCurrent', e.target.value)}
//                     />
//                   </td>
//                   <td className="border border-gray-300 p-2">
//                     <Input
//                       className="h-8 text-sm"
//                       placeholder="Composite Error"
//                       value={row.compositeError}
//                       onChange={(e) => handleInputChange(index, 'compositeError', e.target.value)}
//                     />
//                   </td>
//                   <td className="border border-gray-300 p-3 bg-gray-50"></td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         <div className="mt-6 p-4 bg-green-50 rounded-lg">
//           <h4 className="mb-2">Test Notes</h4>
//           <textarea
//             className="w-full p-3 border border-gray-300 rounded-lg min-h-[100px] resize-y"
//             placeholder="Enter any observations, notes, or special conditions during protection testing..."
//           />
//         </div>

//         <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
//           <h4 className="mb-2">Important Guidelines</h4>
//           <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
//             <li>Ensure all connections are secure before applying test voltage</li>
//             <li>Verify burden values match specifications</li>
//             <li>Record excitation current at specified voltage levels</li>
//             <li>Calculate composite error and compare with acceptable limits</li>
//           </ul>
//         </div>
//       </Card>

//       {/* Actions */}
//       <div className="flex gap-3">
//         <Button onClick={handleSave} variant="outline" className="gap-2">
//           <Save className="w-4 h-4" />
//           Save Report
//         </Button>
//         <Button onClick={handleGenerate} className="bg-red-600 hover:bg-red-700 gap-2">
//           <Download className="w-4 h-4" />
//           Generate & Upload
//         </Button>
//       </div>
//     </div>
//   );
// }







import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ArrowLeft, Save, Download, Printer } from 'lucide-react';
import { Transformer } from './SecondaryTransformersList';
import { toast } from 'sonner';

interface SecondaryProtectionReportProps {
  transformer: Transformer;
  coreNumber: number;
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
}

export function SecondaryProtectionReport({
  transformer,
  coreNumber,
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

  // Initialize Data
  useEffect(() => {
    // 1. Determine Ratios
    const dynamicRatios = (transformer.ratios && transformer.ratios.length > 0)
      ? transformer.ratios
      : (transformer.orderId?.ratio || ['N/A']);

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
                  compositeError: safeStr(saved.compositeError)
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
  const parseRatedCurrent = (ratio: string): number => {
    if (!ratio) return 1;
    // Extract number immediately after the first forward slash
    // Works for "1000/5", "1000/5A", "1000/5/1-1-1A"
    const parts = ratio.split('/');
    if (parts.length >= 2) {
      const val = parseFloat(parts[1]);
      // Return 1 if NaN or 0 to avoid division by zero in formulas using iRated
      return (isNaN(val) || val === 0) ? 1 : val;
    }
    return 1;
  };

  const parseBurden = (burdenStr: string): number => {
    // Robust regex parsing: extract digits and dots only
    const val = parseFloat(burdenStr?.replace(/[^\d.]/g, '') || '0');
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
    row.ratioError100 && row.phaseError && row.resistance &&
    row.secondaryLimitingVoltage && row.excitationCurrent && row.compositeError && row.alf
  );


  return (
    <div className="space-y-6 p-4">
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

      <Card className={`p-0 border overflow-hidden ${isComplete ? 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'border-gray-400'}`}>
        {/* Main Title Header */}
        <div className={`border-b p-2 text-center ${isComplete ? 'bg-green-100 border-green-500' : 'bg-[#92d050] border-gray-400'}`}>
          <h2 className="text-sm font-bold uppercase">Pretest After Secondary Winding {isComplete && '(Completed)'}</h2>
        </div>

        {/* Advent Engineers Sub-Header */}
        <div className="flex justify-between items-center p-3 border-b border-gray-400">
          <div>
            <h3 className="text-red-600 font-bold uppercase italic text-lg leading-tight">Advent Engineers</h3>
            <p className="text-[10px] text-gray-500 font-medium tracking-tighter">TRANSFORMER TESTING REPORT</p>
          </div>
          <div className="text-right flex flex-col items-end">
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
                      Secondary<br/>Limiting Voltage
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
                        onChange={() => {}}
                        readOnly={true} // Strictly derived
                        disabled={readOnly} // Keeps styling consistent if whole form is readOnly
                      />
                    </td>
                    <td className="border border-gray-400 p-0">
                       <Input
                        className="border-none text-center h-8 bg-transparent text-blue-800 font-bold w-full bg-gray-50"
                        value={row.compositeError}
                        // onChange handler removed/ignored
                        onChange={() => {}}
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
      </Card>

      {/* Database Actions */}
      <div className="flex gap-3 no-print">
        {!readOnly && (
          <Button
            onClick={handleDatabaseSave}
            className="bg-red-600 hover:bg-red-700 gap-2"
          >
            <Save className="w-4 h-4" /> Save to Database
          </Button>
        )}
      </div>
    </div>
  );
}
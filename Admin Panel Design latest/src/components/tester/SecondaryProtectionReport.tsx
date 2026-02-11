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
}

interface ProtectionTestRow {
  ratio: string;
  burden100_1: string;
  burden100_2: string;
  resistance: string;
  alf: string; // User Input
  secondaryLimitingVtg: string; // Calculated
  excitationCurrent: string;
  compositeError: string; // Calculated
}

export function SecondaryProtectionReport({
  transformer,
  coreNumber,
  coreId,
  testerName,
  onBack,
  readOnly = false,
}: SecondaryProtectionReportProps) {

  // Parse VA from transformer rating (e.g., "30VA")
  const getVA = (ratingStr: string): number => {
      const match = ratingStr?.match(/(\d+(\.\d+)?)\s*VA/i);
      return match ? parseFloat(match[1]) : 0;
  };

  const vaRating = getVA(transformer.rating);

  // Use ratios from the transformer object, falling back to a default if empty
  const ratiosToUse = (transformer.ratios && transformer.ratios.length > 0)
    ? transformer.ratios
    : ['N/A'];

  const [testResults, setTestResults] = useState<ProtectionTestRow[]>(
    ratiosToUse.map(ratio => ({
      ratio,
      burden100_1: '',
      burden100_2: '',
      resistance: '',
      alf: '',
      secondaryLimitingVtg: '', 
      excitationCurrent: '',
      compositeError: '' 
    }))
  );

  const calculateDerivedValues = (row: ProtectionTestRow): { slv: string, compError: string } => {
      // SLV = ((VA / I^2) + R_ct) * ALF
      // Comp Error = (I_e / (I * ALF)) * 100
      
      const va = vaRating;
      const alf = parseFloat(row.alf);
      const r_ct = parseFloat(row.resistance);
      const i_e = parseFloat(row.excitationCurrent);
      
      // Derive I_rated from ratio (e.g., "200/1" -> 1)
      const parts = row.ratio.split('/');
      const i_rated = parts.length > 1 ? parseFloat(parts[1]) : 1; 

      if (isNaN(alf) || isNaN(r_ct) || isNaN(i_rated) || i_rated === 0) {
          return { slv: '', compError: '' };
      }

      // SLV Calc
      let slvVal = 0;
      if (i_rated > 0) {
          const term1 = va / (i_rated * i_rated);
          slvVal = (term1 + r_ct) * alf;
      }

      // Comp Error Calc
      // (I_e / (ALF * I_rated)) * 100
      let compErrVal = 0;
      if (!isNaN(i_e) && alf * i_rated !== 0) {
          compErrVal = (i_e / (alf * i_rated)) * 100;
      }

      return {
          slv: slvVal > 0 ? slvVal.toFixed(2) : '',
          compError: compErrVal > 0 ? compErrVal.toFixed(3) + '%' : ''
      };
  };

  const handleInputChange = (index: number, field: keyof ProtectionTestRow, value: string) => {
    if (readOnly) return;
    const updated = [...testResults];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-calculate 
    if (['alf', 'resistance', 'excitationCurrent'].includes(field)) {
        const { slv, compError } = calculateDerivedValues(updated[index]);
        updated[index].secondaryLimitingVtg = slv;
        updated[index].compositeError = compError;
    }

    setTestResults(updated);
  };

  // ✅ LOAD DATA EFFECT for Read Only viewing
  useEffect(() => {
    const fetchLatestData = async () => {
      try {
        const res = await axios.get(`http://localhost:3002/api/transformers/${transformer.uniqueId}`, { withCredentials: true });
        const freshTransformer = res.data;

        if (freshTransformer?.testHistory?.secondary_test?.protection_results?.length > 0) {
          const myResults = freshTransformer.testHistory.secondary_test.protection_results.filter((res: any) =>
            res.internalCoreNo === coreId || res.coreId === coreId
          );

          if (myResults.length > 0) {
            setTestResults(prev => prev.map(row => {
              const saved = myResults.find((r: any) => r.ratioValue === row.ratio);
              if (saved) {
                return {
                  ...row,
                  burden100_1: saved.burden100_1 || '',
                  burden100_2: saved.burden100_2 || '',
                  resistance: saved.resistance || '',
                  alf: saved.alf || '',
                  secondaryLimitingVtg: saved.secondaryLimitingVtg || '',
                  excitationCurrent: saved.excitationCurrent || '',
                  compositeError: saved.compositeError || ''
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
  }, [transformer.uniqueId, coreId]);

  const handleDatabaseSave = async () => {
    if (readOnly) return;
    try {
      const payload = {
        uniqueId: transformer.uniqueId,
        tester: testerName,
        coreId: coreId,
        protection_results: testResults.map(row => ({
          internalCoreNo: coreId,
          ratioValue: row.ratio,
          ...row
        }))
      };

      await axios.post('http://localhost:3002/api/secondary-protection-tests', payload, { withCredentials: true });
      toast.success("Protection Test Saved!");
    } catch (err: any) {
      toast.error("Failed to save: " + (err.response?.data?.message || err.message));
    }
  };


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

      <Card className="p-0 border border-gray-400 overflow-hidden">
        {/* Main Title Header */}
        <div className="bg-[#92d050] border-b border-gray-400 p-2 text-center">
          <h2 className="text-sm font-bold uppercase">Pretest After Secondary Winding</h2>
        </div>

        {/* Advent Engineers Sub-Header */}
        <div className="flex justify-between items-center p-3 border-b border-gray-400">
          <div>
            <h3 className="text-red-600 font-bold uppercase italic text-lg leading-tight">Advent Engineers</h3>
            <p className="text-[10px] text-gray-500 font-medium tracking-tighter">TRANSFORMER TESTING REPORT</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="flex items-center gap-1 text-xs">
              <span className="font-bold">protection core no.</span>
              <span className="border-b border-gray-600 px-4 min-w-[80px] italic text-blue-700">{coreId}</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 uppercase">Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
             <thead>
              <tr className="bg-gray-50 text-[11px] border-b border-gray-400">
                  <th className="border border-gray-400 p-2 w-[140px]"></th>
                  <th className="border border-gray-400 p-2 w-[80px]"></th>
                  <th className="border border-gray-400 p-2 text-center font-semibold text-gray-600 w-[100px]"></th>
                  <th className="border border-gray-400 p-2 text-center font-semibold text-gray-600 w-[100px]"></th>
                  <th className="border border-gray-400 p-2 text-center font-semibold text-gray-600 w-[120px] text-right">protection core no.</th>
                  <th className="border border-gray-400 p-2 text-center font-bold text-blue-700 w-[80px] italic">{coreId}</th>
              </tr>
            </thead>
            
            <tbody>
              {testResults.map((row, index) => (
                <React.Fragment key={index}>
                  {/* Row 1: Ratio, 100%, Burden 1, Burden 2, Spacing */}
                  <tr key={`${index}-row1`}>
                    <td rowSpan={3} className="border border-gray-400 p-2 bg-white font-bold text-center align-middle">
                      <div className="flex flex-col items-center justify-center h-full">
                        <span>Protection Core</span>
                        <span>Ratio - {row.ratio}</span>
                      </div>
                    </td>

                    <td className="border border-gray-400 p-2 text-center font-medium text-gray-700 bg-white">
                        100 %
                    </td>

                    <td className="border border-gray-400 p-0">
                         <Input
                          className="border-none text-center h-8 bg-transparent text-blue-800 font-medium disabled:opacity-100 disabled:cursor-not-allowed"
                          value={row.burden100_1}
                          onChange={(e) => handleInputChange(index, 'burden100_1', e.target.value)}
                          placeholder=""
                          disabled={readOnly}
                        />
                    </td>
                    
                    <td className="border border-gray-400 p-0">
                         <Input
                          className="border-none text-center h-8 bg-transparent text-blue-800 font-medium disabled:opacity-100 disabled:cursor-not-allowed"
                          value={row.burden100_2}
                          onChange={(e) => handleInputChange(index, 'burden100_2', e.target.value)}
                          placeholder=""
                          disabled={readOnly}
                        />
                    </td>
                    
                    {/* Empty cells to stretch the row to match the 4-col result section grid if needed, or colspan */}
                    <td className="border border-gray-400 p-0 bg-white" colSpan={2}></td>
                  </tr>

                  {/* Row 2: Labels: Resistance, ALF, Excitation, SLV/Comp */}
                  <tr key={`${index}-row2`} className="bg-gray-50">
                    <td className="border border-gray-400 p-1 text-center font-medium text-[10px] text-gray-600">
                        Resistance
                    </td>
                    <td className="border border-gray-400 p-1 text-center font-medium text-[10px] text-gray-600">
                        ALF
                    </td>
                    <td className="border border-gray-400 p-1 text-center font-medium text-[10px] text-gray-600">
                        Excitation Current
                    </td>
                    <td className="border border-gray-400 p-1 text-center font-medium text-[10px] text-gray-600" colSpan={2}>
                        SLV / Comp. Error
                    </td>
                  </tr>

                  {/* Row 3: Values: Resistance, ALF, Excitation, Calculated */}
                  <tr key={`${index}-row3`}>
                    <td className="border border-gray-400 p-0">
                      <Input
                        className="border-none text-center h-8 bg-transparent text-blue-800 font-bold disabled:opacity-100 disabled:cursor-not-allowed"
                        value={row.resistance}
                        onChange={(e) => handleInputChange(index, 'resistance', e.target.value)}
                        placeholder="R_ct"
                        disabled={readOnly}
                      />
                    </td>

                    <td className="border border-gray-400 p-0">
                      <Input
                        className="border-none text-center h-8 bg-transparent text-blue-800 font-bold disabled:opacity-100 disabled:cursor-not-allowed"
                        value={row.alf}
                        onChange={(e) => handleInputChange(index, 'alf', e.target.value)}
                        placeholder="ALF"
                        disabled={readOnly}
                      />
                    </td>

                    <td className="border border-gray-400 p-0">
                      <Input
                        className="border-none text-center h-8 bg-transparent text-blue-800 font-bold disabled:opacity-100 disabled:cursor-not-allowed"
                        value={row.excitationCurrent}
                        onChange={(e) => handleInputChange(index, 'excitationCurrent', e.target.value)}
                        placeholder="I_e"
                        disabled={readOnly}
                      />
                    </td>

                    <td className="border border-gray-400 p-0 text-center font-bold text-gray-700 bg-gray-50" colSpan={2}>
                       <div className="flex items-center justify-around h-full w-full">
                           <span className="flex-1 border-r border-gray-300 h-8 flex items-center justify-center">
                               {row.secondaryLimitingVtg || '-'}
                           </span>
                           <span className="flex-1 h-8 flex items-center justify-center">
                               {row.compositeError || '-'}
                           </span>
                       </div>
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
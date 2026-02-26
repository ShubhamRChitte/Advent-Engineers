// import { useState } from 'react';
// import { Card } from '../ui/card';
// import { Button } from '../ui/button';
// import { Input } from '../ui/input';
// import { ArrowLeft, Save, Download, Printer } from 'lucide-react';
// import { Transformer } from './SecondaryTransformersList';
// import { exportSecondaryMeteringReport } from '../../utils/pdfExport';
// import { toast } from 'sonner';

// interface SecondaryMeteringReportProps {
//   transformer: Transformer;
//   coreNumber: number;
//   coreId: string;
//   testerName: string;
//   onBack: () => void;
// }

// interface TestRow {
//   meteringCore: string;
//   ratio: string;
//   burden100Ratio: string;
//   burden100Phase: string;
//   burden25Ratio: string;
//   burden25Phase: string;
// }

// export function SecondaryMeteringReport({
//   transformer,
//   coreNumber,
//   coreId,
//   testerName,
//   onBack,
// }: SecondaryMeteringReportProps) {
//   const [testData, setTestData] = useState<TestRow[]>([
//     { meteringCore: '120%', ratio: '', burden100Ratio: '-0.108', burden100Phase: '0.85', burden25Ratio: '0.0003', burden25Phase: '-2.41' },
//     { meteringCore: '100%', ratio: '', burden100Ratio: '-0.0838', burden100Phase: '-0.38', burden25Ratio: '-0.0012', burden25Phase: '-2.48' },
//     { meteringCore: '20%', ratio: '', burden100Ratio: '-0.105', burden100Phase: '-1.35', burden25Ratio: '-0.0044', burden25Phase: '-2.79' },
//     { meteringCore: '5%', ratio: '', burden100Ratio: '-0.121', burden100Phase: '-0.69', burden25Ratio: '0.0020', burden25Phase: '-4.85' },
//     { meteringCore: '1%', ratio: '', burden100Ratio: '-0.140', burden100Phase: '-5.48', burden25Ratio: '0.0016', burden25Phase: '-11.16' },
//   ]);

//   const [secondaryData, setSecondaryData] = useState<TestRow[]>([
//     { meteringCore: '120%', ratio: '', burden100Ratio: '-0.0124', burden100Phase: '-0.77', burden25Ratio: '0.0006', burden25Phase: '-1.06' },
//     { meteringCore: '100%', ratio: '', burden100Ratio: '-0.0120', burden100Phase: '-1.04', burden25Ratio: '0.0000', burden25Phase: '-1.00' },
//     { meteringCore: '20%', ratio: '', burden100Ratio: '-0.0152', burden100Phase: '-2.27', burden25Ratio: '0.0090', burden25Phase: '-3.82' },
//     { meteringCore: '5%', ratio: '', burden100Ratio: '-0.0111', burden100Phase: '-2.61', burden25Ratio: '0.0126', burden25Phase: '-3.60' },
//     { meteringCore: '1%', ratio: '', burden100Ratio: '-0.0206', burden100Phase: '-8.29', burden25Ratio: '0.0149', burden25Phase: '-8.48' },
//   ]);

//   const [thirdData, setThirdData] = useState<TestRow[]>([
//     { meteringCore: '120%', ratio: '', burden100Ratio: '', burden100Phase: '', burden25Ratio: '', burden25Phase: '' },
//     { meteringCore: '100%', ratio: '', burden100Ratio: '', burden100Phase: '', burden25Ratio: '', burden25Phase: '' },
//     { meteringCore: '20%', ratio: '', burden100Ratio: '', burden100Phase: '', burden25Ratio: '', burden25Phase: '' },
//     { meteringCore: '5%', ratio: '', burden100Ratio: '', burden100Phase: '', burden25Ratio: '', burden25Phase: '' },
//     { meteringCore: '1%', ratio: '', burden100Ratio: '', burden100Phase: '', burden25Ratio: '', burden25Phase: '' },
//   ]);

//   const handleSave = () => {
//     alert('Report saved successfully!');
//   };

//   const handleGenerate = () => {
//     const reportData = {
//       transformerId: transformer.uniqueId,
//       coreNumber,
//       coreId,
//       testerName,
//       rating: transformer.rating,
//       testData1: testData,
//       testData2: secondaryData,
//       testData3: thirdData,
//       ratio1: '200/1',
//       ratio2: '400/1',
//       ratio3: '800/1',
//     };

//     exportSecondaryMeteringReport(reportData);
//     toast.success('Metering report downloaded successfully!');
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
//         <h2>Metering Test Report</h2>
//         <p className="text-gray-500 mt-1">Secondary Testing - Metering Core Analysis</p>
//       </div>

//       {/* Report Header */}
//       <Card className="p-6">
//         <div className="text-center mb-6 pb-4 border-b border-gray-200">
//           <h3 className="text-red-600 mb-2">ADVENT ENGINEERS</h3>
//           <p className="text-sm text-gray-600">{transformer.rating}, METERING</p>
//         </div>

//         <div className="mb-4">
//           <p className="text-sm">
//             <strong>Metering core no:</strong> {coreId}
//           </p>
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

//       {/* Test Results Tables */}
//       <Card className="p-6">
//         <h3 className="mb-4">Test Results</h3>

//         {/* First Metering Core Table */}
//         <div className="mb-6">
//           <div className="overflow-x-auto">
//             <table className="w-full border-collapse border border-gray-300">
//               <thead>
//                 <tr className="bg-gray-100">
//                   <th rowSpan={2} className="border border-gray-300 p-2 text-left text-sm">Testing</th>
//                   <th rowSpan={2} className="border border-gray-300 p-2 text-left text-sm">%of primary current</th>
//                   <th colSpan={2} className="border border-gray-300 p-2 text-center text-sm">100 % Burden</th>
//                   <th colSpan={2} className="border border-gray-300 p-2 text-center text-sm">25 % Burden</th>
//                 </tr>
//                 <tr className="bg-gray-100">
//                   <th className="border border-gray-300 p-2 text-sm">Ratio Error(%)</th>
//                   <th className="border border-gray-300 p-2 text-sm">Phase Error(min)</th>
//                   <th className="border border-gray-300 p-2 text-sm">Ratio Error(%)</th>
//                   <th className="border border-gray-300 p-2 text-sm">Phase Error(min)</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 <tr>
//                   <td rowSpan={5} className="border border-gray-300 p-2 bg-yellow-100 font-medium text-sm">
//                     Metering core<br />Ratio- 200/1
//                   </td>
//                 </tr>
//                 {testData.map((row, index) => (
//                   <tr key={index}>
//                     <td className="border border-gray-300 p-2 text-sm">{row.meteringCore}</td>
//                     <td className="border border-gray-300 p-2 text-sm">{row.burden100Ratio}</td>
//                     <td className="border border-gray-300 p-2 text-sm">{row.burden100Phase}</td>
//                     <td className="border border-gray-300 p-2 text-sm">{row.burden25Ratio}</td>
//                     <td className="border border-gray-300 p-2 text-sm">{row.burden25Phase}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Second Metering Core Table */}
//         <div className="mb-6">
//           <div className="overflow-x-auto">
//             <table className="w-full border-collapse border border-gray-300">
//               <tbody>
//                 <tr>
//                   <td rowSpan={5} className="border border-gray-300 p-2 bg-yellow-100 font-medium text-sm">
//                     Metering core<br />Ratio- 400/1
//                   </td>
//                 </tr>
//                 {secondaryData.map((row, index) => (
//                   <tr key={index}>
//                     <td className="border border-gray-300 p-2 text-sm">{row.meteringCore}</td>
//                     <td className="border border-gray-300 p-2 text-sm">{row.burden100Ratio}</td>
//                     <td className="border border-gray-300 p-2 text-sm">{row.burden100Phase}</td>
//                     <td className="border border-gray-300 p-2 text-sm">{row.burden25Ratio}</td>
//                     <td className="border border-gray-300 p-2 text-sm">{row.burden25Phase}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Third Metering Core Table */}
//         <div className="mb-6">
//           <div className="overflow-x-auto">
//             <table className="w-full border-collapse border border-gray-300">
//               <tbody>
//                 <tr>
//                   <td rowSpan={5} className="border border-gray-300 p-2 bg-yellow-100 font-medium text-sm">
//                     Metering core<br />Ratio- 800/1
//                   </td>
//                 </tr>
//                 {thirdData.map((row, index) => (
//                   <tr key={index}>
//                     <td className="border border-gray-300 p-2 text-sm">{row.meteringCore}</td>
//                     <td className="border border-gray-300 p-2">
//                       <Input
//                         className="h-8 text-sm"
//                         value={row.burden100Ratio}
//                         onChange={(e) => {
//                           const newData = [...thirdData];
//                           newData[index].burden100Ratio = e.target.value;
//                           setThirdData(newData);
//                         }}
//                       />
//                     </td>
//                     <td className="border border-gray-300 p-2">
//                       <Input
//                         className="h-8 text-sm"
//                         value={row.burden100Phase}
//                         onChange={(e) => {
//                           const newData = [...thirdData];
//                           newData[index].burden100Phase = e.target.value;
//                           setThirdData(newData);
//                         }}
//                       />
//                     </td>
//                     <td className="border border-gray-300 p-2">
//                       <Input
//                         className="h-8 text-sm"
//                         value={row.burden25Ratio}
//                         onChange={(e) => {
//                           const newData = [...thirdData];
//                           newData[index].burden25Ratio = e.target.value;
//                           setThirdData(newData);
//                         }}
//                       />
//                     </td>
//                     <td className="border border-gray-300 p-2">
//                       <Input
//                         className="h-8 text-sm"
//                         value={row.burden25Phase}
//                         onChange={(e) => {
//                           const newData = [...thirdData];
//                           newData[index].burden25Phase = e.target.value;
//                           setThirdData(newData);
//                         }}
//                       />
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
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







import axios from "axios";
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Printer, ArrowLeft, Save } from 'lucide-react';
import { Transformer } from './SecondaryTransformersList';
import { toast } from 'sonner';

interface SecondaryMeteringReportProps {
  transformer: Transformer;
  coreNumber: number;
  coreId: string;
  testerName: string;
  onBack: () => void;
  readOnly?: boolean;
  stage?: 'secondary' | 'primary' | 'final';
}

export function SecondaryMeteringReport({
  transformer,
  coreNumber,
  coreId,
  testerName,
  onBack,
  readOnly = false,
  stage = 'secondary',
}: SecondaryMeteringReportProps) {

  // Determine ratios from transformer (passed from props)
  // Fallback to Order's hardcoded ratios if for some reason missing, but Transformer interface now has it.
  const dynamicRatios = transformer.ratios && transformer.ratios.length > 0
    ? transformer.ratios
    : (transformer.orderId?.ratio || ['200/1']);

  // State management: Map Ratio -> Array of Rows
  const [dataByRatio, setDataByRatio] = useState<{ [ratio: string]: any[] }>(() => {
    // 1️⃣ Initialize with Defaults first
    const initial: { [ratio: string]: any[] } = {};
    dynamicRatios.forEach(ratio => {
      initial[ratio] = getInitialData('', '', '', '');
    });

    // 2️⃣ Attempt to sync with prop if it has history (Fast Load)
    // For ReadOnly, we rely heavily on props or fetched data
    // If transformer.testHistory exists, use it immediately
    const stageKey = `${stage}_test`;
    if (transformer.testHistory?.[stageKey]?.metering_results?.length > 0) {
      const myResults = transformer.testHistory[stageKey].metering_results.filter((res: any) =>
        res.internalCoreNo === coreId || res.coreId === coreId
      );

      myResults.forEach((block: any) => {
        if (initial[block.ratioValue]) {
          initial[block.ratioValue] = block.rows;
        }
      });
    }

    return initial;
  });

  // ✅ LOAD DATA EFFECT
  // Fetches latest data from DB to ensure we aren't overwriting with stale props
  // SKIP if readOnly is true and we trust the passed transformer object, 
  // BUT fetching fresh data is always safer unless we want to avoid calls. 
  // Let's keep fetching for consistency, but if readOnly, capturing state ensures we view saved data.
  useEffect(() => {
    const fetchLatestData = async () => {
      try {
        const res = await axios.get(`http://localhost:3002/api/transformers/${transformer.uniqueId}`, { withCredentials: true });
        const freshTransformer = res.data;

        // Dynamic path: testHistory.secondary_test or testHistory.primary_test
        const stageKey = `${stage}_test` as keyof typeof freshTransformer.testHistory;
        const stageHistory = freshTransformer?.testHistory?.[stageKey];

        if (stageHistory?.metering_results?.length > 0) {
          console.log(`Found saved metering results for ${stage}, loading...`, stageHistory.metering_results);

          // Filter results for THIS specific core ID to avoid loading data from other cores
          const myResults = stageHistory.metering_results.filter((res: any) =>
            res.internalCoreNo === coreId || res.coreId === coreId
          );

          setDataByRatio(prev => {
            const newState = { ...prev };
            myResults.forEach((block: any) => {
              // Upsert the row data.
              // 1. Exact Match
              if (block.ratioValue && newState[block.ratioValue]) {
                newState[block.ratioValue] = block.rows;
              }
              // 2. Fallback for "N/A" ratio if we only have one expected ratio
              else if ((!block.ratioValue || block.ratioValue === 'N/A') && dynamicRatios.length === 1) {
                newState[dynamicRatios[0]] = block.rows;
              }
            });
            return newState;
          });
        }
      } catch (err) {
        console.error("Failed to load existing test data", err);
        // Non-blocking, just log
      }
    };

    fetchLatestData();
  }, [transformer.uniqueId, coreId]);

  // Helper to update a specific row in a specific ratio table
  const updateTableData = (ratio: string, index: number, field: string, value: string) => {
    if (readOnly) return; // Block updates
    setDataByRatio(prev => {
      const currentRows = [...prev[ratio]];
      currentRows[index] = { ...currentRows[index], [field]: value };
      return { ...prev, [ratio]: currentRows };
    });
  };

  // ✅ 2️⃣ Convert State → Schema Format
  const buildMeteringResults = () => {
    return dynamicRatios.map(ratio => ({
      internalCoreNo: coreId, // Inject Core ID for persistence
      ratioValue: ratio,
      rows: dataByRatio[ratio] || []
    }));
  };

  const handleDatabaseSave = async () => {
    if (readOnly) return;
    console.log("handleDatabaseSave: STARTED");
    try {
      const meteringResults = buildMeteringResults();
      console.log("handleDatabaseSave: meteringResults built", meteringResults);

      const payload = {
        uniqueId: transformer.uniqueId,
        loginType: `${stage}_login`,
        tester: testerName, // Use dynamic tester name from props
        coreId: coreId,
        metering_results: meteringResults
      };

      console.log("handleDatabaseSave: Payload ready", payload);

      const endpoint = `http://localhost:3002/transformer-${stage}-metering-tests`;
      console.log(`handleDatabaseSave: Posting to ${endpoint}`);

      const response = await axios.post(
        endpoint,
        payload,
        { withCredentials: true }
      );

      console.log("handleDatabaseSave: Response received", response);
      toast.success("Data saved successfully!");
    } catch (error) {
      console.error("handleDatabaseSave: ERROR CAUGHT", error);
      toast.error("Failed to save data.");
    }
  };


  // Check Completion
  const isComplete = dynamicRatios.length > 0 && dynamicRatios.every(ratio => {
    const rows = dataByRatio[ratio];
    if (!rows) return false;
    return rows.every((row: any) => row.r100 && row.p100 && row.r25 && row.p25);
  });

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
      <div className="flex items-center justify-between no-print">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex gap-2">
          {!readOnly && (
            <Button variant="outline" size="sm" onClick={handleDatabaseSave} className="gap-2">
              <Save className="w-4 h-4" /> Save
            </Button>
          )}
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
          <div className="header-right">
            <div className="header-field">
              <span className="field-label">Date :</span>
              <span className="field-value">{new Date().toLocaleDateString('en-GB')}</span>
            </div>
            <div className="header-field">
              <span className="field-label">Order No :</span>
              <span className="field-value">{transformer.uniqueId}</span>
            </div>
            <div className="header-field">
              <span className="field-label">Client :</span>
              <span className="field-value">N/A</span>
            </div>
            <div className="header-field">
              <span className="field-label">Unit No :</span>
              <span className="field-value">{transformer.uniqueId}</span>
            </div>
          </div>
        </div>

        {/* Banners */}
        <div className="report-title-banner">
          METERING CORE TEST REPORT
        </div>
        <div className="description-banner">
          Accuracy Verification - {coreId}
        </div>

        <div className="mt-4">
          <div className="space-y-10">
            {dynamicRatios.map((ratio) => (
              <MeteringTable
                key={ratio}
                ratio={ratio}
                rows={dataByRatio[ratio]}
                onUpdate={(idx, field, val) => updateTableData(ratio, idx, field, val)}
                readOnly={readOnly}
              />
            ))}
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
      </div>
    </div>
  );
}

function MeteringTable({ ratio, rows, onUpdate, readOnly }: { ratio: string, rows: any[], onUpdate: (idx: number, f: string, v: string) => void, readOnly?: boolean }) {
  if (!rows) return null;

  return (
    <div className="overflow-x-auto">
      <table className="nested-table">
        <thead>
          <tr className="bg-yellow">
            <th className="w-32" rowSpan={2}>Testing</th>
            <th rowSpan={2}>% Current</th>
            <th className="text-center" colSpan={2}>100% Burden</th>
            <th className="text-center" colSpan={2}>25% Burden</th>
          </tr>
          <tr className="bg-yellow">
            <th className="text-[10px]">Ratio Error</th>
            <th className="text-[10px]">Phase Error</th>
            <th className="text-[10px]">Ratio Error</th>
            <th className="text-[10px]">Phase Error</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td rowSpan={6} className="bg-yellow font-bold text-center">
              Metering {ratio}
            </td>
          </tr>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td className="text-center bg-gray-50">{row.current}</td>
              <td>
                <Input
                  className="h-7 text-xs text-center border-none shadow-none focus-visible:ring-1 disabled:opacity-100 disabled:cursor-not-allowed"
                  value={row.r100}
                  onChange={(e) => onUpdate(idx, 'r100', e.target.value)}
                  disabled={readOnly}
                />
              </td>
              <td>
                <Input
                  className="h-7 text-xs text-center border-none shadow-none disabled:opacity-100 disabled:cursor-not-allowed"
                  value={row.p100}
                  onChange={(e) => onUpdate(idx, 'p100', e.target.value)}
                  disabled={readOnly}
                />
              </td>
              <td>
                <Input
                  className="h-7 text-xs text-center border-none shadow-none disabled:opacity-100 disabled:cursor-not-allowed"
                  value={row.r25}
                  onChange={(e) => onUpdate(idx, 'r25', e.target.value)}
                  disabled={readOnly}
                />
              </td>
              <td>
                <Input
                  className="h-7 text-xs text-center border-none shadow-none disabled:opacity-100 disabled:cursor-not-allowed"
                  value={row.p25}
                  onChange={(e) => onUpdate(idx, 'p25', e.target.value)}
                  disabled={readOnly}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getInitialData(r100: string, p100: string, r25: string, p25: string) {
  return [
    { current: '120%', r100, p100, r25, p25 },
    { current: '100%', r100, p100, r25, p25 },
    { current: '20%', r100, p100, r25, p25 },
    { current: '5%', r100, p100, r25, p25 },
    { current: '1%', r100, p100, r25, p25 },
  ];
}

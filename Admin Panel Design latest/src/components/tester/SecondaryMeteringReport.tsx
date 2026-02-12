// import { useState } from 'react';
// import { Card } from '../ui/card';
// import { Button } from '../ui/button';
// import { Input } from '../ui/input';
// import { ArrowLeft, Save, Download, Printer } from 'lucide-react';
// import { Transformer } from './SecondaryTransformersList';
// import { exportSecondaryMeteringReport } from '../../utils/pdfExport';
// import { toast } from 'sonner@2.0.3';

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
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Printer, Download, ArrowLeft, Save } from 'lucide-react';
import { Transformer } from './SecondaryTransformersList';
import { toast } from 'sonner';

interface SecondaryMeteringReportProps {
  transformer: Transformer;
  coreNumber: number;
  coreId: string;
  testerName: string;
  onBack: () => void;
  readOnly?: boolean;
<<<<<<< HEAD
=======
  stage?: 'secondary' | 'primary' | 'final';
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
}

export function SecondaryMeteringReport({
  transformer,
  coreNumber,
  coreId,
  testerName,
  onBack,
  readOnly = false,
<<<<<<< HEAD
=======
  stage = 'secondary',
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
}: SecondaryMeteringReportProps) {

  // Determine ratios from transformer (passed from props)
  // Fallback to Order's hardcoded ratios if for some reason missing, but Transformer interface now has it.
<<<<<<< HEAD
  const dynamicRatios = transformer.ratios && transformer.ratios.length > 0 ? transformer.ratios : ['200/1'];
=======
  const dynamicRatios = transformer.ratios && transformer.ratios.length > 0
    ? transformer.ratios
    : (transformer.orderId?.ratio || ['200/1']);
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1

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
<<<<<<< HEAD
    if (transformer.testHistory?.secondary_test?.metering_results?.length > 0) {
      const myResults = transformer.testHistory.secondary_test.metering_results.filter((res: any) =>
=======
    const stageKey = `${stage}_test`;
    if (transformer.testHistory?.[stageKey]?.metering_results?.length > 0) {
      const myResults = transformer.testHistory[stageKey].metering_results.filter((res: any) =>
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
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

<<<<<<< HEAD
        if (freshTransformer?.testHistory?.secondary_test?.metering_results?.length > 0) {
          console.log("Found saved metering results, loading...", freshTransformer.testHistory.secondary_test.metering_results);

          // Filter results for THIS specific core ID to avoid loading data from other cores
          const myResults = freshTransformer.testHistory.secondary_test.metering_results.filter((res: any) =>
=======
        // Dynamic path: testHistory.secondary_test or testHistory.primary_test
        const stageKey = `${stage}_test` as keyof typeof freshTransformer.testHistory;
        const stageHistory = freshTransformer?.testHistory?.[stageKey];

        if (stageHistory?.metering_results?.length > 0) {
          console.log(`Found saved metering results for ${stage}, loading...`, stageHistory.metering_results);

          // Filter results for THIS specific core ID to avoid loading data from other cores
          const myResults = stageHistory.metering_results.filter((res: any) =>
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
            res.internalCoreNo === coreId || res.coreId === coreId
          );

          setDataByRatio(prev => {
            const newState = { ...prev };
            myResults.forEach((block: any) => {
<<<<<<< HEAD
              // Only update if we have this ratio in our current config
              if (newState[block.ratioValue]) {
                newState[block.ratioValue] = block.rows;
              }
=======
              // Upsert the row data.
              // 1. Exact Match
              if (block.ratioValue && newState[block.ratioValue]) {
                newState[block.ratioValue] = block.rows;
              }
              // 2. Fallback for "N/A" ratio if we only have one expected ratio
              else if ((!block.ratioValue || block.ratioValue === 'N/A') && dynamicRatios.length === 1) {
                newState[dynamicRatios[0]] = block.rows;
              }
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
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
<<<<<<< HEAD
        loginType: "secondary_login",
=======
        loginType: `${stage}_login`,
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
        tester: testerName, // Use dynamic tester name from props
        coreId: coreId,
        metering_results: meteringResults
      };

      console.log("handleDatabaseSave: Payload ready", payload);

<<<<<<< HEAD
      const response = await axios.post(
        "http://localhost:3002/api/secondary-metering-tests",
=======
      const endpoint = `http://localhost:3002/transformer-${stage}-metering-tests`;
      console.log(`handleDatabaseSave: Posting to ${endpoint}`);

      const response = await axios.post(
        endpoint,
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
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

<<<<<<< HEAD
=======

  // Check Completion
  const isComplete = dynamicRatios.length > 0 && dynamicRatios.every(ratio => {
    const rows = dataByRatio[ratio];
    if (!rows) return false;
    return rows.every((row: any) => row.r100 && row.p100 && row.r25 && row.p25);
  });

>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between no-print">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex gap-2">
          {!readOnly && (
            <Button variant="secondary" size="sm" onClick={handleDatabaseSave} className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md hover:bg-green-600 hover:text-white">
              <Save className="w-4 h-4" /> Save to Database
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
      </div>

<<<<<<< HEAD
      <Card className="p-6">

        <div className="text-center mb-6 pb-4 border-b border-gray-200">
          <h3 className="text-red-600 font-bold text-xl uppercase">Advent Engineers</h3>
=======
      <Card className={`p-6 border overflow-hidden ${isComplete ? 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'border-gray-200'}`}>

        <div className={`text-center mb-6 pb-4 border-b ${isComplete ? 'bg-green-50/50 border-green-200 rounded-t-lg' : 'border-gray-200'}`}>
          <h3 className="text-red-600 font-bold text-xl uppercase">Advent Engineers {isComplete && <span className="text-green-600 ml-2 text-sm">(Completed)</span>}</h3>
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
          <p className="text-sm font-semibold">METERING CORE REPORT - {dynamicRatios.join(' / ')}</p>
        </div>

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
      </Card>
    </div>
  );
}

// Editable Table Component
function MeteringTable({ ratio, rows, onUpdate, readOnly }: { ratio: string, rows: any[], onUpdate: (idx: number, f: string, v: string) => void, readOnly?: boolean }) {
  if (!rows) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-400 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="border border-gray-400 p-2 w-32" rowSpan={2}>Testing</th>
            <th className="border border-gray-400 p-2" rowSpan={2}>% Current</th>
            <th className="border border-gray-400 p-2 text-center" colSpan={2}>100% Burden</th>
            <th className="border border-gray-400 p-2 text-center" colSpan={2}>25% Burden</th>
          </tr>
          <tr>
            <th className="border border-gray-400 p-1 text-[10px]">Ratio Error</th>
            <th className="border border-gray-400 p-1 text-[10px]">Phase Error</th>
            <th className="border border-gray-400 p-1 text-[10px]">Ratio Error</th>
            <th className="border border-gray-400 p-1 text-[10px]">Phase Error</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td rowSpan={6} className="border border-gray-400 p-2 bg-yellow-50 font-bold text-center">
              Metering {ratio}
            </td>
          </tr>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td className="border border-gray-400 p-2 text-center bg-gray-50">{row.current}</td>
              <td className="border border-gray-400 p-1">
                <Input
                  className="h-7 text-xs text-center border-none shadow-none focus-visible:ring-1 disabled:opacity-100 disabled:cursor-not-allowed"
                  value={row.r100}
                  onChange={(e) => onUpdate(idx, 'r100', e.target.value)}
                  disabled={readOnly}
                />
              </td>
              <td className="border border-gray-400 p-1">
                <Input
                  className="h-7 text-xs text-center border-none shadow-none disabled:opacity-100 disabled:cursor-not-allowed"
                  value={row.p100}
                  onChange={(e) => onUpdate(idx, 'p100', e.target.value)}
                  disabled={readOnly}
                />
              </td>
              <td className="border border-gray-400 p-1">
                <Input
                  className="h-7 text-xs text-center border-none shadow-none disabled:opacity-100 disabled:cursor-not-allowed"
                  value={row.r25}
                  onChange={(e) => onUpdate(idx, 'r25', e.target.value)}
                  disabled={readOnly}
                />
              </td>
              <td className="border border-gray-400 p-1">
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
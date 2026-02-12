<<<<<<< HEAD
// import { useState } from 'react';
// import { Card } from '../ui/card';
// import { Button } from '../ui/button';
// import { Input } from '../ui/input';
// import { ArrowLeft, Save, Download, Printer } from 'lucide-react';
// import { FinalTransformer } from './FinalTransformersList';

// interface MeteringRow {
//   percent: string;
//   ratioError100: string;
//   phaseError100: string;
//   ratioError25: string;
//   phaseError25: string;
// }

// interface CoreConfig {
//   coreNumber: number;
//   coreType: 'metering' | 'ps' | 'protection';
//   coreId: string;
// }

// interface FinalMeteringReportProps {
//   transformer: FinalTransformer;
//   core: CoreConfig;
//   testerName: string;
//   onBack: () => void;
// }

// export function FinalMeteringReport({
//   transformer,
//   core,
//   testerName,
//   onBack,
// }: FinalMeteringReportProps) {
//   const testDate = new Date().toLocaleDateString();

//   const meteringPercentages = ['120%', '100%', '20%', '5%', '1%'];

//   const [meteringData, setMeteringData] = useState<MeteringRow[]>(
//     meteringPercentages.map(percent => ({
//       percent,
//       ratioError100: '',
//       phaseError100: '',
//       ratioError25: '',
//       phaseError25: '',
//     }))
//   );

//   const [bdvOfOil, setBdvOfOil] = useState('');

//   const handleSave = () => {
//     alert('Final Metering Test Report saved successfully!');
//   };

//   const handleGenerate = () => {
//     alert('Report generated and ready for download!');
//   };

//   const handlePrint = () => {
//     window.print();
//   };

//   const getRatioForCore = () => {
//     const ratios = transformer.rating.split('/')[0].split('-');
//     if (core.coreNumber <= ratios.length) {
//       return ratios[core.coreNumber - 1];
//     }
//     return '200';
//   };

//   const ratio = getRatioForCore();

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
//         <h2>Final Test - Metering Core</h2>
//         <p className="text-gray-500 mt-1">Core {core.coreNumber} - {core.coreId}</p>
//       </div>

//       {/* Main Report Card */}
//       <Card className="p-6">
//         {/* Report Header */}
//         <div className="text-center mb-6 pb-4 border-b-2 border-gray-800">
//           <h3 className="text-red-600 mb-2">TESTING RECORD OF CURRENT TRANSFORMER</h3>
//           <p className="text-sm">Final Test - Metering Core</p>
//         </div>

//         {/* Specification Section */}
//         <div className="mb-6 border border-gray-300">
//           <table className="w-full">
//             <thead>
//               <tr className="bg-orange-200 border-b border-gray-800">
//                 <th className="text-left p-2 text-sm border-r border-gray-300">Specification</th>
//                 <th className="text-left p-2 text-sm border-r border-gray-300">Details</th>
//                 <th className="text-left p-2 text-sm">Core Information</th>
//               </tr>
//             </thead>
//             <tbody>
//               <tr className="border-b border-gray-300">
//                 <td className="p-2 text-sm border-r border-gray-300">Transformer Name</td>
//                 <td className="p-2 text-sm border-r border-gray-300">{transformer.name}</td>
//                 <td className="p-2 text-sm">Core Number: {core.coreNumber}</td>
//               </tr>
//               <tr className="border-b border-gray-300">
//                 <td className="p-2 text-sm border-r border-gray-300">Rating</td>
//                 <td className="p-2 text-sm border-r border-gray-300">{transformer.rating}</td>
//                 <td className="p-2 text-sm">Core ID: {core.coreId}</td>
//               </tr>
//               <tr className="border-b border-gray-300">
//                 <td className="p-2 text-sm border-r border-gray-300">Voltage Class</td>
//                 <td className="p-2 text-sm border-r border-gray-300">{transformer.voltageClass}</td>
//                 <td className="p-2 text-sm">Type: Metering</td>
//               </tr>
//               <tr>
//                 <td className="p-2 text-sm border-r border-gray-300">Unique ID</td>
//                 <td className="p-2 text-sm border-r border-gray-300">{transformer.uniqueId}</td>
//                 <td className="p-2 text-sm">Date: {testDate}</td>
//               </tr>
//             </tbody>
//           </table>
//         </div>

//         {/* Final Testing Header */}
//         <div className="bg-green-400 border border-gray-800 p-2 flex justify-between items-center mb-4">
//           <span className="font-medium">Final Testing - Metering Core</span>
//           <span>Core: {core.coreId}</span>
//         </div>

//         {/* Metering Core Test Table */}
//         <div className="mb-6">
//           <div className="overflow-x-auto">
//             <table className="w-full border-collapse border border-gray-300">
//               <thead>
//                 <tr className="bg-gray-100">
//                   <th rowSpan={2} className="border border-gray-300 p-2 text-sm">%of primary current</th>
//                   <th colSpan={2} className="border border-gray-300 p-2 text-sm">100 % Burden</th>
//                   <th colSpan={2} className="border border-gray-300 p-2 text-sm">25% Burden</th>
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
//                   <td rowSpan={6} className="border border-gray-300 p-2 bg-yellow-100 font-medium text-sm align-middle">
//                     Metering<br />Core Ratio<br />{ratio}/1
//                   </td>
//                 </tr>
//                 {meteringData.map((row, idx) => (
//                   <tr key={idx}>
//                     <td className="border border-gray-300 p-2 text-sm">{row.percent}</td>
//                     <td className="border border-gray-300 p-2">
//                       <Input
//                         className="h-8 text-sm"
//                         value={row.ratioError100}
//                         onChange={(e) => {
//                           const newData = [...meteringData];
//                           newData[idx].ratioError100 = e.target.value;
//                           setMeteringData(newData);
//                         }}
//                       />
//                     </td>
//                     <td className="border border-gray-300 p-2">
//                       <Input
//                         className="h-8 text-sm"
//                         value={row.phaseError100}
//                         onChange={(e) => {
//                           const newData = [...meteringData];
//                           newData[idx].phaseError100 = e.target.value;
//                           setMeteringData(newData);
//                         }}
//                       />
//                     </td>
//                     <td className="border border-gray-300 p-2">
//                       <Input
//                         className="h-8 text-sm"
//                         value={row.ratioError25}
//                         onChange={(e) => {
//                           const newData = [...meteringData];
//                           newData[idx].ratioError25 = e.target.value;
//                           setMeteringData(newData);
//                         }}
//                       />
//                     </td>
//                     <td className="border border-gray-300 p-2">
//                       <Input
//                         className="h-8 text-sm"
//                         value={row.phaseError25}
//                         onChange={(e) => {
//                           const newData = [...meteringData];
//                           newData[idx].phaseError25 = e.target.value;
//                           setMeteringData(newData);
//                         }}
//                       />
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Footer Section */}
//         <div className="border border-gray-300 mb-6">
//           <table className="w-full">
//             <tbody>
//               <tr>
//                 <td className="border-r border-gray-300 p-3 text-sm w-1/2">
//                   <strong>Tested By:</strong> {testerName}
//                 </td>
//                 <td className="p-3 text-sm">
//                   <strong>Signature:</strong>
//                 </td>
//               </tr>
//             </tbody>
//           </table>
//         </div>

//         {/* BDV of Oil */}
//         <div className="border border-gray-300 mb-6">
//           <table className="w-full">
//             <tbody>
//               <tr>
//                 <td className="p-3 text-sm bg-blue-100 border-r border-gray-300 w-1/4">
//                   <strong>BDV of Oil</strong>
//                 </td>
//                 <td className="p-3">
//                   <Input
//                     className="h-10"
//                     placeholder="Enter BDV value"
//                     value={bdvOfOil}
//                     onChange={(e) => setBdvOfOil(e.target.value)}
//                   />
//                 </td>
//               </tr>
//             </tbody>
//           </table>
//         </div>

//         {/* Core Info Display */}
//         <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg">
//           <h4 className="mb-2">Core Information:</h4>
//           <div className="grid grid-cols-2 gap-2 text-sm">
//             <div><span className="font-medium">Core Number:</span> {core.coreNumber}</div>
//             <div><span className="font-medium">Core ID:</span> <span className="text-blue-600">{core.coreId}</span></div>
//             <div><span className="font-medium">Core Type:</span> Metering</div>
//             <div><span className="font-medium">Ratio:</span> {ratio}/1</div>
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
import { FinalTransformer } from './FinalTransformersList';
import { toast } from 'sonner';

interface FinalMeteringReportProps {
  transformer: FinalTransformer;
  coreId: string;
=======
import React from 'react';
import { SecondaryMeteringReport } from './SecondaryMeteringReport';
// Import Transformer interface to assume compatibility (structural typing)
import { Transformer } from './SecondaryTransformersList';

interface FinalMeteringReportProps {
  transformer: any; // Using any for runtime compatibility with FinalTransformer/Transformer
  core: { coreNumber: number; coreId: string; };
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
  testerName: string;
  onBack: () => void;
}

export function FinalMeteringReport({
  transformer,
<<<<<<< HEAD
  coreId,
=======
  core,
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
  testerName,
  onBack,
}: FinalMeteringReportProps) {

<<<<<<< HEAD

  // Determine ratios from transformer (passed from props)
  // Fallback to Order's hardcoded ratios for robustness
  const dynamicRatios = transformer.ratios && transformer.ratios.length > 0
    ? transformer.ratios
    : (transformer.rating ? transformer.rating.split('/')[0].split('-').map(r => `${r}/1`) : ['200/1']);

  // State management: Map Ratio -> Array of Rows
  const [dataByRatio, setDataByRatio] = useState<{ [ratio: string]: any[] }>(() => {
    // 1️⃣ Initialize with Defaults first
    const initial: { [ratio: string]: any[] } = {};
    dynamicRatios.forEach(ratio => {
      initial[ratio] = getInitialData('', '', '', '');
    });

    // 2️⃣ Attempt to sync with prop if it has history (Fast Load)
    if (transformer.testHistory?.final_test?.metering_results?.length > 0) {
      transformer.testHistory.final_test.metering_results.forEach((block: any) => {
        if (initial[block.ratioValue]) {
          // If saved data exists for this ratio, use it
          // Ensure we filter for this specific coreId if the structure supports it, 
          // but usually the backend should have filtered or we filter below on load.
          // For initial state from props, we might blindly trust it if it's structured correctly.
          initial[block.ratioValue] = block.rows;
        }
      });
    }

    return initial;
  });

  // ✅ LOAD DATA EFFECT
  useEffect(() => {
    const fetchLatestData = async () => {
      try {
        const res = await axios.get(`http://localhost:3002/api/transformers/${transformer.uniqueId}`, { withCredentials: true });
        const freshTransformer = res.data;

        if (freshTransformer?.testHistory?.final_test?.metering_results?.length > 0) {
          console.log("Found saved final metering results, loading...", freshTransformer.testHistory.final_test.metering_results);

          // Filter for THIS specific core ID used in Final test
          // Note: Final test might not always save internalCoreNo in the same way, but let's assume it does or we match by context
          // If final_test results are flat, we might receive all cores. 
          // Let's filter by checking if the result block belongs to this coreId or if it's generic

          // Refined Filter: Match coreId if present in the result block
          const myResults = freshTransformer.testHistory.final_test.metering_results.filter((res: any) =>
            !res.coreId || res.coreId === coreId || res.internalCoreNo === coreId
          );

          if (myResults.length > 0) {
            setDataByRatio(prev => {
              const newState = { ...prev };
              myResults.forEach((block: any) => {
                if (newState[block.ratioValue]) {
                  newState[block.ratioValue] = block.rows;
                }
              });
              return newState;
            });
          }
        }
      } catch (err) {
        console.error("Failed to load existing test data", err);
      }
    };

    fetchLatestData();
  }, [transformer.uniqueId, coreId]);

  const updateTableData = (ratio: string, index: number, field: string, value: string) => {
    setDataByRatio(prev => {
      const currentRows = [...prev[ratio]];
      currentRows[index] = { ...currentRows[index], [field]: value };
      return { ...prev, [ratio]: currentRows };
    });
  };

  const buildMeteringResults = () => {
    return dynamicRatios.map(ratio => ({
      coreId: coreId,
      ratioValue: ratio,
      rows: dataByRatio[ratio] || []
    }));
  };

  const handleDatabaseSave = async () => {
    console.log("handleDatabaseSave: STARTED");
    try {
      const meteringResults = buildMeteringResults();
      console.log("handleDatabaseSave: meteringResults built", meteringResults);

      const payload = {
        uniqueId: transformer.uniqueId,
        loginType: "final_test_login",
        tester: testerName,
        coreId: coreId,
        metering_results: meteringResults
      };

      console.log("handleDatabaseSave: Payload ready to send:", payload);

      const response = await axios.post(
        "http://localhost:3002/transformer-final-metering-tests",
        payload,
        { withCredentials: true }
      );
      console.log("handleDatabaseSave: Response received", response);

      toast.success("Final Metering Test data saved successfully!");
    } catch (error) {
      console.error("handleDatabaseSave: ERROR CAUGHT", error);
      toast.error("Failed to save final data.");
    }
  };


  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between no-print">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleDatabaseSave} className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md hover:bg-green-600 hover:text-white">
            <Save className="w-4 h-4" /> Save to Database
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="text-center mb-6 pb-4 border-b border-gray-200">
          <h3 className="text-red-600 font-bold text-xl uppercase">Advent Engineers</h3>
          <p className="text-sm font-semibold">METERING CORE REPORT - {dynamicRatios.join(' / ')}</p>
        </div>

        <div className="space-y-10">
          {dynamicRatios.map((ratio) => (
            <MeteringTable
              key={ratio}
              ratio={ratio}
              rows={dataByRatio[ratio]}
              setRows={(newRows: any) => setDataByRatio(prev => ({ ...prev, [ratio]: newRows }))}
              // Wrapper to match previous signature if needed, or just pass direct updater
              onUpdate={(idx, field, val) => updateTableData(ratio, idx, field, val)}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

// Editable Table Component
function MeteringTable({ ratio, rows, setRows, onUpdate }: { ratio: string, rows: any[], setRows?: any, onUpdate?: (idx: number, f: string, v: string) => void }) {
  // Support both localized setRows (old style) and parent onUpdate (new style)
  const localUpdate = (index: number, field: string, value: string) => {
    if (onUpdate) {
      onUpdate(index, field, value);
    } else if (setRows) {
      const updatedRows = [...rows];
      updatedRows[index] = { ...updatedRows[index], [field]: value };
      setRows(updatedRows);
    }
  };

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
                <Input className="h-7 text-xs text-center border-none shadow-none focus-visible:ring-1"
                  value={row.r100} onChange={(e) => localUpdate(idx, 'r100', e.target.value)} />
              </td>
              <td className="border border-gray-400 p-1">
                <Input className="h-7 text-xs text-center border-none shadow-none"
                  value={row.p100} onChange={(e) => localUpdate(idx, 'p100', e.target.value)} />
              </td>
              <td className="border border-gray-400 p-1">
                <Input className="h-7 text-xs text-center border-none shadow-none"
                  value={row.r25} onChange={(e) => localUpdate(idx, 'r25', e.target.value)} />
              </td>
              <td className="border border-gray-400 p-1">
                <Input className="h-7 text-xs text-center border-none shadow-none"
                  value={row.p25} onChange={(e) => localUpdate(idx, 'p25', e.target.value)} />
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
=======
  return (
    <SecondaryMeteringReport
      transformer={transformer}
      coreNumber={core.coreNumber}
      coreId={core.coreId}
      testerName={testerName}
      onBack={onBack}
      stage="final"
    />
  );
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
}
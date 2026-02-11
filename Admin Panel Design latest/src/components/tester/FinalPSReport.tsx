// import { useState } from 'react';
// import { Card } from '../ui/card';
// import { Button } from '../ui/button';
// import { Input } from '../ui/input';
// import { ArrowLeft, Save, Download, Printer } from 'lucide-react';
// import { FinalTransformer } from './FinalTransformersList';

// interface CoreConfig {
//   coreNumber: number;
//   coreType: 'metering' | 'ps' | 'protection';
//   coreId: string;
// }

// interface FinalPSReportProps {
//   transformer: FinalTransformer;
//   core: CoreConfig;
//   testerName: string;
//   onBack: () => void;
// }

// export function FinalPSReport({
//   transformer,
//   core,
//   testerName,
//   onBack,
// }: FinalPSReportProps) {
//   const testDate = new Date().toLocaleDateString();

//   const [error100, setError100] = useState('');
//   const [resistance, setResistance] = useState('');
//   const [turnRatioError, setTurnRatioError] = useState('');
//   const [resistance2, setResistance2] = useState('');
//   const [iexAtVk, setIexAtVk] = useState('');
//   const [iexAt11Vk, setIexAt11Vk] = useState('');
//   const [bdvOfOil, setBdvOfOil] = useState('');

//   const handleSave = () => {
//     alert('Final PS Test Report saved successfully!');
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

//   const getVkValue = () => {
//     const ratioNum = parseInt(ratio);
//     if (ratioNum >= 800) return '1000V';
//     if (ratioNum >= 400) return '500V';
//     return '250V';
//   };

//   const vkValue = getVkValue();
//   const vk11Value = parseInt(vkValue) * 1.1 + 'V';

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
//         <h2>Final Test - PS Core</h2>
//         <p className="text-gray-500 mt-1">Core {core.coreNumber} - {core.coreId}</p>
//       </div>

//       {/* Main Report Card */}
//       <Card className="p-6">
//         {/* Report Header */}
//         <div className="text-center mb-6 pb-4 border-b-2 border-gray-800">
//           <h3 className="text-red-600 mb-2">TESTING RECORD OF CURRENT TRANSFORMER</h3>
//           <p className="text-sm">Final Test - PS Core</p>
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
//                 <td className="p-2 text-sm">Type: PS</td>
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
//           <span className="font-medium">Final Testing - PS Core</span>
//           <span>Core: {core.coreId}</span>
//         </div>

//         {/* PS Core Test Table */}
//         <div className="mb-6">
//           <div className="overflow-x-auto">
//             <table className="w-full border-collapse border border-gray-300">
//               <tbody>
//                 {/* Row 1 */}
//                 <tr>
//                   <td rowSpan={2} className="border border-gray-300 p-2 bg-yellow-100 font-medium text-sm align-middle">
//                     PS Core Ratio -<br />{ratio}/1
//                   </td>
//                   <td className="border border-gray-300 p-2 text-sm bg-pink-100">at 100%</td>
//                   <td className="border border-gray-300 p-2">
//                     <Input
//                       className="h-8 text-sm"
//                       placeholder="Error at 100%"
//                       value={error100}
//                       onChange={(e) => setError100(e.target.value)}
//                     />
//                   </td>
//                   <td className="border border-gray-300 p-2 text-sm">Resistance</td>
//                   <td className="border border-gray-300 p-2">
//                     <Input
//                       className="h-8 text-sm"
//                       placeholder="Resistance"
//                       value={resistance}
//                       onChange={(e) => setResistance(e.target.value)}
//                     />
//                   </td>
//                   <td className="border border-gray-300 p-2 text-sm bg-green-100">Vk: {vkValue}</td>
//                   <td className="border border-gray-300 p-2 text-sm">Iex at Vk</td>
//                   <td className="border border-gray-300 p-2">
//                     <Input
//                       className="h-8 text-sm"
//                       placeholder="Iex at Vk"
//                       value={iexAtVk}
//                       onChange={(e) => setIexAtVk(e.target.value)}
//                     />
//                   </td>
//                   <td className="border border-gray-300 p-2 text-sm">Iex at 1.1Vk</td>
//                   <td className="border border-gray-300 p-2">
//                     <Input
//                       className="h-8 text-sm"
//                       placeholder="Iex at 1.1Vk"
//                       value={iexAt11Vk}
//                       onChange={(e) => setIexAt11Vk(e.target.value)}
//                     />
//                   </td>
//                 </tr>
//                 {/* Row 2 */}
//                 <tr>
//                   <td className="border border-gray-300 p-2 text-sm bg-pink-100">Turn Ratio Error at 100%</td>
//                   <td className="border border-gray-300 p-2">
//                     <Input
//                       className="h-8 text-sm"
//                       placeholder="Turn Ratio Error"
//                       value={turnRatioError}
//                       onChange={(e) => setTurnRatioError(e.target.value)}
//                     />
//                   </td>
//                   <td className="border border-gray-300 p-2 text-sm">Resistance</td>
//                   <td className="border border-gray-300 p-2">
//                     <Input
//                       className="h-8 text-sm"
//                       placeholder="Resistance"
//                       value={resistance2}
//                       onChange={(e) => setResistance2(e.target.value)}
//                     />
//                   </td>
//                   <td className="border border-gray-300 p-2 text-sm bg-green-100">1.1 Vk: {vk11Value}</td>
//                   <td colSpan={3} className="border border-gray-300 p-2 bg-gray-50"></td>
//                 </tr>
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
//             <div><span className="font-medium">Core ID:</span> <span className="text-purple-600">{core.coreId}</span></div>
//             <div><span className="font-medium">Core Type:</span> PS (Protective System)</div>
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










import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ArrowLeft, Save, Download, Printer } from 'lucide-react';
import { toast } from 'sonner';

export function FinalPSReport({ transformer, coreId, testerName, onBack }: any) {
  // 1️⃣ Determine Ratios
  const dynamicRatios = transformer.ratios && transformer.ratios.length > 0
    ? transformer.ratios
    : (transformer.rating ? transformer.rating.split('/')[0].split('-').map((r: string) => `${r}/1`) : ['200/1']);

  // 2️⃣ Initialize State: One object per ratio
  const [psData, setPsData] = useState<any[]>(() => {
    // Default Empty State
    const initial = dynamicRatios.map((ratio: string) => ({
      ratioValue: ratio,
      turnRatioError: '',
      resistance: '',
      vk: '',
      vkVal: '',
      iexVk: '',
      iex11Vk: ''
    }));

    // Sync with Props if available (Fast Load)
    if (transformer.testHistory?.final_test?.ps_results?.length > 0) {
      // Create a map for easier lookup key = ratioValue
      const savedMap = new Map();
      transformer.testHistory.final_test.ps_results.forEach((res: any) => {
        // Filter by coreId roughly if possible
        if (!res.coreId || res.coreId === coreId || res.internalCoreNo === coreId) {
          savedMap.set(res.ratioValue, res);
        }
      });

      return initial.map((item: any) => {
        const saved = savedMap.get(item.ratioValue);
        return saved ? { ...item, ...saved } : item;
      });
    }

    return initial;
  });

  // 3️⃣ Fetch Fresh Data on Mount
  useEffect(() => {
    const fetchLatestData = async () => {
      try {
        const res = await axios.get(`http://localhost:3002/api/transformers/${transformer.uniqueId}`, { withCredentials: true });
        const freshTransformer = res.data;

        if (freshTransformer?.testHistory?.final_test?.ps_results?.length > 0) {
          console.log("Found saved final PS results, loading...");
          const savedMap = new Map();
          freshTransformer.testHistory.final_test.ps_results.forEach((res: any) => {
            if (!res.coreId || res.coreId === coreId || res.internalCoreNo === coreId) {
              savedMap.set(res.ratioValue, res);
            }
          });

          setPsData(prev => prev.map(item => {
            const saved = savedMap.get(item.ratioValue);
            return saved ? { ...item, ...saved } : item;
          }));
        }
      } catch (err) {
        console.error("Failed to fetch fresh PS data", err);
      }
    };
    fetchLatestData();
  }, [transformer.uniqueId, coreId]);


  const handleUpdate = (idx: number, field: string, val: string) => {
    const updated = [...psData];
    updated[idx] = { ...updated[idx], [field]: val };
    setPsData(updated);
  };

  const handleDatabaseSave = async () => {
    console.log("handleDatabaseSave (PS): STARTED");
    try {
      // 1. Prepare the payload based on PSBlockSchema
      const payload = {
        uniqueId: transformer.uniqueId,
        tester: testerName || 'shubham',
        coreId: coreId,
        ps_results: psData.map(row => ({
          coreId: coreId, // Ensure coreId is attached to result block
          ratioValue: row.ratioValue,
          turnRatioError: row.turnRatioError,
          resistance: row.resistance,
          vk: row.vk,
          vkVal: row.vkVal,
          iexVk: row.iexVk,
          iex11Vk: row.iex11Vk
        }))
      };

      console.log("handleDatabaseSave (PS): Payload ready", payload);

      // 2. Execute POST request
      const response = await axios.post(
        "http://localhost:3002/transformer-final-ps-tests",
        payload,
        { withCredentials: true }
      );

      console.log("handleDatabaseSave (PS): Response received", response);
      toast.success("Final PS Test results saved successfully!");

    } catch (error: any) {
      console.error("handleDatabaseSave (PS): ERROR", error);
      toast.error(error.response?.data?.message || "Failed to save PS data to database.");
    }
  };

  return (
    <div className="space-y-6 p-4 bg-white">
      <div className="flex items-center justify-between no-print">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
          <Printer className="w-4 h-4" /> Print
        </Button>
      </div>

      <Card className="p-0 border border-gray-400 overflow-hidden shadow-none rounded-none">
        <div className="bg-[#92d050] border-b border-gray-400 p-2 text-center">
          <h2 className="text-sm font-bold uppercase">Final Testing</h2>
        </div>

        <div className="flex justify-between items-center p-3 border-b border-gray-400">
          <div>
            <h3 className="text-red-600 font-bold uppercase italic text-xl">Advent Engineers</h3>
            <span className="text-[10px] font-bold text-gray-500 uppercase">PS Core Test Report</span>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase">PS Core No: <span className="border-b border-black px-2 text-blue-700 italic">{coreId}</span></p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-400 p-2 w-[160px]" rowSpan={2}>PS Core Ratio</th>
                <th className="border border-gray-400 p-2 w-[120px]" rowSpan={2}>Turn Ratio Error at 100%</th>
                <th className="border border-gray-400 p-2 w-[100px]" rowSpan={2}>Resistance (Ω)</th>
                <th className="border border-gray-400 p-2 text-center" colSpan={3}>Excitation Current Details</th>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-2 text-center">Vk / 1.1Vk (V)</th>
                <th className="border border-gray-400 p-2 text-center">lex at Vk</th>
                <th className="border border-gray-400 p-2 text-center">lex at 1.1Vk</th>
              </tr>
            </thead>
            <tbody>
              {psData.map((row, i) => (
                <React.Fragment key={i}>
                  <tr>
                    <td rowSpan={2} className="border border-gray-400 p-2 bg-[#ffff00] font-bold text-center align-middle">
                      PS Core Ratio - {row.ratioValue}
                    </td>
                    <td className="border border-gray-400 p-0" rowSpan={2}>
                      <Input className="border-none text-center h-16 shadow-none text-blue-800 font-bold"
                        value={row.turnRatioError} onChange={e => handleUpdate(i, 'turnRatioError', e.target.value)} />
                    </td>
                    <td className="border border-gray-400 p-0" rowSpan={2}>
                      <Input className="border-none text-center h-16 shadow-none text-blue-800 font-bold"
                        value={row.resistance} onChange={e => handleUpdate(i, 'resistance', e.target.value)} />
                    </td>
                    <td className="border border-gray-400 p-1 bg-white border-b-0 h-8 flex items-center">
                      <span className="font-bold text-[#0070c0]">Vk :</span>
                      <Input className="border-none text-[#0070c0] font-bold h-6 shadow-none flex-1"
                        value={row.vk} onChange={e => handleUpdate(i, 'vk', e.target.value)} />
                    </td>
                    <td className="border border-gray-400 p-0" rowSpan={2}>
                      <Input className="border-none text-center h-16 shadow-none text-blue-800 font-bold"
                        value={row.iexVk} onChange={e => handleUpdate(i, 'iexVk', e.target.value)} />
                    </td>
                    <td className="border border-gray-400 p-0" rowSpan={2}>
                      <Input className="border-none text-center h-16 shadow-none text-blue-800 font-bold"
                        value={row.iex11Vk} onChange={e => handleUpdate(i, 'iex11Vk', e.target.value)} />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-400">
                    <td className="border border-gray-400 p-1 bg-white h-8 flex items-center">
                      <span className="font-bold text-[#0070c0]">1.1Vk :</span>
                      <Input className="border-none text-[#0070c0] font-bold h-6 shadow-none flex-1"
                        value={row.vkVal} onChange={e => handleUpdate(i, 'vkVal', e.target.value)} />
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex gap-3 no-print pt-4">
        <Button onClick={handleDatabaseSave} variant="outline" className="gap-2">
          <Save className="w-4 h-4" /> Save to Database
        </Button>
      </div>
    </div>
  );
}
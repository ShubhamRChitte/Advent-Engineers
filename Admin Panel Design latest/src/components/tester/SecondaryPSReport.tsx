// import { useState } from 'react';
// import { Card } from '../ui/card';
// import { Button } from '../ui/button';
// import { Input } from '../ui/input';
// import { ArrowLeft, Save, Download, Printer } from 'lucide-react';
// import { Transformer } from './SecondaryTransformersList';
// import { exportSecondaryPSReport } from '../../utils/pdfExport';
// import { toast } from 'sonner@2.0.3';

// interface SecondaryPSReportProps {
//   transformer: Transformer;
//   coreNumber: number;
//   coreId: string;
//   testerName: string;
//   onBack: () => void;
// }

// interface PSTestRow {
//   ratio: string;
//   test1: string;
//   test2: string;
//   test3: string;
//   test4: string;
//   test5: string;
// }

// export function SecondaryPSReport({
//   transformer,
//   coreNumber,
//   coreId,
//   testerName,
//   onBack,
// }: SecondaryPSReportProps) {
//   const [testData, setTestData] = useState<PSTestRow[]>([
//     { ratio: '200/1', test1: 'Turn Ratio Error at 100%', test2: 'Resistance', test3: '', test4: '', test5: '' },
//     { ratio: '400/1', test1: 'Turn Ratio Error at 100%', test2: 'Resistance', test3: 'VA: 500v', test4: 'Isa at VA', test5: 'Isa at 1.1s' },
//     { ratio: '400/1', test1: '100%', test2: 'Resistance', test3: 'Resistance', test4: '13 VA : 550', test5: '' },
//   ]);

//   const handleInputChange = (rowIndex: number, field: keyof PSTestRow, value: string) => {
//     const newData = [...testData];
//     newData[rowIndex][field] = value;
//     setTestData(newData);
//   };

//   const handleSave = () => {
//     alert('PS Report saved successfully!');
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

//     exportSecondaryPSReport(reportData);
//     toast.success('PS report downloaded successfully!');
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
//         <h2>PS Test Report</h2>
//         <p className="text-gray-500 mt-1">Secondary Testing - PS (Potential/Current Transformer)</p>
//       </div>

//       {/* Report Header */}
//       <Card className="p-6">
//         <div className="text-center mb-6 pb-4 border-b border-gray-200">
//           <h3 className="text-red-600 mb-2">ADVENT ENGINEERS</h3>
//           <p className="text-sm text-gray-600">{transformer.rating}, PS</p>
//         </div>

//         <div className="mb-4">
//           <p className="text-sm">
//             <strong>PS Core no:</strong> {coreId}
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

//       {/* PS Test Results Table */}
//       <Card className="p-6">
//         <h3 className="mb-4">PS Test Results</h3>

//         <div className="overflow-x-auto">
//           <table className="w-full border-collapse border border-gray-300">
//             <thead>
//               <tr className="bg-gray-100">
//                 <th className="border border-gray-300 p-3 text-left text-sm">PS Core Ratio</th>
//                 <th className="border border-gray-300 p-3 text-left text-sm">Turn Ratio Error at 100%</th>
//                 <th className="border border-gray-300 p-3 text-left text-sm">Resistance</th>
//                 <th className="border border-gray-300 p-3 text-left text-sm">Resistance</th>
//                 <th className="border border-gray-300 p-3 text-left text-sm">VA: 500v</th>
//                 <th className="border border-gray-300 p-3 text-left text-sm">Isa at VA</th>
//                 <th className="border border-gray-300 p-3 text-left text-sm">Isa at 1.1s</th>
//               </tr>
//             </thead>
//             <tbody>
//               <tr>
//                 <td rowSpan={1} className="border border-gray-300 p-3 bg-purple-100 font-medium text-sm">
//                   200/1
//                 </td>
//                 <td className="border border-gray-300 p-2">
//                   <Input
//                     className="h-8 text-sm"
//                     placeholder="Turn Ratio Error at 100%"
//                     value={testData[0]?.test1 || ''}
//                     onChange={(e) => handleInputChange(0, 'test1', e.target.value)}
//                   />
//                 </td>
//                 <td className="border border-gray-300 p-2">
//                   <Input
//                     className="h-8 text-sm"
//                     placeholder="Resistance"
//                     value={testData[0]?.test2 || ''}
//                     onChange={(e) => handleInputChange(0, 'test2', e.target.value)}
//                   />
//                 </td>
//                 <td className="border border-gray-300 p-3 bg-gray-50"></td>
//                 <td className="border border-gray-300 p-3 bg-gray-50"></td>
//                 <td className="border border-gray-300 p-3 bg-gray-50"></td>
//                 <td className="border border-gray-300 p-3 bg-gray-50"></td>
//               </tr>

//               <tr>
//                 <td rowSpan={2} className="border border-gray-300 p-3 bg-purple-100 font-medium text-sm">
//                   400/1
//                 </td>
//                 <td className="border border-gray-300 p-2">
//                   <Input
//                     className="h-8 text-sm"
//                     placeholder="Turn Ratio Error at 100%"
//                     value={testData[1]?.test1 || ''}
//                     onChange={(e) => handleInputChange(1, 'test1', e.target.value)}
//                   />
//                 </td>
//                 <td className="border border-gray-300 p-2">
//                   <Input
//                     className="h-8 text-sm"
//                     placeholder="Resistance"
//                     value={testData[1]?.test2 || ''}
//                     onChange={(e) => handleInputChange(1, 'test2', e.target.value)}
//                   />
//                 </td>
//                 <td className="border border-gray-300 p-2">
//                   <Input
//                     className="h-8 text-sm"
//                     placeholder="Resistance"
//                     value={testData[1]?.test3 || ''}
//                     onChange={(e) => handleInputChange(1, 'test3', e.target.value)}
//                   />
//                 </td>
//                 <td className="border border-gray-300 p-2">
//                   <Input
//                     className="h-8 text-sm"
//                     placeholder="VA: 500v"
//                     value={testData[1]?.test4 || ''}
//                     onChange={(e) => handleInputChange(1, 'test4', e.target.value)}
//                   />
//                 </td>
//                 <td className="border border-gray-300 p-2">
//                   <Input
//                     className="h-8 text-sm"
//                     placeholder="Isa at VA"
//                     value={testData[1]?.test5 || ''}
//                     onChange={(e) => handleInputChange(1, 'test5', e.target.value)}
//                   />
//                 </td>
//                 <td className="border border-gray-300 p-2">
//                   <Input
//                     className="h-8 text-sm"
//                     placeholder="Isa at 1.1s"
//                   />
//                 </td>
//               </tr>

//               <tr>
//                 <td className="border border-gray-300 p-3 text-sm">100%</td>
//                 <td className="border border-gray-300 p-2">
//                   <Input
//                     className="h-8 text-sm"
//                     placeholder="Resistance"
//                     value={testData[2]?.test2 || ''}
//                     onChange={(e) => handleInputChange(2, 'test2', e.target.value)}
//                   />
//                 </td>
//                 <td className="border border-gray-300 p-2">
//                   <Input
//                     className="h-8 text-sm"
//                     placeholder="Resistance"
//                     value={testData[2]?.test3 || ''}
//                     onChange={(e) => handleInputChange(2, 'test3', e.target.value)}
//                   />
//                 </td>
//                 <td className="border border-gray-300 p-3 text-sm">13 VA : 550</td>
//                 <td className="border border-gray-300 p-3 bg-gray-50"></td>
//                 <td className="border border-gray-300 p-3 bg-gray-50"></td>
//               </tr>
//             </tbody>
//           </table>
//         </div>

//         <div className="mt-6 p-4 bg-purple-50 rounded-lg">
//           <h4 className="mb-2">Test Notes</h4>
//           <textarea
//             className="w-full p-3 border border-gray-300 rounded-lg min-h-[100px] resize-y"
//             placeholder="Enter any observations, notes, or special conditions during PS testing..."
//           />
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






















// import { useState } from 'react';
// import { Card } from '../ui/card';
// import { Button } from '../ui/button';
// import { Input } from '../ui/input';
// import { ArrowLeft, Save, Download, Printer } from 'lucide-react';
// import { Transformer } from './SecondaryTransformersList';
// import { exportSecondaryPSReport } from '../../utils/pdfExport';
// import { toast } from 'sonner@2.0.3';

// interface SecondaryPSReportProps {
//   transformer: Transformer;
//   coreNumber: number;
//   coreId: string;
//   testerName: string;
//   onBack: () => void;
// }

// interface PSTestRow {
//   ratio: string;
//   test1: string;
//   test2: string;
//   test3: string;
//   test4: string;
//   test5: string;
// }

// export function SecondaryPSReport({
//   transformer,
//   coreNumber,
//   coreId,
//   testerName,
//   onBack,
// }: SecondaryPSReportProps) {
//   const [testData, setTestData] = useState<PSTestRow[]>([
//     { ratio: '200/1', test1: 'Turn Ratio Error at 100%', test2: 'Resistance', test3: '', test4: '', test5: '' },
//     { ratio: '400/1', test1: 'Turn Ratio Error at 100%', test2: 'Resistance', test3: 'VA: 500v', test4: 'Isa at VA', test5: 'Isa at 1.1s' },
//     { ratio: '400/1', test1: '100%', test2: 'Resistance', test3: 'Resistance', test4: '13 VA : 550', test5: '' },
//   ]);

//   const handleInputChange = (rowIndex: number, field: keyof PSTestRow, value: string) => {
//     const newData = [...testData];
//     newData[rowIndex][field] = value;
//     setTestData(newData);
//   };

//   const handleSave = () => {
//     alert('PS Report saved successfully!');
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

//     exportSecondaryPSReport(reportData);
//     toast.success('PS report downloaded successfully!');
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
//         <h2>PS Test Report</h2>
//         <p className="text-gray-500 mt-1">Secondary Testing - PS (Potential/Current Transformer)</p>
//       </div>

//       {/* Report Header */}
//       <Card className="p-6">
//         <div className="text-center mb-6 pb-4 border-b border-gray-200">
//           <h3 className="text-red-600 mb-2">ADVENT ENGINEERS</h3>
//           <p className="text-sm text-gray-600">{transformer.rating}, PS</p>
//         </div>

//         <div className="mb-4">
//           <p className="text-sm">
//             <strong>PS Core no:</strong> {coreId}
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

//       {/* PS Test Results Table */}
//       <Card className="p-6">
//         <h3 className="mb-4">PS Test Results</h3>

//         <div className="overflow-x-auto">
//           <table className="w-full border-collapse border border-gray-300">
//             <thead>
//               <tr className="bg-gray-100">
//                 <th className="border border-gray-300 p-3 text-left text-sm">PS Core Ratio</th>
//                 <th className="border border-gray-300 p-3 text-left text-sm">Turn Ratio Error at 100%</th>
//                 <th className="border border-gray-300 p-3 text-left text-sm">Resistance</th>
//                 <th className="border border-gray-300 p-3 text-left text-sm">Resistance</th>
//                 <th className="border border-gray-300 p-3 text-left text-sm">VA: 500v</th>
//                 <th className="border border-gray-300 p-3 text-left text-sm">Isa at VA</th>
//                 <th className="border border-gray-300 p-3 text-left text-sm">Isa at 1.1s</th>
//               </tr>
//             </thead>
//             <tbody>
//               <tr>
//                 <td rowSpan={1} className="border border-gray-300 p-3 bg-purple-100 font-medium text-sm">
//                   200/1
//                 </td>
//                 <td className="border border-gray-300 p-2">
//                   <Input
//                     className="h-8 text-sm"
//                     placeholder="Turn Ratio Error at 100%"
//                     value={testData[0]?.test1 || ''}
//                     onChange={(e) => handleInputChange(0, 'test1', e.target.value)}
//                   />
//                 </td>
//                 <td className="border border-gray-300 p-2">
//                   <Input
//                     className="h-8 text-sm"
//                     placeholder="Resistance"
//                     value={testData[0]?.test2 || ''}
//                     onChange={(e) => handleInputChange(0, 'test2', e.target.value)}
//                   />
//                 </td>
//                 <td className="border border-gray-300 p-3 bg-gray-50"></td>
//                 <td className="border border-gray-300 p-3 bg-gray-50"></td>
//                 <td className="border border-gray-300 p-3 bg-gray-50"></td>
//                 <td className="border border-gray-300 p-3 bg-gray-50"></td>
//               </tr>

//               <tr>
//                 <td rowSpan={2} className="border border-gray-300 p-3 bg-purple-100 font-medium text-sm">
//                   400/1
//                 </td>
//                 <td className="border border-gray-300 p-2">
//                   <Input
//                     className="h-8 text-sm"
//                     placeholder="Turn Ratio Error at 100%"
//                     value={testData[1]?.test1 || ''}
//                     onChange={(e) => handleInputChange(1, 'test1', e.target.value)}
//                   />
//                 </td>
//                 <td className="border border-gray-300 p-2">
//                   <Input
//                     className="h-8 text-sm"
//                     placeholder="Resistance"
//                     value={testData[1]?.test2 || ''}
//                     onChange={(e) => handleInputChange(1, 'test2', e.target.value)}
//                   />
//                 </td>
//                 <td className="border border-gray-300 p-2">
//                   <Input
//                     className="h-8 text-sm"
//                     placeholder="Resistance"
//                     value={testData[1]?.test3 || ''}
//                     onChange={(e) => handleInputChange(1, 'test3', e.target.value)}
//                   />
//                 </td>
//                 <td className="border border-gray-300 p-2">
//                   <Input
//                     className="h-8 text-sm"
//                     placeholder="VA: 500v"
//                     value={testData[1]?.test4 || ''}
//                     onChange={(e) => handleInputChange(1, 'test4', e.target.value)}
//                   />
//                 </td>
//                 <td className="border border-gray-300 p-2">
//                   <Input
//                     className="h-8 text-sm"
//                     placeholder="Isa at VA"
//                     value={testData[1]?.test5 || ''}
//                     onChange={(e) => handleInputChange(1, 'test5', e.target.value)}
//                   />
//                 </td>
//                 <td className="border border-gray-300 p-2">
//                   <Input
//                     className="h-8 text-sm"
//                     placeholder="Isa at 1.1s"
//                   />
//                 </td>
//               </tr>

//               <tr>
//                 <td className="border border-gray-300 p-3 text-sm">100%</td>
//                 <td className="border border-gray-300 p-2">
//                   <Input
//                     className="h-8 text-sm"
//                     placeholder="Resistance"
//                     value={testData[2]?.test2 || ''}
//                     onChange={(e) => handleInputChange(2, 'test2', e.target.value)}
//                   />
//                 </td>
//                 <td className="border border-gray-300 p-2">
//                   <Input
//                     className="h-8 text-sm"
//                     placeholder="Resistance"
//                     value={testData[2]?.test3 || ''}
//                     onChange={(e) => handleInputChange(2, 'test3', e.target.value)}
//                   />
//                 </td>
//                 <td className="border border-gray-300 p-3 text-sm">13 VA : 550</td>
//                 <td className="border border-gray-300 p-3 bg-gray-50"></td>
//                 <td className="border border-gray-300 p-3 bg-gray-50"></td>
//               </tr>
//             </tbody>
//           </table>
//         </div>

//         <div className="mt-6 p-4 bg-purple-50 rounded-lg">
//           <h4 className="mb-2">Test Notes</h4>
//           <textarea
//             className="w-full p-3 border border-gray-300 rounded-lg min-h-[100px] resize-y"
//             placeholder="Enter any observations, notes, or special conditions during PS testing..."
//           />
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
import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ArrowLeft, Save, Download, Printer } from 'lucide-react';
import { toast } from 'sonner';

interface PSRow {
  ratioValue: string;
  turnRatioError: string;
  resistance: string;
  vk: string;
  vkVal: string;
  iexVk: string;
  iex11Vk: string;
  internalCoreNo?: string;
}

interface SecondaryPSReportProps {
  transformer: Transformer;
  coreNumber: number;
  coreId: string;
  testerName: string;
  onBack: () => void;
  readOnly?: boolean;
  stage?: 'secondary' | 'primary' | 'final';
}

export function SecondaryPSReport({ transformer, coreId, testerName, onBack, readOnly = false, stage = 'secondary' }: SecondaryPSReportProps) {
  // Use dynamic ratios from transformer, fallback if missing
  const dynamicRatios = (transformer as any).ratios && (transformer as any).ratios.length > 0
    ? (transformer as any).ratios
    : ((transformer as any).orderId?.ratio || ['200/1']);

  const [psData, setPsData] = useState<PSRow[]>(
    dynamicRatios.map((ratio: string) => ({
      ratioValue: ratio,
      turnRatioError: '',
      resistance: '',
      vk: '',
      vkVal: '',
      iexVk: '',
      iex11Vk: ''
    }))
  );

  // ✅ LOAD DATA EFFECT
  React.useEffect(() => {
    const fetchLatestData = async () => {
      try {
        const res = await axios.get(`http://localhost:3002/api/transformers/${(transformer as any).uniqueId}`, { withCredentials: true });
        const freshTransformer = res.data;

        // Dynamic Path
        const stageKey = `${stage}_test` as keyof typeof freshTransformer.testHistory;
        const stageHistory = freshTransformer?.testHistory?.[stageKey];

        if (stageHistory?.ps_results?.length > 0) {
          console.log(`Found saved PS results for ${stage}, loading...`, stageHistory.ps_results);

          // Filter results for THIS specific core ID
          const myResults = stageHistory.ps_results.filter((res: any) =>
            res.internalCoreNo === coreId || res.coreId === coreId
          );

          // Map saved results back to state
          // We need to match by ratioValue to ensure order
          setPsData((prevData: PSRow[]) => {
            return prevData.map((row: PSRow) => {
              // 1. Try Exact Match
              let savedRow = myResults.find((r: any) => r.ratioValue === row.ratioValue);

              // 2. Fallback for "N/A"
              if (!savedRow && dynamicRatios.length === 1) {
                savedRow = myResults.find((r: any) => !r.ratioValue || r.ratioValue === 'N/A');
              }

              if (savedRow) {
                console.log("Loading PS Row Data:", savedRow); // DEBUG LOG
                return {
                  ...row,
                  turnRatioError: savedRow.turnRatioError,
                  resistance: savedRow.resistance,
                  vk: savedRow.vk,
                  // Auto-calculate 1.1Vk if missing but Vk exists
                  vkVal: savedRow.vkVal || (savedRow.vk && !isNaN(parseFloat(savedRow.vk)) ? (parseFloat(savedRow.vk) * 1.1).toFixed(2) : ''),
                  iexVk: savedRow.iexVk,
                  iex11Vk: savedRow.iex11Vk
                };
              }
              return row;
            });
          });
        }
      } catch (err) {
        console.error("Failed to load existing PS data", err);
      }
    };

    fetchLatestData();
  }, [(transformer as any).uniqueId, coreId]);

  const handleUpdate = (idx: number, field: string, val: string) => {
    if (readOnly) return;
    const updated = [...psData];
    updated[idx] = { ...updated[idx], [field]: val };

    // Auto-calculate 1.1Vk if Vk changes
    if (field === 'vk') {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        // Use roughly 2 decimals for voltage
        updated[idx].vkVal = (num * 1.1).toFixed(2).replace(/\.00$/, '');
      } else {
        updated[idx].vkVal = '';
      }
    }

    setPsData(updated);
  };

  const handleDatabaseSave = async () => {
    if (readOnly) return;
    console.log("handleDatabaseSave (PS): STARTED");
    try {
      // 1. Prepare the payload based on PSBlockSchema
      const payload = {
        uniqueId: (transformer as any).uniqueId,
        tester: testerName, // Use prop directly
        coreId: coreId,
        stage: stage, // Add stage info if helpful for backend logging
        ps_results: psData.map((row: any) => ({
          internalCoreNo: coreId, // Inject Core ID for persistence
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

      const endpoint = `http://localhost:3002/transformer-${stage}-ps-tests`;

      // 2. Execute POST request
      const response = await axios.post(
        endpoint,
        payload,
        { withCredentials: true }
      );

      console.log("handleDatabaseSave (PS): Response received", response);
      toast.success("Secondary PS Test results saved successfully!");

    } catch (error: any) {
      console.error("handleDatabaseSave (PS): ERROR", error);
      toast.error(error.response?.data?.message || "Failed to save PS data to database.");
    }
  };

  // Check Completion
  const isComplete = psData.length > 0 && psData.every(row =>
    row.turnRatioError && row.resistance && row.vk &&
    row.vkVal && row.iexVk && row.iex11Vk
  );

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

      <Card className={`p-0 border overflow-hidden shadow-none rounded-none ${isComplete ? 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'border-gray-400'}`}>
        <div className={`border-b p-2 text-center ${isComplete ? 'bg-green-100 border-green-500' : 'bg-[#92d050] border-gray-400'}`}>
          <h2 className="text-sm font-bold uppercase">Pretest After Secondary Winding {isComplete && '(Completed)'}</h2>
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
                <th className="border border-gray-400 p-2 text-center w-[180px]">Vk / 1.1Vk (V)</th>
                <th className="border border-gray-400 p-2 text-center">lex at Vk</th>
                <th className="border border-gray-400 p-2 text-center">lex at 1.1Vk</th>
              </tr>
            </thead>
            <tbody>
              {psData.map((row: PSRow, i: number) => (
                <React.Fragment key={i}>
                  <tr>
                    <td rowSpan={2} className="border border-gray-400 p-2 bg-[#ffff00] font-bold text-center align-middle">
                      PS Core Ratio - {row.ratioValue}
                    </td>
                    <td className="border border-gray-400 p-0" rowSpan={2}>
                      <Input
                        className="border-none text-center h-16 shadow-none text-blue-800 font-bold disabled:opacity-100 disabled:cursor-not-allowed"
                        value={row.turnRatioError}
                        onChange={e => handleUpdate(i, 'turnRatioError', e.target.value)}
                        disabled={readOnly}
                      />
                    </td>
                    <td className="border border-gray-400 p-0" rowSpan={2}>
                      <Input
                        className="border-none text-center h-16 shadow-none text-blue-800 font-bold disabled:opacity-100 disabled:cursor-not-allowed"
                        value={row.resistance}
                        onChange={e => handleUpdate(i, 'resistance', e.target.value)}
                        disabled={readOnly}
                      />
                    </td>
                    <td className="border border-gray-400 p-1 bg-white border-b-0 h-8">
                      <div className="flex items-center w-full h-full">
                        <span className="font-bold text-[#0070c0] mr-2 whitespace-nowrap">Vk :</span>
                        <Input
                          className="border-none text-[#0070c0] font-bold h-6 shadow-none flex-1 min-w-[60px] disabled:opacity-100 disabled:cursor-not-allowed"
                          value={row.vk || ''}
                          onChange={e => handleUpdate(i, 'vk', e.target.value)}
                          disabled={readOnly}
                        />
                      </div>
                    </td>
                    <td className="border border-gray-400 p-0" rowSpan={2}>
                      <Input
                        className="border-none text-center h-16 shadow-none text-blue-800 font-bold disabled:opacity-100 disabled:cursor-not-allowed"
                        value={row.iexVk}
                        onChange={e => handleUpdate(i, 'iexVk', e.target.value)}
                        disabled={readOnly}
                      />
                    </td>
                    <td className="border border-gray-400 p-0" rowSpan={2}>
                      <Input
                        className="border-none text-center h-16 shadow-none text-blue-800 font-bold disabled:opacity-100 disabled:cursor-not-allowed"
                        value={row.iex11Vk}
                        onChange={e => handleUpdate(i, 'iex11Vk', e.target.value)}
                        disabled={readOnly}
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-400">
                    <td className="border border-gray-400 p-1 bg-white h-8">
                      <div className="flex items-center w-full h-full">
                        <span className="font-bold text-[#0070c0] mr-2 whitespace-nowrap">1.1Vk :</span>
                        <Input
                          className="border-none text-[#0070c0] font-bold h-6 shadow-none flex-1 min-w-[60px] disabled:opacity-100 disabled:cursor-not-allowed"
                          value={row.vkVal || ''}
                          onChange={e => handleUpdate(i, 'vkVal', e.target.value)}
                          disabled={readOnly}
                        />
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex gap-3 no-print pt-4">
        {!readOnly && (
          <Button onClick={handleDatabaseSave} variant="outline" className="gap-2">
            <Save className="w-4 h-4" /> Save to Database
          </Button>
        )}
      </div>
    </div>
  );
}
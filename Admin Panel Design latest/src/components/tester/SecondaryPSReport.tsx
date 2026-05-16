// import { useState } from 'react';
// import { Card } from '../ui/card';
// import { Button } from '../ui/button';
// import { Input } from '../ui/input';
// import { ArrowLeft, Save, Download, Printer } from 'lucide-react';
// import { Transformer } from './SecondaryTransformersList';
// import { exportSecondaryPSReport } from '../../utils/pdfExport';
// import { toast } from 'sonner';

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
// import { toast } from 'sonner';

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
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ArrowLeft, Save, Printer, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Transformer } from './SecondaryTransformersList';
import logoImage from 'figma:asset/9d5dbd3020690d903579eb3ff66bac216cd36f83.png';
import { ImageWithFallback } from '../figma/ImageWithFallback';

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
  coreNumber?: number;
  coreId: string;
  testerName: string;
  onBack: () => void;
  readOnly?: boolean;
  stage?: 'secondary' | 'primary' | 'final';
  accuracyClass?: string | undefined;
  primaryCurrent?: string;
  secondaryCurrent?: string;
  order?: any;
  onRefresh?: () => void;
}

export function SecondaryPSReport({ 
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
  onRefresh
}: SecondaryPSReportProps) {
  const coreIndex = (coreNumber && coreNumber > 0) ? (coreNumber - 1) :
    (!isNaN(parseInt(coreId.replace(/[^0-9]/g, ''))) ? parseInt(coreId.replace(/[^0-9]/g, '')) - 1 : 0);

  // Use dynamic ratios from transformer, fallback if missing
  // Determine ratios from transformer (passed from props)
  const dynamicRatios: string[] = (() => {
    // 1. Find the secondary current for THIS core
    const order = propOrder || (transformer as any).fullOrder || (transformer as any).orderId;
    const orderCores = order?.coreDetails || [];
    const coreFromOrder = orderCores[coreIndex];

    // Priority: Manual Prop -> Core Specific -> Order Level -> Fallback
    const secCurr = manualSecondary || 
      coreFromOrder?.secondaryCurrent ||
      order?.ratedSecondaryCurrent ||
      '1';

    // 2. Get primary currents
    // Priority: Manual Prop -> Order PrimaryCurrents -> Order Ratio -> Fallback
    const rawPrimaryCurrs = manualPrimary ? [manualPrimary] :
      ((order?.primaryCurrents && order.primaryCurrents.length > 0) ? order.primaryCurrents :
      (Array.isArray(order?.ratio) ? order.ratio.map((r: string) => String(r).split('/')[0]) : ['200']));

    let primaryCurrs = rawPrimaryCurrs.flatMap((pc: string) =>
      String(pc).replace(/[\[\]"']/g, '').split(/[- ,]+/).filter(v => v.trim() !== '')
    );
    primaryCurrs = [...new Set(primaryCurrs)];

    // 3. Generate ratios for this core
    return primaryCurrs.map((p: string) => `${p}/${secCurr}`);
  })();

  const [accuracyClass, setAccuracyClass] = useState<string>(() => {
    if (explicitClass) return explicitClass;
    const order = propOrder || (transformer as any).fullOrder || (transformer as any).orderId;
    const orderCores = order?.coreDetails || [];
    return orderCores[coreIndex]?.accuracyClass || 'PS';
  });

  const displayBurden = (() => {
    const order = propOrder || (transformer as any).fullOrder || (transformer as any).orderId;
    let rawBurden = order?.burden;
    if (Array.isArray(rawBurden)) {
      rawBurden = rawBurden[Math.min(coreIndex, rawBurden.length - 1)];
    }
    const val = rawBurden || (transformer as any).burden;
    if (!val) return 'N/A';
    return String(val).replace(/VA/i, '').trim();
  })();

  const displaySTC = (() => {
    const order = propOrder || (transformer as any).fullOrder || (transformer as any).orderId;
    return order?.stc || order?.STC || (transformer as any).stc || 'N/A';
  })();

  const [psData, setPsData] = useState<PSRow[]>(() => {
    const initial = dynamicRatios.map((ratio: string) => ({
      ratioValue: ratio,
      turnRatioError: '',
      resistance: '',
      vk: '',
      vkVal: '',
      iexVk: '',
      iex11Vk: ''
    }));

    // Fast Load from props
    const stageKey = `${stage}_test` as keyof typeof transformer.testHistory;
    const stageHistory = transformer.testHistory?.[stageKey];
    if (stageHistory?.ps_results?.length > 0) {
      const myResults = stageHistory.ps_results.filter((res: any) =>
        res.internalCoreNo === coreId || res.coreId === coreId
      );
      if (myResults.length > 0) {
        return initial.map((row: PSRow) => {
          let savedRow = myResults.find((r: any) => r.ratioValue === row.ratioValue);
          if (!savedRow && dynamicRatios.length === 1) {
            savedRow = myResults.find((r: any) => !r.ratioValue || r.ratioValue === 'N/A');
          }
          if (savedRow) {
            return {
              ...row,
              turnRatioError: savedRow.turnRatioError,
              resistance: savedRow.resistance,
              vk: savedRow.vk,
              vkVal: savedRow.vkVal || (savedRow.vk && !isNaN(parseFloat(savedRow.vk)) ? (parseFloat(savedRow.vk) * 1.1).toFixed(2) : ''),
              iexVk: savedRow.iexVk,
              iex11Vk: savedRow.iex11Vk
            };
          }
          return row;
        });
      }
    }
    return initial;
  });

  const [psLimit, setPsLimit] = useState<{ psRatioErrorLimit: number, psExcitationMultiplier: number } | null>(null);

  // Fetch PS Limit
  React.useEffect(() => {
    const fetchLimit = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/accuracy-limits/ps', { withCredentials: true });
        if (response.data && response.data.length > 0) {
          setPsLimit(response.data[0]);
        }
      } catch (error) {
        console.error('Failed to fetch PS limits', error);
      }
    };
    fetchLimit();
  }, []);

  // ✅ LOAD DATA EFFECT
  React.useEffect(() => {
    const fetchLatestData = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/transformers/${(transformer as any).uniqueId}`, { withCredentials: true });
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
                if (savedRow.accuracyClass && savedRow.accuracyClass !== 'N/A' && savedRow.accuracyClass !== accuracyClass) {
                  setAccuracyClass(savedRow.accuracyClass);
                }

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

  const handleUpdate = (idx: number, field: keyof PSRow, val: string) => {
    if (readOnly) return;
    const updated = [...psData];

    if (updated[idx]) {
      updated[idx] = { ...updated[idx], [field]: val } as PSRow;

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
        ps_results: psData.map((row: any) => {
          const validation = validatePSRow(row);
          return {
            internalCoreNo: coreId,
            ratioValue: row.ratioValue,
            accuracyClass: accuracyClass || 'N/A',
            turnRatioError: row.turnRatioError,
            resistance: row.resistance,
            vk: row.vk,
            vkVal: row.vkVal,
            iexVk: row.iexVk,
            iex11Vk: row.iex11Vk,
            isPass: validation.isPass,
            reason: validation.reason
          };
        })
      };

      console.log("handleDatabaseSave (PS): Payload ready", payload);

      const endpoint = `http://localhost:5001/transformer-${stage}-ps-tests`;

      // 2. Execute POST request
      const response = await axios.post(
        endpoint,
        payload,
        { withCredentials: true }
      );

      console.log("handleDatabaseSave (PS): Response received", response);
      toast.success("Secondary PS Test results saved successfully!");
      if (onRefresh) onRefresh();

    } catch (error: any) {
      console.error("handleDatabaseSave (PS): ERROR", error);
      toast.error(error.response?.data?.message || "Failed to save PS data to database.");
    }
  };

  // Validation Logic for PS Cores
  const validatePSRow = (row: PSRow) => {
    // Both ratio errors and excitation currents must be populated to grade
    if (!row.turnRatioError || !row.iexVk || !row.iex11Vk) return { isPass: null, reason: null };

    const ratioError = parseFloat(row.turnRatioError);
    const iexVk = parseFloat(row.iexVk);
    const iex11Vk = parseFloat(row.iex11Vk);

    if (isNaN(ratioError) || isNaN(iexVk) || isNaN(iex11Vk)) return { isPass: null, reason: null };

    const limitRatio = psLimit?.psRatioErrorLimit ?? 0.25;
    const limitMulti = psLimit?.psExcitationMultiplier ?? 1.5;

    let reasons: string[] = [];

    // Condition 1: Ratio Error must be strictly between limits
    const isRatioPass = ratioError > -limitRatio && ratioError < limitRatio;
    if (!isRatioPass) {
        reasons.push(`Ratio Error (${ratioError}) meets or exceeds ±${limitRatio} limit`);
    }

    // Condition 2: (Iex at Vk * limitMulti) > Iex at 1.1Vk
    const calculatedValue = iexVk * limitMulti;
    const isExcitationPass = calculatedValue > iex11Vk;
    if (!isExcitationPass) {
        reasons.push(`Excitation check failed: IexVk * ${limitMulti} (${calculatedValue.toFixed(2)}) is not > Iex11Vk (${iex11Vk})`);
    }

    return {
        isPass: isRatioPass && isExcitationPass,
        reason: reasons.length > 0 ? reasons.join('; ') : null
    };
  };

  const calculateRowStatus = (row: PSRow) => validatePSRow(row).isPass;

  // Check if any row has explicitly failed the test constraints
  const hasFailures = psData.some(row => calculateRowStatus(row) === false);

  const handleMarkAsFailed = async () => {
    if (readOnly) return;

    // Build automated failure reasons dynamically from failing rows
    let reasons: string[] = [];
    const limitRatio = psLimit?.psRatioErrorLimit ?? 0.25;
    const limitMulti = psLimit?.psExcitationMultiplier ?? 1.5;

    psData.forEach((row, idx) => {
      const status = calculateRowStatus(row);
      if (status === false) {
        const ratioErr = parseFloat(row.turnRatioError);
        const iexVk = parseFloat(row.iexVk);
        const iex11Vk = parseFloat(row.iex11Vk);

        if (isNaN(ratioErr) || ratioErr <= -limitRatio || ratioErr >= limitRatio) {
          reasons.push(`Row ${idx + 1} (Ratio ${row.ratioValue}): Ratio Error ${row.turnRatioError} meets or exceeds ±${limitRatio} limit.`);
        }

        if (!isNaN(iexVk) && !isNaN(iex11Vk) && (iexVk * limitMulti) <= iex11Vk) {
          reasons.push(`Row ${idx + 1} (Ratio ${row.ratioValue}): Excitation check failed (IexVk*${limitMulti} <= Iex11Vk).`);
        }
      }
    });

    const finalReason = reasons.length > 0 ? reasons.join(' | ') : "PS Core values out of specification";

    try {
      // Persist the entered test values to the transformer's history first
      await handleDatabaseSave();

      const payload = {
        orderId: (transformer as any).orderId?._id || (transformer as any).orderId || (transformer as any)._id || (transformer as any).order?._id,
        internalCoreNo: coreId,
        failureReason: finalReason,
        failureStage: `${stage}_ps_test`,
        dynamicValues: psData
      };

      console.log("[DEBUG] Frontend Failed Core Payload:", payload);

      await axios.post(`http://localhost:5001/api/failed-cores`, payload, { withCredentials: true });
      toast.success("Added to Failed Cores successfully!");
    } catch (error: any) {
      console.error("Mark as failed error:", error);
      toast.error(error.response?.data?.message || "Error adding to failed cores");
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
        }
      `}</style>

      <div className="print-container w-[210mm]">
        {!readOnly && (
          <div className="flex items-center justify-between no-print mb-4 w-full">
            <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <div className="flex gap-2">
              {hasFailures && (
                <Button variant="destructive" size="sm" onClick={handleMarkAsFailed} className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md">
                  <AlertTriangle className="w-4 h-4" /> Add to Failed Cores
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleDatabaseSave} className="gap-2">
                <Save className="w-4 h-4" /> Save
              </Button>
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
              <div className="meta-field"><span className="meta-label">Order No</span><span className="meta-value">: {(transformer as any).jobId || (transformer as any).uniqueId}</span></div>
              <div className="meta-field"><span className="meta-label">Client</span><span className="meta-value">: {(transformer as any).clientName || 'N/A'}</span></div>
            </div>
            <div className="meta-column">
              <div className="meta-field"><span className="meta-label">Unit No</span><span className="meta-value">: {transformer.uniqueId}</span></div>
              <div className="meta-field"><span className="meta-label">Class</span><span className="meta-value">: {accuracyClass || 'PS'}</span></div>
            </div>
          </div>

          <div className="report-main-title">PS CORE TEST REPORT</div>

          <div className="section-container">
            <div className="section-title bg-gray-100">Secondary Winding Verification - {coreId}</div>
            <table className="spec-table">
              <tbody>
                <tr>
                  <td colSpan={2}><span className="font-bold mr-2">Specification :</span> {(transformer as any).voltageRating || '33'} KV {(transformer as any).clientName || 'N/A'}</td>
                </tr>
                <tr>
                  <td colSpan={2}><span className="font-bold mr-2">CT Ratio :</span> {dynamicRatios.join('-')} A</td>
                </tr>
                <tr>
                  <td style={{ width: '50%', borderRight: '1px solid #000' }}><span className="font-bold mr-2">Burden :</span> {displayBurden} VA</td>
                  <td style={{ width: '50%' }}><span className="font-bold mr-2">Class :</span> {accuracyClass || 'PS'}</td>
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
                <tr className="bg-white">
                  <th className="border border-gray-400 p-2" colSpan={5}></th>
                  <th className="border border-gray-400 p-2 text-right" colSpan={2}>
                    <div className="flex justify-end items-center gap-2">
                      <span className="font-bold text-sm">PS core no.</span>
                      <span className="border-b border-gray-600 px-2 min-w-[60px] text-blue-700 font-medium">{coreId}</span>
                    </div>
                  </th>
                </tr>
                <tr className="bg-yellow">
                  <th className="w-[160px]" rowSpan={2}>PS Core Ratio</th>
                  <th className="w-[120px]" rowSpan={2}>Turn Ratio Error at 100%</th>
                  <th className="w-[100px]" rowSpan={2}>Resistance (Ω)</th>
                  <th className="text-center" colSpan={3}>Excitation Current Details</th>
                  <th className="w-[100px] text-center" rowSpan={2}>Result</th>
                </tr>
                <tr className="bg-yellow">
                  <th className="text-center w-[180px]">Vk / 1.1Vk (V)</th>
                  <th className="text-center">lex at Vk</th>
                  <th className="text-center">lex at 1.1Vk</th>
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
                        {readOnly ? (
                          <div className={`p-2 text-center font-bold text-xs h-16 flex items-center justify-center ${row.turnRatioError && !isNaN(parseFloat(row.turnRatioError)) && !(parseFloat(row.turnRatioError) > -(psLimit?.psRatioErrorLimit ?? 0.25) && parseFloat(row.turnRatioError) < (psLimit?.psRatioErrorLimit ?? 0.25))
                            ? 'text-red-700'
                            : 'text-blue-800'
                            }`}>
                            {row.turnRatioError || '-'}
                          </div>
                        ) : (
                          <Input
                            className={`border-none text-center h-16 shadow-none font-bold disabled:opacity-100 disabled:cursor-not-allowed ${row.turnRatioError && !isNaN(parseFloat(row.turnRatioError)) && !(parseFloat(row.turnRatioError) > -(psLimit?.psRatioErrorLimit ?? 0.25) && parseFloat(row.turnRatioError) < (psLimit?.psRatioErrorLimit ?? 0.25))
                              ? 'text-red-700'
                              : 'text-blue-800'
                              }`}
                            value={row.turnRatioError}
                            onKeyDown={(e) => {
                              if (e.ctrlKey || e.metaKey || ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter", "."].includes(e.key)) return;
                              if (!/^[0-9+\-]$/.test(e.key)) e.preventDefault();
                            }}
                            onChange={e => handleUpdate(i, 'turnRatioError', e.target.value.replace(/[^0-9+\-.]/g, ''))}
                            disabled={readOnly}
                          />
                        )}
                      </td>
                      <td className="border border-gray-400 p-0" rowSpan={2}>
                        {readOnly ? (
                          <div className="p-2 text-center text-blue-800 font-bold text-xs h-16 flex items-center justify-center">
                            {row.resistance || '-'}
                          </div>
                        ) : (
                          <Input
                            className="border-none text-center h-16 shadow-none text-blue-800 font-bold disabled:opacity-100 disabled:cursor-not-allowed"
                            value={row.resistance}
                            onKeyDown={(e) => {
                              if (e.ctrlKey || e.metaKey || ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter", "."].includes(e.key)) return;
                              if (!/^[0-9+\-]$/.test(e.key)) e.preventDefault();
                            }}
                            onChange={e => handleUpdate(i, 'resistance', e.target.value.replace(/[^0-9+\-.]/g, ''))}
                            disabled={readOnly}
                          />
                        )}
                      </td>
                      <td className="border border-gray-400 p-1 bg-white">
                        <div className="flex items-center w-full h-full min-h-[24px]">
                          <span className="font-bold text-[#0070c0] mr-2 whitespace-nowrap text-xs">Vk :</span>
                          {readOnly ? (
                            <span className="text-[#0070c0] font-bold text-xs">{row.vk || '-'}</span>
                          ) : (
                            <Input
                              className="border-none text-[#0070c0] font-bold h-6 shadow-none flex-1 min-w-[60px] disabled:opacity-100 disabled:cursor-not-allowed px-0"
                              value={row.vk || ''}
                              onKeyDown={(e) => {
                                if (e.ctrlKey || e.metaKey || ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter", "."].includes(e.key)) return;
                                if (!/^[0-9+\-]$/.test(e.key)) e.preventDefault();
                              }}
                              onChange={e => handleUpdate(i, 'vk', e.target.value.replace(/[^0-9+\-.]/g, ''))}
                              disabled={readOnly}
                            />
                          )}
                        </div>
                      </td>
                      <td className="border border-gray-400 p-0" rowSpan={2}>
                        {readOnly ? (
                          <div className={`p-2 text-center font-bold text-xs h-16 flex items-center justify-center ${row.iexVk && row.iex11Vk && !isNaN(parseFloat(row.iexVk)) && !isNaN(parseFloat(row.iex11Vk)) && !((parseFloat(row.iexVk) * (psLimit?.psExcitationMultiplier ?? 1.5)) > parseFloat(row.iex11Vk))
                            ? 'text-red-700'
                            : 'text-blue-800'
                            }`}>
                            {row.iexVk || '-'}
                          </div>
                        ) : (
                          <Input
                            className={`border-none text-center h-16 shadow-none font-bold disabled:opacity-100 disabled:cursor-not-allowed ${row.iexVk && row.iex11Vk && !isNaN(parseFloat(row.iexVk)) && !isNaN(parseFloat(row.iex11Vk)) && !((parseFloat(row.iexVk) * (psLimit?.psExcitationMultiplier ?? 1.5)) > parseFloat(row.iex11Vk))
                              ? 'text-red-700'
                              : 'text-blue-800'
                              }`}
                            value={row.iexVk}
                            onKeyDown={(e) => {
                              if (e.ctrlKey || e.metaKey || ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter", "."].includes(e.key)) return;
                              if (!/^[0-9+\-]$/.test(e.key)) e.preventDefault();
                            }}
                            onChange={e => handleUpdate(i, 'iexVk', e.target.value.replace(/[^0-9+\-.]/g, ''))}
                            disabled={readOnly}
                          />
                        )}
                      </td>
                      <td className="border border-gray-400 p-0" rowSpan={2}>
                        {readOnly ? (
                          <div className={`p-2 text-center font-bold text-xs h-16 flex items-center justify-center ${row.iexVk && row.iex11Vk && !isNaN(parseFloat(row.iexVk)) && !isNaN(parseFloat(row.iex11Vk)) && !((parseFloat(row.iexVk) * (psLimit?.psExcitationMultiplier ?? 1.5)) > parseFloat(row.iex11Vk))
                            ? 'text-red-700'
                            : 'text-blue-800'
                            }`}>
                            {row.iex11Vk || '-'}
                          </div>
                        ) : (
                          <Input
                            className={`border-none text-center h-16 shadow-none font-bold disabled:opacity-100 disabled:cursor-not-allowed ${row.iexVk && row.iex11Vk && !isNaN(parseFloat(row.iexVk)) && !isNaN(parseFloat(row.iex11Vk)) && !((parseFloat(row.iexVk) * (psLimit?.psExcitationMultiplier ?? 1.5)) > parseFloat(row.iex11Vk))
                              ? 'text-red-700'
                              : 'text-blue-800'
                              }`}
                            value={row.iex11Vk}
                            onKeyDown={(e) => {
                              if (e.ctrlKey || e.metaKey || ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter", "."].includes(e.key)) return;
                              if (!/^[0-9+\-]$/.test(e.key)) e.preventDefault();
                            }}
                            onChange={e => handleUpdate(i, 'iex11Vk', e.target.value.replace(/[^0-9+\-.]/g, ''))}
                            disabled={readOnly}
                          />
                        )}
                      </td>
                      <td className="border border-gray-400 p-1 bg-white text-center align-middle font-bold" rowSpan={2}>
                        {(() => {
                          const status = calculateRowStatus(row);
                          if (status === null) return <span className="text-gray-400">-</span>;
                          return status ? (
                            <span className="text-green-600 bg-green-50 px-2 py-1 rounded inline-flex items-center gap-1"><span className="text-green-600">✅</span> PASS</span>
                          ) : (
                            <span className="text-red-600 bg-red-50 px-2 py-1 rounded inline-flex items-center gap-1"><span className="text-red-600">❌</span> FAIL</span>
                          );
                        })()}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 p-1 bg-white">
                        <div className="flex items-center w-full h-full min-h-[24px]">
                          <span className="font-bold text-[#0070c0] mr-2 whitespace-nowrap text-xs">1.1Vk :</span>
                          {readOnly ? (
                            <span className="text-[#0070c0] font-bold text-xs">{row.vkVal || '-'}</span>
                          ) : (
                            <Input
                              className="border-none text-[#0070c0] font-bold h-6 shadow-none flex-1 min-w-[60px] disabled:opacity-100 disabled:cursor-not-allowed px-0"
                              value={row.vkVal || ''}
                              onKeyDown={(e) => {
                                if (e.ctrlKey || e.metaKey || ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter", "."].includes(e.key)) return;
                                if (!/^[0-9+\-]$/.test(e.key)) e.preventDefault();
                              }}
                              onChange={e => handleUpdate(i, 'vkVal', e.target.value.replace(/[^0-9+\-.]/g, ''))}
                              disabled={readOnly}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
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

    </div>
  );
}

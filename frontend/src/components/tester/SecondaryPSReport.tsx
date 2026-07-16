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

import axios from '@/utils/axiosConfig';
import React, { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ArrowLeft, Save, Printer, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Transformer } from './SecondaryTransformersList';
import {
  ReportHeader,
  ReportSectionTitle,
  CoreInformationBar,
  ReportSignatures,
  formatReportDate,
  secondaryReportPrintStyles,
  ReportSpecBox,
} from './SecondaryReportPrintLayout';

const renderVal = (v: any) => (v === null || v === undefined || String(v).trim() === '') ? 'Not recorded' : String(v);

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
  onFail?: () => void;
  onCompleteTimer?: () => Promise<void>;
  sourceStage?: 'secondary' | 'primary' | 'final';
  isFailedSection?: boolean;
  failedTransformerId?: string;
  failedStatus?: string;
  isFailedCore?: boolean;
  retestHistory?: any[];
  isUnified?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
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
  onRefresh,
  onFail,
  onCompleteTimer,
  sourceStage,
  isFailedSection = false,
  failedTransformerId,
  failedStatus,
  isFailedCore,
  retestHistory,
  isUnified = false,
  onNext,
  onPrev
}: SecondaryPSReportProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const coreIndex = (coreNumber && coreNumber > 0) ? (coreNumber - 1) :
    (!isNaN(parseInt(coreId.replace(/[^0-9]/g, ''))) ? parseInt(coreId.replace(/[^0-9]/g, '')) - 1 : 0);

  const hasBeenRetested = !!(retestHistory?.some((h: any) =>
    Array.isArray(h.newTreatmentReadings) && h.newTreatmentReadings.some((r: any) =>
      r.internalCoreNo === coreId || r.coreId === coreId
    )
  ));

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
    let myResults = [];

    const shouldLoadFromTreated = isFailedSection && failedStatus === 'TREATED' && (isFailedCore || hasBeenRetested);
    if (shouldLoadFromTreated) {
      const secHistory = transformer.testHistory?.secondary_test;
      if (secHistory?.ps_results?.length > 0) {
        myResults = secHistory.ps_results.filter((res: any) =>
          res.internalCoreNo === coreId || res.coreId === coreId
        );
      }
    }

    if (myResults.length === 0) {
      const stageHistory = transformer.testHistory?.[`${stage}_test` as keyof typeof transformer.testHistory] as any;
      if (stageHistory?.ps_results?.length > 0) {
        myResults = stageHistory.ps_results.filter((res: any) =>
          res.internalCoreNo === coreId || res.coreId === coreId
        );
      }
    }

    if (myResults.length === 0 && sourceStage && sourceStage !== stage) {
      const sourceHistory = transformer.testHistory?.[`${sourceStage}_test` as keyof typeof transformer.testHistory] as any;
      if (sourceHistory?.ps_results?.length > 0) {
        myResults = sourceHistory.ps_results.filter((res: any) =>
          res.internalCoreNo === coreId || res.coreId === coreId
        );
      }
    }

    if (myResults.length > 0) {
        return initial.map((row: PSRow, index: number) => {
          let savedRow = myResults.find((r: any) => r.ratioValue === row.ratioValue);
          if (!savedRow && myResults[index]) {
            savedRow = myResults[index];
          }
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
    return initial;
  });

  const [psLimit, setPsLimit] = useState<{ psRatioErrorLimit: number, psExcitationMultiplier: number } | null>(null);

  // Fetch PS Limit
  React.useEffect(() => {
    const fetchLimit = async () => {
      try {
        const response = await axios.get(`/accuracy-limits/ps`, { withCredentials: true });
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
        const res = await axios.get(`/transformers/${(transformer as any).uniqueId}`, { withCredentials: true });
        const freshTransformer = res.data.data || res.data;

        let myResults = [];
        
        let currentFailedStatus = failedStatus;
        let currentRetestHistory = retestHistory;

        if (isFailedSection && failedTransformerId) {
          try {
            const failRes = await axios.get(`/failed-transformers/${failedTransformerId}`, { withCredentials: true });
            if (failRes.data?.success && failRes.data?.data) {
              currentFailedStatus = failRes.data.data.status;
              currentRetestHistory = failRes.data.data.retestHistory;
            }
          } catch (e) {
            console.error("Failed to fetch latest failed record", e);
          }
        }

        const currentHasBeenRetested = currentRetestHistory && currentRetestHistory.length > 0;
        const shouldLoadFromTreated = isFailedSection && currentFailedStatus === 'TREATED' && (isFailedCore || currentHasBeenRetested);
        
        if (shouldLoadFromTreated) {
          const secHistory = freshTransformer?.testHistory?.secondary_test;
          if (secHistory?.ps_results?.length > 0) {
            myResults = secHistory.ps_results.filter((res: any) =>
              res.internalCoreNo === coreId || res.coreId === coreId
            );
          }
        }

        if (myResults.length === 0) {
          const stageHistory = freshTransformer?.testHistory?.[`${stage}_test`] as any;
          if (stageHistory?.ps_results?.length > 0) {
            myResults = stageHistory.ps_results.filter((res: any) =>
              res.internalCoreNo === coreId || res.coreId === coreId
            );
          }
        }

        if (myResults.length === 0 && sourceStage && sourceStage !== stage) {
          const sourceHistory = freshTransformer?.testHistory?.[`${sourceStage}_test`] as any;
          if (sourceHistory?.ps_results?.length > 0) {
            myResults = sourceHistory.ps_results.filter((res: any) =>
              res.internalCoreNo === coreId || res.coreId === coreId
            );
          }
        }

        if (myResults.length > 0) {
          console.log(`Found saved PS results for ${stage}, loading...`, myResults);

          // Map saved results back to state
          // We need to match by ratioValue to ensure order
          setPsData((prevData: PSRow[]) => {
            return prevData.map((row: PSRow, index: number) => {
              // 1. Try Exact Match
              let savedRow = myResults.find((r: any) => r.ratioValue === row.ratioValue);

              // 2. Fallback: Match by index
              if (!savedRow && myResults[index]) {
                savedRow = myResults[index];
              }

              // 3. Fallback for "N/A"
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
  }, [(transformer as any).uniqueId, coreId, failedStatus, isFailedCore, retestHistory]);

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


      let response;
      if (isFailedSection && failedTransformerId) {
        response = await axios.put(`/failed-transformers/${failedTransformerId}/retest-save`, {
            treatedReadings: payload.ps_results,
            treatedBy: testerName,
            remarks: "Treated After Primary Failure via PS Report",
            coreType: 'ps'
        }, { withCredentials: true });
      } else {
        const endpoint = `/transformer-${stage}-ps-tests`;
        // 2. Execute POST request
        response = await axios.post(
          endpoint,
          payload,
          { withCredentials: true }
        );
      }


      if (onCompleteTimer) await onCompleteTimer();

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
    const limitRatio = psLimit?.psRatioErrorLimit ?? 0.25;
    const limitMulti = psLimit?.psExcitationMultiplier ?? 1.5;

    let reasons: string[] = [];
    let isRatioPass: boolean | null = null;
    let isExcitationPass: boolean | null = null;

    if (row.turnRatioError && row.turnRatioError.trim() !== '') {
      const ratioError = parseFloat(row.turnRatioError);
      if (!isNaN(ratioError)) {
        isRatioPass = ratioError > -limitRatio && ratioError < limitRatio;
        if (!isRatioPass) {
          reasons.push(`Ratio Error (${ratioError}) meets or exceeds ±${limitRatio} limit`);
        }
      }
    }

    if (row.iexVk && row.iexVk.trim() !== '' && row.iex11Vk && row.iex11Vk.trim() !== '') {
      const iexVk = parseFloat(row.iexVk);
      const iex11Vk = parseFloat(row.iex11Vk);
      if (!isNaN(iexVk) && !isNaN(iex11Vk)) {
        const calculatedValue = iexVk * limitMulti;
        isExcitationPass = calculatedValue > iex11Vk;
        if (!isExcitationPass) {
          reasons.push(`Excitation check failed: IexVk * ${limitMulti} (${calculatedValue.toFixed(2)}) is not > Iex11Vk (${iex11Vk})`);
        }
      }
    }

    if (isRatioPass === false || isExcitationPass === false) {
      return { isPass: false, reason: reasons.join('; ') };
    }

    const isCompleted = (row.turnRatioError && row.turnRatioError.trim() !== '') &&
                        (row.iexVk && row.iexVk.trim() !== '') &&
                        (row.iex11Vk && row.iex11Vk.trim() !== '');

    if (isCompleted && isRatioPass === true && isExcitationPass === true) {
      return { isPass: true, reason: null };
    }

    return { isPass: null, reason: null };
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

        if (row.turnRatioError && row.turnRatioError.trim() !== '' && (isNaN(ratioErr) || ratioErr <= -limitRatio || ratioErr >= limitRatio)) {
          reasons.push(`Row ${idx + 1} (Ratio ${row.ratioValue}): Ratio Error ${row.turnRatioError} meets or exceeds ±${limitRatio} limit.`);
        }

        if (row.iexVk && row.iexVk.trim() !== '' && row.iex11Vk && row.iex11Vk.trim() !== '' && !isNaN(iexVk) && !isNaN(iex11Vk) && (iexVk * limitMulti) <= iex11Vk) {
          reasons.push(`Row ${idx + 1} (Ratio ${row.ratioValue}): Excitation check failed (IexVk*${limitMulti} <= Iex11Vk).`);
        }
      }
    });

    const finalReason = reasons.length > 0 ? reasons.join(' | ') : "PS Core values out of specification";

    try {
      // Persist the entered test values to the transformer's history first
      await handleDatabaseSave();

      const orderObj = propOrder || (transformer as any).fullOrder || (transformer as any).orderId || (transformer as any).order;

      const payload = {
        transformerId: transformer.id || transformer._id,
        transformerUniqueId: transformer.uniqueId,
        orderId: (transformer as any).orderId?._id || (transformer as any).orderId || (transformer as any).order?._id || orderObj?._id || orderObj?.id,
        jobNumber: transformer.jobId || orderObj?.jobId || '',
        clientName: transformer.clientName || orderObj?.clientName || '',
        coreType: "PS",
        testType: stage === 'primary' ? "After Primary PS" : stage === 'final' ? "Final PS" : "Secondary PS",
        failureParameters: { failureStage: `${stage}_ps_test`, dynamicValues: psData, coreId: coreId },
        failureReason: finalReason,
        reportedBy: testerName,
        stage: stage === 'primary' ? "PRIMARY_TESTING" : stage === 'final' ? "FINAL_TESTING" : "SECONDARY_TESTING",
        status: "FAILED"
      };

      console.log("[DEBUG] Frontend Failed Transformer Payload:", payload);

      const response = await axios.post(`/failed-transformers`, payload, { withCredentials: true });
      if (response.data.success) {
        toast.success(response.data.message || "Transformer marked as failed successfully.");
        if (onRefresh) onRefresh();
        if (onFail) onFail(); else onBack();
      } else {
        toast.error("Failed to add to failed transformers.");
      }
    } catch (error: any) {
      console.error("Mark as failed error:", error);
      toast.error(error.response?.data?.message || "Error adding to failed transformers");
    }
  };

  if (isUnified) {
    return (
      <div className="ae-section-container print:break-inside-avoid print:mt-6" style={{ pageBreakInside: 'avoid', marginTop: 24 }}>
        <ReportSectionTitle title={`${(transformer as any).voltageRating || '33'} KV, CT, ${dynamicRatios.join('-')}A, CLASS PS SPECIAL PROTECTION CORE TEST`} />
        <div className="mt-2 mb-2">
          <ReportSpecBox
            items={[
              { label: 'Core Number', value: `Core ${coreNumber || 1}` },
              { label: 'Core ID', value: coreId },
              { label: 'Core Type', value: 'PS' },
              { label: 'CT Ratio', value: `${dynamicRatios.join('-')} A` },
              { label: 'Burden', value: `${displayBurden} VA` },
              { label: 'Class', value: accuracyClass || 'PS' },
              { label: 'STC', value: displaySTC }
            ]}
          />
        </div>
        <table className="ae-report-table secondary-report-table ps-core-table">
          <colgroup>
            <col style={{ width: '14%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '19%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>PS Core Ratio</th>
              <th>Turn Ratio Error @ 100% (%)</th>
              <th>Resistance (Ω)</th>
              <th>Vk (V)</th>
              <th>Iex at Vk (mA)</th>
              <th>Iex at 1.1Vk (mA)</th>
            </tr>
          </thead>
          <tbody>
            {psData.map((row: PSRow, i: number) => {
              const ratioErrorHasError = row.turnRatioError && !isNaN(parseFloat(row.turnRatioError)) && !(parseFloat(row.turnRatioError) > -(psLimit?.psRatioErrorLimit ?? 0.25) && parseFloat(row.turnRatioError) < (psLimit?.psRatioErrorLimit ?? 0.25));
              const iexHasError = row.iexVk && row.iex11Vk && !isNaN(parseFloat(row.iexVk)) && !isNaN(parseFloat(row.iex11Vk)) && !((parseFloat(row.iexVk) * (psLimit?.psExcitationMultiplier ?? 1.5)) > parseFloat(row.iex11Vk));

              return (
                <tr key={i}>
                  <td className="ae-ratio-cell font-bold">
                    {row.ratioValue}
                  </td>
                  <td className="input-cell">
                    <div className={`p-2 text-center font-bold text-xs ${ratioErrorHasError ? 'invalid-reading' : 'text-[#103b63]'}`}>
                      {renderVal(row.turnRatioError)}
                    </div>
                  </td>
                  <td className="input-cell">
                    <div className="p-2 text-center text-[#103b63] font-bold text-xs">
                      {renderVal(row.resistance)}
                    </div>
                  </td>
                  <td className="p-2 align-middle">
                    <div className="vk-cell-fields">
                      <div className="vk-cell-row">
                        <span className="vk-cell-label">Vk=</span>
                        <div className="text-left font-bold text-xs text-[#103b63] px-2 vk-input">
                          {renderVal(row.vk)}
                        </div>
                      </div>
                      <div className="vk-cell-row">
                        <span className="vk-cell-label">1.1Vk=</span>
                        <div className="text-left font-bold text-xs text-[#103b63] px-2 vk-input">
                          {renderVal(row.vkVal)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="input-cell">
                    <div className={`p-2 text-center font-bold text-xs ${iexHasError ? 'invalid-reading' : 'text-[#103b63]'}`}>
                      {renderVal(row.iexVk)}
                    </div>
                  </td>
                  <td className="input-cell">
                    <div className={`p-2 text-center font-bold text-xs ${iexHasError ? 'invalid-reading' : 'text-[#103b63]'}`}>
                      {renderVal(row.iex11Vk)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-gray-50 py-4 flex justify-start md:justify-center no-print-scroll">
      <style>{secondaryReportPrintStyles}</style>

      <div className="print-container w-[210mm] min-w-[210mm] print:w-full print:min-w-0 print:max-w-full secondary-print-page">
        {!readOnly && (
          <div className="flex items-center justify-between no-print mb-4 w-full">
            <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <div className="flex gap-2">
              {hasFailures && !isFailedSection && (
                <Button variant="destructive" size="sm" onClick={handleMarkAsFailed} className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md">
                  <AlertTriangle className="w-4 h-4" /> Add to Failed Transformer
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleDatabaseSave} className="gap-2"><Save className="w-4 h-4" /> Save</Button>
              {onPrev && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onPrev} 
                  className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 font-medium shadow-sm transition-all duration-200 hover:scale-105"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous Core
                </Button>
              )}
              {onNext && (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={onNext} 
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all duration-200 hover:scale-105"
                >
                  Next Core <ChevronRight className="w-4 h-4" />
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2"><Printer className="w-4 h-4" /> Print</Button>
            </div>
          </div>
        )}

        <div ref={printRef} id="secondary-printable-report" className="report-wrapper secondary-report-wrapper">
          <ReportHeader
            stage={stage}
            date={formatReportDate(stage && transformer.testHistory?.[`${stage}_test` as keyof typeof transformer.testHistory]?.reportDate)}
            orderNo={(transformer as any).jobId || (transformer as any).uniqueId}
            client={(transformer as any).clientName || 'N/A'}
            unitNo={transformer.uniqueId}
            accuracyClass={accuracyClass || 'PS'}
          />

          <div className="ae-section-container">
            <ReportSectionTitle index={1} title="Testing Record of Current Transformer" />
            <ReportSpecBox
              items={[
                { label: 'Specification', value: `${(transformer as any).voltageRating || '33'} KV` },
                { label: 'CT Ratio', value: `${dynamicRatios.join('-')} A` },
                { label: 'Burden', value: `${displayBurden} VA` },
                { label: 'Class', value: accuracyClass || 'PS' },
                { label: 'STC', value: displaySTC }
              ]}
            />
          </div>

          <div className="ae-section-container">
            <ReportSectionTitle index={2} title="CLASS PS SPECIAL PROTECTION CORE TEST" />
            <CoreInformationBar label="PS Core No" value={coreId} />
            <table className="ae-report-table secondary-report-table ps-core-table">
              <colgroup>
                <col style={{ width: '14%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '19%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>PS Core Ratio</th>
                  <th>Turn Ratio Error @ 100% (%)</th>
                  <th>Resistance (Ω)</th>
                  <th>Vk (V)</th>
                  <th>Iex at Vk (mA)</th>
                  <th>Iex at 1.1Vk (mA)</th>
                </tr>
              </thead>
              <tbody>
                {psData.map((row: PSRow, i: number) => {

                  const ratioErrorHasError = row.turnRatioError && !isNaN(parseFloat(row.turnRatioError)) && !(parseFloat(row.turnRatioError) > -(psLimit?.psRatioErrorLimit ?? 0.25) && parseFloat(row.turnRatioError) < (psLimit?.psRatioErrorLimit ?? 0.25));
                  const iexHasError = row.iexVk && row.iex11Vk && !isNaN(parseFloat(row.iexVk)) && !isNaN(parseFloat(row.iex11Vk)) && !((parseFloat(row.iexVk) * (psLimit?.psExcitationMultiplier ?? 1.5)) > parseFloat(row.iex11Vk));

                  return (
                    <tr key={i}>
                      <td className="ae-ratio-cell font-bold">
                        {row.ratioValue}
                      </td>
                      <td className="input-cell">
                        {readOnly ? (
                          <div className={`p-2 text-center font-bold text-xs ${ratioErrorHasError ? 'invalid-reading' : 'text-[#103b63]'}`}>
                            {renderVal(row.turnRatioError)}
                          </div>
                        ) : (
                          <Input
                            className={`input-field ps-input ${ratioErrorHasError ? 'invalid-reading' : ''}`}
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
                      <td className="input-cell">
                        {readOnly ? (
                          <div className="p-2 text-center text-[#103b63] font-bold text-xs">
                            {renderVal(row.resistance)}
                          </div>
                        ) : (
                          <Input
                            className="input-field ps-input"
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
                      <td className="p-2 align-middle">
                        <div className="vk-cell-fields">
                          <div className="vk-cell-row">
                            <span className="vk-cell-label">Vk=</span>
                            {readOnly ? (
                              <div className="text-left font-bold text-xs text-[#103b63] px-2 vk-input">
                                {renderVal(row.vk)}
                              </div>
                            ) : (
                              <Input
                                className="input-field vk-input"
                                value={row.vk || ''}
                                placeholder=""
                                onKeyDown={(e) => {
                                  if (e.ctrlKey || e.metaKey || ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter", "."].includes(e.key)) return;
                                  if (!/^[0-9+\-]$/.test(e.key)) e.preventDefault();
                                }}
                                onChange={e => handleUpdate(i, 'vk', e.target.value.replace(/[^0-9+\-.]/g, ''))}
                                disabled={readOnly}
                              />
                            )}
                          </div>
                          <div className="vk-cell-row">
                            <span className="vk-cell-label">1.1Vk=</span>
                            {readOnly ? (
                              <div className="text-left font-bold text-xs text-[#103b63] px-2 vk-input">
                                {renderVal(row.vkVal)}
                              </div>
                            ) : (
                              <Input
                                className="input-field vk-input"
                                value={row.vkVal || ''}
                                placeholder=""
                                onKeyDown={(e) => {
                                  if (e.ctrlKey || e.metaKey || ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter", "."].includes(e.key)) return;
                                  if (!/^[0-9+\-]$/.test(e.key)) e.preventDefault();
                                }}
                                onChange={e => handleUpdate(i, 'vkVal', e.target.value.replace(/[^0-9+\-.]/g, ''))}
                                disabled={readOnly}
                              />
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="input-cell">
                        {readOnly ? (
                          <div className={`p-2 text-center font-bold text-xs ${iexHasError ? 'invalid-reading' : 'text-[#103b63]'}`}>
                            {renderVal(row.iexVk)}
                          </div>
                        ) : (
                          <Input
                            className={`input-field ps-input ${iexHasError ? 'invalid-reading' : ''}`}
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
                      <td className="input-cell">
                        {readOnly ? (
                          <div className={`p-2 text-center font-bold text-xs ${iexHasError ? 'invalid-reading' : 'text-[#103b63]'}`}>
                            {renderVal(row.iex11Vk)}
                          </div>
                        ) : (
                          <Input
                            className={`input-field ps-input ${iexHasError ? 'invalid-reading' : ''}`}
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ReportSignatures testerName={testerName} hideStampAndSignature={true} />
        </div>
      </div>
    </div>
  );
}

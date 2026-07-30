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
import { Card } from '../ui/card';
import { ArrowLeft, Save, Printer, AlertTriangle, ChevronLeft, ChevronRight, CheckCircle, RefreshCw, Loader2, Wrench, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Transformer } from './SecondaryTransformersList';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { handleTableGridKeyDown, handleInputFocus } from '@/utils/tableKeyNavigation';
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
  stage?: 'secondary' | 'primary' | 'final' | 'inspection';
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
  onNext?: (() => void) | undefined;
  onPrev?: (() => void) | undefined;
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
  const [saving, setSaving] = useState(false);
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
    let myResults: any[] = [];

    const isMatch = (res: any, targetId: string) => {
      if (!res) return false;
      const id = String(res.internalCoreNo || res.coreId || '').trim();
      const target = String(targetId || '').trim();
      if (!id || !target) return false;
      if (id === target || id.endsWith(target) || target.endsWith(id)) return true;
      if (coreNumber) {
        const suffix = `-${String(coreNumber).padStart(3, '0')}`;
        if (id.endsWith(suffix) || target.endsWith(suffix) || id === String(coreNumber)) return true;
      }
      return false;
    };

    const stageHistory = transformer.testHistory?.[`${stage}_test` as keyof typeof transformer.testHistory] as any;
    if (stageHistory?.ps_results?.length > 0) {
      myResults = stageHistory.ps_results.filter((res: any) => isMatch(res, coreId));
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

  const [approvedCores, setApprovedCores] = useState<string[]>([]);
  const [secondaryTestedCores, setSecondaryTestedCores] = useState<string[]>([]);
  const [selectedCoreId, setSelectedCoreId] = useState<string>(coreId);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [selectSearch, setSelectSearch] = useState('');

  // Replace Core Modal State
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [availableReadyCores, setAvailableReadyCores] = useState<any[]>([]);
  const [loadingReadyCores, setLoadingReadyCores] = useState(false);
  const [selectedNewCoreId, setSelectedNewCoreId] = useState('');
  const [isReplacingCore, setIsReplacingCore] = useState(false);
  const [coreSearchTerm, setCoreSearchTerm] = useState('');

  const filteredReadyCores = React.useMemo(() => {
    if (!coreSearchTerm.trim()) return availableReadyCores;
    const term = coreSearchTerm.toLowerCase();
    return availableReadyCores.filter((c: any) => {
      const idStr = (c.coreId || c.id || '').toLowerCase();
      const turnsStr = (c.specifications?.turns || '').toString().toLowerCase();
      const typeStr = (c.coreType || '').toLowerCase();
      return idStr.includes(term) || turnsStr.includes(term) || typeStr.includes(term);
    });
  }, [availableReadyCores, coreSearchTerm]);

  const handleOpenReplaceModal = async () => {
    setIsReplaceModalOpen(true);
    setLoadingReadyCores(true);
    setCoreSearchTerm('');
    setSelectedNewCoreId('');
    try {
      const res = await axios.get('/ready-transformers/available?coreType=PS', { withCredentials: true });
      setAvailableReadyCores(res.data || []);
    } catch (err) {
      toast.error("Failed to load available ready stock cores");
    } finally {
      setLoadingReadyCores(false);
    }
  };

  const handleConfirmReplaceCore = async () => {
    if (!selectedNewCoreId) {
      toast.error("Please select a replacement core from Ready Stock");
      return;
    }
    try {
      setIsReplacingCore(true);
      const orderObj = propOrder || (transformer as any).fullOrder || (transformer as any).orderId;
      const orderId = (transformer as any).orderId?._id || (transformer as any).orderId || orderObj?._id || orderObj?.id;

      const res = await axios.post('/secondary-core-tests/replace-failed-core', {
        orderId,
        transformerId: transformer.id || (transformer as any)._id,
        uniqueId: transformer.uniqueId,
        oldCoreId: selectedCoreId,
        newCoreId: selectedNewCoreId,
        coreType: 'PS',
        failureReason: "Failed Secondary PS Test"
      }, { withCredentials: true });

      if (res.data?.success) {
        const replacedCoreId = selectedNewCoreId;
        toast.success(`Core ${selectedCoreId} moved to Failed Cores. Replaced with ${replacedCoreId}!`);
        setIsReplaceModalOpen(false);
        setSelectedCoreId(replacedCoreId);
        setPsData(dynamicRatios.map((ratio: string) => ({
          ratioValue: ratio,
          turnRatioError: '',
          resistance: '',
          vk: '',
          vkVal: '',
          iexVk: '',
          iex11Vk: ''
        })));
        await fetchApprovedCores();
        if (onRefresh) onRefresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to replace core");
    } finally {
      setIsReplacingCore(false);
    }
  };

  const fetchApprovedCores = React.useCallback(async () => {
    const order = propOrder || (transformer as any).fullOrder || (transformer as any).orderId;
    const orderId = order?._id || order;
    if (!orderId || readOnly) return;
    try {
      const [appRes, secRes] = await Promise.all([
        axios.get(`/core-tests/approved-ids/${orderId}`, { withCredentials: true }),
        axios.get(`/secondary-core-tests/ready-stock/${orderId}`, { withCredentials: true })
      ]);
      if (appRes.data?.success) {
        const ids = appRes.data.ps || [];
        setApprovedCores(ids);
      }
      if (secRes.data?.success) {
        const testedIds = (secRes.data.ps || [])
          .filter((c: any) => c.status === 'Pass' || c.status === 'PASS' || c.status === 'Completed')
          .map((c: any) => c.coreId);
        setSecondaryTestedCores(testedIds);
      }
    } catch (err) {
      console.error("Failed to fetch approved core IDs", err);
    }
  }, [propOrder, (transformer as any).fullOrder, (transformer as any).orderId, readOnly]);

  React.useEffect(() => {
    fetchApprovedCores();
  }, [fetchApprovedCores]);

  React.useEffect(() => {
    if (coreId && coreId.trim() !== '') {
      setSelectedCoreId(coreId);
    }
  }, [coreId]);

  // ✅ LOAD DATA EFFECT
  React.useEffect(() => {
    let isCancelled = false;

    const fetchLatestData = async () => {
      const targetCoreId = coreId || selectedCoreId;
      try {
        const initialBlank = dynamicRatios.map((ratio: string) => ({
          ratioValue: ratio,
          turnRatioError: '',
          resistance: '',
          vk: '',
          vkVal: '',
          iexVk: '',
          iex11Vk: ''
        }));

        if (stage === 'inspection') {
          let currentInspectionData = (transformer as any).inspectionData || {};
          try {
            const checkRes = await axios.get(`/final/inspection/${encodeURIComponent((transformer as any).uniqueId)}`, { withCredentials: true });
            if (checkRes.data.success && checkRes.data.data) {
              currentInspectionData = checkRes.data.data;
            }
          } catch (e) {
            console.error("Failed to fetch latest inspection data in fetchLatestData (PS)", e);
          }
          if (isCancelled) return;
          const savedResults = (currentInspectionData as any).coreTests?.[targetCoreId];
          if (savedResults && savedResults.ps_results) {
            setPsData((prevData: PSRow[]) => {
              const base = prevData.length > 0 ? prevData : initialBlank;
              return base.map((row: PSRow, index: number) => {
                let savedRow = savedResults.ps_results.find((r: any) => r.ratioValue === row.ratioValue);
                if (!savedRow && savedResults.ps_results[index]) {
                  savedRow = savedResults.ps_results[index];
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
            });
          } else {
            setPsData(initialBlank);
          }
          return;
        }

        const order = propOrder || (transformer as any).fullOrder || (transformer as any).orderId;
        const orderId = order?._id || order;

        if (targetCoreId && targetCoreId.trim() !== '') {
          try {
            const res = await axios.get(`/secondary-core-tests/ps/${targetCoreId}${orderId ? `?orderId=${orderId}` : ''}`, { withCredentials: true });
            if (isCancelled) return;
            if (res.data?.success && res.data.data) {
              const testDoc = res.data.data;
              if (testDoc.ps_results && testDoc.ps_results.length > 0) {
                setPsData((prevData: PSRow[]) => {
                  const base = prevData.length > 0 ? prevData : initialBlank;
                  return base.map((row: PSRow, index: number) => {
                    let savedRow = testDoc.ps_results.find((r: any) => r.ratioValue === row.ratioValue);
                    if (!savedRow && testDoc.ps_results[index]) {
                      savedRow = testDoc.ps_results[index];
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
                });
                return;
              }
            }
          } catch (err) {
            console.warn("Could not fetch secondary PS test by coreId, falling back", err);
          }
          if (transformer.isDummy) {
            if (!isCancelled) setPsData(initialBlank);
            return;
          }
        }

        const res = await axios.get(`/transformers/${(transformer as any).uniqueId}`, { withCredentials: true });
        if (isCancelled) return;
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
          if (isCancelled) return;
        }

        const isMatch = (res: any, targetId: string) => {
          if (!res) return false;
          const id = String(res.internalCoreNo || res.coreId || '').trim();
          const target = String(targetId || '').trim();
          if (!id || !target) return false;
          if (id === target || id.endsWith(target) || target.endsWith(id)) return true;
          if (coreNumber) {
            const suffix = `-${String(coreNumber).padStart(3, '0')}`;
            if (id.endsWith(suffix) || target.endsWith(suffix) || id === String(coreNumber)) return true;
          }
          return false;
        };

        // Priority 1: Check if core was retested / updated in Failed Transformers section (retestHistory)
        if (isFailedSection && currentRetestHistory && Array.isArray(currentRetestHistory)) {
          const latestRetest = currentRetestHistory.slice().reverse().find((h: any) =>
            h.newTreatmentReadings && Array.isArray(h.newTreatmentReadings) &&
            h.newTreatmentReadings.some((r: any) => isMatch(r, targetCoreId))
          );
          if (latestRetest) {
            myResults = latestRetest.newTreatmentReadings.filter((res: any) => isMatch(res, targetCoreId));
          }
        }

        // Priority 2: If no retested readings saved yet, fetch strictly from stage history where it failed
        if (myResults.length === 0) {
          const stageKey = `${stage}_test` as keyof typeof freshTransformer.testHistory;
          const stageHistory = freshTransformer?.testHistory?.[stageKey] as any;
          if (stageHistory?.ps_results?.length > 0) {
            myResults = stageHistory.ps_results.filter((res: any) => isMatch(res, targetCoreId));
          }
        }

        if (myResults.length > 0) {
          setPsData((prevData: PSRow[]) => {
            const base = prevData.length > 0 ? prevData : initialBlank;
            return base.map((row: PSRow, index: number) => {
              let savedRow = myResults.find((r: any) => r.ratioValue === row.ratioValue);
              if (!savedRow && myResults[index]) {
                savedRow = myResults[index];
              }
              if (savedRow) {
                if (savedRow.accuracyClass && savedRow.accuracyClass !== 'N/A' && savedRow.accuracyClass !== accuracyClass) {
                  setAccuracyClass(savedRow.accuracyClass);
                }
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
          });
        } else {
          if (!isCancelled) setPsData(initialBlank);
        }
      } catch (err) {
        if (!isCancelled) console.error("Failed to load existing PS data", err);
      }
    };

    fetchLatestData();

    return () => {
      isCancelled = true;
    };
  }, [(transformer as any).uniqueId, selectedCoreId, coreId, failedStatus, isFailedCore, retestHistory]);

  const handleUpdate = (idx: number, field: keyof PSRow, val: string) => {
    if (readOnly) return;
    const updated = [...psData];

    if (updated[idx]) {
      updated[idx] = { ...updated[idx], [field]: val } as PSRow;

      // Auto-calculate 1.1Vk if Vk changes
      if (field === 'vk') {
        const floatVal = parseFloat(val);
        if (!isNaN(floatVal)) {
          updated[idx].vkVal = (floatVal * 1.1).toFixed(2);
        } else {
          updated[idx].vkVal = '';
        }
      }
    }

    setPsData(updated);
  };

  const areAllReadingsFilled = () => {
    return psData.every(row => 
      row.turnRatioError !== null && row.turnRatioError !== undefined && String(row.turnRatioError).trim() !== '' &&
      row.resistance !== null && row.resistance !== undefined && String(row.resistance).trim() !== '' &&
      row.vk !== null && row.vk !== undefined && String(row.vk).trim() !== '' &&
      row.vkVal !== null && row.vkVal !== undefined && String(row.vkVal).trim() !== '' &&
      row.iexVk !== null && row.iexVk !== undefined && String(row.iexVk).trim() !== '' &&
      row.iex11Vk !== null && row.iex11Vk !== undefined && String(row.iex11Vk).trim() !== ''
    );
  };

  const handleDatabaseSave = async (isApprove: boolean = false) => {
    if (readOnly) return;
    setSaving(true);
    console.log("handleDatabaseSave (PS): STARTED");
    try {
      // 1. Prepare the payload based on PSBlockSchema
      const payload = {
        uniqueId: (transformer as any).uniqueId,
        orderId: typeof (transformer as any).orderId === 'object' && (transformer as any).orderId ? ((transformer as any).orderId as any)._id : (transformer as any).orderId,
        tester: testerName, // Use prop directly
        coreId: selectedCoreId,
        stage: stage, // Add stage info if helpful for backend logging
        status: isApprove ? "Pass" : "In-Progress",
        ps_results: psData.map((row: any) => {
          const validation = validatePSRow(row);
          return {
            internalCoreNo: selectedCoreId,
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
      if (stage === 'inspection') {
        let currentInspectionData = {};
        try {
          const checkRes = await axios.get(`/final/inspection/${encodeURIComponent((transformer as any).uniqueId)}`, { withCredentials: true });
          if (checkRes.data.success && checkRes.data.data) {
            currentInspectionData = checkRes.data.data;
          }
        } catch (e) {
          console.error("Failed to load existing inspection data for merge, using prop defaults", e);
          currentInspectionData = (transformer as any).inspectionData || {};
        }

        const updatedCoreTests = {
            ...((currentInspectionData as any).coreTests || {}),
            [selectedCoreId]: payload
        };
        const updatedInspectionData = {
            ...currentInspectionData,
            coreTests: updatedCoreTests
        };
        response = await axios.post(`/final/inspection/${encodeURIComponent((transformer as any).uniqueId)}`, updatedInspectionData, { withCredentials: true });
      } else if (isFailedSection && failedTransformerId) {
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
      if (onRefresh) onRefresh();

      if (isApprove) {
        setSecondaryTestedCores(prev => [...new Set([...prev, selectedCoreId])]);
        toast.success("Secondary PS Core Approved successfully!");
        if (onNext) onNext(); else onBack();
      } else {
        toast.success("Secondary PS Test results saved successfully!");
      }

    } catch (error: any) {
      console.error("handleDatabaseSave (PS): ERROR", error);
      toast.error(error.response?.data?.message || "Failed to save PS data to database.");
    } finally {
      setSaving(false);
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
  const hasFailures = React.useMemo(() => {
    const isOldCoreFailed = (selectedCoreId === coreId) && (isFailedCore || failedStatus === 'FAILED');
    if (isOldCoreFailed) return true;
    return psData.some(row => {
      const status = calculateRowStatus(row);
      if (status === false) return true;
      const ratioErr = parseFloat(row.turnRatioError);
      const limitRatio = psLimit?.psRatioErrorLimit ?? 0.25;
      if (row.turnRatioError && row.turnRatioError.trim() !== '' && !isNaN(ratioErr) && Math.abs(ratioErr) >= limitRatio) return true;
      const iexVk = parseFloat(row.iexVk);
      const iex11Vk = parseFloat(row.iex11Vk);
      const limitMulti = psLimit?.psExcitationMultiplier ?? 1.5;
      if (row.iexVk && row.iexVk.trim() !== '' && row.iex11Vk && row.iex11Vk.trim() !== '' && !isNaN(iexVk) && !isNaN(iex11Vk) && (iexVk * limitMulti) <= iex11Vk) return true;
      return false;
    });
  }, [psData, psLimit, isFailedCore, failedStatus, selectedCoreId, coreId]);

  const [isFailModalOpen, setIsFailModalOpen] = useState(false);
  const [failRemark, setFailRemark] = useState('');

  const handleMarkAsFailed = () => {
    if (readOnly) return;
    setIsFailModalOpen(true);
  };

  const handleConfirmMarkAsFailed = async () => {
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
        failureParameters: { failureStage: `${stage}_ps_test`, dynamicValues: psData, coreId: selectedCoreId },
        failureReason: finalReason,
        remark: failRemark.trim() || undefined,
        reportedBy: testerName,
        stage: stage === 'primary' ? "PRIMARY_TESTING" : stage === 'final' ? "FINAL_TESTING" : "SECONDARY_TESTING",
        status: "FAILED"
      };

      console.log("[DEBUG] Frontend Failed Transformer Payload:", payload);

      const response = await axios.post(`/failed-transformers`, payload, { withCredentials: true });
      setIsFailModalOpen(false);
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

  const failModalJSX = isFailModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
      <Card className="w-full max-w-md p-6 bg-white shadow-2xl rounded-xl border border-gray-100 flex flex-col gap-4 animate-in fade-in duration-200">
        <div>
          <h3 className="text-lg font-bold text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Add Transformer to Failed List
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Transformer: <span className="font-mono font-bold text-gray-800">{transformer.uniqueId}</span>
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-700">Optional Tester Remark / Note:</label>
          <textarea
            value={failRemark}
            onChange={(e) => setFailRemark(e.target.value)}
            placeholder="Enter optional remark or failure notes..."
            rows={3}
            className="w-full p-2.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={() => setIsFailModalOpen(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white font-bold"
            onClick={handleConfirmMarkAsFailed}
          >
            Confirm & Add to Failed
          </Button>
        </div>
      </Card>
    </div>
  );

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
    <div className="w-full flex flex-col">
    <div className="w-full overflow-x-auto bg-gray-50 py-4 flex justify-start md:justify-center no-print-scroll">
      <style>{secondaryReportPrintStyles}</style>

      <div className="print-container w-[210mm] min-w-[210mm] print:w-full print:min-w-0 print:max-w-full secondary-print-page">
        {!readOnly && (
          <div className="flex items-center justify-between no-print mb-4 w-full">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  if (!readOnly) await handleDatabaseSave(false);
                  onBack();
                }}
                disabled={saving}
                className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Testing
              </Button>
              {onPrev && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={async () => {
                    if (!readOnly) await handleDatabaseSave(false);
                    onPrev();
                  }}
                  disabled={saving || !onPrev}
                  className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous Core
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {stage === 'secondary' && !readOnly && hasFailures && (
                <Button
                  onClick={handleOpenReplaceModal}
                  variant="outline"
                  size="sm"
                  className="gap-2 border-orange-500 text-orange-700 bg-orange-50 hover:bg-orange-100 font-bold shadow-sm"
                  title="Replace failed core with a new core from Ready Stock"
                >
                  <RefreshCw className="w-4 h-4 text-orange-600" />
                  Replace Core (Ready Stock)
                </Button>
              )}
              {stage !== 'secondary' && !readOnly && !transformer.isDummy && hasFailures && !isFailedSection && (
                <Button variant="destructive" size="sm" onClick={handleMarkAsFailed} className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md">
                  <AlertTriangle className="w-4 h-4" /> Add to Failed Transformer
                </Button>
              )}
              {!readOnly && (
                <>
                  <Button
                    onClick={() => handleDatabaseSave(false)}
                    disabled={saving}
                    variant="outline"
                    className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Draft'}
                  </Button>
                  {stage === 'secondary' && areAllReadingsFilled() && (
                    <Button
                      onClick={() => handleDatabaseSave(true)}
                      disabled={saving}
                      className="gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {saving ? 'Approving...' : 'Approve Core'}
                    </Button>
                  )}
                </>
              )}
              {onNext && (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={async () => {
                    if (!readOnly) await handleDatabaseSave(false);
                    onNext();
                  }} 
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all duration-200 hover:scale-105"
                >
                  {(stage === 'primary' || stage === 'final') ? 'Next' : 'Next Core'} <ChevronRight className="w-4 h-4" />
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
            {!readOnly && !isFailedSection && stage !== 'final' ? (
              <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-[#103b63]/20 shadow-sm max-w-md my-3 no-print relative">
                <span className="text-xs font-bold text-[#103b63] uppercase tracking-wide shrink-0">Select Core ID (from Core Testing):</span>
                <div className="relative flex-1">
                  <button
                    type="button"
                    onClick={() => setIsSelectOpen(!isSelectOpen)}
                    className="w-full p-2 text-xs font-bold rounded border border-gray-300 bg-white text-blue-800 text-left flex justify-between items-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <span>{selectedCoreId} {selectedCoreId === coreId ? '(Default)' : ''}</span>
                    <span className="text-gray-400">▼</span>
                  </button>

                  {isSelectOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsSelectOpen(false)} />
                      <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
                        <div className="p-2 border-b border-gray-200 bg-gray-50 shrink-0">
                          <input
                            type="text"
                            placeholder="Search Core ID..."
                            value={selectSearch}
                            onChange={(e) => setSelectSearch(e.target.value)}
                            className="w-full p-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        </div>
                        <div className="overflow-y-auto flex-1 max-h-40">
                          {(() => {
                            const isPrimaryOrFinal = stage === 'primary';
                            let availableList: string[] = [];
                            if (isPrimaryOrFinal) {
                              availableList.push(...secondaryTestedCores);
                              const secResults = (transformer.testHistory?.secondary_test as any)?.ps_results || [];
                              secResults.forEach((r: any) => { if (r.internalCoreNo) availableList.push(r.internalCoreNo); if (r.coreId) availableList.push(r.coreId); });
                              const secMetaId = (transformer.testHistory?.secondary_test as any)?.psCoreId;
                              if (secMetaId) availableList.push(secMetaId);
                              
                              const primResults = (transformer.testHistory?.primary_test as any)?.ps_results || [];
                              primResults.forEach((r: any) => { if (r.internalCoreNo) availableList.push(r.internalCoreNo); if (r.coreId) availableList.push(r.coreId); });
                              
                              if (selectedCoreId) availableList.push(selectedCoreId);
                            } else {
                              if (selectedCoreId && !secondaryTestedCores.includes(selectedCoreId)) {
                                availableList.push(selectedCoreId);
                              }
                              const untested = approvedCores.filter(id => !secondaryTestedCores.includes(id));
                              availableList.push(...untested);
                            }
                            return Array.from(new Set(availableList.filter(Boolean)));
                          })()
                            .filter(id => id.toLowerCase().includes(selectSearch.toLowerCase()))
                            .map(id => (
                              <button
                                key={id}
                                type="button"
                                onClick={() => {
                                  setSelectedCoreId(id);
                                  setIsSelectOpen(false);
                                  setSelectSearch('');
                                }}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-blue-50 hover:text-blue-800 transition-colors flex justify-between items-center ${
                                  id === selectedCoreId ? 'bg-blue-50 text-blue-800 font-bold' : 'text-gray-700'
                                }`}
                              >
                                <span>{id} {id === coreId ? '(Default)' : ''}</span>
                                {secondaryTestedCores.includes(id) && (
                                  <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Tested</span>
                                )}
                              </button>
                            ))
                          }
                          {approvedCores.length === 0 && secondaryTestedCores.length === 0 && !coreId && (
                            <div className="px-3 py-2 text-xs text-gray-500 italic text-center">
                              No matching cores
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <CoreInformationBar label="PS Core No" value={selectedCoreId} />
            )}
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
                            onKeyDown={handleTableGridKeyDown}
                            onFocus={handleInputFocus}
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
                            onKeyDown={handleTableGridKeyDown}
                            onFocus={handleInputFocus}
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
                                onKeyDown={handleTableGridKeyDown}
                                onFocus={handleInputFocus}
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
                                onKeyDown={handleTableGridKeyDown}
                                onFocus={handleInputFocus}
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
                            onKeyDown={handleTableGridKeyDown}
                            onFocus={handleInputFocus}
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
                            onKeyDown={handleTableGridKeyDown}
                            onFocus={handleInputFocus}
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

      {!readOnly && (
        <div className="no-print mt-6 mb-8 flex justify-center items-center gap-3">
          <Button
            onClick={async () => {
              await handleDatabaseSave(false);
              onBack();
            }}
            disabled={saving}
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-100 px-8 py-2.5 font-semibold text-sm shadow-sm gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Testing
          </Button>
          <Button
            onClick={() => handleDatabaseSave(false)}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white px-10 py-2.5 font-semibold text-sm shadow-sm gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
          {onNext && (
            <Button
              onClick={async () => {
                await handleDatabaseSave(false);
                onNext();
              }}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-2.5 font-semibold text-sm shadow-sm gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save & Next'}
            </Button>
          )}
        </div>
      )}
      {/* REPLACE CORE FROM READY STOCK MODAL */}
      {isReplaceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
          <div className="w-full max-w-md p-6 bg-white shadow-2xl rounded-xl border border-gray-100 flex flex-col gap-4 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange-500" />
                Core Replacement
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Replace failed core <span className="font-mono font-bold text-red-600">{selectedCoreId}</span> with a pre-tested core from Ready Stock.
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-xs font-bold text-red-800 uppercase">Failed Core Info:</div>
              <div className="text-sm text-red-700 mt-1 font-mono">
                <strong>Type:</strong> PS <br />
                <strong>Core Serial No:</strong> {selectedCoreId}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-500 block">
                Choose Core (from Ready Stock)
              </label>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by Core Serial or Turns..."
                  value={coreSearchTerm}
                  onChange={(e) => setCoreSearchTerm(e.target.value)}
                  className="pl-9 text-xs font-mono border-gray-300 h-9"
                />
              </div>

              {loadingReadyCores ? (
                <div className="flex items-center gap-2 py-4 text-xs text-gray-500 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                  Loading ready stock cores...
                </div>
              ) : filteredReadyCores.length === 0 ? (
                <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 mt-1">
                  {coreSearchTerm ? 'No ready stock cores match your search.' : 'No available cores in Ready Stock matching this type.'}
                </p>
              ) : (
                <select
                  value={selectedNewCoreId}
                  onChange={(e) => setSelectedNewCoreId(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm font-mono outline-none focus:border-orange-500 shadow-sm"
                >
                  <option value="">-- Select Replacement Core ({filteredReadyCores.length}) --</option>
                  {filteredReadyCores.map((c: any) => (
                    <option key={c._id || c.id} value={c.coreId || c.id}>
                      {c.coreId || c.id} {c.specifications?.turns ? `(Turns: ${c.specifications.turns})` : ''} ({c.coreType})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => setIsReplaceModalOpen(false)}
                disabled={isReplacingCore}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmReplaceCore}
                disabled={isReplacingCore || !selectedNewCoreId}
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs gap-1.5 font-bold"
              >
                {isReplacingCore ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Replacing...
                  </>
                ) : (
                  <>
                    <Wrench className="w-3.5 h-3.5" />
                    Confirm Replace
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      {failModalJSX}
    </div>
  );
}

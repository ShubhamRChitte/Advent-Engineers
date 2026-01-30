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

import { useState } from 'react';
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
}

interface ProtectionTestRow {
  ratio: string;
  burden100_1: string;
  burden100_2: string;
  resistance: string;
  secondaryLimitingVtg: string;
  excitationCurrent: string;
  compositeError: string;
}

export function SecondaryProtectionReport({
  transformer,
  coreNumber,
  coreId,
  testerName,
  onBack,
}: SecondaryProtectionReportProps) {
  
  // Dummy data array mimicking CT Ratios fetched from your database
  // The UI will dynamically generate one block for each ratio in this array
  const dummyDbRatios = ['200/1', '400/1', '800/1'];

  const [testResults, setTestResults] = useState<ProtectionTestRow[]>(
    dummyDbRatios.map(ratio => ({
      ratio,
      burden100_1:'',
      burden100_2:'',
      resistance: '',
      secondaryLimitingVtg: '',
      excitationCurrent: '',
      compositeError: ''
    }))
  );

  const handleInputChange = (index: number, field: keyof ProtectionTestRow, value: string) => {
    const updated = [...testResults];
    updated[index] = { ...updated[index], [field]: value };
    setTestResults(updated);
  };



  const handleDatabaseSave = async () => {
  console.log("handleDatabaseSave: STARTED (Protection)");
  try {
    // 1. Build the array based on your ProtectionBlockSchema
    const protectionResults = testResults.map(row => ({
      ratioValue: row.ratio,
      burden100_1: row.burden100_1,
      burden100_2: row.burden100_2,
      resistance: row.resistance,
      secondaryLimitingVtg: row.secondaryLimitingVtg,
      excitationCurrent: row.excitationCurrent,
      compositeError: row.compositeError
    }));

    console.log("handleDatabaseSave: protectionResults built", protectionResults);

    const payload = {
      uniqueId: transformer.uniqueId,
      loginType: "secondary_login", // Consistent with your schema path
      tester: testerName,
      coreId: coreId,
      protection_results: protectionResults
    };

    console.log("handleDatabaseSave: Payload ready", payload);

    console.log("handleDatabaseSave: Sending Request...");
    const response = await axios.post(
      "http://localhost:3002/transformer-secondary-protection-tests",
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
              <tr className="bg-gray-50">
                <th className="border border-gray-400 p-2 w-[140px]" rowSpan={2}>Core Ratio</th>
                <th className="border border-gray-400 p-2 w-[80px]" rowSpan={2}>100%</th>
                <th className="border border-gray-400 p-2 text-center" colSpan={4}>Protection Analysis Results</th>
              </tr>
              <tr className="bg-gray-50">
                <th className="border border-gray-400 p-2 text-center font-semibold">Resistance (Ω)</th>
                <th className="border border-gray-400 p-2 text-center font-semibold">Secondary Limiting Voltage</th>
                <th className="border border-gray-400 p-2 text-center font-semibold">Excitation Current</th>
                <th className="border border-gray-400 p-2 text-center font-semibold">Composite Error</th>
              </tr>
            </thead>
            <tbody>
              {testResults.map((row, index) => (
                <>
                  {/* First row of the block: Handling the ratio label and burden error */}
                  <tr key={`${index}-row1`}>
                    <td rowSpan={2} className="border border-gray-400 p-2 bg-[#ffff00] font-bold text-center align-middle">
                      Protection Core<br />Ratio - {row.ratio}
                    </td>
                   
                    
                    <td className="border border-gray-400 bg-gray-100">100%</td>
                    <td className="border border-gray-400 bg-gray-100"></td>
                    <td className="border border-gray-400 p-0">
                       <Input 
                        className="border-none text-center h-8 bg-transparent text-blue-800 font-medium" 
                        value={row.resistance} 
                        onChange={(e) => handleInputChange(index, 'burden100_1', e.target.value)} 
                        placeholder=""
                      />
                    </td>
                     <td className="border border-gray-400 p-0">
                       <Input 
                        className="border-none text-center h-8 bg-transparent text-blue-800 font-medium" 
                        value={row.resistance} 
                        onChange={(e) => handleInputChange(index, 'burden100_2', e.target.value)} 
                        placeholder=""
                      />
                    </td>
                      <td className="border border-gray-400 bg-gray-100"></td>
                  </tr>
                  {/* Second row of the block: The "Value" row with primary data */}
                  <tr key={`${index}-row2`}>
                    <td className="border border-gray-400 p-2 text-center font-bold bg-gray-50 uppercase text-[9px]">Value</td>
                     <td className="border border-gray-400 p-0">
                      <Input 
                        className="border-none text-center h-8 bg-transparent text-blue-800 font-bold" 
                        value={row.resistance} 
                        onChange={(e) => handleInputChange(index, 'resistance', e.target.value)} 
                      />
                    </td>
                    <td className="border border-gray-400 p-0">
                      <Input 
                        className="border-none text-center h-8 bg-transparent text-blue-800 font-bold" 
                        value={row.secondaryLimitingVtg} 
                        onChange={(e) => handleInputChange(index, 'secondaryLimitingVtg', e.target.value)} 
                      />
                    </td>
                    <td className="border border-gray-400 p-0">
                      <Input 
                        className="border-none text-center h-8 bg-transparent text-blue-800 font-bold" 
                        value={row.excitationCurrent} 
                        onChange={(e) => handleInputChange(index, 'excitationCurrent', e.target.value)} 
                      />
                    </td>
                    <td className="border border-gray-400 p-0">
                      <Input 
                        className="border-none text-center h-8 bg-transparent text-blue-800 font-bold" 
                        value={row.compositeError} 
                        onChange={(e) => handleInputChange(index, 'compositeError', e.target.value)} 
                      />
                    </td>
                  </tr>
                </>
              ))}
             
            </tbody>
          </table>
        </div>
      </Card>

      {/* Database Actions */}
      <div className="flex gap-3 no-print">
        <Button 
         onClick={handleDatabaseSave}
          className="bg-red-600 hover:bg-red-700 gap-2"
        >
          <Save className="w-4 h-4" /> Save to Database
        </Button>
      </div>
    </div>
  );
}
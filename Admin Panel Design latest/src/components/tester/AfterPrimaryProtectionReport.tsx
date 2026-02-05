// import { useState } from 'react';
// import { Card } from '../ui/card';
// import { Button } from '../ui/button';
// import { Input } from '../ui/input';
// import { ArrowLeft, Save, Download, Printer } from 'lucide-react';
// import { AfterPrimaryTransformer } from './AfterPrimaryTransformersList';

// interface CoreConfig {
//   coreNumber: number;
//   coreType: 'metering' | 'ps' | 'protection';
//   coreId: string;
// }

// interface AfterPrimaryProtectionReportProps {
//   transformer: AfterPrimaryTransformer;
//   core: CoreConfig;
//   testerName: string;
//   onBack: () => void;
// }

// export function AfterPrimaryProtectionReport({
//   transformer,
//   core,
//   testerName,
//   onBack,
// }: AfterPrimaryProtectionReportProps) {
//   const testDate = new Date().toLocaleDateString();

//   const [resistance, setResistance] = useState('');
//   const [secondaryLimitingVoltage, setSecondaryLimitingVoltage] = useState('');
//   const [excitationCurrent, setExcitationCurrent] = useState('');
//   const [bdvOfOil, setBdvOfOil] = useState('');

//   const handleSave = () => {
//     alert('Protection Test Report saved successfully!');
//   };

//   const handleGenerate = () => {
//     alert('Report generated and ready for download!');
//   };

//   const handlePrint = () => {
//     window.print();
//   };

//   // Extract ratio from transformer rating
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
//         <h2>After Primary Test - Protection Core</h2>
//         <p className="text-gray-500 mt-1">Core {core.coreNumber} - {core.coreId}</p>
//       </div>

//       {/* Main Report Card */}
//       <Card className="p-6">
//         {/* Report Header */}
//         <div className="text-center mb-6 pb-4 border-b-2 border-gray-800">
//           <h3 className="text-red-600 mb-2">TESTING RECORD OF CURRENT TRANSFORMER</h3>
//           <p className="text-sm">After Primary Test - Protection Core</p>
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
//                 <td className="p-2 text-sm border-r border-gray-300">CT Ratio</td>
//                 <td className="p-2 text-sm border-r border-gray-300">{transformer.bsat}</td>
//                 <td className="p-2 text-sm">Core Number: {core.coreNumber}</td>
//               </tr>
//               <tr className="border-b border-gray-300">
//                 <td className="p-2 text-sm border-r border-gray-300">Burden</td>
//                 <td className="p-2 text-sm border-r border-gray-300">{transformer.vaRating}</td>
//                 <td className="p-2 text-sm">Core ID: {core.coreId}</td>
//               </tr>
//               <tr className="border-b border-gray-300">
//                 <td className="p-2 text-sm border-r border-gray-300">Class</td>
//                 <td className="p-2 text-sm border-r border-gray-300">{transformer.classRating}</td>
//                 <td className="p-2 text-sm">Type: Protection</td>
//               </tr>
//               <tr>
//                 <td className="p-2 text-sm border-r border-gray-300">Unique ID</td>
//                 <td className="p-2 text-sm border-r border-gray-300">{transformer.uniqueId}</td>
//                 <td className="p-2 text-sm">Date: {testDate}</td>
//               </tr>
//             </tbody>
//           </table>
//         </div>

//         {/* Pretest After Primary Winding Header */}
//         <div className="bg-green-400 border border-gray-800 p-2 flex justify-between items-center mb-4">
//           <span className="font-medium">Pretest After Primary Winding - Protection Core</span>
//           <span>Core: {core.coreId}</span>
//         </div>

//         {/* Protection Core Test Table */}
//         <div className="mb-6">
//           <div className="overflow-x-auto">
//             <table className="w-full border-collapse border border-gray-300">
//               <thead>
//                 <tr className="bg-gray-100">
//                   <th rowSpan={2} className="border border-gray-300 p-2 text-sm"></th>
//                   <th rowSpan={2} className="border border-gray-300 p-2 text-sm">100%</th>
//                   <th className="border border-gray-300 p-2 text-sm">Resistance</th>
//                   <th className="border border-gray-300 p-2 text-sm bg-pink-100">Secondary Limiting Voltage</th>
//                   <th className="border border-gray-300 p-2 text-sm bg-pink-100">Excitation Current</th>
//                   <th colSpan={2} className="border border-gray-300 p-2 text-sm">NA</th>
//                 </tr>
//                 <tr className="bg-gray-100">
//                   <th className="border border-gray-300 p-2 text-sm"></th>
//                   <th className="border border-gray-300 p-2 text-sm"></th>
//                   <th className="border border-gray-300 p-2 text-sm"></th>
//                   <th className="border border-gray-300 p-2 text-sm">NA</th>
//                   <th className="border border-gray-300 p-2 text-sm">Composite Error</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 <tr>
//                   <td className="border border-gray-300 p-2 bg-green-100 font-medium text-sm">
//                     Protection<br />Core Ratio -<br />{ratio}/1
//                   </td>
//                   <td className="border border-gray-300 p-2 text-sm">100%</td>
//                   <td className="border border-gray-300 p-2">
//                     <Input
//                       className="h-8 text-sm"
//                       placeholder="Resistance"
//                       value={resistance}
//                       onChange={(e) => setResistance(e.target.value)}
//                     />
//                   </td>
//                   <td className="border border-gray-300 p-2">
//                     <Input
//                       className="h-8 text-sm"
//                       placeholder="Secondary Limiting Voltage"
//                       value={secondaryLimitingVoltage}
//                       onChange={(e) => setSecondaryLimitingVoltage(e.target.value)}
//                     />
//                   </td>
//                   <td className="border border-gray-300 p-2">
//                     <Input
//                       className="h-8 text-sm"
//                       placeholder="Excitation Current"
//                       value={excitationCurrent}
//                       onChange={(e) => setExcitationCurrent(e.target.value)}
//                     />
//                   </td>
//                   <td className="border border-gray-300 p-2 bg-gray-50 text-sm text-center">NA</td>
//                   <td className="border border-gray-300 p-2 bg-gray-50 text-sm text-center">NA</td>
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
//           <h4 className="mb-2">Auto-Loaded Core Information from Secondary Test:</h4>
//           <div className="grid grid-cols-2 gap-2 text-sm">
//             <div><span className="font-medium">Core Number:</span> {core.coreNumber}</div>
//             <div><span className="font-medium">Core ID:</span> <span className="text-green-600">{core.coreId}</span></div>
//             <div><span className="font-medium">Core Type:</span> Protection</div>
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

import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ArrowLeft, Save, Download, Printer } from 'lucide-react';
import { Transformer } from './SecondaryTransformersList';
import { toast } from 'sonner';

interface PrimaryProtectionReportProps {
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

export function AfterPrimaryProtectionReport({
  transformer,
  coreNumber,
  coreId,
  testerName,
  onBack,
}: PrimaryProtectionReportProps) {
  
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
      loginType: "primary_login", // Consistent with your schema path
      tester: testerName,
      coreId: coreId,
      protection_results: protectionResults
    };

    console.log("handleDatabaseSave: Payload ready", payload);

    console.log("handleDatabaseSave: Sending Request...");
    const response = await axios.post(
      "http://localhost:3002/transformer-primary-protection-tests",
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
          <h2 className="text-sm font-bold uppercase">Pretest After Primary Winding</h2>
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
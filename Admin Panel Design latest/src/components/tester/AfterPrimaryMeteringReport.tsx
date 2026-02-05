// import { useState } from 'react';
// import { Card } from '../ui/card';
// import { Button } from '../ui/button';
// import { Input } from '../ui/input';
// import { ArrowLeft, Save, Download, Printer } from 'lucide-react';
// import { AfterPrimaryTransformer } from './AfterPrimaryTransformersList';

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

// interface AfterPrimaryMeteringReportProps {
//   transformer: AfterPrimaryTransformer;
//   core: CoreConfig;
//   testerName: string;
//   onBack: () => void;
// }

// export function AfterPrimaryMeteringReport({
//   transformer,
//   core,
//   testerName,
//   onBack,
// }: AfterPrimaryMeteringReportProps) {
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
//     alert('Metering Test Report saved successfully!');
//   };

//   const handleGenerate = () => {
//     alert('Report generated and ready for download!');
//   };

//   const handlePrint = () => {
//     window.print();
//   };

//   // Extract ratio from transformer rating (e.g., "800-400-200/1-1-1A" -> get ratio for this core)
//   const getRatioForCore = () => {
//     // This would be determined by core configuration
//     // For demo, using core number to determine ratio
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
//         <h2>After Primary Test - Metering Core</h2>
//         <p className="text-gray-500 mt-1">Core {core.coreNumber} - {core.coreId}</p>
//       </div>

//       {/* Main Report Card */}
//       <Card className="p-6">
//         {/* Report Header */}
//         <div className="text-center mb-6 pb-4 border-b-2 border-gray-800">
//           <h3 className="text-red-600 mb-2">TESTING RECORD OF CURRENT TRANSFORMER</h3>
//           <p className="text-sm">After Primary Test - Metering Core</p>
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

//         {/* Pretest After Primary Winding Header */}
//         <div className="bg-green-400 border border-gray-800 p-2 flex justify-between items-center mb-4">
//           <span className="font-medium">Pretest After Primary Winding - Metering Core</span>
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
//           <h4 className="mb-2">Auto-Loaded Core Information from Secondary Test:</h4>
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
import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Printer, Download, ArrowLeft, Save } from 'lucide-react';
import { Transformer } from './AfterPrimaryTransformersList';
import { toast } from 'sonner';

interface PrimaryMeteringReportProps {
  transformer: Transformer;
  coreId: string;
  testerName: string;
  onBack: () => void;
}

export function AfterPrimaryMeteringReport({
  transformer,
  coreId,
  testerName,
  onBack,
}: PrimaryMeteringReportProps) {

  // Array determining which tables to show
  const dummyDbRatios = ['200/1'];

  // State management for inputs (initialized with your default or dummy values)
  const [data200, setData200] = useState(getInitialData('', '', '', ''));
  const [data400, setData400] = useState(getInitialData('', '', '', ''));
  const [data800, setData800] = useState(getInitialData('', '', '', ''));


  // ✅ 2️⃣ Convert State → Schema Format (IMPORTANT)
  // 🔹 Build metering_results properly

  const buildMeteringResults = () => {
    const results = [];

    if (data200?.length) {
      results.push({
        ratioValue: "200/1",
        rows: data200
      });
    }

    if (data400?.length) {
      results.push({
        ratioValue: "400/1",
        rows: data400
      });
    }

    if (data800?.length) {
      results.push({
        ratioValue: "800/1",
        rows: data800
      });
    }

    return results;
  };





  // const handleDatabaseSave = async () => {
  //   console.log("handleDatabaseSave: STARTED");
  //   try {
  //     const meteringResults = buildMeteringResults();
  //     console.log("handleDatabaseSave: meteringResults built", meteringResults);

  //     const payload = {
  //       uniqueId: transformer.uniqueId,
  //       loginType: "secondary_login",
  //       tester: 'shubham',
  //       coreId: coreId,
  //       metering_results: meteringResults
  //     };
  //     console.log("handleDatabaseSave: Payload ready", payload);

  //     console.log("handleDatabaseSave: Sending Request...");
  //     const response = await axios.post(
  //       "http://localhost:3002/transformer-secondary-metering-tests",
  //       payload,
  //       { withCredentials: true }
  //     );
  //     console.log("handleDatabaseSave: Response received", response);

  //     toast.success("Data was saved in frontend UI and saved to database successfully!");
  //   } catch (error) {
  //     console.error("handleDatabaseSave: ERROR CAUGHT", error);
  //     toast.error("Failed to save data to database.");
  //   }
  // };

  const handleDatabaseSave = async () => {
    console.log("handleDatabaseSave: STARTED");
    try {
      const meteringResults = buildMeteringResults();
      console.log("handleDatabaseSave: meteringResults built", meteringResults);

      const payload = {
        uniqueId: transformer.uniqueId,
        loginType: "primary_login",
        tester: testerName,
        metering_results: meteringResults
      };
      console.log("handleDatabaseSave: Payload ready to send:", payload);

      const response = await axios.post(
        "http://localhost:3002/transformer-primary-metering-tests",
        payload,
        { withCredentials: true }
      );
      console.log("handleDatabaseSave: Response received", response);

      toast.success("Data was saved in frontend UI and saved to database successfully!");
    } catch (error) {
      console.error("handleDatabaseSave: ERROR CAUGHT", error);
      toast.error("Failed to save primary data.");
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
          <p className="text-sm font-semibold">METERING CORE REPORT - {dummyDbRatios.join(' / ')}</p>
        </div>

        <div className="space-y-10">
          {dummyDbRatios.includes('200/1') && (
            <MeteringTable ratio="200/1" rows={data200} setRows={setData200} />
          )}
          {dummyDbRatios.includes('400/1') && (
            <MeteringTable ratio="400/1" rows={data400} setRows={setData400} />
          )}
          {dummyDbRatios.includes('800/1') && (
            <MeteringTable ratio="800/1" rows={data800} setRows={setData800} />
          )}
        </div>
      </Card>
    </div>
  );
}

// Editable Table Component
function MeteringTable({ ratio, rows, setRows }: { ratio: string, rows: any[], setRows: any }) {
  const updateValue = (index: number, field: string, value: string) => {
    const updatedRows = [...rows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    setRows(updatedRows);
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
                  value={row.r100} onChange={(e) => updateValue(idx, 'r100', e.target.value)} />
              </td>
              <td className="border border-gray-400 p-1">
                <Input className="h-7 text-xs text-center border-none shadow-none"
                  value={row.p100} onChange={(e) => updateValue(idx, 'p100', e.target.value)} />
              </td>
              <td className="border border-gray-400 p-1">
                <Input className="h-7 text-xs text-center border-none shadow-none"
                  value={row.r25} onChange={(e) => updateValue(idx, 'r25', e.target.value)} />
              </td>
              <td className="border border-gray-400 p-1">
                <Input className="h-7 text-xs text-center border-none shadow-none"
                  value={row.p25} onChange={(e) => updateValue(idx, 'p25', e.target.value)} />
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
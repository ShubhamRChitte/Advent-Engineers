import { Button } from '../ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { Input } from '../ui/input';

interface PTReportViewProps {
  transformer: any;
  order?: any;
  onBack: () => void;
}

export function PTReportView({ transformer, order, onBack }: PTReportViewProps) {
  const reportData = transformer?.testHistory?.pt_test || {};

  // Find if Config B (1 Metering, 2 Protection)
  let countMetering = 0;
  let countProtection = 0;
  const cores = order?.coreDetails || order?.coreConfigs || [];
  cores.forEach((core: any) => {
      const type = typeof core === 'string' ? core : core.coreType;
      if (type?.toLowerCase() === 'metering') countMetering++;
      if (type?.toLowerCase() === 'protection') countProtection++;
  });
  const isConfigB = countMetering === 1 && countProtection === 2;

  if (!reportData || Object.keys(reportData).length === 0) {
    return <div className="p-8 text-center text-gray-500">No PT test data found for this transformer.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between no-print">
            <Button onClick={onBack} variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
            </Button>
            <Button onClick={() => window.print()} className="bg-[#003a70] hover:bg-[#002850] gap-2">
                <Printer className="w-4 h-4" />
                Print Report
            </Button>
        </div>

        {/* PRINTABLE REPORT FORMAT */}
        <div className="bg-white p-8 rounded-lg border border-gray-300 shadow-sm max-w-[800px] mx-auto text-sm" id="printable-report">
            
            {/* Header Title */}
            <div className="text-center mb-6 border-b-2 border-black pb-2">
                <h1 className="text-2xl font-bold text-[#003a70] mb-1 tracking-wider uppercase">ADVENT ENGINEERS</h1>
                <h2 className="text-xl font-bold uppercase">Testing Record of Potential Transformer</h2>
            </div>

            {/* Section 1: Header Details */}
            <div className="border border-black mb-4 flex divide-x divide-black">
                <div className="flex-1 p-2 font-bold bg-gray-50 flex items-center">
                    SERIAL NO. : <span className="ml-2 py-0 h-6 font-normal w-32 border-b border-gray-400">{transformer.uniqueId || 'N/A'}</span>
                </div>
                <div className="p-2 w-48 font-bold bg-gray-50 flex items-center justify-end">
                    Date: <Input value={reportData.date || ''} className="ml-2 w-32 h-6 border-black text-sm p-1 rounded-sm shadow-none" readOnly />
                </div>
            </div>

            <table className="w-full border-collapse border border-black mb-4 table-fixed text-sm">
                <tbody>
                    <tr>
                        <td className="border border-black p-1 pl-2 font-medium w-1/4">Specification</td>
                        <td className="border border-black p-1 pl-2 w-1/4 bg-gray-50">{order?.voltageRating || '33'} KV PT</td>
                        <td className="border border-black p-1 pl-2 font-medium w-1/4">Type 1</td>
                        <td className="border border-black p-1 pl-2 w-1/4 bg-gray-50">O/D</td>
                    </tr>
                    <tr>
                        <td className="border border-black p-1 pl-2 font-medium w-1/4">PT Ratio</td>
                        <td className="border border-black p-1 pl-2 w-1/4 bg-gray-50">{order?.ratio?.[0] || 'N/A'}</td>
                        <td className="border border-black p-1 pl-2 font-medium w-1/4">Type 2</td>
                        <td className="border border-black p-1 pl-2 w-1/4 bg-gray-50">O/C</td>
                    </tr>
                    <tr>
                        <td className="border border-black p-1 pl-2 font-medium w-1/4">Burden</td>
                        <td className="border border-black p-1 pl-2 w-1/4 bg-gray-50">{order?.burden || 'N/A'} VA</td>
                        <td className="border border-black p-1 pl-2 font-medium w-1/4">Class</td>
                        <td className="border border-black p-1 pl-2 w-1/4 bg-gray-50">{order?.accuracyClass || '0.2'}</td>
                    </tr>
                    <tr>
                        <td className="border border-black p-1 pl-2 font-medium w-1/4">Voltage Factor</td>
                        <td className="border border-black p-1 pl-2 w-1/4 bg-gray-50">1.2 Cont.& 1.5 for 30 Sec</td>
                        <td className="border border-black p-1 pl-2 font-medium w-1/4">Job No.</td>
                        <td className="border border-black p-1 pl-2 w-1/4 bg-gray-50">{order?.jobId || 'N/A'}</td>
                    </tr>
                </tbody>
            </table>

            {/* Section 2: Pre testing */}
            <div className="border border-black mb-4">
                <div className="text-center font-bold bg-gray-100 border-b border-black py-1">Pre testing</div>
                <table className="w-full border-collapse border-hidden table-fixed text-sm text-center">
                    <thead>
                        <tr>
                            <td className="border border-black p-1 w-1/3" rowSpan={2}>% of Primary<br/>current</td>
                            <td className="border border-black p-1 font-bold w-1/3" colSpan={2}>100% Burden</td>
                            <td className="border border-black p-1 font-bold w-1/3" colSpan={2}>25% Burden</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1">Ratio Error</td>
                            <td className="border border-black p-1">Phase Error</td>
                            <td className="border border-black p-1">Ratio Error</td>
                            <td className="border border-black p-1">Phase Error</td>
                        </tr>
                    </thead>
                    <tbody>
                         <tr>
                            <td className="border border-black p-1 font-medium text-left pl-2">Metering 30%</td>
                            <td className="border border-black p-0.5"><Input className="h-7 border-none shadow-none text-center bg-transparent text-blue-600" value={reportData.preTesting?.metering?.ratioError100 || ''} readOnly /></td>
                            <td className="border border-black p-0.5"><Input className="h-7 border-none shadow-none text-center bg-transparent text-blue-600" value={reportData.preTesting?.metering?.phaseError100 || ''} readOnly /></td>
                            <td className="border border-black p-0.5"><Input className="h-7 border-none shadow-none text-center bg-transparent text-blue-600" value={reportData.preTesting?.metering?.ratioError25 || ''} readOnly /></td>
                            <td className="border border-black p-0.5"><Input className="h-7 border-none shadow-none text-center bg-transparent text-blue-600" value={reportData.preTesting?.metering?.phaseError25 || ''} readOnly /></td>
                        </tr>
                        {isConfigB && (
                            <>
                                <tr>
                                    <td className="border border-black p-1 font-medium text-left pl-2">Protection 30%</td>
                                    <td className="border border-black p-0.5"><Input className="h-7 border-none shadow-none text-center bg-transparent text-blue-600" value={reportData.preTesting?.protection1?.ratioError100 || ''} readOnly /></td>
                                    <td className="border border-black p-0.5"><Input className="h-7 border-none shadow-none text-center bg-transparent text-blue-600" value={reportData.preTesting?.protection1?.phaseError100 || ''} readOnly /></td>
                                    <td className="border border-black p-0.5"><Input className="h-7 border-none shadow-none text-center bg-transparent text-blue-600" value={reportData.preTesting?.protection1?.ratioError25 || ''} readOnly /></td>
                                    <td className="border border-black p-0.5"><Input className="h-7 border-none shadow-none text-center bg-transparent text-blue-600" value={reportData.preTesting?.protection1?.phaseError25 || ''} readOnly /></td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-1 font-medium text-left pl-2">Protection 30%</td>
                                    <td className="border border-black p-0.5"><Input className="h-7 border-none shadow-none text-center bg-transparent text-blue-600" value={reportData.preTesting?.protection2?.ratioError100 || ''} readOnly /></td>
                                    <td className="border border-black p-0.5"><Input className="h-7 border-none shadow-none text-center bg-transparent text-blue-600" value={reportData.preTesting?.protection2?.phaseError100 || ''} readOnly /></td>
                                    <td className="border border-black p-0.5"><Input className="h-7 border-none shadow-none text-center bg-transparent text-blue-600" value={reportData.preTesting?.protection2?.ratioError25 || ''} readOnly /></td>
                                    <td className="border border-black p-0.5"><Input className="h-7 border-none shadow-none text-center bg-transparent text-blue-600" value={reportData.preTesting?.protection2?.phaseError25 || ''} readOnly /></td>
                                </tr>
                            </>
                        )}
                    </tbody>
                </table>
                <div className="flex justify-between items-center p-2 text-sm">
                    <div className="flex items-center">
                        <span className="font-bold mr-2">Tested By: -</span>
                        <Input value={reportData.testedBy || reportData.tester || ''} className="w-48 h-7 text-blue-600 italic font-medium bg-transparent border-t-0 border-l-0 border-r-0 border-b border-gray-400 rounded-none px-1" readOnly />
                    </div>
                </div>
            </div>

            {/* Section 3: Final Testing */}
            <div className="border border-black mb-4">
                <div className="text-center font-bold bg-gray-100 border-b border-black py-1">Final Testing</div>
                <table className="w-full border-collapse border-hidden table-fixed text-sm text-left">
                    <thead>
                        <tr>
                            <th className="border border-black p-1 font-normal text-center w-16">Sr no.</th>
                            <th className="border border-black p-1 font-normal w-1/2 text-center">Parameters</th>
                            <th className="border border-black p-1 font-normal w-auto text-center">Readings</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            { id: 1, label: 'Leakage', field: 'leakage' },
                            { id: 2, label: 'Terminal Marking', field: 'terminalMarking' },
                            { id: 3, label: 'Polarity Testing', field: 'polarityTesting' },
                            { id: 4, label: 'Insulation Resistance Test', field: 'insulationResistance' },
                            { id: 5, label: 'Primary to Secondary', field: 'primaryToSecondary' },
                            { id: 6, label: 'Primary to Earth', field: 'primaryToEarth' },
                            { id: 7, label: 'Secondary to Earth', field: 'secondaryToEarth' },
                            { id: 9, label: 'H.V.Test on Secondary Winding', field: 'hvSecondary' },
                            { id: 10, label: 'H.V.Test on Primary Winding', field: 'hvPrimary' },
                            { id: 11, label: 'Induced Over Voltage Test', field: 'inducedOverVoltage' },
                        ].map((row) => (
                            <tr key={row.id}>
                                <td className="border border-black p-1 text-center">{row.id}</td>
                                <td className="border border-black p-1 pl-4">{row.label}</td>
                                <td className="border border-black p-0">
                                    <Input 
                                        className={`h-6 border-none shadow-none text-center bg-transparent w-full ${['OK', '10 GΩ'].includes(reportData.finalTesting?.[row.field]) ? 'text-blue-600' : ''}`}
                                        value={reportData.finalTesting?.[row.field] || ''} 
                                        readOnly
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Section 4: Accuracy Test Metering */}
            <div className="border border-black mb-4">
                <div className="text-center font-bold bg-gray-100 border-b border-black py-1">Accuracy Test Metering</div>
                <table className="w-full border-collapse border-hidden table-fixed text-sm text-center">
                    <thead>
                        <tr>
                            <td className="border border-black p-1 w-1/3 align-middle" rowSpan={2}>% of primary<br/>current</td>
                            <td className="border border-black p-1 font-bold w-1/3" colSpan={2}>100% Burden</td>
                            <td className="border border-black p-1 font-bold w-1/3" colSpan={2}>25% Burden</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1 leading-tight">Ratio Error<br/>(%)</td>
                            <td className="border border-black p-1 leading-tight">Phase Error<br/>(min)</td>
                            <td className="border border-black p-1 leading-tight">Ratio Error<br/>(%)</td>
                            <td className="border border-black p-1 leading-tight">Phase error<br/>(min)</td>
                        </tr>
                    </thead>
                    <tbody>
                        {['120', '100', '80'].map((perc) => (
                            <tr key={perc}>
                                <td className="border border-black p-1 text-center">{perc}%</td>
                                <td className="border border-black p-0"><Input className="h-7 border-none shadow-none text-center text-blue-600 bg-transparent" value={reportData.accuracyTest?.[perc]?.ratioError100 || ''} readOnly /></td>
                                <td className="border border-black p-0"><Input className="h-7 border-none shadow-none text-center text-blue-600 bg-transparent" value={reportData.accuracyTest?.[perc]?.phaseError100 || ''} readOnly /></td>
                                <td className="border border-black p-0"><Input className="h-7 border-none shadow-none text-center text-blue-600 bg-transparent" value={reportData.accuracyTest?.[perc]?.ratioError25 || ''} readOnly /></td>
                                <td className="border border-black p-0"><Input className="h-7 border-none shadow-none text-center text-blue-600 bg-transparent" value={reportData.accuracyTest?.[perc]?.phaseError25 || ''} readOnly /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="flex justify-between items-center p-2 text-sm mt-2">
                    <div className="flex items-center">
                        <span className="font-bold mr-2">Tested By: -</span>
                        <Input value={reportData.testedBy || reportData.tester || ''} className="w-48 h-7 text-blue-600 italic font-medium bg-transparent border-t-0 border-l-0 border-r-0 border-b border-gray-400 rounded-none px-1" readOnly />
                    </div>
                </div>
            </div>

            {/* Signature Area */}
            <div className="mt-12 flex justify-end">
                <div className="text-center w-64 pt-8 pb-4">
                    {reportData.signature ? (
                       <img src={reportData.signature} alt="Signature" className="mx-auto block w-auto h-24 mb-2 -mt-16 object-contain mix-blend-multiply border-b border-gray-400 pb-2" />
                    ) : (
                       <div className="border-b border-gray-400 w-full mb-2 h-10"></div>
                    )}
                    <span className="font-bold relative z-10">(ADVENT ENGINEERS)</span>
                </div>
            </div>

        </div>
    </div>
  );
}

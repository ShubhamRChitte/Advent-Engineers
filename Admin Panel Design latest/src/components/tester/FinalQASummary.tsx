import React from 'react';
import { Card } from './ui/card';

interface FinalQASummaryProps {
  transformer: any;
  testerName: string;
}

export function FinalQASummary({ transformer, testerName }: FinalQASummaryProps) {
  const history = transformer.testHistory?.final_test || {};
  
  const qaData = [
    { label: 'Polarity Result', value: history.polarityResult },
    { label: 'Megger: Primary to Secondary', value: history.meggarPrimaryToSecondary, unit: 'MΩ' },
    { label: 'Megger: Primary to Earth', value: history.meggarPrimaryToEarth, unit: 'MΩ' },
    { label: 'Megger: Secondary to Earth', value: history.meggarSecondaryToEarth, unit: 'MΩ' },
    { label: 'Megger: Core to Core', value: history.meggarCoreToCore, unit: 'MΩ' },
    { label: 'H.V. Test: Secondary Winding', value: history.hvSecondaryWinding },
    { label: 'H.V. Test: Primary Winding', value: history.hvPrimaryWinding },
    { label: 'H.V. Test: Between Core', value: history.hvBetweenCore },
    { label: 'O.V.I.T. Test', value: history.ovitTest },
  ];

  return (
    <div className="p-6 space-y-6 bg-white">
      <div className="border-b pb-4 mb-4">
        <h3 className="text-xl font-bold text-[#003a70] uppercase">Final QA & Comprehensive Test Results</h3>
        <p className="text-sm text-gray-500 mt-1 italic">Verification of insulation, polarity, and high voltage endurance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Polarity & HV Tests */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-700 border-l-4 border-blue-500 pl-3">Functional & HV Tests</h4>
          <div className="bg-gray-50 rounded-lg overflow-hidden border">
            <table className="w-full text-sm">
              <tbody className="divide-y">
                {qaData.filter(d => !d.label.includes('Megger')).map((item, idx) => (
                  <tr key={idx} className="hover:bg-white transition-colors">
                    <td className="px-4 py-3 text-gray-600 font-medium w-2/3">{item.label}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                        item.value === 'Pass' ? 'bg-green-100 text-green-700' : 
                        item.value === 'Fail' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {item.value || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Insulation Resistance (Megger) */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-700 border-l-4 border-orange-500 pl-3">Insulation Resistance (Megger)</h4>
          <div className="bg-gray-50 rounded-lg overflow-hidden border">
            <table className="w-full text-sm">
              <tbody className="divide-y">
                {qaData.filter(d => d.label.includes('Megger')).map((item, idx) => (
                  <tr key={idx} className="hover:bg-white transition-colors">
                    <td className="px-4 py-3 text-gray-600 font-medium w-2/3">{item.label.replace('Megger: ', '')}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-blue-700">
                      {item.value || 'N/A'} {item.value && item.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 pt-6 border-t border-dashed flex justify-between items-center text-sm text-gray-500">
        <div>
          <span className="font-semibold">Tested By:</span> {history.tester || testerName}
        </div>
        <div>
          <span className="font-semibold">Test Date:</span> {history.timestamp ? new Date(history.timestamp).toLocaleDateString('en-GB') : 'N/A'}
        </div>
      </div>
    </div>
  );
}

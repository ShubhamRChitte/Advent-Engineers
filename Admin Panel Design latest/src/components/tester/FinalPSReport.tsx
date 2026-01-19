import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ArrowLeft, Save, Download, Printer } from 'lucide-react';
import { FinalTransformer } from './FinalTransformersList';

interface CoreConfig {
  coreNumber: number;
  coreType: 'metering' | 'ps' | 'protection';
  coreId: string;
}

interface FinalPSReportProps {
  transformer: FinalTransformer;
  core: CoreConfig;
  testerName: string;
  onBack: () => void;
}

export function FinalPSReport({
  transformer,
  core,
  testerName,
  onBack,
}: FinalPSReportProps) {
  const testDate = new Date().toLocaleDateString();

  const [error100, setError100] = useState('');
  const [resistance, setResistance] = useState('');
  const [turnRatioError, setTurnRatioError] = useState('');
  const [resistance2, setResistance2] = useState('');
  const [iexAtVk, setIexAtVk] = useState('');
  const [iexAt11Vk, setIexAt11Vk] = useState('');
  const [bdvOfOil, setBdvOfOil] = useState('');

  const handleSave = () => {
    alert('Final PS Test Report saved successfully!');
  };

  const handleGenerate = () => {
    alert('Report generated and ready for download!');
  };

  const handlePrint = () => {
    window.print();
  };

  const getRatioForCore = () => {
    const ratios = transformer.rating.split('/')[0].split('-');
    if (core.coreNumber <= ratios.length) {
      return ratios[core.coreNumber - 1];
    }
    return '200';
  };

  const ratio = getRatioForCore();

  const getVkValue = () => {
    const ratioNum = parseInt(ratio);
    if (ratioNum >= 800) return '1000V';
    if (ratioNum >= 400) return '500V';
    return '250V';
  };

  const vkValue = getVkValue();
  const vk11Value = parseInt(vkValue) * 1.1 + 'V';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Print
          </Button>
        </div>
      </div>

      <div>
        <h2>Final Test - PS Core</h2>
        <p className="text-gray-500 mt-1">Core {core.coreNumber} - {core.coreId}</p>
      </div>

      {/* Main Report Card */}
      <Card className="p-6">
        {/* Report Header */}
        <div className="text-center mb-6 pb-4 border-b-2 border-gray-800">
          <h3 className="text-red-600 mb-2">TESTING RECORD OF CURRENT TRANSFORMER</h3>
          <p className="text-sm">Final Test - PS Core</p>
        </div>

        {/* Specification Section */}
        <div className="mb-6 border border-gray-300">
          <table className="w-full">
            <thead>
              <tr className="bg-orange-200 border-b border-gray-800">
                <th className="text-left p-2 text-sm border-r border-gray-300">Specification</th>
                <th className="text-left p-2 text-sm border-r border-gray-300">Details</th>
                <th className="text-left p-2 text-sm">Core Information</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-300">
                <td className="p-2 text-sm border-r border-gray-300">Transformer Name</td>
                <td className="p-2 text-sm border-r border-gray-300">{transformer.name}</td>
                <td className="p-2 text-sm">Core Number: {core.coreNumber}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="p-2 text-sm border-r border-gray-300">Rating</td>
                <td className="p-2 text-sm border-r border-gray-300">{transformer.rating}</td>
                <td className="p-2 text-sm">Core ID: {core.coreId}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="p-2 text-sm border-r border-gray-300">Voltage Class</td>
                <td className="p-2 text-sm border-r border-gray-300">{transformer.voltageClass}</td>
                <td className="p-2 text-sm">Type: PS</td>
              </tr>
              <tr>
                <td className="p-2 text-sm border-r border-gray-300">Unique ID</td>
                <td className="p-2 text-sm border-r border-gray-300">{transformer.uniqueId}</td>
                <td className="p-2 text-sm">Date: {testDate}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Final Testing Header */}
        <div className="bg-green-400 border border-gray-800 p-2 flex justify-between items-center mb-4">
          <span className="font-medium">Final Testing - PS Core</span>
          <span>Core: {core.coreId}</span>
        </div>

        {/* PS Core Test Table */}
        <div className="mb-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <tbody>
                {/* Row 1 */}
                <tr>
                  <td rowSpan={2} className="border border-gray-300 p-2 bg-yellow-100 font-medium text-sm align-middle">
                    PS Core Ratio -<br />{ratio}/1
                  </td>
                  <td className="border border-gray-300 p-2 text-sm bg-pink-100">at 100%</td>
                  <td className="border border-gray-300 p-2">
                    <Input
                      className="h-8 text-sm"
                      placeholder="Error at 100%"
                      value={error100}
                      onChange={(e) => setError100(e.target.value)}
                    />
                  </td>
                  <td className="border border-gray-300 p-2 text-sm">Resistance</td>
                  <td className="border border-gray-300 p-2">
                    <Input
                      className="h-8 text-sm"
                      placeholder="Resistance"
                      value={resistance}
                      onChange={(e) => setResistance(e.target.value)}
                    />
                  </td>
                  <td className="border border-gray-300 p-2 text-sm bg-green-100">Vk: {vkValue}</td>
                  <td className="border border-gray-300 p-2 text-sm">Iex at Vk</td>
                  <td className="border border-gray-300 p-2">
                    <Input
                      className="h-8 text-sm"
                      placeholder="Iex at Vk"
                      value={iexAtVk}
                      onChange={(e) => setIexAtVk(e.target.value)}
                    />
                  </td>
                  <td className="border border-gray-300 p-2 text-sm">Iex at 1.1Vk</td>
                  <td className="border border-gray-300 p-2">
                    <Input
                      className="h-8 text-sm"
                      placeholder="Iex at 1.1Vk"
                      value={iexAt11Vk}
                      onChange={(e) => setIexAt11Vk(e.target.value)}
                    />
                  </td>
                </tr>
                {/* Row 2 */}
                <tr>
                  <td className="border border-gray-300 p-2 text-sm bg-pink-100">Turn Ratio Error at 100%</td>
                  <td className="border border-gray-300 p-2">
                    <Input
                      className="h-8 text-sm"
                      placeholder="Turn Ratio Error"
                      value={turnRatioError}
                      onChange={(e) => setTurnRatioError(e.target.value)}
                    />
                  </td>
                  <td className="border border-gray-300 p-2 text-sm">Resistance</td>
                  <td className="border border-gray-300 p-2">
                    <Input
                      className="h-8 text-sm"
                      placeholder="Resistance"
                      value={resistance2}
                      onChange={(e) => setResistance2(e.target.value)}
                    />
                  </td>
                  <td className="border border-gray-300 p-2 text-sm bg-green-100">1.1 Vk: {vk11Value}</td>
                  <td colSpan={3} className="border border-gray-300 p-2 bg-gray-50"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Section */}
        <div className="border border-gray-300 mb-6">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="border-r border-gray-300 p-3 text-sm w-1/2">
                  <strong>Tested By:</strong> {testerName}
                </td>
                <td className="p-3 text-sm">
                  <strong>Signature:</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* BDV of Oil */}
        <div className="border border-gray-300 mb-6">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="p-3 text-sm bg-blue-100 border-r border-gray-300 w-1/4">
                  <strong>BDV of Oil</strong>
                </td>
                <td className="p-3">
                  <Input
                    className="h-10"
                    placeholder="Enter BDV value"
                    value={bdvOfOil}
                    onChange={(e) => setBdvOfOil(e.target.value)}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Core Info Display */}
        <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg">
          <h4 className="mb-2">Core Information:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="font-medium">Core Number:</span> {core.coreNumber}</div>
            <div><span className="font-medium">Core ID:</span> <span className="text-purple-600">{core.coreId}</span></div>
            <div><span className="font-medium">Core Type:</span> PS (Protective System)</div>
            <div><span className="font-medium">Ratio:</span> {ratio}/1</div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleSave} variant="outline" className="gap-2">
          <Save className="w-4 h-4" />
          Save Report
        </Button>
        <Button onClick={handleGenerate} className="bg-red-600 hover:bg-red-700 gap-2">
          <Download className="w-4 h-4" />
          Generate & Upload
        </Button>
      </div>
    </div>
  );
}

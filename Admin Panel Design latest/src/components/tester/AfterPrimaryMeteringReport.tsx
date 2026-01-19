import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ArrowLeft, Save, Download, Printer } from 'lucide-react';
import { AfterPrimaryTransformer } from './AfterPrimaryTransformersList';

interface MeteringRow {
  percent: string;
  ratioError100: string;
  phaseError100: string;
  ratioError25: string;
  phaseError25: string;
}

interface CoreConfig {
  coreNumber: number;
  coreType: 'metering' | 'ps' | 'protection';
  coreId: string;
}

interface AfterPrimaryMeteringReportProps {
  transformer: AfterPrimaryTransformer;
  core: CoreConfig;
  testerName: string;
  onBack: () => void;
}

export function AfterPrimaryMeteringReport({
  transformer,
  core,
  testerName,
  onBack,
}: AfterPrimaryMeteringReportProps) {
  const testDate = new Date().toLocaleDateString();

  const meteringPercentages = ['120%', '100%', '20%', '5%', '1%'];
  
  const [meteringData, setMeteringData] = useState<MeteringRow[]>(
    meteringPercentages.map(percent => ({
      percent,
      ratioError100: '',
      phaseError100: '',
      ratioError25: '',
      phaseError25: '',
    }))
  );

  const [bdvOfOil, setBdvOfOil] = useState('');

  const handleSave = () => {
    alert('Metering Test Report saved successfully!');
  };

  const handleGenerate = () => {
    alert('Report generated and ready for download!');
  };

  const handlePrint = () => {
    window.print();
  };

  // Extract ratio from transformer rating (e.g., "800-400-200/1-1-1A" -> get ratio for this core)
  const getRatioForCore = () => {
    // This would be determined by core configuration
    // For demo, using core number to determine ratio
    const ratios = transformer.rating.split('/')[0].split('-');
    if (core.coreNumber <= ratios.length) {
      return ratios[core.coreNumber - 1];
    }
    return '200';
  };

  const ratio = getRatioForCore();

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
        <h2>After Primary Test - Metering Core</h2>
        <p className="text-gray-500 mt-1">Core {core.coreNumber} - {core.coreId}</p>
      </div>

      {/* Main Report Card */}
      <Card className="p-6">
        {/* Report Header */}
        <div className="text-center mb-6 pb-4 border-b-2 border-gray-800">
          <h3 className="text-red-600 mb-2">TESTING RECORD OF CURRENT TRANSFORMER</h3>
          <p className="text-sm">After Primary Test - Metering Core</p>
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
                <td className="p-2 text-sm border-r border-gray-300">CT Ratio</td>
                <td className="p-2 text-sm border-r border-gray-300">{transformer.bsat}</td>
                <td className="p-2 text-sm">Core Number: {core.coreNumber}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="p-2 text-sm border-r border-gray-300">Burden</td>
                <td className="p-2 text-sm border-r border-gray-300">{transformer.vaRating}</td>
                <td className="p-2 text-sm">Core ID: {core.coreId}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="p-2 text-sm border-r border-gray-300">Class</td>
                <td className="p-2 text-sm border-r border-gray-300">{transformer.classRating}</td>
                <td className="p-2 text-sm">Type: Metering</td>
              </tr>
              <tr>
                <td className="p-2 text-sm border-r border-gray-300">Unique ID</td>
                <td className="p-2 text-sm border-r border-gray-300">{transformer.uniqueId}</td>
                <td className="p-2 text-sm">Date: {testDate}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pretest After Primary Winding Header */}
        <div className="bg-green-400 border border-gray-800 p-2 flex justify-between items-center mb-4">
          <span className="font-medium">Pretest After Primary Winding - Metering Core</span>
          <span>Core: {core.coreId}</span>
        </div>

        {/* Metering Core Test Table */}
        <div className="mb-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th rowSpan={2} className="border border-gray-300 p-2 text-sm">%of primary current</th>
                  <th colSpan={2} className="border border-gray-300 p-2 text-sm">100 % Burden</th>
                  <th colSpan={2} className="border border-gray-300 p-2 text-sm">25% Burden</th>
                </tr>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-sm">Ratio Error(%)</th>
                  <th className="border border-gray-300 p-2 text-sm">Phase Error(min)</th>
                  <th className="border border-gray-300 p-2 text-sm">Ratio Error(%)</th>
                  <th className="border border-gray-300 p-2 text-sm">Phase Error(min)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td rowSpan={6} className="border border-gray-300 p-2 bg-yellow-100 font-medium text-sm align-middle">
                    Metering<br />Core Ratio<br />{ratio}/1
                  </td>
                </tr>
                {meteringData.map((row, idx) => (
                  <tr key={idx}>
                    <td className="border border-gray-300 p-2 text-sm">{row.percent}</td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        className="h-8 text-sm"
                        value={row.ratioError100}
                        onChange={(e) => {
                          const newData = [...meteringData];
                          newData[idx].ratioError100 = e.target.value;
                          setMeteringData(newData);
                        }}
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        className="h-8 text-sm"
                        value={row.phaseError100}
                        onChange={(e) => {
                          const newData = [...meteringData];
                          newData[idx].phaseError100 = e.target.value;
                          setMeteringData(newData);
                        }}
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        className="h-8 text-sm"
                        value={row.ratioError25}
                        onChange={(e) => {
                          const newData = [...meteringData];
                          newData[idx].ratioError25 = e.target.value;
                          setMeteringData(newData);
                        }}
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        className="h-8 text-sm"
                        value={row.phaseError25}
                        onChange={(e) => {
                          const newData = [...meteringData];
                          newData[idx].phaseError25 = e.target.value;
                          setMeteringData(newData);
                        }}
                      />
                    </td>
                  </tr>
                ))}
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
          <h4 className="mb-2">Auto-Loaded Core Information from Secondary Test:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="font-medium">Core Number:</span> {core.coreNumber}</div>
            <div><span className="font-medium">Core ID:</span> <span className="text-blue-600">{core.coreId}</span></div>
            <div><span className="font-medium">Core Type:</span> Metering</div>
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

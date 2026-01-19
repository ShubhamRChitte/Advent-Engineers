import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ArrowLeft, Save, Download, Printer } from 'lucide-react';
import { Transformer } from './SecondaryTransformersList';
import { exportSecondaryMeteringReport } from '../../utils/pdfExport';
import { toast } from 'sonner@2.0.3';

interface SecondaryMeteringReportProps {
  transformer: Transformer;
  coreNumber: number;
  coreId: string;
  testerName: string;
  onBack: () => void;
}

interface TestRow {
  meteringCore: string;
  ratio: string;
  burden100Ratio: string;
  burden100Phase: string;
  burden25Ratio: string;
  burden25Phase: string;
}

export function SecondaryMeteringReport({
  transformer,
  coreNumber,
  coreId,
  testerName,
  onBack,
}: SecondaryMeteringReportProps) {
  const [testData, setTestData] = useState<TestRow[]>([
    { meteringCore: '120%', ratio: '', burden100Ratio: '-0.108', burden100Phase: '0.85', burden25Ratio: '0.0003', burden25Phase: '-2.41' },
    { meteringCore: '100%', ratio: '', burden100Ratio: '-0.0838', burden100Phase: '-0.38', burden25Ratio: '-0.0012', burden25Phase: '-2.48' },
    { meteringCore: '20%', ratio: '', burden100Ratio: '-0.105', burden100Phase: '-1.35', burden25Ratio: '-0.0044', burden25Phase: '-2.79' },
    { meteringCore: '5%', ratio: '', burden100Ratio: '-0.121', burden100Phase: '-0.69', burden25Ratio: '0.0020', burden25Phase: '-4.85' },
    { meteringCore: '1%', ratio: '', burden100Ratio: '-0.140', burden100Phase: '-5.48', burden25Ratio: '0.0016', burden25Phase: '-11.16' },
  ]);

  const [secondaryData, setSecondaryData] = useState<TestRow[]>([
    { meteringCore: '120%', ratio: '', burden100Ratio: '-0.0124', burden100Phase: '-0.77', burden25Ratio: '0.0006', burden25Phase: '-1.06' },
    { meteringCore: '100%', ratio: '', burden100Ratio: '-0.0120', burden100Phase: '-1.04', burden25Ratio: '0.0000', burden25Phase: '-1.00' },
    { meteringCore: '20%', ratio: '', burden100Ratio: '-0.0152', burden100Phase: '-2.27', burden25Ratio: '0.0090', burden25Phase: '-3.82' },
    { meteringCore: '5%', ratio: '', burden100Ratio: '-0.0111', burden100Phase: '-2.61', burden25Ratio: '0.0126', burden25Phase: '-3.60' },
    { meteringCore: '1%', ratio: '', burden100Ratio: '-0.0206', burden100Phase: '-8.29', burden25Ratio: '0.0149', burden25Phase: '-8.48' },
  ]);

  const [thirdData, setThirdData] = useState<TestRow[]>([
    { meteringCore: '120%', ratio: '', burden100Ratio: '', burden100Phase: '', burden25Ratio: '', burden25Phase: '' },
    { meteringCore: '100%', ratio: '', burden100Ratio: '', burden100Phase: '', burden25Ratio: '', burden25Phase: '' },
    { meteringCore: '20%', ratio: '', burden100Ratio: '', burden100Phase: '', burden25Ratio: '', burden25Phase: '' },
    { meteringCore: '5%', ratio: '', burden100Ratio: '', burden100Phase: '', burden25Ratio: '', burden25Phase: '' },
    { meteringCore: '1%', ratio: '', burden100Ratio: '', burden100Phase: '', burden25Ratio: '', burden25Phase: '' },
  ]);

  const handleSave = () => {
    alert('Report saved successfully!');
  };

  const handleGenerate = () => {
    const reportData = {
      transformerId: transformer.uniqueId,
      coreNumber,
      coreId,
      testerName,
      rating: transformer.rating,
      testData1: testData,
      testData2: secondaryData,
      testData3: thirdData,
      ratio1: '200/1',
      ratio2: '400/1',
      ratio3: '800/1',
    };
    
    exportSecondaryMeteringReport(reportData);
    toast.success('Metering report downloaded successfully!');
  };

  const handlePrint = () => {
    window.print();
  };

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
        <h2>Metering Test Report</h2>
        <p className="text-gray-500 mt-1">Secondary Testing - Metering Core Analysis</p>
      </div>

      {/* Report Header */}
      <Card className="p-6">
        <div className="text-center mb-6 pb-4 border-b border-gray-200">
          <h3 className="text-red-600 mb-2">ADVENT ENGINEERS</h3>
          <p className="text-sm text-gray-600">{transformer.rating}, METERING</p>
        </div>

        <div className="mb-4">
          <p className="text-sm">
            <strong>Metering core no:</strong> {coreId}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Transformer ID:</p>
            <p className="font-medium">{transformer.uniqueId}</p>
          </div>
          <div>
            <p className="text-gray-600">Core Number:</p>
            <p className="font-medium">Core {coreNumber}</p>
          </div>
          <div>
            <p className="text-gray-600">Tester:</p>
            <p className="font-medium">{testerName}</p>
          </div>
          <div>
            <p className="text-gray-600">Date:</p>
            <p className="font-medium">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </Card>

      {/* Test Results Tables */}
      <Card className="p-6">
        <h3 className="mb-4">Test Results</h3>

        {/* First Metering Core Table */}
        <div className="mb-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th rowSpan={2} className="border border-gray-300 p-2 text-left text-sm">Testing</th>
                  <th rowSpan={2} className="border border-gray-300 p-2 text-left text-sm">%of primary current</th>
                  <th colSpan={2} className="border border-gray-300 p-2 text-center text-sm">100 % Burden</th>
                  <th colSpan={2} className="border border-gray-300 p-2 text-center text-sm">25 % Burden</th>
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
                  <td rowSpan={5} className="border border-gray-300 p-2 bg-yellow-100 font-medium text-sm">
                    Metering core<br />Ratio- 200/1
                  </td>
                </tr>
                {testData.map((row, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2 text-sm">{row.meteringCore}</td>
                    <td className="border border-gray-300 p-2 text-sm">{row.burden100Ratio}</td>
                    <td className="border border-gray-300 p-2 text-sm">{row.burden100Phase}</td>
                    <td className="border border-gray-300 p-2 text-sm">{row.burden25Ratio}</td>
                    <td className="border border-gray-300 p-2 text-sm">{row.burden25Phase}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Second Metering Core Table */}
        <div className="mb-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <tbody>
                <tr>
                  <td rowSpan={5} className="border border-gray-300 p-2 bg-yellow-100 font-medium text-sm">
                    Metering core<br />Ratio- 400/1
                  </td>
                </tr>
                {secondaryData.map((row, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2 text-sm">{row.meteringCore}</td>
                    <td className="border border-gray-300 p-2 text-sm">{row.burden100Ratio}</td>
                    <td className="border border-gray-300 p-2 text-sm">{row.burden100Phase}</td>
                    <td className="border border-gray-300 p-2 text-sm">{row.burden25Ratio}</td>
                    <td className="border border-gray-300 p-2 text-sm">{row.burden25Phase}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Third Metering Core Table */}
        <div className="mb-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <tbody>
                <tr>
                  <td rowSpan={5} className="border border-gray-300 p-2 bg-yellow-100 font-medium text-sm">
                    Metering core<br />Ratio- 800/1
                  </td>
                </tr>
                {thirdData.map((row, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2 text-sm">{row.meteringCore}</td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        className="h-8 text-sm"
                        value={row.burden100Ratio}
                        onChange={(e) => {
                          const newData = [...thirdData];
                          newData[index].burden100Ratio = e.target.value;
                          setThirdData(newData);
                        }}
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        className="h-8 text-sm"
                        value={row.burden100Phase}
                        onChange={(e) => {
                          const newData = [...thirdData];
                          newData[index].burden100Phase = e.target.value;
                          setThirdData(newData);
                        }}
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        className="h-8 text-sm"
                        value={row.burden25Ratio}
                        onChange={(e) => {
                          const newData = [...thirdData];
                          newData[index].burden25Ratio = e.target.value;
                          setThirdData(newData);
                        }}
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        className="h-8 text-sm"
                        value={row.burden25Phase}
                        onChange={(e) => {
                          const newData = [...thirdData];
                          newData[index].burden25Phase = e.target.value;
                          setThirdData(newData);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
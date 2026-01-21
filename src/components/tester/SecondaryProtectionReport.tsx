import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ArrowLeft, Save, Download, Printer } from 'lucide-react';
import { Transformer } from './SecondaryTransformersList';
import { exportSecondaryProtectionReport } from '../../utils/pdfExport';
import { toast } from 'sonner@2.0.3';

interface SecondaryProtectionReportProps {
  transformer: Transformer;
  coreNumber: number;
  coreId: string;
  testerName: string;
  onBack: () => void;
}

interface ProtectionTestRow {
  ratio: string;
  burden100: string;
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
  const [testData, setTestData] = useState<ProtectionTestRow[]>([
    { ratio: '200/1', burden100: '', secondaryLimitingVtg: '', excitationCurrent: '', compositeError: '' },
    { ratio: '400/1', burden100: '', secondaryLimitingVtg: '', excitationCurrent: '', compositeError: '' },
    { ratio: '800/1', burden100: '', secondaryLimitingVtg: '', excitationCurrent: '', compositeError: '' },
  ]);

  const handleInputChange = (rowIndex: number, field: keyof ProtectionTestRow, value: string) => {
    const newData = [...testData];
    newData[rowIndex][field] = value;
    setTestData(newData);
  };

  const handleSave = () => {
    alert('Protection Report saved successfully!');
  };

  const handleGenerate = () => {
    const reportData = {
      transformerId: transformer.uniqueId,
      coreNumber,
      coreId,
      testerName,
      rating: transformer.rating,
      testData,
    };
    
    exportSecondaryProtectionReport(reportData);
    toast.success('Protection report downloaded successfully!');
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
        <h2>Protection Test Report</h2>
        <p className="text-gray-500 mt-1">Secondary Testing - Protection Core Analysis</p>
      </div>

      {/* Report Header */}
      <Card className="p-6">
        <div className="text-center mb-6 pb-4 border-b border-gray-200">
          <h3 className="text-red-600 mb-2">ADVENT ENGINEERS</h3>
          <p className="text-sm text-gray-600">{transformer.rating}, Protection</p>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm">
              <strong>Protection Core No.:</strong> {coreId}
            </p>
          </div>
          <div className="px-4 py-2 bg-red-100 border border-red-300 rounded">
            <span className="text-red-700">Core ID: {coreId}</span>
          </div>
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

      {/* Protection Test Results Table */}
      <Card className="p-6">
        <h3 className="mb-4">Protection Test Results</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-3 text-left text-sm" rowSpan={2}></th>
                <th className="border border-gray-300 p-3 text-left text-sm" rowSpan={2}>100%</th>
                <th colSpan={3} className="border border-gray-300 p-3 text-center text-sm">100 % Burden</th>
                <th className="border border-gray-300 p-3 text-left text-sm" rowSpan={2}>Protection Core No.</th>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-3 text-sm">Secondary Limiting Vtg</th>
                <th className="border border-gray-300 p-3 text-sm">Excitation Current</th>
                <th className="border border-gray-300 p-3 text-sm">Composite Error</th>
              </tr>
            </thead>
            <tbody>
              {testData.map((row, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 p-3 bg-green-100 font-medium text-sm">
                    Protection Core<br />Ratio- {row.ratio}
                  </td>
                  <td className="border border-gray-300 p-2">
                    <Input
                      className="h-8 text-sm"
                      placeholder="100%"
                      value={row.burden100}
                      onChange={(e) => handleInputChange(index, 'burden100', e.target.value)}
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <Input
                      className="h-8 text-sm"
                      placeholder="Secondary Limiting Vtg"
                      value={row.secondaryLimitingVtg}
                      onChange={(e) => handleInputChange(index, 'secondaryLimitingVtg', e.target.value)}
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <Input
                      className="h-8 text-sm"
                      placeholder="Excitation Current"
                      value={row.excitationCurrent}
                      onChange={(e) => handleInputChange(index, 'excitationCurrent', e.target.value)}
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <Input
                      className="h-8 text-sm"
                      placeholder="Composite Error"
                      value={row.compositeError}
                      onChange={(e) => handleInputChange(index, 'compositeError', e.target.value)}
                    />
                  </td>
                  <td className="border border-gray-300 p-3 bg-gray-50"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h4 className="mb-2">Test Notes</h4>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg min-h-[100px] resize-y"
            placeholder="Enter any observations, notes, or special conditions during protection testing..."
          />
        </div>

        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
          <h4 className="mb-2">Important Guidelines</h4>
          <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
            <li>Ensure all connections are secure before applying test voltage</li>
            <li>Verify burden values match specifications</li>
            <li>Record excitation current at specified voltage levels</li>
            <li>Calculate composite error and compare with acceptable limits</li>
          </ul>
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
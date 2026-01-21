import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ArrowLeft, Save, Download, Printer } from 'lucide-react';
import { Transformer } from './SecondaryTransformersList';
import { exportSecondaryPSReport } from '../../utils/pdfExport';
import { toast } from 'sonner@2.0.3';

interface SecondaryPSReportProps {
  transformer: Transformer;
  coreNumber: number;
  coreId: string;
  testerName: string;
  onBack: () => void;
}

interface PSTestRow {
  ratio: string;
  test1: string;
  test2: string;
  test3: string;
  test4: string;
  test5: string;
}

export function SecondaryPSReport({
  transformer,
  coreNumber,
  coreId,
  testerName,
  onBack,
}: SecondaryPSReportProps) {
  const [testData, setTestData] = useState<PSTestRow[]>([
    { ratio: '200/1', test1: 'Turn Ratio Error at 100%', test2: 'Resistance', test3: '', test4: '', test5: '' },
    { ratio: '400/1', test1: 'Turn Ratio Error at 100%', test2: 'Resistance', test3: 'VA: 500v', test4: 'Isa at VA', test5: 'Isa at 1.1s' },
    { ratio: '400/1', test1: '100%', test2: 'Resistance', test3: 'Resistance', test4: '13 VA : 550', test5: '' },
  ]);

  const handleInputChange = (rowIndex: number, field: keyof PSTestRow, value: string) => {
    const newData = [...testData];
    newData[rowIndex][field] = value;
    setTestData(newData);
  };

  const handleSave = () => {
    alert('PS Report saved successfully!');
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
    
    exportSecondaryPSReport(reportData);
    toast.success('PS report downloaded successfully!');
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
        <h2>PS Test Report</h2>
        <p className="text-gray-500 mt-1">Secondary Testing - PS (Potential/Current Transformer)</p>
      </div>

      {/* Report Header */}
      <Card className="p-6">
        <div className="text-center mb-6 pb-4 border-b border-gray-200">
          <h3 className="text-red-600 mb-2">ADVENT ENGINEERS</h3>
          <p className="text-sm text-gray-600">{transformer.rating}, PS</p>
        </div>

        <div className="mb-4">
          <p className="text-sm">
            <strong>PS Core no:</strong> {coreId}
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

      {/* PS Test Results Table */}
      <Card className="p-6">
        <h3 className="mb-4">PS Test Results</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-3 text-left text-sm">PS Core Ratio</th>
                <th className="border border-gray-300 p-3 text-left text-sm">Turn Ratio Error at 100%</th>
                <th className="border border-gray-300 p-3 text-left text-sm">Resistance</th>
                <th className="border border-gray-300 p-3 text-left text-sm">Resistance</th>
                <th className="border border-gray-300 p-3 text-left text-sm">VA: 500v</th>
                <th className="border border-gray-300 p-3 text-left text-sm">Isa at VA</th>
                <th className="border border-gray-300 p-3 text-left text-sm">Isa at 1.1s</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td rowSpan={1} className="border border-gray-300 p-3 bg-purple-100 font-medium text-sm">
                  200/1
                </td>
                <td className="border border-gray-300 p-2">
                  <Input
                    className="h-8 text-sm"
                    placeholder="Turn Ratio Error at 100%"
                    value={testData[0]?.test1 || ''}
                    onChange={(e) => handleInputChange(0, 'test1', e.target.value)}
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <Input
                    className="h-8 text-sm"
                    placeholder="Resistance"
                    value={testData[0]?.test2 || ''}
                    onChange={(e) => handleInputChange(0, 'test2', e.target.value)}
                  />
                </td>
                <td className="border border-gray-300 p-3 bg-gray-50"></td>
                <td className="border border-gray-300 p-3 bg-gray-50"></td>
                <td className="border border-gray-300 p-3 bg-gray-50"></td>
                <td className="border border-gray-300 p-3 bg-gray-50"></td>
              </tr>

              <tr>
                <td rowSpan={2} className="border border-gray-300 p-3 bg-purple-100 font-medium text-sm">
                  400/1
                </td>
                <td className="border border-gray-300 p-2">
                  <Input
                    className="h-8 text-sm"
                    placeholder="Turn Ratio Error at 100%"
                    value={testData[1]?.test1 || ''}
                    onChange={(e) => handleInputChange(1, 'test1', e.target.value)}
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <Input
                    className="h-8 text-sm"
                    placeholder="Resistance"
                    value={testData[1]?.test2 || ''}
                    onChange={(e) => handleInputChange(1, 'test2', e.target.value)}
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <Input
                    className="h-8 text-sm"
                    placeholder="Resistance"
                    value={testData[1]?.test3 || ''}
                    onChange={(e) => handleInputChange(1, 'test3', e.target.value)}
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <Input
                    className="h-8 text-sm"
                    placeholder="VA: 500v"
                    value={testData[1]?.test4 || ''}
                    onChange={(e) => handleInputChange(1, 'test4', e.target.value)}
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <Input
                    className="h-8 text-sm"
                    placeholder="Isa at VA"
                    value={testData[1]?.test5 || ''}
                    onChange={(e) => handleInputChange(1, 'test5', e.target.value)}
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <Input
                    className="h-8 text-sm"
                    placeholder="Isa at 1.1s"
                  />
                </td>
              </tr>

              <tr>
                <td className="border border-gray-300 p-3 text-sm">100%</td>
                <td className="border border-gray-300 p-2">
                  <Input
                    className="h-8 text-sm"
                    placeholder="Resistance"
                    value={testData[2]?.test2 || ''}
                    onChange={(e) => handleInputChange(2, 'test2', e.target.value)}
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <Input
                    className="h-8 text-sm"
                    placeholder="Resistance"
                    value={testData[2]?.test3 || ''}
                    onChange={(e) => handleInputChange(2, 'test3', e.target.value)}
                  />
                </td>
                <td className="border border-gray-300 p-3 text-sm">13 VA : 550</td>
                <td className="border border-gray-300 p-3 bg-gray-50"></td>
                <td className="border border-gray-300 p-3 bg-gray-50"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-purple-50 rounded-lg">
          <h4 className="mb-2">Test Notes</h4>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg min-h-[100px] resize-y"
            placeholder="Enter any observations, notes, or special conditions during PS testing..."
          />
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
import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { ArrowLeft, Save, Download, Printer } from 'lucide-react';
import { FinalTransformer } from './FinalTransformersList';
import { exportFinalTestReport } from '../../utils/pdfExport';
import { toast } from 'sonner@2.0.3';

interface FinalTestReportProps {
  transformer: FinalTransformer;
  testerName: string;
  onBack: () => void;
}

export function FinalTestReport({
  transformer,
  testerName,
  onBack,
}: FinalTestReportProps) {
  const testDate = new Date().toLocaleDateString();

  // Polarity Testing
  const [polarityResult, setPolarityResult] = useState('');

  // Meggar Test
  const [meggarPrimaryToSecondary, setMeggarPrimaryToSecondary] = useState('');
  const [meggarPrimaryToEarth, setMeggarPrimaryToEarth] = useState('');
  const [meggarSecondaryToEarth, setMeggarSecondaryToEarth] = useState('');
  const [meggarCoreToCore, setMeggarCoreToCore] = useState('');

  // H.V. Test on Secondary Winding
  const [hvSecondaryWinding, setHvSecondaryWinding] = useState('');

  // H.V. Test on Primary Winding
  const [hvPrimaryWinding, setHvPrimaryWinding] = useState('');

  // H.V. Test between Core
  const [hvBetweenCore, setHvBetweenCore] = useState('');

  // O.V.I.T. Test
  const [ovitTest, setOvitTest] = useState('');

  // Accuracy Test
  const [accuracyTest, setAccuracyTest] = useState('');
  const [turnRatioError, setTurnRatioError] = useState('');

  const handleSave = () => {
    alert('Final Test Report saved successfully!');
  };

  const handleGenerate = () => {
    const reportData = {
      transformerId: transformer.uniqueId,
      transformerName: transformer.name,
      rating: transformer.rating,
      voltageClass: transformer.voltageClass,
      testerName,
      polarityResult,
      meggarPrimaryToSecondary,
      meggarPrimaryToEarth,
      meggarSecondaryToEarth,
      meggarCoreToCore,
      hvSecondaryWinding,
      hvPrimaryWinding,
      hvBetweenCore,
      ovitTest,
      accuracyTest,
      turnRatioError,
    };
    
    exportFinalTestReport(reportData);
    toast.success('Final test report downloaded successfully!');
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
        <h2>Final Testing Report</h2>
        <p className="text-gray-500 mt-1">Transformer: {transformer.uniqueId}</p>
      </div>

      {/* Main Report Card */}
      <Card className="p-6">
        {/* Report Header */}
        <div className="text-center mb-6 pb-4 border-b-2 border-gray-800">
          <h3 className="text-red-600 mb-2">FINAL TESTING RECORD OF CURRENT TRANSFORMER</h3>
        </div>

        {/* Transformer Info Section */}
        <div className="mb-6 border border-gray-300">
          <table className="w-full">
            <tbody>
              <tr className="border-b border-gray-300">
                <td className="p-2 text-sm border-r border-gray-300 bg-gray-100 w-1/4">
                  <strong>Transformer Name</strong>
                </td>
                <td className="p-2 text-sm border-r border-gray-300">{transformer.name}</td>
                <td className="p-2 text-sm border-r border-gray-300 bg-gray-100 w-1/4">
                  <strong>Unique ID</strong>
                </td>
                <td className="p-2 text-sm">{transformer.uniqueId}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="p-2 text-sm border-r border-gray-300 bg-gray-100">
                  <strong>Rating</strong>
                </td>
                <td className="p-2 text-sm border-r border-gray-300">{transformer.rating}</td>
                <td className="p-2 text-sm border-r border-gray-300 bg-gray-100">
                  <strong>Voltage Class</strong>
                </td>
                <td className="p-2 text-sm">{transformer.voltageClass}</td>
              </tr>
              <tr>
                <td className="p-2 text-sm border-r border-gray-300 bg-gray-100">
                  <strong>Test Date</strong>
                </td>
                <td className="p-2 text-sm border-r border-gray-300">{testDate}</td>
                <td className="p-2 text-sm border-r border-gray-300 bg-gray-100">
                  <strong>Tested By</strong>
                </td>
                <td className="p-2 text-sm">{testerName}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Final Testing Header */}
        <div className="bg-green-400 border border-gray-800 p-3 mb-4">
          <h3 className="text-center">Final Testing</h3>
        </div>

        {/* Test Sections */}
        <div className="space-y-4">
          {/* 2. Polarity Testing */}
          <div className="border border-gray-300">
            <div className="bg-gray-100 border-b border-gray-300 p-3">
              <h4>2. Polarity Testing</h4>
            </div>
            <div className="p-3">
              <Input
                className="h-10"
                placeholder="Enter polarity test result"
                value={polarityResult}
                onChange={(e) => setPolarityResult(e.target.value)}
              />
            </div>
          </div>

          {/* 3. Meggar Test */}
          <div className="border border-gray-300">
            <div className="bg-gray-100 border-b border-gray-300 p-3">
              <h4>3. Meggar Test</h4>
            </div>
            <div className="p-3">
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 text-sm w-1/3">a) Primary to Secondary</td>
                    <td className="py-2">
                      <Input
                        className="h-9"
                        placeholder="Enter value"
                        value={meggarPrimaryToSecondary}
                        onChange={(e) => setMeggarPrimaryToSecondary(e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 text-sm">b) Primary to Earth</td>
                    <td className="py-2">
                      <Input
                        className="h-9"
                        placeholder="Enter value"
                        value={meggarPrimaryToEarth}
                        onChange={(e) => setMeggarPrimaryToEarth(e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 text-sm">c) Secondary to Earth</td>
                    <td className="py-2">
                      <Input
                        className="h-9"
                        placeholder="Enter value"
                        value={meggarSecondaryToEarth}
                        onChange={(e) => setMeggarSecondaryToEarth(e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-sm">d) Core to Core</td>
                    <td className="py-2">
                      <Input
                        className="h-9"
                        placeholder="Enter value"
                        value={meggarCoreToCore}
                        onChange={(e) => setMeggarCoreToCore(e.target.value)}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. H.V. Test on Secondary Winding */}
          <div className="border border-gray-300">
            <div className="bg-gray-100 border-b border-gray-300 p-3">
              <h4>4. H.V. Test on Secondary Winding</h4>
            </div>
            <div className="p-3">
              <Input
                className="h-10"
                placeholder="Enter H.V. test result"
                value={hvSecondaryWinding}
                onChange={(e) => setHvSecondaryWinding(e.target.value)}
              />
            </div>
          </div>

          {/* 5. H.V. Test on Primary Winding */}
          <div className="border border-gray-300">
            <div className="bg-gray-100 border-b border-gray-300 p-3">
              <h4>5. H.V. Test on Primary Winding</h4>
            </div>
            <div className="p-3">
              <Input
                className="h-10"
                placeholder="Enter H.V. test result"
                value={hvPrimaryWinding}
                onChange={(e) => setHvPrimaryWinding(e.target.value)}
              />
            </div>
          </div>

          {/* 6. H.V. Test between Core */}
          <div className="border border-gray-300">
            <div className="bg-gray-100 border-b border-gray-300 p-3">
              <h4>6. H.V. Test between Core</h4>
            </div>
            <div className="p-3">
              <Input
                className="h-10"
                placeholder="Enter H.V. test result"
                value={hvBetweenCore}
                onChange={(e) => setHvBetweenCore(e.target.value)}
              />
            </div>
          </div>

          {/* 7. O.V.I.T. Test */}
          <div className="border border-gray-300">
            <div className="bg-gray-100 border-b border-gray-300 p-3">
              <h4>7. O.V.I.T. Test</h4>
            </div>
            <div className="p-3">
              <Textarea
                className="min-h-20"
                placeholder="Enter O.V.I.T. test results"
                value={ovitTest}
                onChange={(e) => setOvitTest(e.target.value)}
              />
            </div>
          </div>

          {/* 8. Accuracy Test */}
          <div className="border border-gray-300">
            <div className="bg-yellow-300 border-b border-gray-300 p-3">
              <h4>8. Accuracy Test</h4>
            </div>
            <div className="p-3">
              <div className="space-y-3">
                <div>
                  <label className="text-sm mb-1 block">Turn Ratio Error</label>
                  <Input
                    className="h-10"
                    placeholder="Enter turn ratio error"
                    value={turnRatioError}
                    onChange={(e) => setTurnRatioError(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm mb-1 block">Additional Accuracy Test Results</label>
                  <Textarea
                    className="min-h-24"
                    placeholder="Enter accuracy test results and observations"
                    value={accuracyTest}
                    onChange={(e) => setAccuracyTest(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Signature Section */}
        <div className="mt-6 border border-gray-300">
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
              <tr>
                <td className="border-r border-gray-300 p-3 text-sm">
                  <strong>Date:</strong> {testDate}
                </td>
                <td className="p-3 text-sm">
                  <strong>Approved By:</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Remarks Section */}
        <div className="mt-4 border border-gray-300">
          <div className="bg-blue-100 border-b border-gray-300 p-3">
            <h4>Remarks / Additional Notes</h4>
          </div>
          <div className="p-3">
            <Textarea
              className="min-h-20"
              placeholder="Enter any additional remarks or observations"
            />
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
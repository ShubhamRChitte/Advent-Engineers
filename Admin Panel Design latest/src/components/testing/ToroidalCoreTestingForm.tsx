import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  ArrowLeft, 
  Save, 
  CheckCircle, 
  XCircle,
  Printer,
} from 'lucide-react';
import { toast } from 'sonner';

interface CoreTestData {
  coreVendorNo: string;
  internalCoreNo: string;
  value: string;
  result: 'P' | 'F' | '';
}

interface ToroidalCoreTestingFormProps {
  coreId: string;
  coreType: string;
  orderId: string;
  clientName: string;
  order?: any; // Added to access coreVendors
  onBack: () => void;
  onComplete: () => void;
}

export function ToroidalCoreTestingForm({
  coreId,
  coreType,
  orderId,
  clientName,
  order,
  onBack,
  onComplete,
}: ToroidalCoreTestingFormProps) {
  // Form state based on the Excel format
  const [formData, setFormData] = useState({
    description: '',
    coreSizeMM: '',
    turnUsedForTesting: '10 Turns',
    
    // Specification
    areaSquareCm: '',
    mmpCm: '',
    
    // B (Flux in Tesla)
    voltage: '',
    lexLimit: '',
    
    // Test results array
    testResults: Array(8).fill(null).map(() => ({
      coreVendorNo: '',
      internalCoreNo: '',
      value: '',
      result: '' as 'P' | 'F' | '',
    })),
  });

  const [finalResult, setFinalResult] = useState<'PASS' | 'FAIL' | ''>('');

  useEffect(() => {
    const vendorsObj = (order?.coreVendors) || {};
    const options = vendorsObj[coreType.toLowerCase()] || [];
    if (options.length > 0) {
      const defaultVendor = `${options[0].serialNo} - ${options[0].name}`;
      setFormData(prev => {
        // Only update if they are currently empty (to avoid overwriting user changes)
        if (prev.testResults.every(r => r.coreVendorNo === '')) {
          return {
            ...prev,
            testResults: prev.testResults.map(r => ({
              ...r,
              coreVendorNo: defaultVendor
            }))
          };
        }
        return prev;
      });
    }
  }, [order, coreType]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTestResultChange = (index: number, field: keyof CoreTestData, value: string) => {
    const newTestResults = [...formData.testResults];
    const updatedRow = {
      ...newTestResults[index],
      [field]: value,
    } as CoreTestData;
    
    newTestResults[index] = updatedRow;
    
    setFormData(prev => ({
      ...prev,
      testResults: newTestResults,
    }));

    // Auto-calculate final result
    calculateFinalResult(newTestResults);
  };

  const calculateFinalResult = (testResults: CoreTestData[]) => {
    const filledResults = testResults.filter(r => r.result !== '');
    
    if (filledResults.length === 0) {
      setFinalResult('');
      return;
    }

    const allPass = filledResults.every(r => r.result === 'P');
    setFinalResult(allPass ? 'PASS' : 'FAIL');
  };

  const handleSaveReport = () => {
    // Validate required fields
    if (!formData.coreSizeMM || !formData.areaSquareCm || !formData.mmpCm) {
      toast.error('Please fill in all specification fields');
      return;
    }

    const filledResults = formData.testResults.filter(
      r => r.coreVendorNo && r.internalCoreNo && r.value && r.result
    );

    if (filledResults.length === 0) {
      toast.error('Please add at least one test result');
      return;
    }

    toast.success('Core testing report saved successfully');
    onComplete();
  };

  const handlePrintReport = () => {
    toast.info('Printing report...');
    window.print();
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-GB');
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-GB');
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <Card className="p-6 print:shadow-none">
        <div className="flex items-center justify-between mb-6 print:mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="gap-2 print:hidden"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex gap-2 print:hidden">
            <Button
              variant="outline"
              onClick={handlePrintReport}
              className="gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button
              onClick={handleSaveReport}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4" />
              Save & Complete
            </Button>
          </div>
        </div>

        <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
          <h1 className="text-3xl text-[#003a70] print:text-2xl">ADVENT ENGINEERS</h1>
          <p className="text-sm text-gray-600 mt-1">Toroidal Core Testing Report</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Core ID</p>
            <p className="font-bold font-mono">{coreId}</p>
          </div>
          <div>
            <p className="text-gray-500">Core Type</p>
            <p className="font-bold">{coreType}</p>
          </div>
          <div>
            <p className="text-gray-500">Order ID</p>
            <p className="font-bold">{orderId}</p>
          </div>
          <div>
            <p className="text-gray-500">Client</p>
            <p className="font-bold">{clientName}</p>
          </div>
          <div>
            <p className="text-gray-500">Test Date</p>
            <p className="font-bold">{getCurrentDate()}</p>
          </div>
          <div>
            <p className="text-gray-500">Test Time</p>
            <p className="font-bold">{getCurrentTime()}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-gray-500">Final Result</p>
            {finalResult && (
              <Badge
                className={`mt-1 ${
                  finalResult === 'PASS'
                    ? 'bg-green-100 text-green-700 border-green-300'
                    : 'bg-red-100 text-red-700 border-red-300'
                }`}
              >
                {finalResult === 'PASS' ? (
                  <CheckCircle className="w-4 h-4 mr-1" />
                ) : (
                  <XCircle className="w-4 h-4 mr-1" />
                )}
                {finalResult}
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Testing Form - Excel Layout */}
      <Card className="p-6 print:shadow-none">
        {/* Header Section - Orange */}
        <div className="bg-orange-500 text-white font-bold text-center py-3 rounded-t-lg mb-4">
          <h2 className="text-xl">Toroidal Core Testing</h2>
        </div>

        {/* Description Section - Blue */}
        <div className="bg-blue-400 text-white font-semibold py-2 px-4 mb-2">
          Description
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 border rounded">
          <div>
            <Label className="text-xs">CORE SIZE IN MM</Label>
            <Input
              value={formData.coreSizeMM}
              onChange={(e) => handleInputChange('coreSizeMM', e.target.value)}
              placeholder="e.g., 100 x 200 x 85"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">TURN USED FOR TESTING</Label>
            <Input
              value={formData.turnUsedForTesting}
              onChange={(e) => handleInputChange('turnUsedForTesting', e.target.value)}
              className="mt-1 bg-yellow-50"
            />
          </div>
          <div>
            <Label className="text-xs">DESCRIPTION</Label>
            <Input
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="e.g., M4CRGO, ID-OD-HT"
              className="mt-1"
            />
          </div>
        </div>

        {/* Specification Section - Yellow */}
        <div className="bg-yellow-300 text-gray-800 font-semibold py-2 px-4 mb-2">
          SPECIFICATION
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 border rounded">
          <div>
            <Label className="text-xs">Area (Sq cm)</Label>
            <Input
              type="number"
              step="0.001"
              value={formData.areaSquareCm}
              onChange={(e) => handleInputChange('areaSquareCm', e.target.value)}
              placeholder="e.g., 41.225"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">MMP (cm)</Label>
            <Input
              type="number"
              step="0.1"
              value={formData.mmpCm}
              onChange={(e) => handleInputChange('mmpCm', e.target.value)}
              placeholder="e.g., 47.1"
              className="mt-1"
            />
          </div>
        </div>

        {/* B (Flux in Tesla) Section - Blue */}
        <div className="bg-blue-300 text-gray-800 font-semibold py-2 px-4 mb-2">
          B (Flux in Tesla)
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 border rounded">
          <div className="bg-yellow-100 p-3 rounded">
            <Label className="text-xs">Voltage (V)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.voltage}
              onChange={(e) => handleInputChange('voltage', e.target.value)}
              placeholder="e.g., 7.04"
              className="mt-1"
            />
          </div>
          <div className="bg-blue-100 p-3 rounded">
            <Label className="text-xs">Lex limit (m A)</Label>
            <Input
              type="number"
              step="1"
              value={formData.lexLimit}
              onChange={(e) => handleInputChange('lexLimit', e.target.value)}
              placeholder="e.g., 1696"
              className="mt-1"
            />
          </div>
        </div>

        {/* Test Results Table */}
        <div className="bg-gray-700 text-white font-semibold py-2 px-4 mb-2">
          Test Results
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-xs font-semibold">#</th>
                <th className="border border-gray-300 p-2 text-xs font-semibold">
                  Core Vendor No
                </th>
                <th className="border border-gray-300 p-2 text-xs font-semibold">
                  Internal Core No
                </th>
                <th className="border border-gray-300 p-2 text-xs font-semibold">
                  Value
                </th>
                <th className="border border-gray-300 p-2 text-xs font-semibold">
                  P/F
                </th>
              </tr>
            </thead>
            <tbody>
              {formData.testResults.map((result, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 p-2 text-center font-semibold">
                    {index + 1}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {(() => {
                      const vendorsObj = (order?.coreVendors) || {};
                      const options = vendorsObj[coreType.toLowerCase()] || [];
                      if (options.length > 0) {
                        return (
                          <select
                            value={result.coreVendorNo}
                            onChange={(e) => handleTestResultChange(index, 'coreVendorNo', e.target.value)}
                            className="w-full h-8 text-sm border border-gray-300 rounded px-1"
                          >
                            <option value="">Select Vendor</option>
                            {options.map((v: any) => (
                              <option key={`${v.serialNo}-${v.name}`} value={`${v.serialNo} - ${v.name}`}>
                                {v.serialNo} - {v.name}
                              </option>
                            ))}
                          </select>
                        );
                      }
                      return (
                        <Input
                          value={result.coreVendorNo}
                          onChange={(e) =>
                            handleTestResultChange(index, 'coreVendorNo', e.target.value)
                          }
                          placeholder="Vendor No"
                          className="h-8 text-sm"
                        />
                      );
                    })()}
                  </td>
                  <td className="border border-gray-300 p-2">
                    <Input
                      value={result.internalCoreNo}
                      onChange={(e) =>
                        handleTestResultChange(index, 'internalCoreNo', e.target.value)
                      }
                      placeholder="Internal No"
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <Input
                      type="number"
                      value={result.value}
                      onChange={(e) =>
                        handleTestResultChange(index, 'value', e.target.value)
                      }
                      placeholder="Test Value"
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <select
                      value={result.result}
                      onChange={(e) =>
                        handleTestResultChange(index, 'result', e.target.value)
                      }
                      className="w-full h-8 text-sm border border-gray-300 rounded px-2"
                    >
                      <option value="">-</option>
                      <option value="P">P</option>
                      <option value="F">F</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Final Result Section */}
        <div className="mt-6 p-4 border-2 border-gray-300 rounded-lg bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Overall Test Result</p>
              {finalResult && (
                <Badge
                  className={`text-lg px-4 py-2 ${
                    finalResult === 'PASS'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {finalResult === 'PASS' ? (
                    <CheckCircle className="w-5 h-5 mr-2" />
                  ) : (
                    <XCircle className="w-5 h-5 mr-2" />
                  )}
                  {finalResult}
                </Badge>
              )}
            </div>
            <div className="text-right print:hidden">
              <Button
                onClick={handleSaveReport}
                size="lg"
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-5 h-5" />
                Complete Testing
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Footer Info */}
      <Card className="p-4 print:shadow-none">
        <div className="text-xs text-gray-600 space-y-1">
          <p>
            <strong>Note:</strong> All measurements must be recorded accurately. P = Pass, F =
            Fail
          </p>
          <p>Tested by: __________ | Approved by: __________ | Date: {getCurrentDate()}</p>
        </div>
      </Card>
    </div>
  );
}

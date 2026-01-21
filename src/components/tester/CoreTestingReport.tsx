import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Download, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { CheckCircle } from 'lucide-react';
import { exportCoreTestingReport } from '../../utils/pdfExport';

interface Order {
  jobId: string;
  client: string;
  transformerType: string;
  coresRequired: number;
  assignedDate: string;
  status: string;
  priority: string;
}

interface CoreTestData {
  date: string;
  vendorCoreNo: string;
  internalCoreNo: string;
  bsat1: string;
  bsat2: string;
  bsat3: string;
  bsat4: string;
  remark: string;
}

interface CoreTestingReportProps {
  order: Order;
  onBack: () => void;
}

export function CoreTestingReport({ order, onBack }: CoreTestingReportProps) {
  const [toroidalType, setToroidalType] = useState('M4CRGO');
  const [turnsUsed, setTurnsUsed] = useState('10');
  const [coreSize1, setCoreSize1] = useState('');
  const [coreSize2, setCoreSize2] = useState('');
  const [coreSize3, setCoreSize3] = useState('');
  const [tataRef, setTataRef] = useState('2407-01');
  
  const [bsatSpec, setBsatSpec] = useState('');
  const [setMvSpec, setSetMvSpec] = useState('');
  const [leLimitSpec, setLeLimitSpec] = useState('');

  const [coreTests, setCoreTests] = useState<CoreTestData[]>([]);

  // Auto-generate internal core numbers when component mounts
  useEffect(() => {
    const today = new Date().toLocaleDateString('en-GB');
    const initialTests: CoreTestData[] = Array.from({ length: order.coresRequired }, (_, i) => ({
      date: today,
      vendorCoreNo: '',
      internalCoreNo: `M-${2082 + i}`,
      bsat1: '',
      bsat2: '',
      bsat3: '',
      bsat4: '',
      remark: '',
    }));
    setCoreTests(initialTests);
  }, [order.coresRequired]);

  // Recalculate all Pass/Fail when BSAT spec changes
  useEffect(() => {
    if (!bsatSpec || coreTests.length === 0) return;
    
    const updatedTests = coreTests.map(test => {
      const bsatValues = [
        parseFloat(test.bsat1),
        parseFloat(test.bsat2),
        parseFloat(test.bsat3),
        parseFloat(test.bsat4),
      ].filter(v => !isNaN(v));
      
      if (bsatValues.length === 4) {
        const specValue = parseFloat(bsatSpec);
        const allPass = bsatValues.every(v => v <= specValue);
        return { ...test, remark: allPass ? 'P' : 'F' };
      }
      return test;
    });
    
    setCoreTests(updatedTests);
  }, [bsatSpec]);

  const updateCoreTest = (index: number, field: keyof CoreTestData, value: string) => {
    const updatedTests = [...coreTests];
    updatedTests[index] = { ...updatedTests[index], [field]: value };
    
    // Auto-calculate remark based on BSAT values when entering measurements
    if (field.startsWith('bsat') && bsatSpec) {
      const test = updatedTests[index];
      const bsatValues = [
        parseFloat(test.bsat1),
        parseFloat(test.bsat2),
        parseFloat(test.bsat3),
        parseFloat(test.bsat4),
      ].filter(v => !isNaN(v));
      
      if (bsatValues.length === 4) {
        const specValue = parseFloat(bsatSpec);
        const allPass = bsatValues.every(v => v <= specValue);
        updatedTests[index].remark = allPass ? 'P' : 'F';
      }
    }
    
    setCoreTests(updatedTests);
  };

  const handleSave = () => {
    toast.success('Core testing data saved successfully');
  };

  const handleDownload = () => {
    const reportData = {
      jobId: order.jobId,
      client: order.client,
      transformerType: order.transformerType,
      toroidalType,
      turnsUsed,
      coreSize1,
      coreSize2,
      coreSize3,
      tataRef,
      bsatSpec,
      setMvSpec,
      leLimitSpec,
      coreTests,
    };
    
    exportCoreTestingReport(reportData);
    toast.success('Core testing report downloaded successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
          <div>
            <h2>Core Testing - {order.jobId}</h2>
            <p className="text-gray-500 mt-1">{order.client}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} variant="outline">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button onClick={handleDownload} className="bg-red-600 hover:bg-red-700">
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Testing Report Form */}
      <Card className="p-6 bg-white">
        {/* Report Header */}
        <div className="text-center mb-6 pb-4 border-b-2 border-red-600">
          <h1 className="text-2xl text-red-600">ADVENT ENGINEERS</h1>
        </div>

        {/* Configuration Section */}
        <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-200">
          <div className="space-y-4">
            <div>
              <Label>Toroidal Core testing :</Label>
              <Select value={toroidalType} onValueChange={setToroidalType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M4CRGO">M4CRGO</SelectItem>
                  <SelectItem value="M5CRGO">M5CRGO</SelectItem>
                  <SelectItem value="M6CRGO">M6CRGO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Turns used for testing :</Label>
              <Select value={turnsUsed} onValueChange={setTurnsUsed}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>CORE SIZE IN MM</Label>
            <div className="grid grid-cols-4 gap-2 mt-1">
              <Input
                placeholder="OD"
                value={coreSize1}
                onChange={(e) => setCoreSize1(e.target.value)}
              />
              <Input
                placeholder="ID"
                value={coreSize2}
                onChange={(e) => setCoreSize2(e.target.value)}
              />
              <Input
                placeholder="HT"
                value={coreSize3}
                onChange={(e) => setCoreSize3(e.target.value)}
              />
              <div className="flex items-center">
                <span className="text-sm mr-2">Tata:</span>
                <Input
                  value={tataRef}
                  onChange={(e) => setTataRef(e.target.value)}
                  className="w-24"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-500">
              <div>Area ( Sq. cm )</div>
              <div>MMP ( cm )</div>
            </div>
          </div>
        </div>

        {/* Specification Section */}
        <div className="mb-4">
          <h3 className="text-center mb-3">Specification</h3>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="bg-yellow-100 border border-yellow-300 p-2 rounded">
              <Label className="text-xs">BSAT (G)</Label>
              <Input
                value={bsatSpec}
                onChange={(e) => setBsatSpec(e.target.value)}
                placeholder="Enter BSAT specification"
                className="mt-1"
              />
            </div>
            <div className="bg-blue-100 border border-blue-300 p-2 rounded">
              <Label className="text-xs">SET mV</Label>
              <Input
                value={setMvSpec}
                onChange={(e) => setSetMvSpec(e.target.value)}
                placeholder="Enter SET specification"
                className="mt-1"
              />
            </div>
            <div className="bg-blue-100 border border-blue-300 p-2 rounded">
              <Label className="text-xs">LE LMT in mA</Label>
              <Input
                value={leLimitSpec}
                onChange={(e) => setLeLimitSpec(e.target.value)}
                placeholder="Enter LE Limit"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Testing Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-300">
                <th className="border border-gray-300 p-2 text-sm">Date</th>
                <th className="border border-gray-300 p-2 text-sm">Vendor Core no</th>
                <th className="border border-gray-300 p-2 text-sm">Internal Core No.</th>
                <th className="border border-gray-300 p-2 text-sm" colSpan={4}>BSAT Measurements</th>
                <th className="border border-gray-300 p-2 text-sm">Remark</th>
              </tr>
            </thead>
            <tbody>
              {coreTests.map((test, index) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="border border-gray-300 p-2">
                    <Input
                      type="text"
                      value={test.date}
                      onChange={(e) => updateCoreTest(index, 'date', e.target.value)}
                      className="w-28 text-sm"
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <Input
                      type="text"
                      value={test.vendorCoreNo}
                      onChange={(e) => updateCoreTest(index, 'vendorCoreNo', e.target.value)}
                      placeholder="Vendor #"
                      className="w-24 text-sm"
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <Input
                      type="text"
                      value={test.internalCoreNo}
                      className="w-28 text-sm bg-gray-50"
                      readOnly
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={test.bsat1}
                      onChange={(e) => updateCoreTest(index, 'bsat1', e.target.value)}
                      placeholder="0.0"
                      className="w-20 text-sm"
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={test.bsat2}
                      onChange={(e) => updateCoreTest(index, 'bsat2', e.target.value)}
                      placeholder="0.0"
                      className="w-20 text-sm"
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={test.bsat3}
                      onChange={(e) => updateCoreTest(index, 'bsat3', e.target.value)}
                      placeholder="0.0"
                      className="w-20 text-sm"
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={test.bsat4}
                      onChange={(e) => updateCoreTest(index, 'bsat4', e.target.value)}
                      placeholder="0.0"
                      className="w-20 text-sm"
                    />
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    <span className={`px-2 py-1 rounded text-sm ${
                      test.remark === 'P' 
                        ? 'bg-green-100 text-green-700' 
                        : test.remark === 'F'
                        ? 'bg-red-100 text-red-700'
                        : ''
                    }`}>
                      {test.remark}
                    </span>
                  </td>
                </tr>
              ))}
              
              {/* Add extra empty rows */}
              {Array.from({ length: Math.max(0, 8 - coreTests.length) }, (_, i) => (
                <tr key={`empty-${i}`} className="border-b border-gray-200">
                  <td className="border border-gray-300 p-2 h-12"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Download Button at Bottom */}
        <div className="flex justify-end mt-6">
          <Button onClick={handleDownload} size="sm" className="bg-red-600 hover:bg-red-700">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Approve Section */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-green-900 mb-2">Approve & Forward to Next Stage</h3>
            <p className="text-sm text-gray-700">
              Click approve to complete testing and send notification to Secondary Testing team.
            </p>
          </div>
          <Button
            onClick={() => {
              toast.success('Core testing approved! Notification sent to Secondary Testing team.');
            }}
            className="bg-green-600 hover:bg-green-700 gap-2"
            size="lg"
          >
            <CheckCircle className="w-5 h-5" />
            Approve & Forward
          </Button>
        </div>
      </Card>
    </div>
  );
}
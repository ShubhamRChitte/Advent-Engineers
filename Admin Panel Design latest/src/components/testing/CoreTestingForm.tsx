import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  ArrowLeft,
  Save,
  Printer,
  Plus,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  Tag,
} from 'lucide-react';
import { CoreTestingOrder } from './CoreTestingOrders';
import { FailedCoresManager } from './FailedCoresManager';
import { CoreLabelsPrint } from './CoreLabelsPrint';

interface CoreTestingFormProps {
  order: CoreTestingOrder;
  coreType: 'Metering' | 'PS' | 'Protection';
  onBack: () => void;
}

interface CoreTestRow {
  date: string;
  coreVendorNo: string;
  internalCoreNo: string;
  value1000: string;
  value3000: string;
  value5000: string;
  value7000: string;
  remark: string;
  isReplacement?: boolean;
  replacedCoreId?: string;
}

export interface FailedCore {
  orderId: string;
  jobId: string;
  clientName: string;
  coreType: string;
  internalCoreNo: string;
  coreVendorNo: string;
  date: string;
  failureReason: string;
  value1000: string;
  value3000: string;
  value5000: string;
  value7000: string;
}

export function CoreTestingForm({ order, coreType, onBack }: CoreTestingFormProps) {
  const generateCoreId = (transformerNum: number) => {
    const prefix = coreType === 'Metering' ? 'M' : coreType === 'PS' ? 'PS' : 'P';
    const orderPrefix = order.orderId.replace('ORD-', '').replace('-', '');
    return `${prefix}-${orderPrefix}-${String(transformerNum).padStart(3, '0')}`;
  };

  // Initialize rows
  const initializeRows = (): CoreTestRow[] => {
    return Array.from({ length: 20 }, (_, i) => ({
      date: '',
      coreVendorNo: '',
      internalCoreNo: i < order.transformerQuantity ? generateCoreId(i + 1) : '',
      value1000: '',
      value3000: '',
      value5000: '',
      value7000: '',
      remark: '',
    }));
  };

  const [rows, setRows] = useState<CoreTestRow[]>(initializeRows());
  const [failedCores, setFailedCores] = useState<FailedCore[]>([]);
  const [showFailedCores, setShowFailedCores] = useState(false);
  const [showPrintLabels, setShowPrintLabels] = useState(false);
  const [currentDate] = useState(new Date().toISOString().split('T')[0]);
  const [testDate, setTestDate] = useState(new Date().toLocaleDateString('en-GB'));
  
  // Specification data
  const [specs, setSpecs] = useState({
    coreSize1: '115',
    coreSize2: '145',
    coreSize3: '35',
    turnUsed: '10',
    area: '5.0925',
    mmp: '40.82',
    bFlux: '1.5',
    voltage: '9.6903',
  });

  // LE Limits
  const leLimits = {
    limit1000: 17.1444,
    limit3000: 34.2888,
    limit5000: 42.861,
    limit7000: 56.7398,
  };

  const handleSpecChange = (field: string, value: string) => {
    setSpecs({ ...specs, [field]: value });
  };

  const getFailureReason = (row: CoreTestRow): string => {
    const reasons: string[] = [];
    
    if (row.value1000 && parseFloat(row.value1000) > leLimits.limit1000) {
      reasons.push(`1000G: ${row.value1000}mA > ${leLimits.limit1000}mA`);
    }
    if (row.value3000 && parseFloat(row.value3000) > leLimits.limit3000) {
      reasons.push(`3000G: ${row.value3000}mA > ${leLimits.limit3000}mA`);
    }
    if (row.value5000 && parseFloat(row.value5000) > leLimits.limit5000) {
      reasons.push(`5000G: ${row.value5000}mA > ${leLimits.limit5000}mA`);
    }
    if (row.value7000 && parseFloat(row.value7000) > leLimits.limit7000) {
      reasons.push(`7000G: ${row.value7000}mA > ${leLimits.limit7000}mA`);
    }
    
    return reasons.join('; ');
  };

  const calculateRemark = (row: CoreTestRow): string => {
    // Check if any values are entered
    if (!row.value1000 && !row.value3000 && !row.value5000 && !row.value7000) {
      return '';
    }

    // Check each value against its limit
    const checks = [
      { value: parseFloat(row.value1000), limit: leLimits.limit1000 },
      { value: parseFloat(row.value3000), limit: leLimits.limit3000 },
      { value: parseFloat(row.value5000), limit: leLimits.limit5000 },
      { value: parseFloat(row.value7000), limit: leLimits.limit7000 },
    ];

    // If any value exceeds its limit, it's a fail
    for (const check of checks) {
      if (!isNaN(check.value) && check.value > check.limit) {
        return 'F';
      }
    }

    // If all values are within limits, it's a pass
    return 'P';
  };

  const handleRowChange = (index: number, field: keyof CoreTestRow, value: string) => {
    const updatedRows = [...rows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    
    // Auto-calculate remark when values change
    if (field === 'value1000' || field === 'value3000' || field === 'value5000' || field === 'value7000') {
      updatedRows[index].remark = calculateRemark(updatedRows[index]);
    }
    
    setRows(updatedRows);
  };

  const handleReplaceCore = (index: number) => {
    const failedRow = rows[index];
    
    // Add to failed cores list
    const failedCore: FailedCore = {
      orderId: order.orderId,
      jobId: order.jobId,
      clientName: order.clientName,
      coreType: coreType,
      internalCoreNo: failedRow.internalCoreNo,
      coreVendorNo: failedRow.coreVendorNo,
      date: failedRow.date,
      failureReason: getFailureReason(failedRow),
      value1000: failedRow.value1000,
      value3000: failedRow.value3000,
      value5000: failedRow.value5000,
      value7000: failedRow.value7000,
    };
    
    setFailedCores([...failedCores, failedCore]);
    
    // Reset the row for replacement core
    const updatedRows = [...rows];
    updatedRows[index] = {
      date: '',
      coreVendorNo: '',
      internalCoreNo: failedRow.internalCoreNo,
      value1000: '',
      value3000: '',
      value5000: '',
      value7000: '',
      remark: '',
      isReplacement: true,
      replacedCoreId: failedRow.internalCoreNo,
    };
    
    setRows(updatedRows);
  };

  const addRow = () => {
    setRows([...rows, {
      date: '',
      coreVendorNo: '',
      internalCoreNo: '',
      value1000: '',
      value3000: '',
      value5000: '',
      value7000: '',
      remark: '',
    }]);
  };

  const handleSave = () => {
    console.log('Saving all test data:', { specs, rows, failedCores });
    alert('Test data saved successfully!');
  };

  const getFilledRowsCount = () => {
    return rows.filter(row => row.internalCoreNo && (row.value1000 || row.value3000 || row.value5000 || row.value7000)).length;
  };

  const getPassFailCount = () => {
    const passed = rows.filter(row => row.remark === 'P').length;
    const failed = rows.filter(row => row.remark === 'F').length;
    return { passed, failed };
  };

  const getPassedCores = () => {
    return rows.filter(row => row.remark === 'P' && row.internalCoreNo);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handlePrintLabels = () => {
    const passedCores = getPassedCores();
    if (passedCores.length === 0) {
      alert('No passed cores to print labels for!');
      return;
    }
    setShowPrintLabels(true);
  };

  const { passed, failed } = getPassFailCount();

  if (showPrintLabels) {
    return (
      <CoreLabelsPrint
        cores={getPassedCores()}
        order={order}
        coreType={coreType}
        onBack={() => setShowPrintLabels(false)}
      />
    );
  }

  if (showFailedCores) {
    return (
      <FailedCoresManager
        failedCores={failedCores}
        onBack={() => setShowFailedCores(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="outline"
            onClick={onBack}
            size="sm"
            className="mb-2 gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            Back
          </Button>
          <h2 className="text-xl">Core Testing Report - {coreType}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {order.jobId} - {order.clientName}
          </p>
        </div>
        <div className="flex gap-2">
          {failedCores.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1 border-red-300 text-red-600 hover:bg-red-50"
              onClick={() => setShowFailedCores(true)}
            >
              <AlertTriangle className="w-3 h-3" />
              View Failed ({failedCores.length})
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1"
            onClick={handlePrintReport}
          >
            <Printer className="w-3 h-3" />
            Print Report
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1 border-green-300 text-green-600 hover:bg-green-50"
            onClick={handlePrintLabels}
            disabled={getPassedCores().length === 0}
          >
            <Tag className="w-3 h-3" />
            Print Labels ({getPassedCores().length})
          </Button>
          <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700" onClick={handleSave}>
            <Save className="w-3 h-3" />
            Save All
          </Button>
        </div>
      </div>

      {/* Progress */}
      <Card className="p-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Cores Tested: <span className="font-medium text-gray-900">{getFilledRowsCount()} / {order.transformerQuantity}</span></span>
            <span className="flex items-center gap-1 text-green-600">
              <Check className="w-4 h-4" />
              Pass: <span className="font-medium">{passed}</span>
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <X className="w-4 h-4" />
              Fail: <span className="font-medium">{failed}</span>
            </span>
            {failedCores.length > 0 && (
              <span className="flex items-center gap-1 text-orange-600">
                <AlertTriangle className="w-4 h-4" />
                Replaced: <span className="font-medium">{failedCores.length}</span>
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Testing Form - Table Layout */}
      <Card className="overflow-x-auto">
        <div className="min-w-full">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {/* Title Row with Date */}
              <tr>
                <td colSpan={3} className="bg-[#FFA500] p-3 border border-gray-400 text-center font-bold text-base">
                  Toroidal Core Testing
                </td>
                <td className="bg-white p-2 border border-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Date -</span>
                    <Input
                      value={testDate}
                      onChange={(e) => setTestDate(e.target.value)}
                      className="w-28 h-7 text-xs border-gray-300"
                    />
                  </div>
                </td>
                <td colSpan={5} className="bg-[#4A90E2] p-3 border border-gray-400 text-white font-bold text-center">
                  TOROIDAL CORE NANO CRYSTALLINE
                </td>
              </tr>

              {/* Description and Core Size Row */}
              <tr>
                <td className="bg-[#4A90E2] p-2 border border-gray-400 text-white font-medium">
                  Description-
                </td>
                <td colSpan={3} className="bg-yellow-100 p-2 border border-gray-400">
                  
                </td>
                <td className="bg-yellow-100 p-2 border border-gray-400 text-center font-medium">
                  <Input
                    value={specs.coreSize1}
                    onChange={(e) => handleSpecChange('coreSize1', e.target.value)}
                    className="w-16 h-7 text-center border-gray-300 bg-white"
                  />
                </td>
                <td className="bg-yellow-100 p-2 border border-gray-400 text-center font-medium">
                  <Input
                    value={specs.coreSize2}
                    onChange={(e) => handleSpecChange('coreSize2', e.target.value)}
                    className="w-16 h-7 text-center border-gray-300 bg-white"
                  />
                </td>
                <td className="bg-yellow-100 p-2 border border-gray-400 text-center font-medium">
                  <Input
                    value={specs.coreSize3}
                    onChange={(e) => handleSpecChange('coreSize3', e.target.value)}
                    className="w-16 h-7 text-center border-gray-300 bg-white"
                  />
                </td>
                <td colSpan={2} className="bg-yellow-100 p-2 border border-gray-400 text-center font-medium">
                  ID-OD-HT
                </td>
              </tr>

              {/* Core Size Label Row */}
              <tr>
                <td className="bg-[#4A90E2] p-2 border border-gray-400 text-white font-medium">
                  CORE SIZE IN MM-
                </td>
                <td colSpan={8} className="bg-white p-2 border border-gray-400">
                  
                </td>
              </tr>

              {/* Turn Used Row */}
              <tr>
                <td className="bg-[#4A90E2] p-2 border border-gray-400 text-white font-medium">
                  TURN USED FOR TESTING-
                </td>
                <td colSpan={8} className="bg-yellow-100 p-2 border border-gray-400 text-center font-bold">
                  {specs.turnUsed} TURN
                </td>
              </tr>

              {/* Specification Section */}
              <tr>
                <td rowSpan={2} className="bg-gray-100 p-2 border border-gray-400 font-bold text-center align-middle">
                  Specification
                </td>
                <td className="bg-white p-2 border border-gray-400 font-medium">
                  Area-
                </td>
                <td className="bg-white p-2 border border-gray-400">
                  <Input
                    value={specs.area}
                    onChange={(e) => handleSpecChange('area', e.target.value)}
                    className="w-20 h-7 border-gray-300"
                  />
                </td>
                <td colSpan={6} className="bg-white p-2 border border-gray-400"></td>
              </tr>
              <tr>
                <td className="bg-white p-2 border border-gray-400 font-medium">
                  MMP-
                </td>
                <td className="bg-white p-2 border border-gray-400">
                  <Input
                    value={specs.mmp}
                    onChange={(e) => handleSpecChange('mmp', e.target.value)}
                    className="w-20 h-7 border-gray-300"
                  />
                </td>
                <td colSpan={6} className="bg-white p-2 border border-gray-400"></td>
              </tr>

              {/* BSAT Row */}
              <tr>
                <td className="bg-white p-2 border border-gray-400 font-medium">
                  BSAT(G)
                </td>
                <td className="bg-white p-2 border border-gray-400">
                  
                </td>
                <td className="bg-white p-2 border border-gray-400">
                  
                </td>
                <td className="bg-white p-2 border border-gray-400">
                  
                </td>
                <td className="bg-yellow-100 p-2 border border-gray-400 font-bold text-center">
                  1000
                </td>
                <td className="bg-yellow-100 p-2 border border-gray-400 font-bold text-center">
                  3000
                </td>
                <td className="bg-yellow-100 p-2 border border-gray-400 font-bold text-center">
                  5000
                </td>
                <td className="bg-yellow-100 p-2 border border-gray-400 font-bold text-center">
                  7000
                </td>
                <td className="bg-white p-2 border border-gray-400">
                  
                </td>
              </tr>

              {/* SET mV Row */}
              <tr>
                <td className="bg-[#4A90E2] p-2 border border-gray-400 text-white font-medium">
                  SET mV
                </td>
                <td colSpan={3} className="bg-white p-2 border border-gray-400">
                  
                </td>
                <td className="bg-[#4A90E2] p-2 border border-gray-400 text-white text-center text-xs font-medium">
                  93.1928
                </td>
                <td className="bg-[#4A90E2] p-2 border border-gray-400 text-white text-center text-xs font-medium">
                  277.643
                </td>
                <td className="bg-[#4A90E2] p-2 border border-gray-400 text-white text-center text-xs font-medium">
                  465.964
                </td>
                <td className="bg-[#4A90E2] p-2 border border-gray-400 text-white text-center text-xs font-medium">
                  652.349
                </td>
                <td className="bg-white p-2 border border-gray-400">
                  
                </td>
              </tr>

              {/* LE LIMIT Row */}
              <tr>
                <td className="bg-white p-2 border border-gray-400 font-medium">
                  LE LIMIT in mA.
                </td>
                <td colSpan={3} className="bg-white p-2 border border-gray-400">
                  
                </td>
                <td className="bg-white p-2 border border-gray-400 text-center text-xs font-bold">
                  {leLimits.limit1000}
                </td>
                <td className="bg-white p-2 border border-gray-400 text-center text-xs font-bold">
                  {leLimits.limit3000}
                </td>
                <td className="bg-white p-2 border border-gray-400 text-center text-xs font-bold">
                  {leLimits.limit5000}
                </td>
                <td className="bg-white p-2 border border-gray-400 text-center text-xs font-bold">
                  {leLimits.limit7000}
                </td>
                <td className="bg-[#4A90E2] p-2 border border-gray-400 text-white text-center font-medium">
                  Remark
                </td>
              </tr>

              {/* Column Headers */}
              <tr className="bg-gray-100">
                <td className="p-2 border border-gray-400 font-medium text-center">Date</td>
                <td className="p-2 border border-gray-400 font-medium text-center">Vendor core No.</td>
                <td colSpan={2} className="p-2 border border-gray-400 font-medium text-center">Internal core No.</td>
                <td className="p-2 border border-gray-400 font-medium text-center">1000</td>
                <td className="p-2 border border-gray-400 font-medium text-center">3000</td>
                <td className="p-2 border border-gray-400 font-medium text-center">5000</td>
                <td className="p-2 border border-gray-400 font-medium text-center">7000</td>
                <td className="p-2 border border-gray-400 font-medium text-center">Remark</td>
              </tr>

              {/* Data Entry Rows */}
              {rows.map((row, index) => (
                <tr key={index} className={`hover:bg-gray-50 ${row.isReplacement ? 'bg-blue-50' : ''}`}>
                  <td className="p-1 border border-gray-300">
                    <Input
                      value={row.date}
                      onChange={(e) => handleRowChange(index, 'date', e.target.value)}
                      className="w-24 h-8 text-xs border-0 focus:ring-1"
                      placeholder="DD/MM/YY"
                    />
                  </td>
                  <td className="p-1 border border-gray-300">
                    <Input
                      value={row.coreVendorNo}
                      onChange={(e) => handleRowChange(index, 'coreVendorNo', e.target.value)}
                      className="w-20 h-8 text-xs border-0 focus:ring-1"
                      placeholder="16"
                    />
                  </td>
                  <td colSpan={2} className="p-1 border border-gray-300">
                    <div className="flex items-center gap-1">
                      <Input
                        value={row.internalCoreNo}
                        onChange={(e) => handleRowChange(index, 'internalCoreNo', e.target.value)}
                        className="flex-1 h-8 text-xs border-0 focus:ring-1 font-mono"
                        placeholder={index < order.transformerQuantity ? generateCoreId(index + 1) : ''}
                      />
                      {row.isReplacement && (
                        <span className="text-xs text-blue-600 font-medium whitespace-nowrap">(R)</span>
                      )}
                    </div>
                  </td>
                  <td className="p-1 border border-gray-300">
                    <Input
                      value={row.value1000}
                      onChange={(e) => handleRowChange(index, 'value1000', e.target.value)}
                      className={`w-16 h-8 text-xs border-0 focus:ring-1 text-center ${
                        row.value1000 && parseFloat(row.value1000) > leLimits.limit1000 ? 'bg-red-100 text-red-700 font-medium' : ''
                      }`}
                      placeholder="9.5"
                    />
                  </td>
                  <td className="p-1 border border-gray-300">
                    <Input
                      value={row.value3000}
                      onChange={(e) => handleRowChange(index, 'value3000', e.target.value)}
                      className={`w-16 h-8 text-xs border-0 focus:ring-1 text-center ${
                        row.value3000 && parseFloat(row.value3000) > leLimits.limit3000 ? 'bg-red-100 text-red-700 font-medium' : ''
                      }`}
                      placeholder="18.3"
                    />
                  </td>
                  <td className="p-1 border border-gray-300">
                    <Input
                      value={row.value5000}
                      onChange={(e) => handleRowChange(index, 'value5000', e.target.value)}
                      className={`w-16 h-8 text-xs border-0 focus:ring-1 text-center ${
                        row.value5000 && parseFloat(row.value5000) > leLimits.limit5000 ? 'bg-red-100 text-red-700 font-medium' : ''
                      }`}
                      placeholder="24.7"
                    />
                  </td>
                  <td className="p-1 border border-gray-300">
                    <Input
                      value={row.value7000}
                      onChange={(e) => handleRowChange(index, 'value7000', e.target.value)}
                      className={`w-16 h-8 text-xs border-0 focus:ring-1 text-center ${
                        row.value7000 && parseFloat(row.value7000) > leLimits.limit7000 ? 'bg-red-100 text-red-700 font-medium' : ''
                      }`}
                      placeholder="30.6"
                    />
                  </td>
                  <td className="p-1 border border-gray-300">
                    <div className="flex items-center justify-center gap-1">
                      <div className={`w-8 h-8 flex items-center justify-center font-bold ${
                        row.remark === 'P' ? 'text-green-600 bg-green-50' : 
                        row.remark === 'F' ? 'text-red-600 bg-red-50' : ''
                      }`}>
                        {row.remark}
                      </div>
                      {row.remark === 'F' && !row.isReplacement && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReplaceCore(index)}
                          className="h-7 px-2 text-xs gap-1 border-orange-300 text-orange-600 hover:bg-orange-50"
                          title="Replace this failed core"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Replace
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add More Rows Button */}
      <div className="flex justify-center">
        <Button variant="outline" size="sm" onClick={addRow} className="gap-1">
          <Plus className="w-3 h-3" />
          Add More Rows
        </Button>
      </div>

      {/* Completion Summary */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-blue-900">Testing Summary</h4>
            <p className="text-sm text-blue-700 mt-1">
              {getFilledRowsCount()} cores tested out of {order.transformerQuantity} total
              {failedCores.length > 0 && ` • ${failedCores.length} cores replaced`}
            </p>
          </div>
          {getFilledRowsCount() === order.transformerQuantity && (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-5 h-5" />
              <span className="font-medium">Complete</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

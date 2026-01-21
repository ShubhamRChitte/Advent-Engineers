import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  ArrowLeft,
  AlertTriangle,
  Printer,
  Search,
  Download,
} from 'lucide-react';
import { FailedCore } from './CoreTestingForm';

interface FailedCoresManagerProps {
  failedCores: FailedCore[];
  onBack: () => void;
}

export function FailedCoresManager({ failedCores, onBack }: FailedCoresManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCores = failedCores.filter(core =>
    core.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    core.jobId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    core.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    core.internalCoreNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    core.coreVendorNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupByVendor = () => {
    const grouped: { [key: string]: FailedCore[] } = {};
    failedCores.forEach(core => {
      if (!grouped[core.coreVendorNo]) {
        grouped[core.coreVendorNo] = [];
      }
      grouped[core.coreVendorNo].push(core);
    });
    return grouped;
  };

  const groupByOrder = () => {
    const grouped: { [key: string]: FailedCore[] } = {};
    failedCores.forEach(core => {
      if (!grouped[core.orderId]) {
        grouped[core.orderId] = [];
      }
      grouped[core.orderId].push(core);
    });
    return grouped;
  };

  const handlePrint = () => {
    window.print();
  };

  const vendorGroups = groupByVendor();
  const orderGroups = groupByOrder();

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
            Back to Testing
          </Button>
          <h2 className="text-2xl font-bold text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            Failed Cores Management
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Track and manage cores that failed testing - Return to vendor for repair
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={handlePrint}>
            <Printer className="w-3 h-3" />
            Print Report
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="w-3 h-3" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="text-sm text-red-600 font-medium">Total Failed Cores</div>
          <div className="text-3xl font-bold text-red-700 mt-1">{failedCores.length}</div>
        </Card>
        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="text-sm text-orange-600 font-medium">Unique Vendors</div>
          <div className="text-3xl font-bold text-orange-700 mt-1">{Object.keys(vendorGroups).length}</div>
        </Card>
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <div className="text-sm text-yellow-700 font-medium">Affected Orders</div>
          <div className="text-3xl font-bold text-yellow-800 mt-1">{Object.keys(orderGroups).length}</div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Order ID, Job ID, Client, Core No, or Vendor No..."
            className="border-0 focus:ring-0 shadow-none"
          />
        </div>
      </Card>

      {/* Grouped by Vendor */}
      <Card className="p-4">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="bg-red-100 text-red-700 px-3 py-1 rounded">Grouped by Vendor</span>
          <span className="text-sm text-gray-500">({Object.keys(vendorGroups).length} vendors)</span>
        </h3>
        
        <div className="space-y-4">
          {Object.entries(vendorGroups).map(([vendorNo, cores]) => (
            <div key={vendorNo} className="border border-red-200 rounded-lg overflow-hidden">
              <div className="bg-red-100 p-3 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-red-900">Vendor No: {vendorNo || 'Not Specified'}</h4>
                  <p className="text-sm text-red-700">Total Failed Cores: {cores.length}</p>
                </div>
                <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                  Generate Return Form
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-2 text-left font-medium">Date</th>
                      <th className="p-2 text-left font-medium">Order ID</th>
                      <th className="p-2 text-left font-medium">Job ID</th>
                      <th className="p-2 text-left font-medium">Client</th>
                      <th className="p-2 text-left font-medium">Core Type</th>
                      <th className="p-2 text-left font-medium">Internal Core No</th>
                      <th className="p-2 text-left font-medium">Failure Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cores.map((core, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-2">{core.date}</td>
                        <td className="p-2 font-mono text-xs">{core.orderId}</td>
                        <td className="p-2 font-mono text-xs">{core.jobId}</td>
                        <td className="p-2">{core.clientName}</td>
                        <td className="p-2">{core.coreType}</td>
                        <td className="p-2 font-mono font-medium text-red-700">{core.internalCoreNo}</td>
                        <td className="p-2 text-xs text-red-600">{core.failureReason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Grouped by Order */}
      <Card className="p-4">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded">Grouped by Order</span>
          <span className="text-sm text-gray-500">({Object.keys(orderGroups).length} orders)</span>
        </h3>
        
        <div className="space-y-4">
          {Object.entries(orderGroups).map(([orderId, cores]) => (
            <div key={orderId} className="border border-blue-200 rounded-lg overflow-hidden">
              <div className="bg-blue-100 p-3">
                <h4 className="font-bold text-blue-900">Order: {orderId}</h4>
                <p className="text-sm text-blue-700">
                  {cores[0].jobId} - {cores[0].clientName} - Failed Cores: {cores.length}
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-2 text-left font-medium">Date</th>
                      <th className="p-2 text-left font-medium">Core Type</th>
                      <th className="p-2 text-left font-medium">Internal Core No</th>
                      <th className="p-2 text-left font-medium">Vendor No</th>
                      <th className="p-2 text-left font-medium">Failure Reason</th>
                      <th className="p-2 text-left font-medium">Test Values</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cores.map((core, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-2">{core.date}</td>
                        <td className="p-2">{core.coreType}</td>
                        <td className="p-2 font-mono font-medium text-red-700">{core.internalCoreNo}</td>
                        <td className="p-2">{core.coreVendorNo}</td>
                        <td className="p-2 text-xs text-red-600">{core.failureReason}</td>
                        <td className="p-2 text-xs">
                          <span className="font-mono">
                            1K:{core.value1000} | 3K:{core.value3000} | 5K:{core.value5000} | 7K:{core.value7000}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* All Failed Cores Table */}
      <Card className="p-4">
        <h3 className="text-lg font-bold mb-4">All Failed Cores ({filteredCores.length})</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="p-2 text-left font-medium">Date</th>
                <th className="p-2 text-left font-medium">Order ID</th>
                <th className="p-2 text-left font-medium">Job ID</th>
                <th className="p-2 text-left font-medium">Client</th>
                <th className="p-2 text-left font-medium">Core Type</th>
                <th className="p-2 text-left font-medium">Internal Core No</th>
                <th className="p-2 text-left font-medium">Vendor No</th>
                <th className="p-2 text-left font-medium">Failure Reason</th>
              </tr>
            </thead>
            <tbody>
              {filteredCores.map((core, index) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-2">{core.date}</td>
                  <td className="p-2 font-mono text-xs">{core.orderId}</td>
                  <td className="p-2 font-mono text-xs">{core.jobId}</td>
                  <td className="p-2">{core.clientName}</td>
                  <td className="p-2">{core.coreType}</td>
                  <td className="p-2 font-mono font-medium text-red-700">{core.internalCoreNo}</td>
                  <td className="p-2">{core.coreVendorNo}</td>
                  <td className="p-2 text-xs text-red-600">{core.failureReason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Notes */}
      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <h4 className="font-bold text-yellow-900 mb-2">📋 Vendor Return Instructions</h4>
        <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
          <li>All failed cores must be documented and returned to respective vendors for warranty/repair</li>
          <li>Generate return forms grouped by vendor for easier processing</li>
          <li>Replacement cores have been logged with (R) marker in the testing system</li>
          <li>Keep detailed records of failure reasons for quality control and vendor feedback</li>
          <li>Follow company policy for core handling and vendor communication</li>
        </ul>
      </Card>
    </div>
  );
}

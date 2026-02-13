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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface FailedCoresManagerProps {
  failedCores: FailedCore[];
  onBack: () => void;
}

// Production-Safe Helper: Normalizes strings to prevent crashes
const safeLower = (value: string | undefined | null): string => {
  return (value || "").toString().toLowerCase();
};

export function FailedCoresManager({ failedCores, onBack }: FailedCoresManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Structural Protection: Ensure failedCores is always an array
  const safeCores = Array.isArray(failedCores) ? failedCores : [];

  // Debug Visibility (Temporary for verification, remove in final prod if noisy)
  // console.log("FAILED CORES API:", safeCores); 

  // 2. Safe Filtering Logic
  const filteredCores = safeCores.filter(core => {
    if (!core) return false;
    const searchLow = safeLower(searchTerm);
    return (
      safeLower(core.orderId).includes(searchLow) ||
      safeLower(core.jobId).includes(searchLow) ||
      safeLower(core.clientName).includes(searchLow) ||
      safeLower(core.internalCoreNo).includes(searchLow) ||
      safeLower(core.coreVendorNo).includes(searchLow) ||
      safeLower(core.vendorCoreNo).includes(searchLow) // Added potential backend field match
    );
  });

  const groupByVendor = () => {
    const grouped: { [key: string]: FailedCore[] } = {};
    safeCores.forEach(core => {
      // Handle missing vendor numbers gracefully
      const vendorKey = core.coreVendorNo || core.vendorCoreNo || "Unknown Vendor";
      if (!grouped[vendorKey]) {
        grouped[vendorKey] = [];
      }
      grouped[vendorKey].push(core);
    });
    return grouped;
  };

  const groupByOrder = () => {
    const grouped: { [key: string]: FailedCore[] } = {};
    safeCores.forEach(core => {
      // Handle missing order IDs gracefully
      const orderKey = core.orderId ? String(core.orderId) : "Unknown Order";
      if (!grouped[orderKey]) {
        grouped[orderKey] = [];
      }
      grouped[orderKey].push(core);
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
          <div className="text-3xl font-bold text-red-700 mt-1">{safeCores.length}</div>
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

      {/* Tabbed View */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-transparent p-0 gap-2 mb-4 flex-wrap h-auto">
          <TabsTrigger
            value="all"
            className="border border-gray-200 bg-white hover:bg-gray-50 data-[state=active]:bg-red-50 data-[state=active]:border-red-500 data-[state=active]:text-red-700 px-4 py-2 rounded-md shadow-sm transition-all"
          >
            All Failed Cores ({filteredCores.length})
          </TabsTrigger>
          <TabsTrigger
            value="vendor"
            className="border border-gray-200 bg-white hover:bg-gray-50 data-[state=active]:bg-red-50 data-[state=active]:border-red-500 data-[state=active]:text-red-700 px-4 py-2 rounded-md shadow-sm transition-all"
          >
            Grouped by Vendor ({Object.keys(vendorGroups).length})
          </TabsTrigger>
          <TabsTrigger
            value="order"
            className="border border-gray-200 bg-white hover:bg-gray-50 data-[state=active]:bg-blue-50 data-[state=active]:border-blue-500 data-[state=active]:text-blue-700 px-4 py-2 rounded-md shadow-sm transition-all"
          >
            Grouped by Order ({Object.keys(orderGroups).length})
          </TabsTrigger>
        </TabsList>

        {/* Tab: All Cores */}
        <TabsContent value="all">
          <Card className="p-4">
            <h3 className="text-lg font-bold mb-4">All Failed Cores List</h3>
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
                      <td className="p-2">{String(core.date || '')}</td>
                      <td className="p-2 font-mono text-xs">{String(core.orderId || '')}</td>
                      <td className="p-2 font-mono text-xs">{String(core.jobId || '')}</td>
                      <td className="p-2">{String(core.clientName || '')}</td>
                      <td className="p-2">{String(core.coreType || '')}</td>
                      <td className="p-2 font-mono font-medium text-red-700">{String(core.internalCoreNo || '')}</td>
                      <td className="p-2">{String(core.coreVendorNo || core.vendorCoreNo || '')}</td>
                      <td className="p-2 text-xs text-red-600">{String(core.failureReason || '')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab: Grouped by Vendor */}
        <TabsContent value="vendor">
          <Card className="p-4">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded">Vendor Metrics</span>
            </h3>
            <div className="space-y-4">
              {Object.entries(vendorGroups).map(([vendorNo, cores]) => (
                <div key={vendorNo} className="border border-red-200 rounded-lg overflow-hidden">
                  <div className="bg-red-100 p-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-red-900">Vendor No: {vendorNo}</h4>
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
                            <td className="p-2">{String(core.date || '')}</td>
                            <td className="p-2 font-mono text-xs">{String(core.orderId || '')}</td>
                            <td className="p-2 font-mono text-xs">{String(core.jobId || '')}</td>
                            <td className="p-2">{String(core.clientName || '')}</td>
                            <td className="p-2">{String(core.coreType || '')}</td>
                            <td className="p-2 font-mono font-medium text-red-700">{String(core.internalCoreNo || '')}</td>
                            <td className="p-2 text-xs text-red-600">{String(core.failureReason || '')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Tab: Grouped by Order */}
        <TabsContent value="order">
          <Card className="p-4">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded">Order Metrics</span>
            </h3>
            <div className="space-y-4">
              {Object.entries(orderGroups).map(([orderId, cores]) => (
                <div key={orderId} className="border border-blue-200 rounded-lg overflow-hidden">
                  <div className="bg-blue-100 p-3">
                    <h4 className="font-bold text-blue-900">Order: {orderId}</h4>
                    <p className="text-sm text-blue-700">
                      {cores[0]?.jobId || 'Unknown Job'} - {cores[0]?.clientName || 'Unknown Client'} - Failed Cores: {cores.length}
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
                            <td className="p-2">{String(core.date || '')}</td>
                            <td className="p-2">{String(core.coreType || '')}</td>
                            <td className="p-2 font-mono font-medium text-red-700">{String(core.internalCoreNo || '')}</td>
                            <td className="p-2">{String(core.coreVendorNo || core.vendorCoreNo || '')}</td>
                            <td className="p-2 text-xs text-red-600">{String(core.failureReason || '')}</td>
                            <td className="p-2 text-xs">
                              <span className="font-mono">
                                1K:{String(core.value1000 || '-')} | 3K:{String(core.value3000 || '-')} | 5K:{String(core.value5000 || '-')} | 7K:{String(core.value7000 || '-')}
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
        </TabsContent>
      </Tabs>

      {/* Notes */}
      < Card className="p-4 bg-yellow-50 border-yellow-200" >
        <h4 className="font-bold text-yellow-900 mb-2">📋 Vendor Return Instructions</h4>
        <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
          <li>All failed cores must be documented and returned to respective vendors for warranty/repair</li>
          <li>Generate return forms grouped by vendor for easier processing</li>
          <li>Replacement cores have been logged with (R) marker in the testing system</li>
          <li>Keep detailed records of failure reasons for quality control and vendor feedback</li>
          <li>Follow company policy for core handling and vendor communication</li>
        </ul>
      </Card >
    </div >
  );
}

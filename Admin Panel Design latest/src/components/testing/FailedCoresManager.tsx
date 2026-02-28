import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  ArrowLeft,
  AlertTriangle,
  Printer,
  Search,
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
  const [localCores, setLocalCores] = useState<FailedCore[]>([]);
  const [selectedCores, setSelectedCores] = useState<string[]>([]);

  useEffect(() => {
    // 1. Structural Protection: Ensure failedCores is always an array
    setLocalCores(Array.isArray(failedCores) ? failedCores : []);
  }, [failedCores]);

  // Debug Visibility (Temporary for verification, remove in final prod if noisy)
  // console.log("FAILED CORES API:", localCores); 

  // 2. Safe Filtering Logic
  const filteredCores = localCores.filter(core => {
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
    localCores.forEach(core => {
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
    localCores.forEach(core => {
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

  const handleReturnToVendor = async (coreId?: string) => {
    if (!coreId) {
      alert("This core has not been saved to the database yet. Please save testing data first.");
      return;
    }

    if (!window.confirm("Are you sure you want to return this core to the vendor? This action is irreversible.")) {
      return;
    }

    try {
      // API Call to backend
      const { default: axios } = await import('axios');
      const res = await axios.put(`http://localhost:3002/api/failed-cores/${coreId}/return`, {}, { withCredentials: true });

      if (res.data.success) {
        alert("Core successfully marked as RETURNED to vendor.");
        // Update local state to show it immediately
        setLocalCores(prev => prev.map(c =>
          c._id === coreId ? { ...c, status: "RETURNED" } : c
        ));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to return core to vendor");
    }
  };

  const handleBulkReturn = async () => {
    if (selectedCores.length === 0) return;
    if (!window.confirm(`Are you sure you want to return ${selectedCores.length} selected cores?`)) return;

    try {
      const { default: axios } = await import('axios');
      const res = await axios.post(`http://localhost:3002/api/failed-cores/bulk-return`, { coreIds: selectedCores }, { withCredentials: true });
      if (res.data.success) {
        alert(res.data.message);
        setLocalCores(prev => prev.map(c => c._id && selectedCores.includes(c._id) ? { ...c, status: "RETURNED" } : c));
        setSelectedCores([]);
      }
    } catch (err: any) {
      alert("Failed to perform bulk return");
    }
  };

  const handleUndoReturn = async (coreId?: string) => {
    if (!coreId) return;
    if (!window.confirm("Are you sure you want to undo the return of this core? It will be marked as FAILED again.")) return;

    try {
      const { default: axios } = await import('axios');
      const res = await axios.put(`http://localhost:3002/api/failed-cores/${coreId}/undo-return`, {}, { withCredentials: true });
      if (res.data.success) {
        alert("Core return undone successfully.");
        setLocalCores(prev => prev.map(c => c._id === coreId ? { ...c, status: "FAILED" } : c));
        setSelectedCores(prev => prev.filter(id => id !== coreId));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to undo return");
    }
  };

  const toggleSelectAll = (coresToToggle: FailedCore[]) => {
    const returnable = coresToToggle.filter(c => (c as any).status !== "RETURNED" && c._id);
    const returnableIds = returnable.map(c => c._id as string);
    const allSelected = returnableIds.length > 0 && returnableIds.every(id => selectedCores.includes(id));
    if (allSelected) {
      setSelectedCores(prev => prev.filter(id => !returnableIds.includes(id)));
    } else {
      const newSelected = new Set([...selectedCores, ...returnableIds]);
      setSelectedCores(Array.from(newSelected));
    }
  };

  const toggleSelectOne = (coreId?: string) => {
    if (!coreId) return;
    setSelectedCores(prev => prev.includes(coreId) ? prev.filter(id => id !== coreId) : [...prev, coreId]);
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
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="text-sm text-red-600 font-medium">Total Failed Cores</div>
          <div className="text-3xl font-bold text-red-700 mt-1">{localCores.length}</div>
        </Card>
        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="text-sm text-orange-600 font-medium">Pending Return</div>
          <div className="text-3xl font-bold text-orange-700 mt-1">{localCores.filter(c => (c as any).status !== 'RETURNED').length}</div>
        </Card>
        <Card className="p-4 border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600 font-medium">Returned to Vendor</div>
          <div className="text-3xl font-bold text-gray-700 mt-1">{localCores.filter(c => (c as any).status === 'RETURNED').length}</div>
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

      {/* Bulk Actions */}
      {selectedCores.length > 0 && (
        <div className="bg-red-50 p-3 rounded-md flex items-center justify-between border border-red-200">
          <span className="text-red-700 font-medium">{selectedCores.length} cores selected for return</span>
          <Button onClick={handleBulkReturn} size="sm" className="bg-red-600 hover:bg-red-700 text-white">
            Return Selected to Vendor
          </Button>
        </div>
      )}

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
                    <th className="p-2 w-10">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                        checked={filteredCores.filter(c => (c as any).status !== 'RETURNED' && c._id).length > 0 && filteredCores.filter(c => (c as any).status !== 'RETURNED' && c._id).every(c => selectedCores.includes(c._id as string))}
                        onChange={() => toggleSelectAll(filteredCores)}
                      />
                    </th>
                    <th className="p-2 text-left font-medium">Date</th>
                    <th className="p-2 text-left font-medium">Order ID</th>
                    <th className="p-2 text-left font-medium">Job ID</th>
                    <th className="p-2 text-left font-medium">Client</th>
                    <th className="p-2 text-left font-medium">Core Type</th>
                    <th className="p-2 text-left font-medium">Internal Core No</th>
                    <th className="p-2 text-left font-medium">Vendor No</th>
                    <th className="p-2 text-left font-medium">Failure Reason</th>
                    <th className="p-2 text-left font-medium">Status</th>
                    <th className="p-2 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCores.map((core, index) => (
                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-2">
                        {(core as any).status !== "RETURNED" && core._id && (
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                            checked={selectedCores.includes(core._id)}
                            onChange={() => toggleSelectOne(core._id)}
                          />
                        )}
                      </td>
                      <td className="p-2">{core.failedAt ? new Date(core.failedAt).toLocaleDateString('en-GB') : (core.createdAt ? new Date(core.createdAt).toLocaleDateString('en-GB') : '-')}</td>
                      <td className="p-2 font-mono text-xs">{String(core.orderId || '')}</td>
                      <td className="p-2 font-mono text-xs">{String(core.jobId || '')}</td>
                      <td className="p-2">{String(core.clientName || '')}</td>
                      <td className="p-2">{String(core.coreType || '')}</td>
                      <td className="p-2 font-mono font-medium text-red-700">{String(core.internalCoreNo || '')}</td>
                      <td className="p-2">{String(core.coreVendorNo || core.vendorCoreNo || '')}</td>
                      <td className="p-2 text-xs text-red-600">{String(core.failureReason || '')}</td>
                      <td className="p-2">
                        {(core as any).status === "RETURNED" ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            🔄 RETURNED
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                            ❌ FAILED
                          </span>
                        )}
                      </td>
                      <td className="p-2 flex gap-2">
                        {(core as any).status !== "RETURNED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs border-orange-300 text-orange-700 hover:bg-orange-50"
                            onClick={() => handleReturnToVendor(core._id)}
                          >
                            Return
                          </Button>
                        )}
                        {(core as any).status === "RETURNED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs border-gray-300 text-gray-700 hover:bg-gray-50"
                            onClick={() => handleUndoReturn(core._id)}
                          >
                            Undo
                          </Button>
                        )}
                      </td>
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
                          <th className="p-2 w-10">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                              checked={cores.filter(c => (c as any).status !== 'RETURNED' && c._id).length > 0 && cores.filter(c => (c as any).status !== 'RETURNED' && c._id).every(c => selectedCores.includes(c._id as string))}
                              onChange={() => toggleSelectAll(cores)}
                            />
                          </th>
                          <th className="p-2 text-left font-medium">Date</th>
                          <th className="p-2 text-left font-medium">Order ID</th>
                          <th className="p-2 text-left font-medium">Job ID</th>
                          <th className="p-2 text-left font-medium">Client</th>
                          <th className="p-2 text-left font-medium">Core Type</th>
                          <th className="p-2 text-left font-medium">Internal Core No</th>
                          <th className="p-2 text-left font-medium">Failure Reason</th>
                          <th className="p-2 text-left font-medium">Status</th>
                          <th className="p-2 text-left font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cores.map((core, idx) => (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="p-2">
                              {(core as any).status !== "RETURNED" && core._id && (
                                <input
                                  type="checkbox"
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                  checked={selectedCores.includes(core._id)}
                                  onChange={() => toggleSelectOne(core._id)}
                                />
                              )}
                            </td>
                            <td className="p-2">{core.failedAt ? new Date(core.failedAt).toLocaleDateString('en-GB') : (core.createdAt ? new Date(core.createdAt).toLocaleDateString('en-GB') : '-')}</td>
                            <td className="p-2 font-mono text-xs">{String(core.orderId || '')}</td>
                            <td className="p-2 font-mono text-xs">{String(core.jobId || '')}</td>
                            <td className="p-2">{String(core.clientName || '')}</td>
                            <td className="p-2">{String(core.coreType || '')}</td>
                            <td className="p-2 font-mono font-medium text-red-700">{String(core.internalCoreNo || '')}</td>
                            <td className="p-2 text-xs text-red-600">{String(core.failureReason || '')}</td>
                            <td className="p-2">
                              {(core as any).status === "RETURNED" ? (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  🔄 RETURNED
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                                  ❌ FAILED
                                </span>
                              )}
                            </td>
                            <td className="p-2 flex gap-2">
                              {(core as any).status !== "RETURNED" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs border-orange-300 text-orange-700 hover:bg-orange-50"
                                  onClick={() => handleReturnToVendor(core._id)}
                                >
                                  Return
                                </Button>
                              )}
                              {(core as any).status === "RETURNED" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs border-gray-300 text-gray-700 hover:bg-gray-50"
                                  onClick={() => handleUndoReturn(core._id)}
                                >
                                  Undo
                                </Button>
                              )}
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
                          <th className="p-2 w-10">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                              checked={cores.filter(c => (c as any).status !== 'RETURNED' && c._id).length > 0 && cores.filter(c => (c as any).status !== 'RETURNED' && c._id).every(c => selectedCores.includes(c._id as string))}
                              onChange={() => toggleSelectAll(cores)}
                            />
                          </th>
                          <th className="p-2 text-left font-medium">Date</th>
                          <th className="p-2 text-left font-medium">Core Type</th>
                          <th className="p-2 text-left font-medium">Internal Core No</th>
                          <th className="p-2 text-left font-medium">Vendor No</th>
                          <th className="p-2 text-left font-medium">Failure Reason</th>
                          <th className="p-2 text-left font-medium">Test Values</th>
                          <th className="p-2 text-left font-medium">Status</th>
                          <th className="p-2 text-left font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cores.map((core, idx) => (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="p-2">
                              {(core as any).status !== "RETURNED" && core._id && (
                                <input
                                  type="checkbox"
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                  checked={selectedCores.includes(core._id)}
                                  onChange={() => toggleSelectOne(core._id)}
                                />
                              )}
                            </td>
                            <td className="p-2">{core.failedAt ? new Date(core.failedAt).toLocaleDateString('en-GB') : (core.createdAt ? new Date(core.createdAt).toLocaleDateString('en-GB') : '-')}</td>
                            <td className="p-2">{String(core.coreType || '')}</td>
                            <td className="p-2 font-mono font-medium text-red-700">{String(core.internalCoreNo || '')}</td>
                            <td className="p-2">{String(core.coreVendorNo || core.vendorCoreNo || '')}</td>
                            <td className="p-2 text-xs text-red-600">{String(core.failureReason || '')}</td>
                            <td className="p-2 text-xs">
                              <span className="font-mono">
                                1K:{String(core.value1000 || '-')} | 3K:{String(core.value3000 || '-')} | 5K:{String(core.value5000 || '-')} | 7K:{String(core.value7000 || '-')}
                              </span>
                            </td>
                            <td className="p-2">
                              {(core as any).status === "RETURNED" ? (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  🔄 RETURNED
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                                  ❌ FAILED
                                </span>
                              )}
                            </td>
                            <td className="p-2 flex gap-2">
                              {(core as any).status !== "RETURNED" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs border-orange-300 text-orange-700 hover:bg-orange-50"
                                  onClick={() => handleReturnToVendor(core._id)}
                                >
                                  Return
                                </Button>
                              )}
                              {(core as any).status === "RETURNED" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs border-gray-300 text-gray-700 hover:bg-gray-50"
                                  onClick={() => handleUndoReturn(core._id)}
                                >
                                  Undo
                                </Button>
                              )}
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
      </Card>
    </div>
  );
}

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  AlertTriangle, 
  ArrowLeft, 
  Search, 
  CheckCircle2, 
  RefreshCw, 
  Loader2,
  Calendar,
  Layers,
  Wrench
} from 'lucide-react';
import { toast } from 'sonner';

import { SecondaryMeteringReport } from './SecondaryMeteringReport';
import { SecondaryProtectionReport } from './SecondaryProtectionReport';
import { SecondaryPSReport } from './SecondaryPSReport';

interface FailedTransformersSectionProps {
  user: {
    role: string;
    name: string;
    fullName?: string;
  };
}

export function FailedTransformersSection({ user }: FailedTransformersSectionProps) {
  const [failedList, setFailedList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [coreTypeFilter, setCoreTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('FAILED');
  const [retestingTransformer, setRetestingTransformer] = useState<any | null>(null);

  // Core Replacement States
  const [replacingCoreItem, setReplacingCoreItem] = useState<any | null>(null);
  const [selectedCoreToReplace, setSelectedCoreToReplace] = useState<number | "">("");
  const [selectedNewCoreId, setSelectedNewCoreId] = useState<string>("");
  const [availableCoresPool, setAvailableCoresPool] = useState<any[]>([]);
  const [loadingPool, setLoadingPool] = useState(false);
  const [submittingReplacement, setSubmittingReplacement] = useState(false);

  const fetchAvailablePool = async (item: any, selectedCoreNum: number) => {
    if (!item || !selectedCoreNum) return;
    try {
      setLoadingPool(true);
      const orderId = item.orderId?._id || item.orderId;
      
      const orderRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/orders/${orderId}`, { withCredentials: true });
      const order = orderRes.data?.data || item.orderId;
      
      const coreDetails = order?.coreDetails || [];
      const coreGroup = coreDetails[selectedCoreNum - 1];
      if (!coreGroup) return;

      const typeStr = (coreGroup.coreType || 'Metering').toLowerCase();
      let targetType = 'Metering';
      if (typeStr.includes('protection')) targetType = 'Protection';
      else if (typeStr.includes('ps')) targetType = 'PS';

      // Fetch from Ready Stock API
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/ready-transformers/available`,
        {
          params: { coreType: targetType },
          withCredentials: true,
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        }
      );

      const pool = (res.data || []).map((core: any) => {
        const turns = core.specifications?.turns || '';
        const label = turns ? `${core.coreId} (Turns: ${turns})` : core.coreId;
        return {
          _id: core._id,
          id: core.coreId,
          label: label
        };
      });

      setAvailableCoresPool(pool);
    } catch (err) {
      console.error("Failed to fetch available core pool from ready stock", err);
      toast.error("Failed to load available ready stock.");
    } finally {
      setLoadingPool(false);
    }
  };

  const getCoresForItem = (item: any) => {
    if (!item || !item.orderId || !item.transformerId) return [];
    const order = item.orderId;
    const transformer = item.transformerId;
    const coreDetails = order.coreDetails || [];
    
    return coreDetails.map((coreGroup: any, idx: number) => {
      const coreNum = idx + 1;
      const typeStr = (coreGroup.coreType || 'Metering').toLowerCase();
      let mappedType: 'metering' | 'ps' | 'protection' = 'metering';
      if (typeStr.includes('protection')) mappedType = 'protection';
      else if (typeStr.includes('ps')) mappedType = 'ps';

      // Find current core ID from secondary results
      const results = transformer.testHistory?.secondary_test?.[`${mappedType}_results`] || [];
      const typeCores = coreDetails.filter((c: any) => {
        const t = (c.coreType || 'Metering').toLowerCase();
        if (mappedType === 'ps') return t.includes('ps');
        if (mappedType === 'protection') return t.includes('protection');
        return !t.includes('ps') && !t.includes('protection');
      });
      const typeIndex = typeCores.findIndex((c: any) => {
        for(let i=0; i<coreDetails.length; i++) {
          if (coreDetails[i] === c) {
            if (i === idx) return true;
          }
        }
        return false;
      });

      const suffix = `-${String(coreNum).padStart(3, '0')}`;
      const typeSeq = typeIndex !== -1 ? typeIndex + 1 : 1;
      const typeSuffix = `-${String(typeSeq).padStart(3, '0')}`;

      const found = results.find((r: any) => {
        const id = r.internalCoreNo || r.coreId || '';
        return id.endsWith(suffix) || id.includes(suffix) ||
               id.endsWith(typeSuffix) || id.includes(typeSuffix);
      });

      return {
        coreNumber: coreNum,
        coreType: mappedType,
        currentCoreId: found ? (found.internalCoreNo || found.coreId) : 'N/A'
      };
    });
  };

  // Triggered when replacingCoreItem changes to auto-select core to replace and fetch pool
  useEffect(() => {
    if (replacingCoreItem) {
      const initReplacement = async () => {
        try {
          setLoadingPool(true);
          const orderId = replacingCoreItem.orderId?._id || replacingCoreItem.orderId;
          
          const orderRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/orders/${orderId}`, { withCredentials: true });
          const order = orderRes.data?.data || replacingCoreItem.orderId;
          
          const updatedItem = { ...replacingCoreItem, orderId: order };
          const cores = getCoresForItem(updatedItem);
          const rawType = (replacingCoreItem.coreType || '').toLowerCase();
          
          const matchedCore = cores.find((c: any) => c.currentCoreId === replacingCoreItem.failureParameters?.coreId)
            || cores.find((c: any) => c.coreType.toLowerCase() === rawType)
            || cores[0];
            
          const coreNum = matchedCore ? matchedCore.coreNumber : 1;
          setSelectedCoreToReplace(coreNum);

          if (coreNum) {
            await fetchAvailablePool(updatedItem, coreNum);
          }
        } catch (err) {
          console.error("Failed to initialize core replacement", err);
        } finally {
          setLoadingPool(false);
        }
      };
      initReplacement();
    } else {
      setSelectedCoreToReplace("");
      setSelectedNewCoreId("");
      setAvailableCoresPool([]);
    }
  }, [replacingCoreItem]);

  const handleConfirmCoreReplacement = async () => {
    if (!replacingCoreItem || !selectedCoreToReplace || !selectedNewCoreId) {
      toast.error("Please select a replacement core ID.");
      return;
    }

    try {
      setSubmittingReplacement(true);
      const orderId = replacingCoreItem.orderId?._id || replacingCoreItem.orderId;
      
      const orderRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/orders/${orderId}`, { withCredentials: true });
      const order = orderRes.data?.data || replacingCoreItem.orderId;
      const updatedItem = { ...replacingCoreItem, orderId: order };

      const cores = getCoresForItem(updatedItem);
      const targetCore = cores.find((c: any) => c.coreNumber === selectedCoreToReplace);
      if (!targetCore) {
        toast.error("Target core not found.");
        return;
      }

      const selectedPoolItem = availableCoresPool.find(p => p.id === selectedNewCoreId);
      
      // Reserve and use in Ready Stock
      if (selectedPoolItem && selectedPoolItem._id) {
        try {
          const token = localStorage.getItem('token');
          await axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/ready-transformers/reserve/${selectedPoolItem._id}`,
            {},
            {
              withCredentials: true,
              headers: { 'Authorization': token ? `Bearer ${token}` : '' }
            }
          );
          
          const oldCoreId = targetCore.currentCoreId === 'N/A' ? '' : targetCore.currentCoreId;
          await axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/ready-transformers/use/${selectedPoolItem._id}`,
            {
              orderId: orderId,
              replacedCoreId: oldCoreId
            },
            {
              withCredentials: true,
              headers: { 'Authorization': token ? `Bearer ${token}` : '' }
            }
          );
        } catch (stockErr) {
          console.warn("Could not reserve/use core in ready stock tracking:", stockErr);
        }
      }

      const payload = {
        coreNumber: targetCore.coreNumber,
        coreType: targetCore.coreType,
        oldCoreId: targetCore.currentCoreId === 'N/A' ? '' : targetCore.currentCoreId,
        newCoreId: selectedNewCoreId,
        treatedBy: user.name || user.fullName || "Secondary Tester"
      };

      const res = await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/failed-transformers/${replacingCoreItem._id}/replace-core`,
        payload,
        { withCredentials: true }
      );

      if (res.data.success) {
        toast.success(`Core replaced successfully! Core serial is now ${selectedNewCoreId}.`);
        setReplacingCoreItem(null);
        setSelectedCoreToReplace("");
        setSelectedNewCoreId("");
        setAvailableCoresPool([]);
        fetchFailedTransformers();
      } else {
        toast.error("Failed to replace core.");
      }
    } catch (err: any) {
      console.error("Error replacing core:", err);
      toast.error(err.response?.data?.message || "Failed to replace core.");
    } finally {
      setSubmittingReplacement(false);
    }
  };

  const fetchFailedTransformers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/failed-transformers?stage=SECONDARY_TESTING`, 
        { withCredentials: true }
      );
      
      if (res.data.success) {
        setFailedList(res.data.data || []);
      } else {
        setError("Failed to load records.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch failed transformers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFailedTransformers();
  }, []);

  const handleRetestSave = async () => {
    if (!retestingTransformer) return;
    try {
      // Update the failed transformer record to TREATED
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/failed-transformers/${retestingTransformer._id}/status`,
        {
          status: "TREATED",
          treatedBy: user.name || user.fullName || "Secondary Tester",
          resolutionRemarks: "Retest completed successfully with valid readings."
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        toast.success("Retest saved and transformer marked as Treated!");
        setRetestingTransformer(null);
        fetchFailedTransformers();
      } else {
        toast.error("Retest saved, but failed to update status to Treated.");
      }
    } catch (err: any) {
      console.error("Error updating treat status:", err);
      toast.error(err.response?.data?.message || "Failed to update failed transformer status.");
    }
  };

  // Filter list locally
  const filteredList = failedList.filter(item => {
    const searchLow = searchTerm.toLowerCase();
    const serialNo = String(item.transformerUniqueId || '').toLowerCase();
    const jobNo = String(item.jobNumber || '').toLowerCase();
    const client = String(item.clientName || '').toLowerCase();
    const reason = String(item.failureReason || '').toLowerCase();
    
    const matchesSearch = 
      serialNo.includes(searchLow) ||
      jobNo.includes(searchLow) ||
      client.includes(searchLow) ||
      reason.includes(searchLow);
      
    const matchesCoreType = 
      coreTypeFilter === 'ALL' || 
      String(item.coreType || '').toUpperCase() === coreTypeFilter;
      
    const matchesStatus = 
      statusFilter === 'ALL' || 
      String(item.status || '').toUpperCase() === statusFilter;

    return matchesSearch && matchesCoreType && matchesStatus;
  });

  if (retestingTransformer) {
    const coreTypeKey = String(retestingTransformer.coreType || '').toLowerCase();
    const cId = retestingTransformer.failureParameters?.coreId || "1";
    
    const order = retestingTransformer.orderId;
    const coreDetails = order?.coreDetails || [];
    const meteringCoreIndex = coreDetails.findIndex((c: any) => c.coreType === 'Metering');
    const protectionCoreIndex = coreDetails.findIndex((c: any) => c.coreType === 'Protection');
    const psCoreIndex = coreDetails.findIndex((c: any) => c.coreType === 'PS');

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <Button 
            variant="outline" 
            onClick={() => setRetestingTransformer(null)}
            size="sm"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Failed List
          </Button>
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Retesting Transformer: <span className="font-mono text-red-600">{retestingTransformer.transformerUniqueId}</span>
            </h2>
            <p className="text-xs text-gray-500">
              Job: {retestingTransformer.jobNumber} | Client: {retestingTransformer.clientName} | Core Type: {retestingTransformer.coreType}
            </p>
          </div>
        </div>

        {coreTypeKey === 'metering' && (
          <SecondaryMeteringReport
            transformer={retestingTransformer.transformerId}
            coreNumber={meteringCoreIndex !== -1 ? meteringCoreIndex + 1 : 1}
            coreId={cId}
            testerName={user.name || user.fullName || 'Tester'}
            onBack={() => setRetestingTransformer(null)}
            stage="secondary"
            order={retestingTransformer.orderId}
            onRefresh={handleRetestSave}
          />
        )}
        {coreTypeKey === 'protection' && (
          <SecondaryProtectionReport
            transformer={retestingTransformer.transformerId}
            coreNumber={protectionCoreIndex !== -1 ? protectionCoreIndex + 1 : 1}
            coreId={cId}
            testerName={user.name || user.fullName || 'Tester'}
            onBack={() => setRetestingTransformer(null)}
            stage="secondary"
            order={retestingTransformer.orderId}
            onRefresh={handleRetestSave}
          />
        )}
        {coreTypeKey === 'ps' && (
          <SecondaryPSReport
            transformer={retestingTransformer.transformerId}
            coreNumber={psCoreIndex !== -1 ? psCoreIndex + 1 : 1}
            coreId={cId}
            testerName={user.name || user.fullName || 'Tester'}
            onBack={() => setRetestingTransformer(null)}
            stage="secondary"
            order={retestingTransformer.orderId}
            onRefresh={handleRetestSave}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            Failed Transformers
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and perform re-testing/treatment for failed transformer units
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchFailedTransformers}
          size="sm"
          className="gap-2 self-start md:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh List
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-red-100 bg-red-50/50">
          <div className="text-sm text-red-600 font-medium">Active Failures</div>
          <div className="text-3xl font-bold text-red-700 mt-1">
            {failedList.filter(x => x.status === 'FAILED').length}
          </div>
        </Card>
        <Card className="p-4 border-green-100 bg-green-50/50">
          <div className="text-sm text-green-600 font-medium">Treated / Resolved</div>
          <div className="text-3xl font-bold text-green-700 mt-1">
            {failedList.filter(x => x.status === 'TREATED' || x.status === 'RETESTED').length}
          </div>
        </Card>
        <Card className="p-4 border-gray-100 bg-gray-50">
          <div className="text-sm text-gray-500 font-medium">Total Registered</div>
          <div className="text-3xl font-bold text-gray-700 mt-1">{failedList.length}</div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Serial No, Job ID, Client, or Reason..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1 uppercase">Core Type</label>
              <select
                value={coreTypeFilter}
                onChange={(e) => setCoreTypeFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-red-500"
              >
                <option value="ALL">All Cores</option>
                <option value="METERING">Metering</option>
                <option value="PROTECTION">Protection</option>
                <option value="PS">PS</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1 uppercase">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-red-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="FAILED">Failed</option>
                <option value="TREATED">Treated</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Table Card */}
      <Card className="p-4 overflow-hidden border-gray-200 shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-4" />
            <p className="text-gray-500">Loading failed transformers...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600 bg-red-50 rounded border border-red-100">
            <p className="font-bold">Error Loading Data</p>
            <p className="text-sm mt-1">{error}</p>
            <Button size="sm" variant="outline" className="mt-4" onClick={fetchFailedTransformers}>
              Retry
            </Button>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-700 text-lg">No Failed Transformers Found</p>
            <p className="text-sm text-gray-400 max-w-sm mx-auto mt-1">
              There are currently no active failed transformers matching your query filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-3 text-left font-semibold text-gray-600">Date Failed</th>
                  <th className="p-3 text-left font-semibold text-gray-600">Serial No</th>
                  <th className="p-3 text-left font-semibold text-gray-600">Job Number</th>
                  <th className="p-3 text-left font-semibold text-gray-600">Client Name</th>
                  <th className="p-3 text-left font-semibold text-gray-600">Core Type</th>
                  <th className="p-3 text-left font-semibold text-gray-600">Failure Reason</th>
                  <th className="p-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="p-3 text-center font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredList.map((item) => {
                  const dateStr = item.createdAt 
                    ? new Date(item.createdAt).toLocaleDateString('en-GB')
                    : '-';
                  
                  const isFailed = item.status === 'FAILED';
                  
                  return (
                    <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 text-gray-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {dateStr}
                        </div>
                      </td>
                      <td className="p-3 font-mono font-semibold text-red-600">
                        {item.transformerUniqueId || (item.transformerId && item.transformerId.uniqueId) || '-'}
                      </td>
                      <td className="p-3 text-gray-600 font-medium">{item.jobNumber || '-'}</td>
                      <td className="p-3 text-gray-600">{item.clientName || '-'}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
                          <Layers className="w-3 h-3" />
                          {item.coreType || '-'}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-red-600 max-w-[280px] truncate" title={item.failureReason}>
                        {item.failureReason || '-'}
                      </td>
                      <td className="p-3">
                        {isFailed ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">
                            ❌ Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Treated
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {isFailed ? (
                          <div className="flex items-center justify-center gap-2.5">
                            <Button
                              onClick={() => {
                                if (!item.transformerId) {
                                  toast.error("Transformer detail not loaded. Cannot re-test.");
                                  return;
                                }
                                setRetestingTransformer(item);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-4 flex items-center justify-center gap-1.5 rounded-md shadow-sm transition-all hover:scale-105 active:scale-95 font-semibold"
                              size="sm"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              Treat / Retest
                            </Button>
                            <Button
                              onClick={() => {
                                if (!item.transformerId) {
                                  toast.error("Transformer detail not loaded. Cannot replace core.");
                                  return;
                                }
                                setReplacingCoreItem(item);
                              }}
                              className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-8 px-4 flex items-center justify-center gap-1.5 rounded-md shadow-sm transition-all hover:scale-105 active:scale-95 font-semibold"
                              size="sm"
                            >
                              <Wrench className="w-3.5 h-3.5" />
                              Core Replace
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Resolved</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Core Replacement Modal */}
      {replacingCoreItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 bg-white shadow-2xl rounded-xl border border-gray-100 flex flex-col gap-4 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange-500" />
                Core Replacement
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Replace the failed physical core for transformer <span className="font-mono font-bold text-red-600">{replacingCoreItem.transformerUniqueId}</span>.
              </p>
            </div>            <div className="space-y-4 my-2">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-xs font-bold text-red-800 uppercase">Failed Core Info:</div>
                <div className="text-sm text-red-700 mt-1">
                  <strong>Type:</strong> {replacingCoreItem.coreType} <br/>
                  <strong>Core Serial No:</strong> {replacingCoreItem.failureParameters?.coreId || 'N/A'}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-gray-400 block mb-1">Choose Core (from Ready Stock)</label>
                {loadingPool ? (
                  <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                    Loading ready stock...
                  </div>
                ) : availableCoresPool.length === 0 ? (
                  <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 mt-1">
                    No available cores in the Ready Stock matching this core type ({replacingCoreItem.coreType}).
                  </p>
                ) : (
                  <select
                    value={selectedNewCoreId}
                    onChange={(e) => setSelectedNewCoreId(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-orange-500"
                  >
                    <option value="">-- Choose Core --</option>
                    {availableCoresPool.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => {
                  setReplacingCoreItem(null);
                  setSelectedCoreToReplace("");
                  setSelectedNewCoreId("");
                  setAvailableCoresPool([]);
                }}
                disabled={submittingReplacement}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmCoreReplacement}
                disabled={submittingReplacement || !selectedCoreToReplace || !selectedNewCoreId}
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs gap-1.5"
              >
                {submittingReplacement ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Replacing...
                  </>
                ) : (
                  <>
                    <Wrench className="w-3.5 h-3.5" />
                    Confirm Replace
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

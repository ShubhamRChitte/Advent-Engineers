import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Package, CheckCircle2, RotateCcw, FlaskConical, Trash2, RefreshCw, Recycle } from 'lucide-react';
import { PreTestBatchModule } from '../testing/PreTestBatchModule';
import { CoreTestingForm } from '../testing/CoreTestingForm';
import axios from '@/utils/axiosConfig';
import { socket } from '@/utils/socket';
import { toast } from 'sonner';

interface PreTestBatch {
  _id: string;
  batchId: string;
  coreType: string;
  vendorName: string;
  numberOfCores: number;
  turns: string;
  status: string;
  passedCount?: number;
  failedCount?: number;
  discardedCount?: number;
  availableCoresCount?: number;
  createdAt: string;
}

interface ReadyTransformer {
  _id: string;
  coreId: string;
  serialNumber?: string;
  batchId: string;
  coreType: string;
  specifications: {
    ratio?: string;
    turns?: string;
    burden?: string;
    class?: string;
  };
  createdFrom?: string;
  status: 'available' | 'reserved' | 'used' | 'pending_test';
  createdAt: string;
}

const fetcher = (url: string) => {
  const token = localStorage.getItem('token');
  return axios.get(url, {
    withCredentials: true,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  }).then(res => res.data);
};

export default function ReadyStockView() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [view, setView] = useState<'list' | 'pre-test' | 'individual-test'>('list');
  const [activeTab, setActiveTab] = useState<'Batches' | 'Individual Cores' | 'Available' | 'History'>('Batches');
  const [availableFilter, setAvailableFilter] = useState<'All' | 'Metering' | 'PS' | 'Protection'>('All');
  const [historyFilter, setHistoryFilter] = useState<'All' | 'Metering' | 'PS' | 'Protection'>('All');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'All' | 'used' | 'reserved'>('All');
  const [resumingBatch, setResumingBatch] = useState<PreTestBatch | null>(null);
  const [individualTestingCore, setIndividualTestingCore] = useState<ReadyTransformer | null>(null);

  // Pagination state
  const [batchPage, setBatchPage] = useState(1);
  const [stockPage, setStockPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setBatchPage(1);
      setStockPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset pagination on tab change
  useEffect(() => {
    setStockPage(1);
    setSearch('');
    setDebouncedSearch('');
  }, [activeTab, availableFilter, historyFilter, historyStatusFilter]);

  // SWR Hooks
  const { data: analytics, mutate: mutateAnalytics } = useSWR(
    `/ready-transformers/analytics`, 
    fetcher
  );

  const { data: batchesData, mutate: mutateBatches, isLoading: isBatchesLoading } = useSWR(
    `/pre-test-batches?paginated=true&limit=${batchPage * 20}&search=${encodeURIComponent(debouncedSearch)}`,
    fetcher
  );

  const { data: individualCountData, mutate: mutateIndividualCount } = useSWR(
    `/ready-transformers?createdFrom=REUSE`,
    fetcher
  );

  // Dynamic stock query URL based on Active Tab
  let stockQueryUrl: string | null = null;

  if (activeTab === 'Individual Cores') {
    stockQueryUrl = `/ready-transformers?paginated=true&limit=${stockPage * 20}&createdFrom=REUSE&search=${encodeURIComponent(debouncedSearch)}`;
  } else if (activeTab === 'Available') {
    const filterType = availableFilter !== 'All' ? `&coreType=${encodeURIComponent(availableFilter)}` : '';
    stockQueryUrl = `/ready-transformers?paginated=true&limit=${stockPage * 20}&status=available${filterType}&search=${encodeURIComponent(debouncedSearch)}`;
  } else if (activeTab === 'History') {
    const filterType = historyFilter !== 'All' ? `&coreType=${encodeURIComponent(historyFilter)}` : '';
    const filterStatus = historyStatusFilter !== 'All' ? `&status=${encodeURIComponent(historyStatusFilter)}` : '&status=history';
    stockQueryUrl = `/ready-transformers?paginated=true&limit=${stockPage * 20}${filterStatus}${filterType}&search=${encodeURIComponent(debouncedSearch)}`;
  }

  const { data: stockData, mutate: mutateStock, isLoading: isStockLoading } = useSWR(
    stockQueryUrl,
    fetcher
  );

  // Global socket listener
  useEffect(() => {
    socket.on('readyStockUpdated', () => {
      mutateAnalytics();
      mutateBatches();
      mutateStock();
      mutateIndividualCount();
    });
    return () => {
      socket.off('readyStockUpdated');
    };
  }, [mutateAnalytics, mutateBatches, mutateStock, mutateIndividualCount]);

  const counts = {
    Batches: batchesData?.totalCount || 0,
    'Individual Cores': Array.isArray(individualCountData) ? individualCountData.length : (individualCountData?.totalCount || individualCountData?.count || 0),
    Available: analytics?.available || 0,
    History: (analytics?.used || 0) + (analytics?.reserved || 0)
  };

  const filteredBatches: PreTestBatch[] = batchesData?.data || [];
  const filteredStock: ReadyTransformer[] = stockData?.data || [];

  const handleManualRefresh = () => {
    mutateAnalytics();
    mutateBatches();
    mutateStock();
    mutateIndividualCount();
  };

  if (view === 'pre-test') {
    return (
      <PreTestBatchModule 
        onBack={() => {
          setView('list');
          setResumingBatch(null);
          handleManualRefresh();
        }}
        initialBatch={resumingBatch}
      />
    );
  }

  if (view === 'individual-test' && individualTestingCore) {
    const rawType = (individualTestingCore.coreType || 'Metering').toLowerCase();
    const normalizedCoreType: 'Metering' | 'Protection' | 'PS' = rawType.includes('ps')
      ? 'PS'
      : rawType.includes('protect')
        ? 'Protection'
        : 'Metering';

    const virtualBatchId = `REUSE-${individualTestingCore.coreId}`;
    const vendorNamePrefetched = (individualTestingCore as any).initialVendorName || 'ABC Electricals';

    const virtualOrder: any = {
      _id: individualTestingCore._id || individualTestingCore.coreId,
      jobId: virtualBatchId,
      clientName: `INDIVIDUAL REUSE: ${individualTestingCore.coreId}`,
      transformerQuantity: 1,
      quantity: 1,
      coreDetails: [{ coreType: normalizedCoreType, type: normalizedCoreType }],
      status: 'In Progress',
      priority: 'Normal'
    };

    return (
      <div className="animate-in fade-in duration-500">
        <CoreTestingForm 
          order={virtualOrder}
          coreType={normalizedCoreType}
          onBack={() => {
            setView('list');
            setIndividualTestingCore(null);
            handleManualRefresh();
          }}
          isPreTest={true}
          isReadOnly={false}
          batchData={{
            batchId: virtualBatchId,
            vendorName: vendorNamePrefetched,
            vendorId: 'REUSE-VENDOR',
            numberOfCores: 1,
            turns: individualTestingCore.specifications?.turns || '10',
            readings: [{
              internalCoreNo: individualTestingCore.coreId,
              vendorCoreNo: (individualTestingCore as any).vendorCoreNo || '',
              status: 'PENDING'
            }],
            discardedCoreIds: []
          }}
        />
      </div>
    );
  }

  const isBatchFullyTested = (batch: PreTestBatch) => {
    const tested = (batch.passedCount || 0) + (batch.failedCount || 0) + (batch.discardedCount || 0);
    if (batch.numberOfCores > 0 && tested < batch.numberOfCores) {
      return false;
    }
    return batch.status === 'COMPLETED' || (batch.numberOfCores > 0 && tested >= batch.numberOfCores);
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (!window.confirm("Are you sure you want to delete this batch? This action cannot be undone.")) return;
    try {
      await axios.delete(`/pre-test-batches/${batchId}`, {
        withCredentials: true
      });
      toast.success("Batch deleted successfully!");
      handleManualRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete batch");
    }
  };

  const getCoreTypeColor = (type: string) => {
    switch (type) {
      case 'Metering': return 'bg-green-100 text-green-700 border-green-200';
      case 'Protection': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'PS': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header & Top Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ready Stock Management</h1>
          <p className="text-sm text-gray-500">Manage pre-tested cores, individual stock retests, and inventory allocation</p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManualRefresh}
            className="flex items-center gap-2 border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold h-9"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>

          <Button
            onClick={() => {
              setResumingBatch(null);
              setView('pre-test');
            }}
            className="bg-[#003a70] hover:bg-[#002a50] text-white flex items-center gap-1.5 shadow-sm font-semibold text-xs h-9 px-3"
          >
            <Plus className="w-4 h-4" />
            New Pre-Test Batch
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-blue-50/40 border-blue-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-blue-700 font-medium">Batches</p>
              <p className="text-2xl font-bold text-blue-900">{counts.Batches}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-purple-50/40 border-purple-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-700">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-purple-700 font-medium">Individual Cores</p>
              <p className="text-2xl font-bold text-purple-900">{counts['Individual Cores']}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-emerald-50/40 border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-emerald-700 font-medium">Available Cores</p>
              <p className="text-2xl font-bold text-emerald-900">{counts.Available}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-amber-50/40 border-amber-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-amber-700 font-medium">History (Used / Reserved)</p>
              <p className="text-2xl font-bold text-amber-900">{counts.History}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit flex-wrap">
        {(['Batches', 'Individual Cores', 'Available', 'History'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
              activeTab === tab 
                ? 'bg-[#003a70] text-white shadow-sm' 
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab} ({counts[tab]})
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input 
          className="pl-10" 
          placeholder={`Search ${activeTab.toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="overflow-x-auto border-none shadow-md">
        <table className="w-full text-sm text-left min-w-[1000px] table-fixed">
          <thead className="bg-gray-50 border-b">
            {activeTab === 'Batches' ? (
              <tr>
                <th className="px-3 py-4 font-bold text-gray-700 w-[18%]">Batch ID</th>
                <th className="px-3 py-4 font-bold text-gray-700 w-[10%]">Type</th>
                <th className="px-3 py-4 font-bold text-gray-700 w-[16%]">Vendor</th>
                <th className="px-3 py-4 font-bold text-gray-700 w-[8%] text-center">Total</th>
                <th className="px-3 py-4 font-bold text-gray-700 w-[8%] text-center text-green-600">Passed</th>
                <th className="px-3 py-4 font-bold text-gray-700 w-[8%] text-center text-red-600">Failed</th>
                <th className="px-3 py-4 font-bold text-gray-700 w-[14%] text-center">Status</th>
                <th className="px-3 py-4 font-bold text-gray-700 w-[18%] text-right pr-6">Action</th>
              </tr>
            ) : activeTab === 'Individual Cores' ? (
              <tr>
                <th className="px-6 py-4 font-bold text-gray-700">Core ID</th>
                <th className="px-6 py-4 font-bold text-gray-700">Type</th>
                <th className="px-6 py-4 font-bold text-gray-700">Turns</th>
                <th className="px-6 py-4 font-bold text-gray-700">Source</th>
                <th className="px-6 py-4 font-bold text-gray-700 text-center">Status</th>
                <th className="px-6 py-4 font-bold text-gray-700 text-right pr-6">Action</th>
              </tr>
            ) : (
              <tr>
                <th className="px-6 py-4 font-bold text-gray-700">Core ID</th>
                <th className="px-6 py-4 font-bold text-gray-700">
                  <div className="flex items-center gap-2">
                    <span>Core Type</span>
                    <select
                      value={activeTab === 'Available' ? availableFilter : historyFilter}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        if (activeTab === 'Available') setAvailableFilter(val);
                        else setHistoryFilter(val);
                      }}
                      className="text-xs font-bold bg-white text-blue-700 border border-blue-200 rounded-md px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer hover:bg-blue-50/50 transition-colors"
                    >
                      <option value="All">All Types</option>
                      <option value="Metering">Metering</option>
                      <option value="PS">PS</option>
                      <option value="Protection">Protection</option>
                    </select>
                  </div>
                </th>
                <th className="px-6 py-4 font-bold text-gray-700">Turns / Specs</th>
                <th className="px-6 py-4 font-bold text-gray-700 text-right pr-6">
                  {activeTab === 'History' ? (
                    <div className="flex items-center justify-end gap-2">
                      <span>Status</span>
                      <select
                        value={historyStatusFilter}
                        onChange={(e) => setHistoryStatusFilter(e.target.value as any)}
                        className="text-xs font-bold bg-white text-purple-700 border border-purple-200 rounded-md px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm cursor-pointer hover:bg-purple-50/50 transition-colors"
                      >
                        <option value="All">All Statuses</option>
                        <option value="reserved">RESERVED</option>
                        <option value="used">USED</option>
                      </select>
                    </div>
                  ) : (
                    'Status'
                  )}
                </th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y">
            {activeTab === 'Batches' ? (
              isBatchesLoading && filteredBatches.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="px-6 py-4">
                      <div className="h-6 bg-gray-200 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : filteredBatches.length > 0 ? (
                filteredBatches.map((batch) => {
                  const fullyTested = isBatchFullyTested(batch);
                  return (
                    <tr key={batch._id} className="hover:bg-gray-50 transition-colors border-b">
                      <td className="px-3 py-4 font-mono font-bold text-gray-900 text-xs truncate" title={batch.batchId}>{batch.batchId}</td>
                      <td className="px-3 py-4">
                        <Badge variant="outline" className={getCoreTypeColor(batch.coreType)}>
                          {batch.coreType}
                        </Badge>
                      </td>
                      <td className="px-3 py-4 text-gray-600 text-xs font-medium truncate" title={batch.vendorName}>{batch.vendorName}</td>
                      <td className="px-3 py-4 text-center font-bold text-gray-700 text-xs">{batch.numberOfCores}</td>
                      <td className="px-3 py-4 text-center font-bold text-green-600 text-xs">{batch.passedCount || 0}</td>
                      <td className="px-3 py-4 text-center font-bold text-red-600 text-xs">{batch.failedCount || 0}</td>
                      <td className="px-3 py-4 text-center">
                        <Badge 
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-tight whitespace-nowrap inline-flex items-center justify-center min-w-[85px] ${
                            batch.status === 'COMPLETED' ? 'bg-green-100 text-green-700 border-green-200' :
                            batch.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                            'bg-amber-100 text-amber-700 border-amber-200'
                          }`}
                        >
                          {batch.status === 'COMPLETED' ? 'COMPLETED' :
                           batch.status === 'IN_PROGRESS' ? 'IN PROGRESS' : 'PENDING'}
                        </Badge>
                      </td>
                      <td className="px-3 py-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-xs font-bold border-blue-600 text-blue-700 hover:bg-blue-50 flex items-center gap-1"
                            onClick={() => {
                              setResumingBatch(batch);
                              setView('pre-test');
                            }}
                          >
                            <FlaskConical className="w-3.5 h-3.5" />
                            {fullyTested ? 'View Test' : 'Continue Test'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs font-bold border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteBatch(batch.batchId)}
                            title="Delete Batch"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    No batches found matching your criteria.
                  </td>
                </tr>
              )
            ) : activeTab === 'Individual Cores' ? (
              isStockLoading && filteredStock.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-6 bg-gray-200 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : filteredStock.length > 0 ? (
                filteredStock.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors border-b">
                    <td className="px-6 py-4 font-mono font-bold text-gray-900 text-xs">{item.coreId || item.serialNumber}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={getCoreTypeColor(item.coreType)}>
                        {item.coreType}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs font-mono">
                      {item.specifications?.turns && item.specifications.turns !== 'N/A' ? `${item.specifications.turns}T` : '10T'}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-500">
                      {item.createdFrom === 'REUSE' ? (
                        <span className="inline-flex items-center text-purple-700 font-semibold">
                          <Recycle className="w-3.5 h-3.5 mr-1" /> Reused Core
                        </span>
                      ) : (
                        item.batchId || 'Individual'
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge 
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-tight whitespace-nowrap inline-flex items-center justify-center min-w-[85px] ${
                          item.status === 'available' ? 'bg-green-100 text-green-700 border-green-200' :
                          item.status === 'pending_test' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          item.status === 'reserved' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          'bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        {item.status === 'pending_test' ? 'PENDING TEST' : item.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs font-bold border-blue-600 text-blue-700 hover:bg-blue-50 flex items-center gap-1.5"
                          onClick={() => {
                            setIndividualTestingCore(item);
                            setView('individual-test');
                          }}
                        >
                          <FlaskConical className="w-3.5 h-3.5" />
                          {item.status === 'pending_test' ? 'Test Core' : 'Edit & Retest'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs font-bold border-purple-300 text-purple-700 hover:bg-purple-50 flex items-center gap-1"
                          onClick={async () => {
                            if (!window.confirm(`Reassign auto-generated Core ID for ${item.coreId}?`)) return;
                            try {
                              const res = await axios.post(`/ready-transformers/reassign-id/${item._id}`, {}, { withCredentials: true });
                              if (res.data.success) {
                                toast.success(res.data.message || "Core ID reassigned successfully!");
                                handleManualRefresh();
                              }
                            } catch (err: any) {
                              toast.error(err.response?.data?.message || "Failed to reassign Core ID");
                            }
                          }}
                          title="Reassign Core ID"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reassign ID
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    No Individual Cores found for testing.
                  </td>
                </tr>
              )
            ) : (
              isStockLoading && filteredStock.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-6 py-4">
                      <div className="h-6 bg-gray-200 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : filteredStock.length > 0 ? (
                filteredStock.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors border-b">
                    <td className="px-6 py-4 font-medium text-gray-900 font-mono text-xs">{item.coreId || item.serialNumber}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={getCoreTypeColor(item.coreType)}>
                        {item.coreType}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs font-mono">
                      {item.specifications?.turns ? `${item.specifications.turns}T` : (item.specifications?.burden || '-')}
                    </td>
                    <td className="px-6 py-4 text-right pr-6">
                      <Badge 
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-tight whitespace-nowrap inline-flex items-center justify-center min-w-[70px] ${
                          item.status === 'available' ? 'bg-green-100 text-green-700 border-green-200' :
                          item.status === 'reserved' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          'bg-blue-100 text-blue-700 border-blue-200'
                        }`}
                      >
                        {item.status.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    No {activeTab.toLowerCase()} cores found matching your criteria.
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </Card>
      
      {activeTab === 'Batches' && batchesData?.totalCount > filteredBatches.length && (
        <div className="flex justify-center mt-4">
          <Button 
            variant="outline" 
            onClick={() => setBatchPage(p => p + 1)}
            disabled={isBatchesLoading}
            className="w-full md:w-auto"
          >
            {isBatchesLoading ? 'Loading...' : 'Load More Batches'}
          </Button>
        </div>
      )}
      {activeTab !== 'Batches' && stockData?.totalCount > filteredStock.length && (
        <div className="flex justify-center mt-4">
          <Button 
            variant="outline" 
            onClick={() => setStockPage(p => p + 1)}
            disabled={isStockLoading}
            className="w-full md:w-auto"
          >
            {isStockLoading ? 'Loading...' : `Load More ${activeTab} Cores`}
          </Button>
        </div>
      )}
    </div>
  );
}

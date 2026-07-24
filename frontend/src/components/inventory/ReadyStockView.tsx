import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Package, 
  Search, 
  Plus, 
  RefreshCw, 
  CheckCircle2,
  Trash2,
  FlaskConical,
  RotateCcw,
  Check
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import axios from '@/utils/axiosConfig';
import useSWR from 'swr';
import { socket } from '../../utils/socket';
import { toast } from 'sonner';
import { PreTestBatchModule } from '../testing/PreTestBatchModule';
import { CoreTestingForm } from '../testing/CoreTestingForm';

interface ReadyTransformer {
  _id: string;
  batchId?: string;
  coreId: string;
  coreType: string;
  createdFrom?: string;
  serialNumber?: string;
  status: 'available' | 'reserved' | 'used' | 'pending_test';
  specifications: {
    ratio?: string;
    burden?: string;
    class?: string;
    turns?: string;
  };
  reservationExpiresAt?: string;
}

interface PreTestBatch {
  _id: string;
  batchId: string;
  coreType: string;
  vendorName: string;
  numberOfCores: number;
  passedCount: number;
  failedCount: number;
  discardedCount: number;
  availableCoresCount?: number;
  status: string;
  createdAt: string;
}

const fetcher = (url: string) => {
  const token = localStorage.getItem('token');
  return axios.get(url, {
    withCredentials: true,
    headers: { 'Authorization': token ? `Bearer ${token}` : '' }
  }).then(res => res.data);
};

export default function ReadyStockView() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [view, setView] = useState<'list' | 'pre-test' | 'individual-test'>('list');
  const [activeTab, setActiveTab] = useState('All');
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
  }, [activeTab]);

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

  const stockQueryUrl = activeTab === 'All' 
    ? null
    : activeTab === 'Individual Cores'
      ? `/ready-transformers?paginated=true&limit=${stockPage * 20}&createdFrom=REUSE&search=${encodeURIComponent(debouncedSearch)}`
      : `/ready-transformers?paginated=true&limit=${stockPage * 20}&coreType=${encodeURIComponent(activeTab)}&search=${encodeURIComponent(debouncedSearch)}`;

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
    All: batchesData?.totalCount || 0,
    'Individual Cores': Array.isArray(individualCountData) ? individualCountData.length : (individualCountData?.totalCount || individualCountData?.count || 0),
    Metering: analytics?.metering || 0,
    Protection: analytics?.protection || 0,
    PS: analytics?.ps || 0
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

    const virtualBatchId = individualTestingCore.batchId || `REUSE-${individualTestingCore.coreId}`;

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
            vendorName: 'REUSED CORE',
            vendorId: 'REUSE-VENDOR',
            numberOfCores: 1,
            turns: individualTestingCore.specifications?.turns || '10',
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ready Transformers Inventory</h1>
          <p className="text-gray-500">Manage pre-tested cores available for immediate replacement</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setView('pre-test')} className="gap-2 bg-[#003a70]">
            <Plus className="w-4 h-4" />
            Add Pre-Tested Core (Batch)
          </Button>
        </div>
      </div>

      {/* Stats Cards - Type-wise Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-green-50 border-green-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg text-green-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-green-700 font-medium">Metering Cores</p>
              <p className="text-2xl font-bold text-green-900">{counts.Metering}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-blue-50 border-blue-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-blue-700 font-medium">Protection Cores</p>
              <p className="text-2xl font-bold text-blue-900">{counts.Protection}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-orange-50 border-orange-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg text-orange-700">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-orange-700 font-medium">PS Cores</p>
              <p className="text-2xl font-bold text-orange-900">{counts.PS}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit flex-wrap">
        {['All', 'Individual Cores', 'Metering', 'Protection', 'PS'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab 
                ? 'bg-[#003a70] text-white shadow-sm' 
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab} ({counts[tab as keyof typeof counts]})
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input 
          className="pl-10" 
          placeholder={`Search ${activeTab === 'All' ? 'batches' : activeTab + ' cores'}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="overflow-x-auto border-none shadow-md">
        <table className="w-full text-sm text-left min-w-[1000px] table-fixed">
          <thead className="bg-gray-50 border-b">
            {activeTab === 'All' ? (
              <tr>
                <th className="px-3 py-4 font-bold text-gray-700 w-[18%]">Batch ID</th>
                <th className="px-3 py-4 font-bold text-gray-700 w-[10%]">Type</th>
                <th className="px-3 py-4 font-bold text-gray-700 w-[15%]">Vendor</th>
                <th className="px-3 py-4 font-bold text-gray-700 text-center w-[10%]">Total</th>
                <th className="px-3 py-4 font-bold text-gray-700 text-center w-[12%]">P / F</th>
                <th className="px-3 py-4 font-bold text-gray-700 text-center w-[12%]">Status</th>
                <th className="px-3 py-4 font-bold text-gray-700 text-right w-[10%]">Date</th>
                <th className="px-3 py-4 font-bold text-gray-700 text-right w-[13%] pr-6">Actions</th>
              </tr>
            ) : activeTab === 'Individual Cores' ? (
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-700 w-[22%]">Core ID</th>
                <th className="px-6 py-4 font-semibold text-gray-700 w-[15%]">Type</th>
                <th className="px-6 py-4 font-semibold text-gray-700 w-[23%]">Specs (Ratio / Turns)</th>
                <th className="px-6 py-4 font-semibold text-gray-700 w-[15%]">Source</th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-center w-[13%]">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-right pr-6 w-[12%]">Action</th>
              </tr>
            ) : (
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-700">Core ID</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Type</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Specs (Ratio/Turns)</th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-right">Status</th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y">
            {activeTab === 'All' ? (
              isBatchesLoading && filteredBatches.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="px-3 py-4">
                      <div className="h-6 bg-gray-200 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : filteredBatches.length > 0 ? (
                filteredBatches.map((batch) => (
                  <tr key={batch._id} className="hover:bg-gray-50 transition-colors border-b">
                    <td className="px-3 py-4 font-medium text-gray-900 font-mono text-[10px] break-all" title={batch.batchId}>{batch.batchId}</td>
                    <td className="px-4 py-4">
                      <Badge variant="outline" className={`${getCoreTypeColor(batch.coreType)} text-[10px] px-1.5 py-0`}>
                        {batch.coreType}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-gray-600 truncate max-w-[100px]" title={batch.vendorName}>{batch.vendorName}</td>
                    <td className="px-4 py-4 font-semibold text-center">
                      {((batch.availableCoresCount ?? batch.passedCount) + (batch.failedCount || 0))}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-green-600 font-bold">P: {Math.max(0, (batch.availableCoresCount ?? batch.passedCount))}</span>
                        <span className="text-gray-300">/</span>
                        <span className="text-red-600 font-bold">F: {Math.max(0, batch.failedCount || 0)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {batch.status === 'COMPLETED' ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">COMPLETED</Badge>
                      ) : isBatchFullyTested(batch) ? (
                        <Badge className="bg-green-600 text-white border-none text-[10px] shadow-sm font-bold">TESTING FINISHED</Badge>
                      ) : batch.status === 'IN_PROGRESS' ? (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px]">IN_PROGRESS</Badge>
                      ) : batch.status === 'CONFIGURED' ? (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">CONFIGURED</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-700 border-gray-200 text-[10px]">CREATED</Badge>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right text-gray-500 whitespace-nowrap text-xs">
                      {new Date(batch.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-3 py-4 text-right flex items-center justify-end gap-1">

                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={`h-8 px-3 text-[10px] font-bold ${
                          isBatchFullyTested(batch) 
                            ? 'border-gray-300 text-gray-700 hover:bg-gray-100' 
                            : 'border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100 shadow-sm'
                        }`}
                        onClick={() => {
                          setResumingBatch(batch);
                          setView('pre-test');
                        }}
                      >
                        {isBatchFullyTested(batch) ? 'View Batch' : 'Test Core'}
                      </Button>
                      {/* Show delete if cores in batch becomes 0 or total cores is 0 */}
                      {((batch.availableCoresCount || 0) === 0 || batch.numberOfCores === 0) && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                          title="Delete Batch"
                          onClick={() => handleDeleteBatch(batch.batchId)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
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
                      {item.specifications?.ratio && item.specifications.ratio !== 'N/A' ? item.specifications.ratio : '300/5'} | {item.specifications?.turns && item.specifications.turns !== 'N/A' ? `${item.specifications.turns}T` : '10T'}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-500">
                      {item.createdFrom === 'REUSE' ? '♻️ Reused Core' : item.batchId || 'Individual'}
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs font-bold border-blue-600 text-blue-700 hover:bg-blue-50 flex items-center gap-1.5 ml-auto"
                        onClick={() => {
                          setIndividualTestingCore(item);
                          setView('individual-test');
                        }}
                      >
                        <FlaskConical className="w-3.5 h-3.5" />
                        {item.status === 'pending_test' ? 'Test Core' : 'Edit & Retest'}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    No Individual Cores found for testing. Reused cores from Failed Cores will appear here.
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
                    <td className="px-6 py-4 text-gray-600">
                      {item.specifications?.ratio || '-'} | {item.specifications?.turns ? `${item.specifications.turns}T` : (item.specifications?.burden || '-')}
                    </td>
                    <td className="px-6 py-4 text-right">
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
                    No {activeTab} cores found matching your criteria.
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </Card>
      
      {/* Pagination Controls */}
      {activeTab === 'All' && batchesData?.totalCount > filteredBatches.length && (
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
      {activeTab !== 'All' && stockData?.totalCount > filteredStock.length && (
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

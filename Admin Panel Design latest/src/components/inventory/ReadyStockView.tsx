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
  Trash2
} from 'lucide-react';
import axios from 'axios';
import { socket } from '../../utils/socket';
import { toast } from 'sonner';
import { PreTestBatchModule } from '../testing/PreTestBatchModule';

interface ReadyTransformer {
  _id: string;
  batchId?: string;
  coreId: string;
  coreType: string; // Fixed: root level
  serialNumber?: string;
  status: 'available' | 'reserved' | 'used';
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
  status: string;
  createdAt: string;
}

export default function ReadyStockView() {
  const [stock, setStock] = useState<ReadyTransformer[]>([]);
  const [batches, setBatches] = useState<PreTestBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'pre-test'>('list');
  const [activeTab, setActiveTab] = useState('All');
  const [resumingBatch, setResumingBatch] = useState<PreTestBatch | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [stockRes, batchesRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/ready-transformers`, { 
          withCredentials: true,
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        }),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/pre-test-batches`, { 
          withCredentials: true,
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        })
      ]);
      setStock(stockRes.data);
      setBatches(batchesRes.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
      toast.error('Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    socket.on('readyStockUpdated', () => {
      fetchData();
    });

    return () => {
      socket.off('readyStockUpdated');
    };
  }, []);

  const availableCoresPerBatch = stock.reduce((acc, core) => {
    if (core.status === 'available' && core.batchId) {
      acc[core.batchId] = (acc[core.batchId] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const activeBatches = batches.filter(b => {
    if (b.status !== 'COMPLETED') return true;
    return (availableCoresPerBatch[b.batchId] || 0) > 0;
  });

  const counts = {
    All: activeBatches.length,
    Metering: stock.filter(s => s.coreType === 'Metering' && s.status === 'available').length,
    Protection: stock.filter(s => s.coreType === 'Protection' && s.status === 'available').length,
    PS: stock.filter(s => s.coreType === 'PS' && s.status === 'available').length
  };

  const filteredBatches = activeBatches.filter(b => 
    b.batchId.toLowerCase().includes(search.toLowerCase()) ||
    b.vendorName.toLowerCase().includes(search.toLowerCase()) ||
    b.coreType.toLowerCase().includes(search.toLowerCase())
  );

  const filteredStock = stock.filter(s => {
    const matchesTab = s.coreType === activeTab;
    const matchesSearch = (s.coreId || s.serialNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      s.specifications.ratio?.includes(search) ||
      s.coreType.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (view === 'pre-test') {
    return (
      <PreTestBatchModule 
        onBack={() => {
          setView('list');
          setResumingBatch(null);
          fetchData();
        }}
        initialBatch={resumingBatch}
      />
    );
  }

  const handleDeleteBatch = async (batchId: string) => {
    if (!window.confirm("Are you sure you want to delete this batch? This action cannot be undone.")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/pre-test-batches/${batchId}`, {
        withCredentials: true
      });
      toast.success("Batch deleted successfully!");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete batch");
    }
  };

  const handleApproveBatch = async (batchId: string) => {
    if (!window.confirm("Are you sure you want to approve this batch and move it to Ready Stock?")) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/pre-test-batches/${batchId}/approve`, {}, {
        withCredentials: true,
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (res.status === 200) {
        toast.success("Batch approved and moved to Ready Stock!");
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to approve batch");
    }
  };

  const isBatchFullyTested = (batch: PreTestBatch) => {
    // Current failed = total failed - discarded (which were already replaced or removed)
    // The total tested cores with readings = passedCount + currentlyFailed
    const currentlyFailed = (batch.failedCount || 0) - (batch.discardedCount || 0);
    const totalTested = (batch.passedCount || 0) + currentlyFailed;
    return totalTested >= batch.numberOfCores && batch.numberOfCores > 0;
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
          <Button variant="outline" onClick={fetchData} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
        {['All', 'Metering', 'Protection', 'PS'].map((tab) => (
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
              filteredBatches.length > 0 ? (
                filteredBatches.map((batch) => (
                  <tr key={batch._id} className="hover:bg-gray-50 transition-colors border-b">
                    <td className="px-3 py-4 font-medium text-gray-900 font-mono text-[10px] break-all" title={batch.batchId}>{batch.batchId}</td>
                    <td className="px-4 py-4">
                      <Badge variant="outline" className={`${getCoreTypeColor(batch.coreType)} text-[10px] px-1.5 py-0`}>
                        {batch.coreType}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-gray-600 truncate max-w-[100px]" title={batch.vendorName}>{batch.vendorName}</td>
                    <td className="px-4 py-4 font-semibold text-center">{batch.numberOfCores}</td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-green-600 font-bold">P: {Math.max(0, batch.passedCount || 0)}</span>
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
                      {batch.status !== 'COMPLETED' && isBatchFullyTested(batch) && (
                        <Button 
                          size="sm" 
                          className="h-8 px-3 text-[10px] font-bold bg-green-600 hover:bg-green-700 text-white shadow-sm border border-green-700"
                          onClick={() => handleApproveBatch(batch.batchId)}
                        >
                          Approve
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-3 text-[10px] font-bold border-blue-200 text-blue-700 hover:bg-blue-50"
                        onClick={() => {
                          setResumingBatch(batch);
                          setView('pre-test');
                        }}
                      >
                        {batch.status === 'COMPLETED' ? 'View' : 'Test'}
                      </Button>
                      {/* Show delete if cores in batch becomes 0 or total cores is 0 */}
                      {((availableCoresPerBatch[batch.batchId] || 0) === 0 || batch.numberOfCores === 0) && (
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
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    No batches found matching your criteria.
                  </td>
                </tr>
              )
            ) : (
              filteredStock.length > 0 ? (
                filteredStock.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 font-mono text-xs">{item.coreId || item.serialNumber}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={getCoreTypeColor(item.coreType)}>
                        {item.coreType}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {item.specifications.ratio || '-'} | {item.specifications.turns ? `${item.specifications.turns}T` : (item.specifications.burden || '-')}
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

    </div>
  );
}


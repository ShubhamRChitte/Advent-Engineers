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
  CheckCircle2
} from 'lucide-react';
import axios from 'axios';
import { socket } from '../../utils/socket';
import { toast } from 'sonner';
import { PreTestBatchModule } from '../testing/PreTestBatchModule';

interface ReadyTransformer {
  _id: string;
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
        axios.get('http://localhost:5001/api/ready-transformers', { 
          withCredentials: true,
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        }),
        axios.get('http://localhost:5001/api/pre-test-batches', { 
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

  const counts = {
    All: batches.length,
    Metering: stock.filter(s => s.coreType === 'Metering').length,
    Protection: stock.filter(s => s.coreType === 'Protection').length,
    PS: stock.filter(s => s.coreType === 'PS').length
  };

  const filteredBatches = batches.filter(b => 
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

      <Card className="overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            {activeTab === 'All' ? (
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-700">Batch ID</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Type</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Vendor</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Cores</th>
                <th className="px-6 py-4 font-semibold text-gray-700">P / F</th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-right">Date</th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
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
                  <tr key={batch._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 font-mono text-xs">{batch.batchId}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={getCoreTypeColor(batch.coreType)}>
                        {batch.coreType}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-600 truncate max-w-[120px]">{batch.vendorName}</td>
                    <td className="px-6 py-4 font-semibold">{batch.numberOfCores}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-green-600 font-bold">{batch.passedCount || 0}</span>
                        <span className="text-gray-300">/</span>
                        <span className="text-red-600 font-bold">{batch.failedCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {batch.status === 'COMPLETED' ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200">COMPLETED</Badge>
                      ) : batch.status === 'IN_PROGRESS' ? (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200">IN_PROGRESS</Badge>
                      ) : batch.status === 'CONFIGURED' ? (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200">CONFIGURED</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-700 border-gray-200">CREATED</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-500 whitespace-nowrap">
                      {new Date(batch.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold h-8 px-3"
                        onClick={() => {
                          setResumingBatch(batch);
                          setView('pre-test');
                        }}
                      >
                        {batch.status || 'CREATED'}
                      </Button>
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
                        className={
                          item.status === 'available' ? 'bg-green-100 text-green-700' :
                          item.status === 'reserved' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }
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


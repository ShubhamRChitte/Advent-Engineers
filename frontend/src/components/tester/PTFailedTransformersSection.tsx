import { useState, useEffect } from 'react';
import axios from '@/utils/axiosConfig';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  AlertTriangle,
  Search,
  RefreshCw,
  Loader2,
  Calendar,
  PlayCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { PTPretestReport } from './PTPretestReport';
import { PTTestingReport } from './PTTestingReport';

interface PTFailedTransformersSectionProps {
  stage: 'PT_PRETEST_TESTING' | 'PT_TESTING' | 'PT_PRETEST_TESTING,PT_TESTING';
  user?: any;
}

export function PTFailedTransformersSection({ stage, user }: PTFailedTransformersSectionProps) {
  const [failedList, setFailedList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Retest state
  const [retestingItem, setRetestingItem] = useState<any | null>(null);
  const [retestOrderData, setRetestOrderData] = useState<any | null>(null);
  const [retestTransformerData, setRetestTransformerData] = useState<any | null>(null);
  const [loadingRetest, setLoadingRetest] = useState(false);

  const fetchFailedTransformers = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(
        `/failed-transformers?stage=${stage}`,
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
  }, [stage]);

  const stageLabel = stage === 'PT_PRETEST_TESTING' ? 'PT Pretesting' : 'PT Final Testing';

  const filteredList = failedList.filter(item => {
    if (item.status === 'RESOLVED') return false;

    const searchLow = searchTerm.toLowerCase();
    const serialNo = String(item.transformerUniqueId || '').toLowerCase();
    const jobNo = String(item.jobNumber || '').toLowerCase();
    const client = String(item.clientName || '').toLowerCase();
    const reason = String(item.failureReason || '').toLowerCase();

    return (
      serialNo.includes(searchLow) ||
      jobNo.includes(searchLow) ||
      client.includes(searchLow) ||
      reason.includes(searchLow)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-700 border border-red-200">Failed</Badge>;
      case 'TREATED':
        return <Badge className="bg-blue-100 text-blue-700 border border-blue-200">Treated</Badge>;
      case 'RESOLVED':
        return <Badge className="bg-green-100 text-green-700 border border-green-200">Resolved</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 border border-gray-200">{status}</Badge>;
    }
  };

  const handleStartTesting = async (item: any) => {
    try {
      setLoadingRetest(true);

      const orderId = item.orderId?._id || item.orderId;
      const transformerId = item.transformerId?._id || item.transformerId;
      const transformerUniqueId = item.transformerUniqueId || item.transformerId?.uniqueId;

      if (!orderId) {
        toast.error('Missing order information.');
        return;
      }

      // Fetch full order data and all transformers for this order
      const [orderRes, transformersRes] = await Promise.all([
        axios.get(`/orders/${orderId}`, { withCredentials: true }),
        axios.get(`/transformers/order/${orderId}`, { withCredentials: true }),
      ]);

      const orderData = orderRes.data?.data || orderRes.data;
      const allTransformers = transformersRes.data?.data || transformersRes.data;

      if (!orderData) {
        toast.error('Could not load order data.');
        return;
      }

      // Find the matching transformer by _id or uniqueId
      let transformerData = null;
      if (Array.isArray(allTransformers)) {
        transformerData = allTransformers.find((t: any) =>
          t._id === transformerId ||
          t.uniqueId === transformerUniqueId
        );
      }

      if (!transformerData) {
        toast.error('Transformer not found in this order.');
        return;
      }

      setRetestOrderData(orderData);
      setRetestTransformerData(transformerData);
      setRetestingItem(item);
    } catch (err: any) {
      console.error('Error loading retest data:', err);
      toast.error(err.response?.data?.message || 'Failed to load testing data.');
    } finally {
      setLoadingRetest(false);
    }
  };

  const handleRetestApproveSuccess = () => {
    // Remove the item from the failed list after successful approval
    if (retestingItem) {
      setFailedList(prev => prev.filter(item => item._id !== retestingItem._id));
    }
    // Reset retest state
    setRetestingItem(null);
    setRetestOrderData(null);
    setRetestTransformerData(null);
    toast.success('Transformer approved and moved to the next stage.');
  };

  const handleRetestBack = () => {
    setRetestingItem(null);
    setRetestOrderData(null);
    setRetestTransformerData(null);
  };

  // If retesting, show the appropriate report form based on stage
  if (retestingItem && retestOrderData && retestTransformerData) {
    if (stage.includes('PT_PRETEST_TESTING')) {
      return (
        <PTPretestReport
          order={retestOrderData}
          transformer={retestTransformerData}
          onBack={handleRetestBack}
          user={user}
          noTimer={true}
          onApproveSuccess={handleRetestApproveSuccess}
        />
      );
    }
    if (stage.includes('PT_TESTING')) {
      return (
        <PTTestingReport
          order={retestOrderData}
          transformer={retestTransformerData}
          onBack={handleRetestBack}
          user={user}
          noTimer={true}
          onApproveSuccess={handleRetestApproveSuccess}
        />
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-7 h-7 text-red-500" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Failed Transformers</h2>
            <p className="text-gray-500 text-sm">{stageLabel} — Transformers marked as failed during testing</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchFailedTransformers} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by serial no, job no, client, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-500">Loading failed transformers...</span>
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchFailedTransformers}>Retry</Button>
        </Card>
      ) : filteredList.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-gray-400 mb-3">
            <AlertTriangle className="w-12 h-12 mx-auto opacity-30" />
          </div>
          <p className="text-gray-500 font-medium">No failed transformers found</p>
          <p className="text-gray-400 text-sm mt-1">
            {searchTerm ? 'Try adjusting your search.' : `No transformers have been marked as failed in ${stageLabel}.`}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Serial No</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Job No</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Client</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Reason</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Reported By</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((item, idx) => (
                  <tr key={item._id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {item.transformerUniqueId || item.transformerId?.uniqueId || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.jobNumber || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-600">{item.clientName || item.orderId?.clientName || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate" title={item.failureReason}>
                      {item.failureReason || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.reportedBy || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.date ? new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                    <td className="px-4 py-3">
                        <Button
                          size="sm"
                          disabled={loadingRetest}
                          onClick={() => handleStartTesting(item)}
                          className="bg-[#003a70] hover:bg-[#002850] text-white gap-1.5"
                        >
                          {loadingRetest ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <PlayCircle className="w-3.5 h-3.5" />
                          )}
                          Start Testing
                        </Button>
                      </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t text-sm text-gray-500">
            Showing {filteredList.length} of {failedList.length} records
          </div>
        </Card>
      )}
    </div>
  );
}

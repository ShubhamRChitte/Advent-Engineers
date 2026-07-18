import { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Search, X, CheckSquare, Square, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import axios from '@/utils/axiosConfig';
import { toast } from 'sonner';

interface AvailableTransformer {
  _id: string;
  transformerId: string;
  uniqueId: string;
  jobId: string;
  customerName: string;
  orderId: string | null;
  orderDetails: any;
}

interface Props {
  onClose: () => void;
  onCreated: (batch: any) => void;
  type: 'pt' | 'ct';
}

export function InspectionCreateModal({ onClose, onCreated, type }: Props) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<AvailableTransformer[]>([]);
  const [grouped, setGrouped] = useState<Record<string, AvailableTransformer[]>>({});
  const [selected, setSelected] = useState<Record<string, AvailableTransformer>>({});
  const [expandedJobs, setExpandedJobs] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const apiPrefix = type === 'pt' ? '/pt-inspection' : '/ct-inspection';

  const doSearch = useCallback(async (q: string) => {
    setSearching(true);
    setHasSearched(true);
    try {
      const res = await axios.get(`${apiPrefix}/available-transformers`, {
        params: { q },
        withCredentials: true
      });
      const data: AvailableTransformer[] = res.data.data || [];
      setResults(data);

      // Group by jobId
      const grp: Record<string, AvailableTransformer[]> = {};
      data.forEach(t => {
        if (!grp[t.jobId]) grp[t.jobId] = [];
        grp[t.jobId].push(t);
      });
      setGrouped(grp);

      // Auto-expand all jobs
      const expanded: Record<string, boolean> = {};
      Object.keys(grp).forEach(j => (expanded[j] = true));
      setExpandedJobs(expanded);
    } catch (err: any) {
      toast.error('Failed to search transformers.');
    } finally {
      setSearching(false);
    }
  }, [apiPrefix]);

  // Load all on mount
  useEffect(() => { doSearch(''); }, [doSearch]);

  const handleSearch = () => doSearch(query);

  const toggleSelect = (t: AvailableTransformer) => {
    setSelected(prev => {
      const next = { ...prev };
      if (next[t.transformerId]) {
        delete next[t.transformerId];
      } else {
        next[t.transformerId] = t;
      }
      return next;
    });
  };

  const toggleJob = (jobId: string) => {
    setExpandedJobs(prev => ({ ...prev, [jobId]: !prev[jobId] }));
  };

  const toggleSelectAll = (jobId: string) => {
    const jobTfs = grouped[jobId] || [];
    const allSelected = jobTfs.every(t => selected[t.transformerId]);
    setSelected(prev => {
      const next = { ...prev };
      if (allSelected) {
        jobTfs.forEach(t => delete next[t.transformerId]);
      } else {
        jobTfs.forEach(t => (next[t.transformerId] = t));
      }
      return next;
    });
  };

  const selectedCount = Object.keys(selected).length;

  const handleCreate = async () => {
    if (selectedCount === 0) return;
    setCreating(true);
    try {
      const transformers = Object.values(selected).map(t => ({
        transformerId: t.transformerId,
        jobId: t.jobId,
        customerName: t.customerName,
        orderId: t.orderId
      }));
      const res = await axios.post(`${apiPrefix}/batches`, { transformers }, { withCredentials: true });
      if (res.data.success) {
        toast.success(`Inspection Batch ${res.data.data.batchNumber} created!`);
        onCreated(res.data.data);
      } else {
        toast.error(res.data.message || 'Failed to create batch.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create batch.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-indigo-700">
          <div>
            <h2 className="text-white font-bold text-lg">New {type.toUpperCase()} Inspection Batch</h2>
            <p className="text-indigo-200 text-xs mt-0.5">Select transformers from any completed job</p>
          </div>
          <button onClick={onClose} className="text-indigo-200 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by Job ID, Transformer ID, or Customer Name..."
                className="pl-9 bg-white"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching}
              style={{ backgroundColor: '#4f46e5', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', border: 'none', cursor: searching ? 'not-allowed' : 'pointer', opacity: searching ? 0.7 : 1 }}
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {searching && (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Searching...
            </div>
          )}

          {!searching && hasSearched && Object.keys(grouped).length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="font-medium">No completed {type.toUpperCase()} transformers found.</p>
              <p className="text-sm mt-1">Only transformers that completed {type.toUpperCase()} Final Testing are shown here.</p>
            </div>
          )}

          {!searching && Object.entries(grouped).map(([jobId, tfs]) => {
            const allJobSelected = tfs.every(t => selected[t.transformerId]);
            const someSelected = tfs.some(t => selected[t.transformerId]);
            const isExpanded = expandedJobs[jobId] !== false;
            const customerName = tfs[0]?.customerName || 'Unknown Customer';

            return (
              <div key={jobId} className="mb-2 border border-gray-200 rounded-xl overflow-hidden">
                {/* Job Header */}
                <div
                  className="flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => toggleJob(jobId)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                    <div>
                      <span className="font-bold text-gray-800">{jobId}</span>
                      <span className="text-gray-500 text-sm ml-2">— {customerName}</span>
                    </div>
                    <Badge className="bg-indigo-50 text-indigo-700 text-xs">{tfs.length} unit(s)</Badge>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); toggleSelectAll(jobId); }}
                    className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-colors ${
                      allJobSelected
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-indigo-600 border-indigo-300 hover:bg-indigo-50'
                    }`}
                  >
                    {allJobSelected ? 'Deselect All' : someSelected ? 'Select All' : 'Select All'}
                  </button>
                </div>

                {/* Transformer Rows */}
                {isExpanded && (
                  <div className="divide-y divide-gray-100">
                    {tfs.map(t => {
                      const isSelected = !!selected[t.transformerId];
                      return (
                        <div
                          key={t.transformerId}
                          onClick={() => toggleSelect(t)}
                          className={`flex items-center gap-3 px-6 py-3 cursor-pointer transition-colors ${
                            isSelected ? 'bg-indigo-50' : 'bg-white hover:bg-gray-50'
                          }`}
                        >
                          {isSelected
                            ? <CheckSquare className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                            : <Square className="w-5 h-5 text-gray-300 flex-shrink-0" />
                          }
                          <span className={`font-semibold text-sm ${isSelected ? 'text-indigo-700' : 'text-gray-700'}`}>
                            {t.transformerId}
                          </span>
                          <span className="text-gray-400 text-xs ml-auto">{t.jobId}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedCount > 0
              ? <span><strong className="text-indigo-700">{selectedCount}</strong> transformer{selectedCount > 1 ? 's' : ''} selected</span>
              : <span className="text-gray-400">No transformers selected</span>
            }
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <button
              onClick={handleCreate}
              disabled={selectedCount === 0 || creating}
              style={{
                backgroundColor: selectedCount === 0 || creating ? '#a5b4fc' : '#4f46e5',
                color: '#fff',
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 18px', borderRadius: '8px',
                fontWeight: '600', fontSize: '14px', border: 'none',
                cursor: selectedCount === 0 || creating ? 'not-allowed' : 'pointer'
              }}
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Create Inspection Batch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

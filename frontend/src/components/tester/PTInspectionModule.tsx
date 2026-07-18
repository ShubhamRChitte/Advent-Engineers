import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Plus, Search, Layers, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import axios from '@/utils/axiosConfig';
import { Skeleton } from '../ui/skeleton';
import { InspectionCreateModal } from './InspectionCreateModal';
import { InspectionBatchDetailView } from './InspectionBatchDetailView';
import { PTInspectionReport } from './PTInspectionReport';

interface Batch {
  _id: string;
  batchNumber: string;
  createdBy: string;
  createdAt: string;
  status: 'In Progress' | 'Completed';
  transformers: any[];
}

interface PTInspectionModuleProps {
  user: any;
}

export function PTInspectionModule({ user }: PTInspectionModuleProps) {
  const [batches, setBatches]           = useState<Batch[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBatch, setSelectedBatch]     = useState<Batch | null>(null);
  const [openReport, setOpenReport]           = useState<{ batchId: string; transformerId: string } | null>(null);
  const [searchQuery, setSearchQuery]   = useState('');

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/pt-inspection/batches', { withCredentials: true });
      setBatches(res.data.data || []);
    } catch {
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBatches(); }, []);

  const handleBatchCreated = (batch: Batch) => {
    setBatches(prev => [batch, ...prev]);
    setShowCreateModal(false);
    setSelectedBatch(batch);
  };

  const handleBatchUpdated = (updated: Batch) => {
    setBatches(prev => prev.map(b => b._id === updated._id ? updated : b));
    setSelectedBatch(updated);
  };

  // ── Level 3: Report ─────────────────────────────────────────────────────────
  if (openReport && selectedBatch) {
    const batchTransformer = selectedBatch.transformers.find(
      t => t.transformerId === openReport.transformerId
    );
    return (
      <div>
        <div className="no-print mb-4">
          <Button variant="outline" size="sm" onClick={() => setOpenReport(null)} className="gap-2">
            ← Back to {selectedBatch.batchNumber}
          </Button>
        </div>
        <PTInspectionReport
          batchId={openReport.batchId}
          transformerId={openReport.transformerId}
          batchTransformer={batchTransformer}
          user={user}
          onSaved={async () => {
            setOpenReport(null);
            try {
              const res = await axios.get('/pt-inspection/batches', { withCredentials: true });
              const list = res.data.data || [];
              setBatches(list);
              const updated = list.find((b: any) => b._id === selectedBatch?._id);
              if (updated) setSelectedBatch(updated);
            } catch (e) {
              console.error(e);
            }
          }}
        />
      </div>
    );
  }

  // ── Level 2: Batch Detail ────────────────────────────────────────────────────
  if (selectedBatch) {
    return (
      <InspectionBatchDetailView
        batch={selectedBatch}
        type="pt"
        onBack={() => setSelectedBatch(null)}
        onOpenReport={(batchId, transformerId) => setOpenReport({ batchId, transformerId })}
        onBatchUpdated={handleBatchUpdated}
      />
    );
  }

  // ── Level 1: Dashboard ───────────────────────────────────────────────────────
  const filteredBatches = batches.filter(b =>
    !searchQuery.trim() ||
    b.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.createdBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const inProgressCount = batches.filter(b => b.status === 'In Progress').length;
  const completedCount  = batches.filter(b => b.status === 'Completed').length;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">PT Inspection Module</h2>
          <p className="text-gray-500 text-sm mt-0.5">Manage inspection batches for completed PT transformers</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBatches}
            className="gap-1.5 text-gray-600"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            New Inspection Batch
          </button>
        </div>
      </div>

      {/* ── Stats row (only when there are batches) ── */}
      {batches.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Layers className="w-5 h-5" style={{ color: '#4f46e5' }} />
              <div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#4f46e5' }}>{batches.length}</div>
                <div style={{ fontSize: '12px', color: '#6366f1' }}>Total Batches</div>
              </div>
            </div>
          </div>
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock className="w-5 h-5" style={{ color: '#d97706' }} />
              <div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#d97706' }}>{inProgressCount}</div>
                <div style={{ fontSize: '12px', color: '#92400e' }}>In Progress</div>
              </div>
            </div>
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 className="w-5 h-5" style={{ color: '#16a34a' }} />
              <div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#16a34a' }}>{completedCount}</div>
                <div style={{ fontSize: '12px', color: '#166534' }}>Completed</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Search (only when batches exist) ── */}
      {batches.length > 0 && (
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search batches..."
            className="pl-9 bg-white"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      ) : filteredBatches.length === 0 ? (
        // Empty State
        <div style={{
          border: '2px dashed #c7d2fe',
          borderRadius: '16px',
          background: '#fafafe',
          padding: '60px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '64px', height: '64px',
            background: '#e0e7ff',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Layers className="w-8 h-8" style={{ color: '#6366f1' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#374151', margin: 0 }}>
              No Inspection Batches Yet
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '6px', maxWidth: '320px' }}>
              Create your first inspection batch by selecting completed PT transformers from any job.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{ backgroundColor: '#4f46e5', color: '#ffffff', marginTop: '8px' }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm shadow hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            New Inspection Batch
          </button>
        </div>
      ) : (
        // Batch Cards Grid
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {filteredBatches.map(batch => {
            const completed = batch.transformers.filter((t: any) => t.status === 'Completed').length;
            const total     = batch.transformers.length;
            const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;
            const isComplete = batch.status === 'Completed';

            return (
              <div
                key={batch._id}
                onClick={() => setSelectedBatch(batch)}
                style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '18px',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.15s, border-color 0.15s'
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#6366f1';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(99,102,241,0.12)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937', margin: 0 }}>{batch.batchNumber}</h3>
                  <span style={{
                    fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '9999px',
                    background: isComplete ? '#f0fdf4' : '#fffbeb',
                    color: isComplete ? '#15803d' : '#b45309',
                    border: `1px solid ${isComplete ? '#bbf7d0' : '#fde68a'}`
                  }}>
                    {batch.status}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px', lineHeight: '1.8' }}>
                  <div>By <strong style={{ color: '#374151' }}>{batch.createdBy}</strong></div>
                  <div>{new Date(batch.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                  <div><strong style={{ color: '#374151' }}>{total}</strong> transformer{total !== 1 ? 's' : ''}</div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
                    <span>{completed}/{total} done</span><span>{pct}%</span>
                  </div>
                  <div style={{ height: '5px', background: '#f3f4f6', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: '#6366f1', borderRadius: '9999px', transition: 'width 0.3s' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showCreateModal && (
        <InspectionCreateModal
          type="pt"
          onClose={() => setShowCreateModal(false)}
          onCreated={handleBatchCreated}
        />
      )}
    </div>
  );
}

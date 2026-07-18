import { useState } from 'react';
import { Button } from '../ui/button';
import { ArrowLeft, PlayCircle, RotateCcw, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import axios from '@/utils/axiosConfig';
import { toast } from 'sonner';

interface BatchTransformer {
  transformerId: string;
  jobId: string;
  customerName: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  startedAt?: string;
  completedAt?: string;
}

interface Batch {
  _id: string;
  batchNumber: string;
  createdBy: string;
  createdAt: string;
  status: 'In Progress' | 'Completed';
  transformers: BatchTransformer[];
}

interface Props {
  batch: Batch;
  type: 'pt' | 'ct';
  onBack: () => void;
  onOpenReport: (batchId: string, transformerId: string) => void;
  onBatchUpdated: (batch: Batch) => void;
}

export function InspectionBatchDetailView({ batch, type, onBack, onOpenReport, onBatchUpdated }: Props) {
  const [localBatch, setLocalBatch] = useState<Batch>(batch);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const apiPrefix = type === 'pt' ? '/pt-inspection' : '/ct-inspection';

  const markCompleted = async (transformerId: string) => {
    setUpdatingId(transformerId);
    try {
      const res = await axios.patch(
        `${apiPrefix}/batches/${localBatch._id}/transformers/${transformerId}/status`,
        { status: 'Completed' },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success('Marked as completed.');
        setLocalBatch(res.data.data);
        onBatchUpdated(res.data.data);
      }
    } catch {
      toast.error('Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const completedCount = localBatch.transformers.filter(t => t.status === 'Completed').length;
  const totalCount     = localBatch.transformers.length;
  const progressPct    = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isComplete     = localBatch.status === 'Completed';

  return (
    <div className="space-y-5">
      {/* Back button */}
      <div>
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Batches
        </Button>
      </div>

      {/* Batch Header */}
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px 22px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#111827', margin: 0 }}>
                {localBatch.batchNumber}
              </h2>
              <span style={{
                fontSize: '12px', fontWeight: '600', padding: '3px 10px', borderRadius: '9999px',
                background: isComplete ? '#f0fdf4' : '#fffbeb',
                color: isComplete ? '#15803d' : '#b45309',
                border: `1px solid ${isComplete ? '#bbf7d0' : '#fde68a'}`
              }}>
                {localBatch.status}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
              Created by <strong style={{ color: '#374151' }}>{localBatch.createdBy}</strong> on{' '}
              {new Date(localBatch.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#4f46e5' }}>
              {completedCount} / {totalCount}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Transformers Completed</div>
          </div>
        </div>

        {/* Progress */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
            <span>Progress</span><span>{progressPct}%</span>
          </div>
          <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #6366f1, #4f46e5)',
              borderRadius: '9999px',
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>
      </div>

      {/* Transformers Table */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: 0 }}>
            Transformers in this Batch
          </h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Transformer ID', 'Job Number', 'Customer', 'Status', 'Action'].map((h, i) => (
                  <th key={h} style={{
                    padding: '10px 16px',
                    textAlign: i >= 3 ? 'center' : 'left',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {localBatch.transformers.map((t, idx) => (
                <tr key={t.transformerId} style={{
                  borderBottom: idx < localBatch.transformers.length - 1 ? '1px solid #f3f4f6' : 'none',
                  background: '#fff'
                }}>
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: '#1f2937' }}>{t.transformerId}</td>
                  <td style={{ padding: '12px 16px', color: '#4b5563' }}>{t.jobId}</td>
                  <td style={{ padding: '12px 16px', color: '#4b5563' }}>{t.customerName || '—'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '9999px',
                      background: t.status === 'Completed' ? '#f0fdf4' : t.status === 'In Progress' ? '#fffbeb' : '#f9fafb',
                      color: t.status === 'Completed' ? '#15803d' : t.status === 'In Progress' ? '#b45309' : '#6b7280',
                      border: `1px solid ${t.status === 'Completed' ? '#bbf7d0' : t.status === 'In Progress' ? '#fde68a' : '#e5e7eb'}`
                    }}>
                      {t.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      {t.status === 'Completed' ? (
                        <>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            background: '#f0fdf4', color: '#15803d',
                            border: '1px solid #bbf7d0',
                            padding: '5px 10px', borderRadius: '6px',
                            fontSize: '12px', fontWeight: '600'
                          }}>
                            <CheckCircle2 style={{ width: '13px', height: '13px' }} /> Completed
                          </span>
                          <button
                            onClick={() => onOpenReport(localBatch._id, t.transformerId)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              background: '#eef2ff', color: '#4f46e5',
                              border: '1px solid #c7d2fe',
                              padding: '5px 10px', borderRadius: '6px',
                              fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                            }}
                          >
                            <FileText style={{ width: '13px', height: '13px' }} /> View Report
                          </button>
                        </>
                      ) : t.status === 'In Progress' ? (
                        <>
                          <button
                            onClick={() => onOpenReport(localBatch._id, t.transformerId)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              background: '#fffbeb', color: '#b45309',
                              border: '1px solid #fde68a',
                              padding: '5px 10px', borderRadius: '6px',
                              fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                            }}
                          >
                            <RotateCcw style={{ width: '13px', height: '13px' }} /> Continue
                          </button>
                          <button
                            disabled={updatingId === t.transformerId}
                            onClick={() => markCompleted(t.transformerId)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              background: '#f0fdf4', color: '#15803d',
                              border: '1px solid #bbf7d0',
                              padding: '5px 10px', borderRadius: '6px',
                              fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                              opacity: updatingId === t.transformerId ? 0.6 : 1
                            }}
                          >
                            {updatingId === t.transformerId
                              ? <Loader2 style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} />
                              : <CheckCircle2 style={{ width: '13px', height: '13px' }} />
                            }
                            Mark Done
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => onOpenReport(localBatch._id, t.transformerId)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            background: '#4f46e5', color: '#ffffff',
                            border: 'none',
                            padding: '6px 14px', borderRadius: '6px',
                            fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                          }}
                        >
                          <PlayCircle style={{ width: '14px', height: '14px' }} /> Start Inspection
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

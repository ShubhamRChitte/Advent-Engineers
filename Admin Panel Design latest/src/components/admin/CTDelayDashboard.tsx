import { useState, useEffect, useCallback } from 'react';
import axios from '@/utils/axiosConfig';
import { Clock, AlertTriangle, Users, Briefcase, List, RefreshCw, Filter } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

const API_BASE = `/ct-timer`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMs(ms: number): string {
  if (!ms || ms <= 0) return '—';
  const totalSeconds = Math.floor(ms / 1000);
  const hours   = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0)   return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatDateTime(d: string | Date): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
}

function stageLabel(stage: string): string {
  const map: Record<string, string> = {
    core:            'Core Test (Total)',
    core_metering:   'Core Metering',
    core_protection: 'Core Protection',
    core_ps:         'Core PS',
    secondary:       'Secondary Test',
    after_primary:   'After Primary',
    final:           'Final Test'
  };
  return map[stage] || stage;
}

function stageBadgeColor(stage: string): string {
  const map: Record<string, string> = {
    core:            'bg-blue-100 text-blue-700',
    core_metering:   'bg-purple-100 text-purple-700',
    core_protection: 'bg-orange-100 text-orange-700',
    core_ps:         'bg-blue-100 text-blue-700',
    secondary:       'bg-purple-100 text-purple-700',
    after_primary:   'bg-orange-100 text-orange-700',
    final:           'bg-teal-100 text-teal-700'
  };
  return map[stage] || 'bg-gray-100 text-gray-700';
}

function roleLabel(role: string): string {
  const map: Record<string, string> = {
    'core-tester':          'Core Testing Engineer',
    'secondary-tester':     'Secondary Testing Engineer',
    'after-primary-tester': 'After-Primary Testing Engineer',
    'final-tester':         'Final Testing Engineer'
  };
  return map[role] || role;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface FlatRecord {
  _id: string;
  jobId: string;
  testerName: string;
  role: string;
  stage: string;
  coreCount: number;
  startTime: string;
  endTime: string;
  expectedMinutes: number;
  actualTimeMs: number;
  delayMs: number;
  isDelayed: boolean;
  transformerId: string;
}

interface JobRecord {
  jobId: string;
  totalUnits: number;
  delayedUnits: number;
  totalDelayMs: number;
}

interface TesterRecord {
  testerName: string;
  role: string;
  totalUnits: number;
  delayedUnits: number;
  totalDelayMs: number;
  avgActualMs: number;
  avgDelayMs: number;
}

interface DashboardData {
  flatList: FlatRecord[];
  jobWise: JobRecord[];
  testerWise: TesterRecord[];
  totalRecords: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CTDelayDashboard() {
  const [activeTab, setActiveTab] = useState<'job' | 'tester' | 'all'>('job');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (stageFilter) params.stage = stageFilter;
      if (startDate)   params.startDate = startDate;
      if (endDate)     params.endDate   = endDate;

      const res = await axios.get(`${API_BASE}/dashboard`, {
        params,
        withCredentials: true
      });

      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('[CTDelayDashboard] Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [stageFilter, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Summary Stats ──────────────────────────────────────────────────────────
  const totalDelayed = data?.flatList.filter(r => r.isDelayed).length ?? 0;
  const totalRecords = data?.totalRecords ?? 0;
  const delayRate    = totalRecords > 0 ? Math.round((totalDelayed / totalRecords) * 100) : 0;
  const avgDelay     = data && totalDelayed > 0
    ? Math.round(data.flatList.filter(r => r.isDelayed).reduce((sum, r) => sum + r.delayMs, 0) / totalDelayed)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">CT Delay Tracker</h2>
          <p className="text-gray-500 mt-1 text-sm">
            Track testing duration and delays for Core, Secondary, After-Primary &amp; Final CT stages
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Filters:</span>
          </div>

          <select
            value={stageFilter}
            onChange={e => setStageFilter(e.target.value)}
            className="border border-gray-300 rounded-md text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#003a70]"
          >
            <option value="">All CT Stages</option>
            <option value="core">Core Test (Total)</option>
            <option value="core_metering">Core Metering</option>
            <option value="core_protection">Core Protection</option>
            <option value="core_ps">Core PS</option>
            <option value="secondary">Secondary Test</option>
            <option value="after_primary">After Primary</option>
            <option value="final">Final Test</option>
          </select>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">From:</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-md text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#003a70]"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">To:</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-md text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#003a70]"
            />
          </div>

          {(stageFilter || startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setStageFilter(''); setStartDate(''); setEndDate(''); }}
              className="text-gray-400 hover:text-gray-700"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Expected time limits reference */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
          <span><span className="font-semibold text-gray-700">Core:</span> 3 min</span>
          <span><span className="font-semibold text-gray-700">Secondary:</span> 5 min</span>
          <span><span className="font-semibold text-gray-700">After Primary:</span> 5 min (single) / 20 min (multicore)</span>
          <span><span className="font-semibold text-gray-700">Final:</span> 22 min</span>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 border-l-4 border-l-[#003a70]">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Records</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{loading ? '…' : totalRecords}</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-red-500">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Delayed Units</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{loading ? '…' : totalDelayed}</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-amber-500">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Delay Rate</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{loading ? '…' : `${delayRate}%`}</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-orange-500">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Delay</p>
          <p className="text-3xl font-bold text-orange-600 mt-1">{loading ? '…' : formatMs(avgDelay)}</p>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { id: 'job',    label: 'Job-wise',    icon: Briefcase },
          { id: 'tester', label: 'Testing Engineer-wise', icon: Users },
          { id: 'all',    label: 'All Records', icon: List }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#003a70] text-[#003a70]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading data…</div>
      ) : !data || data.totalRecords === 0 ? (
        <div className="text-center py-16">
          <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No CT timer records found for the selected filters.</p>
        </div>
      ) : (
        <>
          {/* ── Job-wise tab ─────────────────────────────────────────────────── */}
          {activeTab === 'job' && (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Job No.', 'Total Units', 'Delayed Units', 'Delay Rate', 'Total Delay'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.jobWise.map(row => (
                      <tr key={row.jobId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono font-medium text-[#003a70]">{row.jobId}</td>
                        <td className="px-4 py-3 text-gray-700">{row.totalUnits}</td>
                        <td className="px-4 py-3">
                          {row.delayedUnits > 0 ? (
                            <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                              <AlertTriangle className="w-3 h-3" />
                              {row.delayedUnits}
                            </span>
                          ) : (
                            <span className="text-green-600 font-medium">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {row.totalUnits > 0 ? (
                            <Badge
                              className={
                                row.delayedUnits / row.totalUnits > 0.5
                                  ? 'bg-red-100 text-red-700'
                                  : row.delayedUnits > 0
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-green-100 text-green-700'
                              }
                            >
                              {Math.round((row.delayedUnits / row.totalUnits) * 100)}%
                            </Badge>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{formatMs(row.totalDelayMs)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* ── Tester-wise tab ──────────────────────────────────────────────── */}
          {activeTab === 'tester' && (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Testing Engineer Name', 'Role', 'Total Units', 'Delayed', 'Avg Time', 'Avg Delay', 'Total Delay'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.testerWise.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800">{row.testerName}</td>
                        <td className="px-4 py-3">
                          <Badge className="bg-blue-100 text-blue-700 text-xs">
                            {roleLabel(row.role)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{row.totalUnits}</td>
                        <td className="px-4 py-3">
                          {row.delayedUnits > 0 ? (
                            <span className="text-red-600 font-medium">{row.delayedUnits}</span>
                          ) : (
                            <span className="text-green-600 font-medium">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{formatMs(row.avgActualMs)}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {row.delayedUnits > 0 ? (
                            <span className="text-amber-600">{formatMs(row.avgDelayMs)}</span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{formatMs(row.totalDelayMs)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* ── All Records tab ──────────────────────────────────────────────── */}
          {activeTab === 'all' && (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Job No.', 'Testing Engineer', 'Stage', 'Cores', 'Start', 'End', 'Expected', 'Actual', 'Delay', 'Status'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.flatList.map(row => (
                      <tr key={row._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-[#003a70] font-medium">{row.jobId}</td>
                        <td className="px-4 py-3 text-gray-800">{row.testerName}</td>
                        <td className="px-4 py-3">
                          <Badge className={`text-xs ${stageBadgeColor(row.stage)}`}>
                            {stageLabel(row.stage)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{row.coreCount || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{formatDateTime(row.startTime)}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{formatDateTime(row.endTime)}</td>
                        <td className="px-4 py-3 text-gray-700">{row.expectedMinutes}m</td>
                        <td className="px-4 py-3 text-gray-700">{formatMs(row.actualTimeMs)}</td>
                        <td className="px-4 py-3">
                          {row.isDelayed ? (
                            <span className="inline-flex items-center gap-1 text-red-600 font-medium text-xs">
                              <AlertTriangle className="w-3 h-3" />
                              +{formatMs(row.delayMs)}
                            </span>
                          ) : (
                            <span className="text-green-600 text-xs font-medium">On time</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {row.isDelayed ? (
                            <Badge className="bg-red-100 text-red-700 text-xs">Delayed</Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 text-xs">On Time</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
                Showing {data.flatList.length} records
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

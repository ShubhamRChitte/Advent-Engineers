import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from '@/utils/axiosConfig';
import { Clock, AlertTriangle, Users, Briefcase, List, RefreshCw, Filter, Search } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

const API_BASE = `/pt-timer`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMs(ms: number): string {
  if (!ms || ms <= 0) return '—';
  const totalSeconds = Math.floor(ms / 1000);
  const hours   = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatDateTime(d: string | Date): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
}

function stageLabel(stage: string): string {
  return stage === 'pt_pretest' ? 'PT Pretest' : 'PT Final';
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface FlatRecord {
  _id: string;
  jobId: string;
  testerName: string;
  role: string;
  stage: string;
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

export function PTDelayDashboard() {
  const [activeTab, setActiveTab] = useState<'job' | 'tester' | 'all'>('job');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<string>('');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('weekly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Update dates when period changes
  useEffect(() => {
    if (period === 'custom') return;
    const end = new Date();
    const start = new Date();
    
    if (period === 'daily') {
      // Today only
      start.setHours(0, 0, 0, 0);
    } else if (period === 'weekly') {
      // Last 7 days
      start.setDate(end.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'monthly') {
      // Last 30 days
      start.setDate(end.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    }

    const formatDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  }, [period]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (stageFilter) params.stage = stageFilter;
      if (startDate)   params.startDate = startDate;
      if (endDate)     params.endDate = endDate;

      const res = await axios.get(`${API_BASE}/dashboard`, {
        params,
        withCredentials: true
      });

      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('[PTDelayDashboard] Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [stageFilter, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Client-side filtering ──────────────────────────────────────────────────
  const filteredFlatList = useMemo(() => {
    if (!data?.flatList) return [];
    if (!debouncedSearch) return data.flatList;
    const lower = debouncedSearch.toLowerCase();
    return data.flatList.filter(r => 
      (r.jobId && r.jobId.toLowerCase().includes(lower)) ||
      (r.testerName && r.testerName.toLowerCase().includes(lower)) ||
      (r.transformerId && r.transformerId.toLowerCase().includes(lower))
    );
  }, [data, debouncedSearch]);

  const filteredJobWise = useMemo(() => {
    if (!data?.jobWise) return [];
    if (!debouncedSearch) return data.jobWise;
    const lower = debouncedSearch.toLowerCase();
    return data.jobWise.filter(r => r.jobId && r.jobId.toLowerCase().includes(lower));
  }, [data, debouncedSearch]);

  const filteredTesterWise = useMemo(() => {
    if (!data?.testerWise) return [];
    if (!debouncedSearch) return data.testerWise;
    const lower = debouncedSearch.toLowerCase();
    return data.testerWise.filter(r => r.testerName && r.testerName.toLowerCase().includes(lower));
  }, [data, debouncedSearch]);

  // ── Summary Stats ──────────────────────────────────────────────────────────
  const totalDelayed  = filteredFlatList.filter(r => r.isDelayed).length;
  const totalRecords  = filteredFlatList.length;
  const delayRate     = totalRecords > 0 ? Math.round((totalDelayed / totalRecords) * 100) : 0;
  const avgDelay      = totalDelayed > 0
    ? Math.round(filteredFlatList.filter(r => r.isDelayed).reduce((sum, r) => sum + r.delayMs, 0) / totalDelayed)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">PT Delay Tracker</h2>
          <p className="text-gray-500 mt-1 text-sm">
            Track testing duration and delays for PT Pretest &amp; PT Final stages
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search job, tester..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003a70] w-64"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-2 h-[38px]">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
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
            onChange={e => { setStageFilter(e.target.value); }}
            className="border border-gray-300 rounded-md text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#003a70]"
          >
            <option value="">All Stages</option>
            <option value="pt_pretest">PT Pretest</option>
            <option value="pt">PT Final</option>
          </select>

          {/* Quick Date Filters */}
          <div className="bg-gray-100 p-1 rounded-lg flex items-center shadow-sm border border-gray-200">
            {(['daily', 'weekly', 'monthly', 'custom'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize ${
                  period === p ? 'bg-white text-[#003a70] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500">From:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => { setStartDate(e.target.value); setPeriod('custom'); }}
                  className="border border-gray-300 rounded-md text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#003a70]"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500">To:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => { setEndDate(e.target.value); setPeriod('custom'); }}
                  className="border border-gray-300 rounded-md text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#003a70]"
                />
              </div>
            </>
          )}

          {(stageFilter || period !== 'weekly') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setStageFilter(''); setPeriod('weekly'); }}
              className="text-gray-600 hover:text-gray-900 border-gray-300"
            >
              Clear Filters
            </Button>
          )}
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
      <div className="flex gap-2 sm:gap-4 border-b border-gray-200 overflow-x-auto pb-[1px]">
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
              className={`flex items-center gap-2 px-3 sm:px-5 py-3 whitespace-nowrap text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#003a70] text-[#003a70]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
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
          <p className="text-gray-400 text-sm">No timer records found for the selected filters.</p>
        </div>
      ) : (
        <>
          {/* ── Job-wise tab ──────────────────────────────────────────────── */}
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
                    {filteredJobWise.map(row => (
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

          {/* ── Tester-wise tab ───────────────────────────────────────────── */}
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
                    {filteredTesterWise.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800">{row.testerName}</td>
                        <td className="px-4 py-3">
                          <Badge className="bg-blue-100 text-blue-700 text-xs">
                            {row.role === 'pt-pretester' ? 'PT Pre-Testing Engineer' : 'PT Testing Engineer'}
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

          {/* ── All Records tab ───────────────────────────────────────────── */}
          {activeTab === 'all' && (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Job No.', 'Testing Engineer', 'Stage', 'Start', 'End', 'Expected', 'Actual', 'Delay', 'Status'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredFlatList.map(row => (
                      <tr key={row._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-[#003a70] font-medium">{row.jobId}</td>
                        <td className="px-4 py-3 text-gray-800">{row.testerName}</td>
                        <td className="px-4 py-3">
                          <Badge className="bg-purple-100 text-purple-700 text-xs">
                            {stageLabel(row.stage)}
                          </Badge>
                        </td>
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
                Showing {filteredFlatList.length} records
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

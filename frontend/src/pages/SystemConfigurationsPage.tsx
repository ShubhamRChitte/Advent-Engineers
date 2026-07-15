import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Settings, Save, Clock, Activity, HardDrive, Search, Filter, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

export function SystemConfigurationsPage() {
  const [activeTab, setActiveTab] = useState<'timers' | 'accuracy' | 'system'>('timers');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingLimitId, setSavingLimitId] = useState<string | null>(null);
  
  const [filterType, setFilterType] = useState<'ALL' | 'CT' | 'PT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Data States
  const [timers, setTimers] = useState<any[]>([]);
  const [accuracyLimits, setAccuracyLimits] = useState<any[]>([]);
  const [idSettings, setIdSettings] = useState<any>({
    orderId: { enabled: false, prefix: '', lastSequence: '000', padLength: 3 },
    transformerId: { enabled: false, prefix: '', lastSequence: '000', padLength: 3 },
    preTestBatchId: { enabled: false, prefix: '', lastSequence: '000', padLength: 3 },
    preTestCoreId: { enabled: false, prefix: '', lastSequence: '000', padLength: 3 },
  });

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const fetchData = async (tab: string) => {
    setLoading(true);
    try {
      if (tab === 'timers') {
        const res = await axios.get('/database-admin/timers', { withCredentials: true });
        if (res.data.success) {
          const dbTimers = res.data.data;
          const defaultKeys = [
            { key: 'ct_core_minutes', label: 'CT Core Test (mins)' },
            { key: 'ct_secondary_minutes', label: 'CT Secondary Test (mins)' },
            { key: 'ct_after_primary_single_minutes', label: 'CT After Primary (Single) (mins)' },
            { key: 'ct_after_primary_multi_minutes', label: 'CT After Primary (Multi) (mins)' },
            { key: 'ct_final_minutes', label: 'CT Final Test (mins)' },
            { key: 'pt_pretest_minutes', label: 'PT Pre-Test (mins)' },
            { key: 'pt_final_minutes', label: 'PT Final Test (mins)' }
          ];
          
          const mergedTimers = defaultKeys.map(dk => {
            const found = dbTimers.find((t: any) => t.key === dk.key);
            return {
              key: dk.key,
              label: dk.label,
              value: found ? found.value : ''
            };
          });
          setTimers(mergedTimers);
        }
      } else if (tab === 'accuracy') {
        const res = await axios.get('/accuracy-limits/metering', { withCredentials: true });
        setAccuracyLimits(res.data || []);
      } else if (tab === 'system') {
        const res = await axios.get('/database-admin/id-settings', { withCredentials: true });
        if (res.data.success && res.data.data) {
          setIdSettings(res.data.data);
        }
      }
    } catch (err) {
      toast.error('Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleTimerChange = (key: string, value: string) => {
    setTimers(prev => prev.map(t => t.key === key ? { ...t, value } : t));
  };

  const saveTimers = async () => {
    setSaving(true);
    try {
      const updates = timers.map(t => ({ key: t.key, value: parseFloat(t.value) || 0 }));
      const res = await axios.put('/database-admin/timers', { updates }, { withCredentials: true });
      if (res.data.success) toast.success('Timers saved successfully!');
    } catch (err) {
      toast.error('Failed to save timers');
    } finally {
      setSaving(false);
    }
  };

  const handleLimitChange = (id: string, loadIdx: number, field: 'ratioLimit' | 'phaseLimit', value: string) => {
    const newLimits = [...accuracyLimits];
    const classIdx = newLimits.findIndex(l => l._id === id);
    if (classIdx === -1) return;
    const val = value === '' ? null : parseFloat(value);
    newLimits[classIdx].limits[loadIdx][field] = val;
    setAccuracyLimits(newLimits);
  };

  const filteredLimits = accuracyLimits.filter(limit => {
    if (filterType !== 'ALL' && limit.transformerType !== filterType) return false;
    if (searchQuery && !limit.accuracyClass.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const saveAccuracyLimit = async (limitConfig: any) => {
    setSavingLimitId(limitConfig._id);
    try {
      const payload = {
        transformerType: limitConfig.transformerType,
        coreType: limitConfig.coreType,
        accuracyClass: limitConfig.accuracyClass,
        limits: limitConfig.limits
      };
      await axios.post('/accuracy-limits', payload, { withCredentials: true });
      toast.success(`Class ${limitConfig.accuracyClass} limits saved successfully!`);
    } catch (err) {
      toast.error(`Failed to save Class ${limitConfig.accuracyClass} limits`);
    } finally {
      setSavingLimitId(null);
    }
  };

  const handleIdSettingChange = (type: string, field: string, value: any) => {
    setIdSettings((prev: any) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  const saveIdSettings = async () => {
    setSaving(true);
    try {
      const res = await axios.put('/database-admin/id-settings', { updates: idSettings }, { withCredentials: true });
      if (res.data.success) {
        toast.success('ID configurations saved successfully!');
        setIdSettings(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to save ID configurations');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 w-full pb-8">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">System Configurations</h2>
          <p className="text-muted-foreground mt-1">Manage global application variables, accuracy limits, and timers.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="bg-gray-100/50 p-1 mb-6 flex rounded-lg w-fit h-auto">
          <TabsTrigger value="timers" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm px-6 py-2.5 rounded-md text-sm font-medium transition-all flex items-center gap-2">
            <Clock className="w-4 h-4" /> Delay Timers
          </TabsTrigger>
          <TabsTrigger value="accuracy" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm px-6 py-2.5 rounded-md text-sm font-medium transition-all flex items-center gap-2">
            <Activity className="w-4 h-4" /> Accuracy Limits
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm px-6 py-2.5 rounded-md text-sm font-medium transition-all flex items-center gap-2">
            <HardDrive className="w-4 h-4" /> ID Generation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timers" className="mt-0">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b bg-gray-50/50 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-gray-900">Delay Timers</CardTitle>
                  <CardDescription className="text-sm mt-1 text-gray-500">Configure the mandatory wait durations (in minutes) for each testing stage.</CardDescription>
                </div>
                <Button onClick={saveTimers} disabled={saving || loading} className="gap-2 bg-[#003a70] hover:bg-[#002850] h-10 px-6 shadow-sm">
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Timers'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {loading ? (
                <div className="text-gray-500 py-12 text-center flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Loading timer settings...
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* CT Timers Panel */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">CT</div>
                      Current Transformer Timers
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {timers.filter(t => t.key.startsWith('ct_')).map(timer => (
                        <div key={timer.key} className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">{timer.label}</label>
                          <div className="relative">
                            <Input 
                              type="number" 
                              min="0"
                              value={timer.value}
                              onChange={(e) => handleTimerChange(timer.key, e.target.value)}
                              className="pl-4 pr-12 py-2 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-lg shadow-sm bg-white"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">min</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PT Timers Panel */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">PT</div>
                      Potential Transformer Timers
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {timers.filter(t => t.key.startsWith('pt_')).map(timer => (
                        <div key={timer.key} className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">{timer.label}</label>
                          <div className="relative">
                            <Input 
                              type="number" 
                              min="0"
                              value={timer.value}
                              onChange={(e) => handleTimerChange(timer.key, e.target.value)}
                              className="pl-4 pr-12 py-2 h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500 text-lg shadow-sm bg-white"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">min</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accuracy" className="mt-0">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b bg-gray-50/50 py-5">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-gray-900">Metering Accuracy Limits</CardTitle>
                  <CardDescription className="text-sm mt-1 text-gray-500">View and edit the automated validation limits for each accuracy class.</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input 
                      placeholder="Search class..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 w-48 text-sm bg-white border-gray-300"
                    />
                  </div>
                  <div className="flex bg-gray-200/60 p-1 rounded-lg">
                    <button onClick={() => setFilterType('ALL')} className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${filterType === 'ALL' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>All</button>
                    <button onClick={() => setFilterType('CT')} className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${filterType === 'CT' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>CT Limits</button>
                    <button onClick={() => setFilterType('PT')} className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${filterType === 'PT' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>PT Limits</button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {loading ? (
                <div className="text-gray-500 py-12 text-center flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Loading accuracy limits...
                </div>
              ) : filteredLimits.length === 0 ? (
                <div className="text-gray-500 py-12 text-center flex flex-col items-center gap-3">
                  No matching limits found.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredLimits.map((limitClass) => (
                    <div key={limitClass._id} className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm flex flex-col h-full">
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-lg shadow-sm">
                            {limitClass.accuracyClass}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-lg">Class {limitClass.accuracyClass}</h4>
                            <p className="text-xs text-gray-500 uppercase font-semibold">{limitClass.transformerType} Metering</p>
                          </div>
                        </div>
                        <Button 
                          onClick={() => saveAccuracyLimit(limitClass)}
                          disabled={savingLimitId === limitClass._id}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {savingLimitId === limitClass._id ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        {limitClass.limits.map((limitRow: any, loadIdx: number) => (
                          <div key={loadIdx} className="bg-gray-50 p-3 rounded-lg border border-gray-100 grid grid-cols-3 gap-3 items-center">
                            <div className="text-sm font-bold text-gray-700">{limitRow.load} Load</div>
                            
                            <div>
                              <label className="text-[10px] uppercase text-gray-500 font-semibold block mb-1">Ratio (±%)</label>
                              <Input 
                                type="number"
                                step="0.01"
                                value={limitRow.ratioLimit === null ? '' : limitRow.ratioLimit}
                                onChange={(e) => handleLimitChange(limitClass._id, loadIdx, 'ratioLimit', e.target.value)}
                                className="h-8 text-sm"
                                placeholder="N/A"
                              />
                            </div>
                            
                            <div>
                              <label className="text-[10px] uppercase text-gray-500 font-semibold block mb-1">Phase (±min)</label>
                              <Input 
                                type="number"
                                step="1"
                                value={limitRow.phaseLimit === null ? '' : limitRow.phaseLimit}
                                onChange={(e) => handleLimitChange(limitClass._id, loadIdx, 'phaseLimit', e.target.value)}
                                className="h-8 text-sm"
                                placeholder="N/A"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="mt-0">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b bg-gray-50/50 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-gray-900">Global ID Settings</CardTitle>
                  <CardDescription className="text-sm mt-1 text-gray-500">Configure global base prefixes and sequential counters for generated IDs.</CardDescription>
                </div>
                <Button onClick={saveIdSettings} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> How to use Global ID Settings
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Override Default Logic:</strong> Turn this ON to enforce your custom sequence. If OFF, the system uses the default ID formats (e.g. TR-JOB-...).</li>
                  <li><strong>Base Prefix:</strong> The text that appears before the number (e.g. <code className="bg-white px-1 rounded border border-blue-200">TR-JOB-2026-278-</code>).</li>
                  <li><strong>Current Sequence Number:</strong> The last number saved in the database. The <strong>next</strong> generated ID will be this number + 1.</li>
                  <li><strong>Padding Digits:</strong> The total length of the number part. E.g., a sequence of 2 with padding 3 becomes <code className="bg-white px-1 rounded border border-blue-200">002</code>.</li>
                </ul>
              </div>
              {loading ? (
                <div className="text-gray-500 py-12 text-center">Loading ID settings...</div>
              ) : (
                <div className="grid gap-8">
                  {[
                    { key: 'orderId', label: 'Order IDs', desc: 'IDs generated when an Order/Job is created' },
                    { key: 'transformerId', label: 'Transformer IDs', desc: 'IDs generated for individual Transformers inside an Order' },
                    { key: 'preTestBatchId', label: 'Pre-Test Batch IDs', desc: 'IDs generated for a new Pre-Test Batch' },
                    { key: 'preTestCoreId', label: 'Pre-Test Core IDs', desc: 'IDs assigned to individual cores during pre-testing' }
                  ].map((config) => {
                    const data = idSettings[config.key] || { enabled: false, prefix: '', lastSequence: 0, padLength: 3 };
                    return (
                      <div key={config.key} className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                          <div>
                            <h4 className="font-bold text-gray-900">{config.label}</h4>
                            <p className="text-sm text-gray-500">{config.desc}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Override Default Logic</span>
                            <button
                              onClick={() => handleIdSettingChange(config.key, 'enabled', !data.enabled)}
                              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${data.enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                              style={{ minWidth: '44px', flexShrink: 0 }}
                            >
                              <span 
                                className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" 
                                style={{ transform: data.enabled ? 'translateX(24px)' : 'translateX(4px)' }}
                              />
                            </button>
                          </div>
                        </div>

                        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-opacity ${data.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Base Prefix</label>
                            <Input 
                              value={data.prefix}
                              onChange={(e) => handleIdSettingChange(config.key, 'prefix', e.target.value)}
                              placeholder="e.g. TR-JOB-2026-278-"
                              className="bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Current Sequence Number</label>
                            <Input 
                              type="number"
                              value={data.lastSequence}
                              onChange={(e) => handleIdSettingChange(config.key, 'lastSequence', parseInt(e.target.value) || 0)}
                              className="bg-white"
                            />
                            <p className="text-xs text-gray-500 mt-1">Stored in database. Next is +1.</p>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Padding Digits</label>
                            <Input 
                              type="number"
                              min="1"
                              max="10"
                              value={data.padLength}
                              onChange={(e) => handleIdSettingChange(config.key, 'padLength', parseInt(e.target.value) || 1)}
                              className="bg-white"
                            />
                            <p className="text-xs text-gray-500 mt-1">E.g. 3 will pad to 003</p>
                          </div>
                        </div>
                        
                        {data.enabled && (
                          <div className="mt-4 p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-sm text-blue-800">
                            <strong>Preview Next ID: </strong> 
                            <span className="font-mono bg-white px-2 py-0.5 rounded border border-blue-200 ml-2">
                              {data.prefix}{String(Number(data.lastSequence) + 1).padStart(data.padLength, '0')}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

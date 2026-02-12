import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Package, Plus, Trash2, AlertCircle, User, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

// --- Types ---
interface Tester {
  _id: string;
  fullName: string;
  designation: string;
  department: string;
}

interface Assignment {
  id: string; // temp id for UI key
  stage: 'core' | 'secondary' | 'primary' | 'final';
  testerName: string;
  unitRange: {
    from: string; // Keep as string for input handling, parse on submit
    to: string;
  };
}

// --- Helper Functions ---
const STAGES = ['core', 'secondary', 'primary', 'final'] as const;

export function CreateOrderView() {
  // --- State ---
  const [formData, setFormData] = useState({
    clientName: '',
    clientContactNo: '',
    transformerName: '',
    transformerType: '',
    quantity: '',
    deadline: '',
    priority: 'Medium',
    specifications: '', // mapped to 'instructions' or just ignored for now

    // Tech Specs
    noOfCores: '1',
    ratedPrimaryCurrent: '',
    ratedSecondaryCurrent: '1',
    ratio: '', // Added Ratio
    mountingDetails: '',
    overallDimension: '',
    isStandard: 'Standard'
  });

  // Assignments State [ { id, stage, tester, range } ]
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [testers, setTesters] = useState<Tester[]>([]);
  const [loading, setLoading] = useState(false);

  // Dynamic Core Config State
  const [coreConfigs, setCoreConfigs] = useState<{ coreType: string }[]>([{ coreType: 'Metering' }]);

  // --- Initial Data Fetching ---
  useEffect(() => {
    const fetchTesters = async () => {
      try {
        const response = await axios.get('http://localhost:3002/auth/testers');
        if (response.data.success) {
          setTesters(response.data.users);
        }
      } catch (error) {
        console.error("Failed to fetch testers", error);
        toast.error("Could not load testers list");
      }
    };
    fetchTesters();
  }, []);

  // --- Handlers ---
  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });

    // Special handling for No. of Cores to resize the config array
    if (field === 'noOfCores') {
      const newCount = parseInt(value) || 1;
      setCoreConfigs(prev => {
        const current = [...prev];
        if (newCount > current.length) {
          // Add new cores (default Metering)
          const added = Array(newCount - current.length).fill({ coreType: 'Metering' });
          return [...current, ...added];
        } else {
          // Trim
          return current.slice(0, newCount);
        }
      });
    }
  };

  const handleCoreConfigChange = (index: number, newType: string) => {
    setCoreConfigs(prev => {
      const updated = [...prev];
      updated[index] = { coreType: newType };
      return updated;
    });
  };

  // --- Assignment Logic ---
  const addAssignmentRow = (stage: typeof STAGES[number]) => {
    const newRow: Assignment = {
      id: Math.random().toString(36).substr(2, 9),
      stage,
      testerName: '',
      unitRange: { from: '', to: '' }
    };
    setAssignments([...assignments, newRow]);
  };

  const updateAssignment = (id: string, field: string, value: any) => {
    setAssignments(prev => prev.map(a => {
      if (a.id !== id) return a;
      if (field === 'from' || field === 'to') {
        return { ...a, unitRange: { ...a.unitRange, [field]: value } };
      }
      return { ...a, [field]: value };
    }));
  };

  const removeAssignment = (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
  };

  // --- Validation ---
  const validateAssignments = (qty: number) => {
    for (const stage of STAGES) {
      const stageAssignments = assignments.filter(a => a.stage === stage);

      // If no assignments for a stage, that might be okay depending on workflow, 
      // but let's assume we want full coverage for now or at least NO overlaps.
      if (stageAssignments.length === 0) continue;

      // Check coverage
      let coveredUnits = new Set<number>();
      for (const asn of stageAssignments) {
        const from = parseInt(asn.unitRange.from);
        const to = parseInt(asn.unitRange.to);

        if (isNaN(from) || isNaN(to) || from > to) {
          toast.error(`Invalid range in ${stage} stage`);
          return false;
        }

        // Check Loop
        for (let i = from; i <= to; i++) {
          if (coveredUnits.has(i)) {
            toast.error(`Overlapping assignment in ${stage} stage at Unit ${i}`);
            return false;
          }
          coveredUnits.add(i);
        }
      }

      // Check for Gaps (Optional: Force 100% coverage?)
      // Let's enforce that if ANY assignment exists, SUM must equal Quantity? NO, split can be partial?
      // Requirement: "Total unitRange exactly equals total quantity"
      if (coveredUnits.size !== qty) {
        toast.error(`${stage} assignments cover ${coveredUnits.size} units, but Order Qty is ${qty}`);
        return false;
      }
    }
    return true;
  };

  // --- Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const qty = parseInt(formData.quantity);
    if (!qty || qty < 1) {
      toast.error("Invalid Quantity");
      setLoading(false);
      return;
    }

    if (!validateAssignments(qty)) {
      setLoading(false);
      return;
    }

    try {
      // Construct Payload
      const payload = {
        ...formData,
        quantity: qty,
        ratedPrimaryCurrent: Number(formData.ratedPrimaryCurrent),
        ratedSecondaryCurrent: Number(formData.ratedSecondaryCurrent),
        noOfCores: Number(formData.noOfCores),
        deadline: formData.deadline || new Date().toISOString(), // Fallback

        // Critical: The Assignments
        assignments: assignments.map(a => ({
          testerName: a.testerName,
          stage: a.stage,
          unitRange: {
            from: Number(a.unitRange.from),
            to: Number(a.unitRange.to)
          },
          status: "Assigned"
        })),

        bypassApproval: true, // AUTO-APPROVE

        // Default core config (Simplified for this demo, usually user picks this)
        coreDetails: coreConfigs,

        // Ratio logic (split by comma)
        ratio: formData.ratio ? formData.ratio.split(',').map(r => r.trim()).filter(Boolean) : []
      };

      const res = await axios.post('http://localhost:3002/api/create-order', payload);

      if (res.data.success) {
        toast.success(`Order ${res.data.jobId} Created & ${qty} Units Generated!`);
        // Reset
        setAssignments([]);
        setFormData({
          clientName: '',
          clientContactNo: '',
          transformerName: '',
          transformerType: '',
          quantity: '',
          deadline: '',
          priority: 'Medium',
          specifications: '',
          noOfCores: '1',
          ratedPrimaryCurrent: '',
          ratedSecondaryCurrent: '1',
          mountingDetails: '',
          overallDimension: '',
          isStandard: 'Standard',
          ratio: ''
        });
        setCoreConfigs([{ coreType: 'Metering' }]);
      }

    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <div>
        <h2>Create New Order</h2>
        <p className="text-gray-500 mt-1">Admin Entry - Automatically generates units & assigns testers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <Card className="p-6 lg:col-span-2 space-y-8">

          {/* 1. Client & Basic Info */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-red-600" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Client Name *</Label>
                <Input
                  value={formData.clientName}
                  onChange={e => handleInputChange('clientName', e.target.value)}
                  placeholder="e.g. Adani Power"
                />
              </div>
              <div>
                <Label>Contact No.</Label>
                <Input
                  value={formData.clientContactNo}
                  onChange={e => handleInputChange('clientContactNo', e.target.value)}
                  placeholder="+91..."
                />
              </div>
              <div>
                <Label>Transformer Name</Label>
                <Input
                  value={formData.transformerName}
                  onChange={e => handleInputChange('transformerName', e.target.value)}
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={formData.transformerType}
                  onValueChange={(v: string) => handleInputChange('transformerType', v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CT">Current Transformer (CT)</SelectItem>
                    <SelectItem value="PT">Potential Transformer (PT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* 2. Technical Specs */}
          <section>
            <h3 className="text-lg font-semibold mb-4">Technical Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={e => handleInputChange('quantity', e.target.value)}
                  className="font-bold text-red-600"
                />
              </div>
              <div>
                <Label>No. of Cores</Label>
                <Select
                  value={String(formData.noOfCores)}
                  onValueChange={(v: string) => handleInputChange('noOfCores', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic Core Config Inputs */}
              {coreConfigs.map((config, idx) => (
                <div key={idx} className="border p-2 rounded bg-gray-50">
                  <Label className="text-xs text-gray-500 font-semibold uppercase mb-1 block">Core {idx + 1} Type</Label>
                  <Select
                    value={config.coreType}
                    onValueChange={(v: string) => handleCoreConfigChange(idx, v)}
                  >
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Metering">Metering</SelectItem>
                      <SelectItem value="Protection">Protection</SelectItem>
                      <SelectItem value="PS">PS Class</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}

              <div>
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={e => handleInputChange('deadline', e.target.value)}
                />
              </div>
              {/* Simplified Specs */}
              <div><Label>Pri. Current</Label><Input value={formData.ratedPrimaryCurrent} onChange={e => handleInputChange('ratedPrimaryCurrent', e.target.value)} /></div>
              <div><Label>Sec. Current</Label><Input value={formData.ratedSecondaryCurrent} onChange={e => handleInputChange('ratedSecondaryCurrent', e.target.value)} /></div>
              <div>
                <Label>Ratio</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.ratio}
                    onChange={e => handleInputChange('ratio', e.target.value)}
                    placeholder="e.g. 100/1, 200/1"
                  />
                  <Select onValueChange={(v) => {
                    const current = formData.ratio ? formData.ratio + ', ' : '';
                    handleInputChange('ratio', current + v);
                  }}>
                    <SelectTrigger className="w-[120px]"><SelectValue placeholder="+ Preset" /></SelectTrigger>
                    <SelectContent>
                      {['100/1', '200/1', '400/1', '800/1'].map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Dimensions</Label><Input value={formData.overallDimension} onChange={e => handleInputChange('overallDimension', e.target.value)} /></div>
              <div><Label>Mounting</Label><Input value={formData.mountingDetails} onChange={e => handleInputChange('mountingDetails', e.target.value)} /></div>
              <div><Label>Standard?</Label><Input value={formData.isStandard} onChange={e => handleInputChange('isStandard', e.target.value)} /></div>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* 3. ASSIGNMENT SPLITTER */}
          <section className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Assignment Splitter
                </h3>
                <p className="text-xs text-gray-500">Split {formData.quantity || 0} units among testers.</p>
              </div>
            </div>

            <div className="space-y-6">
              {STAGES.map(stage => {
                const stageRows = assignments.filter(a => a.stage === stage);
                const unitsAssigned = stageRows.reduce((acc, curr) => {
                  const f = parseInt(curr.unitRange.from) || 0;
                  const t = parseInt(curr.unitRange.to) || 0;
                  return acc + (t >= f ? (t - f + 1) : 0);
                }, 0);
                const isFullyAssigned = parseInt(formData.quantity) > 0 && unitsAssigned === parseInt(formData.quantity);

                return (
                  <div key={stage} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="uppercase text-xs font-bold text-gray-400 tracking-wider text-green-700">{stage} STAGE</h4>
                      <div className={`text-xs px-2 py-0.5 rounded ${isFullyAssigned ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {unitsAssigned} / {formData.quantity || 0} Units Covered
                      </div>
                    </div>

                    {stageRows.length === 0 && (
                      <div className="text-center py-2 text-sm text-gray-400 italic">No testers assigned yet.</div>
                    )}

                    <div className="space-y-2">
                      {stageRows.map(row => (
                        <div key={row.id} className="flex gap-2 items-center">
                          <Select value={row.testerName} onValueChange={(v: string) => updateAssignment(row.id, 'testerName', v)}>
                            <SelectTrigger className="h-8 text-sm flex-1"><SelectValue placeholder="Select Tester" /></SelectTrigger>
                            <SelectContent>
                              {testers.map(t => <SelectItem key={t._id} value={t.fullName}>{t.fullName} ({t.department})</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400">Range:</span>
                            <Input
                              className="h-8 w-16 text-center"
                              placeholder="1"
                              value={row.unitRange.from}
                              onChange={e => updateAssignment(row.id, 'from', e.target.value)}
                            />
                            <span className="text-gray-400">-</span>
                            <Input
                              className="h-8 w-16 text-center"
                              placeholder={formData.quantity}
                              value={row.unitRange.to}
                              onChange={e => updateAssignment(row.id, 'to', e.target.value)}
                            />
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeAssignment(row.id)}>
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3 border-dashed text-gray-500 hover:text-blue-600"
                      onClick={() => addAssignmentRow(stage)}
                      type="button"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add Split
                    </Button>
                  </div>
                );
              })}
            </div>
          </section>

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-lg py-6"
          >
            {loading ? "Processing..." : "Create Order & Generate Units"}
          </Button>

        </Card>

        {/* Info Panel */}
        <div className="space-y-4">
          <Card className="p-4 bg-blue-50 border-blue-100">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="font-semibold text-blue-800">Automatic Generation</h4>
                <p className="text-sm text-blue-600 mt-1">
                  Clicking "Create Order" will immediately create <strong>{formData.quantity || 0} unique Transformer records</strong> in the database.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-semibold mb-2">Tester Availability</h4>
            <div className="space-y-2 text-sm">
              {testers.length === 0 ? <p className="text-gray-400">Loading testers...</p> : (
                testers.map(t => (
                  <div key={t._id} className="flex justify-between">
                    <span>{t.fullName}</span>
                    <span className="text-gray-400 text-xs">{t.department}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

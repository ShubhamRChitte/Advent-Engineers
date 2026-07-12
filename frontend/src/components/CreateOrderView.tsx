import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Package, Plus, Trash2, AlertCircle, User } from 'lucide-react';
import { toast } from 'sonner';
import axios from '@/utils/axiosConfig';

// --- Types ---
interface Tester {
  _id: string;
  fullName: string;
  designation: string;
  department: string;
}

interface Assignment {
  id: string; // temp id for UI key
  stage: 'core' | 'secondary' | 'primary' | 'final' | 'pt';
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
  const [step, setStep] = useState<1 | 2>(1);
  const [formErrors, setFormErrors] = useState<any>({});
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
    indoorOutdoor: '',
    insulationType: '',
    tankType: '',
    ratedPrimaryCurrent: '',
    ratedSecondaryCurrent: '1',
    voltageRating: '',
    ratio: '', // Added Ratio
    isStandard: ''
  });

  // Assignments State [ { id, stage, tester, range } ]
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [testers, setTesters] = useState<Tester[]>([]);
  const [loading, setLoading] = useState(false);

  // Dynamic Core Config State
  const [coreConfigs, setCoreConfigs] = useState<{ coreType: string; accuracyClass: string }[]>([{ coreType: 'Metering', accuracyClass: '' }]);
  const [isCustomVoltage, setIsCustomVoltage] = useState(false);
  const [isCustomSecCurrent, setIsCustomSecCurrent] = useState(false);

  // --- Initial Data Fetching ---
  useEffect(() => {
    const fetchTesters = async () => {
      try {
        const response = await axios.get('/auth/testers');
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

  // --- Real-Time Validation Engine ---
  const validateField = (field: string, value: string, currentData: any): string | null => {
    if (!value && typeof value === 'string') value = '';
    
    switch (field) {
      case 'clientName':
         return !value.trim() ? 'Client Name is required' : null;
      case 'clientContactNo':
         if (!value.trim()) return 'Contact No is required';
         if (!/^\\d{10}$/.test(value.trim())) return 'Contact No must be exactly 10 digits';
         return null;
      case 'transformerType':
         return !value ? 'Type is required' : null;
      case 'isStandard':
         return !value ? 'IS Standard is required' : null;
      case 'ratedPrimaryCurrent':
         return (currentData.transformerType === 'CT' && !value) ? 'Pri. Current is required for CT' : null;
      case 'quantity':
         return (!value || parseInt(value) < 1) ? 'Valid quantity required (>0)' : null;
      case 'deadline':
         return !value ? 'Deadline is required' : null;
      case 'ratedSecondaryCurrent':
         return !value ? 'Secondary Current is required' : null;
      case 'voltageRating':
         return !value ? 'Nominal System Voltage is required' : null;
      case 'ratio':
         return !value.trim() ? 'Ratio is required' : null;
      case 'indoorOutdoor':
         return !value ? 'Location is required' : null;
      case 'insulationType':
         return !value ? 'Insulation is required' : null;
      case 'tankType':
         return (currentData.insulationType === 'Oil Cooled' && !value) ? 'Tank Type is required' : null;
      default:
         return null;
    }
  };

  // --- Handlers ---
  const handleInputChange = (field: string, value: string) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);

    // Instant Validation Trigger
    const errorMsg = validateField(field, value, updatedData);
    if (errorMsg) {
      setFormErrors((prev: any) => ({ ...prev, [field]: errorMsg }));
    } else {
      setFormErrors((prev: any) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }

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

    // Special handling for changing Transformer Type
    if (field === 'transformerType' && value === 'PT') {
      // If switching to PT, ensure no existing 'PS' cores remain
      setCoreConfigs(prev => prev.map(config => 
        config.coreType === 'PS' ? { ...config, coreType: 'Metering', accuracyClass: '' } : config
      ));
    }
  };

  const handleCoreConfigChange = (index: number, newType: string) => {
    setCoreConfigs(prev => {
      const updated = [...prev];
      updated[index] = { coreType: newType, accuracyClass: '' };
      return updated;
    });

    // Evaluate dynamically
    if (!newType) setFormErrors((p: any) => ({...p, [`coreType_${index}`]: 'Core type required'}));
    else if (formData.transformerType === 'PT' && newType === 'PS') {
      setFormErrors((p: any) => ({...p, [`coreType_${index}`]: 'PS not allowed for PT'}));
    } else {
      setFormErrors((p: any) => { const next = {...p}; delete next[`coreType_${index}`]; return next; });
    }
  };

  const handleCoreAccuracyChange = (index: number, newAccuracy: string) => {
    setCoreConfigs(prev => {
      const updated = [...prev];
      updated[index] = { coreType: updated[index]?.coreType || '', accuracyClass: newAccuracy };
      return updated;
    });

    if (!newAccuracy) setFormErrors((p: any) => ({ ...p, [`accuracyClass_${index}`]: 'Class required' }));
    else setFormErrors((p: any) => { const next = {...p}; delete next[`accuracyClass_${index}`]; return next; });
  };

  // --- Assignment Logic ---
  const addAssignmentRow = (stage: string) => {
    const newRow: Assignment = {
      id: crypto.randomUUID(),
      stage: stage as any,
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
    const activeStages = formData.transformerType === 'PT' ? ['pt'] : STAGES;
    for (const stage of activeStages) {
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

  // --- Validation Logic ---
  const validateForm = () => {
    const errors: any = {};
    if (!formData.clientName.trim()) errors.clientName = 'Client Name is required';
    
    // Contact No check (10 digits)
    if (!formData.clientContactNo.trim()) {
      errors.clientContactNo = 'Contact No is required';
    } else if (!/^\\d{10}$/.test(formData.clientContactNo.trim())) {
      errors.clientContactNo = 'Contact No must be exactly 10 digits';
    }

    if (!formData.transformerType) errors.transformerType = 'Type is required';
    if (formData.transformerType && !formData.isStandard) errors.isStandard = 'IS Standard is required';
    
    if (formData.transformerType === 'CT' && !formData.ratedPrimaryCurrent) {
      errors.ratedPrimaryCurrent = 'Pri. Current is required for CT';
    }
    
    if (!formData.quantity || parseInt(formData.quantity) < 1) errors.quantity = 'Valid quantity required (>0)';
    if (!formData.deadline) errors.deadline = 'Deadline is required';
    if (!formData.ratedSecondaryCurrent) errors.ratedSecondaryCurrent = 'Secondary Current is required';
    if (!formData.voltageRating) errors.voltageRating = 'Nominal System Voltage is required';
    if (!formData.ratio.trim()) errors.ratio = 'Ratio is required';
    
    if (formData.transformerType) {
      if (!formData.indoorOutdoor) errors.indoorOutdoor = 'Location is required';
      if (!formData.insulationType) errors.insulationType = 'Insulation is required';
      if (formData.insulationType === 'Oil Cooled' && !formData.tankType) errors.tankType = 'Tank Type is required';
      
      // Core validation
      coreConfigs.forEach((config, idx) => {
        if (!config.coreType) errors[`coreType_${idx}`] = 'Core type required';
        if (config.coreType && !config.accuracyClass) errors[`accuracyClass_${idx}`] = 'Class required';
        if (formData.transformerType === 'PT' && config.coreType === 'PS') {
           errors[`coreType_${idx}`] = 'PS not allowed for PT';
        }
      });
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // --- Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!validateForm()) {
        toast.error("Please fix the validation errors before proceeding.");
        return;
      }
      setStep(2);
      toast.success("Parameters validated! Please assign testing responsibilities.");
      return;
    }

    setLoading(true);

    const qty = parseInt(formData.quantity);
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

      const res = await axios.post(`/create-order`, payload);

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
          indoorOutdoor: '',
          insulationType: '',
          tankType: '',
          ratedPrimaryCurrent: '',
          ratedSecondaryCurrent: '1',
          voltageRating: '',
          isStandard: '',
          ratio: ''
        });
        setIsCustomVoltage(false);
        setIsCustomSecCurrent(false);
        setCoreConfigs([{ coreType: 'Metering', accuracyClass: '' }]);
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
                <Label className={formErrors.clientName ? "text-red-600" : ""}>Client Name *</Label>
                <Input
                  value={formData.clientName}
                  onChange={e => handleInputChange('clientName', e.target.value)}
                  placeholder="e.g. Adani Power"
                  className={formErrors.clientName ? "border-red-500 bg-red-50 focus-visible:ring-red-500" : ""}
                />
                {formErrors.clientName && <span className="text-xs text-red-600 font-semibold">{formErrors.clientName}</span>}
              </div>
              <div>
                <Label className={formErrors.clientContactNo ? "text-red-600" : ""}>Contact No. (10 Digits) *</Label>
                <Input
                  value={formData.clientContactNo}
                  onChange={e => handleInputChange('clientContactNo', e.target.value)}
                  placeholder="e.g. 9876543210"
                  className={formErrors.clientContactNo ? "border-red-500 bg-red-50 focus-visible:ring-red-500" : ""}
                  maxLength={10}
                />
                {formErrors.clientContactNo && <span className="text-xs text-red-600 font-semibold">{formErrors.clientContactNo}</span>}
              </div>
              <div>
                <Label>Transformer Name (Optional)</Label>
                <Input
                  value={formData.transformerName}
                  onChange={e => handleInputChange('transformerName', e.target.value)}
                />
              </div>
              <div>
                <Label className={formErrors.transformerType ? "text-red-600" : ""}>Type *</Label>
                <Select
                  value={formData.transformerType}
                  onValueChange={(v: string) => {
                    handleInputChange('transformerType', v);
                    handleInputChange('isStandard', '');
                  }}
                >
                  <SelectTrigger className={formErrors.transformerType ? "border-red-500 bg-red-50" : ""}><SelectValue placeholder="Select Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CT">Current Transformer (CT)</SelectItem>
                    <SelectItem value="PT">Potential Transformer (PT)</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.transformerType && <span className="text-xs text-red-600 font-semibold">{formErrors.transformerType}</span>}
              </div>

              {formData.transformerType && (
                <div>
                  <Label className={formErrors.isStandard ? "text-red-600" : ""}>IS Standard *</Label>
                  <Select
                    value={formData.isStandard}
                    onValueChange={(v: string) => handleInputChange('isStandard', v)}
                  >
                    <SelectTrigger className={formErrors.isStandard ? "border-red-500 bg-red-50" : ""}><SelectValue placeholder="Select IS Standard" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="16227">16227</SelectItem>
                      {formData.transformerType === 'CT' && <SelectItem value="2705">2705</SelectItem>}
                      {formData.transformerType === 'PT' && <SelectItem value="3156">3156</SelectItem>}
                    </SelectContent>
                  </Select>
                  {formErrors.isStandard && <span className="text-xs text-red-600 font-semibold">{formErrors.isStandard}</span>}
                </div>
              )}
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* 2. Technical Specs */}
          <section>
            <h3 className="text-lg font-semibold mb-4">Technical Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className={formErrors.quantity ? "text-red-600" : ""}>Quantity *</Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={e => handleInputChange('quantity', e.target.value)}
                  className={`font-bold ${formErrors.quantity ? "text-red-600 border-red-500 bg-red-50 focus-visible:ring-red-500" : "text-red-600"}`}
                />
                {formErrors.quantity && <span className="text-xs text-red-600 font-semibold">{formErrors.quantity}</span>}
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

              {coreConfigs.map((config, idx) => (
                <div key={idx} className={`border p-2 rounded flex flex-col gap-2 ${formErrors[`coreType_${idx}`] || formErrors[`accuracyClass_${idx}`] ? 'border-red-400 bg-red-50' : 'bg-gray-50'}`}>
                  <div>
                    <Label className="text-xs text-gray-500 font-semibold uppercase mb-1 block">Core {idx + 1} Type</Label>
                    <Select
                      value={config.coreType}
                      onValueChange={(v: string) => {
                        handleCoreConfigChange(idx, v);
                        if (formErrors[`coreType_${idx}`]) setFormErrors((prev: any) => ({ ...prev, [`coreType_${idx}`]: '' }));
                      }}
                    >
                      <SelectTrigger className={`h-8 ${formErrors[`coreType_${idx}`] ? "border-red-500" : ""}`}><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Metering">Metering</SelectItem>
                        <SelectItem value="Protection">Protection</SelectItem>
                        {formData.transformerType !== 'PT' && (
                          <SelectItem value="PS">PS Class</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {formErrors[`coreType_${idx}`] && <span className="text-xs text-red-600 font-semibold">{formErrors[`coreType_${idx}`]}</span>}
                  </div>
                  {config.coreType && (
                    <div>
                      <Label className="text-xs text-gray-500 font-semibold uppercase mb-1 block">Accuracy Class</Label>
                      <Select
                        value={config.accuracyClass}
                        onValueChange={(v: string) => {
                          handleCoreAccuracyChange(idx, v);
                          if (formErrors[`accuracyClass_${idx}`]) setFormErrors((prev: any) => ({ ...prev, [`accuracyClass_${idx}`]: '' }));
                        }}
                      >
                        <SelectTrigger className={`h-8 ${formErrors[`accuracyClass_${idx}`] ? "border-red-500" : ""}`}><SelectValue placeholder="Select Class" /></SelectTrigger>
                        <SelectContent>
                          {config.coreType === 'Metering' && (
                            formData.transformerType === 'PT' ? (
                              <>
                                <SelectItem value="0.1">0.1</SelectItem>
                                <SelectItem value="0.2">0.2</SelectItem>
                                <SelectItem value="0.5">0.5</SelectItem>
                                <SelectItem value="1">1</SelectItem>
                                <SelectItem value="3">3</SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="0.1">0.1</SelectItem>
                                <SelectItem value="0.2">0.2</SelectItem>
                                <SelectItem value="0.5">0.5</SelectItem>
                                <SelectItem value="1">1</SelectItem>
                                <SelectItem value="3">3</SelectItem>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="0.2s">0.2s</SelectItem>
                                <SelectItem value="0.5s">0.5s</SelectItem>
                              </>
                            )
                          )}
                          {config.coreType === 'Protection' && (
                            formData.transformerType === 'PT' ? (
                              <>
                                <SelectItem value="3P">3P</SelectItem>
                                <SelectItem value="6P">6P</SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="5P">5P</SelectItem>
                                <SelectItem value="10P">10P</SelectItem>
                                <SelectItem value="15P">15P</SelectItem>
                              </>
                            )
                          )}
                          {config.coreType === 'PS' && formData.transformerType !== 'PT' && (
                            <SelectItem value="0.2s">0.2s</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              ))}

              <div>
                <Label className={formErrors.deadline ? "text-red-600" : ""}>Deadline *</Label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={e => handleInputChange('deadline', e.target.value)}
                  className={formErrors.deadline ? "border-red-500 bg-red-50" : ""}
                />
                {formErrors.deadline && <span className="text-xs text-red-600 font-semibold">{formErrors.deadline}</span>}
              </div>
              {/* Simplified Specs */}
              {formData.transformerType === 'CT' && (
                <div>
                  <Label className={formErrors.ratedPrimaryCurrent ? "text-red-600" : ""}>Pri. Current *</Label>
                  <Input 
                    value={formData.ratedPrimaryCurrent} 
                    onChange={e => handleInputChange('ratedPrimaryCurrent', e.target.value)} 
                    className={formErrors.ratedPrimaryCurrent ? "border-red-500 bg-red-50" : ""}
                  />
                  {formErrors.ratedPrimaryCurrent && <span className="text-xs text-red-600 font-semibold">{formErrors.ratedPrimaryCurrent}</span>}
                </div>
              )}

              <div>
                <Label className={formErrors.ratedSecondaryCurrent ? "text-red-600" : ""}>Sec. Current *</Label>
                <div className="flex gap-2">
                  <Select
                    value={!isCustomSecCurrent ? formData.ratedSecondaryCurrent : 'Custom'}
                    onValueChange={(v: string) => {
                      if (v === 'Custom') {
                        setIsCustomSecCurrent(true);
                        handleInputChange('ratedSecondaryCurrent', '');
                      } else {
                        setIsCustomSecCurrent(false);
                        handleInputChange('ratedSecondaryCurrent', v);
                      }
                    }}
                  >
                    <SelectTrigger className={`w-full ${formErrors.ratedSecondaryCurrent ? "border-red-500 bg-red-50" : ""}`}><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  {isCustomSecCurrent && (
                    <Input
                      placeholder="Custom Value"
                      value={formData.ratedSecondaryCurrent}
                      onChange={e => handleInputChange('ratedSecondaryCurrent', e.target.value)}
                    />
                  )}
                </div>
              </div>

              <div>
                <Label className={formErrors.voltageRating ? "text-red-600" : ""}>Nominal System Voltage *</Label>
                <div className="flex gap-2">
                  <Select
                    value={!isCustomVoltage ? formData.voltageRating : 'Custom'}
                    onValueChange={(v: string) => {
                      if (v === 'Custom') {
                        setIsCustomVoltage(true);
                        handleInputChange('voltageRating', '');
                      } else {
                        setIsCustomVoltage(false);
                        handleInputChange('voltageRating', v);
                      }
                    }}
                  >
                    <SelectTrigger className={`w-full ${formErrors.voltageRating ? "border-red-500 bg-red-50" : ""}`}><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="11">11</SelectItem>
                      <SelectItem value="22">22</SelectItem>
                      <SelectItem value="33">33</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  {isCustomVoltage && (
                    <Input
                      placeholder="Custom Value"
                      value={formData.voltageRating}
                      onChange={e => handleInputChange('voltageRating', e.target.value)}
                    />
                  )}
                </div>
              </div>
              <div>
                <Label className={formErrors.ratio ? "text-red-600" : ""}>Ratio *</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.ratio}
                    onChange={e => handleInputChange('ratio', e.target.value)}
                    placeholder="e.g. 100/1, 200/1"
                    className={formErrors.ratio ? "border-red-500 bg-red-50 focus-visible:ring-red-500" : ""}
                  />
                  <Select onValueChange={(v: string) => {
                    const current = formData.ratio ? formData.ratio + ', ' : '';
                    handleInputChange('ratio', current + v);
                  }}>
                    <SelectTrigger className={`w-[120px] ${formErrors.ratio ? "border-red-500 bg-red-50" : ""}`}><SelectValue placeholder="+ Preset" /></SelectTrigger>
                    <SelectContent>
                      {['100/1', '200/1', '400/1', '800/1'].map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formData.transformerType && (
                <>
                  <div>
                    <Label className={formErrors.indoorOutdoor ? "text-red-600" : ""}>Indoor/Outdoor *</Label>
                    <Select value={formData.indoorOutdoor} onValueChange={(v: string) => handleInputChange('indoorOutdoor', v)}>
                      <SelectTrigger className={formErrors.indoorOutdoor ? "border-red-500 bg-red-50" : ""}><SelectValue placeholder="Select location" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Indoor">Indoor</SelectItem>
                        <SelectItem value="Outdoor">Outdoor</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.indoorOutdoor && <span className="text-xs text-red-600 font-semibold">{formErrors.indoorOutdoor}</span>}
                  </div>
                  <div>
                    <Label className={formErrors.insulationType ? "text-red-600" : ""}>Insulation Type *</Label>
                    <Select value={formData.insulationType} onValueChange={(v: string) => handleInputChange('insulationType', v)}>
                      <SelectTrigger className={formErrors.insulationType ? "border-red-500 bg-red-50" : ""}><SelectValue placeholder="Select insulation" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Oil Cooled">Oil Cooled</SelectItem>
                        <SelectItem value="Epoxy">Epoxy</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.insulationType && <span className="text-xs text-red-600 font-semibold">{formErrors.insulationType}</span>}
                  </div>
                  {formData.insulationType === 'Oil Cooled' && (
                    <div>
                      <Label className={formErrors.tankType ? "text-red-600" : ""}>Tank Type *</Label>
                      <Select value={formData.tankType} onValueChange={(v: string) => handleInputChange('tankType', v)}>
                        <SelectTrigger className={formErrors.tankType ? "border-red-500 bg-red-50" : ""}><SelectValue placeholder="Select tank type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Live Tank">Live Tank</SelectItem>
                          <SelectItem value="Dead Tank">Dead Tank</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}

            </div>
          </section>

          <hr className="border-gray-100" />

          {/* 3. ASSIGNMENT SPLITTER */}
          {step === 2 && (
            <section className="bg-gray-50 p-4 rounded-xl border border-gray-200 animate-in fade-in duration-300">
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
              {(formData.transformerType === 'PT' ? ['pt'] : STAGES).map(stage => {
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
                      <div className="text-center py-2 text-sm text-gray-400 italic">No testing engineers assigned yet.</div>
                    )}

                    <div className="space-y-2">
                      {stageRows.map(row => (
                        <div key={row.id} className="flex gap-2 items-center">
                          <Select value={row.testerName} onValueChange={(v: string) => updateAssignment(row.id, 'testerName', v)}>
                            <SelectTrigger className="h-8 text-sm flex-1"><SelectValue placeholder="Select Tester" /></SelectTrigger>
                            <SelectContent>
                              {testers
                                .filter(t => formData.transformerType === 'PT' ? t.department === 'PT Test' : t.department !== 'PT Test')
                                .map(t => <SelectItem key={t._id} value={t.fullName}>{t.fullName} ({t.department})</SelectItem>)}
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
          )}

          <div className="flex gap-4">
            {step === 2 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="w-1/3 py-6 text-lg border-gray-300"
              >
                Back to Edit Parameters
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className={`flex-1 hover:bg-red-700 text-lg py-6 transition-colors ${step === 1 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600'}`}
            >
              {loading ? "Processing..." : step === 1 ? "Verify & Continue to Assignments" : "Create Order & Generate Units"}
            </Button>
          </div>

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
            <h4 className="font-semibold mb-2">Testing Engineer Availability</h4>
            <div className="space-y-2 text-sm">
              {testers.length === 0 ? <p className="text-gray-400">Loading testing engineers...</p> : (
                testers
                  .filter(t => formData.transformerType === 'PT' ? t.department === 'PT Test' : t.department !== 'PT Test')
                  .map(t => (
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

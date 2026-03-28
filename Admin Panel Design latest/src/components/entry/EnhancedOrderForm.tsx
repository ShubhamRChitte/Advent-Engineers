import { useState } from 'react';
import { toast } from 'sonner';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
<<<<<<< HEAD
import { X, Plus, Upload, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

=======
import { X, Plus, Upload, ArrowLeft, Search, Check } from 'lucide-react';
import { Badge } from '../ui/badge';
>>>>>>> a717da7c73aab67316ddb59441b8b8f9504f8170
interface Transformer {
  id: string;
  name: string;
  type: string;
  voltageRating: string;
  cores: number;
  phase: string;
  serialNumber: string;
}

interface AdditionalParameter {
  id: string;
  name: string;
  value: string;
}

interface EnhancedOrderFormProps {
  transformer: Transformer;
  allVendors: any[];
  onSubmit: (orderData: any) => void;
  onBack: () => void;
}

export function EnhancedOrderForm({ transformer, allVendors, onSubmit, onBack, isEntryOperator = false }: EnhancedOrderFormProps & { isEntryOperator?: boolean }) {
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isStandard, setIsStandard] = useState('');

  // Initialize from transformer prop if available, else empty
  const transformerName = transformer?.name || 'Custom Transformer';
  const [transformerType, setTransformerType] = useState(transformer?.type || '');
  const [numberOfCores, setNumberOfCores] = useState(transformer?.cores.toString() || '1');
  const [voltageRating, setVoltageRating] = useState(transformer?.voltageRating || '');
  const [isCustomVoltage, setIsCustomVoltage] = useState(false);
  const [isCustomSecCurrent, setIsCustomSecCurrent] = useState(false);


  const [indoorOutdoor, setIndoorOutdoor] = useState('');
  const [insulationType, setInsulationType] = useState('');
  const [tankType, setTankType] = useState('');

  // Core configurations
  const [coreConfigs, setCoreConfigs] = useState<{ coreType: string; accuracyClass: string; vendorNo: string }[]>(
    Array(parseInt(numberOfCores) || 1).fill({ coreType: 'metering', accuracyClass: '', vendorNo: '' })
  );

  // Transformer Parameters
  const [ratios, setRatios] = useState<string[]>([]);
  const [isCustomRatio, setIsCustomRatio] = useState(false);
  const [customRatioInput, setCustomRatioInput] = useState('');
  const [nominalVoltage, setNominalVoltage] = useState('');
  const [burden, setBurden] = useState('');
  const [ratedPrimaryCurrent, setRatedPrimaryCurrent] = useState('');
  const [ratedSecondaryCurrent, setRatedSecondaryCurrent] = useState('');
  const [stc, setStc] = useState('');

  // Additional parameters
  const [additionalParams, setAdditionalParams] = useState<AdditionalParameter[]>([]);

  // Images state
  const [images, setImages] = useState<File[]>([]);

  const [selectedMeteringVendors, setSelectedMeteringVendors] = useState<string[]>([]);
  const [selectedProtectionVendors, setSelectedProtectionVendors] = useState<string[]>([]);
  const [selectedPSVendors, setSelectedPSVendors] = useState<string[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Store actual File objects
    setImages(prev => [...prev, ...Array.from(files)]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCoreTypeChange = (index: number, value: string) => {
    setCoreConfigs(prev => {
      const updated = [...prev];
      updated[index] = { coreType: value, accuracyClass: '', vendorNo: '' }; // reset on type change
      return updated;
    });
  };

  const handleCoreAccuracyChange = (index: number, value: string) => {
    setCoreConfigs(prev => {
      const updated = [...prev];
      const current = updated[index];
      if (current) {
        updated[index] = { ...current, accuracyClass: value };
      }
      return updated;
    });
  };

  const handleCoreVendorChange = (index: number, value: string) => {
    setCoreConfigs(prev => {
      const updated = [...prev];
      const current = updated[index];
      if (current) {
        updated[index] = { ...current, vendorNo: value };
      }
      return updated;
    });
  };

  const handleAddRatio = (value: string) => {
    if (value && !ratios.includes(value)) {
      setRatios([...ratios, value]);
    }
  };

  const handleRemoveRatio = (value: string) => {
    setRatios(ratios.filter(r => r !== value));
  };

  const handleAddParameter = () => {
    const newParam: AdditionalParameter = {
      id: Date.now().toString(),
      name: '',
      value: '',
    };
    setAdditionalParams([...additionalParams, newParam]);
  };

  const handleRemoveParameter = (id: string) => {
    setAdditionalParams(additionalParams.filter((p) => p.id !== id));
  };

  const handleParameterChange = (id: string, field: 'name' | 'value', value: string) => {
    setAdditionalParams(
      additionalParams.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleSubmit = () => {
    if (transformerType === 'PT') {
      const hasPSCore = coreConfigs.some(c => c.coreType === 'ps');
      if (hasPSCore) {
        toast.error("PS Class cores are not allowed for PT Transformers.");
        return;
      }
    }

    const orderData = {
      orderId: `ORD-${Date.now()}`,
      orderDate: new Date().toLocaleDateString(),
      clientName,
      clientContact,
      transformerName, // Use state
      transformerType, // Use state
      quantity: parseInt(quantity),
      voltageRating,  // Added
      ratio: ratios,  // Changed to Array
      isStandard,
      indoorOutdoor,
      insulationType,
      tankType,
      numberOfCores: parseInt(numberOfCores),
      coreConfigs,
      parameters: {
        nominalVoltage,
        burden,
        ratedPrimaryCurrent,
        ratedSecondaryCurrent,
        stc,
      },
      additionalParams,
      images,
      metering_core_vendors: selectedMeteringVendors,
      protection_core_vendors: selectedProtectionVendors,
      ps_core_vendors: selectedPSVendors,
      bypassApproval: !isEntryOperator, // If Entry Operator, do NOT bypass approval
    };

    // Validation
    const hasMetering = coreConfigs.some(c => c.coreType === 'metering');
    const hasProtection = coreConfigs.some(c => c.coreType === 'protection');
    const hasPS = coreConfigs.some(c => c.coreType === 'ps');

    if (hasMetering && selectedMeteringVendors.length === 0) {
      toast.error("At least one Metering vendor is required");
      return;
    }
    if (hasProtection && selectedProtectionVendors.length === 0) {
      toast.error("At least one Protection vendor is required");
      return;
    }
    if (hasPS && selectedPSVendors.length === 0) {
      toast.error("At least one PS vendor is required");
      return;
    }

    onSubmit(orderData);
  };

  const coresArray = Array.from({ length: parseInt(numberOfCores) || 0 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to List
        </Button>
      </div>

      <div>
        <h2>Order Form - Transformer Details</h2>
        <p className="text-gray-500 mt-1">Complete all required information for the order</p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          {/* Selected Transformer Display OR Manual Entry */}
          {transformer ? (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Selected Transformer</p>
              <h3 className="mb-1">{transformer.name}</h3>
              <div className="flex gap-4 text-sm text-gray-600 mt-2">
                <span>Type: {transformer.type}</span>
                <span>•</span>
                <span>Voltage: {transformer.voltageRating}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4 border-b-2 border-gray-200 pb-6">
              <h3 className="font-semibold mb-4  text-blue-700">Transformer Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <Label>Type *</Label>
                  <select
                    value={transformerType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setTransformerType(newType);
                      setIsStandard(''); // Reset standard on type change
                      
                      if(newType === 'PT') {
                         setCoreConfigs(prev => prev.map(config => 
                           config.coreType === 'ps' ? { ...config, coreType: 'metering', accuracyClass: '' } : config
                         ));
                      }
                    }}
                    className="w-full mt-1 h-10 px-3 rounded-md border border-gray-300 bg-white"
                  >
                    <option value="">Select Type</option>
                    <option value="CT">Current Transformer (CT)</option>
                    <option value="PT">Potential Transformer (PT)</option>
                  </select>
                {transformerType && (
                  <div>
                    <Label>IS Standard *</Label>
                    <select
                      value={isStandard}
                      onChange={(e) => setIsStandard(e.target.value)}
                      className="w-full mt-1 h-10 px-3 rounded-md border border-gray-300 bg-white"
                    >
                      <option value="">Select IS Standard</option>
                      <option value="16227">16227</option>
                      {transformerType === 'CT' && <option value="2705">2705</option>}
                      {transformerType === 'PT' && <option value="3156">3156</option>}
                    </select>
                  </div>
                )}
                {transformerType && (
                  <>
                    <div>
                      <Label>Indoor/Outdoor</Label>
                      <select
                        value={indoorOutdoor}
                        onChange={(e) => setIndoorOutdoor(e.target.value)}
                        className="w-full mt-1 h-10 px-3 rounded-md border border-gray-300 bg-white"
                      >
                        <option value="">Select location</option>
                        <option value="Indoor">Indoor</option>
                        <option value="Outdoor">Outdoor</option>
                      </select>
                    </div>
                    <div>
                      <Label>Insulation Type</Label>
                      <select
                        value={insulationType}
                        onChange={(e) => setInsulationType(e.target.value)}
                        className="w-full mt-1 h-10 px-3 rounded-md border border-gray-300 bg-white"
                      >
                        <option value="">Select insulation</option>
                        <option value="Oil Cooled">Oil Cooled</option>
                        <option value="Epoxy">Epoxy</option>
                      </select>
                    </div>
                    {insulationType === 'Oil Cooled' && (
                      <div>
                        <Label>Tank Type</Label>
                        <select
                          value={tankType}
                          onChange={(e) => setTankType(e.target.value)}
                          className="w-full mt-1 h-10 px-3 rounded-md border border-gray-300 bg-white"
                        >
                          <option value="">Select tank type</option>
                          <option value="Live Tank">Live Tank</option>
                          <option value="Dead Tank">Dead Tank</option>
                        </select>
                      </div>
                    )}
                  </>
                )}
                <div>
                  <Label>Voltage Rating</Label>
                  <div className="flex gap-2">
                    <select
                      value={!isCustomVoltage ? voltageRating : 'Custom'}
                      onChange={(e) => {
                        if (e.target.value === 'Custom') {
                          setIsCustomVoltage(true);
                          setVoltageRating('');
                        } else {
                          setIsCustomVoltage(false);
                          setVoltageRating(e.target.value);
                        }
                      }}
                      className="w-full mt-1 h-10 px-3 rounded-md border border-gray-300 bg-white"
                    >
                      <option value="">Select Voltage</option>
                      <option value="11">11</option>
                      <option value="22">22</option>
                      <option value="33">33</option>
                      <option value="Custom">Custom...</option>
                    </select>
                    {isCustomVoltage && (
                      <Input
                        className="mt-1"
                        placeholder="Custom Voltage"
                        value={voltageRating}
                        onChange={e => setVoltageRating(e.target.value)}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Client Details Section */}
          <div className="space-y-4">
            <h3 className="pb-2 border-b-2 border-gray-200">Client Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Client Name *</Label>
                <Input
                  placeholder="Enter client name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Client Contact Number *</Label>
                <Input
                  placeholder="Enter contact number"
                  value={clientContact}
                  onChange={(e) => setClientContact(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Order Details Section */}
          <div className="space-y-4">
            <h3 className="pb-2 border-b-2 border-gray-200">Order Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Enter quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Number of Cores *</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  placeholder="Number of cores"
                  value={numberOfCores}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNumberOfCores(value);
                    const numCores = parseInt(value) || 0;
                    setCoreConfigs(prev => {
                      const newTypes = Array.isArray(prev) ? [...prev] : [];
                      if (numCores > newTypes.length) {
                        return [...newTypes, ...Array(numCores - newTypes.length).fill({ coreType: 'metering', accuracyClass: '', vendorNo: '' })];
                      }
                      return newTypes.slice(0, numCores);
                    });
                  }}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Core Configuration - Show if cores >= 1 */}
          {parseInt(numberOfCores) > 0 && (
            <div className="space-y-4">
              <h3 className="pb-2 border-b-2 border-gray-200">Core Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coresArray.map((_, index) => (
                  <div key={index} className="flex flex-col gap-2">
                    <Label>Core {index + 1} Type *</Label>
                    <select
                      value={coreConfigs[index]?.coreType || 'metering'}
                      onChange={(e) => handleCoreTypeChange(index, e.target.value)}
                      className="w-full mt-1 h-10 px-3 rounded-md border border-gray-300 bg-white"
                    >
                      <option value="metering">Metering</option>
                      {transformerType !== 'PT' && <option value="ps">PS</option>}
                      <option value="protection">Protection</option>
                    </select>

                    {coreConfigs[index]?.coreType && (
                      <div className="mt-2 space-y-2">
                        <div>
                          <Label>Accuracy Class</Label>
                          <select
                            value={coreConfigs[index]?.accuracyClass || ''}
                            onChange={(e) => handleCoreAccuracyChange(index, e.target.value)}
                            className="w-full mt-1 h-10 px-3 rounded-md border border-gray-300 bg-white"
                          >
                            <option value="">Select Accuracy Class</option>
                            {coreConfigs[index].coreType === 'metering' && (
                              <>
                                <option value="0.1">0.1</option>
                                <option value="0.2">0.2</option>
                                <option value="0.5">0.5</option>
                                <option value="1">1</option>
                                <option value="3">3</option>
                                <option value="5">5</option>
                                <option value="0.2s">0.2s</option>
                                <option value="0.5s">0.5s</option>
                              </>
                            )}
                            {coreConfigs[index].coreType === 'protection' && (
                              <>
                                <option value="5P">5P</option>
                                <option value="10P">10P</option>
                                <option value="15P">15P</option>
                              </>
                            )}
                            {coreConfigs[index].coreType === 'ps' && (
                              <option value="0.2s">0.2s</option>
<<<<<<< HEAD
                              <option value="0.5s">0.5s</option>
                            </>
                          )}
                          {coreConfigs[index].coreType === 'protection' && (
                            <>
                              <option value="5P">5P</option>
                              <option value="10P">10P</option>
                              <option value="15P">15P</option>
                            </>
                          )}
                          {coreConfigs[index].coreType === 'ps' && transformerType !== 'PT' && (
                            <option value="0.2s">0.2s</option>
                          )}
                        </select>
=======
                            )}
                          </select>
                        </div>

                        <div>
                          <Label>Core Vendor *</Label>
                          <select
                            value={coreConfigs[index]?.vendorNo || ''}
                            onChange={(e) => handleCoreVendorChange(index, e.target.value)}
                            className="w-full mt-1 h-10 px-3 rounded-md border border-gray-300 bg-white"
                          >
                            <option value="">Select Vendor</option>
                            {(() => {
                              const type = coreConfigs[index].coreType;
                              const selectedIds = type === 'metering' ? selectedMeteringVendors :
                                type === 'protection' ? selectedProtectionVendors :
                                  selectedPSVendors;

                              return allVendors
                                .filter(v => selectedIds.includes(v._id))
                                .map(v => (
                                  <option key={v._id} value={v.vendor_no}>
                                    {v.vendor_no} - {v.vendor_name}
                                  </option>
                                ));
                            })()}
                          </select>
                        </div>
>>>>>>> a717da7c73aab67316ddb59441b8b8f9504f8170
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Core Vendors Section */}
          <div className="space-y-4">
            <h3 className="pb-2 border-b-2 border-gray-200">Core Vendors</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {coreConfigs.some(c => c.coreType === 'metering') && (
                <div className="space-y-2">
                  <Label className="text-blue-700 font-bold">Metering Core Vendors *</Label>
                  <VendorMultiSelect
                    vendors={allVendors}
                    selectedIds={selectedMeteringVendors}
                    onChange={setSelectedMeteringVendors}
                    placeholder="Select Metering Vendors"
                  />
                </div>
              )}
              {coreConfigs.some(c => c.coreType === 'protection') && (
                <div className="space-y-2">
                  <Label className="text-green-700 font-bold">Protection Core Vendors *</Label>
                  <VendorMultiSelect
                    vendors={allVendors}
                    selectedIds={selectedProtectionVendors}
                    onChange={setSelectedProtectionVendors}
                    placeholder="Select Protection Vendors"
                  />
                </div>
              )}
              {coreConfigs.some(c => c.coreType === 'ps') && (
                <div className="space-y-2">
                  <Label className="text-purple-700 font-bold">PS Core Vendors *</Label>
                  <VendorMultiSelect
                    vendors={allVendors}
                    selectedIds={selectedPSVendors}
                    onChange={setSelectedPSVendors}
                    placeholder="Select PS Vendors"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Transformer Parameters Section */}
          <div className="space-y-4">
            <h3 className="pb-2 border-b-2 border-gray-200">Transformer Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Ratio *</Label>
                <div className="space-y-2">
                  {/* Selected Tags */}
                  <div className="flex flex-wrap gap-2">
                    {ratios.map(r => (
                      <span key={r} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        {r}
                        <button onClick={() => handleRemoveRatio(r)} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>

                  {/* Selection Controls */}
                  <div className="flex gap-2">
                    {!isCustomRatio ? (
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value === 'custom') setIsCustomRatio(true);
                          else if (e.target.value) handleAddRatio(e.target.value);
                        }}
                        className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                      >
                        <option value="">Add Ratio...</option>
                        <option value="200/1">200/1</option>
                        <option value="400/1">400/1</option>
                        <option value="800/1">800/1</option>
                        <option value="200/5">200/5</option>
                        <option value="400/5">400/5</option>
                        <option value="800/5">800/5</option>
                        <option value="custom">Custom...</option>
                      </select>
                    ) : (
                      <div className="flex gap-2 w-full">
                        <Input
                          autoFocus
                          placeholder="Enter ratio"
                          value={customRatioInput}
                          onChange={(e) => setCustomRatioInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (customRatioInput.trim()) {
                                handleAddRatio(customRatioInput);
                                setCustomRatioInput('');
                                setIsCustomRatio(false);
                              }
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (customRatioInput.trim()) {
                              handleAddRatio(customRatioInput);
                              setCustomRatioInput('');
                              setIsCustomRatio(false);
                            }
                          }}
                        >
                          Add
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setIsCustomRatio(false); setCustomRatioInput(''); }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <Label>Nominal System Voltage</Label>
                <Input
                  placeholder="e.g., 33 kV"
                  value={nominalVoltage}
                  onChange={(e) => setNominalVoltage(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Burden</Label>
                <Input
                  placeholder="e.g., 15 VA"
                  value={burden}
                  onChange={(e) => setBurden(e.target.value)}
                  className="mt-1"
                />
              </div>
              {transformerType === 'CT' && (
                <div>
                  <Label>Rated Primary Current</Label>
                  <Input
                    placeholder="e.g., 200 A"
                    value={ratedPrimaryCurrent}
                    onChange={(e) => setRatedPrimaryCurrent(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
              <div>
                <Label>Rated Secondary Current</Label>
                <div className="flex gap-2">
                  <select
                    value={!isCustomSecCurrent ? ratedSecondaryCurrent : 'Custom'}
                    onChange={(e) => {
                      if (e.target.value === 'Custom') {
                        setIsCustomSecCurrent(true);
                        setRatedSecondaryCurrent('');
                      } else {
                        setIsCustomSecCurrent(false);
                        setRatedSecondaryCurrent(e.target.value);
                      }
                    }}
                    className="w-full mt-1 h-10 px-3 rounded-md border border-gray-300 bg-white"
                  >
                    <option value="">Select Sec. Current</option>
                    <option value="1">1</option>
                    <option value="5">5</option>
                    <option value="Custom">Custom...</option>
                  </select>
                  {isCustomSecCurrent && (
                    <Input
                      className="mt-1"
                      placeholder="Custom Value"
                      value={ratedSecondaryCurrent}
                      onChange={e => setRatedSecondaryCurrent(e.target.value)}
                    />
                  )}
                </div>
              </div>
              <div>
                <Label>STC (Short Time Current)</Label>
                <Input
                  placeholder="e.g., 25kA/1sec"
                  value={stc}
                  onChange={(e) => setStc(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Additional Parameters Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-gray-200">
              <h3>Additional Parameters</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddParameter}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add More Parameters
              </Button>
            </div>

            {additionalParams.length > 0 && (
              <div className="space-y-3">
                {additionalParams.map((param) => (
                  <div key={param.id} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <Input
                        placeholder="Parameter name"
                        value={param.name}
                        onChange={(e) =>
                          handleParameterChange(param.id, 'name', e.target.value)
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder="Value"
                        value={param.value}
                        onChange={(e) =>
                          handleParameterChange(param.id, 'value', e.target.value)
                        }
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveParameter(param.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload Image Section */}
          <div className="space-y-4">
            <h3 className="pb-2 border-b-2 border-gray-200">Upload Images</h3>
            <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer block">
              <input type="file" multiple accept="image/*,.pdf" className="hidden" onChange={handleImageUpload} />
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF up to 10MB</p>
            </label>
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group border rounded-lg overflow-hidden h-32 flex items-center justify-center bg-gray-50 p-2">
                    {img.type === 'application/pdf' ? (
                      <div className="text-center">
                        <div className="text-red-500 font-bold text-lg">PDF</div>
                        <div className="text-xs text-gray-500 truncate w-20">{img.name}</div>
                      </div>
                    ) : (
                      <img src={URL.createObjectURL(img)} alt={`Upload ${idx}`} className="w-full h-full object-contain" />
                    )}
                    <button type="button" onClick={() => handleRemoveImage(idx)} className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t-2 border-gray-200">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className={`flex-1 ${isEntryOperator ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              disabled={!clientName || !clientContact || !quantity || !numberOfCores || !transformerType}
            >
              {isEntryOperator ? "Submit for Approval" : "Continue to Assign Testing"}
            </Button>
          </div>
        </div>
      </Card >
    </div >
  );
}

interface VendorMultiSelectProps {
  vendors: any[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder: string;
}

function VendorMultiSelect({ vendors, selectedIds, onChange, placeholder }: VendorMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVendors = vendors.filter(v =>
    v.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.vendor_no.toString().includes(searchTerm)
  );

  const toggleVendor = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectedVendors = vendors.filter(v => selectedIds.includes(v._id));

  return (
    <div className="relative">
      <div
        className="min-h-10 w-full p-2 border rounded-md bg-white cursor-pointer flex flex-wrap gap-2 items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedVendors.length > 0 ? (
          selectedVendors.map(v => (
            <Badge key={v._id} variant="secondary" className="gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 pr-1">
              {v.vendor_no} - {v.vendor_name}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVendor(v._id);
                }}
                className="hover:text-blue-900"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))
        ) : (
          <span className="text-gray-500 text-sm pl-2">{placeholder}</span>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b flex items-center gap-2 bg-gray-50">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              autoFocus
              className="bg-transparent border-none outline-none text-sm w-full"
              placeholder="Search vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto">
            {filteredVendors.length > 0 ? (
              filteredVendors.map(v => (
                <div
                  key={v._id}
                  className="p-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVendor(v._id);
                  }}
                >
                  <span>{v.vendor_no} - {v.vendor_name}</span>
                  {selectedIds.includes(v._id) && <Check className="w-4 h-4 text-blue-600" />}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">No vendors found</div>
            )}
          </div>
          <div className="p-2 border-t bg-gray-50 flex justify-end">
            <Button size="sm" variant="ghost" type="button" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>Close</Button>
          </div>
        </div>
      )}
      {/* Overlay to close when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

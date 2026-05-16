import { useState } from 'react';
import { toast } from 'sonner';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { X, Plus, Upload, ArrowLeft, Search, Check } from 'lucide-react';
import { Badge } from '../ui/badge';

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
  initialData?: any;
}

export function EnhancedOrderForm({ transformer, allVendors, onSubmit, onBack, isEntryOperator = false, initialData }: EnhancedOrderFormProps & { isEntryOperator?: boolean }) {
  const isEditMode = !!initialData;
  const [clientName, setClientName] = useState(initialData?.clientName || '');
  const [clientContact, setClientContact] = useState(initialData?.clientContactNo || initialData?.clientContact || '');
  const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || '1');
  const [isStandard, setIsStandard] = useState(initialData?.isStandard || '');

  // Form Errors state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Initialize from transformer prop if available, else empty
  const [transformerType, setTransformerType] = useState(initialData?.transformerType || transformer?.type || '');
  const [numberOfCores, setNumberOfCores] = useState(initialData?.noOfCores?.toString() || transformer?.cores.toString() || '1');

  // Real-time Validation Engine
  const validateEnhancedField = (field: string, value: string): string | null => {
    switch (field) {
      case 'clientName':
         return !value.trim() ? 'Client Name is required' : null;
      case 'clientContact':
         if (value.trim().length > 10) return 'your contact no must be 10 digits';
         if (value.trim().length > 0 && !/^[0-9]+$/.test(value.trim())) return 'character cannot add only the digits are requires';
         return null;
      case 'quantity':
         return (!value || parseInt(value) < 1) ? 'Valid quantity required (>0)' : null;
      case 'numberOfCores':
         return (!value || parseInt(value) < 1 || parseInt(value) > 5) ? 'Number of cores must be 1-5' : null;
      case 'transformerType':
         return !value ? 'Type is required' : null;
      case 'isStandard':
         return !value ? 'IS Standard is required' : null;
      case 'voltageRating':
         return !value ? 'Nominal System Voltage is required' : null;
      case 'burden':
         return !value.trim() ? 'Burden is required' : null;
      case 'ratedSecondaryCurrent':
         return !value ? 'Rated Secondary Current is required' : null;
      default:
         return null;
    }
  };

  const handleInputChange = (field: string, value: string, setter: React.Dispatch<React.SetStateAction<any>>) => {
    setter(value);
    const errorMsg = validateEnhancedField(field, value);
    if (errorMsg) {
      setFormErrors(prev => ({ ...prev, [field]: errorMsg }));
    } else {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const [voltageRating, setVoltageRating] = useState(initialData?.voltageRating || transformer?.voltageRating || '');
  const [isCustomVoltage, setIsCustomVoltage] = useState(false);

  const [indoorOutdoor, setIndoorOutdoor] = useState(initialData?.indoorOutdoor || '');
  const [insulationType, setInsulationType] = useState(initialData?.insulationType || '');
  const [tankType, setTankType] = useState(initialData?.tankType || '');

  // Core configurations
  const [coreConfigs, setCoreConfigs] = useState<{ coreType: string; accuracyClass: string; vendorNo: string; secondaryCurrent: string }[]>(() => {
    if (initialData?.coreDetails) {
      return initialData.coreDetails.map((c: any) => ({
        coreType: c.coreType?.toLowerCase() || 'metering',
        accuracyClass: c.accuracyClass || '',
        vendorNo: c.vendorNo || '',
        secondaryCurrent: c.secondaryCurrent || '1'
      }));
    }
    return Array.from({ length: parseInt(numberOfCores) || 1 }, () => ({ coreType: 'metering', accuracyClass: '', vendorNo: '', secondaryCurrent: '1' }));
  });

  // Transformer Parameters
  const [primaryCurrents, setPrimaryCurrents] = useState<string[]>(initialData?.primaryCurrents || []);
  const [isCustomPrimaryCurrent, setIsCustomPrimaryCurrent] = useState(false);
  const [customPrimaryCurrentInput, setCustomPrimaryCurrentInput] = useState('');
<<<<<<< Updated upstream
  const [burden, setBurden] = useState('');
  const [stc, setStc] = useState('');
=======
  const [nominalVoltage, setNominalVoltage] = useState(initialData?.nominalSystemVoltage?.toString() || '');
  const [burden, setBurden] = useState(initialData?.burden?.toString() || '');
  const [stc, setStc] = useState(initialData?.stc || '');
>>>>>>> Stashed changes

  // PT Specific Voltage Parameters
  const [ratedPrimaryVoltage, setRatedPrimaryVoltage] = useState(initialData?.ratedPrimaryVoltage || '');
  const [isCustomPrimaryVoltage, setIsCustomPrimaryVoltage] = useState(false);
  const [ratedSecondaryVoltage, setRatedSecondaryVoltage] = useState(initialData?.ratedSecondaryVoltage || '');
  const [isCustomSecondaryVoltage, setIsCustomSecondaryVoltage] = useState(false);

  // Additional parameters
  const [additionalParams, setAdditionalParams] = useState<AdditionalParameter[]>([]);

  // Images state
  const [images, setImages] = useState<File[]>([]);

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
      updated[index] = { coreType: value, accuracyClass: '', vendorNo: '', secondaryCurrent: '1' }; // reset on type change
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



  const handleCoreSecondaryCurrentChange = (index: number, value: string) => {
    setCoreConfigs(prev => {
      const updated = [...prev];
      const current = updated[index];
      if (current) {
        updated[index] = { ...current, secondaryCurrent: value };
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

  const handleAddPrimaryCurrent = (value: string) => {
    if (value) {
      setPrimaryCurrents([...primaryCurrents, value]);
    }
  };

  const handleRemovePrimaryCurrent = (index: number) => {
    setPrimaryCurrents(primaryCurrents.filter((_, i) => i !== index));
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
    // Explicit Validation Check before submission
    const errors: Record<string, string> = {};
    if (!clientName.trim()) errors['clientName'] = 'Client Name is required';
    if (!clientContact.trim()) errors['clientContact'] = 'Contact No is required';
    else if (!/^[0-9]+$/.test(clientContact.trim())) errors['clientContact'] = 'character cannot add only the digits are requires';
    else if (clientContact.trim().length !== 10) errors['clientContact'] = 'your contact no must be 10 digits';
    
    if (!quantity || parseInt(quantity) < 1) errors['quantity'] = 'Valid quantity required (>0)';
    if (!numberOfCores || parseInt(numberOfCores) < 1 || parseInt(numberOfCores) > 5) errors['numberOfCores'] = 'Number of cores must be 1-5';
    if (!transformerType) errors['transformerType'] = 'Type is required';
    
    if (!burden.trim()) errors['burden'] = 'Burden is required';
    if (!voltageRating) errors['voltageRating'] = 'Nominal System Voltage is required';
    
    if (transformerType === 'CT' && primaryCurrents.length === 0) {
      errors['primaryCurrents'] = 'Primary Current is required';
    }

    if (transformerType === 'PT') {
      if (!ratedPrimaryVoltage) errors['ratedPrimaryVoltage'] = 'Primary Voltage is required';
      if (!ratedSecondaryVoltage) errors['ratedSecondaryVoltage'] = 'Secondary Voltage is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(prev => ({ ...prev, ...errors }));
      toast.error("Please fix the validation errors marked in red.");
      return;
    }

    if (transformerType === 'PT') {
      const hasPSCore = coreConfigs.some(c => c.coreType === 'ps');
      if (hasPSCore) {
        toast.error("PS Class cores are not allowed for PT Transformers.");
        return;
      }
    }

    const orderData = {
      orderDate: new Date().toLocaleDateString(),
      clientName,
      clientContact,
      transformerName: transformer?.name || transformerType,
      transformerType: transformerType,
      quantity: parseInt(quantity),
      voltageRating,  // Added
      primaryCurrents: primaryCurrents, // Array of primary currents
      ratio: primaryCurrents.map(p => `${p}/${coreConfigs[0]?.secondaryCurrent || '1'}`), // Legacy fallback for some views
      isStandard,
      indoorOutdoor,
      insulationType,
      tankType,
      numberOfCores: parseInt(numberOfCores),
      coreDetails: coreConfigs.map((c) => {
        return {
          coreType: c.coreType === 'ps' ? 'PS' : c.coreType.charAt(0).toUpperCase() + c.coreType.slice(1),
          accuracyClass: c.accuracyClass,
          vendorNo: c.vendorNo,
          secondaryCurrent: c.secondaryCurrent
        };
      }),
      parameters: {
        nominalVoltage: voltageRating,
        burden,
        stc,
        ratedPrimaryVoltage: transformerType === 'PT' ? ratedPrimaryVoltage : undefined,
        ratedSecondaryVoltage: transformerType === 'PT' ? ratedSecondaryVoltage : undefined,
      },
      images,
      coreVendors: {
        metering: coreConfigs.filter(c => c.coreType === 'metering').flatMap((c, index) => {
          const ids = c.vendorNo ? c.vendorNo.split(',') : [];
          return ids.map(id => {
            const v = allVendors.find(v => String(v._id) === id);
            return { serialNo: index + 1, name: v ? v.vendor_name : 'Unknown' };
          });
        }),
        protection: coreConfigs.filter(c => c.coreType === 'protection').flatMap((c, index) => {
          const ids = c.vendorNo ? c.vendorNo.split(',') : [];
          return ids.map(id => {
            const v = allVendors.find(v => String(v._id) === id);
            return { serialNo: index + 1, name: v ? v.vendor_name : 'Unknown' };
          });
        }),
        ps: coreConfigs.filter(c => c.coreType === 'ps').flatMap((c, index) => {
          const ids = c.vendorNo ? c.vendorNo.split(',') : [];
          return ids.map(id => {
            const v = allVendors.find(v => String(v._id) === id);
            return { serialNo: index + 1, name: v ? v.vendor_name : 'Unknown' };
          });
        }),
      },
      bypassApproval: !isEntryOperator, // If Entry Operator, do NOT bypass approval
    };

    // Validation
    if (transformerType === 'CT' && parseInt(numberOfCores) > 0) {
      const hasMissingVendor = coreConfigs.some(c => !c.vendorNo);
      if (hasMissingVendor) {
        toast.error("Please select a vendor for every core.");
        return;
      }
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
        <h2>{isEditMode ? 'Edit Order' : 'Order Form - Transformer Details'}</h2>
        <p className="text-gray-500 mt-1">{isEditMode ? `Updating parameters for ${initialData.jobId}` : 'Complete all required information for the order'}</p>
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
                <div>
                  <Label className={formErrors['transformerType'] ? "text-red-600" : ""}>Type *</Label>
                  <select
                    value={transformerType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      handleInputChange('transformerType', newType, setTransformerType);
                      handleInputChange('isStandard', '', setIsStandard);
                      
                      if(newType === 'PT') {
                         setCoreConfigs(prev => prev.map(config => 
                           config.coreType === 'ps' ? { ...config, coreType: 'metering', accuracyClass: '', vendorNo: '' } : { ...config, vendorNo: '' }
                         ));
                         
                      }
                    }}
                    className={`w-full mt-1 h-10 px-3 rounded-md border bg-white ${formErrors['transformerType'] ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                  >
                    <option value="">Select Type</option>
                    <option value="CT">Current Transformer (CT)</option>
                    <option value="PT">Potential Transformer (PT)</option>
                  </select>
                  {formErrors['transformerType'] && <span className="text-xs text-red-600 font-semibold">{formErrors['transformerType']}</span>}
                </div>
                {transformerType && (
                  <div>
                    <Label className={formErrors['isStandard'] ? "text-red-600" : ""}>IS Standard *</Label>
                    <select
                      value={isStandard}
                      onChange={(e) => handleInputChange('isStandard', e.target.value, setIsStandard)}
                      className={`w-full mt-1 h-10 px-3 rounded-md border bg-white ${formErrors['isStandard'] ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                    >
                      <option value="">Select IS Standard</option>
                      <option value="16227">16227</option>
                      {transformerType === 'CT' && <option value="2705">2705</option>}
                      {transformerType === 'PT' && <option value="3156">3156</option>}
                    </select>
                    {formErrors['isStandard'] && <span className="text-xs text-red-600 font-semibold">{formErrors['isStandard']}</span>}
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
                <div className="flex flex-col">
                  <Label className={formErrors['voltageRating'] ? "text-red-600" : ""}>Nominal System Voltage *</Label>
                  <div className="flex gap-2">
                    <select
                      value={!isCustomVoltage ? voltageRating : 'Custom'}
                      onChange={(e) => {
                        if (e.target.value === 'Custom') {
                          setIsCustomVoltage(true);
                          handleInputChange('voltageRating', '', setVoltageRating);
                        } else {
                          setIsCustomVoltage(false);
                          handleInputChange('voltageRating', e.target.value, setVoltageRating);
                        }
                      }}
                      className={`w-full mt-1 h-10 px-3 rounded-md border bg-white ${formErrors['voltageRating'] ? "border-red-500 bg-red-50" : "border-gray-300"}`}
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
                <Label className={formErrors['clientName'] ? "text-red-600" : ""}>Client Name *</Label>
                <Input
                  placeholder="Enter client name"
                  value={clientName}
                  onChange={(e) => handleInputChange('clientName', e.target.value, setClientName)}
                  className={`mt-1 ${formErrors['clientName'] ? "border-red-500 bg-red-50" : ""}`}
                />
                {formErrors['clientName'] && <span className="text-xs text-red-600 font-semibold">{formErrors['clientName']}</span>}
              </div>
              <div>
                <Label className={formErrors['clientContact'] ? "text-red-600" : ""}>Client Contact Number *</Label>
                <Input
                  placeholder="Enter contact number"
                  value={clientContact}
                  onKeyDown={(e) => {
                    // Bypass control keys
                    if (e.ctrlKey || e.metaKey || ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter"].includes(e.key)) {
                      return;
                    }
                    // Prevent any non-digit character from even entering the browser DOM
                    if (!/^[0-9]$/.test(e.key)) {
                      e.preventDefault();
                      setFormErrors(prev => ({ ...prev, clientContact: 'character cannot add only the digits are requires' }));
                    }
                  }}
                  onChange={(e) => {
                    const onlyNumbers = e.target.value.replace(/[^0-9]/g, '');
                    handleInputChange('clientContact', onlyNumbers, setClientContact);
                  }}
                  className={`mt-1 ${formErrors['clientContact'] ? "border-red-500 bg-red-50" : ""}`}
                  maxLength={10}
                />
                {formErrors['clientContact'] && <span className="text-xs text-red-600 font-semibold">{formErrors['clientContact']}</span>}
              </div>
            </div>
          </div>

          {/* Order Details Section */}
          <div className="space-y-4">
            <h3 className="pb-2 border-b-2 border-gray-200">Order Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className={formErrors['quantity'] ? "text-red-600" : ""}>Quantity *</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Enter quantity"
                  value={quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value, setQuantity)}
                  className={`mt-1 ${formErrors['quantity'] ? "border-red-500 bg-red-50" : ""}`}
                />
                {formErrors['quantity'] && <span className="text-xs text-red-600 font-semibold">{formErrors['quantity']}</span>}
              </div>
              <div>
                <Label className={formErrors['numberOfCores'] ? "text-red-600" : ""}>Number of Cores *</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  placeholder="Number of cores"
                  value={numberOfCores}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange('numberOfCores', value, setNumberOfCores);
                    const numCores = parseInt(value) || 0;
                    setCoreConfigs(prev => {
                      const newTypes = Array.isArray(prev) ? [...prev] : [];
                      if (numCores > newTypes.length) {
                        return [...newTypes, ...Array(numCores - newTypes.length).fill({ coreType: 'metering', accuracyClass: '', vendorNo: '', secondaryCurrent: '1' })];
                      }
                      return newTypes.slice(0, numCores);
                    });
                  }}
                  className={`mt-1 ${formErrors['numberOfCores'] ? "border-red-500 bg-red-50" : ""}`}
                />
                {formErrors['numberOfCores'] && <span className="text-xs text-red-600 font-semibold">{formErrors['numberOfCores']}</span>}
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
                              transformerType === 'PT' ? (
                                <>
                                  <option value="0.1">0.1</option>
                                  <option value="0.2">0.2</option>
                                  <option value="0.5">0.5</option>
                                  <option value="1">1</option>
                                  <option value="3">3</option>
                                </>
                              ) : (
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
                              )
                            )}
                            {coreConfigs[index].coreType === 'protection' && (
                              transformerType === 'PT' ? (
                                <>
                                  <option value="3P">3P</option>
                                  <option value="6P">6P</option>
                                </>
                              ) : (
                                <>
                                  <option value="5P">5P</option>
                                  <option value="10P">10P</option>
                                  <option value="15P">15P</option>
                                </>
                              )
                            )}
                            {coreConfigs[index].coreType === 'ps' && (
                              <option value="0.2s">0.2s</option>
                            )}
                          </select>
                        </div>





                        {transformerType !== 'PT' && (
                          <div className="mt-2">
                            <Label>Secondary Current *</Label>
                            <select
                              value={coreConfigs[index]?.secondaryCurrent || '1'}
                              onChange={(e) => handleCoreSecondaryCurrentChange(index, e.target.value)}
                              className="w-full mt-1 h-10 px-3 rounded-md border border-gray-300 bg-white"
                            >
                              <option value="1">1</option>
                              <option value="5">5</option>
                              <option value="Custom">Custom...</option>
                            </select>
                            {coreConfigs[index]?.secondaryCurrent !== '1' && coreConfigs[index]?.secondaryCurrent !== '5' && (
                              <Input
                                className="mt-1"
                                placeholder="Enter Custom Sec. Current"
                                value={coreConfigs[index].secondaryCurrent === 'Custom' ? '' : coreConfigs[index].secondaryCurrent}
                                onChange={(e) => handleCoreSecondaryCurrentChange(index, e.target.value)}
                              />
                            )}
                          </div>
                        )}

                        {transformerType === 'CT' && (
                          <div className="mt-2 relative">
                            <Label>Core Vendor(s) *</Label>
                            <div className="mt-1">
                              <VendorMultiSelect
                                vendors={allVendors}
                                selectedIds={coreConfigs[index]?.vendorNo ? coreConfigs[index].vendorNo.split(',') : []}
                                onChange={(ids) => handleCoreVendorChange(index, ids.join(','))}
                                placeholder="Select Vendors"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transformer Parameters Section */}
          <div className="space-y-4">
            <h3 className="pb-2 border-b-2 border-gray-200">Transformer Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {transformerType === 'PT' && (
                <>
                  <div className="flex flex-col">
                    <Label>Rated Primary Voltage *</Label>
                    <div className="flex gap-2">
                      <select
                        value={!isCustomPrimaryVoltage ? ratedPrimaryVoltage : 'Custom'}
                        onChange={(e) => {
                          if (e.target.value === 'Custom') {
                            setIsCustomPrimaryVoltage(true);
                            setRatedPrimaryVoltage('');
                          } else {
                            setIsCustomPrimaryVoltage(false);
                            setRatedPrimaryVoltage(e.target.value);
                          }
                        }}
                        className="w-full mt-1 h-10 px-3 rounded-md border border-gray-300 bg-white"
                      >
                        <option value="">Select Primary Voltage</option>
                        <option value="11KV/√3">11KV/√3</option>
                        <option value="22KV/√3">22KV/√3</option>
                        <option value="33KV/√3">33KV/√3</option>
                        <option value="Custom">Custom...</option>
                      </select>
                      {isCustomPrimaryVoltage && (
                        <Input
                          className="mt-1"
                          placeholder="Custom Primary Voltage"
                          value={ratedPrimaryVoltage}
                          onChange={e => setRatedPrimaryVoltage(e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <Label>Rated Secondary Voltage *</Label>
                    <div className="flex gap-2">
                      <select
                        value={!isCustomSecondaryVoltage ? ratedSecondaryVoltage : 'Custom'}
                        onChange={(e) => {
                          if (e.target.value === 'Custom') {
                            setIsCustomSecondaryVoltage(true);
                            setRatedSecondaryVoltage('');
                          } else {
                            setIsCustomSecondaryVoltage(false);
                            setRatedSecondaryVoltage(e.target.value);
                          }
                        }}
                        className="w-full mt-1 h-10 px-3 rounded-md border border-gray-300 bg-white"
                      >
                        <option value="">Select Secondary Voltage</option>
                        <option value="110V/√3">110V/√3</option>
                        <option value="Custom">Custom...</option>
                      </select>
                      {isCustomSecondaryVoltage && (
                        <Input
                          className="mt-1"
                          placeholder="Custom Secondary Voltage"
                          value={ratedSecondaryVoltage}
                          onChange={e => setRatedSecondaryVoltage(e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                </>
              )}
              {transformerType !== 'PT' && (
                <div>
                  <Label className={formErrors['primaryCurrents'] ? "text-red-600" : ""}>Primary Current *</Label>
                  <div className="space-y-2">
                    {/* Selected Tags */}
                    <div className="flex flex-wrap gap-2">
                      {primaryCurrents.map((p, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          {p}
                          <button onClick={() => handleRemovePrimaryCurrent(idx)} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>

                    {/* Selection Controls */}
                    <div className="flex gap-2">
                      {!isCustomPrimaryCurrent ? (
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value === 'custom') setIsCustomPrimaryCurrent(true);
                            else if (e.target.value) handleAddPrimaryCurrent(e.target.value);
                          }}
                          className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                        >
                          <option value="">Add Primary Current...</option>
                          {[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map(val => (
                             <option key={val} value={val.toString()}>{val}</option>
                          ))}
                          <option value="custom">Custom...</option>
                        </select>
                      ) : (
                        <div className="flex gap-2 w-full">
                          <Input
                            autoFocus
                            placeholder="Enter primary current"
                            value={customPrimaryCurrentInput}
                            onChange={(e) => setCustomPrimaryCurrentInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (customPrimaryCurrentInput.trim()) {
                                  handleAddPrimaryCurrent(customPrimaryCurrentInput);
                                  setCustomPrimaryCurrentInput('');
                                  setIsCustomPrimaryCurrent(false);
                                }
                              }
                            }}
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              if (customPrimaryCurrentInput.trim()) {
                                handleAddPrimaryCurrent(customPrimaryCurrentInput);
                                setCustomPrimaryCurrentInput('');
                                setIsCustomPrimaryCurrent(false);
                              }
                            }}
                          >
                            Add
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setIsCustomPrimaryCurrent(false); setCustomPrimaryCurrentInput(''); }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {formErrors['primaryCurrents'] && <span className="text-xs text-red-600 font-semibold">{formErrors['primaryCurrents']}</span>}
                  </div>

                </div>
              )}
               <div>
                 <Label className={formErrors['burden'] ? "text-red-600" : ""}>Burden *</Label>
                 <Input
                   placeholder="e.g., 15 VA"
                   value={burden}
                   onChange={(e) => handleInputChange('burden', e.target.value, setBurden)}
                   className={`mt-1 ${formErrors['burden'] ? "border-red-500 bg-red-50" : ""}`}
                 />
                 {formErrors['burden'] && <span className="text-xs text-red-600 font-semibold">{formErrors['burden']}</span>}
               </div>
               {transformerType === 'CT' && (
                 <div>
                   <Label>STC (Short Time Current)</Label>
                   <Input
                     value={stc}
                     onChange={(e) => setStc(e.target.value)}
                     placeholder="e.g. 31.5 kA for 3s"
                     className="mt-1"
                   />
                 </div>
               )}
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
            >
              {isEditMode ? "Update Order" : (isEntryOperator ? "Submit for Approval" : "Continue to Assign Testing")}
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

  const uniqueVendors = Array.from(new Map(vendors.map(v => [v._id, v])).values());
  const filteredVendors = uniqueVendors.filter(v =>
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
        className="min-h-10 w-full p-2 border rounded-md bg-white cursor-pointer flex flex-wrap gap-2 items-center relative z-50"
        onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}
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
              <div className="p-4 text-center text-sm text-gray-500">
                {vendors.length === 0 ? "No vendors loaded from server" : "No vendors match search"}
              </div>
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

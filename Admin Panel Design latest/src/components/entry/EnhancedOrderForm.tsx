import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { X, Plus, Upload, ArrowLeft } from 'lucide-react';

interface Transformer {
  id: string;
  name: string;
  type: string;
  capacity: string;
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
  onSubmit: (orderData: any) => void;
  onBack: () => void;
}

export function EnhancedOrderForm({ transformer, onSubmit, onBack, isEntryOperator = false }: EnhancedOrderFormProps & { isEntryOperator?: boolean }) {
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isStandard, setIsStandard] = useState('');

  // Initialize from transformer prop if available, else empty
  const [transformerName, setTransformerName] = useState(transformer?.name || '');
  const [transformerType, setTransformerType] = useState(transformer?.type || '');
  const [numberOfCores, setNumberOfCores] = useState(transformer?.cores.toString() || '1');
  const [capacity, setCapacity] = useState(transformer?.capacity || '');
  const [voltageRating, setVoltageRating] = useState(transformer?.voltageRating || '');


  // Core configurations
  const [coreTypes, setCoreTypes] = useState<string[]>(
    Array(parseInt(numberOfCores) || 1).fill('metering')
  );

  // Transformer Parameters
  const [ratios, setRatios] = useState<string[]>([]);
  const [isCustomRatio, setIsCustomRatio] = useState(false);
  const [customRatioInput, setCustomRatioInput] = useState('');
  const [nominalVoltage, setNominalVoltage] = useState('');
  const [burden, setBurden] = useState('');
  const [ratedPrimaryCurrent, setRatedPrimaryCurrent] = useState('');
  const [ratedSecondaryCurrent, setRatedSecondaryCurrent] = useState('');
  const [accuracyClass, setAccuracyClass] = useState('');
  const [mountingDetails, setMountingDetails] = useState('');
  const [overallDimensions, setOverallDimensions] = useState('');

  // Additional parameters
  const [additionalParams, setAdditionalParams] = useState<AdditionalParameter[]>([]);

  const handleCoreTypeChange = (index: number, value: string) => {
    const newCoreTypes = [...coreTypes];
    newCoreTypes[index] = value;
    setCoreTypes(newCoreTypes);
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
    const orderData = {
      orderId: `ORD-${Date.now()}`,
      orderDate: new Date().toLocaleDateString(),
      clientName,
      clientContact,
      transformerName, // Use state
      transformerType, // Use state
      quantity: parseInt(quantity),
      capacity,       // Added
      voltageRating,  // Added
      ratio: ratios,  // Changed to Array
      isStandard,
      numberOfCores: parseInt(numberOfCores),
      coreTypes,
      parameters: {
        nominalVoltage,
        burden,
        ratedPrimaryCurrent,
        ratedSecondaryCurrent,
        accuracyClass,
        mountingDetails,
        overallDimensions,
      },
      additionalParams,
      bypassApproval: !isEntryOperator, // If Entry Operator, do NOT bypass approval
    };
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
                <span>Capacity: {transformer.capacity}</span>
                <span>•</span>
                <span>Voltage: {transformer.voltageRating}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4 border-b-2 border-gray-200 pb-6">
              <h3 className="font-semibold mb-4 text-blue-700">Transformer Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Transformer Name *</Label>
                  <Input
                    value={transformerName}
                    onChange={e => setTransformerName(e.target.value)}
                    placeholder="e.g. Outdoor Epoxy Resin Cast"
                  />
                </div>
                <div>
                  <Label>Type *</Label>
                  <select
                    value={transformerType}
                    onChange={(e) => setTransformerType(e.target.value)}
                    className="w-full mt-1 h-10 px-3 rounded-md border border-gray-300 bg-white"
                  >
                    <option value="">Select Type</option>
                    <option value="CT">Current Transformer (CT)</option>
                    <option value="PT">Potential Transformer (PT)</option>
                  </select>
                </div>
                <div>
                  <Label>Capacity</Label>
                  <Input
                    value={capacity}
                    onChange={e => setCapacity(e.target.value)}
                    placeholder="e.g. 500 kVA"
                  />
                </div>
                <div>
                  <Label>Voltage Rating</Label>
                  <Input
                    value={voltageRating}
                    onChange={e => setVoltageRating(e.target.value)}
                    placeholder="e.g. 33/11 kV"
                  />
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
                <Label>IS Standard</Label>
                <Input
                  placeholder="e.g., IS 2705, IS 3156"
                  value={isStandard}
                  onChange={(e) => setIsStandard(e.target.value)}
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
                    // Only update config if expanding, or reset? Let's just resize array
                    setCoreTypes(prev => {
                      const newTypes = [...prev];
                      if (numCores > prev.length) {
                        return [...newTypes, ...Array(numCores - prev.length).fill('metering')];
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {coresArray.map((_, index) => (
                  <div key={index}>
                    <Label>Core {index + 1} Type *</Label>
                    <select
                      value={coreTypes[index] || 'metering'}
                      onChange={(e) => handleCoreTypeChange(index, e.target.value)}
                      className="w-full mt-1 h-10 px-3 rounded-md border border-gray-300 bg-white"
                    >
                      <option value="metering">Metering</option>
                      <option value="ps">PS</option>
                      <option value="protection">Protection</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              <div>
                <Label>Rated Primary Current</Label>
                <Input
                  placeholder="e.g., 200 A"
                  value={ratedPrimaryCurrent}
                  onChange={(e) => setRatedPrimaryCurrent(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Rated Secondary Current</Label>
                <Input
                  placeholder="e.g., 1 A or 5 A"
                  value={ratedSecondaryCurrent}
                  onChange={(e) => setRatedSecondaryCurrent(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Accuracy Class</Label>
                <Input
                  placeholder="e.g., 0.2S, 0.5, 5P20"
                  value={accuracyClass}
                  onChange={(e) => setAccuracyClass(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Mounting Details</Label>
                <Input
                  placeholder="e.g., Wall mounted, Panel mounted"
                  value={mountingDetails}
                  onChange={(e) => setMountingDetails(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Overall Dimensions</Label>
                <Input
                  placeholder="e.g., 500mm x 300mm x 400mm"
                  value={overallDimensions}
                  onChange={(e) => setOverallDimensions(e.target.value)}
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
            <h3 className="pb-2 border-b-2 border-gray-200">Upload Image</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF up to 10MB</p>
            </div>
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
              disabled={!clientName || !clientContact || !quantity || !numberOfCores || !transformerName || !transformerType}
            >
              {isEntryOperator ? "Submit for Approval" : "Continue to Assign Testing"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

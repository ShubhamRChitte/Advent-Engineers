import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { X, Plus, Upload, Calendar } from 'lucide-react';

interface Transformer {
  id: string;
  name: string;
  type: string;
  capacity: string;
  voltageRating: string;
  hvVoltage: string;
  lvVoltage: string;
  cores: number;
  phase: string;
  model: string;
  coolingType: string;
}

interface Parameter {
  id: string;
  name: string;
  value: string;
  unit: string;
}

interface OrderFormProps {
  transformer: Transformer;
  onSubmit: (orderData: any) => void;
  onCancel: () => void;
}

export function OrderForm({ transformer, onSubmit, onCancel }: OrderFormProps) {
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [numberOfCores, setNumberOfCores] = useState(transformer.cores.toString());
  const [hvVoltage, setHvVoltage] = useState(transformer.hvVoltage);
  const [lvVoltage, setLvVoltage] = useState(transformer.lvVoltage);
  const [capacity, setCapacity] = useState(transformer.capacity);
  const [coolingType, setCoolingType] = useState(transformer.coolingType);

  const [coreTypes, setCoreTypes] = useState<string[]>(
    Array(transformer.cores).fill('metering')
  );

  const [parameters, setParameters] = useState<Parameter[]>([
    { id: '1', name: 'Core Loss', value: '', unit: 'W' },
    { id: '2', name: 'Winding Resistance (HV)', value: '', unit: 'Ω' },
    { id: '3', name: 'Winding Resistance (LV)', value: '', unit: 'Ω' },
    { id: '4', name: 'No Load Current', value: '', unit: 'A' },
    { id: '5', name: 'HV-LV Ratio', value: '', unit: '' },
    { id: '6', name: 'Neutral Resistance', value: '', unit: 'Ω' },
    { id: '7', name: 'Impedance', value: '', unit: '%' },
  ]);

  const orderDate = new Date().toLocaleDateString();

  const handleAddParameter = () => {
    const newParam: Parameter = {
      id: Date.now().toString(),
      name: '',
      value: '',
      unit: '',
    };
    setParameters([...parameters, newParam]);
  };

  const handleRemoveParameter = (id: string) => {
    setParameters(parameters.filter((p) => p.id !== id));
  };

  const handleParameterChange = (id: string, field: keyof Parameter, value: string) => {
    setParameters(
      parameters.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleSubmit = () => {
    const orderData = {
      orderId: `ORD-${Date.now()}`,
      clientName,
      clientContact,
      orderDate,
      transformer: {
        ...transformer,
        quantity: parseInt(quantity),
        numberOfCores: parseInt(numberOfCores),
        hvVoltage,
        lvVoltage,
        capacity,
        coolingType,
        coreTypes,
      },
      parameters,
    };
    onSubmit(orderData);
  };

  const handleCoreTypeChange = (index: number, value: string) => {
    const newCoreTypes = [...coreTypes];
    newCoreTypes[index] = value;
    setCoreTypes(newCoreTypes);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2>Order Form - Transformer Details</h2>
            <p className="text-gray-500 mt-1">Complete the order information</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* ADVENT ENGINEERS Header */}
          <div className="bg-gray-100 border border-gray-300 p-4 text-center">
            <h3 className="text-red-600">ADVENT ENGINEERS</h3>
          </div>

          {/* Client Details Section */}
          <div className="space-y-4">
            <h3 className="pb-2 border-b">Customer / Client Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Client Name *</Label>
                <Input
                  placeholder="Enter Client name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Client Contact (Optional)</Label>
                <Input
                  placeholder="Enter contact number or email"
                  value={clientContact}
                  onChange={(e) => setClientContact(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Order Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={orderDate}
                    disabled
                    className="mt-1 pl-10 bg-gray-50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order Details Section */}
          <div className="space-y-4">
            <h3 className="pb-2 border-b">Order Details</h3>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Transformer Selected</p>
              <p className="font-medium">{transformer.name} - {transformer.model}</p>
              <p className="text-sm text-gray-600 mt-1">{transformer.type}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Enter Quantity"
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
                  placeholder="Number of cores"
                  value={numberOfCores}
                  onChange={(e) => setNumberOfCores(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>HV Voltage (kV) *</Label>
                <Input
                  placeholder="Enter HV voltage"
                  value={hvVoltage}
                  onChange={(e) => setHvVoltage(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>LV Voltage (kV) *</Label>
                <Input
                  placeholder="Enter LV voltage"
                  value={lvVoltage}
                  onChange={(e) => setLvVoltage(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Transformer Capacity (kVA) *</Label>
                <Input
                  placeholder="Enter capacity"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Cooling Type *</Label>
                <select
                  value={coolingType}
                  onChange={(e) => setCoolingType(e.target.value)}
                  className="w-full mt-1 h-10 px-3 rounded-md border border-gray-300 bg-white"
                >
                  <option value="ONAN">ONAN</option>
                  <option value="ONAF">ONAF</option>
                  <option value="OFAF">OFAF</option>
                  <option value="OFWF">OFWF</option>
                </select>
              </div>
            </div>
          </div>

          {/* Core Configuration Section */}
          <div className="space-y-4">
            <h3 className="pb-2 border-b">Core Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: parseInt(numberOfCores) || 0 }).map((_, index) => (
                <div key={index}>
                  <Label>Core {index + 1} Type</Label>
                  <select
                    value={coreTypes[index] || 'metering'}
                    onChange={(e) => handleCoreTypeChange(index, e.target.value)}
                    className="w-full mt-1 h-10 px-3 rounded-md border border-gray-300 bg-white"
                  >
                    <option value="metering">Metering</option>
                    <option value="ps">PS (Protective System)</option>
                    <option value="protection">Protection</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Parameters Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3>Technical Parameters</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddParameter}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Parameter
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {parameters.map((param) => (
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
                  <div className="w-24">
                    <Input
                      placeholder="Unit"
                      value={param.unit}
                      onChange={(e) =>
                        handleParameterChange(param.id, 'unit', e.target.value)
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
          </div>

          {/* Upload Section */}
          <div className="space-y-4">
            <h3 className="pb-2 border-b">Upload Image As per Approved Drawing</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Click to select or drag and drop</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF up to 10MB</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={!clientName || !quantity}
            >
              Submit Order & Assign Testing
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

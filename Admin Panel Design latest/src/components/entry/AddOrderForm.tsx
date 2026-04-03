import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import axios from 'axios';

interface CoreData {
  id: string;
  coreType: string;
  accuracyClass: string;
}

interface AddOrderFormProps {
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function AddOrderForm({ onCancel, onSuccess }: AddOrderFormProps) {
  const [formData, setFormData] = useState({
    clientName: '',
    transformerType: '',
    isStandard: '',
    indoorOutdoor: '',
    insulationType: '',
    tankType: '',
    voltage: '',
    numberOfCores: '1',
    burden: '',
    dimensions: {
      length: '',
      width: '',
      height: '',
      weight: '',
    },
  });

  const [cores, setCores] = useState<CoreData[]>([{ id: '1', coreType: '', accuracyClass: '' }]);
  const [uploadedFile, setUploadedFile] = useState<string>('');

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleDimensionChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      dimensions: { ...formData.dimensions, [field]: value },
    });
  };

  const handleCoresChange = (value: string) => {
    const count = parseInt(value) || 1;
    const newCores: CoreData[] = Array.from({ length: count }, (_, i) => ({
      id: String(i + 1),
      coreType: cores[i]?.coreType || '',
      accuracyClass: cores[i]?.accuracyClass || '',
    }));
    setCores(newCores);
    setFormData({ ...formData, numberOfCores: value });
  };

  const handleCoreTypeChange = (index: number, value: string) => {
    const newCores = [...cores];
    if (newCores[index]) {
      newCores[index].coreType = value;
      newCores[index].accuracyClass = ''; // reset on type change
    }
    setCores(newCores);
  };

  const handleCoreAccuracyChange = (index: number, value: string) => {
    const newCores = [...cores];
    if (newCores[index]) {
      newCores[index].accuracyClass = value;
    }
    setCores(newCores);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file.name);
      toast.success('Drawing uploaded successfully');
    }
  };

  const handleSubmit = () => {
    if (!formData.clientName || !formData.voltage) {
      toast.error('Please fill in all required fields');
      return;
    }

    const jobId = `JOB-2025-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    toast.success(`Order created successfully! Job ID: ${jobId}`);

    // Reset form
    setFormData({
      clientName: '',
      transformerType: '',
      isStandard: '',
      indoorOutdoor: '',
      insulationType: '',
      tankType: '',
      voltage: '',
      numberOfCores: '1',
      burden: '',
      dimensions: { length: '', width: '', height: '', weight: '' },
    });
    setCores([{ id: '1', coreType: '', accuracyClass: '' }]);
    setUploadedFile('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2>Add New Order</h2>
        <p className="text-gray-500 mt-1">Create a new transformer testing order</p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientName">Client Name *</Label>
                <Input
                  id="clientName"
                  placeholder="Enter client name"
                  value={formData.clientName}
                  onChange={(e) => handleInputChange('clientName', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="transformerType">Transformer Type *</Label>
                <Select value={formData.transformerType} onValueChange={(value: string) => {
                  handleInputChange('transformerType', value);
                  handleInputChange('isStandard', ''); // reset standard
                }}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CT">CT (Current Transformer)</SelectItem>
                    <SelectItem value="PT">PT (Potential Transformer)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.transformerType && (
                <div>
                  <Label htmlFor="isStandard">IS Standard *</Label>
                  <Select value={formData.isStandard} onValueChange={(value: string) => handleInputChange('isStandard', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select IS Standard" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="16227">16227</SelectItem>
                      {formData.transformerType === 'CT' && <SelectItem value="2705">2705</SelectItem>}
                      {formData.transformerType === 'PT' && <SelectItem value="3156">3156</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="voltage">Voltage *</Label>
                <Select value={formData.voltage} onValueChange={(value: string) => handleInputChange('voltage', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select voltage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="11kV">11kV</SelectItem>
                    <SelectItem value="22kV">22kV</SelectItem>
                    <SelectItem value="33kV">33kV</SelectItem>
                    <SelectItem value="66kV">66kV</SelectItem>
                    <SelectItem value="132kV">132kV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="numberOfCores">Number of Cores *</Label>
                <Input
                  id="numberOfCores"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.numberOfCores}
                  onChange={(e) => handleCoresChange(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="burden">Burden (VA)</Label>
                <Input
                  id="burden"
                  placeholder="e.g., 15VA"
                  value={formData.burden}
                  onChange={(e) => handleInputChange('burden', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {formData.transformerType && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  <div>
                    <Label htmlFor="indoorOutdoor">Indoor/Outdoor</Label>
                    <Select value={formData.indoorOutdoor} onValueChange={(value: string) => handleInputChange('indoorOutdoor', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Indoor">Indoor</SelectItem>
                        <SelectItem value="Outdoor">Outdoor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="insulationType">Insulation Type</Label>
                    <Select value={formData.insulationType} onValueChange={(value: string) => handleInputChange('insulationType', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select insulation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Oil Cooled">Oil Cooled</SelectItem>
                        <SelectItem value="Epoxy">Epoxy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.insulationType === 'Oil Cooled' && (
                    <div>
                      <Label htmlFor="tankType">Tank Type</Label>
                      <Select value={formData.tankType} onValueChange={(value: string) => handleInputChange('tankType', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select tank type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Live Tank">Live Tank</SelectItem>
                          <SelectItem value="Dead Tank">Dead Tank</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Core Types */}
        <div className="border-t pt-6">
          <h3 className="mb-4">Core Types</h3>
          <div className="space-y-3">
            {cores.map((core, index) => (
              <div key={core.id} className="flex flex-col gap-3">
                <Label>Core {index + 1}:</Label>
                <div className="flex items-center gap-3">
                  <Select
                    value={core.coreType}
                    onValueChange={(value: string) => handleCoreTypeChange(index, value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select core type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Metering">Metering</SelectItem>
                      <SelectItem value="Protection">Protection</SelectItem>
                      <SelectItem value="PS">PS</SelectItem>
                    </SelectContent>
                  </Select>

                  {core.coreType && (
                    <Select
                      value={core.accuracyClass}
                      onValueChange={(value: string) => handleCoreAccuracyChange(index, value)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Accuracy Class" />
                      </SelectTrigger>
                      <SelectContent>
                        {core.coreType === 'Metering' && (
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
                        {core.coreType === 'Protection' && (
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
                        {core.coreType === 'PS' && (
                          <SelectItem value="0.2s">0.2s</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Approved Drawing Upload */}
        <div className="border-t pt-6">
          <h3 className="mb-4">Upload Approved Drawing</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="flex flex-col items-center gap-3">
              <Upload className="w-8 h-8 text-gray-400" />
              <div className="text-center">
                <Label htmlFor="drawing-upload" className="cursor-pointer text-red-600 hover:text-red-700">
                  Click to upload
                </Label>
                <p className="text-sm text-gray-500 mt-1">PDF, PNG, or JPG (max 10MB)</p>
              </div>
              <Input
                id="drawing-upload"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                className="hidden"
              />
              {uploadedFile && (
                <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded">
                  <span className="text-sm text-green-700">{uploadedFile}</span>
                  <button onClick={() => setUploadedFile('')}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dimensions */}
        <div className="border-t pt-6">
          <h3 className="mb-4">Dimensions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="length">Length (mm)</Label>
              <Input
                id="length"
                type="number"
                placeholder="0"
                value={formData.dimensions.length}
                onChange={(e) => handleDimensionChange('length', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="width">Width (mm)</Label>
              <Input
                id="width"
                type="number"
                placeholder="0"
                value={formData.dimensions.width}
                onChange={(e) => handleDimensionChange('width', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="height">Height (mm)</Label>
              <Input
                id="height"
                type="number"
                placeholder="0"
                value={formData.dimensions.height}
                onChange={(e) => handleDimensionChange('height', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="0"
                value={formData.dimensions.weight}
                onChange={(e) => handleDimensionChange('weight', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-6 border-t">
          <Button onClick={handleSubmit} className="bg-red-600 hover:bg-red-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Order
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}

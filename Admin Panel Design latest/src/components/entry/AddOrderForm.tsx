import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, Upload, Trash2 } from 'lucide-react';
<<<<<<< HEAD
import { toast } from 'sonner@2.0.3';
=======
import { toast } from 'sonner';

import axios from 'axios';
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1

interface CoreData {
  id: string;
  coreType: string;
}

<<<<<<< HEAD
export function AddOrderForm() {
=======
interface AddOrderFormProps {
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function AddOrderForm({ onCancel, onSuccess }: AddOrderFormProps) {
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
  const [formData, setFormData] = useState({
    clientName: '',
    isStandard: 'IS 2705',
    voltage: '',
    numberOfCores: '1',
    burden: '',
    accuracyClass: '',
    dimensions: {
      length: '',
      width: '',
      height: '',
      weight: '',
    },
  });

  const [cores, setCores] = useState<CoreData[]>([{ id: '1', coreType: '' }]);
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
    }));
    setCores(newCores);
    setFormData({ ...formData, numberOfCores: value });
  };

  const handleCoreTypeChange = (index: number, value: string) => {
    const newCores = [...cores];
    newCores[index].coreType = value;
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
<<<<<<< HEAD
    
=======

>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
    // Reset form
    setFormData({
      clientName: '',
      isStandard: 'IS 2705',
      voltage: '',
      numberOfCores: '1',
      burden: '',
      accuracyClass: '',
      dimensions: { length: '', width: '', height: '', weight: '' },
    });
    setCores([{ id: '1', coreType: '' }]);
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
                <Label htmlFor="isStandard">IS Standard *</Label>
<<<<<<< HEAD
                <Select value={formData.isStandard} onValueChange={(value) => handleInputChange('isStandard', value)}>
=======
                <Select value={formData.isStandard} onValueChange={(value: string) => handleInputChange('isStandard', value)}>
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IS 2705">IS 2705</SelectItem>
                    <SelectItem value="IS 2026">IS 2026</SelectItem>
                    <SelectItem value="IS 13779">IS 13779</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="voltage">Voltage *</Label>
<<<<<<< HEAD
                <Select value={formData.voltage} onValueChange={(value) => handleInputChange('voltage', value)}>
=======
                <Select value={formData.voltage} onValueChange={(value: string) => handleInputChange('voltage', value)}>
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
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

              <div>
                <Label htmlFor="accuracyClass">Accuracy Class</Label>
<<<<<<< HEAD
                <Select value={formData.accuracyClass} onValueChange={(value) => handleInputChange('accuracyClass', value)}>
=======
                <Select value={formData.accuracyClass} onValueChange={(value: string) => handleInputChange('accuracyClass', value)}>
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select accuracy class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.2">0.2</SelectItem>
                    <SelectItem value="0.5">0.5</SelectItem>
                    <SelectItem value="1.0">1.0</SelectItem>
                    <SelectItem value="3.0">3.0</SelectItem>
                    <SelectItem value="5P">5P</SelectItem>
                    <SelectItem value="10P">10P</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Core Types */}
          <div className="border-t pt-6">
            <h3 className="mb-4">Core Types</h3>
            <div className="space-y-3">
              {cores.map((core, index) => (
                <div key={core.id} className="flex items-center gap-3">
                  <Label className="w-24">Core {index + 1}:</Label>
                  <Select
                    value={core.coreType}
<<<<<<< HEAD
                    onValueChange={(value) => handleCoreTypeChange(index, value)}
=======
                    onValueChange={(value: string) => handleCoreTypeChange(index, value)}
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select core type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Type-1 (11kV)">Type-1 (11kV)</SelectItem>
                      <SelectItem value="Type-2 (22kV)">Type-2 (22kV)</SelectItem>
                      <SelectItem value="Type-3 (33kV)">Type-3 (33kV)</SelectItem>
                      <SelectItem value="Type-4 (66kV)">Type-4 (66kV)</SelectItem>
                      <SelectItem value="Type-5 (132kV)">Type-5 (132kV)</SelectItem>
                    </SelectContent>
                  </Select>
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
<<<<<<< HEAD
            <Button variant="outline">
=======
            <Button variant="outline" onClick={onCancel}>
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

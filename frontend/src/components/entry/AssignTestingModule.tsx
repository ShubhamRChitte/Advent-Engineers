import { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  TestTube, 
  Zap, 
  CheckCircle2, 
  ClipboardCheck, 
  User, 
  Award,
  Activity,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

interface Worker {
  id: string;
  name: string;
  workerId: string;
  skillCategory: string[];
  currentWorkload: number;
  status: 'Available' | 'Busy' | 'Break';
  experienceLevel: 'Junior' | 'Mid-Level' | 'Senior' | 'Expert';
  activeTests: number;
}

interface OrderData {
  orderId: string;
  clientName: string;
  transformer: {
    name: string;
    type: string;
    quantity: number;
  };
}

interface AssignTestingModuleProps {
  orderData: OrderData;
  onComplete: () => void;
  onBack: () => void;
}

export function AssignTestingModule({ orderData, onComplete, onBack }: AssignTestingModuleProps) {
  const [selectedTestingType, setSelectedTestingType] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  const testingTypes = [
    {
      id: 'core-test',
      name: 'Core Test',
      icon: TestTube,
      color: 'blue',
      description: 'Initial core testing and validation',
    },
    {
      id: 'after-secondary',
      name: 'After Secondary Test',
      icon: Zap,
      color: 'purple',
      description: 'Testing after secondary winding completion',
    },
    {
      id: 'after-primary',
      name: 'After Primary Test',
      icon: Activity,
      color: 'orange',
      description: 'Testing after primary winding completion',
    },
    {
      id: 'final-test',
      name: 'Final Test',
      icon: ClipboardCheck,
      color: 'green',
      description: 'Comprehensive final testing including core-wise tests',
    },
  ];

  const workers: Worker[] = [
    {
      id: 'W001',
      name: 'Rajesh Kumar',
      workerId: 'EMP-2024-001',
      skillCategory: ['Core Test', 'After Secondary Test'],
      currentWorkload: 3,
      status: 'Available',
      experienceLevel: 'Senior',
      activeTests: 3,
    },
    {
      id: 'W002',
      name: 'Priya Sharma',
      workerId: 'EMP-2024-002',
      skillCategory: ['After Primary Test', 'Final Test'],
      currentWorkload: 2,
      status: 'Available',
      experienceLevel: 'Expert',
      activeTests: 2,
    },
    {
      id: 'W003',
      name: 'Amit Patel',
      workerId: 'EMP-2024-003',
      skillCategory: ['Core Test', 'Final Test'],
      currentWorkload: 5,
      status: 'Busy',
      experienceLevel: 'Mid-Level',
      activeTests: 5,
    },
    {
      id: 'W004',
      name: 'Sarah Johnson',
      workerId: 'EMP-2024-004',
      skillCategory: ['After Secondary Test', 'After Primary Test'],
      currentWorkload: 1,
      status: 'Available',
      experienceLevel: 'Senior',
      activeTests: 1,
    },
    {
      id: 'W005',
      name: 'Michael Chen',
      workerId: 'EMP-2024-005',
      skillCategory: ['Core Test', 'After Secondary Test', 'After Primary Test', 'Final Test'],
      currentWorkload: 0,
      status: 'Break',
      experienceLevel: 'Expert',
      activeTests: 0,
    },
    {
      id: 'W006',
      name: 'Anita Desai',
      workerId: 'EMP-2024-006',
      skillCategory: ['Final Test'],
      currentWorkload: 2,
      status: 'Available',
      experienceLevel: 'Junior',
      activeTests: 2,
    },
  ];

  const getTestingTypeColor = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-50 border-blue-300 hover:border-blue-500';
      case 'purple': return 'bg-purple-50 border-purple-300 hover:border-purple-500';
      case 'orange': return 'bg-orange-50 border-orange-300 hover:border-orange-500';
      case 'green': return 'bg-green-50 border-green-300 hover:border-green-500';
      default: return 'bg-gray-50 border-gray-300 hover:border-gray-500';
    }
  };

  const getTestingTypeIconColor = (color: string) => {
    switch (color) {
      case 'blue': return 'text-blue-600';
      case 'purple': return 'text-purple-600';
      case 'orange': return 'text-orange-600';
      case 'green': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-700 border-green-300';
      case 'Busy': return 'bg-red-100 text-red-700 border-red-300';
      case 'Break': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getExperienceColor = (level: string) => {
    switch (level) {
      case 'Expert': return 'bg-purple-100 text-purple-700';
      case 'Senior': return 'bg-blue-100 text-blue-700';
      case 'Mid-Level': return 'bg-green-100 text-green-700';
      case 'Junior': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleAutoAssign = () => {
    // Find the best available worker for the selected testing type
    const availableWorkers = workers.filter(
      (w) => w.status === 'Available' && w.skillCategory.includes(selectedTestingType || '')
    );
    
    if (availableWorkers.length > 0) {
      // Sort by workload and experience
      const bestWorker = availableWorkers.sort((a, b) => {
        if (a.currentWorkload !== b.currentWorkload) {
          return a.currentWorkload - b.currentWorkload;
        }
        const expOrder = { 'Expert': 4, 'Senior': 3, 'Mid-Level': 2, 'Junior': 1 };
        return expOrder[b.experienceLevel] - expOrder[a.experienceLevel];
      })[0];
      
      setSelectedWorker(bestWorker || null);
    }
  };

  const handleAssignTesting = () => {
    alert(`Testing assigned successfully!\n\nOrder ID: ${orderData.orderId}\nTesting Type: ${selectedTestingType}\nAssigned to: ${selectedWorker?.name}`);
    onComplete();
  };

  const selectedTestType = testingTypes.find(t => t.id === selectedTestingType);
  const filteredWorkers = selectedTestingType
    ? workers.filter(w => w.skillCategory.includes(selectedTestType?.name || ''))
    : workers;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      <div>
        <h2>Assign Testing - Worker Assignment</h2>
        <p className="text-gray-500 mt-1">Select testing type and assign to available worker</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Testing Type & Workers */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section A: Select Testing Type */}
          <Card className="p-6">
            <h3 className="mb-4">Select Testing Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testingTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedTestingType === type.id;
                return (
                  <Card
                    key={type.id}
                    className={`p-4 cursor-pointer border-2 transition-all ${
                      isSelected 
                        ? `${getTestingTypeColor(type.color)} ring-2 ring-offset-2 ring-${type.color}-400` 
                        : getTestingTypeColor(type.color)
                    }`}
                    onClick={() => setSelectedTestingType(type.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        type.color === 'blue' ? 'bg-blue-100' :
                        type.color === 'purple' ? 'bg-purple-100' :
                        type.color === 'orange' ? 'bg-orange-100' :
                        'bg-green-100'
                      }`}>
                        <Icon className={`w-6 h-6 ${getTestingTypeIconColor(type.color)}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4>{type.name}</h4>
                          {isSelected && (
                            <CheckCircle2 className={`w-5 h-5 ${getTestingTypeIconColor(type.color)}`} />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {selectedTestingType === 'final-test' && (
              <Card className="mt-4 p-4 bg-blue-50 border-blue-200">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Final Test includes core-wise testing</p>
                    <p className="text-sm text-blue-700 mt-1">
                      The Final Test module supports both comprehensive testing and individual core-wise tests
                      for Metering, PS, and Protection cores.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </Card>

          {/* Section B: Available Worker List */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3>Available Workers</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoAssign}
                disabled={!selectedTestingType}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Assign Automatically
              </Button>
            </div>

            {!selectedTestingType ? (
              <div className="text-center py-8 text-gray-500">
                <User className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>Please select a testing type first</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredWorkers.map((worker) => {
                  const isSelected = selectedWorker?.id === worker.id;
                  return (
                    <Card
                      key={worker.id}
                      className={`p-4 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-2 border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedWorker(worker)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                          {worker.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-base">{worker.name}</h4>
                            {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                          </div>
                          <p className="text-sm text-gray-500">{worker.workerId}</p>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <Badge className={getStatusColor(worker.status)}>
                            {worker.status}
                          </Badge>
                          <Badge className={getExperienceColor(worker.experienceLevel)}>
                            <Award className="w-3 h-3 mr-1" />
                            {worker.experienceLevel}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-sm">
                        <div>
                          <span className="text-gray-500">Current Workload:</span>
                          <span className="ml-2 font-medium">{worker.activeTests} active tests</span>
                        </div>
                        <div className="flex gap-1">
                          {worker.skillCategory.map((skill, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </Card>
                  );
                })}

                {filteredWorkers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <User className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No workers available for this testing type</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-6">
            <h3 className="mb-4">Order Summary</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Order ID</p>
                <p className="font-medium font-mono">{orderData.orderId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Client Name</p>
                <p className="font-medium">{orderData.clientName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Transformer Type</p>
                <p className="font-medium">{orderData.transformer.name}</p>
                <p className="text-sm text-gray-600">{orderData.transformer.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Quantity</p>
                <p className="font-medium">{orderData.transformer.quantity} unit(s)</p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-2">Testing Type Selected</p>
                {selectedTestingType ? (
                  <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                    {testingTypes.find(t => t.id === selectedTestingType)?.name}
                  </Badge>
                ) : (
                  <p className="text-sm text-gray-400 italic">Not selected</p>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Worker Assigned</p>
                {selectedWorker ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="font-medium">{selectedWorker.name}</p>
                    <p className="text-sm text-gray-600">{selectedWorker.workerId}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Not assigned</p>
                )}
              </div>

              <div className="pt-4 space-y-2">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={!selectedTestingType || !selectedWorker}
                  onClick={handleAssignTesting}
                >
                  Assign Testing
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onBack}
                >
                  Back
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

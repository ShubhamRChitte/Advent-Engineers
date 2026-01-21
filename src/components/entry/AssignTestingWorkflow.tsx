import { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  TestTube, 
  Zap, 
  Activity, 
  ClipboardCheck, 
  User,
  Award,
  CheckCircle2,
  Users,
  Sparkles,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

interface Worker {
  id: string;
  name: string;
  workerId: string;
  skillCategories: string[];
  currentWorkload: number;
  status: 'Available' | 'Busy' | 'Break';
  experienceLevel: 'Junior' | 'Mid-Level' | 'Senior' | 'Expert';
}

interface WorkerAssignment {
  worker: Worker;
  transformerCount: number;
}

interface TestAssignment {
  testType: string;
  workers: WorkerAssignment[];
}

interface AssignTestingWorkflowProps {
  orderData: any;
  onComplete: (assignments: TestAssignment[]) => void;
  onBack: () => void;
}

export function AssignTestingWorkflow({ orderData, onComplete, onBack }: AssignTestingWorkflowProps) {
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [testAssignments, setTestAssignments] = useState<TestAssignment[]>([]);
  const [selectedWorkers, setSelectedWorkers] = useState<Worker[]>([]);
  const [workerCounts, setWorkerCounts] = useState<{ [workerId: string]: string }>({});
  const [distributionMode, setDistributionMode] = useState<'manual' | 'auto'>('manual');

  const testTypes = [
    { id: 'core-test', name: 'Core Test', icon: TestTube, color: 'blue' },
    { id: 'after-secondary', name: 'After Secondary Test', icon: Zap, color: 'purple' },
    { id: 'after-primary', name: 'After Primary Test', icon: Activity, color: 'orange' },
    { id: 'final-test', name: 'Final Test', icon: ClipboardCheck, color: 'green' },
  ];

  const allWorkers: Worker[] = [
    {
      id: 'W001',
      name: 'Rajesh Kumar',
      workerId: 'EMP-2024-001',
      skillCategories: ['Core Test', 'After Secondary Test'],
      currentWorkload: 3,
      status: 'Available',
      experienceLevel: 'Senior',
    },
    {
      id: 'W002',
      name: 'Priya Sharma',
      workerId: 'EMP-2024-002',
      skillCategories: ['After Primary Test', 'Final Test'],
      currentWorkload: 2,
      status: 'Available',
      experienceLevel: 'Expert',
    },
    {
      id: 'W003',
      name: 'Amit Patel',
      workerId: 'EMP-2024-003',
      skillCategories: ['Core Test', 'Final Test'],
      currentWorkload: 5,
      status: 'Busy',
      experienceLevel: 'Mid-Level',
    },
    {
      id: 'W004',
      name: 'Sarah Johnson',
      workerId: 'EMP-2024-004',
      skillCategories: ['After Secondary Test', 'After Primary Test'],
      currentWorkload: 1,
      status: 'Available',
      experienceLevel: 'Senior',
    },
    {
      id: 'W005',
      name: 'Michael Chen',
      workerId: 'EMP-2024-005',
      skillCategories: ['Core Test', 'After Secondary Test', 'After Primary Test', 'Final Test'],
      currentWorkload: 0,
      status: 'Available',
      experienceLevel: 'Expert',
    },
    {
      id: 'W006',
      name: 'Anita Desai',
      workerId: 'EMP-2024-006',
      skillCategories: ['Final Test', 'Core Test'],
      currentWorkload: 2,
      status: 'Available',
      experienceLevel: 'Junior',
    },
    {
      id: 'W007',
      name: 'David Martinez',
      workerId: 'EMP-2024-007',
      skillCategories: ['After Primary Test', 'After Secondary Test'],
      currentWorkload: 4,
      status: 'Available',
      experienceLevel: 'Senior',
    },
    {
      id: 'W008',
      name: 'Lisa Wang',
      workerId: 'EMP-2024-008',
      skillCategories: ['Core Test', 'Final Test'],
      currentWorkload: 1,
      status: 'Break',
      experienceLevel: 'Mid-Level',
    },
  ];

  const currentTest = testTypes[currentTestIndex];
  const quantity = parseInt(orderData.transformer.quantity) || 1;

  const availableWorkers = allWorkers.filter((worker) =>
    worker.skillCategories.includes(currentTest.name)
  );

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

  const toggleWorkerSelection = (worker: Worker) => {
    if (selectedWorkers.find(w => w.id === worker.id)) {
      setSelectedWorkers(selectedWorkers.filter(w => w.id !== worker.id));
      const newCounts = { ...workerCounts };
      delete newCounts[worker.id];
      setWorkerCounts(newCounts);
    } else {
      setSelectedWorkers([...selectedWorkers, worker]);
    }
  };

  const handleAutoDistribute = () => {
    if (selectedWorkers.length === 0) return;
    
    const perWorker = Math.floor(quantity / selectedWorkers.length);
    const remainder = quantity % selectedWorkers.length;
    
    const newCounts: { [workerId: string]: string } = {};
    selectedWorkers.forEach((worker, index) => {
      newCounts[worker.id] = (perWorker + (index < remainder ? 1 : 0)).toString();
    });
    setWorkerCounts(newCounts);
    setDistributionMode('auto');
  };

  const getTotalAssigned = () => {
    return Object.values(workerCounts).reduce((sum, count) => sum + (parseInt(count) || 0), 0);
  };

  const handleNextTest = () => {
    // Save current test assignment
    const assignments: WorkerAssignment[] = selectedWorkers.map(worker => ({
      worker,
      transformerCount: parseInt(workerCounts[worker.id]) || 0,
    }));

    const newAssignment: TestAssignment = {
      testType: currentTest.name,
      workers: assignments,
    };

    const updatedAssignments = [...testAssignments, newAssignment];
    setTestAssignments(updatedAssignments);

    if (currentTestIndex < testTypes.length - 1) {
      // Move to next test
      setCurrentTestIndex(currentTestIndex + 1);
      setSelectedWorkers([]);
      setWorkerCounts({});
      setDistributionMode('manual');
    } else {
      // All tests assigned, complete the workflow
      onComplete(updatedAssignments);
    }
  };

  const isAssignmentValid = () => {
    return selectedWorkers.length > 0 && getTotalAssigned() === quantity;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Order Form
        </Button>
      </div>

      <div>
        <h2>Assign Testing - Worker Assignment</h2>
        <p className="text-gray-500 mt-1">
          Assign workers for each testing phase ({currentTestIndex + 1} of {testTypes.length})
        </p>
      </div>

      {/* Progress Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          {testTypes.map((test, index) => {
            const Icon = test.icon;
            const isCompleted = index < currentTestIndex;
            const isCurrent = index === currentTestIndex;
            
            return (
              <div key={test.id} className="flex items-center flex-1">
                <div className={`flex items-center gap-2 flex-1 ${index !== 0 ? 'ml-2' : ''}`}>
                  {index !== 0 && (
                    <div className={`flex-1 h-1 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                  <div className={`flex items-center gap-2 ${isCurrent ? 'scale-110' : ''} transition-transform`}>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                          ? `bg-${test.color}-500 text-white`
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className={`text-sm ${isCurrent ? 'font-medium' : 'text-gray-500'}`}>
                      {test.name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Worker Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Test Card */}
          <Card className={`p-6 bg-${currentTest.color}-50 border-2 border-${currentTest.color}-300`}>
            <div className="flex items-center gap-4">
              {(() => {
                const Icon = currentTest.icon;
                return <Icon className={`w-12 h-12 text-${currentTest.color}-600`} />;
              })()}
              <div className="flex-1">
                <h3>{currentTest.name}</h3>
                <p className="text-gray-600 mt-1">
                  Select workers qualified for this test type
                </p>
              </div>
            </div>
          </Card>

          {/* Worker Selection */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3>Available Workers ({availableWorkers.length})</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoDistribute}
                disabled={selectedWorkers.length === 0}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Auto Distribute
              </Button>
            </div>

            <div className="space-y-3">
              {availableWorkers.map((worker) => {
                const isSelected = selectedWorkers.find(w => w.id === worker.id);
                
                return (
                  <Card
                    key={worker.id}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-2 border-blue-500 bg-blue-50'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => toggleWorkerSelection(worker)}
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
                      <div className="flex flex-col gap-2">
                        <Badge className={getStatusColor(worker.status)}>
                          {worker.status}
                        </Badge>
                        <Badge className={getExperienceColor(worker.experienceLevel)}>
                          <Award className="w-3 h-3 mr-1" />
                          {worker.experienceLevel}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-600">
                      Current workload: {worker.currentWorkload} tests
                    </div>
                  </Card>
                );
              })}

              {availableWorkers.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No workers available for this test type</p>
                </div>
              )}
            </div>
          </Card>

          {/* Distribution Section */}
          {selectedWorkers.length > 0 && (
            <Card className="p-6">
              <h3 className="mb-4">Transformer Distribution</h3>
              <div className="space-y-3">
                {selectedWorkers.map((worker) => (
                  <div key={worker.id} className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="font-medium">{worker.name}</p>
                      <p className="text-sm text-gray-500">{worker.workerId}</p>
                    </div>
                    <div className="w-48">
                      <Label className="text-xs">Number of Transformers</Label>
                      <Input
                        type="number"
                        min="0"
                        max={quantity}
                        value={workerCounts[worker.id] || ''}
                        onChange={(e) => {
                          setWorkerCounts({
                            ...workerCounts,
                            [worker.id]: e.target.value,
                          });
                          setDistributionMode('manual');
                        }}
                        className="mt-1"
                        placeholder="0"
                      />
                    </div>
                  </div>
                ))}

                {/* Total Summary */}
                <div className="pt-3 border-t-2 border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Assigned:</span>
                    <span className={`text-lg font-medium ${
                      getTotalAssigned() === quantity ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {getTotalAssigned()} / {quantity}
                    </span>
                  </div>
                  {getTotalAssigned() !== quantity && (
                    <p className="text-sm text-red-600 mt-2">
                      Please assign all {quantity} transformers before continuing
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Summary */}
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
                <p className="text-sm text-gray-500">Transformer</p>
                <p className="font-medium">{orderData.transformer.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Quantity</p>
                <p className="font-medium">{quantity} units</p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-3">Tests Completed</p>
                <div className="space-y-2">
                  {testAssignments.map((assignment, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm">{assignment.testType}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-2">Current Test</p>
                <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                  {currentTest.name}
                </Badge>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-2">Selected Workers</p>
                {selectedWorkers.length > 0 ? (
                  <div className="space-y-2">
                    {selectedWorkers.map(worker => (
                      <div key={worker.id} className="text-sm">
                        <p className="font-medium">{worker.name}</p>
                        <p className="text-gray-500">
                          {workerCounts[worker.id] || 0} transformers
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No workers selected</p>
                )}
              </div>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 mt-4"
                disabled={!isAssignmentValid()}
                onClick={handleNextTest}
              >
                {currentTestIndex < testTypes.length - 1 ? (
                  <>
                    Next Test
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  'Complete Assignment'
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

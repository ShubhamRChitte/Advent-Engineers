import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';

interface TestItem {
  orderNumber: string;
  transformerType: string;
  client: string;
  stage: number;
  assignedWorker: string;
  startDate: string;
  issues: number;
}

export function TestingWorkflow() {
  const testingStages = [
    {
      id: 1,
      name: 'Visual Inspection',
      description: 'Initial visual check for physical damages and manufacturing defects',
      duration: '2-3 hours',
    },
    {
      id: 2,
      name: 'Electrical Testing',
      description: 'Comprehensive electrical tests including insulation, winding resistance, and voltage ratio',
      duration: '4-6 hours',
    },
    {
      id: 3,
      name: 'Performance Testing',
      description: 'Load testing, temperature rise test, and efficiency measurements',
      duration: '6-8 hours',
    },
    {
      id: 4,
      name: 'Final Quality Control',
      description: 'Final inspection, documentation, and approval for dispatch',
      duration: '1-2 hours',
    },
  ];

  const activeTests: TestItem[] = [
    {
      orderNumber: 'ORD-2025-001',
      transformerType: 'Dead Tank Type-1',
      client: 'PowerGrid Corp',
      stage: 2,
      assignedWorker: 'John Doe',
      startDate: '2025-01-13',
      issues: 0,
    },
    {
      orderNumber: 'ORD-2025-002',
      transformerType: 'Live Tank Type',
      client: 'City Electric Ltd',
      stage: 3,
      assignedWorker: 'Mike Johnson',
      startDate: '2025-01-12',
      issues: 1,
    },
    {
      orderNumber: 'ORD-2025-005',
      transformerType: 'Outdoor ERC',
      client: 'Industrial Solutions',
      stage: 1,
      assignedWorker: 'Alex Turner',
      startDate: '2025-01-14',
      issues: 0,
    },
  ];

  const stageStats = [
    { stage: 'Visual Inspection', count: 8, color: 'blue' },
    { stage: 'Electrical Testing', count: 12, color: 'purple' },
    { stage: 'Performance Testing', count: 6, color: 'orange' },
    { stage: 'Final QC', count: 10, color: 'green' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2>Testing Workflow</h2>
        <p className="text-gray-500 mt-1">4-Stage transformer testing process and current status</p>
      </div>

      {/* Stage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stageStats.map((stat, idx) => (
          <Card key={idx} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Stage {idx + 1}</p>
                <h3 className="mt-2">{stat.count}</h3>
                <p className="text-xs text-gray-500 mt-1">active tests</p>
              </div>
              <div className={`w-12 h-12 rounded-full bg-${stat.color}-50 flex items-center justify-center`}>
                <span className={`text-${stat.color}-600`}>{idx + 1}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Testing Stages */}
      <Card className="p-6">
        <h3 className="mb-6">Testing Process Overview</h3>
        <div className="space-y-6">
          {testingStages.map((stage, idx) => (
            <div key={stage.id} className="relative">
              {idx < testingStages.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200" />
              )}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 relative z-10">
                    {stage.id}
                  </div>
                </div>
                <div className="flex-1 pb-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4>{stage.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{stage.description}</p>
                    </div>
                    <Badge variant="outline" className="ml-4">
                      <Clock className="w-3 h-3 mr-1" />
                      {stage.duration}
                    </Badge>
                  </div>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-2">Currently in this stage:</p>
                    <div className="flex flex-wrap gap-2">
                      {activeTests
                        .filter(test => test.stage === stage.id)
                        .map(test => (
                          <Badge key={test.orderNumber} className="bg-white">
                            {test.orderNumber}
                          </Badge>
                        ))}
                      {activeTests.filter(test => test.stage === stage.id).length === 0 && (
                        <span className="text-sm text-gray-400">No active tests</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Active Tests */}
      <Card className="p-6">
        <h3 className="mb-4">Active Tests</h3>
        <div className="space-y-4">
          {activeTests.map((test) => (
            <div key={test.orderNumber} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4>{test.orderNumber}</h4>
                  <p className="text-sm text-gray-500">{test.transformerType} - {test.client}</p>
                </div>
                {test.issues > 0 && (
                  <Badge className="bg-yellow-100 text-yellow-700">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {test.issues} issue{test.issues > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500">Progress</span>
                  <span>Stage {test.stage} of 4</span>
                </div>
                <div className="flex gap-2">
                  {testingStages.map((stage) => {
                    const isCompleted = stage.id < test.stage;
                    const isCurrent = stage.id === test.stage;
                    
                    return (
                      <div key={stage.id} className="flex-1">
                        <div className={`h-2 rounded ${
                          isCompleted ? 'bg-green-500' :
                          isCurrent ? 'bg-blue-500' :
                          'bg-gray-200'
                        }`} />
                        <div className="flex items-center gap-1 mt-2">
                          {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                          {isCurrent && <Circle className="w-4 h-4 text-blue-500 animate-pulse" />}
                          {!isCompleted && !isCurrent && <Circle className="w-4 h-4 text-gray-300" />}
                          <span className="text-xs text-gray-500">{stage.id}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Assigned Worker</p>
                  <p className="mt-1">{test.assignedWorker}</p>
                </div>
                <div>
                  <p className="text-gray-500">Start Date</p>
                  <p className="mt-1">{new Date(test.startDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

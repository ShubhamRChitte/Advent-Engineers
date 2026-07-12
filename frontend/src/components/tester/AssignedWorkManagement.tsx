import { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { 
  ClipboardCheck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Calendar,
  Package,
  AlertCircle,
  Zap
} from 'lucide-react';

interface AssignedWork {
  id: string;
  orderId: string;
  jobId: string;
  clientName: string;
  transformerType: string;
  voltage: string;
  quantity: number;
  cores: number;
  assignedDate: string;
  assignedBy: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
}

interface AssignedWorkManagementProps {
  userRole: 'core-tester' | 'secondary-tester' | 'after-primary-tester' | 'final-tester';
  userName: string;
}

export function AssignedWorkManagement({ userRole, userName }: AssignedWorkManagementProps) {
  const [assignedWorks, setAssignedWorks] = useState<AssignedWork[]>([
    {
      id: '1',
      orderId: 'ORD-2025-001',
      jobId: 'JOB-2025-001',
      clientName: 'PowerGrid Corporation',
      transformerType: '11kV Distribution Transformer',
      voltage: '11kV',
      quantity: 10,
      cores: 3,
      assignedDate: '2025-11-20',
      assignedBy: 'Sarah Johnson',
      status: 'Pending',
      priority: 'High',
      dueDate: '2025-11-25'
    },
    {
      id: '2',
      orderId: 'ORD-2025-002',
      jobId: 'JOB-2025-002',
      clientName: 'City Electric Ltd',
      transformerType: '33kV Power Transformer',
      voltage: '33kV',
      quantity: 8,
      cores: 3,
      assignedDate: '2025-11-19',
      assignedBy: 'Sarah Johnson',
      status: 'Pending',
      priority: 'Medium',
      dueDate: '2025-11-26'
    },
    {
      id: '3',
      orderId: 'ORD-2025-003',
      jobId: 'JOB-2025-003',
      clientName: 'National Grid',
      transformerType: '22kV Distribution Transformer',
      voltage: '22kV',
      quantity: 12,
      cores: 3,
      assignedDate: '2025-11-18',
      assignedBy: 'Sarah Johnson',
      status: 'Accepted',
      priority: 'High',
      dueDate: '2025-11-24'
    },
    {
      id: '4',
      orderId: 'ORD-2025-004',
      jobId: 'JOB-2025-004',
      clientName: 'Metro Power',
      transformerType: '66kV Power Transformer',
      voltage: '66kV',
      quantity: 6,
      cores: 3,
      assignedDate: '2025-11-17',
      assignedBy: 'Sarah Johnson',
      status: 'Rejected',
      priority: 'Low',
      dueDate: '2025-11-28'
    },
    {
      id: '5',
      orderId: 'ORD-2025-005',
      jobId: 'JOB-2025-005',
      clientName: 'Industrial Solutions Inc',
      transformerType: '11kV Distribution Transformer',
      voltage: '11kV',
      quantity: 15,
      cores: 3,
      assignedDate: '2025-11-21',
      assignedBy: 'Sarah Johnson',
      status: 'Pending',
      priority: 'Medium',
      dueDate: '2025-11-27'
    },
  ]);

  const [selectedWork, setSelectedWork] = useState<AssignedWork | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'accept' | 'reject' | null>(null);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Accepted' | 'Rejected'>('All');

  const handleAccept = (work: AssignedWork) => {
    setSelectedWork(work);
    setActionType('accept');
    setIsDialogOpen(true);
  };

  const handleReject = (work: AssignedWork) => {
    setSelectedWork(work);
    setActionType('reject');
    setIsDialogOpen(true);
  };

  const confirmAction = () => {
    if (selectedWork && actionType) {
      setAssignedWorks(prev => 
        prev.map(work => 
          work.id === selectedWork.id 
            ? { ...work, status: actionType === 'accept' ? 'Accepted' : 'Rejected' }
            : work
        )
      );
      setIsDialogOpen(false);
      setSelectedWork(null);
      setActionType(null);
    }
  };

  const getTestingType = () => {
    switch (userRole) {
      case 'core-tester':
        return 'Core Testing';
      case 'secondary-tester':
        return 'Secondary Testing';
      case 'after-primary-tester':
        return 'After Primary Testing';
      case 'final-tester':
        return 'Final Testing';
      default:
        return 'Testing';
    }
  };

  const filteredWorks = filter === 'All' 
    ? assignedWorks 
    : assignedWorks.filter(work => work.status === filter);

  const pendingCount = assignedWorks.filter(w => w.status === 'Pending').length;
  const acceptedCount = assignedWorks.filter(w => w.status === 'Accepted').length;
  const rejectedCount = assignedWorks.filter(w => w.status === 'Rejected').length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Low':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted':
        return 'bg-green-100 text-green-700';
      case 'Rejected':
        return 'bg-red-100 text-red-700';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2>Assigned Work - {getTestingType()}</h2>
        <p className="text-gray-500 mt-1">Review and manage work assigned to you by the Entry Level team</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-blue-700">Total Assigned</p>
              <h3 className="mt-1 text-blue-900">{assignedWorks.length}</h3>
            </div>
            <div className="p-3 bg-blue-500 rounded-lg">
              <ClipboardCheck className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-yellow-700">Pending Review</p>
              <h3 className="mt-1 text-yellow-900">{pendingCount}</h3>
            </div>
            <div className="p-3 bg-yellow-500 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-green-700">Accepted</p>
              <h3 className="mt-1 text-green-900">{acceptedCount}</h3>
            </div>
            <div className="p-3 bg-green-500 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-red-700">Rejected</p>
              <h3 className="mt-1 text-red-900">{rejectedCount}</h3>
            </div>
            <div className="p-3 bg-red-500 rounded-lg">
              <XCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Card className="p-4">
        <div className="flex gap-2">
          {(['All', 'Pending', 'Accepted', 'Rejected'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
              className={filter === status ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {status}
              {status !== 'All' && (
                <Badge className="ml-2 bg-white text-gray-900">
                  {status === 'Pending' ? pendingCount : status === 'Accepted' ? acceptedCount : rejectedCount}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </Card>

      {/* Assigned Work List */}
      <div className="space-y-4">
        {filteredWorks.map((work) => (
          <Card key={work.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              {/* Header Row */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    work.priority === 'High' ? 'bg-red-100' :
                    work.priority === 'Medium' ? 'bg-yellow-100' : 'bg-green-100'
                  }`}>
                    <Zap className={`w-6 h-6 ${
                      work.priority === 'High' ? 'text-red-600' :
                      work.priority === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3>{work.jobId}</h3>
                      <Badge className={getPriorityColor(work.priority)}>
                        {work.priority} Priority
                      </Badge>
                      <Badge className={getStatusColor(work.status)}>
                        {work.status}
                      </Badge>
                    </div>
                    <p className="text-gray-600">{work.clientName}</p>
                  </div>
                </div>
                
                {work.status === 'Pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 gap-2"
                      onClick={() => handleAccept(work)}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-600 text-red-600 hover:bg-red-50 gap-2"
                      onClick={() => handleReject(work)}
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Transformer Type</p>
                  <p className="text-sm font-medium">{work.transformerType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Voltage</p>
                  <p className="text-sm font-medium">{work.voltage}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Quantity</p>
                  <p className="text-sm font-medium">{work.quantity} units</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Cores per Unit</p>
                  <p className="text-sm font-medium">{work.cores} cores</p>
                </div>
              </div>

              {/* Footer Info */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Assigned by: <span className="font-medium">{work.assignedBy}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Assigned: <span className="font-medium">{work.assignedDate}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>Due Date: <span className="font-medium">{work.dueDate}</span></span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredWorks.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-gray-900 mb-2">No Work Found</h3>
            <p className="text-gray-500">
              {filter === 'All' 
                ? 'You have no assigned work at the moment.'
                : `You have no ${filter.toLowerCase()} work.`}
            </p>
          </div>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'accept' ? 'Accept Assigned Work?' : 'Reject Assigned Work?'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedWork && (
              <>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Job ID:</span>
                    <span className="text-sm font-medium">{selectedWork.jobId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Client:</span>
                    <span className="text-sm font-medium">{selectedWork.clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Quantity:</span>
                    <span className="text-sm font-medium">{selectedWork.quantity} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Test Type:</span>
                    <span className="text-sm font-medium">{getTestingType()}</span>
                  </div>
                </div>

                {actionType === 'accept' ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-900">
                          By accepting this work, you confirm that:
                        </p>
                        <ul className="text-sm text-green-700 mt-2 space-y-1 list-disc list-inside">
                          <li>You have the capacity to complete this testing</li>
                          <li>You will perform {getTestingType().toLowerCase()} on all {selectedWork.quantity} units</li>
                          <li>The work will be started and tracked in your queue</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-900">
                          By rejecting this work, you confirm that:
                        </p>
                        <ul className="text-sm text-red-700 mt-2 space-y-1 list-disc list-inside">
                          <li>You cannot take on this testing assignment</li>
                          <li>The Entry Level team will be notified</li>
                          <li>This work will be reassigned to another testing engineer</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={confirmAction}
                    className={actionType === 'accept' 
                      ? 'flex-1 bg-green-600 hover:bg-green-700' 
                      : 'flex-1 bg-red-600 hover:bg-red-700'}
                  >
                    {actionType === 'accept' ? 'Confirm Accept' : 'Confirm Reject'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { toast } from 'sonner@2.0.3';
import { CheckCircle2 } from 'lucide-react';

interface Order {
  jobId: string;
  client: string;
  cores: number;
  assignedCores: number;
}

export function AssignCoresForTesting() {
  const [orders] = useState<Order[]>([
    { jobId: 'JOB-2025-001', client: 'PowerGrid Corporation', cores: 3, assignedCores: 0 },
    { jobId: 'JOB-2025-002', client: 'City Electric Ltd', cores: 2, assignedCores: 0 },
    { jobId: 'JOB-2025-003', client: 'National Grid', cores: 4, assignedCores: 2 },
  ]);

  const [selectedOrder, setSelectedOrder] = useState('');
  const [assignments, setAssignments] = useState<{ [key: string]: string }>({});

  const vendors = ['ABC Cores Ltd', 'XYZ Transformers', 'Premium Core Co'];

  const handleAssign = () => {
    if (!selectedOrder) {
      toast.error('Please select an order first');
      return;
    }

    const order = orders.find(o => o.jobId === selectedOrder);
    if (!order) return;

    const assignedCount = Object.keys(assignments).length;
    if (assignedCount === 0) {
      toast.error('Please assign at least one core');
      return;
    }

    toast.success(`Successfully assigned ${assignedCount} cores to ${selectedOrder}`);
    setSelectedOrder('');
    setAssignments({});
  };

  const selectedOrderData = orders.find(o => o.jobId === selectedOrder);

  return (
    <div className="space-y-6">
      <div>
        <h2>Assign Cores for Testing</h2>
        <p className="text-gray-500 mt-1">Assign vendor cores to orders for testing</p>
      </div>

      {/* Order Selection */}
      <Card className="p-6">
        <h3 className="mb-4">Select Order</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Job ID</Label>
            <Select value={selectedOrder} onValueChange={setSelectedOrder}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select order" />
              </SelectTrigger>
              <SelectContent>
                {orders.map((order) => (
                  <SelectItem key={order.jobId} value={order.jobId}>
                    {order.jobId} - {order.client}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedOrderData && (
            <div className="flex items-end">
              <div className="bg-blue-50 border border-blue-200 rounded p-3 w-full">
                <p className="text-sm text-blue-700">
                  Cores Required: {selectedOrderData.cores} | 
                  Assigned: {selectedOrderData.assignedCores} | 
                  Pending: {selectedOrderData.cores - selectedOrderData.assignedCores}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Core Assignment */}
      {selectedOrderData && (
        <Card className="p-6">
          <h3 className="mb-4">Assign Cores</h3>
          <div className="space-y-4">
            {Array.from({ length: selectedOrderData.cores }, (_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600">C{i + 1}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <Label>Core {i + 1} - Select Vendor</Label>
                  <Select
                    value={assignments[`core-${i}`] || ''}
                    onValueChange={(value) => setAssignments({ ...assignments, [`core-${i}`]: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor} value={vendor}>
                          {vendor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {assignments[`core-${i}`] && (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t">
            <Button onClick={handleAssign} className="bg-red-600 hover:bg-red-700">
              Assign Cores for Testing
            </Button>
          </div>
        </Card>
      )}

      {/* Pending Orders */}
      <Card className="p-6">
        <h3 className="mb-4">Pending Assignments</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left p-3 text-sm">Job ID</th>
                <th className="text-left p-3 text-sm">Client</th>
                <th className="text-center p-3 text-sm">Total Cores</th>
                <th className="text-center p-3 text-sm">Assigned</th>
                <th className="text-center p-3 text-sm">Pending</th>
                <th className="text-left p-3 text-sm">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.jobId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium">{order.jobId}</td>
                  <td className="p-3">{order.client}</td>
                  <td className="p-3 text-center">{order.cores}</td>
                  <td className="p-3 text-center">{order.assignedCores}</td>
                  <td className="p-3 text-center">{order.cores - order.assignedCores}</td>
                  <td className="p-3">
                    <Badge className={
                      order.assignedCores === order.cores
                        ? 'bg-green-100 text-green-700'
                        : order.assignedCores > 0
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }>
                      {order.assignedCores === order.cores
                        ? 'Complete'
                        : order.assignedCores > 0
                        ? 'Partial'
                        : 'Pending'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

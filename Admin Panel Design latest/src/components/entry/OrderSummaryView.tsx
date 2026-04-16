import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  CheckCircle2,
  Package,
  Calendar,
  ClipboardCheck,
  Download,
  Printer,
} from 'lucide-react';

interface WorkerAssignment {
  worker: {
    id: string;
    name: string;
    workerId: string;
  };
  transformerCount: number;
}

interface TestAssignment {
  testType: string;
  workers: WorkerAssignment[];
}

interface OrderSummaryViewProps {
  orderData: any;
  testAssignments: TestAssignment[];
  allVendors: any[];
  onSaveOrder: () => void;
}

export function OrderSummaryView({ orderData, testAssignments, onSaveOrder }: OrderSummaryViewProps) {
  // Safe Access for Entry Operator (flat) vs Admin (nested)
  const quantity = orderData.quantity
    ? (typeof orderData.quantity === 'string' ? parseInt(orderData.quantity) : orderData.quantity)
    : (orderData.transformer?.quantity ? parseInt(orderData.transformer.quantity) : 1);

  const transformerName = orderData.transformerName || orderData.transformer?.name || 'N/A';
  const transformerType = orderData.transformerType || orderData.transformer?.type || 'N/A';
  const capacity = orderData.capacity || orderData.transformer?.capacity || 'N/A';
  const voltageRating = orderData.voltageRating || orderData.transformer?.voltageRating || 'N/A';
  const phase = orderData.phase || orderData.transformer?.phase || 'N/A';
  const serialNumber = orderData.serialNumber || orderData.transformer?.serialNumber || 'N/A';
  const numberOfCores = orderData.numberOfCores || 1;

  const getTestColor = (testType: string) => {
    if (testType.includes('Core')) return 'bg-blue-100 text-blue-700 border-blue-300';
    if (testType.includes('Secondary')) return 'bg-purple-100 text-purple-700 border-purple-300';
    if (testType.includes('Primary')) return 'bg-orange-100 text-orange-700 border-orange-300';
    if (testType.includes('Final')) return 'bg-green-100 text-green-700 border-green-300';
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2>Order Summary</h2>
          <p className="text-gray-500 mt-1">Review all details before saving the order</p>
        </div>
        <div className="flex gap-2">
          {/* Buttons removed as requested */}
        </div>
      </div>

      {/* Success Banner */}
      <Card className="p-6 bg-green-50 border-2 border-green-300">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-green-900">All Tests Successfully Assigned!</h3>
            <p className="text-green-700 mt-1">
              All {quantity} transformers have been assigned to workers for all 4 testing phases
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Information */}
          <Card className="p-6">
            <h3 className="mb-4 pb-3 border-b-2 border-gray-200">Order Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Order Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="font-medium">{orderData.orderDate}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Client Name</p>
                <p className="font-medium">{orderData.clientName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Client Contact</p>
                <p className="font-medium">{orderData.clientContact}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">IS Standard</p>
                <p className="font-medium">{orderData.isStandard || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Quantity</p>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-400" />
                  <p className="font-medium">{quantity} units</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Transformer Details */}
          <Card className="p-6">
            <h3 className="mb-4 pb-3 border-b-2 border-gray-200">Transformer Details</h3>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Transformer Type</p>
                <p className="font-medium text-lg">{transformerName}</p>
                <p className="text-sm text-gray-600 mt-1">{transformerType}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-gray-500">Voltage</p>
                  <p className="font-medium">{voltageRating}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Number of Cores</p>
                  <p className="font-medium">{numberOfCores}</p>
                </div>
              </div>

              {/* Core Configuration */}
              {orderData.coreTypes && orderData.coreTypes.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-2">Core Configuration</p>
                  <div className="flex gap-2 flex-wrap">
                    {(orderData.coreConfigs || orderData.coreTypes).map((config: any, index: number) => {
                      const type = typeof config === 'string' ? config : config.coreType;
                      const accuracy = typeof config === 'string' ? 'N/A' : (config.accuracyClass || 'N/A');
                      return (
                        <Badge key={index} variant="outline" className="flex flex-col items-start gap-1 p-2 h-auto">
                          <span className="font-bold">Core {index + 1}: {type.toUpperCase()}</span>
                          <span className="text-xs text-gray-500">Class: {accuracy}</span>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Parameters */}
          <Card className="p-6">
            <h3 className="mb-4 pb-3 border-b-2 border-gray-200">Transformer Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orderData.parameters.nominalVoltage && (
                <div>
                  <p className="text-sm text-gray-500">Nominal System Voltage</p>
                  <p className="font-medium">{orderData.parameters.nominalVoltage}</p>
                </div>
              )}
              {orderData.parameters.burden && (
                <div>
                  <p className="text-sm text-gray-500">Burden</p>
                  <p className="font-medium">{orderData.parameters.burden}</p>
                </div>
              )}
              {orderData.parameters.ratedPrimaryCurrent && (
                <div>
                  <p className="text-sm text-gray-500">Rated Primary Current</p>
                  <p className="font-medium">{orderData.parameters.ratedPrimaryCurrent}</p>
                </div>
              )}
              {orderData.parameters.ratedSecondaryCurrent && (
                <div>
                  <p className="text-sm text-gray-500">Rated Secondary Current</p>
                  <p className="font-medium">{orderData.parameters.ratedSecondaryCurrent}</p>
                </div>
              )}
              {orderData.parameters.mountingDetails && (
                <div>
                  <p className="text-sm text-gray-500">Mounting Details</p>
                  <p className="font-medium">{orderData.parameters.mountingDetails}</p>
                </div>
              )}
              {orderData.parameters.overallDimensions && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Overall Dimensions</p>
                  <p className="font-medium">{orderData.parameters.overallDimensions}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Selected Vendors */}
          {(orderData.coreVendors?.metering?.length > 0 ||
            orderData.coreVendors?.protection?.length > 0 ||
            orderData.coreVendors?.ps?.length > 0) && (
              <Card className="p-6">
                <h3 className="mb-4 pb-3 border-b-2 border-gray-200">Core Vendors</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {orderData.coreVendors?.metering?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Metering Core Vendors</p>
                      <div className="flex flex-wrap gap-2">
                        {orderData.coreVendors.metering.map((v: any, index: number) => (
                          <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 h-auto">
                            {v.serialNo} - {v.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {orderData.coreVendors?.protection?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Protection Core Vendors</p>
                      <div className="flex flex-wrap gap-2">
                        {orderData.coreVendors.protection.map((v: any, index: number) => (
                          <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200 h-auto">
                            {v.serialNo} - {v.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {orderData.coreVendors?.ps?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">PS Core Vendors</p>
                      <div className="flex flex-wrap gap-2">
                        {orderData.coreVendors.ps.map((v: any, index: number) => (
                          <Badge key={index} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 h-auto">
                            {v.serialNo} - {v.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

          {/* Test Assignments */}
          <Card className="p-6">
            <h3 className="mb-4 pb-3 border-b-2 border-gray-200">Test Assignments</h3>
            <div className="space-y-4">
              {testAssignments.map((assignment, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-3 bg-gray-50 rounded-r-lg">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className={getTestColor(assignment.testType)}>
                      <ClipboardCheck className="w-3 h-3 mr-1" />
                      {assignment.testType}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {assignment.workers.length} worker{assignment.workers.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {assignment.workers.map((workerAssignment, wIndex) => (
                      <div key={wIndex} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {workerAssignment.worker.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium">{workerAssignment.worker.name}</p>
                            <p className="text-sm text-gray-500">{workerAssignment.worker.workerId}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{workerAssignment.transformerCount}</p>
                          <p className="text-sm text-gray-500">transformers</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column - Action Card */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-6">
            <h3 className="mb-4">Quick Summary</h3>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Transformers</p>
                <p className="text-2xl font-bold text-blue-600">{quantity}</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Tests Assigned</p>
                <p className="text-2xl font-bold text-green-600">{testAssignments.length}/4</p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Workers</p>
                <p className="text-2xl font-bold text-purple-600">
                  {testAssignments.reduce((sum, t) => sum + t.workers.length, 0)}
                </p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-2">Order Status</p>
                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                  Pending Confirmation
                </Badge>
              </div>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 h-12"
                onClick={onSaveOrder}
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Save Order
              </Button>

              <p className="text-xs text-gray-500 text-center">
                By saving, you confirm all details are correct and workers will be notified
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

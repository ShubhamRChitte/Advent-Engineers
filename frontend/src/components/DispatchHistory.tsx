import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Truck, MapPin, Calendar, Package, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

interface Dispatch {
  id: string;
  orderNumber: string;
  client: string;
  transformerType: string;
  quantity: number;
  dispatchDate: string;
  deliveryDate: string;
  destination: string;
  driverName: string;
  vehicleNumber: string;
  status: 'dispatched' | 'in-transit' | 'delivered' | 'delayed';
  trackingNumber: string;
}

export function DispatchHistory() {
  const dispatches: Dispatch[] = [
    {
      id: '1',
      orderNumber: 'ORD-2025-003',
      client: 'National Grid',
      transformerType: 'Dead Tank Type-2',
      quantity: 8,
      dispatchDate: '2025-01-12',
      deliveryDate: '2025-01-14',
      destination: 'New York, NY',
      driverName: 'Robert Smith',
      vehicleNumber: 'TRK-4567',
      status: 'delivered',
      trackingNumber: 'TRK-2025-0012',
    },
    {
      id: '2',
      orderNumber: 'ORD-2024-089',
      client: 'PowerGrid Corp',
      transformerType: 'Live Tank Type',
      quantity: 5,
      dispatchDate: '2025-01-13',
      deliveryDate: '2025-01-15',
      destination: 'Boston, MA',
      driverName: 'James Wilson',
      vehicleNumber: 'TRK-4568',
      status: 'in-transit',
      trackingNumber: 'TRK-2025-0013',
    },
    {
      id: '3',
      orderNumber: 'ORD-2024-092',
      client: 'City Electric Ltd',
      transformerType: 'Indoor ERC',
      quantity: 10,
      dispatchDate: '2025-01-11',
      deliveryDate: '2025-01-13',
      destination: 'Chicago, IL',
      driverName: 'Michael Brown',
      vehicleNumber: 'TRK-4569',
      status: 'delivered',
      trackingNumber: 'TRK-2025-0011',
    },
    {
      id: '4',
      orderNumber: 'ORD-2024-095',
      client: 'Metro Power',
      transformerType: 'Outdoor ERC',
      quantity: 6,
      dispatchDate: '2025-01-14',
      deliveryDate: '2025-01-16',
      destination: 'Philadelphia, PA',
      driverName: 'David Johnson',
      vehicleNumber: 'TRK-4570',
      status: 'dispatched',
      trackingNumber: 'TRK-2025-0014',
    },
    {
      id: '5',
      orderNumber: 'ORD-2024-088',
      client: 'Industrial Solutions',
      transformerType: 'Dead Tank Type-1',
      quantity: 4,
      dispatchDate: '2025-01-10',
      deliveryDate: '2025-01-13',
      destination: 'Washington, DC',
      driverName: 'Thomas Anderson',
      vehicleNumber: 'TRK-4571',
      status: 'delayed',
      trackingNumber: 'TRK-2025-0010',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'dispatched': return 'bg-blue-100 text-blue-700';
      case 'in-transit': return 'bg-yellow-100 text-yellow-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'delayed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const stats = [
    { label: 'Total Dispatches', value: dispatches.length, color: 'blue' },
    { label: 'Delivered', value: dispatches.filter(d => d.status === 'delivered').length, color: 'green' },
    { label: 'In Transit', value: dispatches.filter(d => d.status === 'in-transit').length, color: 'yellow' },
    { label: 'Delayed', value: dispatches.filter(d => d.status === 'delayed').length, color: 'red' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2>Dispatch History</h2>
        <p className="text-gray-500 mt-1">Track all transformer deliveries and shipments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-6">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <h3 className={`mt-2 text-${stat.color}-600`}>{stat.value}</h3>
          </Card>
        ))}
      </div>

      {/* Dispatch List */}
      <div className="space-y-4">
        {dispatches.map((dispatch) => (
          <Card key={dispatch.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-red-50 rounded-lg">
                    <Truck className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3>{dispatch.orderNumber}</h3>
                    <p className="text-sm text-gray-500">{dispatch.trackingNumber}</p>
                  </div>
                  <Badge className={getStatusColor(dispatch.status)}>
                    {dispatch.status.replace('-', ' ')}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Client</p>
                    <p className="mt-1">{dispatch.client}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Transformer Type</p>
                    <p className="mt-1">{dispatch.transformerType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Quantity</p>
                    <p className="mt-1">{dispatch.quantity} units</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Destination</p>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{dispatch.destination}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Dispatched: {new Date(dispatch.dispatchDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Truck className="w-4 h-4" />
                    <span>Driver: {dispatch.driverName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Package className="w-4 h-4" />
                    <span>Vehicle: {dispatch.vehicleNumber}</span>
                  </div>
                </div>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Dispatch Details - {dispatch.trackingNumber}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4>Order Information</h4>
                        <Badge className={getStatusColor(dispatch.status)}>
                          {dispatch.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Order Number</p>
                          <p className="mt-1">{dispatch.orderNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Tracking Number</p>
                          <p className="mt-1">{dispatch.trackingNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Client</p>
                          <p className="mt-1">{dispatch.client}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Transformer Type</p>
                          <p className="mt-1">{dispatch.transformerType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Quantity</p>
                          <p className="mt-1">{dispatch.quantity} units</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Destination</p>
                          <p className="mt-1">{dispatch.destination}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="mb-4">Shipping Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Dispatch Date</p>
                          <p className="mt-1">{new Date(dispatch.dispatchDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Expected Delivery</p>
                          <p className="mt-1">{new Date(dispatch.deliveryDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Driver Name</p>
                          <p className="mt-1">{dispatch.driverName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Vehicle Number</p>
                          <p className="mt-1">{dispatch.vehicleNumber}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="mb-4">Tracking Timeline</h4>
                      <div className="space-y-3">
                        {[
                          { status: 'Order Prepared', date: dispatch.dispatchDate, completed: true },
                          { status: 'Dispatched', date: dispatch.dispatchDate, completed: true },
                          { status: 'In Transit', date: dispatch.dispatchDate, completed: dispatch.status !== 'dispatched' },
                          { status: 'Delivered', date: dispatch.deliveryDate, completed: dispatch.status === 'delivered' },
                        ].map((step, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full ${
                              step.completed ? 'bg-green-500' : 'bg-gray-300'
                            }`} />
                            <div className="flex-1">
                              <p className={step.completed ? '' : 'text-gray-400'}>{step.status}</p>
                              <p className="text-sm text-gray-500">{new Date(step.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

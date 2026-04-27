import { useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import axios from 'axios';
import {
  Package,
  Clock,
  ChevronRight,
  Zap,
  Shield
} from 'lucide-react';


// const backendURL = process.env.REACT_APP_BACKEND_URL;


export interface CoreTypeConfig {
  type: 'Metering' | 'PS' | 'Protection';
}

export interface CoreTestingOrder {
  _id?: string;
  id?: string;
  orderId?: string; // Some views might populate this or mainOrderId
  mainOrderId?: string;
  jobId: string;
  clientName: string;
  transformerName: string;
  transformerType: string;
  quantity?: number; // Matches API
  transformerQuantity?: number; // Legacy/Frontend alias
  coreDetails?: any[]; // Matches API
  coreConfiguration?: CoreTypeConfig[]; // Legacy
  deadline: string;
  assignedDate?: string;
  assignedBy?: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Core Testing In Progress' | 'Pending Approval';
  approved?: boolean;
  instructions?: string;
  assignedUnitIds?: string[]; // Granular visibility: specific Transformer IDs assigned to user
  [key: string]: any; // Allow loose typing to prevent crashes on extra fields
}

interface CoreTestingOrdersProps {
  onStartTesting: (order: CoreTestingOrder) => void;
  user?: any;
  type?: 'active' | 'history';
}

export function CoreTestingOrders({ onStartTesting, user: _user, type = 'active' }: CoreTestingOrdersProps) {




  const [orders, setOrders] = useState<CoreTestingOrder[]>([]);



  useEffect(() => {
    axios
      .get("http://localhost:5001/api/assigneed_orders", {
        params: { type },
        withCredentials: true
      })
      .then((res) => {
        setOrders(res.data);
      })
      .catch((err) => {
        console.error("API ERROR:", err);
      });
  }, []);





  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-700';
      case 'Medium':
        return 'bg-orange-100 text-orange-700';
      case 'Low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-700';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'In Progress':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getCoreTypeIcon = (type: string) => {
    if (!type) return null;
    const lowerType = type.toLowerCase();
    switch (lowerType) {
      case 'metering':
        return <Zap className="w-3 h-3" />;
      case 'ps':
        return <Shield className="w-3 h-3" />;
      case 'protection':
        return <Shield className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getCoreTypeColor = (type: string) => {
    if (!type) return 'bg-gray-50 text-gray-700';
    const lowerType = type.toLowerCase();
    switch (lowerType) {
      case 'metering':
        return 'bg-purple-50 text-purple-700';
      case 'ps':
        return 'bg-blue-50 text-blue-700';
      case 'protection':
        return 'bg-orange-50 text-orange-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  // Hide orders that are strictly meant to be in the completed tab (approved === true)
  const activeOrders = orders.filter(o => !o.approved);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Active Core Testing Orders</h2>
        <p className="text-sm text-gray-600 mt-1">{activeOrders.length} active orders pending testing</p>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {activeOrders.map((order) => {
          const isStarted = order.status?.includes('In Progress');

          return (
            <Card key={order._id} className="p-4 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-[#003a70]">Active</p>
                    </div>
                    <p className="text-sm text-gray-600">{order.clientName}</p>
                    <p className="text-sm text-gray-600">{order.jobId}</p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-[#003a70] hover:bg-[#002850] gap-1 shrink-0"
                    onClick={() => onStartTesting(order)}
                    disabled={order.approved}
                  >
                    {isStarted ? 'Continue' : 'Start'}
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-4 gap-4 text-sm border-t pt-3">
                  <div>
                    <p className="text-xs text-gray-500">Transformer</p>
                    <p className="text-gray-900 mt-0.5">{order.transformerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">
                      {order.assignedUnitIds?.length ? 'Assigned Qty' : 'Quantity'}
                    </p>
                    <p className="text-gray-900 mt-0.5">
                      {order.assignedUnitIds?.length || order.quantity} units
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Cores</p>
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {/* {order.coreConfiguration.map((config, idx) => (
                      <Badge key={idx} className={`${getCoreTypeColor(config.type)} text-xs px-1.5 py-0 gap-1`}>
                        {getCoreTypeIcon(config.type)}
                        {config.type}
                      </Badge>
                    ))} */}



                      {order.coreDetails?.filter(core => core.coreType && core.coreType.toLowerCase() !== 'none' && core.coreType.toLowerCase() !== 'n/a').map((core, idx) => (
                        <Badge
                          key={idx}
                          className={`${getCoreTypeColor(core.coreType)} text-xs px-1.5 py-0 gap-1`}
                        >
                          {getCoreTypeIcon(core.coreType)}
                          {core.coreType}
                        </Badge>
                      ))}




                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Order Date</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span>{new Date(order.createdAt || order.assignedDate || order.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                {order.instructions && 
                 order.instructions.toLowerCase() !== 'none' && 
                 order.instructions.toLowerCase() !== 'n/a' && (
                  <div className="bg-blue-50 rounded p-2 border-l-2 border-blue-400">
                    <p className="text-xs text-gray-700">{order.instructions}</p>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {activeOrders.length === 0 && (
        <Card className="p-8">
          <div className="text-center text-gray-500">
            <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No orders assigned</p>
          </div>
        </Card>
      )}
    </div>
  );
}

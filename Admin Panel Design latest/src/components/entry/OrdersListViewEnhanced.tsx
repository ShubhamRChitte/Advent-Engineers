import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { OrderDetailView } from './OrderDetailView';
import { OrderStatusTracker } from '../order/OrderStatusTracker';
import { toast } from 'sonner';
import {
  Search,
  Eye,
  CheckCircle,
  Calendar,
  Package,
  User,
  Filter,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import '../../styles/animations.css';

interface Order {
  _id: string;
  orderId: string;
  clientName: string;
  clientContactNo?: string;
  transformerName: string;
  transformerType: string;
  quantity: number;
  createdAt: string; 
  status: string;
  priority: string;
  currentStage: string;
  deadline?: string;
  
  // Technical Specs
  noOfCores?: number;
  coreDetails?: any[];
  primaryCurrents?: string[];
  nominalSystemVoltage?: number;
  burden?: number;
  stc?: string;
  voltageRating?: string;
  ratedPrimaryVoltage?: string;
  ratedSecondaryVoltage?: string;
  indoorOutdoor?: string;
  insulationType?: string;
  tankType?: string;
  isStandard?: string;
  images?: any[];
  coreVendors?: {
    metering?: Array<{ serialNo: number; name: string }>;
    protection?: Array<{ serialNo: number; name: string }>;
    ps?: Array<{ serialNo: number; name: string }>;
  };
}

interface OrdersListViewEnhancedProps {
  onViewOrder?: (order: Order) => void;
  onEditOrder?: (order: Order) => void;
  userRole?: string;
  initialOrderId?: string | null;
  onClearNav?: () => void;
}

export function OrdersListViewEnhanced({ userRole, initialOrderId, onClearNav, onEditOrder }: OrdersListViewEnhancedProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedOrder, _setSelectedOrder] = useState<Order | null>(null);
  
  // True when we know we need to restore from sessionStorage — prevents the Orders List flash
  const [isRestoring, setIsRestoring] = useState<boolean>(
    () => !!sessionStorage.getItem('admin_selectedOrderId')
  );

  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);
  const scrollAttempted = useRef(false);

  const setSelectedOrder = (order: Order | null) => {
    _setSelectedOrder(order);
    if (order) {
      sessionStorage.setItem('admin_selectedOrderId', order._id);
    } else {
      sessionStorage.removeItem('admin_selectedOrderId');
    }
  };

  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/admin/orders`, {
        withCredentials: true
      });
      const mappedOrders = response.data.map((order: any) => ({
        ...order,
        orderId: order.jobId || order.orderId || 'N/A'
      }));
      setOrders(mappedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (orderId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this order? All associated transformer units will also be deleted.")) return;

    try {
      const response = await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/orders/${orderId}`, {
        withCredentials: true
      });
      if (response.data.success) {
        toast.success("Order deleted successfully");
        fetchOrders();
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Restore selected order after returning from report page
  useEffect(() => {
    const savedId = sessionStorage.getItem('admin_selectedOrderId');
    if (savedId && orders.length > 0) {
      const match = orders.find(o => o._id === savedId);
      if (match) {
        sessionStorage.removeItem('admin_selectedOrderId');
        _setSelectedOrder(match);
      }
      // Whether we found a match or not, we're done restoring
      setIsRestoring(false);
    } else if (!savedId) {
      setIsRestoring(false);
    }
  }, [orders]);

  // Handle auto-scroll and highlight when navigating from notifications
  useEffect(() => {
    if (initialOrderId && orders.length > 0 && !scrollAttempted.current) {
      const targetOrder = orders.find(o => o._id === initialOrderId);
      if (targetOrder) {
        // Switch to the correct tab if needed (assuming all for now, or match type)
        // If it's a specific order, it likely matches the current filters or is in 'all'
        
        // Wait a tick for rendering
        setTimeout(() => {
          const element = document.getElementById(`order-${initialOrderId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedOrderId(initialOrderId);
            scrollAttempted.current = true;
            
            // Cleanup highlight after 3 seconds
            setTimeout(() => {
              setHighlightedOrderId(null);
              if (onClearNav) onClearNav();
            }, 3000);
          }
        }, 100);
      }
    }
  }, [initialOrderId, orders, onClearNav]);

  const handleApprove = async (orderId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/orders/${orderId}/approve`, {}, {
        withCredentials: true
      });
      if (response.data.success) {
        toast.success("Order Approved & Units Generated");
        fetchOrders();
      }
    } catch (error) {
      console.error("Error approving order:", error);
      toast.error("Failed to approve order");
    }
  };

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const getMappedStatus = (status: string, transformerType?: string) => {
    if (status === 'Core Testing Completed') {
      return 'In Progress';
    }
    if (status === 'PT Testing Completed' || status === 'Final Testing Completed') {
      return 'Completed';
    }
    return status;
  };

  const getStatusColor = (status: string) => {
    const displayStatus = getMappedStatus(status);
    switch (displayStatus) {
      case 'Pending Approval':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Assigned':
      case 'In Progress':
      case 'Core Testing In Progress':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Completed':
      case 'COMPLETED':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const filteredOrders = orders.filter((order) => {
    const orderId = String(order.orderId || '');
    const clientName = String(order.clientName || '');
    const transformerName = String(order.transformerName || '');
    const status = String(order.status || '');

    const q = searchQuery.toLowerCase().trim();
    const normalOrderId = orderId.toLowerCase().replace(/\s+/g, '');
    const normalQuery = q.replace(/\s+/g, '');

    const extractedJobMatch = q.match(/job-?\d{4}-?\d{1,4}/i)?.[0];
    const isTransformerSearch = q.startsWith('tr-') && q.includes(normalOrderId);
    const jobMatch = normalOrderId.includes(normalQuery) ||
      (normalQuery.length > 5 && normalOrderId.length > 0 && normalQuery.includes(normalOrderId)) ||
      (extractedJobMatch && normalOrderId.includes(extractedJobMatch.toLowerCase().replace(/\s+/g, '')));

    const matchesSearch = jobMatch || isTransformerSearch || clientName.toLowerCase().includes(q) || transformerName.toLowerCase().includes(q);

    if (selectedStatus === 'all') return matchesSearch;
    if (selectedStatus === 'Pending') return matchesSearch && status === 'Pending Approval';
    if (selectedStatus === 'In Testing') return matchesSearch && status !== 'Pending Approval' && status !== 'COMPLETED';
    if (selectedStatus === 'Completed') return matchesSearch && (status === 'COMPLETED' || status === 'Completed');
    return matchesSearch && status === selectedStatus;
  });

  const statusCounts = {
    all: orders.length,
    Pending: orders.filter((o) => (o.status || '') === 'Pending Approval').length,
    Assigned: orders.filter((o) => (o.status || '') === 'Assigned' || (o.status || '') === 'In Progress').length,
    'In Testing': orders.filter((o) => (o.status || '').includes('Testing') && !(o.status || '').includes('Completed')).length,
    Completed: orders.filter((o) => (o.status || '').toUpperCase() === 'COMPLETED' || (o.status || '') === 'PT Testing Completed' || (o.status || '') === 'Final Testing Completed').length,
  };

  if (isRestoring) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3 text-gray-400">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm font-medium">Returning to order...</p>
      </div>
    );
  }

  if (selectedOrder) {
    return (
      <OrderDetailView
        order={{
          ...selectedOrder,
          id: selectedOrder._id,
          orderDate: new Date(selectedOrder.createdAt).toLocaleDateString()
        }}
        onBack={() => setSelectedOrder(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Orders List</h2>
          <p className="text-gray-500 mt-1">View and manage all transformer orders with status tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300">
          <p className="text-sm text-gray-600">All Orders</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{statusCounts.all}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedStatus('Pending')}>
          <p className="text-sm text-gray-600">Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-700 mt-1">{statusCounts.Pending}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300">
          <p className="text-sm text-gray-600">Active / Assigned</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{statusCounts.Assigned}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300">
          <p className="text-sm text-gray-600">In Testing</p>
          <p className="text-2xl font-bold text-purple-700 mt-1">{statusCounts['In Testing']}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-300">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{statusCounts.Completed}</p>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            className="pl-10 h-12"
            placeholder="Search by Order ID, Client Name, or Transformer"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'Pending', 'In Testing', 'Completed'].map((status) => (
            <Button
              key={status}
              variant={selectedStatus === status ? 'default' : 'outline'}
              className={selectedStatus === status ? 'bg-blue-600 hover:bg-blue-700' : ''}
              onClick={() => setSelectedStatus(status)}
            >
              <Filter className="w-4 h-4 mr-2" />
              {status === 'all' ? 'All' : status}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4 overflow-x-auto pb-4">
        <div className="min-w-[1200px]">
          {loading ? <div className="text-center py-10 text-gray-400 flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Loading orders...</div> : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="mb-4">
                <TabsList className="bg-gray-100 p-1 rounded-lg">
                  <TabsTrigger value="all" className={`rounded-md px-4 py-2 transition-all ${activeTab === 'all' ? 'bg-white text-blue-700 shadow flex-1' : 'text-gray-500 hover:text-gray-800'}`}>All Types</TabsTrigger>
                  <TabsTrigger value="pt" className={`rounded-md px-4 py-2 transition-all ${activeTab === 'pt' ? 'bg-white text-blue-700 shadow flex-1' : 'text-gray-500 hover:text-gray-800'}`}>PT Orders</TabsTrigger>
                  <TabsTrigger value="ct" className={`rounded-md px-4 py-2 transition-all ${activeTab === 'ct' ? 'bg-white text-blue-700 shadow flex-1' : 'text-gray-500 hover:text-gray-800'}`}>CT Orders</TabsTrigger>
                </TabsList>
              </div>

              {['all', 'pt', 'ct'].map(typeFilter => (
                <TabsContent key={typeFilter} value={typeFilter} className="m-0 space-y-4">
                  {filteredOrders
                    .filter(order => {
                      if (typeFilter === 'all') return true;
                      const type = (order.transformerType || '').toUpperCase();
                      if (typeFilter === 'pt') return type === 'PT';
                      if (typeFilter === 'ct') return type === 'CT';
                      return true;
                    })
                    .map((order) => {
                      const isExpanded = expandedOrders.has(order._id);
                      const isPending = order.status === 'Pending Approval';
                      const isHighlighted = highlightedOrderId === order._id;

                      return (
                        <Card 
                          key={order._id} 
                          id={`order-${order._id}`}
                          className={`overflow-hidden transition-all duration-300 ${isPending ? 'border-l-4 border-l-yellow-400' : ''} ${isHighlighted ? 'animate-highlight-flash shadow-lg ring-2 ring-blue-500' : ''}`}
                        >
                          <div className="p-4 bg-white hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-6 flex-1">
                                <div className="min-w-[150px]">
                                  <p className="text-xs text-gray-500 mb-1">Order ID</p>
                                  <p className="font-mono text-sm font-medium">{order.orderId}</p>
                                </div>

                                <div className="flex items-center gap-2 min-w-[200px]">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <User className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Client</p>
                                    <p className="font-medium text-sm truncate max-w-[180px]" title={order.clientName}>{order.clientName}</p>
                                  </div>
                                </div>

                                <div className="flex-1 min-w-[180px]">
                                  <p className="text-xs text-gray-500 mb-1">Transformer</p>
                                  <p className="font-medium">
                                    {order.transformerName === 'Custom Transformer' ? order.transformerType : order.transformerName}
                                  </p>
                                  {order.transformerName !== order.transformerType && order.transformerName !== 'Custom Transformer' && (
                                    <p className="text-sm text-gray-500">{order.transformerType}</p>
                                  )}
                                </div>

                                <div className="min-w-[80px]">
                                  <p className="text-xs text-gray-500 mb-1">Qty</p>
                                  <div className="flex items-center gap-1">
                                    <Package className="w-4 h-4 text-gray-400" />
                                    <span className="font-medium text-sm">{order.quantity}</span>
                                  </div>
                                </div>

                                <div className="min-w-[120px]">
                                  <p className="text-xs text-gray-500 mb-1">Order Date</p>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm">{new Date(order.createdAt).toLocaleDateString()}</span>
                                  </div>
                                </div>

                                <div className="flex flex-col gap-2 min-w-[140px]">
                                  <Badge className={`w-fit ${getStatusColor(order.status)}`}>
                                    {getMappedStatus(order.status, order.transformerType)}
                                  </Badge>
                                </div>
                              </div>

                              <div className="flex gap-2 min-w-[140px] justify-end">
                                {isPending && (!userRole || userRole === 'admin') && (
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 w-full"
                                    onClick={(e) => handleApprove(order._id, e)}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve
                                  </Button>
                                )}

                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedOrder(order)}
                                    className="gap-1"
                                  >
                                    <Eye className="w-4 h-4" />
                                    View
                                  </Button>
                                  
                                  {(!userRole || userRole === 'admin') && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (onEditOrder) onEditOrder(order);
                                        }}
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={(e) => handleDelete(order._id, e)}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleOrderExpansion(order._id)}
                                  className="gap-1"
                                >
                                  {isExpanded ? (
                                    <><ChevronUp className="w-4 h-4" /> Hide</>
                                  ) : (
                                    <><ChevronDown className="w-4 h-4" /> Show</>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="border-t border-gray-200 p-6 bg-gray-50">
                              <OrderStatusTracker
                                currentStage={order.currentStage as any}
                                orderDate={order.createdAt}
                                expectedCompletion={order.deadline || ''}
                                orderId={order.orderId}
                                transformerType={order.transformerType}
                                status={order.status}
                              />
                            </div>
                          )}
                        </Card>
                      );
                    })}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </div>

      {!loading && filteredOrders.length === 0 && (
        <Card className="p-12 text-center text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>No orders found</p>
          <p className="text-sm mt-1">Try adjusting your search or filter criteria</p>
        </Card>
      )}
    </div>
  );
}

function Loader2(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

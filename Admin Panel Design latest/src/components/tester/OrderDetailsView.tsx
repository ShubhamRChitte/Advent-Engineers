import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  ArrowLeft, 
  Package, 
  Calendar, 
  User, 
  Clock, 
  FileText, 
  AlertCircle,
  Hash,
  Activity,
  Zap,
  Shield,
  Layers,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderDetails {
  _id: string;
  jobId: string;
  clientName: string;
  clientContactNo: string;
  transformerName: string;
  transformerType: string;
  quantity: number;
  ratio: string[];
  noOfCores: number;
  coreDetails: {
    coreType: string;
    accuracyClass: string;
    vendorNo: string;
  }[];
  nominalSystemVoltage: number;
  burden: number;
  deadline: string;
  status: string;
  priority: string;
  instructions: string;
  isStandard: string;
  indoorOutdoor: string;
  insulationType: string;
  tankType: string;
  currentStage: string;
  createdAt: string;
  updatedAt: string;
  ratedPrimaryCurrent?: number;
  ratedSecondaryCurrent?: number;
  primaryCurrents?: string[];
  voltageRating?: string;
  stc?: string;
}

interface OrderDetailsViewProps {
  orderId: string;
  onBack: () => void;
}

export function OrderDetailsView({ orderId, onBack }: OrderDetailsViewProps) {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/orders/${orderId}`, {
          withCredentials: true
        });
        if (response.data.success) {
          setOrder(response.data.data);
        } else {
          toast.error("Order not found");
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
        toast.error("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading order details...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center p-12">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-medium text-gray-900">Order not found</h3>
        <Button onClick={onBack} variant="outline" className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-700 border-red-200';
      case 'Medium': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    if (status.includes('Progress')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (status.includes('Completed')) return 'bg-green-100 text-green-700 border-green-200';
    if (status.includes('Pending')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="hover:bg-gray-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <Card className="p-6 lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 text-blue-700 border-b pb-2">
            <Info className="w-5 h-5" />
            <h3 className="font-semibold text-lg">General Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Job ID</p>
                  <p className="font-mono font-medium text-gray-900">{order.jobId}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Client Name</p>
                  <p className="font-medium text-gray-900">{order.clientName}</p>
                  <p className="text-sm text-gray-500">{order.clientContactNo}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Transformer</p>
                  <p className="font-medium text-gray-900">{order.transformerName}</p>
                  <Badge variant="outline" className="mt-1">{order.transformerType}</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Quantity</p>
                  <p className="font-medium text-gray-900 text-lg">{order.quantity} Units</p>
                </div>
              </div>



              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Order Created</p>
                  <p className="text-sm text-gray-700">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Technical Specs Sidebar */}
        <Card className="p-6 bg-gray-50 border-gray-200 space-y-6">
          <div className="flex items-center gap-2 text-gray-700 border-b pb-2 border-gray-300">
            <Activity className="w-5 h-5" />
            <h3 className="font-semibold text-lg">Technical Specs</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">System Voltage</p>
              <p className="font-medium text-gray-900">{order.nominalSystemVoltage} kV</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Burden</p>
              <p className="font-medium text-gray-900">{order.burden} VA</p>
            </div>
            {order.transformerType === 'CT' && (
              <>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Rated Primary Current</p>
                  <p className="font-medium text-gray-900">
                    {order.primaryCurrents?.join(', ') || order.ratedPrimaryCurrent || 'N/A'} A
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Rated Secondary Current</p>
                  <p className="font-medium text-gray-900">
                    {order.coreDetails?.length > 0 
                      ? Array.from(new Set(order.coreDetails.map((c: any) => c.secondaryCurrent || '1'))).join(', ') 
                      : (order.ratedSecondaryCurrent || 'N/A')} A
                  </p>
                </div>
              </>
            )}
             <div>
               <p className="text-xs text-gray-500 uppercase font-semibold">STC</p>
               <p className="font-medium text-gray-900">{order.stc || 'N/A'}</p>
             </div>
            {order.transformerType === 'PT' && (
               <div>
               <p className="text-xs text-gray-500 uppercase font-semibold">Voltage Rating</p>
               <p className="font-medium text-gray-900">{order.voltageRating || 'N/A'}</p>
             </div>
            )}
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Ratio</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {order.ratio && order.ratio.map((r, i) => (
                  <Badge key={i} variant="secondary" className="font-mono">{r}</Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Core Configuration */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-2 text-blue-700 border-b pb-2 mb-4">
            <Layers className="w-5 h-5" />
            <h3 className="font-semibold text-lg">Core Configuration ({order.noOfCores} Cores)</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {order.coreDetails && order.coreDetails.map((core, index) => (
              <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-800">Core {index + 1}</h4>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                    {core.coreType}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600"><span className="font-medium">Accuracy Class:</span> {core.accuracyClass || 'N/A'}</p>
                  <p className="text-gray-600"><span className="font-medium">Vendor ID:</span> {core.vendorNo || 'Internal'}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Additional Details */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-2 text-gray-700 border-b pb-2 border-gray-200">
            <Shield className="w-5 h-5" />
            <h3 className="font-semibold text-lg">Manufacturing Info</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 uppercase font-semibold text-[10px]">Standard</span>
              <span className="font-medium">{order.isStandard}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 uppercase font-semibold text-[10px]">Environment</span>
              <span className="font-medium">{order.indoorOutdoor}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 uppercase font-semibold text-[10px]">Insulation</span>
              <span className="font-medium">{order.insulationType}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 uppercase font-semibold text-[10px]">Tank Type</span>
              <span className="font-medium">{order.tankType}</span>
            </div>
          </div>
        </Card>


      </div>
    </div>
  );
}


import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import {
    Package,
    Settings,
    Zap,
    Ruler,
    FileText,
    Calendar,
    User,
    Activity
} from "lucide-react";

// Define the interface based on the extended TaskNotification (OrderSchema)
interface OrderDetails {
    id: string;
    jobId: string;
    orderId: string; // usually same as id or used for display
    clientName: string;
    transformerName: string;
    transformerType: string;
    quantity: number;
    deadline: string;
    instructions?: string;
    priority: string;

    // Extended fields from OrderSchema
    mountingDetails?: string;
    overallDimension?: string;
    nominalSystemVoltage?: number;
    burden?: number;
    accuracyClass?: string;
    ratio?: string[];
    coreDetails?: Array<{
        coreType: string;
        [key: string]: any;
    }>;
    ratedPrimaryCurrent?: number;
    ratedSecondaryCurrent?: number;
    isStandard?: string;
}

interface OrderDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: OrderDetails | null;
}

export function OrderDetailsDialog({ open, onOpenChange, order }: OrderDetailsDialogProps) {
    if (!order) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <DialogTitle className="text-xl">Order Details: {order.jobId}</DialogTitle>
                        <Badge variant="outline" className={
                            order.priority === 'High' ? 'bg-red-50 text-red-700 border-red-200' :
                                order.priority === 'Medium' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                    'bg-green-50 text-green-700 border-green-200'
                        }>
                            {order.priority} Priority
                        </Badge>
                    </div>
                    <DialogDescription>
                        Full specifications for {order.clientName}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">

                    {/* Section 1: Transformer Specifications */}
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Package className="w-5 h-5 text-blue-600" />
                                <h3 className="font-semibold text-gray-900">Transformer Specs</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">Name</p>
                                    <p className="font-medium text-gray-900">{order.transformerName}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Type</p>
                                    <p className="font-medium text-gray-900">{order.transformerType}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Quantity</p>
                                    <p className="font-medium text-gray-900">{order.quantity} Units</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Standard</p>
                                    <p className="font-medium text-gray-900">{order.isStandard || 'N/A'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-gray-500">Ratio</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {order.ratio && order.ratio.map((r, i) => (
                                            <Badge key={i} variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                                                {r}
                                            </Badge>
                                        ))}
                                        {!order.ratio && <p className="font-medium">N/A</p>}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 2: Electrical Parameters */}
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Zap className="w-5 h-5 text-yellow-600" />
                                <h3 className="font-semibold text-gray-900">Electrical Parameters</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">System Voltage</p>
                                    <p className="font-medium text-gray-900">{order.nominalSystemVoltage ? `${order.nominalSystemVoltage} kV` : 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Burden</p>
                                    <p className="font-medium text-gray-900">{order.burden ? `${order.burden} VA` : 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Accuracy Class</p>
                                    <p className="font-medium text-gray-900">{order.accuracyClass || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Rated Current</p>
                                    <p className="font-medium text-gray-900">
                                        {order.ratedPrimaryCurrent && order.ratedSecondaryCurrent
                                            ? `${order.ratedPrimaryCurrent}/${order.ratedSecondaryCurrent} A`
                                            : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 3: Core Details */}
                    <Card className="md:col-span-2">
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Settings className="w-5 h-5 text-purple-600" />
                                <h3 className="font-semibold text-gray-900">Core Configuration</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {order.coreDetails && order.coreDetails.length > 0 ? (
                                    order.coreDetails.map((core, index) => (
                                        <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                                            <p className="font-medium text-gray-700 mb-1">Core {index + 1}</p>
                                            <Badge className={
                                                core.coreType === 'Metering' ? 'bg-blue-100 text-blue-700' :
                                                    core.coreType === 'Protection' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-purple-100 text-purple-700'
                                            }>
                                                {core.coreType}
                                            </Badge>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">No core details available</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 4: Mechanical & Instructions */}
                    <Card className="md:col-span-2">
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Ruler className="w-5 h-5 text-green-600" />
                                <h3 className="font-semibold text-gray-900">Mechanical & Other</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-gray-500">Mounting Details</p>
                                        <p className="font-medium text-gray-900">{order.mountingDetails || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Overall Dimensions</p>
                                        <p className="font-medium text-gray-900">{order.overallDimension || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <p className="text-gray-500 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> Deadline
                                        </p>
                                        <p className="font-medium text-gray-900">
                                            {order.deadline ? new Date(order.deadline).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>

                                    {order.instructions && (
                                        <div className="mt-2 text-amber-700 bg-amber-50 p-2 rounded text-xs border border-amber-100">
                                            <span className="font-semibold">Note:</span> {order.instructions}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </DialogContent>
        </Dialog>
    );
}

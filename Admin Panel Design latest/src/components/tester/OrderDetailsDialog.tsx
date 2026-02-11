import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import {
    Zap,
    Settings,
    Box,
    FileText,
    Info,
    Ruler
} from "lucide-react";

// Define the Order interface based on the Schema
export interface OrderDetails {
    _id: string;
    orderId: string; // "ORD-..."
    jobId: string;   // "JOB-..."
    clientName: string;
    clientContactNo?: string;
    orderDate?: string; // or createdAt
    deadline: string;

    // Transformer Specs
    transformerName: string;
    transformerType: string;
    quantity: number;
    ratio?: string[]; // Array of strings in schema

    // Core Configuration
    noOfCores?: number;
    coreDetails?: Array<{ coreType: string }>;

    // Electrical & Mechanical
    nominalSystemVoltage?: number;
    burden?: number;
    accuracyClass?: string;
    ratedPrimaryCurrent?: number;
    ratedSecondaryCurrent?: number;

    // Mechanical
    mountingDetails?: string;
    overallDimension?: string;

    // Notes
    instructions?: string;
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
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between mr-8">
                        <div className="space-y-1">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                Order Details: <span className="font-mono text-blue-600">{order.jobId || order.orderId}</span>
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground">
                                Client: <span className="font-medium text-foreground">{order.clientName}</span>
                            </p>
                        </div>
                        <Badge variant="outline" className="px-3 py-1">
                            {new Date(order.deadline).toLocaleDateString()}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="grid gap-6 py-4">

                    {/* Transformer Specifications */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-2 font-semibold text-lg text-primary">
                            <Zap className="w-5 h-5" />
                            <h3>Transformer Specifications</h3>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/20 rounded-lg">
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground font-medium uppercase">Transformer Name</span>
                                <p className="font-medium">{order.transformerName}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground font-medium uppercase">Type</span>
                                <p className="font-medium">{order.transformerType}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground font-medium uppercase">Quantity</span>
                                <p className="font-medium">{order.quantity} Nos.</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground font-medium uppercase">Ratio</span>
                                <p className="font-medium">{order.ratio?.join(" / ") || "N/A"}</p>
                            </div>
                        </div>
                    </section>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Electrical Parameters */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2 font-semibold text-primary">
                                <Info className="w-4 h-4" />
                                <h3>Electrical Parameters</h3>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground font-medium uppercase">Voltage</span>
                                    <p className="text-sm font-medium">{order.nominalSystemVoltage ? `${order.nominalSystemVoltage} kV` : "N/A"}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground font-medium uppercase">Burden</span>
                                    <p className="text-sm font-medium">{order.burden ? `${order.burden} VA` : "N/A"}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground font-medium uppercase">Accuracy</span>
                                    <p className="text-sm font-medium">{order.accuracyClass || "N/A"}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground font-medium uppercase">Rated Current</span>
                                    <p className="text-sm font-medium">
                                        {order.ratedPrimaryCurrent && order.ratedSecondaryCurrent
                                            ? `${order.ratedPrimaryCurrent}/${order.ratedSecondaryCurrent} A`
                                            : "N/A"}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Core Configuration */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2 font-semibold text-primary">
                                <Settings className="w-4 h-4" />
                                <h3>Core Configuration</h3>
                            </div>
                            <Separator />
                            <div className="p-4 border rounded-lg h-full">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-muted-foreground">Number of Cores</span>
                                        <Badge variant="secondary">{order.noOfCores || 0}</Badge>
                                    </div>
                                    {order.coreDetails && order.coreDetails.length > 0 && (
                                        <div className="space-y-2 pt-2">
                                            <span className="text-sm font-medium text-muted-foreground block mb-1">Core Types</span>
                                            <div className="flex flex-wrap gap-2">
                                                {order.coreDetails.map((core, idx) => (
                                                    <Badge key={idx} variant="outline" className="bg-background">
                                                        Core {idx + 1}: {core.coreType}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Mechanical Details */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2 font-semibold text-primary">
                                <Ruler className="w-4 h-4" />
                                <h3>Mechanical Details</h3>
                            </div>
                            <Separator />
                            <div className="p-4 border rounded-lg">
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <span className="text-xs text-muted-foreground font-medium uppercase">Mounting</span>
                                        <p className="text-sm font-medium">{order.mountingDetails || "N/A"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs text-muted-foreground font-medium uppercase">Overall Dimensions</span>
                                        <p className="text-sm font-medium">{order.overallDimension || "N/A"}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Instructions */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2 font-semibold text-primary">
                                <FileText className="w-4 h-4" />
                                <h3>Notes & Instructions</h3>
                            </div>
                            <Separator />
                            <div className="p-4 border rounded-lg bg-yellow-50/50 min-h-[120px]">
                                <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                                    {order.instructions || "No special instructions provided."}
                                </p>
                            </div>
                        </section>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}

import { FailedCore } from '../../services/failedCoreApi';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter
} from '../ui/sheet';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Calendar, Building2, Tag, AlertTriangle, FileText, Activity } from 'lucide-react';

interface FailureDetailSheetProps {
    core: FailedCore | null;
    onClose: () => void;
}

export function FailureDetailSheet({ core, onClose }: FailureDetailSheetProps) {
    if (!core) return null;

    return (
        <Sheet open={!!core} onOpenChange={(open: boolean) => !open && onClose()}>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full p-0 gap-0">
                <SheetHeader className="p-6 pb-2 border-b">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant={core.status === 'REPLACED' ? 'secondary' : 'destructive'} className="text-xs px-2 py-0.5">
                            {core.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                            {core.coreType} Core
                        </span>
                    </div>
                    <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                        {core.internalCoreNo}
                    </SheetTitle>
                    <SheetDescription>
                        Failed during {core.failureStage?.replace('_', ' ') || 'Testing'}
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-6">
                        {/* Failure Reason Box */}
                        <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                            <h4 className="text-red-800 font-semibold flex items-center gap-2 mb-1">
                                <AlertTriangle className="h-4 w-4" />
                                Failure Reason
                            </h4>
                            <p className="text-red-700 text-lg font-medium">
                                {core.failureReason}
                            </p>
                            <p className="text-red-900/60 text-xs mt-1">
                                Recorded on {new Date(core.failedAt).toLocaleString()}
                            </p>
                        </div>

                        {/* Order Details */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Order Information
                            </h3>
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border">
                                <div>
                                    <label className="text-xs text-gray-500">Client</label>
                                    <p className="font-medium text-sm">{core.clientName}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Order No.</label>
                                    <p className="font-medium text-sm">{core.orderNumber || core.orderId}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Job ID</label>
                                    <p className="font-medium text-sm font-mono">{core.jobId}</p>
                                </div>
                            </div>
                        </div>

                        {/* Vendor Details */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Building2 className="h-4 w-4" /> Vendor Snapshot
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-lg border">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500">Vendor Name</label>
                                        <p className="font-medium text-sm">{core.vendorName || "Unknown"}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Vendor Core No</label>
                                        <p className="font-medium text-sm font-mono">{core.vendorCoreNo || "-"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Technical Data (Dynamic) */}
                        {core.dynamicValues && Object.keys(core.dynamicValues).length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Activity className="h-4 w-4" /> Test Readings
                                </h3>
                                <div className="bg-gray-50 rounded-lg border overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-100/50 text-left">
                                            <tr>
                                                <th className="p-2 font-medium text-gray-500">Parameter</th>
                                                <th className="p-2 font-medium text-gray-500 text-right">Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(core.dynamicValues).map(([key, val]) => (
                                                <tr key={key} className="border-t border-gray-100">
                                                    <td className="p-2 text-gray-600">{key}</td>
                                                    <td className="p-2 font-mono text-right">{String(val)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {core.status === 'REPLACED' && (
                            <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-sm text-green-800 flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                Replaced by core: <span className="font-mono font-bold">{core.replacedByCoreId || 'N/A'}</span>
                            </div>
                        )}

                    </div>
                </ScrollArea>

                <SheetFooter className="p-4 border-t bg-gray-50">
                    <Button onClick={onClose} className="w-full">Close Details</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

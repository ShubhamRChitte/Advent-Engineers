import { FailedCore } from '../../services/failedCoreApi';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ArrowRight, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface FailedCoresTableProps {
    data: FailedCore[];
    loading: boolean;
    onRowClick: (core: FailedCore) => void;
}

export function FailedCoresTable({ data, loading, onRowClick }: FailedCoresTableProps) {
    if (loading) {
        return (
            <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg border">
                <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="text-muted-foreground text-sm">Loading Failed Cores...</span>
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="w-full h-64 flex flex-col items-center justify-center bg-gray-50 rounded-lg border text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 text-green-500 mb-2" />
                <p className="font-medium text-lg">No Failed Cores Found</p>
                <p className="text-sm">Great job! All systems checking out green.</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border bg-white shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-50/50">
                        <TableHead className="w-[100px]">Date</TableHead>
                        <TableHead>Order Info</TableHead>
                        <TableHead>Core Identity</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((core) => (
                        <TableRow
                            key={core._id}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => onRowClick(core)}
                        >
                            <TableCell className="font-medium whitespace-nowrap">
                                {new Date(core.failedAt).toLocaleDateString()}
                                <div className="text-xs text-muted-foreground">
                                    {new Date(core.failedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="font-semibold">{core.orderNumber || core.orderId || "N/A"}</div>
                                <div className="text-xs text-muted-foreground">{core.clientName}</div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="font-mono">{core.internalCoreNo}</Badge>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">{core.coreType} Core</div>
                            </TableCell>
                            <TableCell>
                                <div className="text-sm font-medium">{core.vendorName || "Unknown"}</div>
                                <div className="text-xs text-muted-foreground font-mono">{core.vendorCoreNo || "-"}</div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1.5 text-red-600 font-medium">
                                    <AlertOctagon className="h-3 w-3" />
                                    {core.failureReason}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={core.status === 'REPLACED' ? 'secondary' : 'destructive'}>
                                    {core.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { ShieldAlert, CheckCircle, XCircle, RefreshCw, Eye, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '../ui/skeleton';

interface StrictApprovalRequest {
    _id: string;
    orderId: any;
    jobId: string;
    unitId?: string; // Important: The Transformer ID
    clientName: string;
    coreType: string;
    testType: string;
    failureReason: string;
    testData: any;
    requestedBy: string;
    createdAt: string;
    status: 'Pending' | 'Approved' | 'Rejected';
}

export function StrictApprovalDashboard() {
    const [requests, setRequests] = useState<StrictApprovalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<StrictApprovalRequest | null>(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/strict-approvals`, {
                withCredentials: true
            });
            // Show only pending requests
            setRequests(res.data.filter((r: any) => r.status === 'Pending' || r.status === 'pending'));
        } catch (error) {
            console.error("Failed to fetch strict approval requests", error);
            toast.error("Failed to load approval requests.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleResolve = async (id: string, approved: boolean) => {
        try {
            const action = approved ? 'approve' : 'reject';
            if (!confirm(`Are you sure you want to ${action} this request?`)) return;

            const res = await axios.post(`/strict-approvals/${id}/resolve`, {
                approved,
                adminComments: approved ? "Approved by Admin" : "Rejected by Admin"
            }, { withCredentials: true });

            if (res.data.success) {
                toast.success(`Request ${approved ? 'Approved' : 'Rejected'} successfully!`);
                fetchRequests();
                setSelectedRequest(null);
            }
        } catch (error: any) {
            console.error("Resolution failed", error);
            toast.error("Failed to resolve request.");
        }
    };

    if (loading && requests.length === 0) {
        return (
            <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-6 w-48 mb-1" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {[1, 2].map(i => (
                        <Card key={i} className="p-4 border-l-4 border-l-gray-300">
                            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                                <div className="space-y-2 w-full md:w-2/3">
                                    <Skeleton className="h-6 w-32" />
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                    <Skeleton className="h-16 w-full mt-2" />
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                                    <Skeleton className="h-8 w-20" />
                                    <Skeleton className="h-8 w-24" />
                                    <Skeleton className="h-8 w-24" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (requests.length === 0) {
        return null; 
    }

    return (
        <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-orange-700 font-bold flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5" />
                        Strict Approval Required ({requests.length})
                    </h3>
                    <p className="text-sm text-gray-600">
                        The following units have failed accuracy limits. Please review details before approving.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchRequests} className="text-orange-700 border-orange-200">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {requests.map((req) => (
                    <Card key={req._id} className="p-4 border-l-4 border-l-orange-500 shadow-md bg-orange-50/10">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-gray-900 text-lg">{req.jobId}</h4>
                                    <span className="bg-orange-100 text-orange-800 px-3 py-0.5 rounded-full text-xs font-bold border border-orange-200">
                                        Limit Failure
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-2">
                                    <p className="text-sm"><span className="text-gray-500">Unit ID:</span> <span className="font-bold text-blue-700">{req.unitId || 'N/A'}</span></p>
                                    <p className="text-sm"><span className="text-gray-500">Client:</span> <span className="font-medium">{req.clientName}</span></p>
                                    <p className="text-sm"><span className="text-gray-500">Test:</span> <span className="font-medium text-purple-700">{req.testType}</span></p>
                                    <p className="text-sm"><span className="text-gray-500">By:</span> <span className="font-medium">{req.requestedBy}</span></p>
                                </div>
                                <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-sm text-red-700 font-medium">
                                    <span className="font-bold mr-1 underline block mb-1">Main Failure Details:</span> 
                                    {req.failureReason && req.failureReason.includes(' | ') ? (
                                        <ul className="list-disc list-inside space-y-0.5 ml-1">
                                            {req.failureReason.split(' | ').map((err: string, i: number) => (
                                                <li key={i}>{err}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <span>{req.failureReason || 'Limits Exceeded'}</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                                <Button 
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 md:flex-none bg-white border-blue-600 text-blue-600 hover:bg-blue-50"
                                    onClick={() => setSelectedRequest(req)}
                                >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Details
                                </Button>
                                <Button 
                                    size="sm"
                                    className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white font-bold"
                                    onClick={() => handleResolve(req._id, true)}
                                >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Approve
                                </Button>
                                <Button 
                                    size="sm"
                                    variant="destructive"
                                    className="flex-1 md:flex-none font-bold"
                                    onClick={() => handleResolve(req._id, false)}
                                >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Reject
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Detailed Reasons Modal (Simulated with fixed overlay if needed, or simple absolute) */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg p-6 bg-white animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold">Failure Details</h3>
                                <p className="text-gray-500 text-sm">Transformer ID: {selectedRequest.unitId}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedRequest(null)}>&times;</Button>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                                <h4 className="text-red-800 font-bold flex items-center gap-2 mb-2">
                                    <Info className="w-4 h-4" />
                                    Specific Violations
                                </h4>
                                <ul className="list-disc list-inside space-y-1 text-red-700 text-sm">
                                    {selectedRequest.failureReason.split(' | ').map((reason, i) => (
                                        <li key={i}>{reason}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h4 className="font-bold text-gray-700 mb-2">Additional Info</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <p><span className="text-gray-500">Client:</span> {selectedRequest.clientName}</p>
                                    <p><span className="text-gray-500">Job No:</span> {selectedRequest.jobId}</p>
                                    <p><span className="text-gray-500">Requested:</span> {new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
                                    <p><span className="text-gray-500">By:</span> {selectedRequest.requestedBy}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <Button className="flex-1 bg-green-600" onClick={() => handleResolve(selectedRequest._id, true)}>Approve unit</Button>
                            <Button variant="outline" className="flex-1" onClick={() => setSelectedRequest(null)}>Close</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}

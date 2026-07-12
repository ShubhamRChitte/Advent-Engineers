import { useState, useEffect } from 'react';
import axios from '@/utils/axiosConfig';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { ShieldAlert, User, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface AdminReviewTransformer {
    _id: string;
    uniqueId: string;
    orderId: {
        jobId: string;
        clientName: string;
    };
    adminReviewDetails?: {
        failedStage: string;
        returnTargetStage: string;
        requestedAt: string;
    };
    testHistory: any;
    assignments: any;
}

export function AdminReviewPanel() {
    const [transformers, setTransformers] = useState<AdminReviewTransformer[]>([]);
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        fetchReviewTransformers();
        fetchTesters();
    }, []);

    const fetchTesters = async () => {
        try {
            const response = await axios.get('/auth/testers');
            if (response.data.success) {
                setEmployees(response.data.users);
            }
        } catch (error) {
            console.error("Failed to fetch testers", error);
        }
    };

    const fetchReviewTransformers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/transformers/admin-review`, {
                withCredentials: true
            });
            if (res.data.success) {
                setTransformers(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch review transformers", error);
            toast.error("Failed to load transformers pending review.");
        } finally {
            setLoading(false);
        }
    };

    const handleApproveRetest = async (uniqueId: string) => {
        try {
            const newTester = selectedEmployees[uniqueId] || undefined;
            const res = await axios.put(`/transformers/${uniqueId}/approve-retest`,
                { newTester },
                { withCredentials: true }
            );

            if (res.data.success) {
                toast.success(res.data.message);
                fetchReviewTransformers(); // refresh list
            } else {
                toast.error(res.data.message || "Failed to approve retest.");
            }
        } catch (error: any) {
            console.error("Approve retest error", error);
            toast.error(error.response?.data?.message || "Failed to approve retest.");
        }
    };

    const handleEmployeeChange = (uniqueId: string, employeeId: string) => {
        setSelectedEmployees(prev => ({ ...prev, [uniqueId]: employeeId }));
    };

    if (loading) {
        return <div className="text-center py-8 text-gray-500">Loading pending reviews...</div>;
    }

    if (transformers.length === 0) {
        return (
            <Card className="p-8 text-center border-dashed border-2 border-gray-200 bg-gray-50">
                <ShieldAlert className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-gray-900 font-medium">No Pending Reviews</h3>
                <p className="text-sm text-gray-500 mt-1">
                    All transformers have passed Final Testing without requiring Admin authorization.
                </p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-red-700 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5" />
                        Action Required: Admin Review
                    </h3>
                    <p className="text-sm text-gray-600">
                        The following transformers failed critical Final Testing stages and require Admin authorization for a retest.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchReviewTransformers}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {transformers.map((transformer) => {
                    const details = transformer.adminReviewDetails;
                    const targetStage = details?.returnTargetStage || "Unknown";
                    const failedStage = details?.failedStage || "Unknown";
                    const currentTester = transformer.assignments?.[`${targetStage}_tester`] || "Unassigned";

                    return (
                        <Card key={transformer.uniqueId} className="p-5 border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">

                                {/* Transformer Info */}
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded">
                                            Locked
                                        </span>
                                        <h4 className="font-bold text-gray-900">{transformer.uniqueId}</h4>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        <p><span className="font-medium">Job:</span> {transformer.orderId?.jobId} ({transformer.orderId?.clientName})</p>
                                        <p className="text-red-600 mt-1">
                                            <span className="font-medium">Failed At:</span> {failedStage.replace(/_/g, ' ')}
                                        </p>
                                    </div>
                                </div>

                                {/* Retest Assignment */}
                                <div className="flex-1 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <p className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-1">
                                        <User className="w-4 h-4 text-blue-600" />
                                        Reassign Testing Engineer for {targetStage.charAt(0).toUpperCase() + targetStage.slice(1)} Stage
                                    </p>
                                    <p className="text-xs text-gray-500 mb-3">Current Assignment: {currentTester}</p>

                                    <select
                                        className="w-full text-sm p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                        value={selectedEmployees[transformer.uniqueId] || ''}
                                        onChange={(e) => handleEmployeeChange(transformer.uniqueId, e.target.value)}
                                    >
                                        <option value="">Keep current testing engineer ({currentTester})</option>
                                        {employees.map(emp => (
                                            <option key={emp._id || emp.fullName} value={emp.fullName}>
                                                {emp.fullName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2 min-w-[200px]">
                                    <Button
                                        className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
                                        onClick={() => handleApproveRetest(transformer.uniqueId)}
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Approve Retest
                                    </Button>
                                    <p className="text-xs text-gray-500 text-center">
                                        Returns unit to {targetStage} stage.
                                    </p>
                                </div>

                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

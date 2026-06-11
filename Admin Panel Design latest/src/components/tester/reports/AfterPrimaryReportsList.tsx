import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { ChevronRight, FileText, Search, Calendar, User, LayoutGrid } from 'lucide-react';
import axios from 'axios';
import { Skeleton } from '../../ui/skeleton';
import { toast } from 'sonner';
import { AfterPrimaryReportView } from './AfterPrimaryReportView';
import { AfterPrimaryCompletedTransformersList } from './AfterPrimaryCompletedTransformersList';

// Types
interface CompletedTransformer {
    _id: string;
    jobId: string;
    uniqueId: string;
    currentStage: string;
    orderId?: any; // Populated Order Object
    testHistory?: {
        primary_test?: {
            status: string;
            timestamp: string;
            tester: string;
        };
    };
    cores: any[];
}

export function AfterPrimaryReportsList() {
    // Data State
    const [reports, setReports] = useState<CompletedTransformer[]>([]);
    const [loading, setLoading] = useState(true);
    const [groupByJob, setGroupByJob] = useState<Record<string, CompletedTransformer[]>>({});

    // UI State
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [selectedTransformer, setSelectedTransformer] = useState<CompletedTransformer | null>(null);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/after-primary/reports`, {
                withCredentials: true
            });

            const data = response.data;
            setReports(data);

            // Group by Job ID
            const grouped: Record<string, CompletedTransformer[]> = {};
            data.forEach((t: CompletedTransformer) => {
                const jId = t.jobId || 'Unknown Job';
                if (!grouped[jId]) {
                    grouped[jId] = [];
                }
                grouped[jId].push(t);
            });
            setGroupByJob(grouped);

        } catch (error) {
            console.error("Error fetching reports:", error);
            // toast.error("Failed to load completed reports.");
        } finally {
            setLoading(false);
        }
    };

    // --- LEVEL 3: REPORT VIEW ---
    if (selectedTransformer) {
        return (
            <AfterPrimaryReportView
                transformer={selectedTransformer}
                onBack={() => setSelectedTransformer(null)}
            />
        );
    }

    // --- LEVEL 2: TRANSFORMERS LIST (For Selected Order) ---
    if (selectedJobId) {
        const jobTransformers = groupByJob[selectedJobId] || [];
        // Extract client name from the first transformer's populated order if available
        const clientName = jobTransformers[0]?.orderId?.clientName || 'Unknown Client';

        return (
            <AfterPrimaryCompletedTransformersList
                transformers={jobTransformers}
                onViewReport={(t) => setSelectedTransformer(t as unknown as CompletedTransformer)}
                onBack={() => setSelectedJobId(null)}
                jobId={selectedJobId}
                clientName={clientName}
            />
        );
    }

    // --- LEVEL 1: ORDERS LIST ---
    const jobIds = Object.keys(groupByJob).sort((a, b) => b.localeCompare(a)); // Newest jobs first

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">My Completed Reports (After Primary)</h2>
                    <p className="text-gray-500 mt-1">View history of your approved after primary tests</p>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <Card key={i} className="p-5 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <Skeleton className="h-6 w-24 mb-1" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                                <Skeleton className="h-6 w-16 rounded-full" />
                            </div>
                            <div className="space-y-2 pt-2 border-t border-gray-100">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                            <div className="pt-2 flex justify-end border-t border-gray-100">
                                <Skeleton className="h-4 w-28" />
                            </div>
                        </Card>
                    ))}
                </div>
            ) : jobIds.length === 0 ? (
                <Card className="p-12 border-dashed border-2 border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-300 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700">No Reports Found</h3>
                    <p className="text-gray-500 max-w-sm mt-2">
                        You haven't completed and approved any after primary tests yet.
                        Once you approve a test in the "Testing" tab, it will appear here.
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobIds.map(jobId => {
                        const transformers = groupByJob[jobId] || [];
                        const count = transformers.length;
                        // Use first transformer to get Order metadata
                        const orderData = transformers[0]?.orderId || {};
                        const client = orderData.clientName || 'Unknown Client';

                        // Find most recent test date in this group
                        const dates = transformers
                            .map(t => t.testHistory?.primary_test?.timestamp ? new Date(t.testHistory.primary_test.timestamp).getTime() : 0)
                            .filter(d => d > 0);
                        const lastTestDate = dates.length > 0 ? new Date(Math.max(...dates)).toLocaleDateString() : 'N/A';

                        return (
                            <Card
                                key={jobId}
                                className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-gray-200 hover:border-blue-300 overflow-hidden"
                                onClick={() => setSelectedJobId(jobId)}
                            >
                                <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500" />
                                <div className="p-5 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-700 transition-colors">
                                                {jobId}
                                            </h3>
                                            <p className="text-sm text-gray-500 font-medium truncate max-w-[180px]" title={client}>
                                                {client}
                                            </p>
                                        </div>
                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                                            {count} Units
                                        </Badge>
                                    </div>

                                    <div className="space-y-2 pt-2 border-t border-gray-100">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                            <span>Last Test: {lastTestDate}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <LayoutGrid className="w-4 h-4 mr-2 text-gray-400" />
                                            <span>Total Qty: {orderData.quantity || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 flex justify-end">
                                        <div className="text-xs font-semibold text-blue-600 flex items-center group-hover:translate-x-1 transition-transform">
                                            View Transformers <ChevronRight className="w-3 h-3 ml-1" />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

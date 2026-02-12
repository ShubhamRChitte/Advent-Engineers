<<<<<<< HEAD
import { SecondaryReportView } from './SecondaryReportView';

// ... (Complete existing imports, but SecondaryReportView added)

export function SecondaryReportsList({ onViewReport, onBack }: SecondaryReportsListProps) {
    const [reports, setReports] = useState<CompletedTransformer[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedJobs, setExpandedJobs] = useState<Record<string, boolean>>({});
    const [groupByJob, setGroupByJob] = useState<Record<string, CompletedTransformer[]>>({});

    // Internal state for viewing a specific report
=======
import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ChevronRight, FileText, Search, Calendar, User, LayoutGrid } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { SecondaryReportView } from './SecondaryReportView';
import { SecondaryCompletedTransformersList } from './SecondaryCompletedTransformersList';

// Types
interface CompletedTransformer {
    _id: string;
    jobId: string;
    uniqueId: string;
    currentStage: string;
    orderId?: any; // Populated Order Object
    testHistory?: {
        secondary_test?: {
            status: string;
            timestamp: string;
            tester: string;
        };
    };
    cores: any[];
}

interface SecondaryReportsListProps {
    onViewReport: (transformer: any) => void;
    onBack: () => void;
}

export function SecondaryReportsList({ onViewReport, onBack }: SecondaryReportsListProps) {
    // Data State
    const [reports, setReports] = useState<CompletedTransformer[]>([]);
    const [loading, setLoading] = useState(true);
    const [groupByJob, setGroupByJob] = useState<Record<string, CompletedTransformer[]>>({});

    // UI State
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
    const [selectedTransformer, setSelectedTransformer] = useState<CompletedTransformer | null>(null);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
<<<<<<< HEAD
            // Endpoint implemented in taskRoutes.js
=======
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
            const response = await axios.get('http://localhost:3002/api/secondary/reports', {
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
<<<<<<< HEAD
            toast.error("Failed to load completed reports.");
=======
            // toast.error("Failed to load completed reports.");
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
        } finally {
            setLoading(false);
        }
    };

<<<<<<< HEAD
    const toggleJob = (jobId: string) => {
        setExpandedJobs(prev => ({
            ...prev,
            [jobId]: !prev[jobId]
        }));
    };

    // Handler for viewing a report
    const handleViewReport = (t: CompletedTransformer) => {
        setSelectedTransformer(t);
    };

    // If a report is selected, show the view component
=======
    // --- LEVEL 3: REPORT VIEW ---
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
    if (selectedTransformer) {
        return (
            <SecondaryReportView
                transformer={selectedTransformer}
                onBack={() => setSelectedTransformer(null)}
            />
        );
    }

<<<<<<< HEAD
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">My Completed Reports</h2>
=======
    // --- LEVEL 2: TRANSFORMERS LIST (For Selected Order) ---
    if (selectedJobId) {
        const jobTransformers = groupByJob[selectedJobId] || [];
        // Extract client name from the first transformer's populated order if available
        const clientName = jobTransformers[0]?.orderId?.clientName || 'Unknown Client';

        return (
            <SecondaryCompletedTransformersList
                transformers={jobTransformers}
                onViewReport={(t) => setSelectedTransformer(t)}
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
                    <h2 className="text-2xl font-bold text-gray-800">My Completed Reports</h2>
                    <p className="text-gray-500 mt-1">View history of your approved secondary tests</p>
                </div>
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
                <Button variant="outline" onClick={onBack}>Back to Dashboard</Button>
            </div>

            {loading ? (
<<<<<<< HEAD
                <div className="text-center py-8">Loading reports...</div>
            ) : Object.keys(groupByJob).length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                        No completed reports found for you.
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {Object.entries(groupByJob).map(([jobId, transformers]) => (
                        <Card key={jobId} className="border border-gray-200 shadow-sm">
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                                onClick={() => toggleJob(jobId)}
                            >
                                <div className="flex items-center gap-3">
                                    {expandedJobs[jobId] ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-800">{jobId}</h3>
                                        <p className="text-sm text-gray-500">{transformers.length} Transformers Tested</p>
                                    </div>
                                </div>
                                {/* <div className="text-sm text-gray-400">
                  Last: {new Date(transformers[0].testHistory?.secondary_test?.timestamp || '').toLocaleDateString()}
                </div> */}
                            </div>

                            {expandedJobs[jobId] && (
                                <div className="border-t border-gray-200">
                                    <table className="w-full text-sm">
                                        <thead className="bg-white text-gray-500 border-b">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-medium">Transformer ID</th>
                                                <th className="px-4 py-3 text-left font-medium">Test Date</th>
                                                <th className="px-4 py-3 text-center font-medium">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {transformers.map(t => (
                                                <tr key={t._id} className="hover:bg-blue-50/50">
                                                    <td className="px-4 py-3 font-medium text-gray-700">{t.uniqueId}</td>
                                                    <td className="px-4 py-3 text-gray-600">
                                                        {t.testHistory?.secondary_test?.timestamp
                                                            ? new Date(t.testHistory.secondary_test.timestamp).toLocaleString()
                                                            : 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                            onClick={(e: React.MouseEvent) => {
                                                                e.stopPropagation();
                                                                handleViewReport(t);
                                                            }}
                                                        >
                                                            <FileText className="w-4 h-4 mr-2" />
                                                            View Report
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    ))}
=======
                <div className="flex justify-center py-12">Loading reports...</div>
            ) : jobIds.length === 0 ? (
                <Card className="p-12 border-dashed border-2 border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-300 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700">No Reports Found</h3>
                    <p className="text-gray-500 max-w-sm mt-2">
                        You haven't completed and approved any secondary tests yet.
                        Once you approve a test in the "Testing" tab, it will appear here.
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobIds.map(jobId => {
                        const transformers = groupByJob[jobId];
                        const count = transformers.length;
                        // Use first transformer to get Order metadata
                        const orderData = transformers[0]?.orderId || {};
                        const client = orderData.clientName || 'Unknown Client';
                        const deadline = orderData.deadline ? new Date(orderData.deadline).toLocaleDateString() : 'N/A';
                        // Find most recent test date in this group
                        const dates = transformers
                            .map(t => t.testHistory?.secondary_test?.timestamp ? new Date(t.testHistory.secondary_test.timestamp).getTime() : 0)
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
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
                </div>
            )}
        </div>
    );
}

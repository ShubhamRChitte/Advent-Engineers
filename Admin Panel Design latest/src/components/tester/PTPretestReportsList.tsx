import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { ChevronRight, FileText, Search, Calendar, LayoutGrid } from 'lucide-react';
import axios from 'axios';
import { PTReportView } from './PTReportView';
import { PTCompletedTransformersList } from './PTCompletedTransformersList';

// Types
interface CompletedTransformer {
    _id: string;
    jobId: string;
    uniqueId: string;
    currentStage: string;
    transformerType: string;
    orderId?: any; // Populated Order Object
    testHistory?: {
        pt_test?: {
            date: string;
            testedBy: string;
            signature?: string;
            [key: string]: any;
        };
    };
    coreDetails?: any[];
}

interface PTPretestReportsListProps {
    onBack: () => void;
}

export function PTPretestReportsList({ onBack }: PTPretestReportsListProps) {
    // Data State
    const [reports, setReports] = useState<CompletedTransformer[]>([]);
    const [loading, setLoading] = useState(true);
    const [groupByJob, setGroupByJob] = useState<Record<string, CompletedTransformer[]>>({});

    // UI State
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [selectedTransformer, setSelectedTransformer] = useState<CompletedTransformer | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/pt-pretests/reports`, {
                withCredentials: true
            });

            const data = response.data;
            setReports(data);

            // Group by Job ID
            const grouped: Record<string, CompletedTransformer[]> = {};
            data.forEach((t: CompletedTransformer) => {
                const jId = t.jobId || t.orderId?.jobId || 'Unknown Job';
                if (!grouped[jId]) {
                    grouped[jId] = [];
                }
                grouped[jId].push(t);
            });
            setGroupByJob(grouped);

        } catch (error) {
            console.error("Error fetching PT reports:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- LEVEL 3: REPORT VIEW ---
    if (selectedTransformer) {
        return (
            <PTReportView
                transformer={selectedTransformer}
                order={selectedTransformer.orderId}
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
            <PTCompletedTransformersList
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

    // --- FILTER LOGIC ---
    let filteredJobIds = jobIds;
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filteredJobIds = jobIds.filter(jobId => {
            // 1. Matches Job ID directly
            if (jobId.toLowerCase().includes(query)) return true;

            // 2. Or matches any specific transformer's Unique ID within this job
            const jobTransformers = groupByJob[jobId] || [];
            return jobTransformers.some(tf => tf.uniqueId?.toLowerCase().includes(query));
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">My Completed PT Reports</h2>
                    <p className="text-gray-500 mt-1">View history of your approved PT tests</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                            placeholder="Search Job ID or Transformer ID..."
                            className="pl-9 w-full bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" onClick={onBack}>Back to Dashboard</Button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">Loading reports...</div>
            ) : jobIds.length === 0 ? (
                <Card className="p-12 border-dashed border-2 border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-purple-50 text-purple-300 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700">No Reports Found</h3>
                    <p className="text-gray-500 max-w-sm mt-2">
                        You haven't completed and approved any PT tests yet.
                        Once you approve a test in the "Testing" tab, it will appear here.
                    </p>
                </Card>
            ) : filteredJobIds.length === 0 ? (
                <Card className="p-12 border-dashed border-2 border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-purple-50 text-purple-300 rounded-full flex items-center justify-center mb-4">
                        <Search className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700">No matching reports found</h3>
                    <p className="text-gray-500 max-w-sm mt-2">
                        Try adjusting your search query to find the job or transformer you are looking for.
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredJobIds.map(jobId => {
                        const transformers = groupByJob[jobId] || [];
                        const count = transformers.length;
                        // Use first transformer to get Order metadata
                        const orderData = transformers[0]?.orderId || {};
                        const client = orderData.clientName || transformers[0]?.orderId?.clientName || 'Unknown Client';

                        // Find most recent test date in this group
                        const dates = transformers
                            .map(t => {
                                const ptDateStr = t.testHistory?.pt_test?.date;
                                // In PT Schema, date is often stored as 'DD/MM/YYYY', parse it properly if possible
                                if (!ptDateStr) return 0;
                                const parts = ptDateStr.split('/');
                                if (parts.length === 3) {
                                    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
                                }
                                return new Date(ptDateStr).getTime();
                            })
                            .filter(d => !isNaN(d) && d > 0);
                        const lastTestDate = dates.length > 0 ? new Date(Math.max(...dates)).toLocaleDateString('en-GB') : 'N/A';

                        return (
                            <Card
                                key={jobId}
                                className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-gray-200 hover:border-purple-300 overflow-hidden"
                                onClick={() => setSelectedJobId(jobId)}
                            >
                                <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500" />
                                <div className="p-5 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-800 group-hover:text-purple-700 transition-colors">
                                                {jobId}
                                            </h3>
                                            <p className="text-sm text-gray-500 font-medium truncate max-w-[180px]" title={client}>
                                                {client}
                                            </p>
                                        </div>
                                        <Badge variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-100">
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
                                        <div className="text-xs font-semibold text-purple-600 flex items-center group-hover:translate-x-1 transition-transform">
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


import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { ChevronRight, FileText, Search, Printer } from 'lucide-react';
import axios from '@/utils/axiosConfig';
import { Skeleton } from '../ui/skeleton';
import { CTInspectionReport } from './CTInspectionReport';

interface CompletedTransformer {
    _id: string;
    jobId: string;
    uniqueId: string;
    currentStage: string;
    orderId?: any; // Populated Order Object
    testHistory?: {
        final_test?: {
            date: string;
            testedBy: string;
            status: string;
            timestamp: string;
            [key: string]: any;
        };
    };
    cores: any[];
}

interface CTInspectionModuleProps {
    userName?: string;
}

export function CTInspectionModule({ userName }: CTInspectionModuleProps) {
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
            const token = localStorage.getItem('token');
            const response = await axios.get(`/final/reports`, {
                withCredentials: true,
                headers: token ? { Authorization: `Bearer ${token}` } : {}
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
        } finally {
            setLoading(false);
        }
    };

    // --- LEVEL 3: REPORT VIEW ---
    if (selectedTransformer) {
        return (
            <div>
                {/* Toolbar */}
                <div className="flex items-center justify-between no-print mb-6">
                    <Button variant="outline" size="sm" onClick={() => setSelectedTransformer(null)} className="gap-2">
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        Back to Transformers
                    </Button>
                    <Badge className="bg-indigo-100 text-indigo-700 mt-1 self-center">Inspection Mode</Badge>
                </div>

                <CTInspectionReport
                    transformer={selectedTransformer as any}
                    testerName={userName || 'Tester'}
                />
            </div>
        );
    }

    // --- LEVEL 2: TRANSFORMERS LIST (For Selected Order) ---
    if (selectedJobId) {
        const jobTransformers = groupByJob[selectedJobId] || [];
        const clientName = jobTransformers[0]?.orderId?.clientName || 'Unknown Client';

        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => setSelectedJobId(null)} className="gap-2">
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        Back to Orders
                    </Button>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Transformers for {selectedJobId}</h2>
                    <p className="text-gray-500 mt-1">{clientName}</p>
                </div>

                <Card className="overflow-hidden border border-gray-200">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase">
                            <tr>
                                <th className="p-4 font-medium">Transformer ID</th>
                                <th className="p-4 font-medium text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {jobTransformers.map((t) => (
                                <tr key={t._id} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="p-4 font-medium text-gray-800">{t.uniqueId}</td>
                                    <td className="p-4 text-center">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 gap-2 border border-indigo-200"
                                            onClick={() => setSelectedTransformer(t)}
                                        >
                                            <FileText className="w-4 h-4" />
                                            Open Inspection Report
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </div>
        );
    }

    // --- LEVEL 1: ORDERS LIST ---
    const jobIds = Object.keys(groupByJob);

    // --- FILTER LOGIC ---
    let filteredJobIds = jobIds;

    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filteredJobIds = filteredJobIds.filter(jobId => {
            if (jobId.toLowerCase().includes(query)) return true;
            const jobTransformers = groupByJob[jobId] || [];
            return jobTransformers.some(tf => tf.uniqueId?.toLowerCase().includes(query));
        });
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">CT Inspection</h2>
                </div>
                <Skeleton className="h-40 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">CT Inspection Module</h2>
                <p className="text-gray-500 mt-1">Select a completed CT transformer to perform the quality inspection report</p>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                    placeholder="Search Job ID or Transformer ID..."
                    className="pl-9 w-full bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {filteredJobIds.length === 0 ? (
                <Card className="p-8 text-center text-gray-500">
                    No completed CT transformers found.
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredJobIds.map((jobId) => {
                        const jobTransformers = groupByJob[jobId] || [];
                        const clientName = jobTransformers[0]?.orderId?.clientName || 'Unknown Client';

                        return (
                            <Card key={jobId} className="p-6 hover:shadow-md transition-all border border-gray-200 flex flex-col justify-between">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-lg text-gray-800">{jobId}</h3>
                                        <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                                            {jobTransformers.length} Unit(s)
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-500 font-medium">{clientName}</p>
                                </div>

                                <Button
                                    className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                                    onClick={() => setSelectedJobId(jobId)}
                                >
                                    View Units <ChevronRight className="w-4 h-4" />
                                </Button>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

import { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { ChevronRight, FileText, Search, Calendar, LayoutGrid, Printer, X } from 'lucide-react';
import axios from 'axios';
import { Skeleton } from '../ui/skeleton';
import { PTReportView } from './PTReportView';
import { PTCompletedTransformersList } from './PTCompletedTransformersList';
import { PTCustomerReport } from './customer-report/PTCustomerReport';

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
        pt_pretest_test?: any;
    };
    coreDetails?: any[];
}

interface PTReportsListProps {
    onBack: () => void;
}

export function PTReportsList({ onBack }: PTReportsListProps) {
    // Data State
    const [reports, setReports] = useState<CompletedTransformer[]>([]);
    const [loading, setLoading] = useState(true);
    const [groupByJob, setGroupByJob] = useState<Record<string, CompletedTransformer[]>>({});

    // UI State
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [selectedTransformer, setSelectedTransformer] = useState<CompletedTransformer | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTester, setSelectedTester] = useState<string>('All');
    const [customerReportJob, setCustomerReportJob] = useState<string | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    // Get Admin status
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isAdmin = user?.role === 'admin' || 
                    user?.designation === 'Admin' || 
                    ['management', 'admin', 'office'].includes((user?.department || '').toLowerCase());

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/pt-tests/reports`, {
                withCredentials: true,
                headers: token ? { Authorization: `Bearer ${token}` } : {}
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
        const orderData = selectedTransformer.orderId || {};
        const ptTest = selectedTransformer.testHistory?.pt_test || {};
        const pretestData = selectedTransformer.testHistory?.pt_pretest_test?.preTesting || {};
        const activeCores = selectedTransformer.coreDetails?.map((c: any) => c.coreType || c.type || 'metering') || ['metering'];

        return (
            <div>
                {/* Toolbar */}
                <div className="flex items-center justify-between no-print mb-6">
                    <Button variant="outline" size="sm" onClick={() => setSelectedTransformer(null)} className="gap-2">
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        Back to Transformers
                    </Button>
                    <div className="flex gap-2">
                        <Badge className="bg-green-100 text-green-700 mt-1 self-center">Completed</Badge>
                        <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
                            <Printer className="w-4 h-4" /> Print Report
                        </Button>
                    </div>
                </div>

                <div ref={printRef}>
                    <PTCustomerReport
                        order={orderData}
                        transformer={selectedTransformer}
                        reportData={ptTest}
                        pretestData={pretestData}
                        activeCores={activeCores}
                        user={null}
                    />
                </div>
            </div>
        );
    }

    // --- LEVEL 2: TRANSFORMERS LIST (For Selected Order) ---
    if (selectedJobId) {
        let jobTransformers = groupByJob[selectedJobId] || [];
        if (selectedTester !== 'All') {
            jobTransformers = jobTransformers.filter(t => (t.testHistory?.pt_test?.['tester'] || t.testHistory?.pt_test?.testedBy) === selectedTester);
        }
        // Extract client name from the first transformer's populated order if available
        const clientName = jobTransformers[0]?.orderId?.clientName || 'Unknown Client';

        return (
            <PTCompletedTransformersList
                transformers={jobTransformers}
                onViewReport={(t) => setSelectedTransformer(t as unknown as CompletedTransformer)}
                onBack={() => setSelectedJobId(null)}
                jobId={selectedJobId}
                clientName={clientName}
            />
        );
    }

    // --- LEVEL 1: ORDERS LIST --- sorted by most recently tested date (newest first)
    const getGroupLatestDate = (transformers: CompletedTransformer[]): number => {
        const dates = transformers.map(t => {
            const ptDateStr = t.testHistory?.pt_test?.['savedAt'] || t.testHistory?.pt_test?.date;
            if (!ptDateStr) return 0;
            const parts = typeof ptDateStr === 'string' ? ptDateStr.split('/') : [];
            if (parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
            return new Date(ptDateStr).getTime();
        }).filter(d => !isNaN(d) && d > 0);
        return dates.length > 0 ? Math.max(...dates) : 0;
    };
    const jobIds = Object.keys(groupByJob).sort((a, b) => getGroupLatestDate(groupByJob[b] || []) - getGroupLatestDate(groupByJob[a] || []));

    // --- FILTER LOGIC ---
    let filteredJobIds = jobIds;

    if (selectedTester !== 'All') {
        filteredJobIds = filteredJobIds.filter(jobId => {
            const jobTransformers = groupByJob[jobId] || [];
            return jobTransformers.some(tf => (tf.testHistory?.pt_test?.['tester'] || tf.testHistory?.pt_test?.testedBy) === selectedTester);
        });
    }

    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filteredJobIds = filteredJobIds.filter(jobId => {
            // 1. Matches Job ID directly
            if (jobId.toLowerCase().includes(query)) return true;

            // 2. Or matches any specific transformer's Unique ID within this job
            const jobTransformers = groupByJob[jobId] || [];
            return jobTransformers.some(tf => tf.uniqueId?.toLowerCase().includes(query));
        });
    }

    const allTesters = Array.from(new Set(reports.map(t => t.testHistory?.pt_test?.['tester'] || t.testHistory?.pt_test?.testedBy).filter(Boolean))).sort() as string[];

    return (
        <div className="space-y-6">
            {/* ── Normal grid view (hidden when viewing a report) ── */}
            {!customerReportJob && (
                <div>
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Completed Customer Reports</h2>
                                <p className="text-gray-500 mt-1">View history of your approved PT tests</p>
                            </div>
                            <Button variant="outline" onClick={onBack}>Back to Dashboard</Button>
                        </div>

                        <div className="flex items-center gap-3 w-full">
                            {isAdmin && (
                                <select
                                    className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[150px] w-48"
                                    value={selectedTester}
                                    onChange={(e) => setSelectedTester(e.target.value)}
                                >
                                    <option value="All">All Testers</option>
                                    {allTesters.map(tester => (
                                        <option key={tester} value={tester}>{tester}</option>
                                    ))}
                                </select>
                            )}

                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <Input
                                    placeholder="Search Job ID or Transformer ID..."
                                    className="pl-9 w-full bg-white"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
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
                                let transformers = groupByJob[jobId] || [];
                                if (selectedTester !== 'All') {
                                    transformers = transformers.filter(t => (t.testHistory?.pt_test?.['tester'] || t.testHistory?.pt_test?.testedBy) === selectedTester);
                                }
                                const count = transformers.length;
                                const orderData = transformers[0]?.orderId || {};
                                const client = orderData.clientName || 'Unknown Client';

                                // Latest test date (timestamp-based)
                                const latestTs = getGroupLatestDate(transformers);
                                const lastTestDate = latestTs > 0 ? new Date(latestTs).toLocaleDateString('en-GB') : 'N/A';

                                return (
                                    <Card
                                        key={jobId}
                                        className="group hover:shadow-lg transition-all duration-200 border-gray-200 hover:border-purple-300 overflow-hidden"
                                    >
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

                                            <div className="pt-2 flex items-center justify-end border-t border-gray-100">
                                                <button
                                                    className="text-xs font-semibold text-purple-600 flex items-center hover:translate-x-1 transition-transform"
                                                    onClick={() => setSelectedJobId(jobId)}
                                                >
                                                    View Transformers <ChevronRight className="w-3 h-3 ml-1" />
                                                </button>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

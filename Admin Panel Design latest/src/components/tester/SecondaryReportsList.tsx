import { SecondaryReportView } from './SecondaryReportView';

// ... (Complete existing imports, but SecondaryReportView added)

export function SecondaryReportsList({ onViewReport, onBack }: SecondaryReportsListProps) {
    const [reports, setReports] = useState<CompletedTransformer[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedJobs, setExpandedJobs] = useState<Record<string, boolean>>({});
    const [groupByJob, setGroupByJob] = useState<Record<string, CompletedTransformer[]>>({});

    // Internal state for viewing a specific report
    const [selectedTransformer, setSelectedTransformer] = useState<CompletedTransformer | null>(null);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            // Endpoint implemented in taskRoutes.js
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
            toast.error("Failed to load completed reports.");
        } finally {
            setLoading(false);
        }
    };

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
    if (selectedTransformer) {
        return (
            <SecondaryReportView
                transformer={selectedTransformer}
                onBack={() => setSelectedTransformer(null)}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">My Completed Reports</h2>
                <Button variant="outline" onClick={onBack}>Back to Dashboard</Button>
            </div>

            {loading ? (
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
                </div>
            )}
        </div>
    );
}

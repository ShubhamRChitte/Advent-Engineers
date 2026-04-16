
import { useState, useEffect } from 'react';
import { Card } from '../../ui/card';

import { Input } from '../../ui/input';
import { ChevronDown, ChevronRight, FileText, Loader2, Search } from 'lucide-react';
import { ReportDetails } from './ReportDetails';

// Helper to group by Job ID
const groupByJob = (transformers: any[]) => {
    return transformers.reduce((groups, tf) => {
        const jobId = tf.jobId || 'Unknown Job';
        if (!groups[jobId]) {
            groups[jobId] = [];
        }
        groups[jobId].push(tf);
        return groups;
    }, {} as Record<string, any[]>);
};

export function SecondaryReportsDashboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [groupedReports, setGroupedReports] = useState<Record<string, any[]>>({});
    const [expandedJobs, setExpandedJobs] = useState<Record<string, boolean>>({});
    const [selectedTransformer, setSelectedTransformer] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/api/secondary/reports', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}` // Ensure auth
                }
            });

            if (!response.ok) throw new Error('Failed to fetch reports');

            const data = await response.json();
            const grouped = groupByJob(data);
            setGroupedReports(grouped);
        } catch (err: any) {
            setError(err.message);
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

    if (selectedTransformer) {
        return <ReportDetails transformer={selectedTransformer} onBack={() => setSelectedTransformer(null)} />;
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-500">Loading your reports...</span>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 p-4">Error: {error}</div>;
    }

    // --- FILTERING LOGIC ---
    // The user wants to search by Job ID or Transformer ID (uniqueId).
    // The current data structure is { "JobID" : [ { uniqueId: "TR-JOB...", ... } ] }
    const filteredGroupedReports: Record<string, any[]> = {};
    const query = searchQuery.trim().toLowerCase();

    Object.entries(groupedReports).forEach(([jobId, transformers]) => {
        if (!query) {
            filteredGroupedReports[jobId] = transformers;
            return;
        }

        // 1. Check if the Job ID itself matches the query
        const jobMatches = jobId.toLowerCase().includes(query);

        // 2. Filter transformers physically to see if any specific transformer ID matches
        const matchingTransformers = transformers.filter(tf => {
            const tfId = tf.uniqueId?.toLowerCase() || '';
            return tfId.includes(query);
        });

        // 3. Keep the Job group if EITHER the Job ID matches (keep all its children) 
        // OR if specific transformers matched (keep only those)
        if (jobMatches) {
            filteredGroupedReports[jobId] = transformers;
        } else if (matchingTransformers.length > 0) {
            filteredGroupedReports[jobId] = matchingTransformers;
        }
    });

    const jobIds = Object.keys(filteredGroupedReports).sort();

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">My Reports</h2>
                    <p className="text-gray-500">View and generate certificates for your completed tests.</p>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                        placeholder="Search by Job ID or Transformer ID..."
                        className="pl-9 w-full bg-white shadow-sm border-gray-200"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {jobIds.length === 0 ? (
                <Card className="p-8 text-center text-gray-500 bg-gray-50 border-dashed">
                    <p>No completed reports found.</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {jobIds.map(jobId => (
                        <Card key={jobId} className="overflow-hidden border-gray-200">
                            <div
                                className="flex items-center justify-between p-4 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => toggleJob(jobId)}
                            >
                                <div className="flex items-center gap-3">
                                    {expandedJobs[jobId] ? (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    )}
                                    <div>
                                        <h3 className="font-semibold text-lg">{jobId}</h3>
                                        <p className="text-sm text-gray-500">{filteredGroupedReports[jobId]?.length || 0} Transformers Completed</p>
                                    </div>
                                </div>
                            </div>

                            {(expandedJobs[jobId] || query) && ( // Auto-expand if searching
                                <div className="bg-gray-50 p-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {(filteredGroupedReports[jobId] || []).map((tf, idx) => (
                                        <div
                                            key={tf.uniqueId || idx}
                                            onClick={() => setSelectedTransformer(tf)}
                                            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md cursor-pointer flex items-center gap-3 transition-all"
                                        >
                                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-gray-900">{tf.uniqueId}</p>
                                                <p className="text-xs text-gray-500 truncate">{tf.name || 'Unknown Name'}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {tf.testHistory?.secondary_test?.timestamp
                                                        ? new Date(tf.testHistory.secondary_test.timestamp).toLocaleDateString()
                                                        : 'No Date'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

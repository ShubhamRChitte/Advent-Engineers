import { useState, useEffect } from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { ChevronDown, ChevronRight, FileText, Loader2 } from 'lucide-react';
import { ReportDetails } from './ReportDetails';

export function SecondaryReportsDashboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reports, setReports] = useState<any[]>([]);
    const [selectedTransformer, setSelectedTransformer] = useState<any | null>(null);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:3002/api/secondary/reports', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}` // Ensure auth
                }
            });

            if (!response.ok) throw new Error('Failed to fetch reports');

            const data = await response.json();
            setReports(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
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

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">My Reports</h2>
                <p className="text-gray-500">View and generate certificates for your completed tests.</p>
            </div>

            {reports.length === 0 ? (
                <Card className="p-8 text-center text-gray-500 bg-gray-50 border-dashed">
                    <p>No completed reports found.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reports.map((tf, idx) => (
                        <div
                            key={tf.uniqueId || idx}
                            onClick={() => setSelectedTransformer(tf)}
                            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md cursor-pointer flex items-center gap-3 transition-all"
                        >
                            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-medium text-sm text-gray-900 truncate" title={tf.uniqueId}>{tf.uniqueId}</p>
                                <p className="text-xs text-gray-500 truncate" title={tf.jobId}>{tf.jobId || 'No Job ID'}</p>
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
        </div>
    );
}

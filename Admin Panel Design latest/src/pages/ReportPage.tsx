import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Printer, ArrowLeft, Loader2, Database } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { PrintableCoreReport } from '../components/reports/PrintableCoreReport';

export function ReportPage() {
    const [order, setOrder] = useState<any>(null);
    const [selectedCore, setSelectedCore] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Basic router fallback: Parse jobId from /report/:jobId
        const pathParts = window.location.pathname.split('/');
        const jobId = pathParts[pathParts.length - 1];

        if (!jobId) {
            setError("No Job ID provided");
            setLoading(false);
            return;
        }

        fetchReport(jobId);
    }, []);

    const fetchReport = async (jobId: string) => {
        try {
            setLoading(true);
            const res = await axios.get(`http://localhost:3002/api/core-tests/report/${jobId}`, {
                withCredentials: true,
            });

            const fetchedOrder = res.data;
            setOrder(fetchedOrder);

            // Set first core as default if reportData exists and is an array
            if (fetchedOrder && Array.isArray(fetchedOrder.reportData) && fetchedOrder.reportData.length > 0) {
                setSelectedCore(fetchedOrder.reportData[0]);
            }

        } catch (err: any) {
            console.error('Failed to fetch report:', err);
            setError(err.response?.data?.error || "Failed to load report data");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-24 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p>Loading Core Testing Reports...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="p-12 max-w-2xl mx-auto">
                <Alert className="bg-red-50 text-red-700 border-red-200">
                    <AlertDescription>
                        {error || 'Report not found for this Job ID'}
                    </AlertDescription>
                </Alert>
                <Button variant="outline" className="mt-6" onClick={() => window.close()}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Close Tab
                </Button>
            </div>
        );
    }

    // Checking if multi-core data is truly available
    const hasCoreData = Array.isArray(order.reportData) && order.reportData.length > 0;

    return (
        <div className="min-h-screen bg-gray-50 pb-12 print:bg-white print:pb-0">

            {/* Top Banner (Hidden in Print) */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm print:hidden">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => window.close()} className="text-gray-500">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-lg font-semibold text-gray-900 border-l px-4 border-gray-300">
                                Detailed Reports: {order.jobId}
                            </h1>
                        </div>
                    </div>
                    {hasCoreData && (
                        <Button
                            onClick={handlePrint}
                            className="bg-[#003a70] hover:bg-[#002850] text-white"
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            Download PDF
                        </Button>
                    )}
                </div>
            </div>

            <div className="max-w-4xl mx-auto mt-8 print:mt-0 print:max-w-none">

                {hasCoreData ? (
                    <>
                        {/* Tab Menu UI for Multiple Cores (Hidden in print) */}
                        <div className="flex items-center gap-2 mb-6 no-print overflow-x-auto pb-2 print:hidden">
                            {order.reportData.map((core: any, index: number) => {
                                const isSelected = selectedCore && selectedCore.coreType === core.coreType;
                                return (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedCore(core)}
                                        className={`
                                            px-6 py-2.5 rounded-t-lg font-medium text-sm transition-colors border-b-2
                                            ${isSelected
                                                ? 'bg-white border-[#003a70] text-[#003a70] shadow-sm'
                                                : 'bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200'
                                            }
                                        `}
                                    >
                                        {core.coreName || `Core ${index + 1}`}
                                        {isSelected && <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-[#003a70]"></span>}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Actual Report Component */}
                        <Card className="p-0 overflow-hidden shadow-xl border-none print:shadow-none print:border-none print:p-0 bg-white">
                            <PrintableCoreReport order={order} coreData={selectedCore} />
                        </Card>
                    </>
                ) : (
                    <Card className="p-12 text-center text-gray-500 flex flex-col items-center">
                        <Database className="w-12 h-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">No Reports Generated Yet</h3>
                        <p className="max-w-md mx-auto">
                            The test reports for this order have not been finalized and saved into the required multi-core format.
                            Complete the testing pipeline to generate the report data.
                        </p>
                    </Card>
                )}
            </div>

        </div>
    );
}

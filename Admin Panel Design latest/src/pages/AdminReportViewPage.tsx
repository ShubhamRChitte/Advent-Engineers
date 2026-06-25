import { useEffect, useState, useRef } from 'react';
import axios from '@/utils/axiosConfig';
import { useReactToPrint } from 'react-to-print';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Printer, ArrowLeft, Loader2, Database } from 'lucide-react';
import { PTFinalPrintableReport } from '../components/tester/PTFinalPrintableReport';
import { PrintableCoreReport } from '../components/reports/PrintableCoreReport';
import { ctReportViewStyles } from '../components/tester/CTTestReportView';
import { secondaryReportPrintStyles } from '../components/tester/SecondaryReportPrintLayout';
import { SecondaryReportView } from '../components/tester/SecondaryReportView';
import { UnifiedCTReport } from '../components/tester/reports/UnifiedCTReport';

export function AdminReportViewPage() {
    const [transformer, setTransformer] = useState<any>(null);
    const [order, setOrder] = useState<any>(null);
    const [testType, setTestType] = useState<string>('core');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Core specific states
    const [reportData, setReportData] = useState<any>(null);
    const [unifiedReport, setUnifiedReport] = useState<any>(null);
    const [selectedCore, setSelectedCore] = useState<any>(null);
    const [globalCoreType, setGlobalCoreType] = useState<'Metering' | 'Protection' | 'PS' | 'QA'>('Metering');
    const [initialCoreSet, setInitialCoreSet] = useState(false);

    useEffect(() => {
        if (unifiedReport?.reportData && unifiedReport.reportData.length > 0) {
            // Find if current type exists
            const coreExists = unifiedReport.reportData.some((c: any) => c.coreType === globalCoreType);
            if (!coreExists || !initialCoreSet) {
                // If current type doesn't exist or we haven't set an initial one yet,
                // set to the first one available in the report.
                const firstAvailableType = unifiedReport.reportData[0].coreType as 'Metering' | 'Protection' | 'PS' | 'QA';
                if (firstAvailableType) {
                    setGlobalCoreType(firstAvailableType);
                    setSelectedCore(unifiedReport.reportData[0]);
                    setInitialCoreSet(true);
                }
            } else {
                // Keep current globalCoreType but ensure selectedCore is synced
                const core = unifiedReport.reportData.find((c: any) => c.coreType === globalCoreType);
                if (core) {
                    setSelectedCore(core);
                }
            }
        }
    }, [globalCoreType, unifiedReport, initialCoreSet]);

    useEffect(() => {
        const pathParts = window.location.pathname.split('/');
        const id = pathParts[pathParts.length - 1];
        
        const params = new URLSearchParams(window.location.search);
        const type = params.get('type') || 'core';
        setTestType(type);

        if (!id) {
            setError("No Transformer ID provided");
            setLoading(false);
            return;
        }

        fetchData(id, type);
    }, []);

    const fetchData = async (id: string, type: string) => {
        setLoading(true);
        try {
            // First fetch the basic transformer info
            const res = await axios.get(`/reports/${id}?stage=${type}`, {
                withCredentials: true
            });
            
            if (res.data.success) {
                const fetchedTransformer = res.data.data;
                const orderData = fetchedTransformer.orderId;

                // Normalize Transformer Data (Flatten from Order)
                // This matches the mapping in SecondaryTransformersList.tsx
                if (orderData) {
                    fetchedTransformer.clientName = orderData.clientName;
                    fetchedTransformer.jobId = orderData.jobId;
                    fetchedTransformer.voltageRating = orderData.voltageRating;
                    fetchedTransformer.stc = orderData.stc;
                    fetchedTransformer.burden = orderData.burden;
                    fetchedTransformer.ratedPrimaryCurrent = orderData.ratedPrimaryCurrent;
                    fetchedTransformer.ratedSecondaryCurrent = orderData.ratedSecondaryCurrent;
                    
                    // Add other derived display fields if missing
                    if (!fetchedTransformer.name) fetchedTransformer.name = orderData.transformerName || 'Transformer';
                    if (!fetchedTransformer.rating) {
                        fetchedTransformer.rating = Array.isArray(orderData.ratio) ? orderData.ratio.join('/') : (orderData.ratio || 'N/A');
                    }
                    if (!fetchedTransformer.voltageClass) {
                        fetchedTransformer.voltageClass = orderData.nominalSystemVoltage ? `${orderData.nominalSystemVoltage}kV` : 'N/A';
                    }
                    if (!fetchedTransformer.ratios) {
                        fetchedTransformer.ratios = Array.isArray(orderData.ratio) ? orderData.ratio : (orderData.ratio ? [orderData.ratio] : ['N/A']);
                    }
                }

                setTransformer(fetchedTransformer);
                setOrder(orderData);
                setReportData(fetchedTransformer);

                // If core or all, fetch core specific datasets from unified endpoint
                if (type === 'core' || type === 'all') {
                    const jobId = fetchedTransformer.jobId;
                    if (jobId) {
                        try {
                            const coreRes = await axios.get(`/core-tests/report/${jobId}`, {
                                withCredentials: true
                            });
                            if (coreRes.data) {
                                setUnifiedReport(coreRes.data);
                                if (coreRes.data.reportData && coreRes.data.reportData.length > 0) {
                                    const firstCore = coreRes.data.reportData[0];
                                    setSelectedCore(firstCore);
                                    if (firstCore.coreType) {
                                        setGlobalCoreType(firstCore.coreType);
                                        setInitialCoreSet(true);
                                    }
                                }
                            }
                        } catch (err) {
                            console.error("Failed to fetch unified core report:", err);
                        }
                    }
                }
            }
 else {
                setError("Failed to load report data");
            }
        } catch (err: any) {
            console.error('Failed to fetch report:', err);
            setError(err.response?.data?.error || "Failed to load report data");
        } finally {
            setLoading(false);
        }
    };


    const printRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        pageStyle: `
            @page { size: A4 portrait; margin: 15mm 10mm; }
            @media print {
                html, body {
                    width: 190mm !important;
                    max-width: 190mm !important;
                    margin: 0 auto !important;
                    padding: 0 !important;
                    background: white !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                #printable-report {
                    width: 190mm !important;
                    max-width: 190mm !important;
                    margin: 0 auto !important;
                    padding: 0 !important;
                }
                .secondary-print-page, .secondary-report-wrapper, .cr-print-root, .pt-final-print-root, .ct-print-root, #print-section {
                    width: 100% !important;
                    max-width: 100% !important;
                    margin: 0 auto !important;
                    box-shadow: none !important;
                    border: none !important;
                    padding: 0 !important;
                }
                /* Prevent Tailwind containers from breaking the print width */
                .container, .max-w-\\[1200px\\], .max-w-\\[1000px\\], .w-full, .flex {
                    width: 100% !important;
                    max-width: 100% !important;
                    min-width: 0 !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    display: block !important;
                }
                .no-print, .print\\:hidden {
                    display: none !important;
                }
            }
        `
    });
    const handleBack = () => {
        const params = new URLSearchParams(window.location.search);
        const fromUrl = params.get('from');
        if (fromUrl) {
            window.location.href = fromUrl;
        } else {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.close();
            }
        }
    };

    const renderCoreReport = () => {
        if (!unifiedReport || !unifiedReport.reportData || unifiedReport.reportData.length === 0) {
            return (
                <Card className="p-12 text-center text-gray-500 flex flex-col items-center">
                    <Database className="w-12 h-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No Reports Generated Yet</h3>
                    <p className="max-w-md mx-auto">
                        The test reports for this order have not been finalized into the required multi-core format.
                    </p>
                </Card>
            );
        }

        return (
            <div className="space-y-6">
                {/* Tab Menu UI for Multiple Cores (Hidden in print) */}
                <div className="flex items-center gap-2 mb-6 no-print overflow-x-auto pt-2 pb-2 print:hidden bg-gray-50/95 backdrop-blur-sm sticky top-0 z-40">
                    {unifiedReport.reportData.map((core: any, index: number) => {
                        const isSelected = globalCoreType === core.coreType;
                        return (
                            <button
                                key={index}
                                onClick={() => setGlobalCoreType(core.coreType)}
                                className={`
                                    px-6 py-2.5 rounded-t-lg font-bold text-sm transition-all border-b-2 whitespace-nowrap
                                    ${isSelected
                                        ? 'bg-white border-[#1e40af] text-[#1e40af] shadow-sm'
                                        : 'bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200'
                                    }
                                `}
                            >
                                {core.coreType || `Core ${index + 1}`} Test
                                {isSelected && <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-[#1e40af]"></span>}
                            </button>
                        );
                    })}
                </div>

                {/* Actual Report Component */}
                <Card className="p-0 overflow-hidden shadow-xl border-none print:shadow-none print:border-none print:p-0 bg-white">
                    <PrintableCoreReport order={unifiedReport} coreData={selectedCore} />
                </Card>
            </div>
        );
    };

    const renderHeatingReport = () => {
        const heatingRecord = 
            transformer?.testHistory?.heating_test || 
            transformer?.heatingRecordFromCollection || 
            transformer?.processHistory?.ptHeatingRecord?.[0] ||
            transformer?.processHistory?.heatingRecord?.[0];
        
        if (!heatingRecord) {
            return (
                <div className="p-12 text-center text-gray-500 bg-white rounded-lg shadow-sm border border-dashed border-gray-300">
                    <Database className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Heating Test Not Available</h3>
                    <p>No heating process data found for this transformer.</p>
                </div>
            );
        }

        const formatDateTimeStr = (isoStr: string) => {
            if (!isoStr) return "-";
            const date = new Date(isoStr);
            // We use 'en-GB' for DD/MM/YYYY format and 24h time
            return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        };

        const voltage = transformer.orderId?.nominalSystemVoltage || order?.nominalSystemVoltage || "";
        const type = transformer.orderId?.transformerType || order?.transformerType || "CT";
        const titleSuffix = voltage ? ` [${voltage}KV ${type}]` : "";

        return (
            <div id="print-section" className="bg-white p-8 min-h-[297mm] print:p-0">
                {/* Header Information */}
                <div className="border-b-2 border-black pb-6 mb-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">HEATING RECORD{titleSuffix}</h1>
                            <p className="text-gray-500 font-medium italic">
                                {type === 'PT' ? "Potential Transformer Process Record" : "Toroidal Transformer Process Record"}
                            </p>
                        </div>
                        <div className="text-right space-y-1">
                            <div className="flex justify-end gap-3 text-sm">
                                <span className="font-bold text-gray-500 uppercase">Client Name:</span>
                                <span className="font-semibold">{transformer.clientName || transformer.orderId?.clientName || "N/A"}</span>
                            </div>
                            <div className="flex justify-end gap-3 text-sm">
                                <span className="font-bold text-gray-500 uppercase">Job ID:</span>
                                <span className="font-semibold">{transformer.jobId || "N/A"}</span>
                            </div>
                            <div className="flex justify-end gap-3 text-sm">
                                <span className="font-bold text-gray-500 uppercase">Serial No:</span>
                                <span className="font-semibold">{heatingRecord.serialNumber || transformer.uniqueId || "N/A"}</span>
                            </div>
                            <div className="flex justify-end gap-3 text-sm">
                                <span className="font-bold text-gray-500 uppercase">Report Date:</span>
                                <span className="font-semibold">{new Date(heatingRecord.reportDate || transformer.updatedAt).toLocaleDateString('en-GB')}</span>
                            </div>
                        </div>
                    </div>


                </div>

                {/* Process Table */}
                <table className="w-full border-collapse border-2 border-black text-sm">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="border border-black p-3 font-bold text-left w-[25%] uppercase tracking-wider">Process</th>
                            <th className="border border-black p-3 font-bold text-center w-[12%] uppercase tracking-wider">Duration</th>
                            <th className="border border-black p-3 font-bold text-center w-[25%] uppercase tracking-wider">Start Date & Time</th>
                            <th className="border border-black p-3 font-bold text-center w-[25%] uppercase tracking-wider">Completion Date & Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {heatingRecord.processSteps?.map((step: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="border border-black p-3 font-semibold text-gray-800">{step.process || "-"}</td>
                                <td className="border border-black p-3 font-medium text-center text-gray-600">{step.duration || "-"}</td>
                                <td className="border border-black p-3 font-medium text-center text-gray-700">{formatDateTimeStr(step.startDateTime)}</td>
                                <td className="border border-black p-3 font-medium text-center text-gray-700">{formatDateTimeStr(step.completionDateTime)}</td>
                            </tr>
                        ))}
                        {(!heatingRecord.processSteps || heatingRecord.processSteps.length === 0) && (
                            <tr>
                                <td colSpan={4} className="border border-black p-8 text-center text-gray-400 italic">No process steps recorded.</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Signatures */}
                <div className="mt-16 flex justify-between px-10">
                    <div className="text-center pt-2 border-t border-gray-300 w-48">
                        <span className="text-[11px] font-bold text-gray-400 uppercase">Tested By</span>
                        <p className="font-semibold text-gray-800 mt-1">{heatingRecord.preparedBy || "N/A"}</p>
                    </div>
                </div>
            </div>
        );
    };


    const renderAllReports = () => {
        const orderData = order || transformer?.orderId;
        const isPT = transformer?.currentStage === 'pt' || transformer?.testHistory?.pt_test || orderData?.transformerType === 'PT';
        
        if (isPT) {
            const cores = orderData?.coreDetails || orderData?.coreConfigs || [];
            let countMetering = 0;
            let countProtection = 0;
            let countPS = 0;
            const coresList: string[] = [];
            cores.forEach((core: any) => {
                const type = typeof core === 'string' ? core : core.coreType;
                if (type?.toLowerCase() === 'metering') {
                    countMetering++;
                    const coreId = countMetering > 1 ? `metering${countMetering}` : 'metering';
                    coresList.push(coreId);
                }
                if (type?.toLowerCase() === 'protection') {
                    countProtection++;
                    const coreId = `protection${countProtection}`;
                    coresList.push(coreId);
                }
                if (type?.toLowerCase() === 'ps') {
                    countPS++;
                    const coreId = `ps${countPS}`;
                    coresList.push(coreId);
                }
            });

            return (
                <div className="w-full overflow-x-auto bg-gray-50 py-4 flex justify-start md:justify-center no-print-scroll">
                    <div className="print-container w-[210mm] min-w-[210mm] print:w-full print:min-w-0 print:max-w-full">
                        <PTFinalPrintableReport
                            printRef={printRef}
                            order={orderData}
                            transformer={transformer}
                            reportData={transformer?.testHistory?.pt_test || {}}
                            pretestData={transformer?.testHistory?.pt_test?.preTesting || {}}
                            activeCores={coresList}
                            user={null}
                            isReadOnly={true}
                        />
                    </div>
                </div>
            );
        }

        return <UnifiedCTReport transformer={transformer} order={orderData} />;
    };

    const renderContent = () => {
        const currentTransformer = reportData || transformer;
        
        switch (testType) {
            case 'core': return <div className="max-w-[850px] mx-auto mt-6 print:mt-0 print:max-w-none">{renderCoreReport()}</div>;
            case 'secondary':
            case 'primary':
            case 'final':
                return (
                    <div className="w-full overflow-x-auto bg-gray-50 py-4 flex justify-start md:justify-center no-print-scroll print:p-0 print:bg-white">
                        <div className="max-w-[1000px] mx-auto mt-6 print:mt-0 print:max-w-none" id="secondary-printable-report">
                            <SecondaryReportView
                                transformer={currentTransformer}
                                stage={testType as 'secondary' | 'primary' | 'final'}
                                onBack={handleBack}
                            />
                        </div>
                    </div>
                );
            case 'heating':
                return <div className="max-w-[1000px] mx-auto mt-6 print:mt-0 print:max-w-none">
                    <Card className="p-0 overflow-hidden shadow-xl border-none print:shadow-none print:border-none print:p-0 bg-white">
                        {renderHeatingReport()}
                    </Card>
                </div>;
            case 'pt': 
                return <div className="max-w-[1000px] mx-auto mt-6 print:mt-0 print:max-w-none">
                    {renderAllReports()}
                </div>;
            case 'all': return <div className="max-w-6xl mx-auto">{renderAllReports()}</div>;
            default: return <div className="p-12 text-center text-red-500">Unknown Report Type</div>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                <p className="text-lg font-medium text-gray-700">Generating Full-Screen Report...</p>
            </div>
        );
    }

    if (error || !transformer) {
        return (
            <div className="min-h-screen p-12 bg-gray-50 flex flex-col items-center justify-center">
                <Card className="p-8 max-w-md w-full border-red-200">
                    <h2 className="text-red-600 flex items-center gap-2 mb-4">
                        <ArrowLeft className="w-5 h-5" />
                        Error Loading Report
                    </h2>
                    <p className="text-gray-700 border-l-4 border-red-500 pl-4 mb-6">{error || "Report context is missing."}</p>
                    <Button className="w-full" variant="outline" onClick={handleBack}>
                        Go Back
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-gray-50 print:h-auto print:block print:overflow-visible print:bg-white">
            {/* Top Toolbar (Matches screenshots exactly) */}
            <header className="bg-white border-b border-gray-200 flex-none shadow-sm no-print print:hidden">
                <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleBack} 
                            className="text-gray-500 hover:text-gray-900"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <div className="h-6 w-px bg-gray-300 mx-2" />
                        <h1 className="text-lg font-semibold text-gray-900 tracking-tight">
                            Detailed Reports: {transformer.jobId || (order || transformer.orderId)?.jobId || 'N/A'}
                        </h1>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="default" 
                            size="sm"
                            className="bg-[#003a70] hover:bg-[#002850] text-white gap-2 font-medium"
                            onClick={handlePrint}
                        >
                            <Printer className="w-4 h-4" />
                            Download PDF
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Report Container */}
            <main className="flex-1 overflow-y-auto min-h-0 bg-gray-50 print:overflow-visible print:bg-white">
                <div className="container mx-auto px-4 py-8 max-w-[1200px] print:max-w-none print:px-0 print:py-0">
                    <div ref={printRef} id="printable-report" className="animate-in fade-in duration-500">
                        {renderContent()}
                    </div>
                </div>
            </main>

            {/* Removed redundant inline print styles that conflict with UnifiedCoreReport.css */}
        </div>
    );
}

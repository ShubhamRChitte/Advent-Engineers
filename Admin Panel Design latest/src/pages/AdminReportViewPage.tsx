import { useEffect, useState } from 'react';
import axios from '@/utils/axiosConfig';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Printer, ArrowLeft, Loader2, Database } from 'lucide-react';
import { CTTestReportView } from '../components/tester/CTTestReportView';
import { PTReportView } from '../components/tester/PTReportView';
import { PrintableCoreReport } from '../components/reports/PrintableCoreReport';
import { ctReportViewStyles } from '../components/tester/CTTestReportView';
import { secondaryReportPrintStyles } from '../components/tester/SecondaryReportPrintLayout';

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


    const handlePrint = () => {
        const printContent = document.getElementById('printable-report');
        if (!printContent) {
            window.print();
            return;
        }
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) {
            alert('Please allow pop-ups for this site to print reports.');
            return;
        }

        const isSecondaryRelated = testType === 'secondary' || testType === 'primary' || testType === 'final';
        const extraStyles = isSecondaryRelated ? `
            ${secondaryReportPrintStyles}
            ${ctReportViewStyles}
            /* Extra overrides for popup window printing */
            .secondary-print-page, .secondary-report-wrapper {
                width: 190mm !important;
                margin: 0 auto !important;
                box-shadow: none !important;
                border: none !important;
                padding: 0 !important;
            }
        ` : '';

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Advent Engineers – Test Report</title>
                <meta charset="utf-8" />
                <style>
                    *, *::before, *::after { box-sizing: border-box; }
                    @page { size: A4 portrait; margin: 10mm; }
                    body { margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Arial, sans-serif; background: white; color: black; }
                    .no-print, .print\\:hidden, [class*="no-print"], button, .sticky { display: none !important; }
                    table { border-collapse: collapse; width: 100%; }
                    td, th { border: 1px solid #000; padding: 4px; font-size: 11px; }
                    .report-header-grid { display: grid; grid-template-columns: 1fr 1fr; border: 1.5px solid #000; }
                    .header-left { padding: 10px; border-right: 1.5px solid #000; display: flex; flex-direction: column; justify-content: center; }
                    .header-right { display: grid; grid-template-rows: repeat(5, 1fr); }
                    .header-field { display: grid; grid-template-columns: 100px 1fr; border-bottom: 1px solid #000; font-size: 11px; }
                    .header-field:last-child { border-bottom: none; }
                    .field-label { padding: 4px 8px; border-right: 1px solid #000; text-align: right; font-weight: 600; }
                    .field-value { padding: 4px 8px; font-weight: 500; }
                    .report-title-banner { border: 1.5px solid #000; text-align: center; padding: 6px; font-weight: bold; font-size: 18px; text-transform: uppercase; }
                    .description-banner { border: 1.5px solid #000; border-top: none; text-align: center; padding: 4px; font-weight: bold; font-size: 14px; }
                    .nested-table { width: 100%; border-collapse: collapse; border: 1.5px solid #000; table-layout: fixed; }
                    .nested-table td, .nested-table th { border: 1px solid #000; padding: 4px; text-align: center; font-size: 11px; height: 24px; }
                    .bg-yellow { background-color: #f1f5f9 !important; }
                    .footer-sig { margin-top: 40px; display: flex; justify-content: space-between; padding: 0 40px; }
                    .sig-item { text-align: center; width: 200px; }
                    .sig-line { border-top: 1.5px solid #000; margin-top: 60px; padding-top: 5px; font-weight: bold; font-size: 13px; }
                    input { border: none; text-align: center; font-size: 11px; background: transparent; width: 100%; }
                    .text-red-600, .text-\\[\\#003a70\\] { color: black !important; }
                    .text-2xl { font-size: 1.5rem; }
                    .font-bold { font-weight: 700; }
                    .italic { font-style: italic; }
                    .divide-y > div + div { border-top: 2px solid #ccc; margin-top: 16px; padding-top: 16px; }
                    @media print {
                        .divide-y > div + div { border-top: none; page-break-before: auto; }
                    }
                    ${extraStyles}
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
                <script>
                    window.onload = function() {
                        setTimeout(function() { window.print(); window.close(); }, 400);
                    };
                <\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleBack = () => {
        window.location.href = window.location.origin;
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
                <div className="flex items-center gap-2 mb-6 no-print overflow-x-auto pb-2 print:hidden backdrop-blur-sm sticky top-16 z-40">
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
            return (
                <div className="space-y-12">
                    <div className="report-section print:border-none print:pt-0">
                        <PTReportView transformer={transformer} order={orderData} onBack={handleBack} readOnly={true} />
                    </div>
                
                    <div className="pt-12 border-t-4 border-double border-gray-300 report-section print:border-none print:pt-0 print:break-before-page">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2 print:hidden">
                            <span className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm">2</span>
                            Heating Test Report
                        </h2>
                        <Card className="p-0 overflow-hidden shadow-xl border-none print:shadow-none print:border-none print:p-0 bg-white">
                            {renderHeatingReport()}
                        </Card>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-12">
                <div className="report-section">
                    {renderCoreReport()}
                </div>
                
                <div className="report-section print:break-before-page">
                    <h2 className="text-xl font-bold mb-4 text-gray-700 print:hidden">Secondary Test Results</h2>
                    <CTTestReportView transformer={transformer} stage="secondary" />
                </div>

                <div className="report-section print:break-before-page" style={{ marginTop: 32 }}>
                    <h2 className="text-xl font-bold mb-4 text-gray-700 print:hidden">Primary Test Results</h2>
                    <CTTestReportView transformer={transformer} stage="primary" />
                </div>

                <div className="pt-12 border-t-4 border-double border-gray-300 report-section print:break-before-page">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2 print:hidden">
                        <span className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm">4</span>
                        Heating Test Report
                    </h2>
                    <Card className="p-0 overflow-hidden shadow-xl border-none print:shadow-none print:border-none print:p-0 bg-white">
                        {renderHeatingReport()}
                    </Card>
                </div>

                {transformer.testHistory?.final_test && (
                    <div className="report-section print:break-before-page" style={{ marginTop: 32 }}>
                        <h2 className="text-xl font-bold mb-4 text-gray-700 print:hidden">Final Test Results</h2>
                        <CTTestReportView transformer={transformer} stage="final" />
                    </div>
                )}
            </div>
        );
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
                        <div className="max-w-[1000px] mx-auto mt-6 print:mt-0 print:max-w-none">
                            <CTTestReportView transformer={currentTransformer} stage={testType as 'secondary' | 'primary' | 'final'} />
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
        <div className="min-h-screen bg-gray-50 pb-20 print:bg-white print:pb-0">
            {/* Top Toolbar (Matches screenshots exactly) */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-[100] shadow-sm no-print print:hidden">
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
            <main className="container mx-auto px-4 py-8 max-w-[1200px] print:max-w-none print:px-0 print:py-0">
                <div id="printable-report" className="animate-in fade-in duration-500">
                    {renderContent()}
                </div>
            </main>

            {/* Removed redundant inline print styles that conflict with UnifiedCoreReport.css */}
        </div>
    );
}

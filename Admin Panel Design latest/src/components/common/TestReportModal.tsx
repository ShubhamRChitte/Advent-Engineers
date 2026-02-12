import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { SecondaryReportView } from "../tester/SecondaryReportView";
import { Card } from "../ui/card";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ScrollArea } from "../ui/scroll-area";

interface TestReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    transformer: any;
    testType: 'core' | 'secondary' | 'primary' | 'final';
}

export function TestReportModal({ isOpen, onClose, transformer, testType }: TestReportModalProps) {
    const [meteringData, setMeteringData] = useState<any>(null);
    const [protectionData, setProtectionData] = useState<any>(null);
    const [psData, setPsData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && testType === 'core' && transformer?.orderId) {
            fetchCoreData();
        }
    }, [isOpen, testType, transformer]);

    const fetchCoreData = async () => {
        setLoading(true);
        try {
            const orderId = transformer.orderId._id || transformer.orderId; // Handle populated or raw ID

            // Fetch Metering
            const metRes = await fetch(`http://localhost:3002/api/metering-tests/${orderId}`);
            const metData = await metRes.json();
            if (metData) setMeteringData(metData);

            // Fetch Protection
            const protRes = await fetch(`http://localhost:3002/api/protection-tests/${orderId}?type=Protection`);
            const protData = await protRes.json();
            if (protData) setProtectionData(protData);

            // Fetch PS
            const psRes = await fetch(`http://localhost:3002/api/protection-tests/${orderId}?type=PS`);
            const psData = await psRes.json();
            if (psData) setPsData(psData);

        } catch (error) {
            console.error("Error fetching core test data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!transformer) return null;

    const getTitle = () => {
        switch (testType) {
            case 'core': return `Core Test Report - ${transformer.uniqueId}`;
            case 'secondary': return `Secondary Test Report - ${transformer.uniqueId}`;
            case 'primary': return `Primary Test Report - ${transformer.uniqueId}`;
            case 'final': return `Final Test Report - ${transformer.uniqueId}`;
            default: return 'Test Report';
        }
    };

    const renderCoreReport = () => {
        if (loading) return <div className="p-4 text-center">Loading core test data...</div>;

        const hasMetering = meteringData?.readings?.length > 0;
        const hasProtection = protectionData?.readings?.length > 0;
        const hasPS = psData?.readings?.length > 0;

        if (!hasMetering && !hasProtection && !hasPS) {
            // Fallback to legacy history if no new API data found
            const history = transformer.testHistory?.core_test;
            if (history && (history.metering_results?.length > 0 || history.protection_results?.length > 0)) {
                return renderLegacyCoreReport(history);
            }
            return <div className="p-4 text-center">No Core Test data found for this order.</div>;
        }

        return (
            <ScrollArea className="h-[70vh]">
                <div className="space-y-6 p-2">
                    {/* Metering Section */}
                    {meteringData && (
                        <Card className="p-4">
                            <h3 className="font-bold mb-2 text-lg border-b pb-2">Metering Core Results</h3>
                            <div className="text-sm text-gray-500 mb-4 bg-gray-50 p-2 rounded">
                                <p><strong>Material:</strong> {meteringData.testSetup?.coreMaterial} | <strong>Turns:</strong> {meteringData.testSetup?.turnsUsed}</p>
                                <p><strong>Limits:</strong> BSAT: {meteringData.testLimits?.bsatGauss?.join(', ')}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {meteringData.readings?.map((reading: any, idx: number) => (
                                    <Card key={idx} className="p-3 border shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <span className="font-semibold text-sm">Core #{reading.internalCoreNo}</span>
                                                <div className="text-xs text-gray-500">Vendor: {reading.vendorCoreNo}</div>
                                                <div className="text-xs text-gray-400">{new Date(reading.date).toLocaleDateString()}</div>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${reading.result === 'P' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {reading.result === 'P' ? 'PASS' : 'FAIL'}
                                            </span>
                                        </div>
                                        {reading.measuredMa && (
                                            <div className="mt-2">
                                                <div className="text-xs font-medium mb-1">Measured (mA):</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {reading.measuredMa.map((val: number, vIdx: number) => (
                                                        <span key={vIdx} className="bg-gray-100 px-1.5 py-0.5 rounded text-xs border">{val}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Protection Section */}
                    {protectionData && (
                        <Card className="p-4">
                            <h3 className="font-bold mb-2 text-lg border-b pb-2">Protection Core Results</h3>
                            <div className="text-sm text-gray-500 mb-4 bg-gray-50 p-2 rounded">
                                <p><strong>Desc:</strong> {protectionData.testSetup?.description} | <strong>Turns:</strong> {protectionData.testSetup?.turnsUsed}</p>
                                <p><strong>Specs:</strong> Flux: {protectionData.testSpecification?.fluxTesla}T | Iex: {protectionData.testSpecification?.iexLimitMa}mA</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {protectionData.readings?.map((reading: any, idx: number) => (
                                    <Card key={idx} className="p-3 border shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <span className="font-semibold text-sm">Core #{reading.internalCoreNo}</span>
                                                <div className="text-xs text-gray-500">Vendor: {reading.vendorCoreNo}</div>
                                                <div className="text-xs text-gray-400">{new Date(reading.date).toLocaleDateString()}</div>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${reading.result === 'P' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {reading.result === 'P' ? 'PASS' : 'FAIL'}
                                            </span>
                                        </div>
                                        <div className="mt-2 text-sm">
                                            <strong>Value:</strong> {reading.value}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* PS Section */}
                    {psData && (
                        <Card className="p-4">
                            <h3 className="font-bold mb-2 text-lg border-b pb-2">PS Core Results</h3>
                            <div className="text-sm text-gray-500 mb-4 bg-gray-50 p-2 rounded">
                                <p><strong>Desc:</strong> {psData.testSetup?.description} | <strong>Turns:</strong> {psData.testSetup?.turnsUsed}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {psData.readings?.map((reading: any, idx: number) => (
                                    <Card key={idx} className="p-3 border shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <span className="font-semibold text-sm">Core #{reading.internalCoreNo}</span>
                                                <div className="text-xs text-gray-500">Vendor: {reading.vendorCoreNo}</div>
                                                <div className="text-xs text-gray-400">{new Date(reading.date).toLocaleDateString()}</div>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${reading.result === 'P' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {reading.result === 'P' ? 'PASS' : 'FAIL'}
                                            </span>
                                        </div>
                                        <div className="mt-2 text-sm">
                                            <strong>Value:</strong> {reading.value}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            </ScrollArea>
        );
    };

    const renderLegacyCoreReport = (history: any) => {
        const meteringResults = history.metering_results || [];
        const protectionResults = history.protection_results || [];
        const psResults = history.ps_results || [];

        return (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
                {/* Metering Section */}
                {meteringResults.length > 0 && (
                    <Card className="p-4">
                        <h3 className="font-bold mb-4 border-b pb-2">Metering Core Results (Legacy)</h3>
                        {meteringResults.map((block: any, idx: number) => (
                            <div key={idx} className="mb-6 last:mb-0">
                                <div className="bg-gray-100 p-2 text-sm font-semibold mb-2">Ratio: {block.ratioValue}</div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="border p-2">Current</th>
                                                <th className="border p-2">R-100%</th>
                                                <th className="border p-2">P-100%</th>
                                                <th className="border p-2">R-25%</th>
                                                <th className="border p-2">P-25%</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {block.rows?.map((row: any, rIdx: number) => (
                                                <tr key={rIdx}>
                                                    <td className="border p-2">{row.current}</td>
                                                    <td className="border p-2">{row.r100}</td>
                                                    <td className="border p-2">{row.p100}</td>
                                                    <td className="border p-2">{row.r25}</td>
                                                    <td className="border p-2">{row.p25}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </Card>
                )}
                {/* Protection Section */}
                {protectionResults.length > 0 && (
                    <Card className="p-4">
                        <h3 className="font-bold mb-4 border-b pb-2">Protection Core Results (Legacy)</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="border p-2">Ratio</th>
                                        <th className="border p-2">Burden 100%</th>
                                        <th className="border p-2">Res.</th>
                                        <th className="border p-2">Sec. Lim. Vtg</th>
                                        <th className="border p-2">Ex. Current</th>
                                        <th className="border p-2">Comp. Error</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {protectionResults.map((res: any, idx: number) => (
                                        <tr key={idx}>
                                            <td className="border p-2">{res.ratioValue}</td>
                                            <td className="border p-2">{res.burden100 || res.burden100_1}</td>
                                            <td className="border p-2">{res.resistance}</td>
                                            <td className="border p-2">{res.secondaryLimitingVtg}</td>
                                            <td className="border p-2">{res.excitationCurrent}</td>
                                            <td className="border p-2">{res.compositeError}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
                {/* PS Section */}
                {psResults.length > 0 && (
                    <Card className="p-4">
                        <h3 className="font-bold mb-4 border-b pb-2">PS Core Results (Legacy)</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="border p-2">Ratio</th>
                                        <th className="border p-2">Turn Ratio Err</th>
                                        <th className="border p-2">Res.</th>
                                        <th className="border p-2">Vk</th>
                                        <th className="border p-2">Iex at Vk</th>
                                        <th className="border p-2">Iex at 1.1Vk</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {psResults.map((res: any, idx: number) => (
                                        <tr key={idx}>
                                            <td className="border p-2">{res.ratioValue}</td>
                                            <td className="border p-2">{res.turnRatioError}</td>
                                            <td className="border p-2">{res.resistance}</td>
                                            <td className="border p-2">{res.vk || res.vkVal}</td>
                                            <td className="border p-2">{res.iexVk}</td>
                                            <td className="border p-2">{res.iex11Vk}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>
        );
    }

    const renderContent = () => {
        switch (testType) {
            case 'core': return renderCoreReport();
            case 'secondary': return <SecondaryReportView transformer={transformer} onBack={onClose} stage="secondary" />;
            case 'primary': return <SecondaryReportView transformer={transformer} onBack={onClose} stage="primary" />;
            case 'final': return <SecondaryReportView transformer={transformer} onBack={onClose} stage="final" />;
            default: return <div>Unknown Report Type</div>;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>{getTitle()}</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto">
                    {renderContent()}
                </div>
            </DialogContent>
        </Dialog>
    );
}

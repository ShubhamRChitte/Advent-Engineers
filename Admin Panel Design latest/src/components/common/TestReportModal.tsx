import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { SecondaryReportView } from "../tester/SecondaryReportView";
import { Card } from "../ui/card";

interface TestReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    transformer: any;
    testType: 'core' | 'secondary' | 'primary' | 'final';
}

export function TestReportModal({ isOpen, onClose, transformer, testType }: TestReportModalProps) {
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
        const history = transformer.testHistory?.core_test;
        if (!history) return <div className="p-4 text-center">No Core Test data available.</div>;

        const meteringResults = history.metering_results || [];
        const protectionResults = history.protection_results || [];
        const psResults = history.ps_results || [];

        return (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
                {/* Metering Section */}
                {meteringResults.length > 0 && (
                    <Card className="p-4">
                        <h3 className="font-bold mb-4 border-b pb-2">Metering Core Results</h3>
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
                        <h3 className="font-bold mb-4 border-b pb-2">Protection Core Results</h3>
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
                        <h3 className="font-bold mb-4 border-b pb-2">PS Core Results</h3>
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
    };

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

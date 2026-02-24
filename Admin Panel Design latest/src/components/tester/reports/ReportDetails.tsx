import { useState } from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs'; // Make sure these exist in ui/tabs
import { ArrowLeft, Download, FileText, Printer } from 'lucide-react';
import { ReadOnlyCoreTable } from './ReadOnlyCoreTable';
import { generateCertificate } from './CertificateGenerator';

interface ReportDetailsProps {
    transformer: any;
    onBack: () => void;
}

export function ReportDetails({ transformer, onBack }: ReportDetailsProps) {
    const [activeTab, setActiveTab] = useState('info');

    // Extract Results
    const history = transformer.testHistory?.secondary_test || {};
    const meteringData = history.metering_results || [];
    const protectionData = history.protection_results || [];
    const psData = history.ps_results || [];

    const hasMetering = meteringData.length > 0;
    const hasProtection = protectionData.length > 0;
    const hasPS = psData.length > 0;

    return (
        <div className="space-y-6" id="printable-report">
            <div className="flex items-center justify-between no-print">
                <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Reports
                </Button>
                <h2 className="text-xl font-bold text-gray-800">Test Report: {transformer.uniqueId}</h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
                        <Printer className="w-4 h-4" />
                        Print Report
                    </Button>
                    <Button onClick={() => generateCertificate(transformer)} className="bg-blue-600 hover:bg-blue-700 gap-2">
                        <Download className="w-4 h-4" />
                        Generate Certificate
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px] no-print">
                    <TabsTrigger value="info">Info</TabsTrigger>
                    <TabsTrigger value="metering" disabled={!hasMetering}>Metering</TabsTrigger>
                    <TabsTrigger value="protection" disabled={!hasProtection}>Protection</TabsTrigger>
                    <TabsTrigger value="ps" disabled={!hasPS}>PS Class</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="mt-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-gray-500" />
                            General Information
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-sm text-gray-500">Transformer Name</p>
                                <p className="font-medium">{transformer.name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Rating</p>
                                <p className="font-medium">{transformer.rating || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Voltage Class</p>
                                <p className="font-medium">{transformer.voltageClass || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Job ID</p>
                                <p className="font-medium">{transformer.jobId || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Tested By</p>
                                <p className="font-medium">{history.tester || 'Unknown'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Completion Date</p>
                                <p className="font-medium">
                                    {history.timestamp ? new Date(history.timestamp).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="metering" className="mt-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 text-blue-700">Metering Core Results</h3>
                        <ReadOnlyCoreTable coreType="metering" data={meteringData} />
                    </Card>
                </TabsContent>

                <TabsContent value="protection" className="mt-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 text-green-700">Protection Core Results</h3>
                        <ReadOnlyCoreTable coreType="protection" data={protectionData} />
                    </Card>
                </TabsContent>

                <TabsContent value="ps" className="mt-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 text-purple-700">PS Class Results</h3>
                        <ReadOnlyCoreTable coreType="ps" data={psData} />
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

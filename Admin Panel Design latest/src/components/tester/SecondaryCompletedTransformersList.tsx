import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ArrowLeft, FileText, CheckCircle } from 'lucide-react';

interface Transformer {
    _id: string;
    jobId: string;
    uniqueId: string;
    currentStage: string;
    testHistory?: {
        secondary_test?: {
            status: string;
            timestamp: string;
            tester: string;
        };
    };
    cores: any[];
    orderId?: any;
}

interface SecondaryCompletedTransformersListProps {
    transformers: Transformer[];
    onViewReport: (transformer: Transformer) => void;
    onBack: () => void;
    jobId: string;
    clientName?: string;
}

export function SecondaryCompletedTransformersList({
    transformers,
    onViewReport,
    onBack,
    jobId,
    clientName
}: SecondaryCompletedTransformersListProps) {

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onBack}
                    className="gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Reports
                </Button>
            </div>

            <div>
                <h2 className="text-2xl font-bold text-gray-800">Completed Reports - {jobId}</h2>
                <p className="text-gray-500 mt-1">{clientName || 'Client Details Available in Order'}</p>
            </div>

            <Card className="overflow-hidden border border-gray-200 shadow-sm">
                {transformers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No completed transformers found for this order.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase">
                                <tr>
                                    <th className="p-4 font-medium">Transformer ID</th>
                                    <th className="p-4 font-medium">Test Date</th>
                                    <th className="p-4 font-medium">Testing Engineers</th>
                                    <th className="p-4 font-medium text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {transformers.map((t) => (
                                    <tr key={t._id} className="hover:bg-blue-50/50 transition-colors">
                                        <td className="p-4 font-medium text-gray-800">
                                            {t.uniqueId}
                                            {/* <div className="text-xs text-gray-400 font-normal mt-1">{t._id}</div> */}
                                        </td>
                                        <td className="p-4 text-gray-600">
                                            {t.testHistory?.secondary_test?.timestamp
                                                ? new Date(t.testHistory.secondary_test.timestamp).toLocaleString()
                                                : 'N/A'}
                                        </td>
                                        <td className="p-4 text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs border border-gray-200">
                                                    {t.testHistory?.secondary_test?.tester || 'Unknown'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-600 hover:text-blue-900 gap-2 shadow-sm bg-white"
                                                onClick={() => onViewReport(t)}
                                            >
                                                <FileText className="w-4 h-4" />
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
        </div>
    );
}

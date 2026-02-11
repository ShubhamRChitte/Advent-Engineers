import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { SecondaryMeteringReport } from './SecondaryMeteringReport';
import { SecondaryProtectionReport } from './SecondaryProtectionReport';
import { SecondaryPSReport } from './SecondaryPSReport';

interface SecondaryReportViewProps {
    transformer: any;
    onBack: () => void;
}

export function SecondaryReportView({ transformer, onBack }: SecondaryReportViewProps) {
    // Determine report type based on transformer data
    // Fallback logic similar to SecondaryTransformersList
    const getReportType = () => {
        const type = transformer.type?.toLowerCase() || '';
        if (type.includes('metering')) return 'metering';
        if (type.includes('protection') || type.includes('class')) return 'protection';
        if (type.includes('ps')) return 'ps';

        // Fallback: Check which results exist in history
        if (transformer.testHistory?.secondary_test?.metering_results?.length > 0) return 'metering';
        if (transformer.testHistory?.secondary_test?.protection_results?.length > 0) return 'protection';
        if (transformer.testHistory?.secondary_test?.ps_results?.length > 0) return 'ps';

        return 'metering'; // Default
    };

    const reportType = getReportType();
    const coreId = transformer.uniqueId; // Or internalCoreNo if available differently? Usually uniqueId is the unit ID.

    // Core Test Context Data (BSAT etc.)
    const coreTestData = transformer.testHistory?.core_test || {};

    return (
        <div className="space-y-8">
            {/* We don't need a double header if the specific reports have one, 
                 but we might want a global "Back" if the specific report triggers onBack differently.
                 Actually, the specific reports accept `onBack` and render a header.
                 So we should wrap them or let them handle the header. 
                 Since we passed `readOnly={true}`, they handle the view.
                 However, we also need to show "Core Test Readings".
            */}

            <div className="bg-gray-100 p-4 rounded-lg mb-6 border border-gray-300">
                <h3 className="text-lg font-bold text-gray-700 mb-2">Core Test Context (Read-Only)</h3>
                {coreTestData && Object.keys(coreTestData).length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="bg-white p-3 rounded shadow-sm">
                            <span className="text-gray-500 block">BSAT 1</span>
                            <span className="font-medium">{coreTestData.bsat1 || '-'}</span>
                        </div>
                        <div className="bg-white p-3 rounded shadow-sm">
                            <span className="text-gray-500 block">BSAT 2</span>
                            <span className="font-medium">{coreTestData.bsat2 || '-'}</span>
                        </div>
                        <div className="bg-white p-3 rounded shadow-sm">
                            <span className="text-gray-500 block">BSAT 3</span>
                            <span className="font-medium">{coreTestData.bsat3 || '-'}</span>
                        </div>
                        <div className="bg-white p-3 rounded shadow-sm">
                            <span className="text-gray-500 block">BSAT 4</span>
                            <span className="font-medium">{coreTestData.bsat4 || '-'}</span>
                        </div>
                        <div className="bg-white p-3 rounded shadow-sm">
                            <span className="text-gray-500 block">Result</span>
                            <span className={`font-bold ${coreTestData.remark === 'P' ? 'text-green-600' : 'text-red-600'}`}>
                                {coreTestData.remark === 'P' ? 'PASS' : coreTestData.remark === 'F' ? 'FAIL' : coreTestData.remark || '-'}
                            </span>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-500 italic">No Core Test data available.</p>
                )}
            </div>

            <div className="border-t border-gray-300 pt-6">
                {reportType === 'metering' && (
                    <SecondaryMeteringReport
                        transformer={transformer}
                        coreNumber={1} // TODO: How to get core number if flattened?
                        coreId={coreId}
                        testerName={transformer.testHistory?.secondary_test?.tester || 'Unknown'}
                        onBack={onBack}
                        readOnly={true}
                    />
                )}

                {reportType === 'protection' && (
                    <SecondaryProtectionReport
                        transformer={transformer}
                        coreNumber={1}
                        coreId={coreId}
                        testerName={transformer.testHistory?.secondary_test?.tester || 'Unknown'}
                        onBack={onBack}
                        readOnly={true}
                    />
                )}

                {reportType === 'ps' && (
                    <SecondaryPSReport
                        transformer={transformer}
                        coreNumber={1}
                        coreId={coreId}
                        testerName={transformer.testHistory?.secondary_test?.tester || 'Unknown'}
                        onBack={onBack}
                        readOnly={true}
                    />
                )}
            </div>
        </div>
    );
}

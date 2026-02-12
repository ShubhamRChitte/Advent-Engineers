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
    stage?: 'secondary' | 'primary' | 'final';
}

export function SecondaryReportView({ transformer, onBack, stage = 'secondary' }: SecondaryReportViewProps) {
    // Determine report type based on transformer data
    // Fallback logic similar to SecondaryTransformersList
    const getReportType = () => {
        const type = transformer.type?.toLowerCase() || '';
        if (type.includes('metering')) return 'metering';
        if (type.includes('protection') || type.includes('class')) return 'protection';
        if (type.includes('ps')) return 'ps';

        // Fallback: Check which results exist in history
        // Use dynamic stage to check the correct history object
        const stageHistory = transformer.testHistory?.[`${stage}_test`];

        if (stageHistory?.metering_results?.length > 0) return 'metering';
        if (stageHistory?.protection_results?.length > 0) return 'protection';
        if (stageHistory?.ps_results?.length > 0) return 'ps';

        return 'metering'; // Default
    };

    const reportType = getReportType();
    const getCoreId = () => {
        const history = transformer.testHistory?.[`${stage}_test`];
        if (!history) return transformer.uniqueId;

        if (reportType === 'metering' && history.metering_results?.length > 0) {
            return history.metering_results[0].internalCoreNo || history.metering_results[0].coreId || transformer.uniqueId;
        }
        if (reportType === 'protection' && history.protection_results?.length > 0) {
            return history.protection_results[0].internalCoreNo || history.protection_results[0].coreId || transformer.uniqueId;
        }
        if (reportType === 'ps' && history.ps_results?.length > 0) {
            return history.ps_results[0].internalCoreNo || history.ps_results[0].coreId || transformer.uniqueId;
        }

        return transformer.uniqueId;
    };

    const coreId = getCoreId();

    // Core Test Context Data (BSAT etc.)
    const coreTestData = transformer.testHistory?.core_test || {};

    // Logic to determine which reports to show based on history
    const history = transformer.testHistory?.[`${stage}_test`];
    const showMetering = history?.metering_results?.length > 0;
    const showProtection = history?.protection_results?.length > 0;
    const showPS = history?.ps_results?.length > 0;

    // Fallback if no history (e.g. before test starts, but this view is likely for completed tests)
    // If no history, we fall back to the single view based on type, OR we could check `cores` config if available.
    // For now, if no history, the original logic applies (shows one empty report).

    // If we have history, show proper accumulated tabs or stacked view.
    // Given the user wants to see "complete report", stacking is good.

    // If NO history is present, we might want to default to showing based on `transformer.cores` if available.
    // `SecondaryTransformersList` maps `cores`. Let's check if `transformer.cores` is available here.
    // It is typed as `any` in props but likely matches the interface.
    // However, if we are viewing a "Report", we expect history. 

    // Let's stick to: Show what is in history. If nothing in history, show default type.
    const hasHistory = showMetering || showProtection || showPS;

    return (
        <div className="space-y-8">
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

            <div className="border-t border-gray-300 pt-6 space-y-8">
                {(!hasHistory || showMetering) && (reportType === 'metering' || hasHistory) && (
                    <SecondaryMeteringReport
                        transformer={transformer}
                        coreNumber={1}
                        // For metering, extract metering specific core ID
                        coreId={history?.metering_results?.[0]?.internalCoreNo || history?.metering_results?.[0]?.coreId || transformer.uniqueId}
                        testerName={history?.tester || 'Unknown'}
                        onBack={onBack}
                        readOnly={true}
                        stage={stage}
                    />
                )}

                {(!hasHistory || showProtection) && (reportType === 'protection' || hasHistory) && (
                    <SecondaryProtectionReport
                        transformer={transformer}
                        coreNumber={1}
                        coreId={history?.protection_results?.[0]?.internalCoreNo || history?.protection_results?.[0]?.coreId || transformer.uniqueId}
                        testerName={history?.tester || 'Unknown'}
                        onBack={onBack}
                        readOnly={true}
                        stage={stage}
                    />
                )}

                {(!hasHistory || showPS) && (reportType === 'ps' || hasHistory) && (
                    <SecondaryPSReport
                        transformer={transformer}
                        coreNumber={1}
                        coreId={history?.ps_results?.[0]?.internalCoreNo || history?.ps_results?.[0]?.coreId || transformer.uniqueId}
                        testerName={history?.tester || 'Unknown'}
                        onBack={onBack}
                        readOnly={true}
                        stage={stage}
                    />
                )}
            </div>
        </div>
    );
}

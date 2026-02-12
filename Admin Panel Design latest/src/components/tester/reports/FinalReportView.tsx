import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { SecondaryMeteringReport } from '../SecondaryMeteringReport';
import { SecondaryProtectionReport } from '../SecondaryProtectionReport';
import { SecondaryPSReport } from '../SecondaryPSReport';

interface FinalReportViewProps {
    transformer: any;
    onBack: () => void;
}

export function FinalReportView({ transformer, onBack }: FinalReportViewProps) {
    // Determine report type based on transformer data
    const getReportType = () => {
        const type = transformer.type?.toLowerCase() || '';
        if (type.includes('metering')) return 'metering';
        if (type.includes('protection') || type.includes('class')) return 'protection';
        if (type.includes('ps')) return 'ps';

        // Fallback: Check which results exist in history
        if (transformer.testHistory?.final_test?.metering_results?.length > 0) return 'metering';
        if (transformer.testHistory?.final_test?.protection_results?.length > 0) return 'protection';
        if (transformer.testHistory?.final_test?.ps_results?.length > 0) return 'ps';

        return 'metering'; // Default
    };

    const reportType = getReportType();

    // Logic to determine which reports to show based on history (final_test)
    const history = transformer.testHistory?.final_test;
    const showMetering = history?.metering_results?.length > 0;
    const showProtection = history?.protection_results?.length > 0;
    const showPS = history?.ps_results?.length > 0;

    const hasHistory = showMetering || showProtection || showPS;

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
                    Back to List
                </Button>
            </div>

            <div className="space-y-8">
                {(!hasHistory || showMetering) && (reportType === 'metering' || hasHistory) && (
                    <SecondaryMeteringReport
                        transformer={transformer}
                        coreNumber={1}
                        // For metering, extract metering specific core ID
                        coreId={history?.metering_results?.[0]?.internalCoreNo || history?.metering_results?.[0]?.coreId || transformer.uniqueId}
                        testerName={transformer.testHistory?.final_test?.tester || 'Unknown'}
                        onBack={() => { }} // Internal Back unused in stacked view
                        readOnly={true}
                        stage="final"
                    />
                )}

                {(!hasHistory || showProtection) && (reportType === 'protection' || hasHistory) && (
                    <SecondaryProtectionReport
                        transformer={transformer}
                        coreNumber={1}
                        coreId={history?.protection_results?.[0]?.internalCoreNo || history?.protection_results?.[0]?.coreId || transformer.uniqueId}
                        testerName={transformer.testHistory?.final_test?.tester || 'Unknown'}
                        onBack={() => { }}
                        readOnly={true}
                        stage="final"
                    />
                )}

                {(!hasHistory || showPS) && (reportType === 'ps' || hasHistory) && (
                    <SecondaryPSReport
                        transformer={transformer}
                        coreNumber={1}
                        coreId={history?.ps_results?.[0]?.internalCoreNo || history?.ps_results?.[0]?.coreId || transformer.uniqueId}
                        testerName={transformer.testHistory?.final_test?.tester || 'Unknown'}
                        onBack={() => { }}
                        readOnly={true}
                        stage="final"
                    />
                )}
            </div>
        </div>
    );
}

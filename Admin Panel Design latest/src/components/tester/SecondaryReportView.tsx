import { useState } from 'react';
import { SecondaryMeteringReport } from './SecondaryMeteringReport';
import { SecondaryProtectionReport } from './SecondaryProtectionReport';
import { SecondaryPSReport } from './SecondaryPSReport';

interface SecondaryReportViewProps {
    transformer: any;
    onBack: () => void;
    stage?: 'secondary' | 'primary' | 'final';
    activeTab?: 'Metering' | 'Protection' | 'PS';
    onTabChange?: (tab: 'Metering' | 'Protection' | 'PS') => void;
}

export function SecondaryReportView({ 
    transformer, 
    onBack, 
    stage = 'secondary',
    activeTab: externalActiveTab,
    onTabChange
}: SecondaryReportViewProps) {
    const history = transformer.testHistory?.[`${stage}_test` as keyof typeof transformer.testHistory];
    
    // Determine which reports have data
    const hasMetering = history?.metering_results?.length > 0;
    const hasProtection = history?.protection_results?.length > 0;
    const hasPS = history?.ps_results?.length > 0;

    // Get available types
    const availableTypes: ('Metering' | 'Protection' | 'PS')[] = [];
    if (hasMetering) availableTypes.push('Metering');
    if (hasProtection) availableTypes.push('Protection');
    if (hasPS) availableTypes.push('PS');

    // Default to first available or 'Metering'
    // Default to first available or 'Metering'
    const [internalActiveTab, setInternalActiveTab] = useState<'Metering' | 'Protection' | 'PS'>(() => {
        if (availableTypes.length > 0) return availableTypes[0]!;
        return 'Metering';
    });

    const activeTab = externalActiveTab || internalActiveTab;
    const setActiveTab = (tab: 'Metering' | 'Protection' | 'PS') => {
        if (onTabChange) {
            onTabChange(tab);
        } else {
            setInternalActiveTab(tab);
        }
    };

    if (availableTypes.length === 0) {
        return (
            <div className="p-12 text-center text-gray-500 bg-white rounded-lg shadow-sm border">
                <p className="text-lg font-medium">No {stage} test data found.</p>
                <p className="text-sm mt-1">Testing might still be in progress or data was not saved.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Professional Tabs (Hidden in Print) */}
            <div className="flex items-center gap-2 mb-4 no-print overflow-x-auto pb-2 print:hidden backdrop-blur-sm sticky top-16 z-40">
                {availableTypes.map((type) => {
                    const isSelected = activeTab === type;
                    return (
                        <button
                            key={type}
                            onClick={() => setActiveTab(type)}
                            className={`
                                px-8 py-3 rounded-t-xl font-semibold text-sm transition-all border-b-4 whitespace-nowrap
                                ${isSelected
                                    ? 'bg-white border-[#003a70] text-[#003a70] shadow-[0_-4px_10px_rgba(0,0,0,0.05)]'
                                    : 'bg-gray-100 border-transparent text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                                }
                            `}
                        >
                            {type} Test
                            {isSelected && <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-[#003a70] animate-pulse"></span>}
                        </button>
                    );
                })}
            </div>

            {/* Report Content Container */}
            <div className="bg-white rounded-b-xl shadow-2xl border-none overflow-hidden print:shadow-none print:bg-white">
                {activeTab === 'Metering' && (
                    <SecondaryMeteringReport
                        transformer={transformer}
                        coreId={history?.metering_results?.[0]?.internalCoreNo || history?.metering_results?.[0]?.coreId || "Metering Core"}
                        testerName={history?.tester || 'Verified Administrator'}
                        onBack={onBack}
                        readOnly={true}
                        stage={stage}
                    />
                )}

                {activeTab === 'Protection' && (
                    <SecondaryProtectionReport
                        transformer={transformer}
                        coreId={history?.protection_results?.[0]?.internalCoreNo || history?.protection_results?.[0]?.coreId || "Protection Core"}
                        testerName={history?.tester || 'Verified Administrator'}
                        onBack={onBack}
                        readOnly={true}
                        stage={stage}
                    />
                )}

                {activeTab === 'PS' && (
                    <SecondaryPSReport
                        transformer={transformer}
                        coreId={history?.ps_results?.[0]?.internalCoreNo || history?.ps_results?.[0]?.coreId || "PS Core"}
                        testerName={history?.tester || 'Verified Administrator'}
                        onBack={onBack}
                        readOnly={true}
                        stage={stage}
                    />
                )}
            </div>
        </div>
    );
}

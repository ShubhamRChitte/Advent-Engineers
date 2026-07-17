import { useState } from 'react';
import { SecondaryMeteringReport } from './SecondaryMeteringReport';
import { SecondaryProtectionReport } from './SecondaryProtectionReport';
import { SecondaryPSReport } from './SecondaryPSReport';
import { FinalQAReport } from './FinalQAReport';

interface SecondaryReportViewProps {
    transformer: any;
    onBack: () => void;
    stage?: 'secondary' | 'primary' | 'final';
    activeTab?: 'Metering' | 'Protection' | 'PS' | 'QA';
    onTabChange?: (tab: 'Metering' | 'Protection' | 'PS' | 'QA') => void;
}

export function SecondaryReportView({ 
    transformer, 
    onBack, 
    stage = 'secondary',
    activeTab: externalActiveTab,
    onTabChange
}: SecondaryReportViewProps) {
    const history = transformer.testHistory?.[`${stage}_test` as keyof typeof transformer.testHistory];
    
    const filterPendingIfValidExists = (cores: string[]) => {
        const validCores = cores.filter(c => !c.toLowerCase().includes('pending'));
        return validCores.length > 0 ? validCores : cores;
    };

    // Extract all UNIQUE core IDs per type from the saved results
    const uniqueMeteringCores: string[] = (() => {
        const results = history?.metering_results || [];
        const seen = new Set<string>();
        if (history?.meteringCoreId) {
            seen.add(history.meteringCoreId);
        }
        results.forEach((r: any) => {
            const id = r.internalCoreNo || r.coreId;
            if (id) seen.add(id);
        });
        return filterPendingIfValidExists(Array.from(seen));
    })();

    const uniqueProtectionCores: string[] = (() => {
        const results = history?.protection_results || [];
        const seen = new Set<string>();
        if (history?.protectionCoreId) {
            seen.add(history.protectionCoreId);
        }
        results.forEach((r: any) => {
            const id = r.internalCoreNo || r.coreId;
            if (id) seen.add(id);
        });
        return filterPendingIfValidExists(Array.from(seen));
    })();

    const uniquePSCores: string[] = (() => {
        const results = history?.ps_results || [];
        const seen = new Set<string>();
        if (history?.psCoreId) {
            seen.add(history.psCoreId);
        }
        results.forEach((r: any) => {
            const id = r.internalCoreNo || r.coreId;
            if (id) seen.add(id);
        });
        return filterPendingIfValidExists(Array.from(seen));
    })();

    // Determine which tabs have data
    const hasMetering = uniqueMeteringCores.length > 0;
    const hasProtection = uniqueProtectionCores.length > 0;
    const hasPS = uniquePSCores.length > 0;
    const hasQA = stage === 'final' && (
        history?.polarityResult || 
        history?.meggarPrimaryToSecondary || 
        history?.ovitTest || 
        transformer.finalReportData
    );

    // Get available types
    const availableTypes: ('Metering' | 'Protection' | 'PS' | 'QA')[] = [];
    if (hasMetering) availableTypes.push('Metering');
    if (hasProtection) availableTypes.push('Protection');
    if (hasPS) availableTypes.push('PS');
    if (hasQA) availableTypes.push('QA');

    // Default to first available or 'Metering'
    const [internalActiveTab, setInternalActiveTab] = useState<'Metering' | 'Protection' | 'PS' | 'QA'>(() => {
        if (availableTypes.length > 0) return availableTypes[0]!;
        return 'Metering';
    });

    const activeTab = (() => {
        const potentialTab = externalActiveTab || internalActiveTab;
        if (availableTypes.includes(potentialTab as any)) return potentialTab;
        if (availableTypes.length > 0) return availableTypes[0];
        return potentialTab;
    })();

    const setActiveTab = (tab: 'Metering' | 'Protection' | 'PS' | 'QA') => {
        if (onTabChange) {
            onTabChange(tab);
        } else {
            setInternalActiveTab(tab);
        }
    };

    // Find the correct core indices from the order details (for fallback)
    const order = transformer.fullOrder || transformer.orderId;
    const coreDetails = order?.coreDetails || [];
    
    const meteringCoreIndex = coreDetails.findIndex((c: any) => c.coreType === 'Metering');
    const protectionCoreIndex = coreDetails.findIndex((c: any) => c.coreType === 'Protection');
    const psCoreIndex = coreDetails.findIndex((c: any) => c.coreType === 'PS');

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
            <div className="flex items-center gap-2 mb-4 no-print overflow-x-auto pt-2 pb-2 print:hidden bg-gray-50/95 backdrop-blur-sm sticky top-0 z-40">
                {availableTypes.map((type) => {
                    const isSelected = activeTab === type;
                    // Show count badge for multi-core types
                    const coreCount = type === 'Metering' ? uniqueMeteringCores.length
                        : type === 'Protection' ? uniqueProtectionCores.length
                        : type === 'PS' ? uniquePSCores.length
                        : 0;
                    return (
                        <button
                            key={type}
                            onClick={() => setActiveTab(type)}
                            className={`
                                px-8 py-3 rounded-t-xl font-semibold text-sm transition-all border-b-4 whitespace-nowrap relative
                                ${isSelected
                                    ? 'bg-white border-[#003a70] text-[#003a70] shadow-[0_-4px_10px_rgba(0,0,0,0.05)]'
                                    : 'bg-gray-100 border-transparent text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                                }
                            `}
                        >
                            {type === 'QA' ? 'QA Test' : `${type} Test`}
                            {coreCount > 1 && (
                                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold ${
                                    isSelected ? 'bg-[#003a70] text-white' : 'bg-gray-300 text-gray-700'
                                }`}>
                                    {coreCount}
                                </span>
                            )}
                            {isSelected && <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-[#003a70] animate-pulse"></span>}
                        </button>
                    );
                })}
            </div>

            {/* Report Content Container */}
            <div className="bg-white rounded-b-xl shadow-2xl border-none overflow-hidden print:shadow-none print:bg-white">
                
                {/* METERING: Render one report block per unique core */}
                {activeTab === 'Metering' && (
                    <div className="divide-y divide-gray-200 print:divide-y-0">
                        {uniqueMeteringCores.length > 0 ? (
                            uniqueMeteringCores.map((coreId, idx) => (
                                <div key={coreId} className="print:break-after-page last:print:break-after-auto">
                                    {uniqueMeteringCores.length > 1 && (
                                        <div className="bg-blue-50 px-4 py-2 border-b border-blue-200 print:hidden">
                                            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                                                Metering Core {idx + 1} — {coreId}
                                            </span>
                                        </div>
                                    )}
                                    <SecondaryMeteringReport
                                        transformer={transformer}
                                        coreNumber={meteringCoreIndex !== -1 ? meteringCoreIndex + 1 : idx + 1}
                                        coreId={coreId}
                                        testerName={history?.tester || 'Verified Administrator'}
                                        onBack={onBack}
                                        readOnly={true}
                                        stage={stage}
                                    />
                                </div>
                            ))
                        ) : (
                            <SecondaryMeteringReport
                                transformer={transformer}
                                coreNumber={meteringCoreIndex !== -1 ? meteringCoreIndex + 1 : undefined}
                                coreId={history?.metering_results?.[0]?.internalCoreNo || history?.metering_results?.[0]?.coreId || "Metering Core"}
                                testerName={history?.tester || 'Verified Administrator'}
                                onBack={onBack}
                                readOnly={true}
                                stage={stage}
                            />
                        )}
                    </div>
                )}

                {/* PROTECTION: Render one report block per unique core */}
                {activeTab === 'Protection' && (
                    <div className="divide-y divide-gray-200 print:divide-y-0">
                        {uniqueProtectionCores.length > 0 ? (
                            uniqueProtectionCores.map((coreId, idx) => (
                                <div key={coreId} className="print:break-after-page last:print:break-after-auto">
                                    {uniqueProtectionCores.length > 1 && (
                                        <div className="bg-amber-50 px-4 py-2 border-b border-amber-200 print:hidden">
                                            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                                                Protection Core {idx + 1} — {coreId}
                                            </span>
                                        </div>
                                    )}
                                    <SecondaryProtectionReport
                                        transformer={transformer}
                                        coreNumber={protectionCoreIndex !== -1 ? protectionCoreIndex + 1 : idx + 1}
                                        coreId={coreId}
                                        testerName={history?.tester || 'Verified Administrator'}
                                        onBack={onBack}
                                        readOnly={true}
                                        stage={stage}
                                    />
                                </div>
                            ))
                        ) : (
                            <SecondaryProtectionReport
                                transformer={transformer}
                                coreNumber={protectionCoreIndex !== -1 ? protectionCoreIndex + 1 : undefined}
                                coreId={history?.protection_results?.[0]?.internalCoreNo || history?.protection_results?.[0]?.coreId || "Protection Core"}
                                testerName={history?.tester || 'Verified Administrator'}
                                onBack={onBack}
                                readOnly={true}
                                stage={stage}
                            />
                        )}
                    </div>
                )}

                {/* PS: Render one report block per unique core */}
                {activeTab === 'PS' && (
                    <div className="divide-y divide-gray-200 print:divide-y-0">
                        {uniquePSCores.length > 0 ? (
                            uniquePSCores.map((coreId, idx) => (
                                <div key={coreId} className="print:break-after-page last:print:break-after-auto">
                                    {uniquePSCores.length > 1 && (
                                        <div className="bg-purple-50 px-4 py-2 border-b border-purple-200 print:hidden">
                                            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                                                PS Core {idx + 1} — {coreId}
                                            </span>
                                        </div>
                                    )}
                                    <SecondaryPSReport
                                        transformer={transformer}
                                        coreNumber={psCoreIndex !== -1 ? psCoreIndex + 1 : idx + 1}
                                        coreId={coreId}
                                        testerName={history?.tester || 'Verified Administrator'}
                                        onBack={onBack}
                                        readOnly={true}
                                        stage={stage}
                                    />
                                </div>
                            ))
                        ) : (
                            <SecondaryPSReport
                                transformer={transformer}
                                coreNumber={psCoreIndex !== -1 ? psCoreIndex + 1 : undefined}
                                coreId={history?.ps_results?.[0]?.internalCoreNo || history?.ps_results?.[0]?.coreId || "PS Core"}
                                testerName={history?.tester || 'Verified Administrator'}
                                onBack={onBack}
                                readOnly={true}
                                stage={stage}
                            />
                        )}
                    </div>
                )}

                {activeTab === 'QA' && (
                    <FinalQAReport
                        transformer={transformer}
                        testerName={history?.tester || 'Verified Administrator'}
                        mode="standalone"
                    />
                )}
            </div>
        </div>
    );
}

/**
 * PrintableCoreReport — Adapter Wrapper
 * 
 * Maintains backward compatibility with existing consumers:
 * - ReportPage.tsx
 * - AdminReportViewPage.tsx
 * - CoreTestingReport.tsx (tester/)
 * 
 * Internally delegates all rendering to UnifiedCoreReport (Single Source of Truth).
 * The external interface (PrintableCoreReportProps) is preserved unchanged.
 */

import { UnifiedCoreReport } from './UnifiedCoreReport';
import { fromPrintableCoreReportProps } from '../../utils/reportDataAdapter';

export interface PrintableCoreReportProps {
    order: any;
    coreData: any;
}

export function PrintableCoreReport({ order, coreData }: PrintableCoreReportProps) {
    if (!coreData) return null;

    // Adapt legacy props → universal format
    const unifiedData = fromPrintableCoreReportProps({ order, coreData });

    // Delegate to single source of truth
    return <UnifiedCoreReport data={unifiedData} />;
}

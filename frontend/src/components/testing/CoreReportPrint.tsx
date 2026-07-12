/**
 * CoreReportPrint — Adapter Wrapper
 * 
 * Maintains backward compatibility with existing consumers in CoreTestingForm.tsx.
 * Used in three places:
 * - Protection core print (line ~2190)
 * - PS core print (line ~2909)
 * - Metering core print (line ~4003)
 * 
 * Internally delegates all rendering to UnifiedCoreReport (Single Source of Truth).
 * The external interface (CoreReportPrintProps) is preserved unchanged.
 */

import { UnifiedCoreReport } from '../reports/UnifiedCoreReport';
import { fromCoreReportPrintProps } from '../../utils/reportDataAdapter';

interface BSATColumn {
    id: string;
    bsatValue: string;
    setMvValue: string;
    leLimitValue: string;
}

interface CoreTestRow {
    date: string;
    coreVendorNo: string;
    internalCoreNo: string;
    dynamicValues: { [key: string]: string };
    remark: string;
}

interface CoreReportPrintProps {
    order: any;
    coreType: 'Metering' | 'PS' | 'Protection';
    specs: any;
    rows: CoreTestRow[];
    bsatColumns: BSATColumn[];
    testDate: string;
    testBy: string;
    authorizedSignatory: string;
    tataRef?: string;
    materialType: string;
}

export function CoreReportPrint({
    order,
    coreType,
    specs,
    rows,
    bsatColumns,
    testDate,
    testBy,
    authorizedSignatory,
    tataRef,
    materialType
}: CoreReportPrintProps) {

    // Adapt existing props → universal format
    const unifiedData = fromCoreReportPrintProps({
        order,
        coreType,
        specs,
        rows,
        bsatColumns,
        testDate,
        testBy,
        authorizedSignatory,
        tataRef,
        materialType,
    });

    // Delegate to single source of truth
    return <UnifiedCoreReport data={unifiedData} />;
}

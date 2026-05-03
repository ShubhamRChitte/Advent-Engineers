import { ReportHeader } from '../reports';
// Triggering fresh reload to clear potential rowsRef cache
import { getSafeOrderId, getSafeClientName, getSafeBatchId } from '../../utils/orderUtils';

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
    return (
        <div id="printable-report" className="print-only bg-white p-4">
            <style>{`
        .report-header-section {
          margin-bottom: 0;
        }
        .banner-yellow {
          background-color: #ffda6a !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          border: 1px solid #000;
          text-align: center;
          padding: 6px;
          font-weight: bold;
          font-size: 16px;
        }
        .banner-blue {
          background-color: #92d0ff !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          border: 1px solid #000;
          border-top: none;
          text-align: center;
          padding: 4px;
          font-weight: bold;
          font-size: 14px;
        }
        .report-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #000;
        }
        .report-table td, .report-table th {
          border: 1px solid #000;
          padding: 6px;
          font-size: 11px;
        }
        .bg-emerald {
          background-color: #d1fae5 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .bg-amber-light {
          background-color: #fffbeb !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .bg-blue-light {
          background-color: #eff6ff !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .bg-gray-light {
          background-color: #f9fafb !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .font-bold-table {
          font-weight: bold;
          color: #374151;
        }
      `}</style>

            {/* Corporate Header */}
            <div className="report-header-section">
                <ReportHeader
                    title={`Core Testing Report - ${coreType}`}
                    orderId={getSafeOrderId(order)}
                    clientName={getSafeClientName(order)}
                    reportDate={testDate}
                    batchId={getSafeBatchId(order)}
                    tataRef={tataRef || ''}
                />
            </div>

            {/* Main Title Banners */}
            <div className="banner-yellow uppercase">
                Toroidal Core Testing
            </div>
            <div className="banner-blue">
                {materialType}
            </div>

            {/* Specification Tables */}
            <table className="report-table" style={{ borderTop: 'none' }}>
                <tbody>
                    <tr>
                        <td className="bg-emerald font-bold-table" style={{ width: '25%' }}>CORE SIZE IN MM</td>
                        <td className="text-center" style={{ width: '15%' }}>{specs.coreSize1}</td>
                        <td className="text-center" style={{ width: '15%' }}>{specs.coreSize2}</td>
                        <td className="text-center" style={{ width: '15%' }}>{specs.coreSize3}</td>
                        <td className="bg-emerald font-bold-table text-center" style={{ width: '30%' }}>ID - OD - HT</td>
                    </tr>
                    <tr>
                        <td className="bg-amber-light font-bold-table">TURN USED FOR TESTING</td>
                        <td colSpan={4} className="text-center font-medium">
                            {specs.turnUsed} turns
                        </td>
                    </tr>
                    <tr>
                        <td className="bg-gray-light font-bold-table">Area (Sq cm)</td>
                        <td colSpan={4} className="text-center">{specs.area}</td>
                    </tr>
                    <tr>
                        <td className="bg-gray-light font-bold-table">MMP (cm)</td>
                        <td colSpan={4} className="text-center">{specs.mmp}</td>
                    </tr>
                </tbody>
            </table>

            {/* Multi-point Specs */}
            <table className="report-table" style={{ borderTop: 'none' }}>
                <tbody>
                    <tr>
                        <td rowSpan={3} className="bg-gray-light font-bold-table text-center align-middle" style={{ width: '20%' }}>
                            Specification
                        </td>
                        <td className="font-bold-table" style={{ width: '25%' }}>BSAT (G)</td>
                        {bsatColumns.map(col => (
                            <td key={col.id} className="bg-amber-light text-center font-bold">{col.bsatValue}</td>
                        ))}
                        <td className="text-center" style={{ width: '10%' }}></td>
                    </tr>
                    <tr>
                        <td className="bg-blue-light font-bold-table">SET mV</td>
                        {bsatColumns.map(col => (
                            <td key={col.id} className="text-center bg-blue-light">{col.setMvValue}</td>
                        ))}
                        <td className="text-center"></td>
                    </tr>
                    <tr>
                        <td className="font-bold-table">LE LIMIT in mA.</td>
                        {bsatColumns.map(col => (
                            <td key={col.id} className="text-center">{col.leLimitValue}</td>
                        ))}
                        <td className="bg-blue-light text-center font-bold-table">Remark</td>
                    </tr>
                </tbody>
            </table>

            {/* Data Results Table */}
            <table className="report-table" style={{ borderTop: 'none' }}>
                <thead className="bg-gray-light">
                    <tr>
                        <th className="text-center" style={{ width: '15%' }}>Date</th>
                        <th className="text-center" style={{ width: '20%' }}>Vendor core No.</th>
                        <th className="text-center" style={{ width: '25%' }}>Internal core No.</th>
                        {bsatColumns.map(col => {
                            if (!col) return null;
                            return <th key={col.id} className="text-center bg-amber-light">{col.bsatValue}</th>;
                        })}
                        <th className="text-center" style={{ width: '15%' }}>Remark</th>
                    </tr>
                </thead>
                <tbody>
                    {rows && rows.map((row, index) => (
                        <tr key={index}>
                            <td className="text-center">{row.date}</td>
                            <td className="text-center">{row.coreVendorNo}</td>
                            <td className="text-center font-bold">{row.internalCoreNo}</td>
                            {bsatColumns.map(col => (
                                <td key={col.id} className="text-center">
                                    {row.dynamicValues?.[col.id] || '-'}
                                </td>
                            ))}
                            <td className={`text-center font-bold ${row.remark === 'P' ? 'text-green-600' : 'text-red-600'}`}>
                                {row.remark}
                            </td>
                        </tr>
                    ))}
                    {/* Add empty rows if needed for A4 height */}
                    {rows && rows.length < 15 && Array.from({ length: 15 - rows.length }).map((_, i) => (
                        <tr key={`empty-${i}`} style={{ height: '24px' }}>
                            <td></td><td></td><td></td>
                            {bsatColumns.map(col => <td key={col.id}></td>)}
                            <td></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Footer / Signatures */}
            <div className="mt-8 flex justify-between px-10">
                <div className="text-center w-48">
                    <div className="border-t border-black pt-2 font-bold text-sm">Test by</div>
                    <div className="text-xs mt-1">{testBy}</div>
                </div>
                <div className="text-center w-48">
                    <div className="border-t border-black pt-2 font-bold text-sm">Authorised Signatory</div>
                    <div className="text-xs mt-1">{authorizedSignatory}</div>
                </div>
            </div>

            <div className="text-right mt-12 font-bold text-sm italic pr-10">
                For Advent Engineers
            </div>
        </div>
    );
}

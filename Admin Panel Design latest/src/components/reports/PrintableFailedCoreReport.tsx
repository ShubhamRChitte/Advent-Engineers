import adventLogo from '../../assets/advent_logo.jpg';
import { FailedCore } from '../testing/CoreTestingForm';
import '../../styles/report.css';

export interface PrintableFailedCoreReportProps {
    data: FailedCore[];
}

export function PrintableFailedCoreReport({ data }: PrintableFailedCoreReportProps) {
    if (!data || data.length === 0) return null;

    return (
        <div id="printable-failed-core-report" className="print-only">
            {/* HEADER AREA */}
            <div className="page-header">
                <div className="logo-container">
                    <img src={adventLogo} alt="Advent Engineers Logo" className="logo-icon" />
                </div>
                <div className="company-info">
                    <div className="company-name">ADVENT ENGINEERS</div>
                    <div className="company-sub">Excellence in Transformer Core Testing</div>
                </div>
                <div className="header-meta" style={{ width: '150px' }}>
                    <div className="meta-row">
                        <div className="meta-label">Date:</div>
                        <div>{new Date().toLocaleDateString('en-GB')}</div>
                    </div>
                    <div className="meta-row">
                        <div className="meta-label">Document:</div>
                        <div>Failed Core Summary</div>
                    </div>
                </div>
            </div>

            {/* THE MASTER TABLE */}
            <table className="report-table">
                <tbody>
                    {/* ROW 1: Title Inside Table */}
                    <tr>
                        <th colSpan={6} className="bg-yellow font-bold text-[13px] uppercase tracking-wide">
                            Failed Core Summary Report - Non-Conforming Unit Details
                        </th>
                    </tr>

                    {/* --- DATA TABLE HEADERS --- */}
                    <tr>
                        <td className="bg-header font-bold col-date">Date</td>
                        <td className="bg-header font-bold col-vendor">Vendor Core No.</td>
                        <td className="bg-header font-bold col-internal">Internal Core No.</td>
                        <td className="bg-header font-bold col-type">Core Type</td>
                        <td className="bg-header font-bold col-reason">Failure Reason / Observation</td>
                        <td className="bg-header font-bold col-remark">Remark</td>
                    </tr>

                    {/* --- DATA ROWS --- */}
                    {data.map((item, i) => (
                        <tr key={i}>
                            <td>{item.failedAt ? new Date(item.failedAt).toLocaleDateString('en-GB') : (item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : '-')}</td>
                            <td>{item.vendorCoreNo || item.coreVendorNo || '-'}</td>
                            <td className="font-bold">{item.internalCoreNo}</td>
                            <td>{item.coreType || '-'}</td>
                            <td className="col-reason">{item.failureReason || '-'}</td>
                            <td className="font-bold text-red-600">{(item as any).remark || 'Rejected'}</td>
                        </tr>
                    ))}

                    {/* Padding rows to ensure table takes up space nicely like the image */}
                    {Array.from({ length: Math.max(0, 20 - data.length) }).map((_, i) => (
                        <tr key={`pad-${i}`} className="h-6">
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td className="col-reason"></td>
                            <td></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="footer-sig">
                <div className="sig-box">
                    <div className="sig-title">Test by</div>
                    <div className="sig-name">Rahul Sharma</div>
                </div>
                <div className="sig-box">
                    <div className="sig-title">Authorised Signatory</div>
                    <div className="sig-company">For Advent Engineers</div>
                </div>
            </div>
        </div>
    );
}

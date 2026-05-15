import adventLogo from '../../assets/advent_logo.jpg';
import { FailedCore } from '../testing/CoreTestingForm';
import '../../styles/report.css';

export interface PrintableFailedCoreReportProps {
    data: FailedCore[];
}

export function PrintableFailedCoreReport({ data }: PrintableFailedCoreReportProps) {
    if (!data || data.length === 0) return null;

    const today = new Date().toLocaleDateString('en-GB');
    const reportDate = today;

    // Derive a document ID from the first job ID in the data
    const firstJobId = data[0]?.jobId || '';
    const jobSuffix = firstJobId.split('-').pop() || '000';
    const docId = `AE-FCR-${new Date().getFullYear()}-${jobSuffix}`;

    // KPI counts
    const totalFailed = data.length;
    const meteringCount = data.filter(c => c.coreType?.toUpperCase() === 'METERING').length;
    const protectionCount = data.filter(c => c.coreType?.toUpperCase() === 'PROTECTION').length;
    const specialCount = data.filter(
        c => c.coreType?.toUpperCase() !== 'METERING' && c.coreType?.toUpperCase() !== 'PROTECTION'
    ).length;

    return (
        <div id="printable-failed-core-report">
            {/* Background Watermark */}
            <div className="fcr-watermark">ADVENT</div>

            <div className="fcr-content">
                {/* ===== HEADER ===== */}
                <header className="fcr-report-header">
                    <div className="fcr-header-top">
                        <div className="fcr-logo-container">
                            <img src={adventLogo} alt="Advent Engineers Logo" className="fcr-company-logo" />
                        </div>
                        <div className="fcr-brand-text-area">
                            <h1>ADVENT ENGINEERS</h1>
                            <p>Excellence in Transformer Core Testing</p>
                        </div>
                        <div></div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="fcr-metadata-grid">
                        <div className="fcr-meta-item">
                            <span className="fcr-meta-label">Document ID</span>
                            <span className="fcr-meta-value">{docId}</span>
                        </div>
                        <div className="fcr-meta-item">
                            <span className="fcr-meta-label">Batch Reference</span>
                            <span className="fcr-meta-value">{firstJobId || '—'}</span>
                        </div>
                        <div className="fcr-meta-item">
                            <span className="fcr-meta-label">Report Date</span>
                            <span className="fcr-meta-value">{reportDate}</span>
                        </div>
                        <div className="fcr-meta-item">
                            <span className="fcr-meta-label">Classification</span>
                            <span className="fcr-meta-value">Quality Controlled</span>
                        </div>
                    </div>
                </header>

                {/* ===== KPI SECTION ===== */}
                <section className="fcr-dashboard-section">
                    <div className="fcr-section-title">Audit Metrics &amp; Distributions</div>
                    <div className="fcr-kpi-grid">
                        <div className="fcr-kpi-card">
                            <div className="fcr-kpi-val">{totalFailed}</div>
                            <div className="fcr-kpi-lbl">Total Failed Units</div>
                        </div>
                        <div className="fcr-kpi-card">
                            <div className="fcr-kpi-val">{meteringCount}</div>
                            <div className="fcr-kpi-lbl">Metering Cores</div>
                        </div>
                        <div className="fcr-kpi-card">
                            <div className="fcr-kpi-val">{protectionCount}</div>
                            <div className="fcr-kpi-lbl">Protection Cores</div>
                        </div>
                        <div className="fcr-kpi-card">
                            <div className="fcr-kpi-val">{specialCount}</div>
                            <div className="fcr-kpi-lbl">Special Cores</div>
                        </div>
                        <div className="fcr-kpi-card">
                            <div className="fcr-kpi-val fcr-kpi-val--red">100%</div>
                            <div className="fcr-kpi-lbl">Rejection Rate</div>
                        </div>
                    </div>
                </section>

                {/* ===== DATA TABLE ===== */}
                <section className="fcr-table-container">
                    <div className="fcr-section-title">Detailed Core Failure Ledger</div>
                    <table className="fcr-enterprise-table">
                        <thead>
                            <tr>
                                <th className="fcr-col-date">Test Date</th>
                                <th className="fcr-col-vendor">Vendor Core No.</th>
                                <th className="fcr-col-core-no">Internal Core ID</th>
                                <th className="fcr-col-type">Core Type</th>
                                <th className="fcr-col-observation">Failure Reason / Metric Observation</th>
                                <th className="fcr-col-remark">Remark</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, i) => (
                                <tr key={i}>
                                    <td className="fcr-col-date">
                                        {item.failedAt
                                            ? new Date(item.failedAt).toLocaleDateString('en-GB')
                                            : item.createdAt
                                                ? new Date(item.createdAt).toLocaleDateString('en-GB')
                                                : '-'}
                                    </td>
                                    <td className="fcr-col-vendor">
                                        {item.vendorCoreNo || item.coreVendorNo || 'NOT-RECORDED-YET'}
                                    </td>
                                    <td className="fcr-col-core-no">{item.internalCoreNo}</td>
                                    <td className="fcr-col-type">{item.coreType || '-'}</td>
                                    <td className="fcr-col-observation">{item.failureReason || '-'}</td>
                                    <td className="fcr-col-remark">
                                        {(item as any).remark || 'Rejected'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                {/* ===== FOOTER ===== */}
                <footer className="fcr-report-footer">
                    <div className="fcr-signature-row">
                        <div className="fcr-signature-box">
                            <div className="fcr-sig-line"></div>
                            <div className="fcr-sig-title">Tested By</div>
                            <div className="fcr-sig-name">Quality Lab Tech</div>
                        </div>
                        <div className="fcr-signature-box">
                            <div className="fcr-sig-line"></div>
                            <div className="fcr-sig-title">Verified By</div>
                            <div className="fcr-sig-name">QA Line Inspector</div>
                        </div>
                        <div className="fcr-signature-box">
                            <div className="fcr-sig-line"></div>
                            <div className="fcr-sig-title">Authorised Signatory</div>
                            <div className="fcr-sig-name fcr-sig-name--bold">Rahul Sharma</div>
                        </div>
                    </div>

                    <div className="fcr-document-legal">
                        <div className="fcr-legal-left">Advent Engineers © {new Date().getFullYear()} | Quality Control System Audit Data</div>
                        <div>Page 1 of 1</div>
                        <div className="fcr-legal-generated">Generated: {reportDate}</div>
                    </div>
                </footer>
            </div>
        </div>
    );
}

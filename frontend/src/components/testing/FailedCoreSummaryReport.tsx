import { FailedCore } from './CoreTestingForm';
import adventLogo from '../../assets/advent_logo.jpg';

interface FailedCoreSummaryReportProps {
    data: FailedCore[];
    totalTested?: number;
    totalPassed?: number;
    clientName?: string;
    reportId?: string;
}

export function FailedCoreSummaryReport({
    data,
    clientName = '—',
    reportId: customReportId,
}: FailedCoreSummaryReportProps) {
    const reportDate = new Date().toLocaleDateString('en-GB');

    // Derive a document ID
    const firstJobId = data?.[0]?.jobId || '';
    const jobSuffix = firstJobId.split('-').pop() || '000';
    const docId = customReportId || `AE-FCR-${new Date().getFullYear()}-${jobSuffix}`;

    // KPI counts
    const totalFailed = data?.length || 0;
    const meteringCount = data?.filter(c => c.coreType?.toUpperCase() === 'METERING').length || 0;
    const protectionCount = data?.filter(c => c.coreType?.toUpperCase() === 'PROTECTION').length || 0;
    const specialCount = data?.filter(
        c => c.coreType?.toUpperCase() !== 'METERING' && c.coreType?.toUpperCase() !== 'PROTECTION'
    ).length || 0;

    return (
        <div id="print-section">
            <style>{`
                /* =====================================================
                   Failed Core Summary Report — Enterprise Print Styles
                   ===================================================== */
                :root {
                    --fcr-brand-red: #E31E24;
                    --fcr-brand-blue: #231F61;
                    --fcr-primary-text: #2D3748;
                    --fcr-secondary-text: #606F7B;
                    --fcr-border-thin: 1px solid #E2E8F0;
                    --fcr-table-header-bg: #F0F4F8;
                    --fcr-zebra-bg: #F8FAFC;
                }

                @media screen {
                    #print-section {
                        display: none;
                    }
                }

                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 15mm 12mm;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #print-section, #print-section * {
                        visibility: visible;
                    }
                    #print-section {
                        display: block;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 0;
                        background: white;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .fcr-sum-page-wrapper {
                        width: 100%;
                        margin: 0;
                        padding: 0;
                        box-shadow: none;
                        page-break-after: always;
                    }
                    .fcr-sum-enterprise-table thead {
                        display: table-header-group;
                    }
                    .fcr-sum-enterprise-table tr {
                        page-break-inside: avoid;
                    }
                }

                /* ---- General Layout ---- */
                .fcr-sum-page-wrapper {
                    box-sizing: border-box;
                    color: var(--fcr-primary-text);
                    font-family: 'Segoe UI', Arial, sans-serif;
                    line-height: 1.4;
                    position: relative;
                }

                /* Watermark */
                .fcr-sum-watermark {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(-45deg);
                    font-size: 110px;
                    font-weight: 800;
                    color: rgba(35, 31, 97, 0.015);
                    pointer-events: none;
                    white-space: nowrap;
                    letter-spacing: 12px;
                    text-transform: uppercase;
                    z-index: 1;
                }

                .fcr-sum-content {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    flex-direction: column;
                    min-height: 257mm;
                }

                /* ---- Header ---- */
                .fcr-sum-report-header {
                    border-bottom: 1px solid #D2D6DC;
                    padding-bottom: 18px;
                    margin-bottom: 20px;
                }

                .fcr-sum-header-top {
                    display: grid;
                    grid-template-columns: 80px 1fr 80px;
                    align-items: center;
                    width: 100%;
                }

                .fcr-sum-logo-container {
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                }

                .fcr-sum-company-logo {
                    width: 65px;
                    height: 65px;
                    object-fit: contain;
                    display: block;
                }

                .fcr-sum-brand-text-area {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }

                .fcr-sum-brand-text-area h1 {
                    color: var(--fcr-brand-blue);
                    font-size: 26px;
                    font-weight: 800;
                    letter-spacing: 0.5px;
                    line-height: 1.1;
                    text-transform: uppercase;
                    margin: 0;
                }

                .fcr-sum-brand-text-area p {
                    font-size: 11px;
                    color: var(--fcr-brand-red);
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.6px;
                    margin-top: 4px;
                }

                /* Metadata Grid */
                .fcr-sum-metadata-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 15px;
                    margin-top: 20px;
                    padding-top: 12px;
                    border-top: var(--fcr-border-thin);
                }

                .fcr-sum-meta-item {
                    display: flex;
                    flex-direction: column;
                }

                .fcr-sum-meta-label {
                    font-size: 10px;
                    text-transform: uppercase;
                    color: var(--fcr-secondary-text);
                    font-weight: 600;
                    margin-bottom: 2px;
                }

                .fcr-sum-meta-value {
                    font-size: 12px;
                    font-weight: 700;
                    color: var(--fcr-primary-text);
                }

                /* ---- Section Title ---- */
                .fcr-sum-section-title {
                    font-size: 12px;
                    font-weight: 700;
                    text-transform: uppercase;
                    margin-bottom: 12px;
                    letter-spacing: 0.5px;
                    display: flex;
                    align-items: center;
                    color: var(--fcr-brand-blue);
                }

                .fcr-sum-section-title::after {
                    content: '';
                    flex-grow: 1;
                    height: 1px;
                    background-color: #E2E8F0;
                    margin-left: 10px;
                }

                /* ---- KPI Cards ---- */
                .fcr-sum-dashboard-section {
                    margin-bottom: 25px;
                }

                .fcr-sum-kpi-grid {
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 10px;
                }

                .fcr-sum-kpi-card {
                    border: var(--fcr-border-thin);
                    border-radius: 4px;
                    padding: 12px 10px;
                    background-color: var(--fcr-zebra-bg);
                    text-align: left;
                }

                .fcr-sum-kpi-val {
                    color: var(--fcr-brand-blue);
                    font-size: 22px;
                    font-weight: 700;
                    line-height: 1;
                    margin-bottom: 4px;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                .fcr-sum-kpi-val--red {
                    color: var(--fcr-brand-red) !important;
                }

                .fcr-sum-kpi-lbl {
                    font-size: 9.5px;
                    font-weight: 600;
                    color: var(--fcr-secondary-text);
                    text-transform: uppercase;
                    letter-spacing: 0.2px;
                }

                /* ---- Enterprise Table ---- */
                .fcr-sum-table-container {
                    margin-bottom: 30px;
                    flex-grow: 1;
                }

                .fcr-sum-enterprise-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 11px;
                    border: var(--fcr-border-thin);
                    border-radius: 4px;
                    overflow: hidden;
                    table-layout: fixed;
                }

                .fcr-sum-enterprise-table th {
                    background-color: var(--fcr-table-header-bg);
                    color: var(--fcr-brand-blue);
                    font-weight: 700;
                    text-transform: uppercase;
                    font-size: 10px;
                    padding: 10px 12px;
                    border: var(--fcr-border-thin);
                    text-align: left;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                .fcr-sum-enterprise-table td {
                    padding: 10px 12px;
                    border: var(--fcr-border-thin);
                    vertical-align: top;
                    color: var(--fcr-primary-text);
                    word-wrap: break-word;
                }

                .fcr-sum-enterprise-table tbody tr:nth-child(even) {
                    background-color: var(--fcr-zebra-bg);
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                .fcr-sum-col-date   { width: 85px; font-weight: 600; }
                .fcr-sum-col-vendor { width: 130px; }
                .fcr-sum-col-id     { width: 140px; font-family: monospace; font-size: 11px; font-weight: 600; }
                .fcr-sum-col-type   { width: 90px; text-transform: uppercase; }
                .fcr-sum-col-obs    { width: auto; line-height: 1.3; }
                .fcr-sum-col-remark {
                    width: 85px;
                    text-align: center;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--fcr-brand-red);
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                /* ---- Footer Signatures ---- */
                .fcr-sum-report-footer {
                    margin-top: auto;
                    padding-top: 15px;
                }

                .fcr-sum-signature-row {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 30px;
                    margin-bottom: 20px;
                }

                .fcr-sum-signature-box {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }

                .fcr-sum-sig-line {
                    width: 100%;
                    border-top: 1px dashed var(--fcr-secondary-text);
                    margin-bottom: 6px;
                }

                .fcr-sum-sig-title {
                    font-size: 11px;
                    font-weight: 700;
                    color: var(--fcr-primary-text);
                }

                .fcr-sum-sig-name {
                    font-size: 11px;
                    color: var(--fcr-secondary-text);
                    margin-top: 1px;
                }

                .fcr-sum-sig-name--bold {
                    font-weight: 700;
                    color: var(--fcr-primary-text) !important;
                }

                /* ---- Legal Bar ---- */
                .fcr-sum-document-legal {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 9px;
                    color: var(--fcr-secondary-text);
                    border-top: var(--fcr-border-thin);
                    padding-top: 8px;
                }

                .fcr-sum-legal-left   { font-weight: 600; }
                .fcr-sum-legal-right  { font-weight: 600; }
            `}</style>

            <div className="fcr-sum-page-wrapper">
                {/* Watermark */}
                <div className="fcr-sum-watermark">ADVENT</div>

                <div className="fcr-sum-content">
                    {/* ===== HEADER ===== */}
                    <header className="fcr-sum-report-header">
                        <div className="fcr-sum-header-top">
                            <div className="fcr-sum-logo-container">
                                <img src={adventLogo} alt="Advent Engineers Logo" className="fcr-sum-company-logo" />
                            </div>
                            <div className="fcr-sum-brand-text-area">
                                <h1>ADVENT ENGINEERS</h1>
                                <p>Excellence in Transformer Core Testing</p>
                            </div>
                            <div></div>
                        </div>

                        <div className="fcr-sum-metadata-grid">
                            <div className="fcr-sum-meta-item">
                                <span className="fcr-sum-meta-label">Document ID</span>
                                <span className="fcr-sum-meta-value">{docId}</span>
                            </div>
                            <div className="fcr-sum-meta-item">
                                <span className="fcr-sum-meta-label">Batch Reference</span>
                                <span className="fcr-sum-meta-value">{firstJobId || '—'}</span>
                            </div>
                            <div className="fcr-sum-meta-item">
                                <span className="fcr-sum-meta-label">Report Date</span>
                                <span className="fcr-sum-meta-value">{reportDate}</span>
                            </div>
                            <div className="fcr-sum-meta-item">
                                <span className="fcr-sum-meta-label">Classification</span>
                                <span className="fcr-sum-meta-value">
                                    {clientName !== '—' ? clientName : 'Quality Controlled'}
                                </span>
                            </div>
                        </div>
                    </header>

                    {/* ===== KPI SECTION ===== */}
                    <section className="fcr-sum-dashboard-section">
                        <div className="fcr-sum-section-title">Audit Metrics &amp; Distributions</div>
                        <div className="fcr-sum-kpi-grid">
                            <div className="fcr-sum-kpi-card">
                                <div className="fcr-sum-kpi-val">{totalFailed}</div>
                                <div className="fcr-sum-kpi-lbl">Total Failed Units</div>
                            </div>
                            <div className="fcr-sum-kpi-card">
                                <div className="fcr-sum-kpi-val">{meteringCount}</div>
                                <div className="fcr-sum-kpi-lbl">Metering Cores</div>
                            </div>
                            <div className="fcr-sum-kpi-card">
                                <div className="fcr-sum-kpi-val">{protectionCount}</div>
                                <div className="fcr-sum-kpi-lbl">Protection Cores</div>
                            </div>
                            <div className="fcr-sum-kpi-card">
                                <div className="fcr-sum-kpi-val">{specialCount}</div>
                                <div className="fcr-sum-kpi-lbl">Special Cores</div>
                            </div>
                            <div className="fcr-sum-kpi-card">
                                <div className="fcr-sum-kpi-val fcr-sum-kpi-val--red">100%</div>
                                <div className="fcr-sum-kpi-lbl">Rejection Rate</div>
                            </div>
                        </div>
                    </section>

                    {/* ===== DATA TABLE ===== */}
                    <section className="fcr-sum-table-container">
                        <div className="fcr-sum-section-title">Detailed Core Failure Ledger</div>
                        <table className="fcr-sum-enterprise-table">
                            <thead>
                                <tr>
                                    <th className="fcr-sum-col-date">Test Date</th>
                                    <th className="fcr-sum-col-vendor">Vendor Core No.</th>
                                    <th className="fcr-sum-col-id">Internal Core ID</th>
                                    <th className="fcr-sum-col-type">Core Type</th>
                                    <th className="fcr-sum-col-obs">Failure Reason / Metric Observation</th>
                                    <th className="fcr-sum-col-remark">Remark</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data && data.length > 0 ? (
                                    data.map((item, i) => (
                                        <tr key={i}>
                                            <td className="fcr-sum-col-date">
                                                {item.failedAt
                                                    ? new Date(item.failedAt).toLocaleDateString('en-GB')
                                                    : item.createdAt
                                                        ? new Date(item.createdAt).toLocaleDateString('en-GB')
                                                        : '-'}
                                            </td>
                                            <td className="fcr-sum-col-vendor">
                                                {item.vendorCoreNo || item.coreVendorNo || 'NOT-RECORDED-YET'}
                                            </td>
                                            <td className="fcr-sum-col-id">{item.internalCoreNo}</td>
                                            <td className="fcr-sum-col-type">{item.coreType || '-'}</td>
                                            <td className="fcr-sum-col-obs">{item.failureReason || '-'}</td>
                                            <td className="fcr-sum-col-remark">
                                                {(item as any).remark || 'Rejected'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', fontStyle: 'italic', color: '#94a3b8', height: '40px' }}>
                                            No failed core records available.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </section>

                    {/* ===== FOOTER ===== */}
                    <footer className="fcr-sum-report-footer">
                        <div className="fcr-sum-signature-row">
                            <div className="fcr-sum-signature-box">
                                <div className="fcr-sum-sig-line"></div>
                                <div className="fcr-sum-sig-title">Tested By</div>
                                <div className="fcr-sum-sig-name">Quality Lab Tech</div>
                            </div>
                            <div className="fcr-sum-signature-box">
                                <div className="fcr-sum-sig-line"></div>
                                <div className="fcr-sum-sig-title">Verified By</div>
                                <div className="fcr-sum-sig-name">QA Line Inspector</div>
                            </div>
                            <div className="fcr-sum-signature-box">
                                <div className="fcr-sum-sig-line"></div>
                                <div className="fcr-sum-sig-title">Authorised Signatory</div>
                                <div className="fcr-sum-sig-name fcr-sum-sig-name--bold">Rahul Sharma</div>
                            </div>
                        </div>

                        <div className="fcr-sum-document-legal">
                            <div className="fcr-sum-legal-left">
                                Advent Engineers © {new Date().getFullYear()} | Quality Control System Audit Data
                            </div>
                            <div>Page 1 of 1</div>
                            <div className="fcr-sum-legal-right">Generated: {reportDate}</div>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
}

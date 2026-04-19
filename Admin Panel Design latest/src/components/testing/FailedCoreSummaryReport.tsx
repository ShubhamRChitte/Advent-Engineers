import { useMemo } from 'react';
import { FailedCore } from './CoreTestingForm';
import adventLogo from '../../assets/advent_logo.jpg';

interface FailedCoreSummaryReportProps {
    data: FailedCore[];
    totalTested?: number;
    totalPassed?: number;
    clientName?: string;
    reportId?: string;
}

function parseFailureReason(reason: string) {
    if (!reason) return [{ parameter: 'Generic Failure', measured: '-', limit: '-' }];

    const lines = reason.split(/[\n;]|\. /).filter(l => l.trim().length > 0);
    
    return lines.map(line => {
        const exceedsMatch = line.match(/(.*?)\((.*?)\)\s+exceeds\s+(.*)/i);
        if (exceedsMatch) {
            return {
                parameter: exceedsMatch[1]?.trim(),
                measured: exceedsMatch[2]?.trim(),
                limit: exceedsMatch[3]?.trim()
            };
        }

        const failedMatch = line.match(/(.*?)\s+failed\s+(.*)/i);
        if (failedMatch) {
            return {
                parameter: failedMatch[1]?.trim(),
                measured: 'FAIL',
                limit: failedMatch[2]?.trim()
            };
        }

        return {
            parameter: line.trim(),
            measured: '-',
            limit: '-'
        };
    });
}

export function FailedCoreSummaryReport({ 
    data, 
    totalTested = 0, 
    totalPassed = 0,
    clientName = "—",
    reportId: customReportId 
}: FailedCoreSummaryReportProps) {
    
    const reportDate = new Date().toLocaleDateString('en-GB');
    const reportId = customReportId || `FCR-2026-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

    const totalFailed = data?.length || 0;
    const meteringCount = data?.filter(c => c.coreType?.toUpperCase() === 'METERING').length || 0;
    const protectionCount = data?.filter(c => c.coreType?.toUpperCase() === 'PROTECTION').length || 0;

    const displayTotalTested = totalTested || (totalFailed + totalPassed) || 63;
    const displayTotalPassed = totalPassed || (displayTotalTested - totalFailed) || 47;

    return (
        <div id="print-section">
            <style>{`
                /* Screen View */
                @media screen {
                    #print-section {
                        background: #f8fafc;
                        padding: 20px;
                        font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    }
                    .a4-page {
                        width: 100%;
                        max-width: 1100px;
                        margin: 0 auto 20px auto;
                        padding: 20px;
                        background: white;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                        border-radius: 8px;
                    }
                    .table-wrapper {
                        overflow-x: auto;
                    }
                    .report-table {
                        min-width: 900px;
                    }
                }

                /* Print View */
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 10mm;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #print-section, #print-section * {
                        visibility: visible;
                    }
                    #print-section {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 0;
                        background: white;
                    }
                    .a4-page {
                        width: 190mm;
                        min-height: 277mm; 
                        margin: 0;
                        padding: 0;
                        page-break-after: always;
                    }
                    .a4-page:last-child {
                        page-break-after: auto;
                    }
                }

                /* General Styles */
                .a4-page {
                    box-sizing: border-box;
                    color: black;
                    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                }
                
                .page-header {
                    display: grid;
                    grid-template-columns: 100px 1fr 100px;
                    align-items: center;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #ccc;
                    margin-bottom: 20px;
                }
                .logo-container {
                    display: flex;
                    align-items: center;
                }
                .logo-icon {
                    width: 85px;
                    height: auto;
                    max-height: 85px;
                    object-fit: contain;
                }
                .company-info {
                    text-align: center;
                }
                .company-name {
                    font-size: 26px;
                    font-weight: 700;
                    letter-spacing: 1px;
                    margin: 0;
                    margin-bottom: 2px;
                }
                .company-sub {
                    font-size: 14px;
                    color: #4b5563;
                    margin: 0;
                    margin-top: 4px;
                }
                .header-meta {
                    display: flex;
                    justify-content: space-between;
                    font-size: 11px;
                    margin-bottom: 20px;
                }
                .meta-col {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                }
                .meta-row {
                    display: flex;
                }
                .meta-label {
                    font-weight: bold;
                    width: 65px;
                }
                .meta-value {
                    font-weight: 500;
                }
                .meta-label-right {
                    font-weight: bold;
                    width: 65px;
                    text-align: left;
                }

                .main-title-box {
                    border: 1.5px solid #e2e8f0;
                    text-align: center;
                    padding: 10px;
                    margin-bottom: 20px;
                }
                .main-title-text {
                    font-size: 18px;
                    font-weight: bold;
                }
                .main-title-sub {
                    font-size: 11px; 
                    color: #64748b;
                }

                /* Summary Strip Styles */
                .summary-strip {
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                    margin-bottom: 20px;
                }
                .summary-box {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    padding: 10px 20px;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }
                .summary-stat {
                    text-align: center;
                }
                .summary-stat-label {
                    font-size: 9px;
                    color: #64748b;
                    text-transform: uppercase;
                    font-weight: bold;
                }
                .summary-stat-value {
                    font-size: 18px;
                    font-weight: bold;
                }
                .summary-stat-value.red { color: #dc2626 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .summary-stat-value.green { color: #059669 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .divider {
                    width: 1px;
                    height: 30px;
                    background: #e2e8f0;
                }

                /* Table Styling */
                table {
                    page-break-inside: auto;
                    table-layout: fixed;
                    width: 100%;
                }
                
                tr {
                    page-break-inside: avoid;
                }

                td {
                    word-wrap: break-word;
                }

                .report-table {
                    width: 100%;
                    border-collapse: collapse;
                    table-layout: fixed;
                    margin-top: 10px;
                }
                
                .report-table td, .report-table th {
                    padding: 6px;
                    border: 1px solid #d1d5db;
                    text-align: center;
                    font-size: 11px;
                    vertical-align: middle;
                }

                .report-table th {
                    background: #f3f4f6;
                    font-weight: bold;
                }

                .footer-sig {
                    margin-top: 30px;
                    display: flex;
                    justify-content: space-between;
                    padding: 0 40px;
                    page-break-inside: avoid;
                }
                .sig-box {
                    text-align: center;
                    width: 200px;
                }
                .sig-title {
                    font-weight: bold;
                    font-size: 13px;
                    margin-bottom: 40px;
                }
                .sig-name {
                    font-size: 12px;
                    color: #444;
                }
                .sig-company {
                    font-weight: bold;
                    font-size: 12px;
                    font-style: italic;
                    margin-top: 2px;
                }
            `}</style>

            <div className="a4-page">
                <div className="page-header">
                    <div className="logo-container">
                        <img src={adventLogo} alt="Advent Engineers Logo" className="logo-icon" />
                    </div>
                    <div className="company-info">
                        <div className="company-name">ADVENT ENGINEERS</div>
                        <div className="company-sub">Excellence in Transformer Core Testing</div>
                    </div>
                    <div></div>
                </div>

                <div className="header-meta">
                    <div className="meta-col">
                        <div className="meta-row">
                            <div className="meta-label">Date:</div>
                            <div className="meta-value">{reportDate}</div>
                        </div>
                        <div className="meta-row">
                            <div className="meta-label">Document:</div>
                            <div className="meta-value">Failed Core Summary</div>
                        </div>
                        {clientName !== "—" && (
                            <div className="meta-row">
                                <div className="meta-label">Client:</div>
                                <div className="meta-value">{clientName}</div>
                            </div>
                        )}
                    </div>
                    <div className="meta-col">
                        <div className="meta-row">
                            <div className="meta-label-right">Record ID:</div>
                            <div className="meta-value">{reportId}</div>
                        </div>
                    </div>
                </div>

                <div className="main-title-box">
                    <div className="main-title-text">
                        Failed Core Summary Report
                    </div>
                    <div className="main-title-sub">(Non-Conforming Unit Details)</div>
                </div>

                <div className="summary-strip">
                    <div className="summary-box">
                        <div className="summary-stat">
                            <div className="summary-stat-label">Total Tested</div>
                            <div className="summary-stat-value">{displayTotalTested}</div>
                        </div>
                        <div className="divider" />
                        <div className="summary-stat">
                            <div className="summary-stat-label">Total Failed</div>
                            <div className="summary-stat-value red">{totalFailed}</div>
                        </div>
                        <div className="divider" />
                        <div className="summary-stat">
                            <div className="summary-stat-label">Passed</div>
                            <div className="summary-stat-value green">{displayTotalPassed}</div>
                        </div>
                    </div>
                    <div className="summary-box">
                        <div className="summary-stat">
                            <div className="summary-stat-label">Metering</div>
                            <div className="summary-stat-value" style={{ fontSize: '14px' }}>{meteringCount}</div>
                        </div>
                        <div className="divider" style={{ height: '20px' }} />
                        <div className="summary-stat">
                            <div className="summary-stat-label">Protection</div>
                            <div className="summary-stat-value" style={{ fontSize: '14px' }}>{protectionCount}</div>
                        </div>
                    </div>
                </div>

                <div className="table-wrapper">
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th style={{ width: '5%' }}>Sr.</th>
                                <th style={{ width: '12%' }}>Date</th>
                                <th style={{ width: '15%' }}>Core ID</th>
                                <th style={{ width: '15%' }}>Vendor</th>
                                <th style={{ width: '12%' }}>Type</th>
                                <th style={{ width: '17%' }}>Parameter</th>
                                <th style={{ width: '10%' }}>Measured</th>
                                <th style={{ width: '8%' }}>Limit</th>
                                <th style={{ width: '6%' }}>Result</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data && data.length > 0 ? data.map((core, i) => {
                                const failures = parseFailureReason(core.failureReason);
                                
                                return failures.map((f, fIdx) => (
                                    <tr key={`${i}-${fIdx}`}>
                                        {fIdx === 0 && (
                                            <>
                                                <td rowSpan={failures.length}>{i + 1}</td>
                                                <td rowSpan={failures.length}>
                                                    {core.failedAt ? new Date(core.failedAt).toLocaleDateString('en-GB') : '-'}
                                                </td>
                                                <td rowSpan={failures.length} style={{ fontWeight: 'bold' }}>
                                                    {core.internalCoreNo}
                                                </td>
                                                <td rowSpan={failures.length}>
                                                    {core.coreVendorNo || core.vendorCoreNo || '-'}
                                                </td>
                                                <td rowSpan={failures.length}>
                                                    {core.coreType}
                                                </td>
                                            </>
                                        )}
                                        <td style={{ fontStyle: 'italic' }}>
                                            {f.parameter}
                                        </td>
                                        <td style={{ color: '#dc2626', fontWeight: 'bold' }}>
                                            {f.measured}
                                        </td>
                                        <td>
                                            {f.limit}
                                        </td>
                                        <td style={{ color: '#dc2626', fontWeight: 'bold' }}>
                                            FAIL
                                        </td>
                                    </tr>
                                ));
                            }) : (
                                <tr>
                                    <td colSpan={9} style={{ fontStyle: 'italic', color: '#64748b', height: '40px' }}>No failed core records available.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="footer-sig">
                    <div className="sig-box">
                        <div className="sig-title">Tested By</div>
                        <div className="sig-name">Rahul Sharma</div>
                        <div className="sig-company">Testing Engineer</div>
                    </div>
                    <div className="sig-box">
                        <div className="sig-title">Authorized Signatory</div>
                        <div className="sig-name">(Signature & Stamp)</div>
                        <div className="sig-company">For Advent Engineers</div>
                    </div>
                </div>
                
                <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>
                    This is an official engineering record generated by Advent QA Systems.
                </div>
            </div>
        </div>
    );
}

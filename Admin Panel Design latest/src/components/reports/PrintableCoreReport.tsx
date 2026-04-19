import adventLogo from '../../assets/advent_logo.jpg';

export interface PrintableCoreReportProps {
    order: any;
    coreData: any;
}

export function PrintableCoreReport({ order, coreData }: PrintableCoreReportProps) {
    if (!coreData) return null;

    // Fallback extractors 
    const isProtection = coreData.coreType === 'Protection' || coreData.coreType === 'PS';

    const testSetup = coreData.testSetup || {};
    const coreSize1 = testSetup.coreSizeMm?.id || '115';
    const coreSize2 = testSetup.coreSizeMm?.od || '145';
    const coreSize3 = testSetup.coreSizeMm?.height || '35';
    const turnsUsed = testSetup.turnsUsed || '10';
    const areaSqCm = testSetup.areaSqCm || 41.225;
    const mmp = testSetup.mmp || 42.39;

    const testLimits = coreData.testLimits || {};
    const testSpec = coreData.testSpecification || {};

    const tableData = coreData.tableData || [];

    // TATA Ref from main order if saved, else default
    const tataRef = order.tataRef || 'TR-2024-001';

    // Pagination limits
    const FIRST_PAGE_ROWS = 10;   // leave space for header + signature
    const OTHER_PAGE_ROWS = 14;

    // Pagination logic
    const pages = [];
    if (!tableData || tableData.length === 0) {
        pages.push([]);
    } else {
        pages.push(tableData.slice(0, FIRST_PAGE_ROWS));

        let remaining = tableData.slice(FIRST_PAGE_ROWS);

        while (remaining.length > 0) {
            pages.push(remaining.slice(0, OTHER_PAGE_ROWS));
            remaining = remaining.slice(OTHER_PAGE_ROWS);
        }
    }

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

                /* Table Styling (Match PDF Look) */
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

                .text-left { text-align: left !important; }
                .font-bold { font-weight: bold; }
                
                .label {
                    font-weight: 600;
                    text-align: left;
                }

                .id-box {
                    white-space: nowrap;
                    text-align: center;
                    font-weight: 600;
                    background: #d1fae5 !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                .col-date { width: 12%; }
                .col-vendor { width: 15%; }
                .col-internal { width: 15%; }
                .col-remark { width: 10%; }

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

            {pages.map((pageData, index) => (
                <div key={index} className="a4-page">
                    {/* Header renders on every page */}
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
                                <div className="meta-value">{new Date(order.updatedAt || new Date()).toLocaleDateString('en-GB')}</div>
                            </div>
                            <div className="meta-row">
                                <div className="meta-label">Order No:</div>
                                <div className="meta-value">{order.jobId}</div>
                            </div>
                            <div className="meta-row">
                                <div className="meta-label">Client:</div>
                                <div className="meta-value">{order.clientName || order.client}</div>
                            </div>
                        </div>
                        <div className="meta-col">
                            <div className="meta-row">
                                <div className="meta-label-right">Batch ID:</div>
                                <div className="meta-value">JOB-{new Date(order.createdAt || new Date()).getFullYear()}-{order.jobId?.slice(-3)}</div>
                            </div>
                            <div className="meta-row">
                                <div className="meta-label-right">Tata Ref:</div>
                                <div className="meta-value">{tataRef}</div>
                            </div>
                        </div>
                    </div>

                    {index === 0 && (
                        <div className="main-title-box">
                            <div className="main-title-text">
                                Core Testing Report - {coreData.coreName || 'Metering'}
                            </div>
                        </div>
                    )}

                    <div className="table-wrapper">
                        <table className="report-table">
                            <tbody>
                                {index === 0 && (
                                    <>
                                        <tr>
                                            <th colSpan={isProtection ? 5 : 8} className="font-bold text-[13px]">
                                                Toroidal Core Testing
                                            </th>
                                        </tr>
                                        <tr>
                                            <th colSpan={isProtection ? 5 : 8} className="font-bold text-[12px] uppercase">
                                                TOROIDAL CORE NANO CRYSTALLINE
                                            </th>
                                        </tr>
                                        <tr>
                                            <th className="label text-left" colSpan={isProtection ? 1 : 2}>CORE SIZE IN MM</th>
                                            <td colSpan={1}>{coreSize1}</td>
                                            <td colSpan={isProtection ? 1 : 2}>{coreSize2}</td>
                                            <td colSpan={isProtection ? 1 : 2}>{coreSize3}</td>
                                            <th className="id-box" colSpan={1}>ID - OD - HT</th>
                                        </tr>
                                        <tr>
                                            <th className="text-left" colSpan={isProtection ? 2 : 2}>TURN USED FOR TESTING</th>
                                            <td colSpan={isProtection ? 3 : 6}>{turnsUsed} turns</td>
                                        </tr>
                                        <tr>
                                            <th className="text-left" colSpan={isProtection ? 2 : 2}>Area (Sq cm)</th>
                                            <td colSpan={isProtection ? 3 : 6}>{areaSqCm}</td>
                                        </tr>
                                        <tr>
                                            <th className="text-left" colSpan={isProtection ? 2 : 2}>MMP (cm)</th>
                                            <td colSpan={isProtection ? 3 : 6}>{mmp}</td>
                                        </tr>

                                        {isProtection ? (
                                            <>
                                                <tr>
                                                    <th rowSpan={3} colSpan={1} className="text-center">Specification</th>
                                                    <th className="text-left" colSpan={1}>B (Flux in Tesla)</th>
                                                    <td colSpan={2}>{testSpec.fluxTesla || '1.5'}</td>
                                                    <th rowSpan={3} className="text-center">Remark</th>
                                                </tr>
                                                <tr>
                                                    <th className="text-left" colSpan={1}>Voltage (V)</th>
                                                    <td colSpan={2}>{testSpec.voltageV || '7.04'}</td>
                                                </tr>
                                                <tr>
                                                    <th className="text-left" colSpan={1}>Iex limit in mA.</th>
                                                    <td colSpan={2}>{testSpec.iexLimitMa || '1696'}</td>
                                                </tr>
                                            </>
                                        ) : (
                                            <>
                                                <tr>
                                                    <th rowSpan={3} colSpan={2} className="text-center">Specification</th>
                                                    <th className="text-left">BSAT (G)</th>
                                                    <td>{testLimits.bsatGauss?.[0] || '1000'}</td>
                                                    <td>{testLimits.bsatGauss?.[1] || '3000'}</td>
                                                    <td>{testLimits.bsatGauss?.[2] || '5000'}</td>
                                                    <td>{testLimits.bsatGauss?.[3] || '7000'}</td>
                                                    <td className="border-b-white border-l-white bg-white"></td>
                                                </tr>
                                                <tr>
                                                    <th className="text-left">SET mV</th>
                                                    <td>{testLimits.setMilliVolt?.[0] || '93.1928'}</td>
                                                    <td>{testLimits.setMilliVolt?.[1] || '277.643'}</td>
                                                    <td>{testLimits.setMilliVolt?.[2] || '465.964'}</td>
                                                    <td>{testLimits.setMilliVolt?.[3] || '652.349'}</td>
                                                    <td className="border-b-white border-t-white border-l-white bg-white"></td>
                                                </tr>
                                                <tr>
                                                    <th className="text-left">LE LIMIT in mA.</th>
                                                    <td>{testLimits.leLimitMa?.[0] || '17.1444'}</td>
                                                    <td>{testLimits.leLimitMa?.[1] || '34.2888'}</td>
                                                    <td>{testLimits.leLimitMa?.[2] || '42.861'}</td>
                                                    <td>{testLimits.leLimitMa?.[3] || '56.7398'}</td>
                                                    <th>Remark</th>
                                                </tr>
                                            </>
                                        )}
                                    </>
                                )}

                                <tr>
                                    <th className="col-date" colSpan={isProtection ? 1 : 1}>Date</th>
                                    <th className="col-vendor" colSpan={isProtection ? 1 : 1}>Vendor core No.</th>
                                    <th className="col-internal" colSpan={isProtection ? 1 : 2}>Internal core No.</th>
                                    {isProtection ? (
                                        <th>Value (mA)</th>
                                    ) : (
                                        <>
                                            <th>{testLimits.bsatGauss?.[0] || '1000'}</th>
                                            <th>{testLimits.bsatGauss?.[1] || '3000'}</th>
                                            <th>{testLimits.bsatGauss?.[2] || '5000'}</th>
                                            <th>{testLimits.bsatGauss?.[3] || '7000'}</th>
                                        </>
                                    )}
                                    <th className="col-remark">Remark</th>
                                </tr>

                                {pageData && pageData.length > 0 ? (
                                    pageData.map((test: any, i: number) => (
                                        <tr key={i}>
                                            <td>{test.date}</td>
                                            <td>{test.vendorCoreNo}</td>
                                            <td className="font-bold" colSpan={isProtection ? 1 : 2}>{test.internalCoreNo}</td>

                                            {isProtection ? (
                                                <td>{test.value}</td>
                                            ) : (
                                                <>
                                                    <td>{test.measuredMa?.[0] || '-'}</td>
                                                    <td>{test.measuredMa?.[1] || '-'}</td>
                                                    <td>{test.measuredMa?.[2] || '-'}</td>
                                                    <td>{test.measuredMa?.[3] || '-'}</td>
                                                </>
                                            )}

                                            <td className="font-bold">{test.result}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr className="h-10 text-center">
                                        <td colSpan={isProtection ? 5 : 8} className="text-gray-500 italic">No detailed core test records available in Report Data.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {index === pages.length - 1 && (
                        <div className="footer-sig">
                            <div className="sig-box">
                                <div className="sig-title">Tested by</div>
                                <div className="sig-name">{coreData.testedBy || 'Rahul Sharma'}</div>
                            </div>
                            <div className="sig-box">
                                <div className="sig-title">Authorised Signatory</div>
                                <div className="sig-name">Rahul Sharma</div>
                                <div className="sig-company">For Advent Engineers</div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}


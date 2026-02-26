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

    return (
        <div id="print-section">
            <style>{`
                #print-section {
                    background: white;
                    padding: 8mm 12mm;
                    min-height: 297mm;
                    width: 100%;
                    box-sizing: border-box;
                    color: black;
                    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                }
                
                /* ---- HEADER WITHOUT BORDERS ---- */
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 25px;
                }
                .logo-container {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .logo-icon {
                    width: 50px;
                    height: 50px;
                    object-fit: contain;
                }
                .company-info {
                    text-align: center;
                    flex-grow: 1;
                }
                .company-name {
                    font-size: 22px;
                    font-weight: 900;
                    letter-spacing: 0.5px;
                    margin-bottom: 2px;
                }
                .company-sub {
                    font-size: 11px;
                    color: #555;
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

                /* ---- MAIN TITLE BOX ---- */
                .main-title-box {
                    border: 1.5px solid #e2e8f0;
                    text-align: center;
                    padding: 10px;
                    margin-bottom: 20px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05); /* very subtle */
                }
                .main-title-text {
                    font-size: 18px;
                    font-weight: bold;
                }

                /* ---- TABLE STYLES ---- */
                .report-table {
                    width: 100%;
                    border-collapse: collapse;
                    border: 2px solid #000;
                    table-layout: fixed;
                }
                
                .report-table td, .report-table th {
                    border: 1px solid #000;
                    padding: 4px 6px;
                    text-align: center;
                    font-size: 11px;
                    height: 24px;
                    vertical-align: middle;
                }

                /* Colors matching the image exactly */
                .bg-yellow { background-color: #fce588 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .bg-blue { background-color: #93c5fd !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .bg-green { background-color: #d1fae5 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                
                .font-bold { font-weight: bold; }
                .text-left { text-align: left !important; }

                /* Data Table specific widths */
                .col-date { width: 12%; }
                .col-vendor { width: 15%; }
                .col-internal { width: 15%; }
                .col-remark { width: 10%; }

                /* ---- FOOTER ---- */
                .footer-sig {
                    margin-top: 50px;
                    display: flex;
                    justify-content: space-between;
                    padding: 0 40px;
                }
                .sig-box {
                    text-align: center;
                    width: 200px;
                }
                .sig-title {
                    font-weight: bold;
                    font-size: 14px;
                    margin-bottom: 8px;
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

                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0; 
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
                        padding: 10mm 15mm;
                    }
                }
            `}</style>

            {/* HEADER AREA */}
            <div className="page-header">
                <div className="logo-container">
                    <img src={adventLogo} alt="Advent Engineers Logo" className="logo-icon" />
                </div>
                <div className="company-info">
                    <div className="company-name">ADVENT ENGINEERS</div>
                    <div className="company-sub">Excellence in Transformer Core Testing</div>
                </div>
                {/* Spacer to balance the flex if needed, or we just let it center */}
                <div style={{ width: '90px' }}></div>
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

            {/* MAIN TITLE BOX */}
            <div className="main-title-box">
                <div className="main-title-text">
                    Core Testing Report - {coreData.coreName || 'Metering'}
                </div>
            </div>

            <div style={{ borderBottom: '2px solid black', margin: '10px 0' }}></div>

            {/* THE MASTER TABLE */}
            <table className="report-table">
                <tbody>
                    {/* ROW 1: Title */}
                    <tr>
                        <th colSpan={isProtection ? 5 : 8} className="bg-yellow font-bold text-[13px]">
                            Toroidal Core Testing
                        </th>
                    </tr>

                    {/* ROW 2: Material */}
                    <tr>
                        <th colSpan={isProtection ? 5 : 8} className="bg-blue font-bold text-[12px] uppercase">
                            TOROIDAL CORE NANO CRYSTALLINE
                        </th>
                    </tr>

                    {/* ROW 3: Core Size */}
                    <tr>
                        <td className="bg-green font-bold text-left" colSpan={isProtection ? 2 : 2}>CORE SIZE IN MM</td>
                        <td className="bg-white font-bold">{coreSize1}</td>
                        <td className="bg-white font-bold" colSpan={isProtection ? 1 : 2}>{coreSize2}</td>
                        <td className="bg-white font-bold" colSpan={isProtection ? 1 : 2}>{coreSize3}</td>
                        <td className="bg-green font-bold" colSpan={1}>ID - OD - HT</td>
                    </tr>

                    {/* ROW 4: Turns */}
                    <tr>
                        <td className="font-bold text-left" colSpan={isProtection ? 2 : 2}>TURN USED FOR TESTING</td>
                        <td colSpan={isProtection ? 3 : 6}>{turnsUsed} turns</td>
                    </tr>

                    {/* ROW 5: Area */}
                    <tr>
                        <td className="font-bold text-left" colSpan={isProtection ? 2 : 2}>Area (Sq cm)</td>
                        <td colSpan={isProtection ? 3 : 6}>{areaSqCm}</td>
                    </tr>

                    {/* ROW 6: MMP */}
                    <tr>
                        <td className="font-bold text-left" colSpan={isProtection ? 2 : 2}>MMP (cm)</td>
                        <td colSpan={isProtection ? 3 : 6}>{mmp}</td>
                    </tr>

                    {/* --- SPECIFICATION BLOCK --- */}
                    {isProtection ? (
                        <>
                            <tr>
                                <td rowSpan={3} colSpan={1} className="font-bold border-r-0">Specification</td>
                                <td className="font-bold text-left" colSpan={1}>B (Flux in Tesla)</td>
                                <td colSpan={2}>{testSpec.fluxTesla || '1.5'}</td>
                                <td rowSpan={3} className="font-bold border-l-0">Remark</td>
                            </tr>
                            <tr>
                                <td className="font-bold text-left" colSpan={1}>Voltage (V)</td>
                                <td colSpan={2}>{testSpec.voltageV || '7.04'}</td>
                            </tr>
                            <tr>
                                <td className="font-bold text-left" colSpan={1}>Iex limit in mA.</td>
                                <td colSpan={2}>{testSpec.iexLimitMa || '1696'}</td>
                            </tr>
                        </>
                    ) : (
                        <>
                            <tr>
                                <td rowSpan={3} colSpan={2} className="font-bold">Specification</td>
                                <td className="font-bold text-left">BSAT (G)</td>
                                <td>{testLimits.bsatGauss?.[0] || '1000'}</td>
                                <td>{testLimits.bsatGauss?.[1] || '3000'}</td>
                                <td>{testLimits.bsatGauss?.[2] || '5000'}</td>
                                <td>{testLimits.bsatGauss?.[3] || '7000'}</td>
                                <td className="font-bold bg-white border-b-white border-l-white"></td>
                            </tr>
                            <tr>
                                <td className="font-bold text-left">SET mV</td>
                                <td>{testLimits.setMilliVolt?.[0] || '93.1928'}</td>
                                <td>{testLimits.setMilliVolt?.[1] || '277.643'}</td>
                                <td>{testLimits.setMilliVolt?.[2] || '465.964'}</td>
                                <td>{testLimits.setMilliVolt?.[3] || '652.349'}</td>
                                <td className="font-bold bg-white border-b-white border-t-white border-l-white"></td>
                            </tr>
                            <tr>
                                <td className="font-bold text-left">LE LIMIT in mA.</td>
                                <td>{testLimits.leLimitMa?.[0] || '17.1444'}</td>
                                <td>{testLimits.leLimitMa?.[1] || '34.2888'}</td>
                                <td>{testLimits.leLimitMa?.[2] || '42.861'}</td>
                                <td>{testLimits.leLimitMa?.[3] || '56.7398'}</td>
                                <td className="font-bold">Remark</td>
                            </tr>
                        </>
                    )}

                    {/* --- DATA TABLE HEADERS --- */}
                    <tr>
                        <td className="font-bold col-date" colSpan={isProtection ? 1 : 1}>Date</td>
                        <td className="font-bold col-vendor" colSpan={isProtection ? 1 : 1}>Vendor core No.</td>
                        <td className="font-bold col-internal" colSpan={isProtection ? 1 : 2}>Internal core No.</td>
                        {isProtection ? (
                            <td className="font-bold">Value (mA)</td>
                        ) : (
                            <>
                                <td className="font-bold">{testLimits.bsatGauss?.[0] || '1000'}</td>
                                <td className="font-bold">{testLimits.bsatGauss?.[1] || '3000'}</td>
                                <td className="font-bold">{testLimits.bsatGauss?.[2] || '5000'}</td>
                                <td className="font-bold">{testLimits.bsatGauss?.[3] || '7000'}</td>
                            </>
                        )}
                        <td className="font-bold col-remark">Remark</td>
                    </tr>

                    {/* --- DATA ROWS --- */}
                    {tableData && tableData.length > 0 ? (
                        tableData.map((test: any, index: number) => (
                            <tr key={index}>
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

                                <td className="font-bold bg-white">{test.result}</td>
                            </tr>
                        ))
                    ) : (
                        <tr className="h-10 text-center">
                            <td colSpan={isProtection ? 5 : 8} className="text-gray-500 italic">No detailed core test records available in Report Data.</td>
                        </tr>
                    )}

                    {/* Padding rows to ensure table takes up space nicely like the image */}
                    {Array.from({ length: Math.max(0, 15 - (tableData?.length || 0)) }).map((_, i) => (
                        <tr key={`pad-${i}`} className="h-6">
                            <td></td>
                            <td></td>
                            <td colSpan={isProtection ? 1 : 2}></td>
                            {isProtection ? (
                                <td></td>
                            ) : (
                                <><td></td><td></td><td></td><td></td></>
                            )}
                            <td></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="footer-sig">
                <div className="sig-box">
                    <div className="sig-title">Test by</div>
                    <div className="sig-name">{coreData.testedBy || 'Rahul Sharma'}</div>
                </div>
                <div className="sig-box">
                    <div className="sig-title">Authorised Signatory</div>
                    <div className="sig-name">Rahul Sharma</div>
                    <div className="sig-company">For Advent Engineers</div>
                </div>
            </div>
        </div>
    );
}

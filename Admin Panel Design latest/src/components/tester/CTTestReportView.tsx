import React from 'react';
import adventLogo from '../../assets/advent_logo.jpg';

interface CTTestReportViewProps {
    transformer: any;
    stage: 'secondary' | 'primary' | 'final';
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso?: string) {
    if (!iso) return new Date().toLocaleDateString('en-GB');
    return new Date(iso).toLocaleDateString('en-GB');
}

function val(v: any, fallback = '—') {
    if (v === null || v === undefined || String(v).trim() === '' || String(v) === '0') return fallback;
    return String(v);
}

function uniqueIds(arr: any[], field = 'internalCoreNo') {
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const item of arr) {
        const k = item[field];
        if (k && !seen.has(k)) { seen.add(k); ids.push(k); }
    }
    return ids;
}

// ─── Shared CSS ─────────────────────────────────────────────────────────────

const css = `
  .rpt { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #000; background: #fff; }
  /* master grid header */
  .rpt-master { width:100%; border-collapse:collapse; margin-bottom:18px; }
  .rpt-master td { border:1px solid #000; padding:5px 9px; vertical-align:middle; }
  .rpt-banner1 { text-align:center; font-weight:bold; font-size:1.55em; letter-spacing:.4px; }
  .rpt-banner2 { text-align:center; font-weight:bold; font-size:1.1em; text-decoration:underline; }
  .rpt-lbl  { font-weight:bold; text-align:right; width:16%; }
  .rpt-val  { text-align:left; width:30%; }
  .rpt-lbl2 { font-weight:bold; text-align:right; width:14%; }
  .rpt-val2 { text-align:left; width:28%; }
  .rpt-stage{ font-weight:bold; text-align:center; font-size:1.05em; }
  /* simple header (secondary) */
  .rpt-hdr { display:flex; align-items:center; border:1.5px solid #000; margin-bottom:0; }
  .rpt-hdr-logo { padding:6px 12px; border-right:1.5px solid #000; min-width:120px; display:flex; align-items:center; justify-content:center; }
  .rpt-hdr-logo img { max-height:60px; max-width:110px; object-fit:contain; }
  .rpt-hdr-center { flex:1; text-align:center; padding:6px; }
  .rpt-hdr-center h1 { margin:0 0 3px 0; font-size:1.35em; font-weight:bold; }
  .rpt-hdr-center h2 { margin:0; font-size:.95em; font-weight:normal; }
  .rpt-hdr-right { padding:6px 12px; border-left:1.5px solid #000; min-width:120px; text-align:right; white-space:nowrap; }
  .rpt-title-banner { border:1.5px solid #000; border-top:none; text-align:center; padding:5px; font-weight:bold; font-size:1.1em; text-transform:uppercase; margin-bottom:18px; }
  /* section banners */
  .rpt-sec { background:#f2f2f2; border:1px solid #000; padding:6px 10px; font-weight:bold; margin:16px 0 8px; font-size:.95em; }
  /* tables */
  table.dt { width:100%; border-collapse:collapse; margin-bottom:18px; font-size:.88em; }
  table.dt th, table.dt td { border:1px solid #000; padding:5px 7px; text-align:center; vertical-align:middle; }
  table.dt th { background:#f7f7f7; font-weight:bold; }
  .la { text-align:left; font-weight:bold; padding-left:8px; }
  .empty-msg { text-align:center; color:#999; font-style:italic; padding:14px; }
  /* core sub-header */
  .core-sub { background:#eef2ff; font-weight:bold; text-align:left; padding-left:10px; }
  /* footer */
  .rpt-footer { margin-top:28px; display:flex; justify-content:space-between; padding:0 40px; }
  .sig { text-align:center; width:200px; }
  .sig-line { border-top:1.5px solid #000; margin-top:50px; padding-top:5px; font-weight:bold; font-size:.95em; }
  @media print {
    @page { size: A4 portrait; margin: 10mm; }
    .no-print { display:none !important; }
  }
`;

// ─── Protection section ──────────────────────────────────────────────────────

function ProtectionSection({ results }: { results: any[] }) {
    const coreIds = uniqueIds(results);
    if (coreIds.length === 0) return null;
    return (
        <>
            {coreIds.map(coreId => {
                const rows = results.filter(r => r.internalCoreNo === coreId);
                return (
                    <table key={coreId} className="dt">
                        <thead>
                            <tr>
                                <th colSpan={7} className="core-sub" style={{ textAlign: 'left', paddingLeft: 10 }}>
                                    Protection Core No: {coreId}
                                </th>
                            </tr>
                            <tr>
                                <th style={{ width: '16%' }}>Core Ratio</th>
                                <th>Ratio Error @ 100% (%)</th>
                                <th>Phase Error (min)</th>
                                <th>Resistance (Ω)</th>
                                <th>ALF</th>
                                <th>Sec. Limiting Voltage (V)</th>
                                <th>Excitation Current (A)</th>
                                {/* composite error optional */}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length > 0 ? rows.map((r, i) => (
                                <tr key={i}>
                                    <td className="la">Ratio - {val(r.ratioValue || r.ratio)}</td>
                                    <td>{val(r.ratioError100)}</td>
                                    <td>{val(r.phaseError)}</td>
                                    <td>{val(r.resistance)}</td>
                                    <td>{val(r.alf)}</td>
                                    <td>{val(r.secondaryLimitingVoltage ?? r.secondaryLimitingVtg)}</td>
                                    <td>{val(r.excitationCurrent)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={7} className="empty-msg">No test data saved for this core</td></tr>
                            )}
                        </tbody>
                    </table>
                );
            })}
        </>
    );
}

// ─── Metering section ────────────────────────────────────────────────────────

function MeteringSection({ results }: { results: any[] }) {
    // results: [{ internalCoreNo, ratioValue, rows: [{current, r100, p100, r25, p25}], accuracyClass }]
    const coreIds = uniqueIds(results);
    if (coreIds.length === 0) return null;
    return (
        <>
            {coreIds.map(coreId => {
                const coreBlocks = results.filter(r => r.internalCoreNo === coreId);
                return (
                    <table key={coreId} className="dt">
                        <thead>
                            <tr>
                                <th colSpan={6} className="core-sub" style={{ textAlign: 'left', paddingLeft: 10 }}>
                                    Metering Core No: {coreId}
                                </th>
                            </tr>
                            <tr>
                                <th rowSpan={2} style={{ width: '16%' }}>Core Ratio</th>
                                <th rowSpan={2} style={{ width: '12%' }}>% of Primary<br />Current</th>
                                <th colSpan={2}>100% Burden</th>
                                <th colSpan={2}>25% Burden</th>
                            </tr>
                            <tr>
                                <th>Ratio Error (%)</th>
                                <th>Phase Error (min)</th>
                                <th>Ratio Error (%)</th>
                                <th>Phase Error (min)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coreBlocks.length > 0 ? coreBlocks.flatMap((block, bi) => {
                                const rows: any[] = block.rows || [];
                                return rows.map((row: any, ri: number) => (
                                    <tr key={`${bi}-${ri}`}>
                                        {ri === 0 && (
                                            <td rowSpan={rows.length} className="la">
                                                Ratio - {val(block.ratioValue)}
                                            </td>
                                        )}
                                        <td>{val(row.current)}</td>
                                        <td>{val(row.r100)}</td>
                                        <td>{val(row.p100)}</td>
                                        <td>{val(row.r25)}</td>
                                        <td>{val(row.p25)}</td>
                                    </tr>
                                ));
                            }) : (
                                <tr><td colSpan={6} className="empty-msg">No test data saved for this core</td></tr>
                            )}
                        </tbody>
                    </table>
                );
            })}
        </>
    );
}

// ─── PS section ──────────────────────────────────────────────────────────────

function PSSection({ results }: { results: any[] }) {
    const coreIds = uniqueIds(results);
    if (coreIds.length === 0) return null;
    return (
        <table className="dt">
            <thead>
                <tr>
                    <th style={{ width: '12%' }}>Core No.</th>
                    <th style={{ width: '18%' }}>PS Core Ratio</th>
                    <th>Turn Ratio Error @ 100% (%)</th>
                    <th>Resistance (Ω)</th>
                    <th>Vk (V)</th>
                    <th>Iex at Vk (mA)</th>
                    <th>Iex at 1.1Vk (mA)</th>
                </tr>
            </thead>
            <tbody>
                {coreIds.map(coreId => {
                    const rows = results.filter(r => r.internalCoreNo === coreId);
                    if (rows.length === 0) return (
                        <tr key={coreId}>
                            <td style={{ fontWeight: 'bold' }}>{coreId}</td>
                            <td colSpan={6} className="empty-msg">No data</td>
                        </tr>
                    );
                    return rows.map((row, ri) => (
                        <tr key={`${coreId}-${ri}`}>
                            {ri === 0 && <td rowSpan={rows.length} style={{ fontWeight: 'bold' }}>{coreId}</td>}
                            <td className="la">Ratio - {val(row.ratioValue || row.ratio)}</td>
                            <td>{val(row.turnRatioError)}</td>
                            <td>{val(row.resistance)}</td>
                            <td>{val(row.vkVal ?? row.vk)}</td>
                            <td>{val(row.iexVk)}</td>
                            <td>{val(row.iex11Vk)}</td>
                        </tr>
                    ));
                })}
            </tbody>
        </table>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const CTTestReportView = React.forwardRef<HTMLDivElement, CTTestReportViewProps>(
    ({ transformer, stage }, ref) => {
        const order = transformer?.orderId || transformer?.fullOrder || {};
        const stageKey = `${stage}_test`;
        const history = transformer?.testHistory?.[stageKey] || {};

        // ── Data arrays from saved history ────────────────────────────────
        const meteringResults: any[] = history.metering_results || [];
        const protectionResults: any[] = history.protection_results || [];
        const psResults: any[] = history.ps_results || [];

        const hasMet = meteringResults.length > 0;
        const hasProt = protectionResults.length > 0;
        const hasPS = psResults.length > 0;

        // ── Order-level metadata ──────────────────────────────────────────
        const jobNo = transformer?.jobId || order?.jobId || '—';
        const clientName = transformer?.clientName || order?.clientName || '—';
        const unitNo = transformer?.uniqueId || '—';

        const voltageRating = transformer?.voltageRating || order?.nominalSystemVoltage || order?.voltageRating || '—';
        const spec = voltageRating !== '—' ? `${voltageRating} KV CT` : (transformer?.voltageClass || '—');

        // CT Ratio
        const secCurr = order?.ratedSecondaryCurrent || '1';
        const ctRatio = (() => {
            if (Array.isArray(order?.ratio)) return order.ratio.map((r: string) => `${r}/${secCurr}A`).join(' - ');
            if (order?.ratio) return `${order.ratio}/${secCurr}A`;
            return transformer?.rating || '—';
        })();

        // Burden
        const burden = (() => {
            const b = order?.burden;
            if (!b) return '—';
            if (Array.isArray(b)) return b.map((x: any) => `${x}VA`).join('/');
            return `${String(b).replace(/VA/i, '').trim()} VA`;
        })();

        // Class
        const cls = (() => {
            const c = order?.accuracyClass;
            if (!c) return '—';
            if (Array.isArray(c)) return c.join('/');
            return String(c);
        })();

        const stc = order?.stc || transformer?.stc || '—';
        const testDate = fmtDate(history?.testDate || history?.updatedAt || transformer?.updatedAt);
        const tester = history?.tester || '—';

        // Vk for PS
        const psVk = order?.psVk || psResults[0]?.vkVal || psResults[0]?.vk || '';

        // Core IDs for grid header
        const meteringCoreIds = uniqueIds(meteringResults);
        const protectionCoreIds = uniqueIds(protectionResults);
        const psCoreIds = uniqueIds(psResults);

        // Stage labels
        const isSecondary = stage === 'secondary';
        const stageBanner = stage === 'primary' ? 'Pretest After Primary Winding'
            : stage === 'final' ? 'Final Testing'
            : '';

        let secNum = 0;
        const sn = () => ++secNum;

        return (
            <div ref={ref} className="rpt" style={{ padding: '18px 28px', background: '#fff', maxWidth: 960, margin: '0 auto' }}>
                <style>{css}</style>

                {/* ── HEADER ───────────────────────────────────────────── */}
                {isSecondary ? (
                    // Simple logo + centered title (like SecondaryReport.html)
                    <>
                        <div className="rpt-hdr">
                            <div className="rpt-hdr-logo">
                                <img src={adventLogo} alt="Advent Engineers" />
                            </div>
                            <div className="rpt-hdr-center">
                                <h1>ADVENT ENGINEERS</h1>
                                <h2>CURRENT TRANSFORMER TEST REPORT</h2>
                                <div style={{ fontSize: '.9em', marginTop: 3 }}>
                                    Specification: {spec} &nbsp;|&nbsp; CT Ratio: {ctRatio}
                                </div>
                            </div>
                            <div className="rpt-hdr-right">
                                <div><strong>Date:</strong> {testDate}</div>
                                <div><strong>Order No:</strong> {jobNo}</div>
                                <div><strong>Client:</strong> {clientName}</div>
                                <div><strong>Unit No:</strong> {unitNo}</div>
                                <div><strong>Class:</strong> {cls}</div>
                            </div>
                        </div>
                        <div className="rpt-title-banner">Metering &amp; Protection Core Test Report</div>
                    </>
                ) : (
                    // Grid master table (like afterPrimaryReport.html / FinalReport.html)
                    <table className="rpt-master">
                        <tbody>
                            <tr>
                                <td colSpan={2} rowSpan={7} style={{ width: '18%', verticalAlign: 'middle', textAlign: 'center', borderRight: '1px solid #000', padding: 6 }}>
                                    <img src={adventLogo} alt="Advent Engineers" style={{ maxHeight: 70, maxWidth: 120, objectFit: 'contain' }} />
                                </td>
                                <td colSpan={4} className="rpt-banner1">Routine Test</td>
                            </tr>
                            <tr>
                                <td colSpan={4} className="rpt-banner2">TESTING RECORD OF CURRENT TRANSFORMER</td>
                            </tr>
                            <tr>
                                <td className="rpt-lbl">Specification</td>
                                <td className="rpt-val">{spec}</td>
                                <td className="rpt-lbl2">Job No.</td>
                                <td className="rpt-val2">{jobNo}</td>
                            </tr>
                            <tr>
                                <td className="rpt-lbl">CT Ratio</td>
                                <td className="rpt-val">{ctRatio}</td>
                                <td className="rpt-lbl2">Core - M</td>
                                <td className="rpt-val2">{meteringCoreIds.join(', ') || '—'}</td>
                            </tr>
                            <tr>
                                <td className="rpt-lbl">Burden</td>
                                <td className="rpt-val">{burden}</td>
                                <td className="rpt-lbl2">Core - PS</td>
                                <td className="rpt-val2">{psCoreIds.join(', ') || '—'}</td>
                            </tr>
                            <tr>
                                <td className="rpt-lbl">Class</td>
                                <td className="rpt-val">{cls}</td>
                                <td className="rpt-lbl2">Core - P</td>
                                <td className="rpt-val2">{protectionCoreIds.join(', ') || '—'}</td>
                            </tr>
                            <tr>
                                <td className="rpt-lbl">STC</td>
                                <td className="rpt-val">{stc}</td>
                                <td className="rpt-lbl2">Client</td>
                                <td className="rpt-val2">{clientName}</td>
                            </tr>
                            {stageBanner && (
                                <tr>
                                    <td colSpan={4} className="rpt-stage">{stageBanner}</td>
                                    <td style={{ fontWeight: 'bold', textAlign: 'right', width: '8%' }}>Date:</td>
                                    <td style={{ width: '15%' }}>{testDate}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}

                {/* ── PROTECTION CORES ─────────────────────────────────── */}
                {hasProt && (
                    <>
                        <div className="rpt-sec">{sn()}. PROTECTION CORE TEST (100% Burden)</div>
                        <ProtectionSection results={protectionResults} />
                    </>
                )}

                {/* ── METERING CORES ───────────────────────────────────── */}
                {hasMet && (
                    <>
                        <div className="rpt-sec">{sn()}. METERING CORE ACCURACY TEST ({cls})</div>
                        <MeteringSection results={meteringResults} />
                    </>
                )}

                {/* ── PS CORES ─────────────────────────────────────────── */}
                {hasPS && (
                    <>
                        <div className="rpt-sec">
                            {sn()}. CLASS PS SPECIAL PROTECTION CORE TEST
                            {psVk ? ` (Vk: ${psVk}V)` : ''}
                        </div>
                        <PSSection results={psResults} />
                    </>
                )}

                {/* No data fallback */}
                {!hasProt && !hasMet && !hasPS && (
                    <div style={{ padding: 40, textAlign: 'center', color: '#aaa', border: '1px dashed #ccc', borderRadius: 4, marginTop: 16 }}>
                        No {stage} test data found for this transformer.
                        <div style={{ fontSize: '.85em', marginTop: 8 }}>
                            Data is populated after tester saves results in the {stage} testing stage.
                        </div>
                    </div>
                )}

                {/* ── FOOTER / SIGNATURES ──────────────────────────────── */}
                <div className="rpt-footer">
                    <div className="sig">
                        <div className="sig-line">
                            Tested By
                        </div>
                        <div style={{ marginTop: 4, fontWeight: 'bold', fontSize: '.95em' }}>{tester !== '—' ? tester : ''}</div>
                    </div>
                    <div className="sig">
                        <div className="sig-line">Authorised Signatory</div>
                        <div style={{ marginTop: 4, fontSize: '.85em', color: '#666', fontStyle: 'italic' }}>Stamp &amp; Signature</div>
                    </div>
                </div>
            </div>
        );
    }
);

CTTestReportView.displayName = 'CTTestReportView';

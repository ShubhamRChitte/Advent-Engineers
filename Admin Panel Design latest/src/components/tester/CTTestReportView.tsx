import React from 'react';
import adventLogo from '../../assets/advent_logo.jpg';
import {
  ReportHeader,
  ReportSectionTitle,
  CoreInformationBar,
  ReportSignatures,
  secondaryReportPrintStyles,
} from './SecondaryReportPrintLayout';

interface CTTestReportViewProps {
    transformer: any;
    stage: 'secondary' | 'primary' | 'final';
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso?: string) {
    if (!iso) return new Date().toLocaleDateString('en-GB');
    return new Date(iso).toLocaleDateString('en-GB');
}

function val(v: any, fallback = '-') {
    if (v === null || v === undefined || String(v).trim() === '') return fallback;
    if (v === 0 || v === '0') return '0';
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

// ─── Limits & Validation Engine ─────────────────────────────────────────────

function getMeteringLimits(cls: string, pct: string) {
    const cleanClass = String(cls || '').toUpperCase().trim();
    const cleanPct = String(pct || '').replace('%', '').trim();
    
    if (cleanClass.includes('0.1')) {
        if (cleanPct === '120' || cleanPct === '100') return { ratio: 0.1, phase: 5 };
        if (cleanPct === '20') return { ratio: 0.2, phase: 8 };
        if (cleanPct === '5') return { ratio: 0.4, phase: 15 };
    }
    if (cleanClass.includes('0.2S') || cleanClass.includes('0.2 S')) {
        if (cleanPct === '120' || cleanPct === '100') return { ratio: 0.2, phase: 10 };
        if (cleanPct === '20') return { ratio: 0.2, phase: 10 };
        if (cleanPct === '5') return { ratio: 0.35, phase: 15 };
        if (cleanPct === '1') return { ratio: 0.75, phase: 30 };
    }
    if (cleanClass.includes('0.2')) {
        if (cleanPct === '120' || cleanPct === '100') return { ratio: 0.2, phase: 10 };
        if (cleanPct === '20') return { ratio: 0.35, phase: 15 };
        if (cleanPct === '5') return { ratio: 0.75, phase: 30 };
    }
    if (cleanClass.includes('0.5S') || cleanClass.includes('0.5 S')) {
        if (cleanPct === '120' || cleanPct === '100') return { ratio: 0.5, phase: 30 };
        if (cleanPct === '20') return { ratio: 0.5, phase: 30 };
        if (cleanPct === '5') return { ratio: 0.75, phase: 45 };
        if (cleanPct === '1') return { ratio: 1.5, phase: 90 };
    }
    if (cleanClass.includes('0.5')) {
        if (cleanPct === '120' || cleanPct === '100') return { ratio: 0.5, phase: 30 };
        if (cleanPct === '20') return { ratio: 0.75, phase: 45 };
        if (cleanPct === '5') return { ratio: 1.5, phase: 90 };
    }
    if (cleanClass.includes('1.0') || cleanClass === '1') {
        if (cleanPct === '120' || cleanPct === '100') return { ratio: 1.0, phase: 60 };
        if (cleanPct === '20') return { ratio: 1.5, phase: 90 };
        if (cleanPct === '5') return { ratio: 3.0, phase: 180 };
    }
    // Default fallback to 0.1 limits
    if (cleanPct === '120' || cleanPct === '100') return { ratio: 0.1, phase: 5 };
    if (cleanPct === '20') return { ratio: 0.2, phase: 8 };
    if (cleanPct === '5') return { ratio: 0.4, phase: 15 };
    return null;
}

function checkPassFail(valStr: string, limitVal: number) {
    if (valStr === null || valStr === undefined || String(valStr).trim() === '') return null;
    const num = parseFloat(valStr);
    if (isNaN(num)) return null;
    return Math.abs(num) <= limitVal;
}

function getProtectionStatus(row: any, cls: string) {
    const cleanClass = String(cls || '').toUpperCase().trim();
    let ratioLimit = 1.0;
    let phaseLimit = 60;
    let compLimit = 5;
    
    if (cleanClass.includes('10P')) {
        ratioLimit = 3.0;
        phaseLimit = 999999;
        compLimit = 10;
    }
    
    const rErr = parseFloat(row.ratioError100);
    const pErr = parseFloat(row.phaseError);
    const cErr = parseFloat(row.compositeError);
    
    let hasData = false;
    let failed = false;
    
    if (!isNaN(rErr)) {
        hasData = true;
        if (Math.abs(rErr) > ratioLimit) failed = true;
    }
    if (!isNaN(pErr) && phaseLimit !== 999999) {
        hasData = true;
        if (Math.abs(pErr) > phaseLimit) failed = true;
    }
    if (!isNaN(cErr)) {
        hasData = true;
        if (Math.abs(cErr) > compLimit) failed = true;
    }
    
    if (!hasData) return '-';
    return failed ? 'FAIL' : 'PASS';
}

function getPSStatus(row: any) {
    const trErr = parseFloat(row.turnRatioError);
    let hasData = false;
    let failed = false;
    
    if (!isNaN(trErr)) {
        hasData = true;
        if (Math.abs(trErr) > 0.25) failed = true;
    }
    
    if (!hasData) return '-';
    return failed ? 'FAIL' : 'PASS';
}

// ─── Shared CSS ─────────────────────────────────────────────────────────────

export const ctReportViewStyles = `
  .rpt { font-family: 'Segoe UI', Roboto, Arial, sans-serif; font-size: 11px; color: #000; background: #fff; }
  
  /* Master grid header style overrides */
  .rpt-master { width:100%; border-collapse:collapse; margin-bottom:18px; }
  .rpt-master td { border:1px solid #000; padding:5px 9px; vertical-align:middle; }
  .rpt-banner1 { text-align:center; font-weight:bold; font-size:1.55em; letter-spacing:.4px; }
  .rpt-banner2 { text-align:center; font-weight:bold; font-size:1.1em; text-decoration:underline; }
  .rpt-lbl  { font-weight:bold; text-align:right; width:16%; }
  .rpt-val  { text-align:left; width:30%; }
  .rpt-lbl2 { font-weight:bold; text-align:right; width:14%; }
  .rpt-val2 { text-align:left; width:28%; }
  .rpt-stage{ font-weight:bold; text-align:center; font-size:1.05em; }
  
  /* Company Header Re-styling */
  .rpt-company-header {
    display: grid;
    grid-template-columns: 45mm 1fr;
    border: 2px solid #003a70;
    margin-bottom: 20px;
    border-radius: 4px;
    background: #fff;
  }
  
  .rpt-header-logo-container {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
    border-right: 1.5px solid #003a70;
  }
  
  .rpt-header-logo-container img {
    max-height: 55px;
    max-width: 130px;
    object-fit: contain;
  }
  
  .rpt-header-text-container {
    padding: 12px;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  .rpt-company-name {
    font-size: 22px;
    font-weight: 800;
    color: #003a70;
    margin: 0 0 2px 0;
    letter-spacing: 0.5px;
  }
  
  .rpt-company-sub {
    font-size: 9px;
    color: #4b5563;
    margin: 0 0 8px 0;
    line-height: 1.3;
    font-weight: 500;
  }
  
  .rpt-doc-title {
    font-size: 15px;
    font-weight: 850;
    color: #dc2626;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin: 0;
  }
  
  /* Section headers */
  .rpt-section-hdr {
    background: #003a70;
    color: #fff;
    font-size: 11px;
    font-weight: bold;
    text-transform: uppercase;
    padding: 6px 12px;
    margin: 20px 0 10px 0;
    border-radius: 3px;
    letter-spacing: 0.5px;
    text-align: center;
  }

  /* Polished Report Layout Styles */
  .rpt-summary-box {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    border: 2px solid #003a70;
    background-color: #f8fafc;
    margin-bottom: 20px;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .rpt-summary-item {
    border-right: 1px solid #cbd5e1;
    padding: 10px;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  .rpt-summary-item:last-child {
    border-right: none;
  }
  
  .rpt-summary-lbl {
    font-size: 9px;
    color: #64748b;
    text-transform: uppercase;
    font-weight: 700;
    margin-bottom: 4px;
    letter-spacing: 0.3px;
  }
  
  .rpt-summary-val {
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
  }
  
  .rpt-badge-pass {
    color: #15803d;
    background-color: #dcfce7;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
    display: inline-block;
  }
  
  .rpt-badge-fail {
    color: #b91c1c;
    background-color: #fee2e2;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
    display: inline-block;
  }
  
  .rpt-badge-pending {
    color: #b45309;
    background-color: #fef3c7;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
    display: inline-block;
  }
  
  /* Double Grid Layout for Info Sections */
  .rpt-grid-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-bottom: 20px;
  }
  
  .rpt-info-card {
    border: 1.5px solid #cbd5e1;
    border-radius: 4px;
    background: #fff;
    overflow: hidden;
  }
  
  .rpt-info-card-header {
    background: #003a70;
    color: #fff;
    font-weight: 700;
    padding: 6px 12px;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  
  .rpt-info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    padding: 10px;
    gap: 8px 12px;
  }
  
  .rpt-info-item {
    display: flex;
    flex-direction: column;
  }
  
  .rpt-info-lbl {
    font-size: 9px;
    color: #64748b;
    font-weight: 700;
    text-transform: uppercase;
    margin-bottom: 1px;
  }
  
  .rpt-info-val {
    font-size: 11px;
    color: #0f172a;
    font-weight: 600;
  }

  /* Applicable Limits table styling */
  .rpt-limits-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 5px;
  }
  
  .rpt-limits-table th, .rpt-limits-table td {
    border: 1px solid #cbd5e1;
    padding: 4px 6px;
    text-align: center;
    font-size: 9px;
  }
  
  .rpt-limits-table th {
    background-color: #f1f5f9;
    font-weight: bold;
    color: #334155;
  }

  /* tables styling */
  table.dt { width:100%; border-collapse:collapse; margin-bottom:18px; font-size:.9em; border: 1.5px solid #003a70; }
  table.dt th, table.dt td { border:1px solid #cbd5e1; padding:6px 8px; text-align:center; vertical-align:middle; }
  table.dt th { background:#f1f5f9; font-weight:700; color: #1e293b; border-bottom: 2px solid #003a70; }
  table.dt td { color: #0f172a; }
  .la { text-align:left; font-weight:bold; padding-left:8px; }
  .empty-msg { text-align:center; color:#64748b; font-style:italic; padding:14px; }
  
  /* Three Column Signatures */
  .rpt-signatures-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
    margin-top: 30px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  
  .rpt-signature-card {
    border: 1.5px solid #cbd5e1;
    border-radius: 4px;
    background: #f8fafc;
    padding: 12px;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 100px;
  }
  
  .rpt-signature-line {
    border-top: 1px dashed #64748b;
    margin-top: 30px;
    padding-top: 5px;
  }
  
  .rpt-signature-title {
    font-size: 11px;
    font-weight: 700;
    color: #003a70;
  }
  
  .rpt-signature-name {
    font-size: 10px;
    color: #334155;
    margin-top: 2px;
    font-weight: 600;
  }
  
  .rpt-signature-desg {
    font-size: 9px;
    color: #64748b;
    font-style: italic;
  }
  
  .rpt-signature-date {
    font-size: 9px;
    color: #94a3b8;
    margin-top: 2px;
  }
  
  @media print {
    @page { size: A4 portrait; margin: 10mm; }
    .no-print { display:none !important; }
    .rpt-company-header { border: 2px solid #000 !important; }
    .rpt-header-logo-container { border-right: 1.5px solid #000 !important; }
    .rpt-summary-box { border: 2px solid #000 !important; }
    .rpt-info-card { border: 1.5px solid #000 !important; }
    .rpt-info-card-header { background: #000 !important; color: #fff !important; }
    .rpt-section-hdr { background: #000 !important; color: #fff !important; }
    table.dt { border: 1.5px solid #000 !important; }
    table.dt th { border-bottom: 2px solid #000 !important; }
    .rpt-signature-title { color: #000 !important; }
  }
`;

// ─── Protection section ──────────────────────────────────────────────────────

function ProtectionSection({ results, accuracyClass }: { results: any[], accuracyClass: string }) {
    const coreIds = uniqueIds(results);
    if (coreIds.length === 0) return null;
    return (
        <div className="ae-section-container">
            {coreIds.map(coreId => {
                const rows = results.filter(r => r.internalCoreNo === coreId);
                return (
                    <div key={coreId} className="mb-4 last:mb-0">
                        <CoreInformationBar label="Protection Core No" value={coreId} />
                        <table className="dt secondary-report-table">
                            <thead>
                                <tr>
                                    <th>Core Ratio</th>
                                    <th>Ratio Error @ 100% (%)</th>
                                    <th>Phase Error (min)</th>
                                    <th>Resistance (Ω)</th>
                                    <th>ALF</th>
                                    <th>Sec. Limiting Voltage (V)</th>
                                    <th>Excitation Current (A)</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length > 0 ? rows.map((r, i) => {
                                    const status = getProtectionStatus(r, r.accuracyClass || accuracyClass);
                                    return (
                                        <tr key={i}>
                                            <td className="ae-ratio-cell">Ratio - {val(r.ratioValue || r.ratio)}</td>
                                            <td className="ae-value">{val(r.ratioError100)}</td>
                                            <td className="ae-value">{val(r.phaseError)}</td>
                                            <td className="ae-value">{val(r.resistance)}</td>
                                            <td className="ae-value">{val(r.alf)}</td>
                                            <td className="ae-value">{val(r.secondaryLimitingVoltage ?? r.secondaryLimitingVtg)}</td>
                                            <td className="ae-value">{val(r.excitationCurrent)}</td>
                                            <td className={`ae-value font-bold ${status === 'PASS' ? 'text-green-600' : status === 'FAIL' ? 'text-red-600' : ''}`}>{status}</td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan={8} className="empty-msg">No test data saved for this core</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Metering section ────────────────────────────────────────────────────────

function MeteringSection({ results, accuracyClass }: { results: any[], accuracyClass: string }) {
    const coreIds = uniqueIds(results);
    if (coreIds.length === 0) return null;
    return (
        <div className="ae-section-container">
            {coreIds.map(coreId => {
                const coreBlocks = results.filter(r => r.internalCoreNo === coreId);
                return (
                    <div key={coreId} className="mb-4 last:mb-0">
                        <CoreInformationBar label="Metering Core No" value={coreId} />
                        <table className="dt secondary-report-table">
                            <thead>
                                <tr>
                                    <th colSpan={2} rowSpan={2} style={{ width: '25%' }} className="text-center font-bold align-middle">
                                        % of Primary Current
                                    </th>
                                    <th colSpan={3} style={{ width: '37.5%' }}>100% Burden</th>
                                    <th colSpan={3} style={{ width: '37.5%' }}>25% Burden</th>
                                </tr>
                                <tr>
                                    <th>Ratio Error (%)</th>
                                    <th>Phase Error (min)</th>
                                    <th>Status</th>
                                    <th>Ratio Error (%)</th>
                                    <th>Phase Error (min)</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coreBlocks.length > 0 ? coreBlocks.flatMap((block, bi) => {
                                    const rows: any[] = block.rows || [];
                                    const blockClass = block.accuracyClass || accuracyClass;
                                    return rows.map((row: any, ri: number) => {
                                        const limits = getMeteringLimits(blockClass, row.current);
                                        
                                        let status100 = '-';
                                        if (limits) {
                                            const r100St = checkPassFail(row.r100, limits.ratio);
                                            const p100St = checkPassFail(row.p100, limits.phase);
                                            if (r100St === false || p100St === false) {
                                                status100 = 'FAIL';
                                            } else if (r100St === true || p100St === true) {
                                                status100 = 'PASS';
                                            }
                                        }

                                        let status25 = '-';
                                        if (limits) {
                                            const r25St = checkPassFail(row.r25, limits.ratio);
                                            const p25St = checkPassFail(row.p25, limits.phase);
                                            if (r25St === false || p25St === false) {
                                                status25 = 'FAIL';
                                            } else if (r25St === true || p25St === true) {
                                                status25 = 'PASS';
                                            }
                                        }

                                        return (
                                            <tr key={`${bi}-${ri}`}>
                                                {ri === 0 && (
                                                    <td rowSpan={rows.length} className="ae-ratio-cell font-bold" style={{ backgroundColor: '#fff' }}>
                                                        Ratio - {val(block.ratioValue)}
                                                    </td>
                                                )}
                                                <td className="ae-ratio-cell font-medium">{val(row.current)}</td>
                                                <td className="ae-value">{val(row.r100)}</td>
                                                <td className="ae-value">{val(row.p100)}</td>
                                                <td className={`ae-value font-bold ${status100 === 'PASS' ? 'text-green-600' : status100 === 'FAIL' ? 'text-red-600' : ''}`}>{status100}</td>
                                                <td className="ae-value">{val(row.r25)}</td>
                                                <td className="ae-value">{val(row.p25)}</td>
                                                <td className={`ae-value font-bold ${status25 === 'PASS' ? 'text-green-600' : status25 === 'FAIL' ? 'text-red-600' : ''}`}>{status25}</td>
                                            </tr>
                                        );
                                    });
                                }) : (
                                    <tr><td colSpan={8} className="empty-msg">No test data saved for this core</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                );
            })}
        </div>
    );
}

// ─── PS section ──────────────────────────────────────────────────────────────

function PSSection({ results }: { results: any[] }) {
    const coreIds = uniqueIds(results);
    if (coreIds.length === 0) return null;
    return (
        <div className="ae-section-container">
            {coreIds.map(coreId => {
                const rows = results.filter(r => r.internalCoreNo === coreId);
                return (
                    <div key={coreId} className="mb-4 last:mb-0">
                        <CoreInformationBar label="PS Core No" value={coreId} />
                        <table className="dt secondary-report-table">
                            <thead>
                                <tr>
                                    <th className="w-[110px]">PS Core Ratio</th>
                                    <th className="w-[140px]">Turn Ratio Error @ 100% (%)</th>
                                    <th className="w-[100px]">Resistance (Ω)</th>
                                    <th className="w-[100px]">Vk (V)</th>
                                    <th className="w-[110px]">Iex at Vk (mA)</th>
                                    <th className="w-[110px]">Iex at 1.1Vk (mA)</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="empty-msg">No data</td>
                                    </tr>
                                ) : (
                                    rows.map((row, ri) => {
                                        const status = getPSStatus(row);
                                        return (
                                            <tr key={`${coreId}-${ri}`}>
                                                <td className="ae-ratio-cell font-bold">Ratio - {val(row.ratioValue || row.ratio)}</td>
                                                <td className="ae-value">{val(row.turnRatioError)}</td>
                                                <td className="ae-value">{val(row.resistance)}</td>
                                                <td className="ae-value">{val(row.vkVal ?? row.vk)}</td>
                                                <td className="ae-value">{val(row.iexVk)}</td>
                                                <td className="ae-value">{val(row.iex11Vk)}</td>
                                                <td className={`ae-value font-bold ${status === 'PASS' ? 'text-green-600' : status === 'FAIL' ? 'text-red-600' : ''}`}>{status}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                );
            })}
        </div>
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
        const spec = voltageRating !== '—' ? `${voltageRating} KV` : (transformer?.voltageClass || '—');

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

        // Compute overall result
        let overallResult = 'PASS';
        let hasAnyTest = false;
        
        if (hasMet) {
            meteringResults.forEach(block => {
                const rows = block.rows || [];
                const blockClass = block.accuracyClass || cls;
                rows.forEach((row: any) => {
                    const lim = getMeteringLimits(blockClass, row.current);
                    if (lim) {
                        const r100St = checkPassFail(row.r100, lim.ratio);
                        const p100St = checkPassFail(row.p100, lim.phase);
                        if (r100St !== null || p100St !== null) {
                            hasAnyTest = true;
                            if (r100St === false || p100St === false) overallResult = 'FAIL';
                        }
                        const r25St = checkPassFail(row.r25, lim.ratio);
                        const p25St = checkPassFail(row.p25, lim.phase);
                        if (r25St !== null || p25St !== null) {
                            hasAnyTest = true;
                            if (r25St === false || p25St === false) overallResult = 'FAIL';
                        }
                    }
                });
            });
        }
        
        if (hasProt) {
            protectionResults.forEach(row => {
                const status = getProtectionStatus(row, row.accuracyClass || cls);
                if (status !== '-') {
                    hasAnyTest = true;
                    if (status === 'FAIL') overallResult = 'FAIL';
                }
            });
        }
        
        if (hasPS) {
            psResults.forEach(row => {
                const status = getPSStatus(row);
                if (status !== '-') {
                    hasAnyTest = true;
                    if (status === 'FAIL') overallResult = 'FAIL';
                }
            });
        }
        
        if (!hasAnyTest) overallResult = 'PENDING';

        const displayCoresList = [
            meteringCoreIds.length > 0 ? `Metering (M-${meteringCoreIds.join(',')})` : '',
            protectionCoreIds.length > 0 ? `Protection (P-${protectionCoreIds.join(',')})` : '',
            psCoreIds.length > 0 ? `PS (PS-${psCoreIds.join(',')})` : ''
        ].filter(Boolean).join(' | ') || '—';

        // Stage labels
        const isSecondary = stage === 'secondary';
        const stageTitleSuffix = stage === 'primary' ? ' - Pretest After Primary Winding'
            : stage === 'final' ? ' - Final Testing'
            : ' - Metering & Protection Core Test';

        let secNum = 0;
        const sn = () => ++secNum;

        // Placeholders and technical details
        const ambientTemp = '28 °C';
        const ratedFrequency = '50 Hz';
        const testEquipmentUsed = 'CT Analyzer (S/N: CTA-9021)';
        const calibrationValidity = 'Valid up to 14/03/2027';
        const testedAsPerStandard = 'IS 2705 / IEC 61869-2';
        const manufacturer = 'ADVENT ENGINEERS';
        const locationRef = 'Indoor / Outdoor Switchyard';
        const insulationLevel = spec.includes('33') ? '36/70/170 kV' : spec.includes('11') ? '12/28/75 kV' : '12/28/75 kV';

        return (
            <div ref={ref} id="secondary-printable-report" className="report-wrapper secondary-print-page secondary-report-wrapper rpt" style={{ margin: '0 auto' }}>
                <style>{secondaryReportPrintStyles}</style>
                <style>{ctReportViewStyles}</style>

                {/* ── COMPANY HEADER ────────────────────────────────────── */}
                <div className="rpt-company-header">
                    <div className="rpt-header-logo-container">
                        <img src={adventLogo} alt="Advent Logo" />
                    </div>
                    <div className="rpt-header-text-container">
                        <h1 className="rpt-company-name">ADVENT ENGINEERS</h1>
                        <p className="rpt-company-sub">
                            Plot No. 12, Sector 5, IMT Manesar, Gurugram, Haryana - 122050<br/>
                            Phone: +91-9871578368, +91-9810444304 | Email: info@adventengineers.com
                        </p>
                        <h2 className="rpt-doc-title">CURRENT TRANSFORMER TEST REPORT</h2>
                    </div>
                </div>

                {/* ── SUMMARY BOX ───────────────────────────────────────── */}
                <div className="rpt-summary-box">
                    <div className="rpt-summary-item">
                        <div className="rpt-summary-lbl">CT Ratio</div>
                        <div className="rpt-summary-val">{ctRatio}</div>
                    </div>
                    <div className="rpt-summary-item">
                        <div className="rpt-summary-lbl">Class</div>
                        <div className="rpt-summary-val">{cls}</div>
                    </div>
                    <div className="rpt-summary-item">
                        <div className="rpt-summary-lbl">Burden</div>
                        <div className="rpt-summary-val">{burden}</div>
                    </div>
                    <div className="rpt-summary-item" style={{ gridColumn: 'span 1' }}>
                        <div className="rpt-summary-lbl">Cores</div>
                        <div className="rpt-summary-val" style={{ fontSize: '10px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title={displayCoresList}>
                            {displayCoresList}
                        </div>
                    </div>
                    <div className="rpt-summary-item">
                        <div className="rpt-summary-lbl">Overall Result</div>
                        <div className="rpt-summary-val">
                            {overallResult === 'PASS' ? (
                                <span className="rpt-badge-pass">PASS</span>
                            ) : overallResult === 'FAIL' ? (
                                <span className="rpt-badge-fail">FAIL</span>
                            ) : (
                                <span className="rpt-badge-pending">PENDING</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── TECHNICAL METADATA GRIDS ─────────────────────────── */}
                <div className="rpt-grid-container">
                    {/* CT Identification Details */}
                    <div className="rpt-info-card">
                        <div className="rpt-info-card-header">CT Identification Details</div>
                        <div className="rpt-info-grid">
                            <div className="rpt-info-item">
                                <span className="rpt-info-lbl">Specification</span>
                                <span className="rpt-info-val">{spec}</span>
                            </div>
                            <div className="rpt-info-item">
                                <span className="rpt-info-lbl">CT Ratio</span>
                                <span className="rpt-info-val">{ctRatio}</span>
                            </div>
                            <div className="rpt-info-item">
                                <span className="rpt-info-lbl">Accuracy Class</span>
                                <span className="rpt-info-val">{cls}</span>
                            </div>
                            <div className="rpt-info-item">
                                <span className="rpt-info-lbl">Rated Burden</span>
                                <span className="rpt-info-val">{burden}</span>
                            </div>
                            <div className="rpt-info-item">
                                <span className="rpt-info-lbl">STC Rating</span>
                                <span className="rpt-info-val">{stc} kA / 1s</span>
                            </div>
                            <div className="rpt-info-item">
                                <span className="rpt-info-lbl">Manufacturer</span>
                                <span className="rpt-info-val">{manufacturer}</span>
                            </div>
                            <div className="rpt-info-item">
                                <span className="rpt-info-lbl">Serial Number</span>
                                <span className="rpt-info-val">{unitNo}</span>
                            </div>
                            <div className="rpt-info-item">
                                <span className="rpt-info-lbl">Insulation Level</span>
                                <span className="rpt-info-val">{insulationLevel}</span>
                            </div>
                            <div className="rpt-info-item">
                                <span className="rpt-info-lbl">Rated Frequency</span>
                                <span className="rpt-info-val">{ratedFrequency}</span>
                            </div>
                            <div className="rpt-info-item">
                                <span className="rpt-info-lbl">Location / Reference</span>
                                <span className="rpt-info-val">{locationRef}</span>
                            </div>
                        </div>
                    </div>

                    {/* Test Record Metadata */}
                    <div className="rpt-info-card">
                        <div className="rpt-info-card-header">Testing Record & Environmental Details</div>
                        <div className="rpt-info-grid">
                            <div className="rpt-info-item">
                                <span className="rpt-info-lbl">Test Date</span>
                                <span className="rpt-info-val">{testDate}</span>
                            </div>
                            <div className="rpt-info-item">
                                <span className="rpt-info-lbl">Order Number (Job ID)</span>
                                <span className="rpt-info-val">{jobNo}</span>
                            </div>
                            <div className="rpt-info-item">
                                <span className="rpt-info-lbl">Client Name</span>
                                <span className="rpt-info-val">{clientName}</span>
                            </div>
                            <div className="rpt-info-item">
                                <span className="rpt-info-lbl">Unit Number</span>
                                <span className="rpt-info-val">{unitNo}</span>
                            </div>
                            <div className="rpt-info-item">
                                <span className="rpt-info-lbl">Ambient Temperature</span>
                                <span className="rpt-info-val">{ambientTemp}</span>
                            </div>
                            <div className="rpt-info-item">
                                <span className="rpt-info-lbl">System Frequency</span>
                                <span className="rpt-info-val">{ratedFrequency}</span>
                            </div>
                            <div className="rpt-info-item" style={{ gridColumn: 'span 2' }}>
                                <span className="rpt-info-lbl">Test Equipment Used</span>
                                <span className="rpt-info-val">{testEquipmentUsed}</span>
                            </div>
                            <div className="rpt-info-item">
                                <span className="rpt-info-lbl">Calibration Validity</span>
                                <span className="rpt-info-val">{calibrationValidity}</span>
                            </div>
                            <div className="rpt-info-item">
                                <span className="rpt-info-lbl">Tested As Per Standard</span>
                                <span className="rpt-info-val">{testedAsPerStandard}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── APPLICABLE LIMITS SECTION ──────────────────────────── */}
                <div className="rpt-info-card mb-4">
                    <div className="rpt-info-card-header">Applicable Limits & Tolerances (Class 0.1 CT Testing)</div>
                    <div style={{ padding: '8px 12px' }}>
                        <table className="rpt-limits-table">
                            <thead>
                                <tr>
                                    <th>Primary Current Level</th>
                                    <th>Ratio Error (± %)</th>
                                    <th>Phase Displacement (± Minutes)</th>
                                    <th>Reference Standards</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>120%</strong></td>
                                    <td>0.1 %</td>
                                    <td>5 min</td>
                                    <td rowSpan={4} style={{ verticalAlign: 'middle', fontWeight: 600 }}>IS 2705 (Part 2) / IEC 61869-2</td>
                                </tr>
                                <tr>
                                    <td><strong>100%</strong></td>
                                    <td>0.1 %</td>
                                    <td>5 min</td>
                                </tr>
                                <tr>
                                    <td><strong>20%</strong></td>
                                    <td>0.2 %</td>
                                    <td>8 min</td>
                                </tr>
                                <tr>
                                    <td><strong>5%</strong></td>
                                    <td>0.4 %</td>
                                    <td>15 min</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── PROTECTION CORES ─────────────────────────────────── */}
                {hasProt && (
                    <>
                        <div className="rpt-section-hdr">{sn()}. PROTECTION CORE TEST</div>
                        <ProtectionSection results={protectionResults} accuracyClass={cls} />
                    </>
                )}

                {/* ── METERING CORES ───────────────────────────────────── */}
                {hasMet && (
                    <>
                        <div className="rpt-section-hdr">{sn()}. METERING CORE ACCURACY TEST ({cls})</div>
                        <MeteringSection results={meteringResults} accuracyClass={cls} />
                    </>
                )}

                {/* ── PS CORES ─────────────────────────────────────────── */}
                {hasPS && (
                    <>
                        <div className="rpt-section-hdr">{sn()}. CLASS PS SPECIAL PROTECTION CORE TEST {psVk ? `(Vk: ${psVk}V)` : ''}</div>
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

                {/* ── FORMAL THREE-COLUMN SIGNATURE SECTION ────────────────── */}
                <div className="rpt-signatures-grid">
                    <div className="rpt-signature-card">
                        <div className="rpt-signature-title">TESTED BY</div>
                        <div className="rpt-signature-line" />
                        <div className="rpt-signature-name">{tester !== '—' ? tester : 'Testing Engineer'}</div>
                        <div className="rpt-signature-desg">Testing Engineer</div>
                        <div className="rpt-signature-date">Date: {testDate}</div>
                    </div>
                    <div className="rpt-signature-card">
                        <div className="rpt-signature-title">CHECKED BY</div>
                        <div className="rpt-signature-line" />
                        <div className="rpt-signature-name">Verified Administrator</div>
                        <div className="rpt-signature-desg">Quality Engineer</div>
                        <div className="rpt-signature-date">Date: {testDate}</div>
                    </div>
                    <div className="rpt-signature-card">
                        <div className="rpt-signature-title">AUTHORIZED SIGNATORY</div>
                        <div className="rpt-signature-line" />
                        <div className="rpt-signature-name">ADVENT Rep Representative</div>
                        <div className="rpt-signature-desg">Head of Quality</div>
                        <div className="rpt-signature-date">Date: {testDate}</div>
                    </div>
                </div>
            </div>
        );
    }
);

CTTestReportView.displayName = 'CTTestReportView';

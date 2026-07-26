import React from 'react';

interface PTFinalPrintableReportProps {
  order: any;
  transformer: any;
  reportData: any;
  pretestData: any;
  activeCores: string[];
  user: any;
  isReadOnly?: boolean;
  onChange?: (section: 'finalTesting', field: string, value: string) => void;
  onAccuracyChange?: (core: string, perc: string, field: string, value: string) => void;
  accuracyValidations?: any;
  preTestValidations?: any;
  printRef: React.RefObject<HTMLDivElement>;
}

const STYLE = `
  @media screen {
    .no-print-scroll {
      width: 100%;
      overflow-x: auto;
      background: #f9fafb;
      padding: 16px 0;
      display: flex;
      justify-content: flex-start;
    }
    @media (min-width: 830px) {
      .no-print-scroll {
        justify-content: center;
      }
    }
  }

  .pt-report-wrapper {
    background: #fff;
    width: 210mm;
    min-height: auto;
    padding: 10mm 15mm;
    margin: 0 auto;
    color: #000;
    font-family: 'Segoe UI', Roboto, Arial, sans-serif;
    font-size: 11px;
    box-sizing: border-box;
  }

  @media screen {
    .pt-report-wrapper {
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
      border-radius: 4px;
      margin-bottom: 20px;
      border: 1px solid #cbd5e1;
    }
  }

  .pf-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    margin-bottom: 4px;
    border: 1.5px solid #003a70;
  }

  .pf-table th, .pf-table td {
    border: 1px solid #cbd5e1;
    padding: 6px 8px;
    vertical-align: middle;
    word-break: break-word;
    color: #0f172a;
  }

  .pf-section-header {
    text-align: center;
    font-weight: bold;
    background: #003a70;
    color: #fff;
    border: 1.5px solid #003a70;
    border-bottom: none;
    padding: 6px;
    font-size: 11px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    border-radius: 3px 3px 0 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .pf-section-wrapper {
    margin-bottom: 12px;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .pf-header-title {
    text-align: center;
    border-bottom: 2px solid #003a70;
    padding-bottom: 6px;
    margin-bottom: 10px;
  }

  .pf-header-title h1 {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #003a70;
    margin: 0 0 4px 0;
  }

  .pf-header-title h2 {
    font-size: 15px;
    font-weight: 850;
    text-transform: uppercase;
    color: #dc2626;
    letter-spacing: 0.8px;
    margin: 0;
  }

  .pf-serial-row {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
    background: #f8fafc;
    border: 2px solid #003a70;
    border-radius: 4px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .pf-serial-row td {
    padding: 6px 10px;
    font-weight: bold;
    font-size: 12px;
    border: none;
    color: #0f172a;
  }

  .pf-serial-row td span {
    font-weight: normal;
    border-bottom: 1px solid #64748b;
    display: inline-block;
    min-width: 120px;
    padding: 0 2px;
  }

  .pf-bg-header {
    background: #f1f5f9;
    font-weight: 700;
    text-align: center;
    color: #1e293b;
    border-bottom: 2px solid #003a70 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .pf-text-center { text-align: center; }
  .pf-text-right  { text-align: right; }
  .pf-pass { color: #15803d; font-weight: bold; }
  .pf-fail { color: #b91c1c; font-weight: bold; }

  .pf-footer {
    width: 100%;
    border-collapse: collapse;
    border: 1.5px solid #003a70;
    background: #f8fafc;
    margin-top: 10px;
    font-size: 11px;
    page-break-inside: avoid;
    break-inside: avoid;
    border-radius: 4px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .pf-footer td {
    padding: 6px 10px;
    vertical-align: bottom;
    border: none;
    width: 50%;
    color: #0f172a;
  }

  .pf-table input,
  .pf-footer input,
  .pf-serial-row input {
    width: 100%;
    height: 28px;
    padding: 2px 6px;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    outline: 0;
    background: #ffffff;
    color: #1f2937;
    font-size: 12px;
    font-weight: 500;
    font-family: 'Segoe UI', Roboto, Arial, sans-serif;
    text-align: center;
    transition: all 0.15s ease-in-out;
    box-sizing: border-box;
  }

  .pf-table input:focus {
    background: #ffffff;
    border-color: #003a70;
    box-shadow: 0 0 0 2px rgba(0, 58, 112, 0.15);
  }

  .pf-table input.pt-input-error {
    color: #b91c1c !important;
    font-weight: bold !important;
    border-color: #ef4444 !important;
    background: #fff5f5 !important;
  }

  .pf-table input.pt-input-ok {
    color: #1d4ed8 !important;
  }

  .pf-table input:disabled {
    background: #f8fafc;
    border-color: #e2e8f0;
    color: #0f172a;
  }

  @media print {
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    html,
    body {
      background: #ffffff !important;
      width: 100% !important;
      min-height: auto;
      margin: 0 !important;
      padding: 0 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    @page {
      size: A4 portrait;
      margin: 10mm;
    }

    .print-container {
      position: relative !important;
      width: 100% !important;
      max-width: 100% !important;
      min-height: auto;
      margin: 0 auto !important;
      padding: 0 !important;
      background: #ffffff !important;
      box-shadow: none !important;
      overflow: visible !important;
    }

    .pt-report-wrapper {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      padding: 0 !important;
      box-sizing: border-box;
      overflow: visible !important;
      border: none !important;
      box-shadow: none !important;
    }

    .no-print,
    .screen-only {
      display: none !important;
    }

    .no-print-scroll {
      overflow: visible !important;
    }

    .pf-section-wrapper,
    .pf-table,
    .pf-footer,
    tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    .pf-section-header {
      background: #003a70 !important;
      color: #fff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .pf-bg-header {
      background: #f1f5f9 !important;
    }

    .pf-serial-row {
      border: 2px solid #000 !important;
    }

    .pf-table {
      border: 1.5px solid #000 !important;
    }

    .pf-table th, .pf-table td {
      border: 1px solid #000 !important;
    }

    .pf-footer {
      border: 1.5px solid #000 !important;
    }

    .pf-table input,
    .pf-footer input,
    .pf-serial-row input {
      -webkit-appearance: none !important;
      appearance: none !important;
      border: none !important;
      outline: none !important;
      background: transparent !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      padding: 0 !important;
      margin: 0 !important;
      color: inherit !important;
    }
  }
`;

export function PTFinalPrintableReport({
  order,
  transformer,
  reportData,
  pretestData,
  activeCores,
  user,
  isReadOnly = true,
  onChange,
  onAccuracyChange,
  accuracyValidations = {},
  preTestValidations = {},
  printRef
}: PTFinalPrintableReportProps) {

  const finalTesting = reportData?.finalTesting || {};
  const accuracyTest = reportData?.accuracyTest || {};

  const accuracyClassDisplay = (() => {
    const cores = order?.coreDetails || order?.coreConfigs || [];
    const fallback = order?.accuracyClass || '0.2';

    if (!Array.isArray(cores) || cores.length === 0) return fallback;

    const classStrings: string[] = [];

    const normalize = (v: unknown) => {
      if (v === null || v === undefined) return '';
      const s = String(v).trim();
      if (!s || s.toLowerCase() === 'n/a') return '';
      return s;
    };

    cores.forEach((core: any) => {
      let coreClass = normalize(core?.accuracyClass);
      const typeLc = String(core?.coreType || '').toLowerCase();

      if (!coreClass && typeLc.includes('meter')) coreClass = normalize(fallback);
      
      if (coreClass) {
        classStrings.push(coreClass);
      }
    });

    if (classStrings.length === 0) return fallback;

    return classStrings.join(' / ');
  })();

  const ptRatioDisplay = (() => {
    const params = order?.parameters || {};
    const primaryV = order?.ratedPrimaryVoltage || params.ratedPrimaryVoltage;
    const secondaryV = order?.ratedSecondaryVoltage || params.ratedSecondaryVoltage;
    const coresCount = parseInt(order?.noOfCores || order?.numberOfCores || '1');

    if (!primaryV || !secondaryV) return order?.ratio?.[0] || 'N/A';

    const ratioParts = [primaryV];
    for (let i = 0; i < coresCount; i++) {
      ratioParts.push(secondaryV);
    }

    return ratioParts.join(' / ');
  })();

  const burdenDisplay = (() => {
    const b = order?.burden;
    if (Array.isArray(b)) return b.join(' / ');
    return b || 'N/A';
  })();

  const getCoreLabel = (core: string) => {
    const num = core.replace(/[a-z]/gi, '');
    const suffix = num === '1' || num === '' ? '' : ` ${num}`;
    if (core.startsWith('protection')) return `Protection${suffix}`;
    if (core.startsWith('metering')) return `Metering`;
    if (core.startsWith('ps')) return `PS${suffix}`;
    return core;
  };

  const finalRows = [
    { id: 1,  label: 'Leakage',                          field: 'leakage' },
    { id: 2,  label: 'Terminal Marking',                  field: 'terminalMarking' },
    { id: 3,  label: 'Polarity Testing',                  field: 'polarityTesting' },
    { id: 4,  label: 'Insulation Resistance Test',        field: 'insulationResistance' },
    { id: 5,  label: 'Primary to Secondary',              field: 'primaryToSecondary' },
    { id: 6,  label: 'Primary to Earth',                  field: 'primaryToEarth' },
    { id: 7,  label: 'Secondary to Earth',                field: 'secondaryToEarth' },
    { id: 9,  label: 'H.V.Test on Secondary Winding',     field: 'hvSecondary' },
    { id: 10, label: 'H.V.Test on Primary Winding',       field: 'hvPrimary' },
    { id: 11, label: 'Induced Over Voltage Test',         field: 'inducedOverVoltage' },
  ];

  return (
    <>
      <style>{STYLE}</style>
      <div
        id="printable-report"
        ref={printRef}
        className="pt-report-wrapper"
      >

        {/* ── HEADER ─────────────────────────────────────────── */}
        <div className="pf-header-title">
          <h1>ADVENT ENGINEERS</h1>
          <h2>Testing Record of Potential Transformer</h2>
        </div>

        {/* Serial No / Date row */}
        <table className="pf-serial-row">
          <colgroup>
            <col style={{ width: '70%' }} />
            <col style={{ width: '30%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td>
                SERIAL NO. :&nbsp;
                <span>{transformer?.uniqueId || 'N/A'}</span>
              </td>
              <td style={{ textAlign: 'right' }}>
                Date :&nbsp;
                <span style={{ minWidth: '80px', textAlign: 'center' }}>{reportData?.date || new Date().toLocaleDateString('en-GB')}</span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── SPECIFICATION ───────────────────────────────────── */}
        <div className="pf-section-wrapper">
          <table className="pf-table">
            <colgroup>
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td style={{ width: '25%', fontWeight: 'bold' }}>Specification</td>
                <td style={{ width: '25%', background: '#fafafa' }}>{order?.voltageRating || '11'} KV PT</td>
                <td style={{ width: '25%', fontWeight: 'bold' }}>Type 1</td>
                <td style={{ width: '25%', background: '#fafafa' }}>{order?.indoorOutdoor || 'N/A'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>PT Ratio</td>
                <td style={{ background: '#fafafa' }}>{ptRatioDisplay}</td>
                <td style={{ fontWeight: 'bold' }}>Type 2</td>
                <td style={{ background: '#fafafa' }}>{order?.insulationType || 'N/A'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>Burden</td>
                <td style={{ background: '#fafafa' }}>{burdenDisplay} VA</td>
                <td style={{ fontWeight: 'bold' }}>Class</td>
                <td style={{ background: '#fafafa' }}>{accuracyClassDisplay}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>Voltage Factor</td>
                <td style={{ background: '#fafafa' }}>1.2 Cont. &amp; 1.5 for 30 Sec</td>
                <td style={{ fontWeight: 'bold' }}>Job No.</td>
                <td style={{ background: '#fafafa' }}>{order?.jobId || 'N/A'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── PRE TESTING ────────────────────────────────────── */}
        <div className="pf-section-wrapper">
          <div className="pf-section-header">Pre Testing</div>
          <table className="pf-table" style={{ marginBottom: 0 }}>
            <colgroup>
              <col style={{ width: '30%' }} />
              <col style={{ width: '17.5%' }} />
              <col style={{ width: '17.5%' }} />
              <col style={{ width: '17.5%' }} />
              <col style={{ width: '17.5%' }} />
            </colgroup>
            <thead>
              <tr>
                <td className="pf-bg-header" rowSpan={2}>% of Primary Current</td>
                <td className="pf-bg-header" colSpan={2}>100% Burden</td>
                <td className="pf-bg-header" colSpan={2}>25% Burden</td>
              </tr>
              <tr>
                <td className="pf-bg-header">Ratio Error (%)</td>
                <td className="pf-bg-header">Phase Error (min)</td>
                <td className="pf-bg-header">Ratio Error (%)</td>
                <td className="pf-bg-header">Phase Error (min)</td>
              </tr>
            </thead>
            <tbody>
              {activeCores.map((core) => {
                const label = getCoreLabel(core);
                const pre = pretestData?.[core] || reportData?.preTesting?.[core] || {};
                return (
                  <tr key={core}>
                    <td style={{ fontWeight: 'bold', background: '#fafafa' }}>{label} 30%</td>
                    <td className="pf-text-center">{pre.ratioError100 || ''}</td>
                    <td className="pf-text-center">{pre.phaseError100 || ''}</td>
                    <td className="pf-text-center">{pre.ratioError25 || ''}</td>
                    <td className="pf-text-center">{pre.phaseError25 || ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* Pretester name */}
          <div style={{ borderTop: '1.5px solid #003a70', borderLeft: '1.5px solid #003a70', borderRight: '1.5px solid #003a70', borderBottom: '1.5px solid #003a70', padding: '8px 12px', fontSize: 12, background: '#f8fafc', display: 'flex', alignItems: 'center' }}>
            <strong>Tested By (Pretester):</strong>&nbsp;
            <span style={{ borderBottom: '1px solid #555', minWidth: 120, display: 'inline-block', padding: '0 4px', fontSize: '13px', fontWeight: 'bold', color: '#003a70' }}>
              {reportData?.preTesting?.testedBy || pretestData?.testedBy || ''}
            </span>
          </div>
        </div>

        {/* ── FINAL TESTING ───────────────────────────────────── */}
        <div className="pf-section-wrapper">
          <div className="pf-section-header">Final Testing</div>
          <table className="pf-table" style={{ marginBottom: 0 }}>
            <colgroup>
              <col style={{ width: '8%' }} />
              <col style={{ width: '60%' }} />
              <col style={{ width: '32%' }} />
            </colgroup>
            <thead>
              <tr>
                <th className="pf-bg-header">Sr No.</th>
                <th className="pf-bg-header">Parameters</th>
                <th className="pf-bg-header">Readings</th>
              </tr>
            </thead>
            <tbody>
              {finalRows.map((row) => (
                <tr key={row.id}>
                  <td className="pf-text-center">{row.id}</td>
                  <td style={{ paddingLeft: 12, textAlign: 'left' }}>{row.label}</td>
                  <td className="pf-text-center" style={{ padding: 0 }}>
                    {isReadOnly ? (
                      <span className={['OK', '10 GΩ'].includes(finalTesting[row.field]) ? 'text-blue-600 font-medium' : ''}>
                        {finalTesting[row.field] || ''}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={finalTesting[row.field] || ''}
                        onChange={(e) => onChange?.('finalTesting', row.field, e.target.value)}
                        className={['OK', '10 GΩ'].includes(finalTesting[row.field]) ? 'text-blue-600' : ''}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── ACCURACY TESTING ────────────────────────────────── */}
        <div className="pf-section-wrapper">
          <div className="pf-section-header">Accuracy Test</div>
          <table className="pf-table" style={{ marginBottom: 0 }}>
            <colgroup>
              <col style={{ width: '16%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '17.5%' }} />
              <col style={{ width: '17.5%' }} />
              <col style={{ width: '17.5%' }} />
              <col style={{ width: '17.5%' }} />
            </colgroup>
            <thead>
              <tr>
                <td className="pf-bg-header" rowSpan={2}>Core</td>
                <td className="pf-bg-header" rowSpan={2}>% of Primary<br />Current</td>
                <td className="pf-bg-header" colSpan={2}>100% Burden</td>
                <td className="pf-bg-header" colSpan={2}>25% Burden</td>
              </tr>
              <tr>
                <td className="pf-bg-header">Ratio Error (%)</td>
                <td className="pf-bg-header">Phase Error (min)</td>
                <td className="pf-bg-header">Ratio Error (%)</td>
                <td className="pf-bg-header">Phase Error (min)</td>
              </tr>
            </thead>
            <tbody>
              {activeCores.map((core) => {
                const isProtection = core.startsWith('protection');
                const percentages = isProtection ? ['100'] : ['120', '100', '80'];
                const coreLabel = getCoreLabel(core);

                return percentages.map((perc, idx) => {
                  const acc = accuracyTest?.[core]?.[perc] || {};
                  const val100 = accuracyValidations[core]?.[perc]?.val100 || { isPass: null, reason: null };
                  const val25 = accuracyValidations[core]?.[perc]?.val25 || { isPass: null, reason: null };

                  return (
                    <tr key={`${core}-${perc}`}>
                      {idx === 0 && (
                        <td
                          style={{ fontWeight: 'bold', textAlign: 'center', background: '#f1f5f9', textTransform: 'uppercase', verticalAlign: 'middle' }}
                          rowSpan={percentages.length}
                        >
                          {coreLabel}
                        </td>
                      )}
                      <td className="pf-text-center relative" style={{ background: '#fafafa', fontWeight: 600 }}>
                        {perc}%
                      </td>
                      <td className="pf-text-center" style={{ padding: 0 }}>
                        {isReadOnly ? (
                          <span className={val100.isPass === false && val100.reason?.includes('Ratio') ? 'text-red-700 font-bold' : 'text-blue-600 font-medium'}>
                            {acc.ratioError100 || ''}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={acc.ratioError100 || ''}
                            onChange={(e) => onAccuracyChange?.(core, perc, 'ratioError100', e.target.value)}
                            className={val100.isPass === false && val100.reason?.includes('Ratio') ? 'pt-input-error' : 'pt-input-ok'}
                          />
                        )}
                      </td>
                      <td className="pf-text-center" style={{ padding: 0 }}>
                        {isReadOnly ? (
                          <span className={val100.isPass === false && val100.reason?.includes('Phase') ? 'text-red-700 font-bold' : 'text-blue-600 font-medium'}>
                            {acc.phaseError100 || ''}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={acc.phaseError100 || ''}
                            onChange={(e) => onAccuracyChange?.(core, perc, 'phaseError100', e.target.value)}
                            className={val100.isPass === false && val100.reason?.includes('Phase') ? 'pt-input-error' : 'pt-input-ok'}
                          />
                        )}
                      </td>
                      <td className="pf-text-center" style={{ padding: 0 }}>
                        {isReadOnly ? (
                          <span className={val25.isPass === false && val25.reason?.includes('Ratio') ? 'text-red-700 font-bold' : 'text-blue-600 font-medium'}>
                            {acc.ratioError25 || ''}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={acc.ratioError25 || ''}
                            onChange={(e) => onAccuracyChange?.(core, perc, 'ratioError25', e.target.value)}
                            className={val25.isPass === false && val25.reason?.includes('Ratio') ? 'pt-input-error' : 'pt-input-ok'}
                          />
                        )}
                      </td>
                      <td className="pf-text-center" style={{ padding: 0 }}>
                        {isReadOnly ? (
                          <span className={val25.isPass === false && val25.reason?.includes('Phase') ? 'text-red-700 font-bold' : 'text-blue-600 font-medium'}>
                            {acc.phaseError25 || ''}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={acc.phaseError25 || ''}
                            onChange={(e) => onAccuracyChange?.(core, perc, 'phaseError25', e.target.value)}
                            className={val25.isPass === false && val25.reason?.includes('Phase') ? 'pt-input-error' : 'pt-input-ok'}
                          />
                        )}
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>

        {/* ── FOOTER ── */}
        <table className="pf-footer">
          <colgroup>
            <col style={{ width: '50%' }} />
            <col style={{ width: '50%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td style={{ textAlign: 'left' }}>
                <strong>Tested By:</strong><br />
                {isReadOnly ? (
                  <span style={{ borderBottom: '1px solid #000', minWidth: 160, display: 'inline-block', paddingBottom: 2, marginTop: 6, fontSize: '13px', fontWeight: 'bold', color: '#003a70', fontStyle: 'italic' }}>
                    {reportData?.testedBy || user?.name || user?.fullName || ''}
                  </span>
                ) : (
                  <input
                    type="text"
                    value={reportData?.testedBy || user?.name || user?.fullName || ''}
                    onChange={(e) => onChange?.('finalTesting' as any, 'testedBy', e.target.value)}
                    style={{ borderBottom: '1px solid #cbd5e1', minWidth: 160, display: 'inline-block', marginTop: 6, fontSize: '13px', fontWeight: 'bold', color: '#003a70', fontStyle: 'italic', background: 'transparent', borderLeft: 'none', borderRight: 'none', borderTop: 'none', textAlign: 'left', outline: 'none' }}
                  />
                )}
                <br />
                <span style={{ fontSize: 9, color: '#555' }}>PT Testing Engineer</span>
              </td>
              <td style={{ textAlign: 'right' }}>
                <strong>Signature:</strong><br />
                <span style={{ borderBottom: '1px solid #000', minWidth: 160, height: 28, display: 'inline-block', marginTop: 6 }}></span><br />
                <span style={{ fontSize: 9, color: '#555' }}>Authorized Signatory</span>
              </td>
            </tr>
          </tbody>
        </table>

      </div>
    </>
  );
}

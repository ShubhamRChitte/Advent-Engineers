import React from 'react';

interface PTFinalPrintReportProps {
  order: any;
  transformer: any;
  reportData: any;
  pretestData: any;
  activeCores: string[];
  user: any;
}

const STYLE = `
  @page {
    size: A4 portrait;
    /* Setting all margins to 0 removes browser headers/footers */
    margin: 0;
  }

  @media print {
    html, body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      margin: 0;
      padding: 0;
    }

    /* Bring the print wrapper back on-screen */
    .pt-print-wrapper {
      position: static !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      overflow: visible !important;
    }

    /* Add page margins via padding on the root (since @page margin is 0) */
    .pt-final-print-root {
      padding: 6mm 10mm !important;
    }

    /* Hide interactive UI */
    .screen-only { display: none !important; }
    .no-print { display: none !important; }
  }

  .pt-final-print-root {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11px;
    color: #000;
    background: #fff;
    width: 210mm;
    margin: 0 auto;
    padding: 10px;
    box-sizing: border-box;
  }

  @media print {
    body { margin: 0; }
    .pt-final-print-root { padding: 6mm 10mm !important; }
    .pf-table { page-break-inside: avoid; }
    .pf-section-wrapper { page-break-inside: avoid; }
  }

  .pf-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    margin-bottom: 2px;
  }

  .pf-table th, .pf-table td {
    border: 1px solid #000;
    padding: 3px 5px;
    vertical-align: middle;
    word-break: break-word;
  }

  .pf-section-header {
    text-align: center;
    font-weight: bold;
    background: #e8e8e8;
    border: 1px solid #000;
    border-bottom: none;
    padding: 4px;
    font-size: 11px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .pf-section-wrapper {
    margin-bottom: 6px;
    page-break-inside: avoid;
  }

  .pf-header-title {
    text-align: center;
    border-bottom: 1.5px solid #000;
    padding-bottom: 4px;
    margin-bottom: 6px;
  }

  .pf-header-title h1 {
    font-size: 17px;
    font-weight: 900;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #003a70;
    margin: 0 0 2px 0;
  }

  .pf-header-title h2 {
    font-size: 11px;
    font-weight: bold;
    text-transform: uppercase;
    margin: 0;
  }

  .pf-serial-row {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 6px;
    background: #f5f5f5;
    border: 1px solid #000;
  }

  .pf-serial-row td {
    padding: 4px 8px;
    font-weight: bold;
    font-size: 11px;
    border: none;
  }

  .pf-serial-row td span {
    font-weight: normal;
    border-bottom: 1px solid #555;
    display: inline-block;
    min-width: 120px;
    padding: 0 2px;
  }

  .pf-bg-header { background: #f0f0f0; font-weight: bold; text-align: center; }
  .pf-text-center { text-align: center; }
  .pf-text-right  { text-align: right; }

  .pf-pass  { color: #166534; font-weight: bold; }
  .pf-fail  { color: #991b1b; font-weight: bold; }

  .pf-footer {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #000;
    background: #f5f5f5;
    margin-top: 6px;
    font-size: 10px;
    page-break-inside: avoid;
  }

  .pf-footer td {
    padding: 6px 10px;
    vertical-align: bottom;
    border: none;
    width: 50%;
  }
`;

export function PTFinalPrintReport({
  order,
  transformer,
  reportData,
  pretestData,
  activeCores,
  user,
}: PTFinalPrintReportProps) {
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

    cores.forEach((core: any, idx: number) => {
      let coreClass = normalize(core?.accuracyClass);
      const typeLc = String(core?.coreType || '').toLowerCase();

      // Fallback for metering
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
    if (core.startsWith('metering')) return `Metering${suffix}`;
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
    { id: 8,  label: 'H.V. Test on Secondary Winding',   field: 'hvSecondary' },
    { id: 9,  label: 'H.V. Test on Primary Winding',     field: 'hvPrimary' },
    { id: 10, label: 'Induced Over Voltage Test',         field: 'inducedOverVoltage' },
  ];

  return (
    <>
      <style>{STYLE}</style>
      <div className="pt-final-print-root">

        {/* ── HEADER ─────────────────────────────────────────── */}
        <div className="pf-header-title">
          <h1>ADVENT ENGINEERS</h1>
          <h2>Testing Record of Potential Transformer</h2>
        </div>

        {/* Serial No / Date row - use table to avoid flex in print */}
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

        {/* ── PRE TESTING (read-only from pretester) ─────────── */}
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
                    <td className="pf-text-center">{pre.ratioError25  || ''}</td>
                    <td className="pf-text-center">{pre.phaseError25  || ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* Pretester name */}
          <div style={{ borderTop: '1px solid #000', borderLeft: '1px solid #000', borderRight: '1px solid #000', borderBottom: '1px solid #000', padding: '3px 8px', fontSize: 10, background: '#fafafa' }}>
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
                  <td style={{ paddingLeft: 12 }}>{row.label}</td>
                  <td className="pf-text-center" style={{ fontWeight: 500 }}>
                    {finalTesting[row.field] || ''}
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
                  return (
                    <tr key={`${core}-${perc}`}>
                      {idx === 0 && (
                        <td
                          style={{ fontWeight: 'bold', textAlign: 'center', background: '#f0f0f0', textTransform: 'uppercase', verticalAlign: 'middle' }}
                          rowSpan={percentages.length}
                        >
                          {coreLabel}
                        </td>
                      )}
                      <td className="pf-text-center" style={{ background: '#fafafa', fontWeight: 600 }}>{perc}%</td>
                      <td className="pf-text-center">{acc.ratioError100 || ''}</td>
                      <td className="pf-text-center">{acc.phaseError100 || ''}</td>
                      <td className="pf-text-center">{acc.ratioError25  || ''}</td>
                      <td className="pf-text-center">{acc.phaseError25  || ''}</td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>

        {/* ── FOOTER – use table to avoid flex distortion in print ── */}
        <table className="pf-footer">
          <colgroup>
            <col style={{ width: '50%' }} />
            <col style={{ width: '50%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td>
                <strong>Tested By:</strong><br />
                <span style={{ borderBottom: '1px solid #000', minWidth: 160, display: 'inline-block', paddingBottom: 2, marginTop: 6, fontSize: '13px', fontWeight: 'bold', color: '#003a70' }}>
                  {reportData?.testedBy || user?.name || user?.fullName || ''}
                </span><br />
                <span style={{ fontSize: 9, color: '#555' }}>PT Tester</span>
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

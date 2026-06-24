import React from 'react';

interface PTPretestPrintReportProps {
  order: any;
  transformer: any;
  reportData: any;
  activeCores: string[];
  user: any;
}

const STYLE = `
  @page {
    size: A4 portrait;
    margin: 0;
  }

  @media print {
    html, body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      margin: 0;
      padding: 0;
    }

    .pt-pretest-print-wrapper {
      position: static !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      overflow: visible !important;
    }

    .pt-pretest-print-root {
      padding: 15mm 20mm !important;
    }

    .screen-only { display: none !important; }
    .no-print { display: none !important; }
  }

  .pt-pretest-print-root {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 13px;
    color: #000;
    background: #fff;
    width: 210mm;
    margin: 0 auto;
    padding: 20px;
    box-sizing: border-box;
  }

  @media print {
    body { margin: 0; }
    .pt-pretest-print-root { padding: 15mm 20mm !important; }
    .pf-table { page-break-inside: avoid; }
    .pf-section-wrapper { page-break-inside: avoid; }
  }

  .pf-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    margin-bottom: 4px;
  }

  .pf-table th, .pf-table td {
    border: 1px solid #000;
    padding: 8px 8px;
    vertical-align: middle;
    word-break: break-word;
  }

  .pf-section-header {
    text-align: center;
    font-weight: bold;
    background: #e8e8e8;
    border: 1px solid #000;
    border-bottom: none;
    padding: 8px;
    font-size: 14px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .pf-section-wrapper {
    margin-bottom: 14px;
    page-break-inside: avoid;
  }

  .pf-header-title {
    text-align: center;
    border-bottom: 2px solid #000;
    padding-bottom: 12px;
    margin-bottom: 14px;
  }

  .pf-header-title h1 {
    font-size: 22px;
    font-weight: 900;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #003a70;
    margin: 0 0 4px 0;
  }

  .pf-header-title h2 {
    font-size: 14px;
    font-weight: bold;
    text-transform: uppercase;
    margin: 0;
  }

  .pf-serial-row {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 14px;
    background: #f5f5f5;
    border: 1px solid #000;
  }

  .pf-serial-row td {
    padding: 8px 12px;
    font-weight: bold;
    font-size: 12px;
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
`;

export function PTPretestPrintReport({
  order,
  transformer,
  reportData,
  activeCores,
  user,
}: PTPretestPrintReportProps) {

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
    if (core.startsWith('metering')) return `Metering${suffix}`;
    if (core.startsWith('ps')) return `PS${suffix}`;
    return core;
  };

  return (
    <>
      <style>{STYLE}</style>
      <div className="pt-pretest-print-root">

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
                const pre = reportData?.preTesting?.[core] || {};
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
          <div style={{ borderTop: 'none', borderLeft: '1px solid #000', borderRight: '1px solid #000', borderBottom: '1px solid #000', padding: '8px 12px', fontSize: 12, background: '#fafafa', display: 'flex', alignItems: 'center' }}>
            <strong>Tested By (Pretester):</strong>&nbsp;
            <span style={{ borderBottom: '1px solid #555', minWidth: 160, display: 'inline-block', padding: '0 4px', fontStyle: 'italic', color: '#003a70', fontWeight: 'bold', fontSize: '14px' }}>
              {reportData?.testedBy || reportData?.preTesting?.testedBy || ''}
            </span>
          </div>
        </div>

      </div>
    </>
  );
}

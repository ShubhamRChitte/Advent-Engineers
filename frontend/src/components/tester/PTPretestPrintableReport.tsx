import React from 'react';

interface PTPretestPrintableReportProps {
  order: any;
  transformer: any;
  reportData: any;
  activeCores: string[];
  user: any;
  isReadOnly?: boolean;
  onChange?: (core: string, field: string, value: string) => void;
  onTestedByChange?: (value: string) => void;
  preTestValidations?: Record<string, { val100: any; val25: any }>;
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
    padding: 15mm 15mm;
    margin: 0 auto;
    color: #000;
    font-family: Arial, Helvetica, sans-serif;
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
    margin-bottom: 6px;
  }

  .pf-table th, .pf-table td {
    border: 1px solid #000;
    padding: 6px 8px;
    vertical-align: middle;
    word-break: break-word;
  }

  .pf-section-header {
    text-align: center;
    font-weight: bold;
    background: #e8e8e8;
    border: 1px solid #000;
    border-bottom: none;
    padding: 6px;
    font-size: 13px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
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
    border-bottom: 2px solid #000;
    padding-bottom: 8px;
    margin-bottom: 12px;
  }

  .pf-header-title h1 {
    font-size: 20px;
    font-weight: 900;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #003a70;
    margin: 0 0 4px 0;
  }

  .pf-header-title h2 {
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
    margin: 0;
  }

  .pf-serial-row {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
    background: #f5f5f5;
    border: 1px solid #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .pf-serial-row td {
    padding: 6px 10px;
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

  .pf-bg-header { 
    background: #f0f0f0; 
    font-weight: bold; 
    text-align: center;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .pf-text-center { text-align: center; }
  .pf-text-right  { text-align: right; }
  .pf-pass { color: #166534; font-weight: bold; }
  .pf-fail { color: #991b1b; font-weight: bold; }

  .pf-table input,
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
    text-align: center;
    transition: all 0.15s ease-in-out;
    box-sizing: border-box;
  }

  .pf-table input:focus {
    background: #ffffff;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
  }

  .pf-table input:disabled {
    background: #f3f4f6;
    border-color: #e5e7eb;
    color: #1f2937;
  }

  @media print {
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
    tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    .pf-table input,
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

export function PTPretestPrintableReport({
  order,
  transformer,
  reportData,
  activeCores,
  user,
  isReadOnly = true,
  onChange,
  onTestedByChange,
  preTestValidations = {},
  printRef
}: PTPretestPrintableReportProps) {

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
    if (core.startsWith('protection')) return `Protection`;
    if (core.startsWith('metering')) return `Metering${suffix}`;
    if (core.startsWith('ps')) return `PS${suffix}`;
    return core;
  };

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
                const pre = reportData?.preTesting?.[core] || {};
                const validations = preTestValidations?.[core];
                const v100 = validations?.val100 || { isPass: undefined, reason: null };
                const v25 = validations?.val25 || { isPass: undefined, reason: null };

                return (
                  <tr key={core}>
                    <td style={{ fontWeight: 'bold', background: '#fafafa' }}>
                      <div className="relative w-full">
                        {label} 30%
                        {(v100.isPass === false || v25.isPass === false) ? (
                          <div className="absolute right-1 top-1 text-[10px] font-bold px-1 py-0.5 rounded bg-red-100 text-red-700 screen-only">FAIL</div>
                        ) : (v100.isPass && v25.isPass) ? (
                          <div className="absolute right-1 top-1 text-[10px] font-bold px-1 py-0.5 rounded bg-green-100 text-green-700 screen-only">PASS</div>
                        ) : null}
                      </div>
                    </td>
                    <td className="pf-text-center" style={{ padding: 0 }}>
                      {isReadOnly ? (
                        <span className={v100.isPass === false && v100.reason?.includes('Ratio') ? 'text-red-700 font-bold' : 'text-blue-600 font-medium'}>
                          {pre.ratioError100 || ''}
                        </span>
                      ) : (
                        <input
                          type="text"
                          value={pre.ratioError100 || ''}
                          onChange={(e) => onChange?.(core, 'ratioError100', e.target.value.replace(/[^0-9.\-+]/g, ''))}
                          className={v100.isPass === false && v100.reason?.includes('Ratio') ? 'text-red-700 font-bold' : 'text-blue-600'}
                        />
                      )}
                    </td>
                    <td className="pf-text-center" style={{ padding: 0 }}>
                      {isReadOnly ? (
                        <span className={v100.isPass === false && v100.reason?.includes('Phase') ? 'text-red-700 font-bold' : 'text-blue-600 font-medium'}>
                          {pre.phaseError100 || ''}
                        </span>
                      ) : (
                        <input
                          type="text"
                          value={pre.phaseError100 || ''}
                          onChange={(e) => onChange?.(core, 'phaseError100', e.target.value.replace(/[^0-9.\-+]/g, ''))}
                          className={v100.isPass === false && v100.reason?.includes('Phase') ? 'text-red-700 font-bold' : 'text-blue-600'}
                        />
                      )}
                    </td>
                    <td className="pf-text-center" style={{ padding: 0 }}>
                      {isReadOnly ? (
                        <span className={v25.isPass === false && v25.reason?.includes('Ratio') ? 'text-red-700 font-bold' : 'text-blue-600 font-medium'}>
                          {pre.ratioError25 || ''}
                        </span>
                      ) : (
                        <input
                          type="text"
                          value={pre.ratioError25 || ''}
                          onChange={(e) => onChange?.(core, 'ratioError25', e.target.value.replace(/[^0-9.\-+]/g, ''))}
                          className={v25.isPass === false && v25.reason?.includes('Ratio') ? 'text-red-700 font-bold' : 'text-blue-600'}
                        />
                      )}
                    </td>
                    <td className="pf-text-center" style={{ padding: 0 }}>
                      {isReadOnly ? (
                        <span className={v25.isPass === false && v25.reason?.includes('Phase') ? 'text-red-700 font-bold' : 'text-blue-600 font-medium'}>
                          {pre.phaseError25 || ''}
                        </span>
                      ) : (
                        <input
                          type="text"
                          value={pre.phaseError25 || ''}
                          onChange={(e) => onChange?.(core, 'phaseError25', e.target.value.replace(/[^0-9.\-+]/g, ''))}
                          className={v25.isPass === false && v25.reason?.includes('Phase') ? 'text-red-700 font-bold' : 'text-blue-600'}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* Pretester name */}
          <div style={{ borderTop: 'none', borderLeft: '1px solid #000', borderRight: '1px solid #000', borderBottom: '1px solid #000', padding: '8px 12px', fontSize: 12, background: '#fafafa', display: 'flex', alignItems: 'center' }}>
            <strong>Tested By (Pretester):</strong>&nbsp;
            <span style={{ borderBottom: '1px solid #555', minWidth: 160, display: 'inline-block', padding: '0 4px', fontStyle: 'italic', color: '#003a70', fontWeight: 'bold', fontSize: '14px' }}>
              {isReadOnly ? (
                reportData?.testedBy || reportData?.preTesting?.testedBy || ''
              ) : (
                <input
                  type="text"
                  value={reportData?.testedBy || reportData?.preTesting?.testedBy || user?.name || user?.fullName || ''}
                  onChange={(e) => onTestedByChange?.(e.target.value)}
                  style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontStyle: 'italic', color: '#003a70', fontWeight: 'bold', fontSize: '14px', padding: 0 }}
                />
              )}
            </span>
          </div>
        </div>

      </div>
    </>
  );
}

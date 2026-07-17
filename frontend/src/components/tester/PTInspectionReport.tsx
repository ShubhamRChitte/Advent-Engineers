import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '../ui/button';
import { Save, Printer, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from '@/utils/axiosConfig';

// ── The same STYLE const as PTFinalPrintableReport — copied verbatim so the
// Inspection report is visually identical to the Final Testing report.
// Nothing else from PTFinalPrintableReport is imported or modified.

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

  .pt-insp-wrapper {
    background: #fff;
    width: 210mm;
    min-height: auto;
    padding: 10mm 15mm;
    margin: 0 auto;
    color: #000;
    font-family: Arial, Helvetica, sans-serif;
    box-sizing: border-box;
    font-size: 11px;
  }

  @media screen {
    .pt-insp-wrapper {
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
      border-radius: 4px;
      margin-bottom: 20px;
      border: 1px solid #cbd5e1;
    }
  }

  .pfi-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    margin-bottom: 4px;
  }

  .pfi-table th, .pfi-table td {
    border: 1px solid #000;
    padding: 4px 6px;
    vertical-align: middle;
    word-break: break-word;
  }

  .pfi-section-header {
    text-align: center;
    font-weight: bold;
    background: #e8e8e8;
    border: 1px solid #000;
    border-bottom: none;
    padding: 4px;
    font-size: 12px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .pfi-section-wrapper {
    margin-bottom: 10px;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .pfi-header-title {
    text-align: center;
    border-bottom: 2px solid #000;
    padding-bottom: 6px;
    margin-bottom: 10px;
  }

  .pfi-header-title h1 {
    font-size: 18px;
    font-weight: 900;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #003a70;
    margin: 0 0 2px 0;
  }

  .pfi-header-title h2 {
    font-size: 11px;
    font-weight: bold;
    text-transform: uppercase;
    margin: 0;
  }

  .pfi-serial-row {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
    background: #f5f5f5;
    border: 1px solid #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .pfi-serial-row td {
    padding: 4px 8px;
    font-weight: bold;
    font-size: 11px;
    border: none;
  }

  .pfi-serial-row td span {
    font-weight: normal;
    border-bottom: 1px solid #555;
    display: inline-block;
    min-width: 120px;
    padding: 0 2px;
  }

  .pfi-bg-header {
    background: #f0f0f0;
    font-weight: bold;
    text-align: center;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .pfi-text-center { text-align: center; }
  .pfi-text-right  { text-align: right; }

  .pfi-insp-footer {
    width: 100%;
    border-collapse: collapse;
    border: none;
    margin-top: 18px;
    font-size: 11px;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .pfi-insp-footer td {
    padding: 8px 10px;
    vertical-align: bottom;
    border: none;
    width: 33.33%;
    text-align: center;
  }

  .pfi-table input {
    width: 100%;
    height: 24px;
    padding: 1px 4px;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    outline: 0;
    background: #ffffff;
    color: #1f2937;
    font-size: 11px;
    font-weight: 500;
    text-align: center;
    transition: all 0.15s ease-in-out;
    box-sizing: border-box;
  }

  .pfi-table input:focus {
    background: #ffffff;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
  }

  @media print {
    html, body {
      background: #ffffff !important;
      width: 100% !important;
      min-height: auto;
      margin: 0 !important;
      padding: 0 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page { size: A4 portrait; margin: 10mm; }

    .pt-insp-wrapper {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      padding: 0 !important;
      box-sizing: border-box;
      overflow: visible !important;
      border: none !important;
      box-shadow: none !important;
    }

    .pfi-insp-no-print, .no-print, .screen-only { display: none !important; }
    .no-print-scroll { overflow: visible !important; }

    .pfi-section-wrapper, .pfi-table, .pfi-insp-footer, tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    .pfi-table input {
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

    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  }
`;

interface PTInspectionReportProps {
  order: any;
  transformer: any;
  user?: any;
}

const FINAL_ROWS = [
  { id: 1,  label: 'Leakage',                         field: 'leakage' },
  { id: 2,  label: 'Terminal Marking',                 field: 'terminalMarking' },
  { id: 3,  label: 'Polarity Testing',                 field: 'polarityTesting' },
  { id: 4,  label: 'Insulation Resistance Test',       field: 'insulationResistance' },
  { id: 5,  label: 'Primary to Secondary',             field: 'primaryToSecondary' },
  { id: 6,  label: 'Primary to Earth',                 field: 'primaryToEarth' },
  { id: 7,  label: 'Secondary to Earth',               field: 'secondaryToEarth' },
  { id: 9,  label: 'H.V.Test on Secondary Winding',    field: 'hvSecondary' },
  { id: 10, label: 'H.V.Test on Primary Winding',      field: 'hvPrimary' },
  { id: 11, label: 'Induced Over Voltage Test',        field: 'inducedOverVoltage' },
];

const getCoreLabel = (core: string) => {
  const num = core.replace(/[a-z]/gi, '');
  const suffix = num === '1' || num === '' ? '' : ` ${num}`;
  if (core.startsWith('protection')) return `Protection${suffix}`;
  if (core.startsWith('metering')) return `Metering`;
  if (core.startsWith('ps')) return `PS${suffix}`;
  return core;
};

export function PTInspectionReport({ order, transformer, user }: PTInspectionReportProps) {
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [saving, setSaving] = useState(false);

  // Final Testing rows state (independent from PTFinalPrintableReport)
  const [finalTesting, setFinalTesting] = useState<Record<string, string>>({});

  // Accuracy test state: { [core]: { [perc]: { ratioError100, phaseError100, ratioError25, phaseError25 } } }
  const [accuracyTest, setAccuracyTest] = useState<Record<string, Record<string, Record<string, string>>>>({});

  // Pre-testing state (displayed read-only from existing data)
  const [pretestData, setPretestData] = useState<Record<string, any>>({});

  const testDate = new Date().toLocaleDateString('en-GB');

  // Derive active cores from order
  const activeCores: string[] = (() => {
    const cores = order?.coreDetails || order?.coreConfigs || [];
    if (Array.isArray(cores) && cores.length > 0) {
      return cores.map((_: any, i: number) => {
        const type = String(cores[i]?.coreType || 'metering').toLowerCase();
        if (type.includes('protect')) return `protection${i > 0 ? i + 1 : ''}`;
        if (type.includes('ps')) return `ps${i > 0 ? i + 1 : ''}`;
        return `metering${i > 0 ? i + 1 : ''}`;
      });
    }
    // fallback: single metering core
    return ['metering'];
  })();

  const accuracyClassDisplay = (() => {
    const cores = order?.coreDetails || order?.coreConfigs || [];
    if (!Array.isArray(cores) || cores.length === 0) return order?.accuracyClass || '0.2';
    const classes = cores.map((c: any) => c?.accuracyClass).filter(Boolean);
    return classes.length > 0 ? classes.join(' / ') : (order?.accuracyClass || '0.2');
  })();

  const ptRatioDisplay = (() => {
    const params = order?.parameters || {};
    const primaryV = order?.ratedPrimaryVoltage || params.ratedPrimaryVoltage;
    const secondaryV = order?.ratedSecondaryVoltage || params.ratedSecondaryVoltage;
    if (!primaryV || !secondaryV) return order?.ratio?.[0] || 'N/A';
    const coresCount = parseInt(order?.noOfCores || order?.numberOfCores || '1');
    const ratioParts = [primaryV];
    for (let i = 0; i < coresCount; i++) ratioParts.push(secondaryV);
    return ratioParts.join(' / ');
  })();

  const burdenDisplay = (() => {
    const b = order?.burden;
    if (Array.isArray(b)) return b.join(' / ');
    return b || 'N/A';
  })();

  // Load existing inspection data
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`/pt/inspection/${encodeURIComponent(transformer.uniqueId)}`, { withCredentials: true });
        if (res.data.success) {
          const d = res.data.data;
          if (d && Object.keys(d).length > 0) {
            setFinalTesting(d.finalTesting || {});
            setAccuracyTest(d.accuracyTest || {});
            setPretestData(d.pretestData || {});
            setIsReadOnly(true);
          }
        }
      } catch { /* no existing data */ }

      // Also try to load pretesting data from pt_test history
      try {
        const tRes = await axios.get(`/pt/${encodeURIComponent(transformer.uniqueId)}`, { withCredentials: true });
        if (tRes.data) {
          const ptTest = tRes.data.testHistory?.pt_test || tRes.data.testHistory?.pt_pretest_test || {};
          const coreData: Record<string, any> = {};
          activeCores.forEach((core) => {
            if (ptTest[core]) coreData[core] = ptTest[core];
          });
          if (Object.keys(coreData).length > 0) setPretestData(prev => ({ ...prev, ...coreData }));
        }
      } catch { /* no pretest data */ }
    };
    if (transformer?.uniqueId) load();
  }, [transformer?.uniqueId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        finalTesting,
        accuracyTest,
        pretestData,
        testerName: user?.name || user?.fullName || '',
        reportDate: new Date(),
      };
      const res = await axios.post(`/pt/inspection/${encodeURIComponent(transformer.uniqueId)}`, payload, { withCredentials: true });
      if (res.data.success) {
        toast.success('PT Inspection report saved successfully.');
        setIsReadOnly(true);
      } else {
        toast.error(res.data.message || 'Failed to save inspection report.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save inspection report.');
    } finally {
      setSaving(false);
    }
  };

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Advent_Engineers_PT_Inspection_Report_${transformer?.uniqueId}`,
  });

  const setFinalField = (field: string, value: string) => {
    setFinalTesting(prev => ({ ...prev, [field]: value }));
  };

  const setAccuracyField = (core: string, perc: string, field: string, value: string) => {
    setAccuracyTest(prev => ({
      ...prev,
      [core]: {
        ...(prev[core] || {}),
        [perc]: { ...(prev[core]?.[perc] || {}), [field]: value }
      }
    }));
  };

  return (
    <>
      <style>{STYLE}</style>

      {/* Toolbar — screen only */}
      <div className="pfi-insp-no-print flex items-center justify-between mb-4 px-1">
        <span className="text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg">
          PT Inspection Report
        </span>
        <div className="flex gap-2">
          {isReadOnly ? (
            <Button variant="outline" size="sm" onClick={() => setIsReadOnly(false)} className="gap-2">
              <Edit2 className="w-4 h-4" /> Edit
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}
              className="gap-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold">
              <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save'}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => handlePrint()} className="gap-2">
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
      </div>

      {/* Scroll wrapper (identical pattern to PTFinalPrintableReport) */}
      <div className="no-print-scroll">
        <div
          id="pt-inspection-printable-report"
          ref={printRef}
          className="pt-insp-wrapper"
        >
          {/* ── HEADER ── */}
          <div className="pfi-header-title">
            <h1>ADVENT ENGINEERS</h1>
            <h2>Inspection Record of Potential Transformer</h2>
          </div>

          {/* Serial / Date */}
          <table className="pfi-serial-row">
            <colgroup>
              <col style={{ width: '70%' }} />
              <col style={{ width: '30%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td>SERIAL NO. :&nbsp;<span>{transformer?.uniqueId || 'N/A'}</span></td>
                <td style={{ textAlign: 'right' }}>Date :&nbsp;<span style={{ minWidth: '80px', textAlign: 'center' }}>{testDate}</span></td>
              </tr>
            </tbody>
          </table>

          {/* ── SPECIFICATION ── */}
          <div className="pfi-section-wrapper">
            <table className="pfi-table">
              <colgroup>
                <col style={{ width: '25%' }} /><col style={{ width: '25%' }} />
                <col style={{ width: '25%' }} /><col style={{ width: '25%' }} />
              </colgroup>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Specification</td>
                  <td style={{ background: '#fafafa' }}>{order?.voltageRating || '11'} KV PT</td>
                  <td style={{ fontWeight: 'bold' }}>Type 1</td>
                  <td style={{ background: '#fafafa' }}>{order?.indoorOutdoor || 'N/A'}</td>
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

          {/* ── PRE TESTING (read-only display of existing data) ── */}
          <div className="pfi-section-wrapper">
            <div className="pfi-section-header">Pre Testing</div>
            <table className="pfi-table" style={{ marginBottom: 0 }}>
              <colgroup>
                <col style={{ width: '30%' }} /><col style={{ width: '17.5%' }} />
                <col style={{ width: '17.5%' }} /><col style={{ width: '17.5%' }} />
                <col style={{ width: '17.5%' }} />
              </colgroup>
              <thead>
                <tr>
                  <td className="pfi-bg-header" rowSpan={2}>% of Primary Current</td>
                  <td className="pfi-bg-header" colSpan={2}>100% Burden</td>
                  <td className="pfi-bg-header" colSpan={2}>25% Burden</td>
                </tr>
                <tr>
                  <td className="pfi-bg-header">Ratio Error (%)</td>
                  <td className="pfi-bg-header">Phase Error (min)</td>
                  <td className="pfi-bg-header">Ratio Error (%)</td>
                  <td className="pfi-bg-header">Phase Error (min)</td>
                </tr>
              </thead>
              <tbody>
                {activeCores.map((core) => {
                  const pre = pretestData?.[core] || {};
                  return (
                    <tr key={core}>
                      <td style={{ fontWeight: 'bold', background: '#fafafa' }}>{getCoreLabel(core)} 30%</td>
                      <td className="pfi-text-center">{pre.ratioError100 || ''}</td>
                      <td className="pfi-text-center">{pre.phaseError100 || ''}</td>
                      <td className="pfi-text-center">{pre.ratioError25 || ''}</td>
                      <td className="pfi-text-center">{pre.phaseError25 || ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ borderTop: '1px solid #000', borderLeft: '1px solid #000', borderRight: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 8px', fontSize: 10, background: '#fafafa' }}>
              <strong>Tested By (Pretester):</strong>&nbsp;
              <span style={{ borderBottom: '1px solid #555', minWidth: 120, display: 'inline-block', padding: '0 4px', fontSize: '13px', fontWeight: 'bold', color: '#003a70' }}>
                {pretestData?.testedBy || ''}
              </span>
            </div>
          </div>

          {/* ── INSPECTION TESTING (editable — independent from Final Testing) ── */}
          <div className="pfi-section-wrapper">
            <div className="pfi-section-header">Inspection Testing</div>
            <table className="pfi-table" style={{ marginBottom: 0 }}>
              <colgroup>
                <col style={{ width: '8%' }} />
                <col style={{ width: '60%' }} />
                <col style={{ width: '32%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="pfi-bg-header">Sr No.</th>
                  <th className="pfi-bg-header">Parameters</th>
                  <th className="pfi-bg-header">Readings</th>
                </tr>
              </thead>
              <tbody>
                {FINAL_ROWS.map((row) => (
                  <tr key={row.id}>
                    <td className="pfi-text-center">{row.id}</td>
                    <td style={{ paddingLeft: 12, textAlign: 'left' }}>{row.label}</td>
                    <td className="pfi-text-center" style={{ padding: 0 }}>
                      {isReadOnly ? (
                        <span>{finalTesting[row.field] || ''}</span>
                      ) : (
                        <input
                          type="text"
                          value={finalTesting[row.field] || ''}
                          onChange={(e) => setFinalField(row.field, e.target.value)}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── ACCURACY TEST (independent editable) ── */}
          <div className="pfi-section-wrapper">
            <div className="pfi-section-header">Accuracy Test</div>
            <table className="pfi-table" style={{ marginBottom: 0 }}>
              <colgroup>
                <col style={{ width: '16%' }} /><col style={{ width: '14%' }} />
                <col style={{ width: '17.5%' }} /><col style={{ width: '17.5%' }} />
                <col style={{ width: '17.5%' }} /><col style={{ width: '17.5%' }} />
              </colgroup>
              <thead>
                <tr>
                  <td className="pfi-bg-header" rowSpan={2}>Core</td>
                  <td className="pfi-bg-header" rowSpan={2}>% of Primary<br />Current</td>
                  <td className="pfi-bg-header" colSpan={2}>100% Burden</td>
                  <td className="pfi-bg-header" colSpan={2}>25% Burden</td>
                </tr>
                <tr>
                  <td className="pfi-bg-header">Ratio Error (%)</td>
                  <td className="pfi-bg-header">Phase Error (min)</td>
                  <td className="pfi-bg-header">Ratio Error (%)</td>
                  <td className="pfi-bg-header">Phase Error (min)</td>
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
                        <td className="pfi-text-center" style={{ background: '#fafafa', fontWeight: 600 }}>{perc}%</td>
                        {(['ratioError100', 'phaseError100', 'ratioError25', 'phaseError25'] as const).map(field => (
                          <td key={field} className="pfi-text-center" style={{ padding: 0 }}>
                            {isReadOnly ? (
                              <span className="text-blue-600 font-medium">{acc[field] || ''}</span>
                            ) : (
                              <input
                                type="text"
                                value={acc[field] || ''}
                                onChange={(e) => setAccuracyField(core, perc, field, e.target.value)}
                              />
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>

          {/* ── INSPECTION SIGNATURES (3 blocks: Witnessed By / Testing Engineer / Authorized Signatory) ── */}
          <table className="pfi-insp-footer">
            <colgroup>
              <col style={{ width: '33.33%' }} />
              <col style={{ width: '33.33%' }} />
              <col style={{ width: '33.33%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td style={{ textAlign: 'center', verticalAlign: 'bottom', paddingTop: 24 }}>
                  <span style={{ borderBottom: '1px solid #000', minWidth: 140, height: 28, display: 'inline-block', marginBottom: 4 }} />
                  <br />
                  <strong style={{ fontSize: 11 }}>Witnessed By</strong>
                </td>
                <td style={{ textAlign: 'center', verticalAlign: 'bottom', paddingTop: 24 }}>
                  <span style={{ borderBottom: '1px solid #000', minWidth: 140, display: 'inline-block', paddingBottom: 2, marginBottom: 4, fontSize: '13px', fontWeight: 'bold', color: '#003a70', fontStyle: 'italic' }}>
                    {user?.name || user?.fullName || ''}
                  </span>
                  <br />
                  <strong style={{ fontSize: 11 }}>Testing Engineer</strong>
                </td>
                <td style={{ textAlign: 'center', verticalAlign: 'bottom', paddingTop: 24 }}>
                  <span style={{ borderBottom: '1px solid #000', minWidth: 140, height: 28, display: 'inline-block', marginBottom: 4 }} />
                  <br />
                  <strong style={{ fontSize: 11 }}>Authorized Signatory</strong>
                </td>
              </tr>
            </tbody>
          </table>

        </div>
      </div>
    </>
  );
}

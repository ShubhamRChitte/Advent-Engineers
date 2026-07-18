import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '../ui/button';
import { Save, Printer, Edit2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from '@/utils/axiosConfig';
import logoImage from '../../assets/d4d1bc6f9b0c444f1821bbe84a4da57caf7080d2.png';

// ── Print Styles ──────────────────────────────────────────────────────────────
const STYLE = `
  .pt-insp-scroll-wrap {
    width: 100%;
    overflow-x: auto;
    background: #f1f5f9;
    padding: 20px 0;
    display: flex;
    justify-content: flex-start;
  }
  @media (min-width: 900px) {
    .pt-insp-scroll-wrap { justify-content: center; }
  }

  .pt-insp-page {
    background: #fff;
    width: 210mm;
    min-width: 210mm;
    min-height: auto;
    padding: 8mm 12mm;
    color: #000;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10.5px;
    box-sizing: border-box;
    margin: 0 auto;
  }

  @media screen {
    .pt-insp-page {
      box-shadow: 0 4px 24px rgba(0,0,0,0.12);
      border-radius: 4px;
      border: 1px solid #cbd5e1;
    }
  }

  /* ── Tables ── */
  .pit-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }

  .pit-table th,
  .pit-table td {
    border: 1px solid #000;
    padding: 3px 5px;
    vertical-align: middle;
    word-break: break-word;
    line-height: 1.35;
  }

  /* ── Section headers ── */
  .pit-section-title {
    text-align: center;
    font-weight: bold;
    font-size: 11px;
    padding: 4px 6px;
    letter-spacing: 0.3px;
    border: 1px solid #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .pit-bg-header {
    background: #e0e0e0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .pit-center { text-align: center; }
  .pit-bold   { font-weight: bold; }
  .pit-right  { text-align: right; }

  /* ── Editable inputs ── */
  .pit-input {
    width: 100%;
    border: none;
    border-bottom: 1px solid #94a3b8;
    outline: none;
    background: transparent;
    font-family: inherit;
    font-size: inherit;
    color: inherit;
    padding: 1px 2px;
    text-align: center;
    min-width: 40px;
  }
  .pit-input:focus {
    border-bottom-color: #3b82f6;
    background: #eff6ff;
  }

  .pit-input-left {
    width: 100%;
    border: none;
    border-bottom: 1px solid #94a3b8;
    outline: none;
    background: transparent;
    font-family: inherit;
    font-size: inherit;
    color: inherit;
    padding: 1px 2px;
    text-align: left;
    min-width: 60px;
  }
  .pit-input-left:focus {
    border-bottom-color: #3b82f6;
    background: #eff6ff;
  }

  /* ── Footer table ── */
  .pit-footer {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }
  .pit-footer td {
    border: 1px solid #000;
    padding: 6px 8px;
    vertical-align: top;
    text-align: center;
    width: 33.33%;
  }
  .pit-footer-sig {
    min-height: 55px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    font-style: italic;
    color: #4b5563;
    font-size: 10px;
    padding-top: 4px;
  }
  .pit-seal-box {
    width: 90px;
    height: 90px;
    border: 2px dashed #94a3b8;
    border-radius: 50%;
    margin: 4px auto;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    color: #94a3b8;
    text-align: center;
  }

  /* ── Header layout ── */
  .pit-header-outer {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #000;
    margin-bottom: 0;
  }
  .pit-header-outer td {
    border: 1px solid #000;
    vertical-align: middle;
  }
  .pit-header-logo {
    width: 28%;
    padding: 4px;
    text-align: center;
  }
  .pit-header-company {
    width: 72%;
    padding: 4px 10px;
    text-align: center;
  }
  .pit-company-name {
    font-size: 16px;
    font-weight: 900;
    letter-spacing: 1px;
  }
  .pit-company-addr {
    font-size: 10px;
    margin-top: 2px;
  }

  /* ── Verification rows ── */
  .pit-verif-row td {
    border: 1px solid #000;
    padding: 3px 5px;
    vertical-align: middle;
  }

  @media print {
    html, body {
      background: #fff !important;
      margin: 0 !important;
      padding: 0 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page { size: A4 portrait; margin: 8mm 10mm; }

    .pt-insp-no-print { display: none !important; }
    .pt-insp-scroll-wrap {
      overflow: visible !important;
      background: transparent !important;
      padding: 0 !important;
    }
    .pt-insp-page {
      width: 100% !important;
      min-width: 0 !important;
      box-shadow: none !important;
      border: none !important;
      padding: 0 !important;
      margin: 0 !important;
    }

    .pit-input, .pit-input-left {
      border: none !important;
      background: transparent !important;
      box-shadow: none !important;
    }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  }
`;

interface BurdenRow {
  burden: string;
  primaryVoltage: string;
  ratioError: string;
  phaseError: string;
}

interface PTInspectionReportProps {
  batchId: string;
  transformerId: string;
  batchTransformer?: any;
  user?: any;
  onSaved?: () => void;
}

const DEFAULT_BURDEN_ROWS: BurdenRow[] = [
  { burden: '100%', primaryVoltage: '120%', ratioError: '', phaseError: '' },
  { burden: '',     primaryVoltage: '100%', ratioError: '', phaseError: '' },
  { burden: '',     primaryVoltage: '80%',  ratioError: '', phaseError: '' },
  { burden: '25%',  primaryVoltage: '120%', ratioError: '', phaseError: '' },
  { burden: '',     primaryVoltage: '100%', ratioError: '', phaseError: '' },
  { burden: '',     primaryVoltage: '80%',  ratioError: '', phaseError: '' },
];

interface EProps {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  isReadOnly: boolean;
}

const E = ({ value, onChange, className = '', isReadOnly }: EProps) =>
  isReadOnly ? (
    <span>{value || '—'}</span>
  ) : (
    <input
      className={`pit-input ${className}`}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );

const EL = ({ value, onChange, className = '', isReadOnly }: EProps) =>
  isReadOnly ? (
    <span>{value || '—'}</span>
  ) : (
    <input
      className={`pit-input-left ${className}`}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );

export function PTInspectionReport({
  batchId,
  transformerId,
  batchTransformer,
  user,
  onSaved
}: PTInspectionReportProps) {
  const [saving, setSaving]       = useState(false);
  const [loading, setLoading]     = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // ── Header / Customer info fields ──────────────────────────────────────────
  const [customerName,    setCustomerName]    = useState('');
  const [description,     setDescription]     = useState('');
  const [ratio,           setRatio]           = useState('');
  const [burden,          setBurden]          = useState('');
  const [accuracyClass,   setAccuracyClass]   = useState('');
  const [voltageFactor,   setVoltageFactor]   = useState('');
  const [refNo,           setRefNo]           = useState('');
  const [isStandard,      setIsStandard]      = useState('IS: 16227');

  // ── Accuracy table ─────────────────────────────────────────────────────────
  const [burdenRows, setBurdenRows] = useState<BurdenRow[]>(DEFAULT_BURDEN_ROWS);

  // ── Verification rows ──────────────────────────────────────────────────────
  const [terminalMarking,    setTerminalMarking]    = useState('');
  const [inducedVoltage,     setInducedVoltage]     = useState('');
  const [pfTestPrimary,      setPfTestPrimary]      = useState('');
  const [pfTestSecondary,    setPfTestSecondary]    = useState('');

  // ── IR Values ──────────────────────────────────────────────────────────────
  const [irPrimaryEarth,    setIrPrimaryEarth]    = useState('');
  const [irPrimarySecondary, setIrPrimarySecondary] = useState('');
  const [irSecondaryEarth,  setIrSecondaryEarth]  = useState('');

  // ── Acceptance text ────────────────────────────────────────────────────────
  const [acceptanceText, setAcceptanceText] = useState(
    'Above Readings are within the limit as per IS 16227 and hence jobs are accepted.'
  );

  // ── Signature section ──────────────────────────────────────────────────────
  const [testingDate,    setTestingDate]    = useState(() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
  });
  const [witnessedByName,  setWitnessedByName]  = useState('');
  const [witnessedByDesig, setWitnessedByDesig] = useState('');
  const [witnessedByCompany, setWitnessedByCompany] = useState('');
  const [testedByName,    setTestedByName]    = useState(user?.name || user?.fullName || '');
  const [testedByRole,    setTestedByRole]    = useState('Testing Engineer');

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `PT_Inspection_Report_${transformerId}`,
  });

  // ── Load saved data ────────────────────────────────────────────────────────
  useEffect(() => {
    const populateDefaults = () => {
      const order = batchTransformer?.orderId || {};
      
      setCustomerName(order.clientName || batchTransformer?.customerName || '');
      setDescription(order.transformerName || order.transformerType || '');
      
      const primaryV = order.ratedPrimaryVoltage || '';
      const secondaryV = order.ratedSecondaryVoltage || '';
      const ratioDisplay = primaryV && secondaryV ? `${primaryV} / ${secondaryV}` : (order.ratio?.[0] || '');
      setRatio(ratioDisplay);

      const b = order.burden ? `${order.burden} VA` : '';
      setBurden(b);

      const cores = order.coreDetails || [];
      const accClass = cores[0]?.accuracyClass || order.accuracyClass || '0.2';
      setAccuracyClass(accClass);

      const vf = order.voltageFactor || order.ratedVoltageFactor || '1.2 Cont. & 1.5 for 30 Sec';
      setVoltageFactor(vf);

      const ref = order.poNumber ? `PO NO: ${order.poNumber} Dated: ${order.poDate || ''}` : `JOB NO: ${batchTransformer?.jobId || ''}`;
      setRefNo(ref);

      setIsStandard(order.isStandard || 'IS: 16227');
    };

    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/pt-inspection/report/${batchId}/${encodeURIComponent(transformerId)}`, {
          withCredentials: true
        });
        if (res.data.success) {
          const d = res.data.data || {};
          if (Object.keys(d).length > 0) {
            setCustomerName(d.customerName    || '');
            setDescription(d.description      || '');
            setRatio(d.ratio                  || '');
            setBurden(d.burden                || '');
            setAccuracyClass(d.accuracyClass  || '');
            setVoltageFactor(d.voltageFactor  || '');
            setRefNo(d.refNo                  || '');
            setIsStandard(d.isStandard        || 'IS: 16227');
            setBurdenRows(d.burdenRows || DEFAULT_BURDEN_ROWS);
            setTerminalMarking(d.terminalMarking   || '');
            setInducedVoltage(d.inducedVoltage     || '');
            setPfTestPrimary(d.pfTestPrimary        || '');
            setPfTestSecondary(d.pfTestSecondary    || '');
            setIrPrimaryEarth(d.irPrimaryEarth     || '');
            setIrPrimarySecondary(d.irPrimarySecondary || '');
            setIrSecondaryEarth(d.irSecondaryEarth || '');
            setAcceptanceText(d.acceptanceText     || acceptanceText);
            setTestingDate(d.testingDate           || testingDate);
            setWitnessedByName(d.witnessedByName   || '');
            setWitnessedByDesig(d.witnessedByDesig || '');
            setWitnessedByCompany(d.witnessedByCompany || '');
            setTestedByName(d.testedByName         || user?.name || '');
            setTestedByRole(d.testedByRole         || 'Testing Engineer');
            setIsReadOnly(true);
          } else {
            populateDefaults();
          }
        } else {
          populateDefaults();
        }
      } catch {
        populateDefaults();
      }
      setLoading(false);
    };
    load();
  }, [batchId, transformerId, batchTransformer]);

  const collectPayload = () => ({
    customerName, description, ratio, burden, accuracyClass, voltageFactor,
    refNo, isStandard, burdenRows,
    terminalMarking, inducedVoltage, pfTestPrimary, pfTestSecondary,
    irPrimaryEarth, irPrimarySecondary, irSecondaryEarth,
    acceptanceText, testingDate,
    witnessedByName, witnessedByDesig, witnessedByCompany,
    testedByName, testedByRole,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.post(
        `/pt-inspection/report/${batchId}/${encodeURIComponent(transformerId)}`,
        collectPayload(),
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success('PT Inspection report saved.');
        setIsReadOnly(true);
        onSaved?.();
      } else {
        toast.error(res.data.message || 'Failed to save.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const updateBurdenRow = (idx: number, field: keyof BurdenRow, val: string) => {
    setBurdenRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading report...
      </div>
    );
  }

  return (
    <>
      <style>{STYLE}</style>

      {/* ── Toolbar ── */}
      <div className="pt-insp-no-print flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg">
            PT Inspection Report
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md font-mono">{transformerId}</span>
        </div>
        <div className="flex gap-2">
          {isReadOnly ? (
            <Button variant="outline" size="sm" onClick={() => setIsReadOnly(false)} className="gap-2">
              <Edit2 className="w-4 h-4" /> Edit
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save'}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => handlePrint()} className="gap-2">
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
      </div>

      {/* ── Printable Report ── */}
      <div className="pt-insp-scroll-wrap">
        <div ref={printRef} className="pt-insp-page">

          {/* ═══ HEADER ═══ */}
          <table className="pit-header-outer">
            <tbody>
              <tr>
                <td className="pit-header-logo">
                  <img
                    src={logoImage}
                    alt="Advent Engineers Logo"
                    style={{ maxHeight: '70px', maxWidth: '100%', objectFit: 'contain' }}
                  />
                </td>
                <td className="pit-header-company">
                  <div className="pit-company-name">ADVENT ENGINEERS</div>
                  <div className="pit-company-addr">
                    Factory: A – 12, MIDC, Malegaon,<br />
                    Sinnar, NASHIK – 422103
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ═══ REPORT TITLE ═══ */}
          <div className="pit-section-title" style={{ fontSize: '12px', fontWeight: '900', marginTop: 0, borderTop: 'none' }}>
            TEST REPORT OF POTENTIAL TRANSFORMER
          </div>

          {/* ═══ CUSTOMER INFO TABLE ═══ */}
          <table className="pit-table" style={{ marginBottom: 0 }}>
            <colgroup>
              <col style={{ width: '28%' }} />
              <col style={{ width: '72%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td className="pit-bold">Customer Name:</td>
                <td><EL value={customerName} onChange={setCustomerName} isReadOnly={isReadOnly} /></td>
              </tr>
              <tr>
                <td className="pit-bold">Description:</td>
                <td><EL value={description} onChange={setDescription} isReadOnly={isReadOnly} /></td>
              </tr>
              <tr>
                <td className="pit-bold">Ratio:</td>
                <td><EL value={ratio} onChange={setRatio} isReadOnly={isReadOnly} /></td>
              </tr>
              <tr>
                <td className="pit-bold">Burden:</td>
                <td><EL value={burden} onChange={setBurden} isReadOnly={isReadOnly} /></td>
              </tr>
              <tr>
                <td className="pit-bold">Accuracy Class:</td>
                <td><EL value={accuracyClass} onChange={setAccuracyClass} isReadOnly={isReadOnly} /></td>
              </tr>
              <tr>
                <td className="pit-bold">Rated Voltage Factor:</td>
                <td><EL value={voltageFactor} onChange={setVoltageFactor} isReadOnly={isReadOnly} /></td>
              </tr>
              <tr>
                <td className="pit-bold">Ref. No.:</td>
                <td><EL value={refNo} onChange={setRefNo} isReadOnly={isReadOnly} /></td>
              </tr>
              <tr>
                <td className="pit-bold">IS Standard:</td>
                <td><EL value={isStandard} onChange={setIsStandard} isReadOnly={isReadOnly} /></td>
              </tr>
            </tbody>
          </table>

          {/* ═══ ACCURACY TEST SECTION ═══ */}
          <div className="pit-section-title pit-bg-header" style={{ borderTop: '1px solid #000', marginTop: '6px' }}>
            ACCURACY TEST OF POTENTIAL TRANSFORMER
          </div>

          <table className="pit-table" style={{ marginBottom: 0 }}>
            <colgroup>
              <col style={{ width: '9%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '12%' }} />
            </colgroup>
            <thead>
              <tr>
                <th className="pit-bg-header pit-center" rowSpan={2}>Serial No. –</th>
                <th className="pit-bg-header pit-center" colSpan={1}>
                  {transformerId}
                </th>
                <th className="pit-bg-header pit-center" rowSpan={2}>Ratio<br />Error (%)</th>
                <th className="pit-bg-header pit-center" rowSpan={2}>Phase<br />Angle<br />Error (Min)</th>
              </tr>
              <tr>
                <th className="pit-bg-header pit-center" style={{ fontSize: '9px' }}>Rated Primary voltage</th>
              </tr>
            </thead>
            <tbody>
              {burdenRows.map((row, idx) => (
                <tr key={idx}>
                  <td className="pit-center pit-bold">{row.burden}</td>
                  <td className="pit-center">{row.primaryVoltage}</td>
                  <td className="pit-center">
                    <E value={row.ratioError} onChange={v => updateBurdenRow(idx, 'ratioError', v)} isReadOnly={isReadOnly} />
                  </td>
                  <td className="pit-center">
                    <E value={row.phaseError} onChange={v => updateBurdenRow(idx, 'phaseError', v)} isReadOnly={isReadOnly} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ═══ VERIFICATION ROWS ═══ */}
          <table className="pit-table" style={{ marginTop: '6px', marginBottom: 0 }}>
            <colgroup>
              <col style={{ width: '88%' }} />
              <col style={{ width: '12%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td>Verification of Terminal Marking and Polarity.</td>
                <td className="pit-center">
                  <E value={terminalMarking} onChange={setTerminalMarking} isReadOnly={isReadOnly} />
                </td>
              </tr>
              <tr>
                <td>Induced over Voltage Test on Primary Winding – 22.4 KV (Second application), For 40 Seconds at 160HZ.</td>
                <td className="pit-center">
                  <E value={inducedVoltage} onChange={setInducedVoltage} isReadOnly={isReadOnly} />
                </td>
              </tr>
              <tr>
                <td>Power Frequency Dry Withstand Test on Primary Winding &nbsp; 3 – KV, For 1 Min.</td>
                <td className="pit-center">
                  <E value={pfTestPrimary} onChange={setPfTestPrimary} isReadOnly={isReadOnly} />
                </td>
              </tr>
              <tr>
                <td>Power Frequency Dry Withstand Test on Secondary Winding &nbsp; 3 – KV, For 1 Min.</td>
                <td className="pit-center">
                  <E value={pfTestSecondary} onChange={setPfTestSecondary} isReadOnly={isReadOnly} />
                </td>
              </tr>
            </tbody>
          </table>

          {/* ═══ IR VALUES ═══ */}
          <table className="pit-table" style={{ marginTop: '6px', marginBottom: 0 }}>
            <colgroup>
              <col style={{ width: '22%' }} />
              <col style={{ width: '28%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '28%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td className="pit-bold" colSpan={4}>I.R. Values Test: –</td>
              </tr>
              <tr>
                <td className="pit-bold">Primary to Earth –</td>
                <td>
                  <E value={irPrimaryEarth} onChange={setIrPrimaryEarth} isReadOnly={isReadOnly} />
                </td>
                <td className="pit-bold">Primary to Secondary –</td>
                <td>
                  <E value={irPrimarySecondary} onChange={setIrPrimarySecondary} isReadOnly={isReadOnly} />
                </td>
              </tr>
              <tr>
                <td className="pit-bold">Secondary to Earth –</td>
                <td>
                  <E value={irSecondaryEarth} onChange={setIrSecondaryEarth} isReadOnly={isReadOnly} />
                </td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>

          {/* ═══ ACCEPTANCE ROW ═══ */}
          <table className="pit-table" style={{ marginTop: '6px' }}>
            <tbody>
              <tr>
                <td className="pit-bold">
                  {isReadOnly
                    ? acceptanceText
                    : <input
                        className="pit-input-left"
                        style={{ width: '100%' }}
                        value={acceptanceText}
                        onChange={e => setAcceptanceText(e.target.value)}
                      />
                  }
                </td>
              </tr>
            </tbody>
          </table>

          {/* ═══ DATE OF TESTING ═══ */}
          <table className="pit-table" style={{ marginTop: '6px' }}>
            <tbody>
              <tr>
                <td style={{ width: '30%' }} className="pit-bold">Date of Testing:</td>
                <td>
                  <EL value={testingDate} onChange={setTestingDate} isReadOnly={isReadOnly} />
                </td>
              </tr>
            </tbody>
          </table>

          {/* ═══ FOOTER — Signatures ═══ */}
          <table className="pit-footer">
            <tbody>
              <tr>
                <td>
                  <div className="pit-bold" style={{ fontSize: '10.5px', marginBottom: '4px' }}>Witnessed By</div>
                  <div className="pit-footer-sig">(Signature)</div>
                  <div style={{ borderTop: '1px solid #000', marginTop: '6px', paddingTop: '4px' }}>
                    {isReadOnly
                      ? <div><strong>{witnessedByName || '—'}</strong></div>
                      : <input className="pit-input-left" placeholder="Witness Name" value={witnessedByName} onChange={e => setWitnessedByName(e.target.value)} style={{ width: '100%' }} />
                    }
                    {isReadOnly
                      ? <div>{witnessedByDesig}</div>
                      : <input className="pit-input-left" placeholder="Designation" value={witnessedByDesig} onChange={e => setWitnessedByDesig(e.target.value)} style={{ width: '100%', marginTop: '3px' }} />
                    }
                    {isReadOnly
                      ? <div>{witnessedByCompany}</div>
                      : <input className="pit-input-left" placeholder="Company" value={witnessedByCompany} onChange={e => setWitnessedByCompany(e.target.value)} style={{ width: '100%', marginTop: '3px' }} />
                    }
                  </div>
                </td>

                <td>
                  <div className="pit-bold" style={{ fontSize: '10.5px', marginBottom: '4px' }}>Tested By</div>
                  <div className="pit-footer-sig">(Signature)</div>
                  <div style={{ borderTop: '1px solid #000', marginTop: '6px', paddingTop: '4px' }}>
                    {isReadOnly
                      ? <div><strong>{testedByName || '—'}</strong></div>
                      : <input className="pit-input-left" placeholder="Tester Name" value={testedByName} onChange={e => setTestedByName(e.target.value)} style={{ width: '100%' }} />
                    }
                    {isReadOnly
                      ? <div>{testedByRole}</div>
                      : <input className="pit-input-left" placeholder="Role" value={testedByRole} onChange={e => setTestedByRole(e.target.value)} style={{ width: '100%', marginTop: '3px' }} />
                    }
                    <div style={{ marginTop: '2px', fontSize: '10px' }}>For ADVENT ENGINEERS</div>
                  </div>
                </td>

                <td>
                  <div className="pit-bold" style={{ fontSize: '10.5px', marginBottom: '4px' }}>Company Seal</div>
                  <div className="pit-seal-box">
                    Seal<br />Placeholder
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

        </div>
      </div>
    </>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Save, Printer, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from '@/utils/axiosConfig';
import {
  ReportSectionTitle,
  ReportSpecBox,
  secondaryReportPrintStyles
} from './SecondaryReportPrintLayout';
import logoImage from '../../assets/d4d1bc6f9b0c444f1821bbe84a4da57caf7080d2.png';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { SecondaryMeteringReport } from './SecondaryMeteringReport';
import { SecondaryPSReport } from './SecondaryPSReport';
import { SecondaryProtectionReport } from './SecondaryProtectionReport';

interface CTInspectionReportProps {
  transformer: any;
  testerName: string;
  /** When provided, load/save from the independent CT Inspection batch collection */
  batchId?: string;
  batchTransformerId?: string;
  onSaved?: () => void;
}

const INSPECTION_PRINT_EXTRAS = `
  @media print {
    .insp-no-print { display: none !important; }
    .secondary-print-page {
      position: relative !important;
      width: 190mm !important;
      min-height: auto;
      margin: 0 auto !important;
      padding: 0 !important;
      background: #ffffff !important;
      box-shadow: none !important;
    }
    .ae-report-table select,
    .ae-report-table input,
    .ae-report-table .input-field {
      -webkit-appearance: none !important;
      appearance: none !important;
      border: none !important;
      outline: none !important;
      background: transparent !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      padding: 0 !important;
      margin: 0 !important;
      color: black !important;
      text-align: center !important;
      font-weight: bold !important;
      width: 100% !important;
    }
  }
`;

const PassFailButton = ({
  value, target, onToggle, readOnly
}: { value: string; target: string; onToggle: () => void; readOnly: boolean }) => {
  const isActive = value === target;
  return readOnly ? (
    <div className="text-center font-bold text-xs">
      {value === 'Pass' && <span className="text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">Pass</span>}
      {value === 'Fail' && <span className="text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">Fail</span>}
      {!value && <span className="text-gray-400">-</span>}
    </div>
  ) : (
    <button
      type="button"
      onClick={onToggle}
      className={`h-8 px-4 text-xs font-bold rounded-lg border transition-all ${isActive
          ? target === 'Pass'
            ? 'bg-green-600 border-green-600 text-white shadow-sm'
            : 'bg-red-600 border-red-600 text-white shadow-sm'
          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
        }`}
    >
      {target}
    </button>
  );
};

export function CTInspectionReport({ transformer, testerName, batchId, batchTransformerId, onSaved }: CTInspectionReportProps) {
  const isBatchMode = !!(batchId && batchTransformerId);
  const [readOnly, setReadOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inspectionData, setInspectionData] = useState<any>({});
  const [activeCoreTest, setActiveCoreTest] = useState<any | null>(null);

  const [polarityResult, setPolarityResult] = useState('');
  const [meggarPrimaryToSecondary, setMeggarPrimaryToSecondary] = useState('');
  const [meggarPrimaryToEarth, setMeggarPrimaryToEarth] = useState('');
  const [meggarSecondaryToEarth, setMeggarSecondaryToEarth] = useState('');
  const [meggarCoreToCore, setMeggarCoreToCore] = useState('');
  const [hvSecondaryWinding, setHvSecondaryWinding] = useState('');
  const [hvPrimaryWinding, setHvPrimaryWinding] = useState('');
  const [hvBetweenCore, setHvBetweenCore] = useState('');
  const [ovitTest, setOvitTest] = useState('');

  const [selectedCoreIndex, setSelectedCoreIndex] = useState(0);

  const testDate = new Date().toLocaleDateString('en-GB');

  const orderObj = transformer.fullOrder || transformer.orderId || {};

  // Build list of cores dynamically from the parent order specifications
  const cores = (() => {
    const list: any[] = [];
    if (orderObj.coreDetails && Array.isArray(orderObj.coreDetails)) {
      orderObj.coreDetails.forEach((coreGroup: any, idx: number) => {
        const typeStr = (coreGroup.coreType || 'Metering').toLowerCase();
        let mappedType: 'metering' | 'ps' | 'protection' = 'metering';
        if (typeStr.includes('protection')) mappedType = 'protection';
        else if (typeStr.includes('ps')) mappedType = 'ps';

        let coreId = '';
        if (mappedType === 'metering') {
          coreId = transformer.testHistory?.secondary_test?.meteringCoreId || `M-${transformer.uniqueId}-${idx + 1}`;
        } else if (mappedType === 'ps') {
          coreId = transformer.testHistory?.secondary_test?.psCoreId || `PS-${transformer.uniqueId}-${idx + 1}`;
        } else {
          coreId = transformer.testHistory?.secondary_test?.protectionCoreId || `P-${transformer.uniqueId}-${idx + 1}`;
        }

        list.push({
          coreNumber: idx + 1,
          coreType: mappedType,
          coreId: coreId,
          accuracyClass: coreGroup.accuracyClass || '0.5',
          primaryCurrent: coreGroup.primaryCurrent || '',
          secondaryCurrent: coreGroup.secondaryCurrent || '1',
          burden: coreGroup.burden || '',
          stc: coreGroup.stc || transformer.stc || 'N/A'
        });
      });
    } else {
      list.push({ 
        coreNumber: 1, 
        coreType: 'metering', 
        coreId: `M-${transformer.uniqueId}-1`, 
        accuracyClass: '0.2S',
        primaryCurrent: transformer.rating?.split('/')[0] || '',
        secondaryCurrent: transformer.ratedSecondaryCurrent || '1',
        burden: transformer.burden || '30',
        stc: transformer.stc || 'N/A'
      });
    }
    return list;
  })();

  const selectedCore = cores[selectedCoreIndex] || cores[0] || {};

  const currentRatio = (() => {
    if (selectedCore.primaryCurrent && selectedCore.secondaryCurrent) {
      return `${selectedCore.primaryCurrent}/${selectedCore.secondaryCurrent} A`;
    }
    if (orderObj?.ratio) {
      if (Array.isArray(orderObj.ratio)) {
        return orderObj.ratio.join(' - ');
      }
      return String(orderObj.ratio);
    }
    if (transformer?.rating) {
      return `${transformer.rating}/${transformer.ratedSecondaryCurrent || '1'} A`;
    }
    return 'N/A';
  })();

  // Load existing inspection data
  const load = async () => {
    try {
      // Batch mode: load from independent CT inspection collection
      const url = isBatchMode
        ? `/ct-inspection/report/${batchId}/${encodeURIComponent(batchTransformerId!)}`
        : `/final/inspection/${encodeURIComponent(transformer.uniqueId)}`;
      const res = await axios.get(url, { withCredentials: true });
      if (res.data.success) {
        const d = res.data.data;
        if (d && Object.keys(d).length > 0) {
          setInspectionData(d);
          setPolarityResult(d.polarityResult || '');
          setMeggarPrimaryToSecondary(d.meggarPrimaryToSecondary || '');
          setMeggarPrimaryToEarth(d.meggarPrimaryToEarth || '');
          setMeggarSecondaryToEarth(d.meggarSecondaryToEarth || '');
          setMeggarCoreToCore(d.meggarCoreToCore || '');
          setHvSecondaryWinding(d.hvSecondaryWinding || '');
          setHvPrimaryWinding(d.hvPrimaryWinding || '');
          setHvBetweenCore(d.hvBetweenCore || '');
          setOvitTest(d.ovitTest || '');
          setSelectedCoreIndex(d.selectedCoreIndex !== undefined ? d.selectedCoreIndex : 0);
          setReadOnly(true);
        }
      }
    } catch { /* no existing data */ }
  };

  useEffect(() => {
    if (transformer?.uniqueId) load();
  }, [transformer?.uniqueId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...inspectionData,
        polarityResult, meggarPrimaryToSecondary, meggarPrimaryToEarth,
        meggarSecondaryToEarth, meggarCoreToCore, hvSecondaryWinding,
        hvPrimaryWinding, hvBetweenCore, ovitTest,
        testerName, reportDate: new Date(),
        selectedCoreIndex
      };
      // Batch mode: save to independent CT inspection collection
      const saveUrl = isBatchMode
        ? `/ct-inspection/report/${batchId}/${encodeURIComponent(batchTransformerId!)}`
        : `/final/inspection/${encodeURIComponent(transformer.uniqueId)}`;
      const res = await axios.post(saveUrl, payload, { withCredentials: true });
      if (res.data.success) {
        toast.success('Inspection report saved successfully.');
        setReadOnly(true);
        load();
        onSaved?.();
      } else {
        toast.error(res.data.message || 'Failed to save inspection report.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save inspection report.');
    } finally {
      setSaving(false);
    }
  };

  const handleBackFromCoreTest = () => {
    setActiveCoreTest(null);
    load();
  };

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Advent_Engineers_CT_Inspection_Report_${transformer.uniqueId}`,
  });

  const togglePassFail = (setter: (v: string) => void, current: string, target: string) => {
    setter(current === target ? '' : target);
  };

  // --- SUBVIEW: ACTIVE CORE TEST ---
  if (activeCoreTest) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between no-print">
          <Button variant="outline" size="sm" onClick={handleBackFromCoreTest} className="gap-2">
            &larr; Back to Inspection Report
          </Button>
          <Badge className="bg-indigo-100 text-indigo-700 capitalize">{activeCoreTest.coreType} Core Inspection</Badge>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200">
          {activeCoreTest.coreType === 'metering' && (
            <SecondaryMeteringReport
              transformer={transformer}
              coreId={activeCoreTest.coreId}
              coreNumber={activeCoreTest.coreNumber}
              testerName={testerName}
              onBack={handleBackFromCoreTest}
              stage="inspection"
              accuracyClass={activeCoreTest.accuracyClass}
              primaryCurrent={activeCoreTest.primaryCurrent}
              secondaryCurrent={activeCoreTest.secondaryCurrent}
              order={orderObj}
            />
          )}

          {activeCoreTest.coreType === 'ps' && (
            <SecondaryPSReport
              transformer={transformer}
              coreId={activeCoreTest.coreId}
              coreNumber={activeCoreTest.coreNumber}
              testerName={testerName}
              onBack={handleBackFromCoreTest}
              stage="inspection"
              accuracyClass={activeCoreTest.accuracyClass}
              primaryCurrent={activeCoreTest.primaryCurrent}
              secondaryCurrent={activeCoreTest.secondaryCurrent}
              order={orderObj}
            />
          )}

          {activeCoreTest.coreType === 'protection' && (
            <SecondaryProtectionReport
              transformer={transformer}
              coreId={activeCoreTest.coreId}
              coreNumber={activeCoreTest.coreNumber}
              testerName={testerName}
              onBack={handleBackFromCoreTest}
              stage="inspection"
              accuracyClass={activeCoreTest.accuracyClass}
              primaryCurrent={activeCoreTest.primaryCurrent}
              secondaryCurrent={activeCoreTest.secondaryCurrent}
              order={orderObj}
            />
          )}
        </div>
      </div>
    );
  }

  // --- MAIN VIEW: CT INSPECTION REPORT ---
  return (
    <>
      <div className="w-full overflow-x-auto bg-gray-50 py-4 flex justify-start md:justify-center no-print-scroll print:block print:w-auto print:overflow-visible print:bg-white print:p-0">
        <style>{secondaryReportPrintStyles}</style>
        <style>{INSPECTION_PRINT_EXTRAS}</style>

        <div className="print-container w-[210mm] min-w-[210mm] print:w-full print:min-w-0 print:max-w-full secondary-print-page">
          {/* Toolbar */}
          <div className="flex items-center justify-between insp-no-print mb-4 w-full px-2">
            <span className="text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg font-mono">Inspection Report</span>
            <div className="flex gap-2 items-center">
              {readOnly ? (
                <Button variant="outline" size="sm" onClick={() => setReadOnly(false)} className="gap-2">
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

          {/* Printable Report */}
          <div ref={printRef} id="ct-inspection-printable-report" className="report-wrapper secondary-report-wrapper">
            {/* Header — identical to FinalTestReport */}
            <header className="ae-report-header secondary-report-header">
              <div className="ae-logo-panel">
                <ImageWithFallback src={logoImage} alt="Advent Logo" className="ae-logo-image" />
              </div>
              <div className="ae-title-panel">
                <h1>ADVENT ENGINEERS</h1>
                <div className="ae-document-title">CURRENT TRANSFORMER TEST REPORT</div>
                <div className="ae-tagline">Excellence in Transformer Core Testing</div>
              </div>
              <div className="ae-meta-panel">
                <div><strong>Date:</strong> {testDate}</div>
                <div><strong>Order No:</strong> {transformer.jobId || transformer.uniqueId || '-'}</div>
                <div><strong>Client:</strong> {transformer.clientName || '-'}</div>
                <div><strong>Unit No:</strong> {transformer.uniqueId || '-'}</div>
                <div><strong>Class:</strong> {selectedCore.accuracyClass || '-'}</div>
              </div>
              <div className="ae-banner">INSPECTION RECORD OF CURRENT TRANSFORMER</div>
            </header>

            {/* Specification & Core Selection Override */}
            <div className="ae-section-container">
              <ReportSectionTitle index={1} title="Inspection Record of Current Transformer" />

              {!readOnly ? (
                <div className="insp-no-print flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg mb-4">
                  <div className="w-64">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Core for Specifications</label>
                    <select
                      className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm bg-white font-medium"
                      value={selectedCoreIndex}
                      onChange={(e) => setSelectedCoreIndex(Number(e.target.value))}
                    >
                      {cores.map((c: any, idx: number) => (
                        <option key={idx} value={idx}>
                          Core {c.coreNumber} ({c.coreType.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-slate-500 mt-5">Specifications are populated automatically from order core details.</p>
                </div>
              ) : null}

              <ReportSpecBox
                items={[
                  { label: 'Specification', value: `${transformer.voltageRating || '33'} KV` },
                  { label: 'CT Ratio', value: currentRatio },
                  { label: 'Burden', value: `${selectedCore.burden || transformer.burden || '30'} VA` },
                  { label: 'Class', value: selectedCore.accuracyClass || '0.5' },
                  { label: 'STC', value: selectedCore.stc || 'N/A' }
                ]}
              />
            </div>

            {/* Core Test Status cards */}
            <div className="ae-section-container mt-6 insp-no-print">
              <ReportSectionTitle index={2} title="Inspection Core Test Status" />
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-sm font-semibold text-slate-700 mb-3">Perform and verify individual core test readings for this inspection report:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {cores.map((core: any, index: number) => {
                    const isTested = !!(inspectionData?.coreTests?.[core.coreId]);
                    return (
                      <div key={core.coreId} className="flex flex-col p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-slate-300 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase text-slate-500">Core {core.coreNumber}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isTested ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {isTested ? 'Tested' : 'Pending'}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-slate-800 capitalize">{core.coreType} Core</span>
                        <span className="text-xs text-slate-500 font-mono mt-0.5">{core.coreId}</span>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          className="mt-3 w-full border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-semibold"
                          onClick={() => {
                            setActiveCoreTest(core);
                          }}
                        >
                          {isTested ? 'Review readings' : 'Test core'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Inspection Testing Table */}
            <div className="ae-section-container mt-6">
              <table className="ae-report-table secondary-report-table w-full">
                <thead>
                  <tr>
                    <th style={{ width: '65%', textAlign: 'left', paddingLeft: '16px' }}>Inspection Testing</th>
                    <th style={{ width: '35%', textAlign: 'right', paddingRight: '16px', fontSize: '11px', fontWeight: 'normal' }}>Date: {testDate}</th>
                  </tr>
                </thead>
                <tbody>
                  {/* 2. Polarity */}
                  <tr>
                    <td className="text-left font-semibold p-2" style={{ paddingLeft: '16px' }}>2. Polarity Testing</td>
                    <td className="p-1">
                      <div className="flex gap-2 justify-center py-0.5">
                        <PassFailButton value={polarityResult} target="Pass" readOnly={readOnly}
                          onToggle={() => togglePassFail(setPolarityResult, polarityResult, 'Pass')} />
                        {!readOnly && <PassFailButton value={polarityResult} target="Fail" readOnly={readOnly}
                          onToggle={() => togglePassFail(setPolarityResult, polarityResult, 'Fail')} />}
                        {readOnly && !polarityResult && <span className="text-gray-400 text-xs text-center w-full block">-</span>}
                      </div>
                    </td>
                  </tr>

                  {/* 3. Meggar */}
                  <tr className="bg-gray-50/50">
                    <td colSpan={2} className="text-left font-bold p-2" style={{ paddingLeft: '16px' }}>3. Meggar Test</td>
                  </tr>
                  {[
                    { label: 'a) Primary to Secondary', val: meggarPrimaryToSecondary, set: setMeggarPrimaryToSecondary },
                    { label: 'b) Primary to Earth', val: meggarPrimaryToEarth, set: setMeggarPrimaryToEarth },
                    { label: 'c) Secondary to Earth', val: meggarSecondaryToEarth, set: setMeggarSecondaryToEarth },
                    { label: 'd) Core to Core', val: meggarCoreToCore, set: setMeggarCoreToCore },
                  ].map(row => (
                    <tr key={row.label}>
                      <td className="text-left p-2" style={{ paddingLeft: '32px' }}>{row.label}</td>
                      <td className="p-1">
                        <input className="input-field w-full text-center h-8" placeholder="Enter value"
                          value={row.val} onChange={e => row.set(e.target.value)} disabled={readOnly} />
                      </td>
                    </tr>
                  ))}

                  {/* 4-7. HV Tests + OVIT */}
                  {[
                    { label: '4. H.V. Test on Secondary Winding', val: hvSecondaryWinding, set: setHvSecondaryWinding },
                    { label: '5. H.V. Test on Primary Winding', val: hvPrimaryWinding, set: setHvPrimaryWinding },
                    { label: '6. H.V. Test between Core', val: hvBetweenCore, set: setHvBetweenCore },
                    { label: '7. O.V.I.T. Test', val: ovitTest, set: setOvitTest },
                  ].map(row => (
                    <tr key={row.label}>
                      <td className="text-left font-semibold p-2" style={{ paddingLeft: '16px' }}>{row.label}</td>
                      <td className="p-1">
                        <div className="flex gap-2 justify-center py-0.5">
                          {readOnly ? (
                            <div className="text-center font-bold text-xs w-full">
                              {row.val === 'Pass' && <span className="text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">Pass</span>}
                              {row.val === 'Fail' && <span className="text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">Fail</span>}
                              {!row.val && <span className="text-gray-400">-</span>}
                            </div>
                          ) : (
                            <>
                              <PassFailButton value={row.val} target="Pass" readOnly={false}
                                onToggle={() => togglePassFail(row.set, row.val, 'Pass')} />
                              <PassFailButton value={row.val} target="Fail" readOnly={false}
                                onToggle={() => togglePassFail(row.set, row.val, 'Fail')} />
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── INSPECTION SIGNATURES (3 blocks) ── */}
            <div className="report-signatures ae-footer-sig secondary-signatures" style={{ marginTop: 'auto', paddingTop: '24px' }}>
              <div className="signature-column ae-sig-block" style={{ textAlign: 'center' }}>
                <div className="signature-line" style={{ margin: '0 auto 6px', width: '80%', borderBottom: '1px solid #000', height: '32px' }} />
                <div className="signature-label" style={{ fontWeight: 'bold', fontSize: '11px' }}>Witnessed By</div>
              </div>
              <div className="signature-column ae-sig-block" style={{ textAlign: 'center' }}>
                <div className="signature-space ae-sig-name" style={{ minHeight: '20px' }}>
                  {testerName || 'Testing Engineer'}
                </div>
                <div className="signature-line" style={{ margin: '0 auto 6px', width: '80%', borderBottom: '1px solid #000', height: '12px' }} />
                <div className="signature-label" style={{ fontWeight: 'bold', fontSize: '11px' }}>Testing Engineer</div>
              </div>
              <div className="signature-column ae-sig-block" style={{ textAlign: 'center' }}>
                <div className="signature-line" style={{ margin: '0 auto 6px', width: '80%', borderBottom: '1px solid #000', height: '32px' }} />
                <div className="signature-label" style={{ fontWeight: 'bold', fontSize: '11px' }}>Authorized Signatory</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

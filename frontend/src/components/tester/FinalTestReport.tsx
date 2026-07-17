import { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '../ui/button';
import { ArrowLeft, Save, Printer, AlertTriangle, ChevronRight } from 'lucide-react';
import { FinalTransformer } from './FinalTransformersList';
import { toast } from 'sonner';
import axios from '@/utils/axiosConfig';
import { useCTTimer } from '../../utils/useCTTimer';
import {
  ReportSectionTitle,
  ReportSpecBox,
  ReportSignatures,
  secondaryReportPrintStyles
} from './SecondaryReportPrintLayout';
import logoImage from '../../assets/d4d1bc6f9b0c444f1821bbe84a4da57caf7080d2.png';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface FinalTestReportProps {
  transformer: FinalTransformer;
  testerName: string;
  onBack: () => void;
  onApprove?: () => void;
  readOnly?: boolean;
  onNext?: () => void;
  onSaveSuccess?: () => void;
}

export function FinalTestReport({
  transformer,
  testerName,
  onBack,
  onApprove,
  readOnly = false,
  onNext,
  onSaveSuccess,
}: FinalTestReportProps) {
  // ── CT Delay Timer (tracking-only, non-blocking) ─────────────────────────
  const { timeLeftMs, isOverdue, expectedMinutes, endTimer } = useCTTimer({
    transformerId: transformer?.uniqueId || '',
    orderId: (transformer as any)?.orderId?._id || (transformer as any)?.orderId || '',
    jobId: (transformer as any)?.jobId || '',
    stage: 'final',
    testerName: testerName || 'Final Tester',
    role: 'final-tester',
    coreCount: transformer?.cores?.length || 1,
    enabled: !!transformer?.uniqueId
  });

  const testDate = transformer.testHistory?.final_test?.reportDate
    ? new Date(transformer.testHistory.final_test.reportDate).toLocaleDateString('en-GB')
    : new Date().toLocaleDateString('en-GB');

  const generalRatio = (() => {
    const orderObj = (transformer as any).fullOrder || (transformer as any).orderId;
    if (orderObj?.ratio) {
      if (Array.isArray(orderObj.ratio)) {
        return orderObj.ratio.join(' - ');
      }
      return String(orderObj.ratio);
    }
    if (transformer.rating) {
      return `${transformer.rating}/${transformer.ratedSecondaryCurrent || '1'} A`;
    }
    return 'N/A';
  })();

  // Polarity Testing
  const [polarityResult, setPolarityResult] = useState('');

  // Meggar Test
  const [meggarPrimaryToSecondary, setMeggarPrimaryToSecondary] = useState('');
  const [meggarPrimaryToEarth, setMeggarPrimaryToEarth] = useState('');
  const [meggarSecondaryToEarth, setMeggarSecondaryToEarth] = useState('');
  const [meggarCoreToCore, setMeggarCoreToCore] = useState('');

  // H.V. Test on Secondary Winding
  const [hvSecondaryWinding, setHvSecondaryWinding] = useState('');

  // H.V. Test on Primary Winding
  const [hvPrimaryWinding, setHvPrimaryWinding] = useState('');

  // H.V. Test between Core
  const [hvBetweenCore, setHvBetweenCore] = useState('');

  // O.V.I.T. Test
  const [ovitTest, setOvitTest] = useState('');

  // Effect to load existing data if available (for Admin View or Re-editing)
  useEffect(() => {
    if (transformer.testHistory?.final_test) {
      const history = transformer.testHistory.final_test;
      setPolarityResult(history.polarityResult || '');
      setMeggarPrimaryToSecondary(history.meggarPrimaryToSecondary || '');
      setMeggarPrimaryToEarth(history.meggarPrimaryToEarth || '');
      setMeggarSecondaryToEarth(history.meggarSecondaryToEarth || '');
      setMeggarCoreToCore(history.meggarCoreToCore || '');
      setHvSecondaryWinding(history.hvSecondaryWinding || '');
      setHvPrimaryWinding(history.hvPrimaryWinding || '');
      setHvBetweenCore(history.hvBetweenCore || '');
      setOvitTest(history.ovitTest || '');
    }
  }, [transformer]);

  const parseMeggar = (val: string) => {
    if (!val) return null;
    if (val.toLowerCase().includes('ok') || val.includes('>')) return 999999;
    const parsed = parseFloat(val.replace(/[^0-9.]/g, ''));
    return isNaN(parsed) ? null : parsed;
  };

  const m1 = parseMeggar(meggarPrimaryToSecondary);
  const m2 = parseMeggar(meggarPrimaryToEarth);
  const m3 = parseMeggar(meggarSecondaryToEarth);
  const m4 = parseMeggar(meggarCoreToCore);

  // Insulation resistance should be HIGH. Fail only if it is explicitly BELOW threshold.
  const isM1Fail = m1 !== null && m1 < 1000;
  const isM2Fail = m2 !== null && m2 < 1000;
  const isM3Fail = m3 !== null && m3 < 500;
  const isM4Fail = m4 !== null && m4 < 200;

  const getValidationFailures = () => {
    const failures: string[] = [];
    if (polarityResult === 'Fail') failures.push('Polarity: Fail');
    if (hvSecondaryWinding === 'Fail') failures.push('HV Secondary: Fail');
    if (hvPrimaryWinding === 'Fail') failures.push('HV Primary: Fail');
    if (hvBetweenCore === 'Fail') failures.push('HV Between Core: Fail');
    if (ovitTest === 'Fail') failures.push('OVIT: Fail');

    if (isM1Fail) failures.push(`Meggar Pri-Sec < 1000 (${meggarPrimaryToSecondary})`);
    if (isM2Fail) failures.push(`Meggar Pri-Earth < 1000 (${meggarPrimaryToEarth})`);
    if (isM3Fail) failures.push(`Meggar Sec-Earth < 500 (${meggarSecondaryToEarth})`);
    if (isM4Fail) failures.push(`Meggar Core-Core < 200 (${meggarCoreToCore})`);

    return failures;
  };

  const validationFailures = getValidationFailures();
  const hasFailures = validationFailures.length > 0;

  const isComplete = polarityResult && hvSecondaryWinding && hvPrimaryWinding &&
    hvBetweenCore && ovitTest && meggarPrimaryToSecondary &&
    meggarPrimaryToEarth && meggarSecondaryToEarth && meggarCoreToCore;

  const comprehensiveComplete = isComplete && !hasFailures;

  const finalHistory = transformer.testHistory?.final_test || {};
  const meteringCores = new Set((finalHistory.metering_results || []).map((r: any) => r.internalCoreNo || r.coreId));
  const psCores = new Set((finalHistory.ps_results || []).map((r: any) => r.internalCoreNo || r.coreId));
  const protectionCores = new Set((finalHistory.protection_results || []).map((r: any) => r.internalCoreNo || r.coreId));
  const actualCoresCount = new Set([...meteringCores, ...psCores, ...protectionCores]).size;
  const expectedCoresCount = transformer.cores?.length || 0;
  const coresComplete = actualCoresCount >= expectedCoresCount;

  const handleSaveAndApprove = async () => {
    if (!coresComplete) {
      toast.error("Please complete all Core Tests before approving.");
      return;
    }
    const success = await handleSave();
    if (success && onApprove) {
      endTimer(); // Record CT final timer end
      onApprove();
    }
  };

  const handleSave = async (skipValidation = false) => {
    try {
      if (hasFailures && !skipValidation) {
        toast.error("There are failed conditions. Please use 'Add to Failed Transformer' instead.");
        return false;
      }

      const payload = {
        polarityResult,
        meggarPrimaryToSecondary,
        meggarPrimaryToEarth,
        meggarSecondaryToEarth,
        meggarCoreToCore,
        hvSecondaryWinding,
        hvPrimaryWinding,
        hvBetweenCore,
        ovitTest,
        testerName: testerName,
        reportDate: new Date()
      };

      const response = await axios.post(`/final/${encodeURIComponent(transformer.uniqueId)}`, payload, {
        withCredentials: true
      });

      if (response.data.success) {
        toast.success("Final readings saved successfully!");
        if (onSaveSuccess) onSaveSuccess();
        return true;
      }
      return false;
    } catch (err: any) {
      console.error("Error saving final readings:", err);
      toast.error(err.response?.data?.message || "Failed to save final readings");
      return false;
    }
  };

  const handleMarkAsFailed = async () => {
    if (readOnly) return;

    try {
      // Persist the entered test values to the transformer's history first
      // The backend finalTestRoutes.js will automatically detect the failure limits
      // and log it to FailedTransformerModel with coreType: "COMPLETE UNIT"
      const success = await handleSave(true);

      if (success) {
        toast.success("Transformer added to failed list successfully.");
        if (onBack) onBack();
      } else {
        toast.error("Failed to add to failed transformers.");
      }
    } catch (error: any) {
      console.error("Mark as failed error:", error);
      toast.error(error.response?.data?.message || "Error adding to failed transformers");
    }
  };

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Advent_Engineers_Final_Test_Report_${transformer.uniqueId}`,
  });

  const accuracyClass = (transformer.cores && transformer.cores.map((c: any) => c.accuracyClass).filter(Boolean).join('/')) || 'N/A';

  return (
    <>
      <div className="space-y-6">

        <div className="w-full overflow-x-auto bg-gray-50 py-4 flex justify-start md:justify-center no-print-scroll print:block print:w-auto print:overflow-visible print:bg-white print:p-0">
          <style>{secondaryReportPrintStyles}</style>
          <style>{`
            @media print {
              .secondary-print-page {
                position: relative !important;
                width: 190mm !important;
                min-height: auto;
                margin: 0 auto !important;
                padding: 0 !important;
                background: #ffffff !important;
                box-shadow: none !important;
              }
              .no-print {
                display: none !important;
              }
              
              /* Clean fields on print */
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
              /* Hide select dropdown arrows on print */
              select {
                background-image: none !important;
              }
            }
          `}</style>

          <div className="print-container w-[210mm] min-w-[210mm] print:w-full print:min-w-0 print:max-w-full secondary-print-page">
            {/* Top Navigation / Controls */}
            <div className="flex items-center justify-between no-print mb-4 w-full px-2">
              <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="flex gap-2 items-center">
                {!readOnly && (
                  <Button
                    onClick={() => handleSave()}
                    variant="outline"
                    size="sm"
                    className="gap-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </Button>
                )}
                {!readOnly && comprehensiveComplete && !coresComplete && (
                  <div className="flex items-center text-amber-600 font-semibold gap-2 border border-amber-200 bg-amber-50 px-3 py-1.5 rounded-lg text-xs animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Core Tests Pending
                  </div>
                )}
                {!readOnly && hasFailures && (
                  <Button variant="destructive" size="sm" onClick={handleMarkAsFailed} className="gap-2">
                    <AlertTriangle className="w-4 h-4" /> Add to Failed Transformer
                  </Button>
                )}
                {onNext && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onNext}
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all duration-200 hover:scale-105"
                  >
                    Next Core <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
              </div>
            </div>

            {/* A4 Report Wrapper */}
            <div ref={printRef} id="final-printable-report" className="report-wrapper secondary-report-wrapper">
              {/* Header */}
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
                  <div><strong>Class:</strong> {accuracyClass || '-'}</div>
                </div>
                <div className="ae-banner">FINAL TESTING RECORD OF CURRENT TRANSFORMER</div>
              </header>

              {/* Specification / Core Info */}
              <div className="ae-section-container">
                <ReportSectionTitle index={1} title="Testing Record of Current Transformer" />
                <ReportSpecBox
                  items={[
                    { label: 'Specification', value: `${transformer.voltageRating || '33'} KV` },
                    { label: 'CT Ratio', value: generalRatio },
                    { label: 'Burden', value: `${transformer.burden || '30'} VA` },
                    { label: 'Class', value: accuracyClass },
                    { label: 'STC', value: transformer.stc || 'N/A' }
                  ]}
                />
              </div>

              {/* Final Testing Section Table */}
              <div className="ae-section-container mt-6">
                <table className="ae-report-table secondary-report-table w-full">
                  <thead>
                    <tr>
                      <th style={{ width: '65%', textAlign: 'left', paddingLeft: '16px' }}>
                        Final Testing
                      </th>
                      <th style={{ width: '35%', textAlign: 'right', paddingRight: '16px', fontSize: '11px', fontWeight: 'normal' }}>
                        Date: {testDate}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 2. Polarity Testing */}
                    <tr>
                      <td className="text-left font-semibold p-2" style={{ paddingLeft: '16px' }}>
                        2. Polarity Testing
                      </td>
                      <td className="p-1">
                        {readOnly ? (
                          <div className="text-center font-bold text-xs">
                            {polarityResult === 'Pass' && <span className="text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">Pass</span>}
                            {polarityResult === 'Fail' && <span className="text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">Fail</span>}
                            {!polarityResult && <span className="text-gray-400">-</span>}
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-center py-0.5">
                            <button
                              type="button"
                              onClick={() => setPolarityResult(polarityResult === 'Pass' ? '' : 'Pass')}
                              className={`h-8 px-4 text-xs font-bold rounded-lg border transition-all ${
                                polarityResult === 'Pass'
                                  ? 'bg-green-600 border-green-600 text-white shadow-sm'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              Pass
                            </button>
                            <button
                              type="button"
                              onClick={() => setPolarityResult(polarityResult === 'Fail' ? '' : 'Fail')}
                              className={`h-8 px-4 text-xs font-bold rounded-lg border transition-all ${
                                polarityResult === 'Fail'
                                  ? 'bg-red-600 border-red-600 text-white shadow-sm'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              Fail
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* 3. Meggar Test Section Header */}
                    <tr className="bg-gray-50/50">
                      <td colSpan={2} className="text-left font-bold p-2" style={{ paddingLeft: '16px' }}>
                        3. Meggar Test
                      </td>
                    </tr>

                    {/* a) Primary to Secondary */}
                    <tr>
                      <td className="text-left p-2" style={{ paddingLeft: '32px' }}>
                        a) Primary to Secondary
                      </td>
                      <td className="p-1">
                        <input
                          className={`input-field w-full text-center h-8 ${isM1Fail ? 'invalid-reading' : ''}`}
                          placeholder="Enter value"
                          value={meggarPrimaryToSecondary}
                          onChange={(e) => setMeggarPrimaryToSecondary(e.target.value)}
                          disabled={readOnly}
                        />
                      </td>
                    </tr>

                    {/* b) Primary to Earth */}
                    <tr>
                      <td className="text-left p-2" style={{ paddingLeft: '32px' }}>
                        b) Primary to Earth
                      </td>
                      <td className="p-1">
                        <input
                          className={`input-field w-full text-center h-8 ${isM2Fail ? 'invalid-reading' : ''}`}
                          placeholder="Enter value"
                          value={meggarPrimaryToEarth}
                          onChange={(e) => setMeggarPrimaryToEarth(e.target.value)}
                          disabled={readOnly}
                        />
                      </td>
                    </tr>

                    {/* c) Secondary to Earth */}
                    <tr>
                      <td className="text-left p-2" style={{ paddingLeft: '32px' }}>
                        c) Secondary to Earth
                      </td>
                      <td className="p-1">
                        <input
                          className={`input-field w-full text-center h-8 ${isM3Fail ? 'invalid-reading' : ''}`}
                          placeholder="Enter value"
                          value={meggarSecondaryToEarth}
                          onChange={(e) => setMeggarSecondaryToEarth(e.target.value)}
                          disabled={readOnly}
                        />
                      </td>
                    </tr>

                    {/* d) Core to Core */}
                    <tr>
                      <td className="text-left p-2" style={{ paddingLeft: '32px' }}>
                        d) Core to Core
                      </td>
                      <td className="p-1">
                        <input
                          className={`input-field w-full text-center h-8 ${isM4Fail ? 'invalid-reading' : ''}`}
                          placeholder="Enter value"
                          value={meggarCoreToCore}
                          onChange={(e) => setMeggarCoreToCore(e.target.value)}
                          disabled={readOnly}
                        />
                      </td>
                    </tr>

                    {/* 4. H.V. Test on Secondary Winding */}
                    <tr>
                      <td className="text-left font-semibold p-2" style={{ paddingLeft: '16px' }}>
                        4. H.V. Test on Secondary Winding
                      </td>
                      <td className="p-1">
                        {readOnly ? (
                          <div className="text-center font-bold text-xs">
                            {hvSecondaryWinding === 'Pass' && <span className="text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">Pass</span>}
                            {hvSecondaryWinding === 'Fail' && <span className="text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">Fail</span>}
                            {!hvSecondaryWinding && <span className="text-gray-400">-</span>}
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-center py-0.5">
                            <button
                              type="button"
                              onClick={() => setHvSecondaryWinding(hvSecondaryWinding === 'Pass' ? '' : 'Pass')}
                              className={`h-8 px-4 text-xs font-bold rounded-lg border transition-all ${
                                hvSecondaryWinding === 'Pass'
                                  ? 'bg-green-600 border-green-600 text-white shadow-sm'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              Pass
                            </button>
                            <button
                              type="button"
                              onClick={() => setHvSecondaryWinding(hvSecondaryWinding === 'Fail' ? '' : 'Fail')}
                              className={`h-8 px-4 text-xs font-bold rounded-lg border transition-all ${
                                hvSecondaryWinding === 'Fail'
                                  ? 'bg-red-600 border-red-600 text-white shadow-sm'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              Fail
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* 5. H.V. Test on Primary Winding */}
                    <tr>
                      <td className="text-left font-semibold p-2" style={{ paddingLeft: '16px' }}>
                        5. H.V. Test on Primary Winding
                      </td>
                      <td className="p-1">
                        {readOnly ? (
                          <div className="text-center font-bold text-xs">
                            {hvPrimaryWinding === 'Pass' && <span className="text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">Pass</span>}
                            {hvPrimaryWinding === 'Fail' && <span className="text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">Fail</span>}
                            {!hvPrimaryWinding && <span className="text-gray-400">-</span>}
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-center py-0.5">
                            <button
                              type="button"
                              onClick={() => setHvPrimaryWinding(hvPrimaryWinding === 'Pass' ? '' : 'Pass')}
                              className={`h-8 px-4 text-xs font-bold rounded-lg border transition-all ${
                                hvPrimaryWinding === 'Pass'
                                  ? 'bg-green-600 border-green-600 text-white shadow-sm'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              Pass
                            </button>
                            <button
                              type="button"
                              onClick={() => setHvPrimaryWinding(hvPrimaryWinding === 'Fail' ? '' : 'Fail')}
                              className={`h-8 px-4 text-xs font-bold rounded-lg border transition-all ${
                                hvPrimaryWinding === 'Fail'
                                  ? 'bg-red-600 border-red-600 text-white shadow-sm'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              Fail
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* 6. H.V. Test between Core */}
                    <tr>
                      <td className="text-left font-semibold p-2" style={{ paddingLeft: '16px' }}>
                        6. H.V. Test between Core
                      </td>
                      <td className="p-1">
                        {readOnly ? (
                          <div className="text-center font-bold text-xs">
                            {hvBetweenCore === 'Pass' && <span className="text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">Pass</span>}
                            {hvBetweenCore === 'Fail' && <span className="text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">Fail</span>}
                            {!hvBetweenCore && <span className="text-gray-400">-</span>}
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-center py-0.5">
                            <button
                              type="button"
                              onClick={() => setHvBetweenCore(hvBetweenCore === 'Pass' ? '' : 'Pass')}
                              className={`h-8 px-4 text-xs font-bold rounded-lg border transition-all ${
                                hvBetweenCore === 'Pass'
                                  ? 'bg-green-600 border-green-600 text-white shadow-sm'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              Pass
                            </button>
                            <button
                              type="button"
                              onClick={() => setHvBetweenCore(hvBetweenCore === 'Fail' ? '' : 'Fail')}
                              className={`h-8 px-4 text-xs font-bold rounded-lg border transition-all ${
                                hvBetweenCore === 'Fail'
                                  ? 'bg-red-600 border-red-600 text-white shadow-sm'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              Fail
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* 7. O.V.I.T. Test */}
                    <tr>
                      <td className="text-left font-semibold p-2" style={{ paddingLeft: '16px' }}>
                        7. O.V.I.T. Test
                      </td>
                      <td className="p-1">
                        {readOnly ? (
                          <div className="text-center font-bold text-xs">
                            {ovitTest === 'Pass' && <span className="text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">Pass</span>}
                            {ovitTest === 'Fail' && <span className="text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">Fail</span>}
                            {!ovitTest && <span className="text-gray-400">-</span>}
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-center py-0.5">
                            <button
                              type="button"
                              onClick={() => setOvitTest(ovitTest === 'Pass' ? '' : 'Pass')}
                              className={`h-8 px-4 text-xs font-bold rounded-lg border transition-all ${
                                ovitTest === 'Pass'
                                  ? 'bg-green-600 border-green-600 text-white shadow-sm'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              Pass
                            </button>
                            <button
                              type="button"
                              onClick={() => setOvitTest(ovitTest === 'Fail' ? '' : 'Fail')}
                              className={`h-8 px-4 text-xs font-bold rounded-lg border transition-all ${
                                ovitTest === 'Fail'
                                  ? 'bg-red-600 border-red-600 text-white shadow-sm'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              Fail
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <ReportSignatures testerName={testerName} />
            </div>

            {/* Actions Toolbar at bottom (Screen only) */}
            {!readOnly && (
              <div className="no-print mt-6 flex flex-col gap-4">
                {hasFailures && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-600 text-sm font-semibold">
                    Failure Limits Reached: {validationFailures.join(', ')}
                  </div>
                )}
                {comprehensiveComplete && coresComplete && (
                  <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex justify-end">
                    <Button
                      onClick={handleSaveAndApprove}
                      className="bg-green-600 text-white hover:bg-green-700 gap-2 font-bold px-6 shadow-md transition-all hover:scale-105"
                    >
                      <Save className="w-4 h-4" />
                      APPROVE & FINISH UNIT
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}


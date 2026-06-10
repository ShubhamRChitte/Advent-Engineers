import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ArrowLeft, Save, Download, Printer, AlertTriangle } from 'lucide-react';
import { FinalTransformer } from './FinalTransformersList';
import { toast } from 'sonner';
import axios from 'axios';
import { useCTTimer } from '../../utils/useCTTimer';
import { CTTimerBadge } from './CTTimerBadge';

interface FinalTestReportProps {
  transformer: FinalTransformer;
  testerName: string;
  onBack: () => void;
  onApprove?: () => void;
}

export function FinalTestReport({
  transformer,
  testerName,
  onBack,
  onApprove,
}: FinalTestReportProps) {
  // ── CT Delay Timer (tracking-only, non-blocking) ─────────────────────────
  const { timeLeftMs, isOverdue, expectedMinutes, endTimer } = useCTTimer({
    transformerId: transformer?.uniqueId || '',
    orderId:       (transformer as any)?.orderId?._id || (transformer as any)?.orderId || '',
    jobId:         (transformer as any)?.jobId || '',
    stage:         'final',
    testerName:    testerName || 'Final Tester',
    role:          'final-tester',
    coreCount:     transformer?.cores?.length || 1,
    enabled:       !!transformer?.uniqueId
  });

  const testDate = transformer.testHistory?.final_test?.reportDate
    ? new Date(transformer.testHistory.final_test.reportDate).toLocaleDateString('en-GB')
    : new Date().toLocaleDateString('en-GB');

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
      if (history.polarityResult) setPolarityResult(history.polarityResult);
      if (history.meggarPrimaryToSecondary) setMeggarPrimaryToSecondary(history.meggarPrimaryToSecondary);
      if (history.meggarPrimaryToEarth) setMeggarPrimaryToEarth(history.meggarPrimaryToEarth);
      if (history.meggarSecondaryToEarth) setMeggarSecondaryToEarth(history.meggarSecondaryToEarth);
      if (history.meggarCoreToCore) setMeggarCoreToCore(history.meggarCoreToCore);
      if (history.hvSecondaryWinding) setHvSecondaryWinding(history.hvSecondaryWinding);
      if (history.hvPrimaryWinding) setHvPrimaryWinding(history.hvPrimaryWinding);
      if (history.hvBetweenCore) setHvBetweenCore(history.hvBetweenCore);
      if (history.ovitTest) setOvitTest(history.ovitTest);
    }
  }, [transformer]);

  // Accuracy Test (Removed per new workflow rules)

  const getValidationFailures = () => {
    const failures: string[] = [];
    if (polarityResult === 'Fail') failures.push('Polarity: Fail');
    if (hvSecondaryWinding === 'Fail') failures.push('HV Secondary: Fail');
    if (hvPrimaryWinding === 'Fail') failures.push('HV Primary: Fail');
    if (hvBetweenCore === 'Fail') failures.push('HV Between Core: Fail');
    if (ovitTest === 'Fail') failures.push('OVIT: Fail');

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
    if (m1 !== null && m1 < 1000) failures.push(`Meggar Pri-Sec < 1000 (${meggarPrimaryToSecondary})`);
    if (m2 !== null && m2 < 1000) failures.push(`Meggar Pri-Earth < 1000 (${meggarPrimaryToEarth})`);
    if (m3 !== null && m3 < 500) failures.push(`Meggar Sec-Earth < 500 (${meggarSecondaryToEarth})`);
    if (m4 !== null && m4 < 200) failures.push(`Meggar Core-Core < 200 (${meggarCoreToCore})`);

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

  const handleSave = async () => {
    try {
      if (hasFailures) {
        toast.error("There are failed conditions. Please use 'Mark as Failed Core' instead.");
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

      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/final/${encodeURIComponent(transformer.uniqueId)}`, payload, {
        withCredentials: true
      });

      if (response.data.success) {
        toast.success("Final readings saved successfully!");
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
    const finalReason = getValidationFailures().join(' | ') || "Failed during final testing.";

    try {
      // Persist the actual test data first
      const testPayload = {
        polarityResult, meggarPrimaryToSecondary, meggarPrimaryToEarth, meggarSecondaryToEarth, meggarCoreToCore,
        hvSecondaryWinding, hvPrimaryWinding, hvBetweenCore, ovitTest
      };
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/final/${encodeURIComponent(transformer.uniqueId)}`, testPayload, { withCredentials: true });

      const payload = {
        orderId: (transformer as any).orderId?._id || (transformer as any).orderId,
        internalCoreNo: transformer.uniqueId,
        failureReason: finalReason,
        failureStage: 'FINAL_QA', // Dynamic depending on specific exact stage if necessary
      };

      const failedRes = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/failed-cores`, payload, { withCredentials: true });
      if (failedRes.data?.success || failedRes.status === 200 || failedRes.status === 201) {
        toast.success("Transformer marked as failed successfully.");
        if (onBack) onBack();
      }
    } catch (error: any) {
      console.error("Mark as failed error:", error);
      toast.error(error.response?.data?.message || "Error adding to failed cores");
    }
  };

  const handleGenerateAndSave = async () => {
    try {
      if (hasFailures) {
        toast.error("Cannot generate report with failed tests.");
        return;
      }
      if (!isComplete) {
        toast.error("Please fill all the readings.");
        return;
      }

      const reportData = {
        transformerId: transformer.uniqueId,
        transformerName: transformer.name,
        rating: transformer.rating,
        voltageClass: transformer.voltageClass,
        testerName,
        polarityResult,
        meggarPrimaryToSecondary,
        meggarPrimaryToEarth,
        meggarSecondaryToEarth,
        meggarCoreToCore,
        hvSecondaryWinding,
        hvPrimaryWinding,
        hvBetweenCore,
        ovitTest,
      };

      // 1. Save directly to FinalReportData
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/final/${encodeURIComponent(transformer.uniqueId)}/generate-save`, reportData, {
        withCredentials: true
      });

      if (res.data.success) {
        toast.success("Final report data saved successfully!");
        endTimer(); // Record CT final timer end
        if (onBack) onBack();
      } else {
        toast.error(res.data.message || 'Failed to save final test record.');
      }
    } catch (err: any) {
      console.error("Save final report error:", err);
      toast.error(err.response?.data?.message || 'Error occurred while saving report.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
    <div className="space-y-6">
      <CTTimerBadge 
        timeLeftMs={timeLeftMs} 
        isOverdue={isOverdue} 
        expectedMinutes={expectedMinutes} 
        title="Final Testing"
      />
      <style>{`
        #print-section {
          background: white;
          padding: 5mm 10mm;
          min-height: 297mm;
          width: 100%;
          box-sizing: border-box;
          color: black;
          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }
        
        .report-header-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border: 1.5px solid #000;
          margin-bottom: 0;
        }
        
        .header-left {
          padding: 10px;
          border-right: 1.5px solid #000;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .header-right {
          display: grid;
          grid-template-rows: repeat(5, 1fr);
        }
        
        .header-field {
          display: grid;
          grid-template-columns: 100px 1fr;
          border-bottom: 1px solid #000;
          font-size: 11px;
        }
        
        .header-field:last-child {
          border-bottom: none;
        }
        
        .field-label {
          padding: 4px 8px;
          border-right: 1px solid #000;
          text-align: right;
          font-weight: 600;
        }
        
        .field-value {
          padding: 4px 8px;
          font-weight: 500;
        }
        
        .report-title-banner {
          background-color: #ffffff !important; /* White */
          border-left: 1.5px solid #000;
          border-right: 1.5px solid #000;
          border-bottom: 2px solid #000;
          text-align: center;
          padding: 6px;
          font-weight: bold;
          font-size: 18px;
          text-transform: uppercase;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .description-banner {
          background-color: #f8fafc !important; /* Minimalist Light Gray */
          border-left: 1.5px solid #000;
          border-right: 1.5px solid #000;
          border-bottom: 1px solid #000;
          text-align: center;
          padding: 4px;
          font-weight: bold;
          font-size: 14px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .nested-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.5px solid #000;
          table-layout: fixed;
        }
        
        .nested-table td, .nested-table th {
          border: 1px solid #000;
          padding: 4px;
          text-align: center;
          font-size: 11px;
          height: 24px;
        }
        
        .bg-yellow { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .bg-blue { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .bg-green { background-color: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .bg-cyan { background-color: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

        .footer-sig {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
          padding: 0 40px;
        }
        
        .sig-item {
          text-align: center;
          width: 200px;
        }
        
        .sig-line {
          border-top: 1.5px solid #000;
          margin-top: 60px;
          padding-top: 5px;
          font-weight: bold;
          font-size: 13px;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body * {
            visibility: hidden;
          }
          #print-section, #print-section * {
            visibility: visible;
          }
          #print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 190mm;
          }
          input, select, textarea {
            border: none !important;
            background: transparent !important;
            outline: none !important;
            font-weight: 500 !important;
            text-align: center !important;
            width: 100% !important;
            color: black !important;
          }
        }
      `}</style>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Print
          </Button>
        </div>
      </div>

      <div>
        <h2>Final Testing Report</h2>
        <p className="text-gray-500 mt-1">Transformer: {transformer.uniqueId}</p>
      </div>

      {/* Main Report Card */}
      <div id="print-section">
        {/* Header Grid */}
        <div className="report-header-grid">
          <div className="header-left">
            <h1 className="text-2xl font-bold italic text-red-600 leading-tight">ADVENT ENGINEERS</h1>
          </div>
          <div className="header-right">
            <div className="header-field">
              <span className="field-label">Date :</span>
              <span className="field-value">{testDate}</span>
            </div>
            <div className="header-field">
              <span className="field-label">Order No :</span>
              <span className="field-value">{transformer.uniqueId}</span>
            </div>
            <div className="header-field">
              <span className="field-label">Client :</span>
              <span className="field-value">{transformer.clientName || 'N/A'}</span>
            </div>
            <div className="header-field">
              <span className="field-label">Unit No :</span>
              <span className="field-value">{transformer.uniqueId}</span>
            </div>
          </div>
        </div>

        {/* Banners */}
        <div className="report-title-banner">
          FINAL TESTING RECORD OF CURRENT TRANSFORMER
        </div>
        <div className="description-banner">
          Transformer Verification
        </div>

        {/* Testing Record Table */}
        <div className="mt-4 border-[1.5px] border-black text-black">
          <div className="bg-gray-100 p-1 text-center font-bold text-xs border-b-[1.5px] border-black uppercase">
            Testing Record of Current Transformer
          </div>
          <table className="w-full text-[11px] border-collapse">
            <tbody>
              <tr>
                <td className="border-b border-black p-1.5" colSpan={2}>
                  <p><span className="font-bold italic">Specification :</span> {transformer.voltageRating || '33'} KV {transformer.clientName || 'N/A'}</p>
                </td>
              </tr>
              <tr>
                <td className="border-b border-black p-1.5" colSpan={2}>
                  <p><span className="font-bold italic">CT Ratio :</span> {transformer.rating} / {transformer.ratedSecondaryCurrent || '1'} A</p>
                </td>
              </tr>
              <tr>
                <td className="border-r border-b border-black p-1.5 w-1/2">
                  <p><span className="font-bold italic">Burden :</span> {transformer.burden || '30'} VA</p>
                </td>
                <td className="border-b border-black p-1.5 w-1/2">
                  <p><span className="font-bold italic">Class :</span> {(transformer.cores && transformer.cores[0]?.accuracyClass) || 'N/A'}</p>
                </td>
              </tr>
              <tr>
                <td className="p-1.5" colSpan={2}>
                  <p><span className="font-bold italic">STC :</span> {transformer.stc || 'N/A'}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4">


          {/* Test Sections */}
          <div className="space-y-4">
            {/* 2. Polarity Testing */}
            <div className="border border-gray-300">
              <div className="description-banner text-left px-4">
                <h4>2. Polarity Testing</h4>
              </div>
              <div className="p-3">
                <select
                  className="w-full bg-white border border-gray-300 rounded p-2 text-center h-10 outline-none"
                  value={polarityResult}
                  onChange={(e) => setPolarityResult(e.target.value)}
                >
                  <option value="">Select Result</option>
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                </select>
              </div>
            </div>

            {/* 3. Meggar Test */}
            <div className="border border-gray-300">
              <div className="description-banner text-left px-4">
                <h4>3. Meggar Test</h4>
              </div>
              <div className="p-3">
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-2 text-sm w-1/3">a) Primary to Secondary</td>
                      <td className="py-2">
                        <Input
                          className="h-9"
                          placeholder="Enter value"
                          value={meggarPrimaryToSecondary}
                          onChange={(e) => setMeggarPrimaryToSecondary(e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-2 text-sm">b) Primary to Earth</td>
                      <td className="py-2">
                        <Input
                          className="h-9"
                          placeholder="Enter value"
                          value={meggarPrimaryToEarth}
                          onChange={(e) => setMeggarPrimaryToEarth(e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-2 text-sm">c) Secondary to Earth</td>
                      <td className="py-2">
                        <Input
                          className="h-9"
                          placeholder="Enter value"
                          value={meggarSecondaryToEarth}
                          onChange={(e) => setMeggarSecondaryToEarth(e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 text-sm">d) Core to Core</td>
                      <td className="py-2">
                        <Input
                          className="h-9"
                          placeholder="Enter value"
                          value={meggarCoreToCore}
                          onChange={(e) => setMeggarCoreToCore(e.target.value)}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. H.V. Test on Secondary Winding */}
            <div className="border border-gray-300">
              <div className="bg-gray-100 border-b border-gray-300 p-3">
                <h4>4. H.V. Test on Secondary Winding</h4>
              </div>
              <div className="p-3">
                <select
                  className="w-full bg-white border border-gray-300 rounded p-2 text-center h-10 outline-none"
                  value={hvSecondaryWinding}
                  onChange={(e) => setHvSecondaryWinding(e.target.value)}
                >
                  <option value="">Select Result</option>
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                </select>
              </div>
            </div>

            {/* 5. H.V. Test on Primary Winding */}
            <div className="border border-gray-300">
              <div className="bg-gray-100 border-b border-gray-300 p-3">
                <h4>5. H.V. Test on Primary Winding</h4>
              </div>
              <div className="p-3">
                <select
                  className="w-full bg-white border border-gray-300 rounded p-2 text-center h-10 outline-none"
                  value={hvPrimaryWinding}
                  onChange={(e) => setHvPrimaryWinding(e.target.value)}
                >
                  <option value="">Select Result</option>
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                </select>
              </div>
            </div>

            {/* 6. H.V. Test between Core */}
            <div className="border border-gray-300">
              <div className="bg-gray-100 border-b border-gray-300 p-3">
                <h4>6. H.V. Test between Core</h4>
              </div>
              <div className="p-3">
                <select
                  className="w-full bg-white border border-gray-300 rounded p-2 text-center h-10 outline-none"
                  value={hvBetweenCore}
                  onChange={(e) => setHvBetweenCore(e.target.value)}
                >
                  <option value="">Select Result</option>
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                </select>
              </div>
            </div>

            {/* 7. O.V.I.T. Test */}
            <div className="border border-gray-300">
              <div className="bg-gray-100 border-b border-gray-300 p-3">
                <h4>7. O.V.I.T. Test</h4>
              </div>
              <div className="p-3">
                <select
                  className="w-full bg-white border border-gray-300 rounded p-2 text-center h-10 outline-none"
                  value={ovitTest}
                  onChange={(e) => setOvitTest(e.target.value)}
                >
                  <option value="">Select Result</option>
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                </select>
              </div>
            </div>

            {/* 8. Accuracy Test (Removed) */}
          </div>

        </div>

        {/* Footer Signatures */}
        <div className="footer-sig">
          <div className="sig-item">
            <div className="sig-line">Tested by</div>
            <div className="text-xs mt-1 font-bold">{testerName}</div>
          </div>
          <div className="sig-item">
            <div className="sig-line">Authorised Signatory</div>
            <div className="text-[10px] mt-1 italic italic-bold text-gray-500">Stamp & Signature</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 items-center justify-between">
        <div className="flex flex-col gap-2">
          {hasFailures && (
            <div className="text-red-600 text-sm font-semibold max-w-lg">
              Failure Limits Reached: {validationFailures.join(', ')}
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={handleSave} 
            variant="outline" 
            className="gap-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </Button>

          {comprehensiveComplete && coresComplete && (
            <Button 
              onClick={handleSaveAndApprove} 
              className="bg-green-600 text-white hover:bg-green-700 gap-2 font-bold px-6 shadow-md transition-all hover:scale-105"
            >
              <Save className="w-4 h-4" />
              APPROVE & FINISH UNIT
            </Button>
          )}

          {comprehensiveComplete && !coresComplete && (
            <div className="flex items-center text-amber-600 font-semibold gap-2 border border-amber-200 bg-amber-50 px-4 py-2 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
              Core Tests Pending
            </div>
          )}

          {hasFailures && (
            <Button onClick={handleMarkAsFailed} variant="destructive" className="bg-red-600 hover:bg-red-700 font-bold gap-2 text-md h-10 shadow-lg border border-red-800 animate-pulse">
              <AlertTriangle className="w-5 h-5 mr-1" />
              MARK AS FAILED CORE
            </Button>
          )}
        </div>
      </div>
    </div>

  </>);
}

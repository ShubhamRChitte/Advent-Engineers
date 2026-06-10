import axios from "axios";
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';

import { Printer, ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { Transformer } from './SecondaryTransformersList';
import { toast } from 'sonner';
import logoImage from 'figma:asset/9d5dbd3020690d903579eb3ff66bac216cd36f83.png';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface SecondaryMeteringReportProps {
  transformer: Transformer;
  coreNumber?: number;
  coreId: string;
  testerName: string;
  onBack: () => void;
  readOnly?: boolean;
  stage?: 'secondary' | 'primary' | 'final';
  accuracyClass?: string | undefined;
  primaryCurrent?: string;
  secondaryCurrent?: string;
  order?: any;
  onRefresh?: () => void;
  onCompleteTimer?: () => Promise<void>;
}

export function SecondaryMeteringReport({
  transformer,
  coreNumber,
  coreId,
  testerName,
  onBack,
  readOnly = false,
  stage = 'secondary',
  accuracyClass: explicitClass,
  primaryCurrent: manualPrimary,
  secondaryCurrent: manualSecondary,
  order: propOrder,
  onRefresh,
  onCompleteTimer,
}: SecondaryMeteringReportProps) {
  const coreIndex = (coreNumber && coreNumber > 0) ? (coreNumber - 1) :
    (!isNaN(parseInt(coreId.replace(/[^0-9]/g, ''))) ? parseInt(coreId.replace(/[^0-9]/g, '')) - 1 : 0);


  const [dbLimits, setDbLimits] = useState<any[]>([]);

  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/accuracy-limits/metering`, { withCredentials: true });
        setDbLimits(response.data);
      } catch (error) {
        console.error('Failed to fetch dynamic metering limits', error);
      }
    };
    fetchLimits();
  }, []);

  const dynamicRatios: string[] = (() => {
    // 1. Determine core index from prop or ID
    const order = propOrder || transformer.fullOrder || transformer.orderId;
    const orderCores = order?.coreDetails || [];
    const coreFromOrder = orderCores[coreIndex];

    // Priority: Manual Prop -> Core Specific -> Order Level -> Fallback
    const secCurr = manualSecondary || 
      coreFromOrder?.secondaryCurrent ||
      order?.ratedSecondaryCurrent ||
      '1';

    // Extract and split primary currents
    // Priority: Manual Prop -> Order PrimaryCurrents -> Order Ratio -> Fallback
    const rawPrimaryCurrs = manualPrimary ? [manualPrimary] :
      ((order?.primaryCurrents && order.primaryCurrents.length > 0) ? order.primaryCurrents :
      (Array.isArray(order?.ratio) ? order.ratio.map((r: string) => String(r).split('/')[0]) : ['200']));

    let primaryCurrs = rawPrimaryCurrs.flatMap((pc: string) =>
      String(pc).replace(/[\[\]"']/g, '').split(/[- ,]+/).filter(v => v.trim() !== '')
    );
    primaryCurrs = [...new Set(primaryCurrs)];

    return primaryCurrs.map((p: string) => `${p}/${secCurr}`);
  })();

  const [accuracyClass] = useState<string>(() => {
    if (explicitClass) return extractAccuracyClass(explicitClass);
    const order = propOrder || transformer.fullOrder || transformer.orderId;
    const orderCores = order?.coreDetails || [];
    const coreFromOrder = orderCores[coreIndex];

    return extractAccuracyClass(
      coreFromOrder?.accuracyClass ||
      transformer.accuracyClass ||
      '0.5'
    );
  });

  const displayBurden = (() => {
    const order = propOrder || transformer.fullOrder || transformer.orderId;
    let rawBurden = order?.burden;
    if (Array.isArray(rawBurden)) {
      rawBurden = rawBurden[Math.min(coreIndex, rawBurden.length - 1)];
    }
    const val = rawBurden || transformer.burden;
    if (!val) return 'N/A';
    return String(val).replace(/VA/i, '').trim();
  })();

  const displaySTC = (() => {
    const order = propOrder || transformer.fullOrder || transformer.orderId;
    return order?.stc || order?.STC || transformer.stc || 'N/A';
  })();

  const [testResults, setTestResults] = useState<{ ratioValue: string; rows: any[] }[]>(() => {
    const initial = dynamicRatios.map(ratio => ({
      ratioValue: ratio,
      rows: getInitialData(accuracyClass)
    }));

    const stageKey = `${stage}_test`;
    const history = transformer.testHistory?.[stageKey]?.metering_results;
    if (history?.length > 0) {
      const myResults = history.filter((res: any) => res.internalCoreNo === coreId);
      return initial.map((item, idx) => {
        const saved = myResults[idx];
        if (saved && saved.ratioValue === item.ratioValue) return { ...item, rows: saved.rows };
        const matched = myResults.find((r: any) => r.ratioValue === item.ratioValue);
        return matched ? { ...item, rows: matched.rows } : item;
      });
    }
    return initial;
  });

  useEffect(() => {
    const fetchLatestData = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/transformers/${transformer.uniqueId}`, { withCredentials: true });
        const freshTransformer = res.data;
        const stageKey = `${stage}_test`;
        const stageHistory = freshTransformer?.testHistory?.[stageKey];

        if (stageHistory?.metering_results?.length > 0) {
          const myResults = stageHistory.metering_results.filter((res: any) => res.internalCoreNo === coreId);
          if (myResults.length > 0) {
            setTestResults(prev => prev.map(item => {
              const matched = myResults.find((r: any) => r.ratioValue === item.ratioValue);
              return matched ? { ...item, rows: matched.rows } : item;
            }));
          }
        }
      } catch (err) {
        console.error("Failed to load existing metering data", err);
      }
    };
    fetchLatestData();
  }, [transformer.uniqueId, coreId, stage]);

  const handleDataChange = (ratioIdx: number, rowIndex: number, field: string, value: string) => {
    if (readOnly) return;
    setTestResults(prev => {
      const updated = [...prev];
      const ratioBlock = { ...updated[ratioIdx] } as { ratioValue: string; rows: any[] };
      const updatedRows = [...(ratioBlock.rows || [])];
      const updatedRow = { ...updatedRows[rowIndex], [field]: value };

      const v100 = validateMeteringUI(accuracyClass, updatedRow.current, updatedRow.r100, updatedRow.p100, dbLimits);
      updatedRow.r100_r_pass = v100.rPass;
      updatedRow.r100_p_pass = v100.pPass;
      updatedRow.r100_reason = v100.reason;

      const v25 = validateMeteringUI(accuracyClass, updatedRow.current, updatedRow.r25, updatedRow.p25, dbLimits);
      updatedRow.r25_r_pass = v25.rPass;
      updatedRow.r25_p_pass = v25.pPass;
      updatedRow.r25_reason = v25.reason;

      updatedRows[rowIndex] = updatedRow;
      ratioBlock.rows = updatedRows;
      updated[ratioIdx] = ratioBlock;
      return updated;
    });
  };

  const handleDatabaseSave = async () => {
    if (readOnly) return;
    try {
      const payload = {
        uniqueId: transformer.uniqueId,
        loginType: `${stage}_login`,
        tester: testerName,
        coreId: coreId,
        metering_results: testResults.map(item => ({
          ratioValue: item.ratioValue,
          rows: item.rows,
          internalCoreNo: coreId,
          accuracyClass: accuracyClass
        }))
      };
      await axios.post(`http://localhost:5001/transformer-${stage}-metering-tests`, payload, { withCredentials: true });
      if (onCompleteTimer) await onCompleteTimer();
      toast.success("Data saved successfully!");
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error("Failed to save data.");
    }
  };

  const handleMarkAsFailed = async () => {
    if (readOnly) return;
    try {
      const allReasons: string[] = [];
      testResults.forEach(item => {
        item.rows.forEach(row => {
          if (row.r100_r_pass === false || row.r100_p_pass === false) {
            allReasons.push(`${item.ratioValue} (${row.current}) 100% Burden: ${row.r100_reason || 'Limits Exceeded'}`);
          }
          if (row.r25_r_pass === false || row.r25_p_pass === false) {
            allReasons.push(`${item.ratioValue} (${row.current}) 25% Burden: ${row.r25_reason || 'Limits Exceeded'}`);
          }
        });
      });

      const payload = {
        orderId: transformer.orderId?._id || transformer.orderId,
        internalCoreNo: coreId,
        failureReason: allReasons.length > 0 ? [...new Set(allReasons)].join(' | ') : "Accuracy Limits Exceeded",
        failureStage: `${stage}_metering_test`,
        dynamicValues: testResults
      };
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/failed-cores`, payload, { withCredentials: true });
      toast.success("Core marked as failed successfully.");
    } catch (error: any) {
      toast.error("Error adding to failed cores");
    }
  };

  const hasAnyFailures = testResults.some(item => item.rows.some(row => 
    row.r100_r_pass === false || row.r100_p_pass === false || 
    row.r25_r_pass === false || row.r25_p_pass === false
  ));

  return (
    <div className="space-y-6 p-4 bg-gray-50 flex justify-center">
      <style>{`
        .report-wrapper { background: white; width: 210mm; min-height: 297mm; padding: 15mm; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); color: black; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-sizing: border-box; }
        .report-header-top { display: flex; align-items: center; justify-content: center; position: relative; padding-bottom: 10px; border-bottom: 2px solid #000; margin-bottom: 5px; }
        .header-logo { position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 120px; height: 60px; display: flex; align-items: center; }
        .header-titles { text-align: center; }
        .header-titles h1 { font-size: 24px; font-weight: bold; color: #1e3a8a; margin: 0; letter-spacing: 1px; }
        .header-titles p { font-size: 12px; color: #4b5563; margin: 0; }
        .report-metadata { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .meta-column { width: 48%; }
        .meta-field { display: flex; margin-bottom: 4px; font-size: 12px; }
        .meta-label { font-weight: 600; width: 80px; }
        .meta-value { flex: 1; }
        .report-main-title { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; }
        .section-container { border: 1px solid #000; margin-bottom: 15px; }
        .section-title { padding: 4px; text-align: center; font-weight: bold; font-size: 13px; border-bottom: 1px solid #000; }
        .spec-table { width: 100%; border-collapse: collapse; }
        .spec-table td { border-bottom: 1px solid #000; padding: 4px 8px; font-size: 12px; }
        .spec-table tr:last-child td { border-bottom: none; }
        .nested-table { width: 100%; border-collapse: collapse; table-layout: fixed; border-top: 1px solid #000; }
        .nested-table th, .nested-table td { border: 1px solid #000; padding: 4px; text-align: center; font-size: 11px; }
        .nested-table th { background-color: #f9fafb; font-weight: bold; }
        .nested-table tr:first-child th { border-top: none; }
        .nested-table tr th:first-child, .nested-table tr td:first-child { border-left: none; }
        .nested-table tr th:last-child, .nested-table tr td:last-child { border-right: none; }
        .nested-table tr:last-child td { border-bottom: none; }
        .input-cell { padding: 0 !important; }
        .input-field { width: 100%; height: 24px; text-align: center; border: none; background: transparent; font-size: 11px; outline: none; }
        .input-field:focus { background-color: #fef08a; }
        .footer-sig { margin-top: 60px; display: flex; justify-content: space-between; padding: 0 40px; page-break-inside: avoid; }
        .sig-block { text-align: center; width: 200px; display: flex; flex-direction: column; align-items: center; }
        .sig-name { font-size: 12px; font-weight: bold; min-height: 18px; margin-bottom: 5px; }
        .sig-line { width: 100%; border-top: 1px dashed #000; padding-top: 5px; font-weight: bold; font-size: 12px; }
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { background: white; margin: 0; padding: 0; }
          .print-container { width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .report-wrapper { box-shadow: none; width: 100%; min-height: auto; padding: 0; margin: 0; border: none; }
          .bg-gray-50 { background: white !important; }
          .no-print { display: none !important; }
          .overflow-x-auto { overflow: visible !important; }
          table { page-break-inside: avoid; width: 100% !important; }
          tr { page-break-inside: avoid; page-break-after: auto; }
        }
      `}</style>

      <div className="print-container w-[210mm]">
        {!readOnly && (
          <div className="flex items-center justify-between no-print mb-4 w-full">
            <Button variant="outline" size="sm" onClick={onBack} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button>
            <div className="flex gap-2">
              {!readOnly && hasAnyFailures && (
                <Button variant="destructive" size="sm" onClick={handleMarkAsFailed} className="gap-2"><AlertTriangle className="w-4 h-4" /> Add to Failed Cores</Button>
              )}
              <Button variant="outline" size="sm" onClick={handleDatabaseSave} className="gap-2"><Save className="w-4 h-4" /> Save</Button>
              <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2"><Printer className="w-4 h-4" /> Print</Button>
            </div>
          </div>
        )}

        <div id="printable-report" className="report-wrapper">
          <div className="report-header-top">
            <div className="header-logo">
              <ImageWithFallback src={logoImage} alt="Advent Logo" className="max-w-full max-h-full object-contain" />
            </div>
            <div className="header-titles">
              <h1>ADVENT ENGINEERS</h1>
              <p>Excellence in Transformer Core Testing</p>
            </div>
          </div>

          <div className="report-metadata">
            <div className="meta-column">
              <div className="meta-field"><span className="meta-label">Date</span><span className="meta-value">: {new Date().toLocaleDateString('en-GB')}</span></div>
              <div className="meta-field"><span className="meta-label">Order No</span><span className="meta-value">: {transformer.jobId || transformer.uniqueId}</span></div>
              <div className="meta-field"><span className="meta-label">Client</span><span className="meta-value">: {transformer.clientName || 'N/A'}</span></div>
            </div>
            <div className="meta-column">
              <div className="meta-field"><span className="meta-label">Unit No</span><span className="meta-value">: {transformer.uniqueId}</span></div>
              <div className="meta-field"><span className="meta-label">Class</span><span className="meta-value">: {accuracyClass}</span></div>
            </div>
          </div>

          <div className="report-main-title">SECONDARY TEST REPORT</div>

          <div className="section-container">
            <div className="section-title bg-gray-100">Testing Record of Current Transformer</div>
            <table className="spec-table">
              <tbody>
                <tr>
                  <td colSpan={2}><span className="font-bold mr-2">Specification :</span> {transformer.voltageRating || '33'} KV</td>
                </tr>
                <tr>
                  <td colSpan={2}><span className="font-bold mr-2">CT Ratio :</span> {dynamicRatios.join('-')} A</td>
                </tr>
                <tr>
                  <td style={{ width: '50%', borderRight: '1px solid #000' }}><span className="font-bold mr-2">Burden :</span> {displayBurden} VA</td>
                  <td style={{ width: '50%' }}><span className="font-bold mr-2">Class :</span> {accuracyClass}</td>
                </tr>
                <tr>
                  <td colSpan={2}><span className="font-bold mr-2">STC :</span> {displaySTC}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="section-container">
            <div className="section-title bg-gray-100 uppercase">
              {transformer.voltageRating || '33'} KV , CT , {dynamicRatios.join('-')}A , {displayBurden}VA , Metering
            </div>
            <div className="flex justify-end p-2 border-b border-black">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">metering core no.</span>
                <span className="border-b border-gray-600 px-2 min-w-[60px] text-blue-700 font-medium">
                  {coreId.startsWith('M-') ? coreId : `M-${coreId}`}
                </span>
              </div>
            </div>
            <MeteringTable testResults={testResults} onUpdate={(ratioIdx, rowIndex, field, value) => handleDataChange(ratioIdx, rowIndex, field, value)} readOnly={readOnly} />
          </div>

          <div className="footer-sig">
            <div className="sig-block">
              <div className="sig-name">{testerName || 'Tester'}</div>
              <div className="sig-line">Tested By</div>
            </div>
            <div className="sig-block">
              <div className="sig-name italic text-gray-500 font-normal mt-1">Stamp & Signature</div>
              <div className="sig-line">Authorised Signatory</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MeteringTableProps {
  testResults: { ratioValue: string; rows: any[] }[];
  onUpdate: (ratioIdx: number, rowIndex: number, field: string, value: string) => void;
  readOnly?: boolean;
}

function MeteringTable({ testResults, onUpdate, readOnly }: MeteringTableProps) {
  return (
    <div className="w-full">
      <table className="nested-table">
        <thead>
          <tr>
            <th colSpan={2} rowSpan={2} style={{ width: '25%' }} className="text-center font-bold align-middle">
              %of primary current
            </th>
            <th colSpan={2} style={{ width: '37.5%' }}>100 % Burden</th>
            <th colSpan={2} style={{ width: '37.5%' }}>25% Burden</th>
          </tr>
          <tr>
            <th>Ratio Error(%)</th>
            <th>Phase Error(min)</th>
            <th>Ratio Error(%)</th>
            <th>Phase Error(min)</th>
          </tr>
        </thead>
        <tbody>
          {testResults.map((item, ratioIdx) => (
            <React.Fragment key={ratioIdx}>
              {item.rows.map((row, rowIndex) => (
                <tr key={`${ratioIdx}-${rowIndex}`}>
                  {rowIndex === 0 && (
                    <td className="font-bold text-left align-middle border-r border-black p-2" rowSpan={item.rows.length} style={{ width: '15%' }}>
                      Metering Core<br/>Ratio -{item.ratioValue.replace(/\//g, '/')}
                    </td>
                  )}
                  <td className="font-medium text-center border-r border-black" style={{ width: '10%' }}>{row.current}</td>
                  <td className="input-cell border-r border-black">
                    <input
                      className={`input-field ${row.r100_r_pass === false ? 'text-red-700 font-bold' : ''}`}
                      value={row.r100}
                      onKeyDown={(e) => {
                        if (e.ctrlKey || e.metaKey || ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter", "."].includes(e.key)) return;
                        if (!/^[0-9+\-]$/.test(e.key)) e.preventDefault();
                      }}
                      onChange={(e) => onUpdate(ratioIdx, rowIndex, 'r100', e.target.value.replace(/[^0-9+\-.]/g, ''))}
                      disabled={readOnly}
                    />
                  </td>
                  <td className="input-cell border-r border-black">
                    <input
                      className={`input-field ${row.r100_p_pass === false ? 'text-red-700 font-bold' : ''}`}
                      value={row.p100}
                      onKeyDown={(e) => {
                        if (e.ctrlKey || e.metaKey || ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter", "."].includes(e.key)) return;
                        if (!/^[0-9+\-]$/.test(e.key)) e.preventDefault();
                      }}
                      onChange={(e) => onUpdate(ratioIdx, rowIndex, 'p100', e.target.value.replace(/[^0-9+\-.]/g, ''))}
                      disabled={readOnly}
                    />
                  </td>
                  <td className="input-cell border-r border-black">
                    <input
                      className={`input-field ${row.r25_r_pass === false ? 'text-red-700 font-bold' : ''}`}
                      value={row.r25}
                      onKeyDown={(e) => {
                        if (e.ctrlKey || e.metaKey || ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter", "."].includes(e.key)) return;
                        if (!/^[0-9+\-]$/.test(e.key)) e.preventDefault();
                      }}
                      onChange={(e) => onUpdate(ratioIdx, rowIndex, 'r25', e.target.value.replace(/[^0-9+\-.]/g, ''))}
                      disabled={readOnly}
                    />
                  </td>
                  <td className="input-cell">
                    <input
                      className={`input-field ${row.r25_p_pass === false ? 'text-red-700 font-bold' : ''}`}
                      value={row.p25}
                      onKeyDown={(e) => {
                        if (e.ctrlKey || e.metaKey || ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter", "."].includes(e.key)) return;
                        if (!/^[0-9+\-]$/.test(e.key)) e.preventDefault();
                      }}
                      onChange={(e) => onUpdate(ratioIdx, rowIndex, 'p25', e.target.value.replace(/[^0-9+\-.]/g, ''))}
                      disabled={readOnly}
                    />
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getInitialData(accClass?: string) {
  let currents = ['120%', '100%', '20%', '5%', '1%'];
  
  if (accClass) {
    const isSpecialClass = accClass.toLowerCase().includes('s');
    if (!isSpecialClass) {
      currents = ['120%', '100%', '20%', '5%'];
    }
  }

  return currents.map(c => ({
    current: c,
    r100: '',
    p100: '',
    r25: '',
    p25: '',
    r100_r_pass: null,
    r100_p_pass: null,
    r25_r_pass: null,
    r25_p_pass: null,
    r100_reason: '',
    r25_reason: ''
  }));
}

function extractAccuracyClass(str: string): string {
  if (!str) return '0.5';
  
  const classes = ['0.2S', '0.5S', '0.1', '0.2', '0.5', '1', '3', '5'];
  const upper = str.toUpperCase().replace(/\s+/g, '');

  for (const cls of classes) {
      if (upper.includes(cls)) return cls;
  }

  return '0.5';
}

function validateMeteringUI(accClass: string, current: string, r: string, p: string, limits: any[]) {
  let rPass: boolean | null = null;
  let pPass: boolean | null = null;
  if (!r && !p) return { rPass: null, pPass: null, reason: null }; 

  const normalizedAccClass = String(accClass || "").toUpperCase().replace(/\s+/g, '');
  const config = limits.find(l => {
    const lClass = l.accuracyClass ? String(l.accuracyClass).toUpperCase().replace(/\s+/g, '') : '';
    return lClass === normalizedAccClass;
  });
  if (!config) return { rPass: true, pPass: true, reason: null }; 

  const loadLimit = config.limits.find((l: any) => String(l.load) === String(current));
  if (!loadLimit) return { rPass: true, pPass: true, reason: null }; 

  let reasons: string[] = [];

  if (r && r.trim() !== '') {
    const rVal = parseFloat(r);
    if (!isNaN(rVal) && loadLimit.ratioLimit !== undefined && loadLimit.ratioLimit !== null) {
      if (Math.abs(rVal) >= loadLimit.ratioLimit) {
        rPass = false;
        reasons.push(`Ratio Error (${rVal}) exceeds or equals ±${loadLimit.ratioLimit}`);
      } else {
        rPass = true;
      }
    }
  }

  if (p && p.trim() !== '') {
    const pVal = parseFloat(p);
    if (!isNaN(pVal) && loadLimit.phaseLimit !== undefined && loadLimit.phaseLimit !== null) {
      if (Math.abs(pVal) >= loadLimit.phaseLimit) {
        pPass = false;
        reasons.push(`Phase Error (${pVal}) exceeds or equals ±${loadLimit.phaseLimit}`);
      } else {
        pPass = true;
      }
    }
  }

  return { rPass, pPass, reason: reasons.length > 0 ? reasons.join('; ') : null };
}

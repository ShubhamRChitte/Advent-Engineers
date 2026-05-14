import axios from "axios";
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Printer, ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { Transformer } from './SecondaryTransformersList';
import { toast } from 'sonner';

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
}: SecondaryMeteringReportProps) {
  const coreIndex = (coreNumber && coreNumber > 0) ? (coreNumber - 1) :
    (!isNaN(parseInt(coreId.replace(/[^0-9]/g, ''))) ? parseInt(coreId.replace(/[^0-9]/g, '')) - 1 : 0);


  const [dbLimits, setDbLimits] = useState<any[]>([]);

  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/accuracy-limits/metering', { withCredentials: true });
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

  const [accuracyClass, setAccuracyClass] = useState<string>(() => {
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
    const val = rawBurden || transformer.burden || '30';
    return String(val).replace(/VA/i, '').trim();
  })();

  const displaySTC = (() => {
    const order = propOrder || transformer.fullOrder || transformer.orderId;
    return order?.stc || transformer.stc || 'N/A';
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
        const res = await axios.get(`http://localhost:5001/api/transformers/${transformer.uniqueId}`, { withCredentials: true });
        const freshTransformer = res.data;
        const stageKey = `${stage}_test`;
        const stageHistory = freshTransformer?.testHistory?.[stageKey];

        if (stageHistory?.metering_results?.length > 0) {
          const myResults = stageHistory.metering_results.filter((res: any) => res.internalCoreNo === coreId);
          if (myResults.length > 0) {
            setTestResults(prev => prev.map((item, idx) => {
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
      const ratioBlock = { ...updated[ratioIdx] };
      const updatedRows = [...ratioBlock.rows];
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
      await axios.post('http://localhost:5001/api/failed-cores', payload, { withCredentials: true });
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
    <div className="space-y-6 p-4">
      <style>{`
        #print-section { background: white; padding: 5mm 10mm; min-height: 297mm; width: 100%; box-sizing: border-box; color: black; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        .report-header-grid { display: grid; grid-template-columns: 1fr 1fr; border: 1.5px solid #000; margin-bottom: 0; }
        .header-left { padding: 10px; border-right: 1.5px solid #000; display: flex; flex-direction: column; justify-content: center; }
        .header-right { display: grid; grid-template-rows: repeat(5, 1fr); }
        .header-field { display: grid; grid-template-columns: 100px 1fr; border-bottom: 1px solid #000; font-size: 11px; }
        .header-field:last-child { border-bottom: none; }
        .field-label { padding: 4px 8px; border-right: 1px solid #000; text-align: right; font-weight: 600; }
        .field-value { padding: 4px 8px; font-weight: 500; }
        .report-title-banner { background-color: #ffffff !important; border-left: 1.5px solid #000; border-right: 1.5px solid #000; border-bottom: 2px solid #000; text-align: center; padding: 6px; font-weight: bold; font-size: 18px; text-transform: uppercase; }
        .description-banner { background-color: #f8fafc !important; border-left: 1.5px solid #000; border-right: 1.5px solid #000; border-bottom: 1px solid #000; text-align: center; padding: 4px; font-weight: bold; font-size: 14px; }
        .nested-table { width: 100%; border-collapse: collapse; border: 1.5px solid #000; table-layout: fixed; }
        .nested-table td, .nested-table th { border: 1px solid #000; padding: 4px; text-align: center; font-size: 11px; height: 24px; }
        .bg-yellow { background-color: #f1f5f9 !important; }
        .footer-sig { margin-top: 40px; display: flex; justify-content: space-between; padding: 0 40px; }
        .sig-item { text-align: center; width: 200px; }
        .sig-line { border-top: 1.5px solid #000; margin-top: 60px; padding-top: 5px; font-weight: bold; font-size: 13px; }
        @media print { @page { size: A4 portrait; margin: 10mm; } #print-section { width: 100% !important; margin: 0 !important; padding: 0 !important; } .no-print { display: none; } }
      `}</style>

      {!readOnly && (
        <div className="flex items-center justify-between no-print">
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

      <div id="print-section">
        <div className="report-header-grid">
          <div className="header-left"><h1 className="text-2xl font-bold italic text-red-600 leading-tight">ADVENT ENGINEERS</h1></div>
          <div className="header-right">
            <div className="header-field"><span className="field-label">Date :</span><span className="field-value">{new Date().toLocaleDateString('en-GB')}</span></div>
            <div className="header-field"><span className="field-label">Order No :</span><span className="field-value">{transformer.jobId || transformer.uniqueId}</span></div>
            <div className="header-field"><span className="field-label">Client :</span><span className="field-value">{transformer.clientName || 'N/A'}</span></div>
            <div className="header-field"><span className="field-label">Unit No :</span><span className="field-value">{transformer.uniqueId}</span></div>
            <div className="header-field"><span className="field-label">Class :</span><span className="field-value">{accuracyClass}</span></div>
          </div>
        </div>

        <div className="report-title-banner">METERING CORE TEST REPORT</div>
        <div className="description-banner">Accuracy Verification - {coreId}</div>

        <div className="mt-4 border-[1.5px] border-black">
          <div className="bg-gray-100 p-1 text-center font-bold text-xs border-b-[1.5px] border-black uppercase">Testing Record of Current Transformer</div>
          <table className="w-full text-[11px] border-collapse">
            <tbody>
              <tr><td className="border-b border-black p-1.5" colSpan={2}><p><span className="font-bold italic">Specification :</span> {transformer.voltageRating || '33'} KV</p></td></tr>
              <tr><td className="border-b border-black p-1.5" colSpan={2}><p><span className="font-bold italic">CT Ratio :</span> {dynamicRatios.join('-')} A</p></td></tr>
              <tr><td className="border-r border-b border-black p-1.5 w-1/2"><p><span className="font-bold italic">Burden :</span> {displayBurden} VA</p></td><td className="border-b border-black p-1.5 w-1/2"><p><span className="font-bold italic">Class :</span> {accuracyClass}</p></td></tr>
              <tr><td className="p-1.5" colSpan={2}><p><span className="font-bold italic">STC :</span> {displaySTC}</p></td></tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <MeteringTable testResults={testResults} onUpdate={(ratioIdx, rowIndex, field, value) => handleDataChange(ratioIdx, rowIndex, field, value)} readOnly={readOnly} />
        </div>

        <div className="footer-sig mt-12">
          <div className="sig-item">
            <div className="sig-line">Tested by</div>
            <div className="text-xs mt-1 font-bold">{testerName || 'Tester'}</div>
          </div>
          <div className="sig-item">
            <div className="sig-line">Authorised Signatory</div>
            <div className="text-[10px] mt-1 italic text-gray-500">Stamp & Signature</div>
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
    <div className="space-y-2">
      <table className="nested-table w-full">
        <thead>
          <tr className="bg-gray-50">
            <th className="w-24" rowSpan={2}>Ratio</th>
            <th className="w-24" rowSpan={2}>Current</th>
            <th colSpan={2}>100% Burden</th>
            <th colSpan={2}>25% Burden</th>
          </tr>
          <tr className="bg-yellow">
            <th className="text-[10px]">Ratio Error</th>
            <th className="text-[10px]">Phase Error</th>
            <th className="text-[10px]">Ratio Error</th>
            <th className="text-[10px]">Phase Error</th>
          </tr>
        </thead>
        <tbody>
          {testResults.map((item, ratioIdx) => (
            <React.Fragment key={ratioIdx}>
              {item.rows.map((row, rowIndex) => (
                <tr key={`${ratioIdx}-${rowIndex}`}>
                  {rowIndex === 0 && (
                    <td className="bg-gray-50 font-bold text-center align-middle" rowSpan={item.rows.length}>
                      {item.ratioValue}
                    </td>
                  )}
                  <td className="bg-gray-50 font-medium text-center">{row.current}</td>
                  <td className="p-0 border border-gray-400">
                    <Input
                      className={`h-8 text-center border-none shadow-none w-full bg-transparent ${row.r100_r_pass === false ? 'text-red-700 font-bold' : ''}`}
                      value={row.r100}
                      onKeyDown={(e) => {
                        if (e.ctrlKey || e.metaKey || ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter", "."].includes(e.key)) return;
                        if (!/^[0-9+\-]$/.test(e.key)) e.preventDefault();
                      }}
                      onChange={(e) => onUpdate(ratioIdx, rowIndex, 'r100', e.target.value.replace(/[^0-9+\-.]/g, ''))}
                      disabled={readOnly}
                    />
                  </td>
                  <td className="p-0 border border-gray-400">
                    <Input
                      className={`h-8 text-center border-none shadow-none w-full bg-transparent ${row.r100_p_pass === false ? 'text-red-700 font-bold' : ''}`}
                      value={row.p100}
                      onKeyDown={(e) => {
                        if (e.ctrlKey || e.metaKey || ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter", "."].includes(e.key)) return;
                        if (!/^[0-9+\-]$/.test(e.key)) e.preventDefault();
                      }}
                      onChange={(e) => onUpdate(ratioIdx, rowIndex, 'p100', e.target.value.replace(/[^0-9+\-.]/g, ''))}
                      disabled={readOnly}
                    />
                  </td>
                  <td className="p-0 border border-gray-400">
                    <Input
                      className={`h-8 text-center border-none shadow-none w-full bg-transparent ${row.r25_r_pass === false ? 'text-red-700 font-bold' : ''}`}
                      value={row.r25}
                      onKeyDown={(e) => {
                        if (e.ctrlKey || e.metaKey || ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter", "."].includes(e.key)) return;
                        if (!/^[0-9+\-]$/.test(e.key)) e.preventDefault();
                      }}
                      onChange={(e) => onUpdate(ratioIdx, rowIndex, 'r25', e.target.value.replace(/[^0-9+\-.]/g, ''))}
                      disabled={readOnly}
                    />
                  </td>
                  <td className="p-0 border border-gray-400">
                    <Input
                      className={`h-8 text-center border-none shadow-none w-full bg-transparent ${row.r25_p_pass === false ? 'text-red-700 font-bold' : ''}`}
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

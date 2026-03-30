






import axios from "axios";
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';


import { Printer, ArrowLeft, Save, AlertTriangle } from 'lucide-react';

import { Transformer } from './SecondaryTransformersList';
import { toast } from 'sonner';

import { extractAccuracyClass, getInitialData, validateMeteringUI } from '../../utils/meteringUtils';
interface SecondaryMeteringReportProps {
  transformer: Transformer;
  coreNumber?: number;
  coreId: string;
  testerName: string;
  onBack: () => void;
  readOnly?: boolean;
  stage?: 'secondary' | 'primary' | 'final';
  accuracyClass?: string | undefined;
}

export function SecondaryMeteringReport({
  transformer,
  coreId,
  testerName,
  onBack,
  readOnly = false,
  stage = 'secondary',
  accuracyClass: explicitClass,
}: SecondaryMeteringReportProps) {

  const [dbLimits, setDbLimits] = useState<any[]>([]);

  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const response = await axios.get('http://localhost:3002/api/accuracy-limits/metering', { withCredentials: true });
        setDbLimits(response.data);
      } catch (error) {
        console.error('Failed to fetch dynamic metering limits', error);
      }
    };
    fetchLimits();
  }, []);

  // Determine ratios from transformer (passed from props)
  // Fallback to Order's hardcoded ratios if for some reason missing, but Transformer interface now has it.
  const dynamicRatios: string[] = transformer.ratios && transformer.ratios.length > 0
    ? transformer.ratios
    : (transformer.orderId?.ratio || ['200/1']);

  const [accuracyClass] = useState<string>(() => {
    if (explicitClass) return extractAccuracyClass(explicitClass);

    // Fallback: Use the granular accuracyClass from transformer.cores or order.coreDetails
    // Since coreId is likely "Core 1", "Core 2", etc.
    const coreIndex = parseInt(coreId.replace('Core ', '')) - 1;
    const orderCores = transformer.orderId?.coreDetails || [];
    const coreFromOrder = orderCores[coreIndex];

    return extractAccuracyClass(
      transformer.accuracyClass ||
      coreFromOrder?.accuracyClass ||
      '0.5'
    );
  });

  // State management: Map Ratio -> Array of Rows
  const [dataByRatio, setDataByRatio] = useState<{ [ratio: string]: any[] }>(() => {
    // 1️⃣ Initialize with Defaults first
    const initial: { [ratio: string]: any[] } = {};

    const accClass = (() => {
      if (explicitClass) return extractAccuracyClass(explicitClass);
      const coreIndex = parseInt(coreId.replace('Core ', '')) - 1;
      const orderCores = transformer.orderId?.coreDetails || [];
      const coreFromOrder = orderCores[coreIndex];
      return extractAccuracyClass(
        transformer.accuracyClass ||
        coreFromOrder?.accuracyClass ||
        '0.5'
      );
    })();

    dynamicRatios.forEach(ratio => {
      initial[ratio] = getInitialData(accClass);
    });

    // 2️⃣ Attempt to sync with prop if it has history (Fast Load)
    // For ReadOnly, we rely heavily on props or fetched data
    // If transformer.testHistory exists, use it immediately
    const stageKey = `${stage}_test`;
    if (transformer.testHistory?.[stageKey]?.metering_results?.length > 0) {
      const myResults = transformer.testHistory[stageKey].metering_results.filter((res: any) =>
        res.internalCoreNo === coreId || res.coreId === coreId
      );

      myResults.forEach((block: any) => {
        if (initial[block.ratioValue]) {
          initial[block.ratioValue] = block.rows;
        }
      });
    }

    return initial;
  });

  // ✅ LOAD DATA EFFECT
  // Fetches latest data from DB to ensure we aren't overwriting with stale props
  // SKIP if readOnly is true and we trust the passed transformer object, 
  // BUT fetching fresh data is always safer unless we want to avoid calls. 
  // Let's keep fetching for consistency, but if readOnly, capturing state ensures we view saved data.
  useEffect(() => {
    const fetchLatestData = async () => {
      try {
        const res = await axios.get(`http://localhost:3002/api/transformers/${transformer.uniqueId}`, { withCredentials: true });
        const freshTransformer = res.data;

        // Dynamic path: testHistory.secondary_test or testHistory.primary_test
        const stageKey = `${stage}_test` as keyof typeof freshTransformer.testHistory;
        const stageHistory = freshTransformer?.testHistory?.[stageKey];

        if (stageHistory?.metering_results?.length > 0) {
          console.log(`Found saved metering results for ${stage}, loading...`, stageHistory.metering_results);

          // Filter results for THIS specific core ID to avoid loading data from other cores
          const myResults = stageHistory.metering_results.filter((res: any) =>
            res.internalCoreNo === coreId || res.coreId === coreId
          );

          setDataByRatio(prev => {
            const newState = { ...prev };
            const accClass = accuracyClass;

            myResults.forEach((block: any) => {
              // Apply validation to restored rows so highlights reappear
              const validatedRows = block.rows.map((row: any) => {
                const rowCopy = { ...row };
                const v100 = validateMeteringUI(accClass, rowCopy.current, rowCopy.r100, rowCopy.p100, dbLimits);
                rowCopy.r100_pass = v100.isPass;
                rowCopy.r100_reason = v100.reason;

                const v25 = validateMeteringUI(accClass, rowCopy.current, rowCopy.r25, rowCopy.p25, dbLimits);
                rowCopy.r25_pass = v25.isPass;
                rowCopy.r25_reason = v25.reason;

                return rowCopy;
              });

              // Upsert the row data.
              // 1. Exact Match
              if (block.ratioValue && newState[block.ratioValue]) {
                newState[block.ratioValue] = validatedRows;
              }
              // 2. Fallback for "N/A" ratio if we only have one expected ratio
              else if ((!block.ratioValue || block.ratioValue === 'N/A') && dynamicRatios.length === 1) {
                newState[dynamicRatios[0]!] = validatedRows;
              }
            });
            return newState;
          });
        }
      } catch (err) {
        console.error("Failed to load existing test data", err);
        // Non-blocking, just log
      }
    };

    fetchLatestData();
  }, [transformer.uniqueId, coreId, dbLimits]);

  // Helper to update a specific row in a specific ratio table
  const updateTableData = (ratio: string, index: number, field: string, value: string) => {
    if (readOnly) return;
    setDataByRatio(prev => {
      const currentRows = [...(prev[ratio] || [])];
      const updatedRow = { ...currentRows[index], [field]: value };

      // Real-time Validation
      const accClass = accuracyClass;

      const v100 = validateMeteringUI(accClass, updatedRow.current, updatedRow.r100, updatedRow.p100, dbLimits);
      updatedRow.r100_pass = v100.isPass;
      updatedRow.r100_reason = v100.reason;

      const v25 = validateMeteringUI(accClass, updatedRow.current, updatedRow.r25, updatedRow.p25, dbLimits);
      updatedRow.r25_pass = v25.isPass;
      updatedRow.r25_reason = v25.reason;

      currentRows[index] = updatedRow;
      return { ...prev, [ratio]: currentRows };
    });
  };

  // ✅ 2️⃣ Convert State → Schema Format
  const buildMeteringResults = () => {
    return dynamicRatios.map((ratio: string) => ({
      internalCoreNo: coreId, // Inject Core ID for persistence
      ratioValue: ratio,
      accuracyClass: accuracyClass, // SAVE THE SPECIFIC CLASS
      rows: dataByRatio[ratio] || []
    }));
  };

  const handleDatabaseSave = async () => {
    if (readOnly) return;
    console.log("handleDatabaseSave: STARTED");
    try {
      const meteringResults = buildMeteringResults();
      console.log("handleDatabaseSave: meteringResults built", meteringResults);

      const payload = {
        uniqueId: transformer.uniqueId,
        loginType: `${stage}_login`,
        tester: testerName, // Use dynamic tester name from props
        coreId: coreId,
        metering_results: meteringResults
      };

      console.log("handleDatabaseSave: Payload ready", payload);

      const endpoint = `http://localhost:3002/transformer-${stage}-metering-tests`;
      console.log(`handleDatabaseSave: Posting to ${endpoint}`);

      const response = await axios.post(
        endpoint,
        payload,
        { withCredentials: true }
      );

      console.log("handleDatabaseSave: Response received", response);
      toast.success("Data saved successfully!");
    } catch (error) {
      console.error("handleDatabaseSave: ERROR CAUGHT", error);
      toast.error("Failed to save data.");
    }
  };

  const handleMarkAsFailed = async () => {
    if (readOnly) return;

    // Extract reasons
    let reasons: string[] = [];
    dynamicRatios.forEach(ratio => {
      const rows = dataByRatio[ratio] || [];
      rows.forEach(row => {
        if (row.r100_pass === false && row.r100_reason && !reasons.includes(row.r100_reason)) reasons.push(row.r100_reason);
        if (row.r25_pass === false && row.r25_reason && !reasons.includes(row.r25_reason)) reasons.push(row.r25_reason);
      });
    });

    const finalReason = reasons.length > 0 ? reasons.join(' | ') : "Test readings exceeded configuration limits.";

    try {
      // Persist the entered test values to the transformer's history first
      await handleDatabaseSave();

      const payload = {
        orderId: transformer.orderId?._id || transformer.orderId,
        internalCoreNo: coreId,
        failureReason: finalReason,
        failureStage: `${stage}_metering_test`, // dynamic based on stage
        dynamicValues: dataByRatio
      };
      await axios.post('http://localhost:3002/api/failed-cores', payload, { withCredentials: true });
      toast.success("Core marked as failed successfully.");
    } catch (error: any) {
      console.error("Mark as failed error:", error);
      toast.error(error.response?.data?.message || "Error adding to failed cores");
    }
  };


  const hasAnyFailures = dynamicRatios.some((ratio: string) => {
    const rows = dataByRatio[ratio] || [];
    return rows.some((row: any) => row.r100_pass === false || row.r25_pass === false);
  });

  return (
    <div className="space-y-6 p-4">
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
          #print-section {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
      {!readOnly && (
        <div className="flex items-center justify-between no-print">
          <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex gap-2">
            {!readOnly && hasAnyFailures && (
              <Button variant="destructive" size="sm" onClick={handleMarkAsFailed} className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md">
                <AlertTriangle className="w-4 h-4" /> Add to Failed Cores
              </Button>
            )}
            {!readOnly && (
              <Button variant="outline" size="sm" onClick={handleDatabaseSave} className="gap-2" disabled={hasAnyFailures}>
                <Save className="w-4 h-4" /> Save
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </div>
      )}

      <div id="print-section">
        {/* Header Grid */}
        <div className="report-header-grid">
          <div className="header-left">
            <h1 className="text-2xl font-bold italic text-red-600 leading-tight">ADVENT ENGINEERS</h1>
          </div>
          <div className="header-right">
            <div className="header-field">
              <span className="field-label">Date :</span>
              <span className="field-value">
                {stage && transformer.testHistory?.[`${stage}_test` as keyof typeof transformer.testHistory]?.reportDate
                  ? new Date(transformer.testHistory[`${stage}_test` as keyof typeof transformer.testHistory].reportDate).toLocaleDateString('en-GB')
                  : new Date().toLocaleDateString('en-GB')}
              </span>
            </div>
            <div className="header-field">
              <span className="field-label">Order No :</span>
              <span className="field-value">{transformer.jobId || transformer.uniqueId}</span>
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
          METERING CORE TEST REPORT
        </div>
        <div className="description-banner">
          Accuracy Verification - {coreId} {transformer.accuracyClass && transformer.accuracyClass !== 'N/A' ? `(Class: ${transformer.accuracyClass})` : ''}
        </div>

        {/* Testing Record Table */}
        <div className="mt-4 border-[1.5px] border-black">
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
                  <p><span className="font-bold italic">CT Ratio :</span> {dynamicRatios.join('-')} / {transformer.ratedSecondaryCurrent || '1'} A</p>
                </td>
              </tr>
              <tr>
                <td className="border-r border-b border-black p-1.5 w-1/2">
                  <p><span className="font-bold italic">Burden :</span> {transformer.burden || '30'} VA</p>
                </td>
                <td className="border-b border-black p-1.5 w-1/2">
                  <p><span className="font-bold italic">Class :</span> {accuracyClass}</p>
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
          <div className="space-y-10">
            {dynamicRatios.map((ratio) => (
              <MeteringTable
                key={ratio}
                ratio={ratio}
                rows={dataByRatio[ratio] || []}
                onUpdate={(idx, field, val) => updateTableData(ratio, idx, field, val)}
                readOnly={readOnly}
              />
            ))}
          </div>

          {/* Footer Signatures */}
          <div className="footer-sig">
            <div className="sig-item">
              <div className="sig-line">Tested by</div>
              <div className="text-xs mt-1 font-bold">{testerName || 'Tester'}</div>
            </div>
            <div className="sig-item">
              <div className="sig-line">Authorised Signatory</div>
              <div className="text-[10px] mt-1 italic italic-bold text-gray-500">Stamp & Signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MeteringTable({ ratio, rows, onUpdate, readOnly }: { ratio: string, rows: any[], onUpdate: (idx: number, f: string, v: string) => void, readOnly?: boolean }) {
  if (!rows || rows.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="nested-table">
        <thead>
          <tr className="bg-yellow">
            <th className="w-32" rowSpan={2}>Testing</th>
            <th rowSpan={2}>% Current</th>
            <th className="text-center" colSpan={2}>100% Burden</th>
            <th className="text-center" colSpan={2}>25% Burden</th>
          </tr>
          <tr className="bg-yellow">
            <th className="text-[10px]">Ratio Error</th>
            <th className="text-[10px]">Phase Error</th>
            <th className="text-[10px]">Ratio Error</th>
            <th className="text-[10px]">Phase Error</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td rowSpan={6} className="bg-yellow font-bold text-center">
              Metering {ratio}
            </td>
          </tr>
          {rows.map((row, idx) => (
            <tr key={idx}>

              <td className="text-center bg-gray-50">{row.current}</td>
              <td className="p-0 border border-gray-400">
                {readOnly ? (
                  <div className={`p-1.5 text-xs text-center font-bold ${row.r100_pass === false ? 'text-red-700' : 'text-blue-800'}`}>
                    {row.r100 || '-'}
                  </div>
                ) : (
                  <Input
                    className={`h-7 text-xs text-center border-none shadow-none focus-visible:ring-1 disabled:opacity-100 disabled:cursor-not-allowed bg-transparent ${row.r100_pass === false ? 'text-red-700 font-bold' : ''}`}
                    value={row.r100}
                    onChange={(e) => onUpdate(idx, 'r100', e.target.value)}
                    disabled={readOnly}
                  />
                )}
              </td>

              <td className="p-0 border border-gray-400">
                {readOnly ? (
                  <div className={`p-1.5 text-xs text-center font-bold ${row.r100_pass === false ? 'text-red-700' : 'text-blue-800'}`}>
                    {row.p100 || '-'}
                  </div>
                ) : (
                  <Input
                    className={`h-7 text-xs text-center border-none shadow-none disabled:opacity-100 disabled:cursor-not-allowed bg-transparent ${row.r100_pass === false ? 'text-red-700 font-bold' : ''}`}
                    value={row.p100}
                    onChange={(e) => onUpdate(idx, 'p100', e.target.value)}
                    disabled={readOnly}
                  />
                )}
              </td>

              <td className="p-0 border border-gray-400">
                {readOnly ? (
                  <div className={`p-1.5 text-xs text-center font-bold ${row.r25_pass === false ? 'text-red-700' : 'text-blue-800'}`}>
                    {row.r25 || '-'}
                  </div>
                ) : (
                  <Input
                    className={`h-7 text-xs text-center border-none shadow-none disabled:opacity-100 disabled:cursor-not-allowed bg-transparent ${row.r25_pass === false ? 'text-red-700 font-bold' : ''}`}
                    value={row.r25}
                    onChange={(e) => onUpdate(idx, 'r25', e.target.value)}
                    disabled={readOnly}
                  />
                )}
              </td>

              <td className="p-0 border border-gray-400">
                {readOnly ? (
                  <div className={`p-1.5 text-xs text-center font-bold ${row.r25_pass === false ? 'text-red-700' : 'text-blue-800'}`}>
                    {row.p25 || '-'}
                  </div>
                ) : (
                  <Input
                    className={`h-7 text-xs text-center border-none shadow-none disabled:opacity-100 disabled:cursor-not-allowed bg-transparent ${row.r25_pass === false ? 'text-red-700 font-bold' : ''}`}
                    value={row.p25}
                    onChange={(e) => onUpdate(idx, 'p25', e.target.value)}
                    disabled={readOnly}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


// function getInitialData(r100: string, p100: string, r25: string, p25: string) {
//   return [
//     { current: '120%', r100, p100, r25, p25 },
//     { current: '100%', r100, p100, r25, p25 },
//     { current: '20%', r100, p100, r25, p25 },
//     { current: '5%', r100, p100, r25, p25 },
//     { current: '1%', r100, p100, r25, p25 },
//   ];

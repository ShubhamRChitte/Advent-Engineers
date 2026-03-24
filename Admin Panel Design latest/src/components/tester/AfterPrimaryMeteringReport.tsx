import axios from "axios";
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Printer, ArrowLeft, Save } from 'lucide-react';
import { Transformer } from './AfterPrimaryTransformersList';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

import { extractAccuracyClass, getInitialData, validateMeteringUI } from '../../utils/meteringUtils';

interface CoreConfig {
  coreNumber: number;
  coreType: 'metering' | 'ps' | 'protection';
  coreId: string;
  accuracyClass?: string | undefined;
}

interface AfterPrimaryMeteringReportProps {
  transformer: Transformer;
  core: CoreConfig; // Changed to full core object to access ID and Number
  testerName: string;
  onBack: () => void;
}

// Fixed core ID prop usage
export function AfterPrimaryMeteringReport({
  transformer,
  core,
  testerName,
  onBack,
}: AfterPrimaryMeteringReportProps) {

  // Use ratios from transformer, fallback to defaults if missing (shouldn't happen with update)
  const dynamicRatios = transformer.ratios && transformer.ratios.length > 0 ? transformer.ratios : ['200/1'];

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

  // State management: Map Ratio -> Array of Rows
  const [dataByRatio, setDataByRatio] = useState<{ [ratio: string]: any[] }>(() => {
    // 1️⃣ Initialize with Defaults first
    const initial: { [ratio: string]: any[] } = {};
    const accClass = extractAccuracyClass(core.accuracyClass);
    dynamicRatios.forEach((ratio: string) => {
      initial[ratio] = getInitialData(accClass);
    });

    // 2️⃣ Attempt to sync with prop if it has history (Fast Load)
    if (transformer.testHistory?.primary_test?.metering_results?.length > 0) {
      // Filter for THIS core
      const myResults = transformer.testHistory.primary_test.metering_results.filter((res: any) =>
        res.internalCoreNo === core.coreId || res.coreId === core.coreId
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
  useEffect(() => {
    const fetchLatestData = async () => {
      try {
        const res = await axios.get(`http://localhost:3002/api/transformers/${transformer.uniqueId}`, { withCredentials: true });
        const freshTransformer = res.data;

        if (freshTransformer?.testHistory?.primary_test?.metering_results?.length > 0) {
          console.log("Found saved primary metering results, loading...", freshTransformer.testHistory.primary_test.metering_results);

          const myResults = freshTransformer.testHistory.primary_test.metering_results.filter((res: any) =>
            res.internalCoreNo === core.coreId || res.coreId === core.coreId
          );

          setDataByRatio(prev => {
            const newState = { ...prev };
            const accClass = extractAccuracyClass(core.accuracyClass);

            myResults.forEach((block: any) => {
              // Apply validation to restored rows
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

              // Only update if we have this ratio in our current config
              if (newState[block.ratioValue]) {
                newState[block.ratioValue] = validatedRows;
              }
            });
            return newState;
          });
        }
      } catch (err) {
        console.error("Failed to load existing test data", err);
      }
    };

    fetchLatestData();
  }, [transformer.uniqueId, core.coreId, dbLimits]);

  const updateTableData = (ratio: string, index: number, field: string, value: string) => {
    setDataByRatio(prev => {
      const rows = prev[ratio] || [];
      const currentRows = [...rows];
      const updatedRow = { ...currentRows[index], [field]: value };

      const accClass = extractAccuracyClass(core.accuracyClass);

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

  const buildMeteringResults = () => {
    return dynamicRatios.map((ratio: string) => ({
      internalCoreNo: core.coreId,
      ratioValue: ratio,
      accuracyClass: extractAccuracyClass(core.accuracyClass),
      rows: dataByRatio[ratio] || []
    }));
  };

  const handleDatabaseSave = async () => {
    console.log("handleDatabaseSave: STARTED");
    try {
      const meteringResults = buildMeteringResults();
      console.log("handleDatabaseSave: meteringResults built", meteringResults);

      const payload = {
        uniqueId: transformer.uniqueId,
        loginType: "primary_login",
        tester: testerName,
        coreId: core.coreId,
        metering_results: meteringResults
      };
      console.log("handleDatabaseSave: Payload ready to send:", payload);

      const response = await axios.post(
        "http://localhost:3002/transformer-primary-metering-tests",
        payload,
        { withCredentials: true }
      );
      console.log("handleDatabaseSave: Response received", response);

      toast.success("Primary Metering Test Saved!");
    } catch (error) {
      console.error("handleDatabaseSave: ERROR CAUGHT", error);
      toast.error("Failed to save data.");
    }
  };

  const handleMarkAsFailed = async () => {
    let reasons: string[] = [];
    dynamicRatios.forEach((ratio: string) => {
      const rows = dataByRatio[ratio] || [];
      rows.forEach(row => {
        if (row.r100_pass === false && row.r100_reason && !reasons.includes(row.r100_reason)) reasons.push(row.r100_reason);
        if (row.r25_pass === false && row.r25_reason && !reasons.includes(row.r25_reason)) reasons.push(row.r25_reason);
      });
    });

    const finalReason = reasons.length > 0 ? reasons.join(' | ') : "Test readings exceeded configuration limits.";

    try {
      await handleDatabaseSave();

      const payload = {
        orderId: (transformer as any).orderId?._id || (transformer as any).orderId || (transformer as any)._id,
        internalCoreNo: core.coreId,
        failureReason: finalReason,
        failureStage: "primary_metering_test",
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
    <div className="space-y-6">
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
          input, select {
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

      <div className="flex items-center justify-between no-print">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex gap-2">
          {hasAnyFailures && (
            <Button variant="destructive" size="sm" onClick={handleMarkAsFailed} className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md">
              <AlertTriangle className="w-4 h-4" /> Add to Failed Cores
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDatabaseSave} className="gap-2" disabled={hasAnyFailures}>
            <Save className="w-4 h-4" /> Save
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
      </div>

      <div id="print-section">
        {/* Header Grid */}
        <div className="report-header-grid">
          <div className="header-left">
            <h1 className="text-2xl font-bold italic text-red-600 leading-tight">ADVENT ENGINEERS</h1>
          </div>
          <div className="header-right">
            <div className="header-field">
              <span className="field-label">Date :</span>
              <span className="field-value">{new Date().toLocaleDateString('en-GB')}</span>
            </div>
            <div className="header-field">
              <span className="field-label">Order No :</span>
              <span className="field-value">{transformer.uniqueId}</span>
            </div>
            <div className="header-field">
              <span className="field-label">Client :</span>
              <span className="field-value">N/A</span>
            </div>
            <div className="header-field">
              <span className="field-label">Unit No :</span>
              <span className="field-value">{transformer.uniqueId}</span>
            </div>
            <div className="header-field">
              <span className="field-label">Class :</span>
              <span className="field-value">{core.accuracyClass || '0.5'}</span>
            </div>
          </div>
        </div>

        {/* Banners */}
        <div className="report-title-banner">
          METERING CORE TEST REPORT
        </div>
        <div className="description-banner">
          Primary Verification - {core.coreId}
        </div>

        <div className="mt-4">
          <div className="space-y-10">
            {dynamicRatios.map((ratio: string) => (
              <MeteringTable
                key={ratio}
                ratio={ratio}
                rows={dataByRatio[ratio] || []}
                onUpdate={(idx, field, val) => updateTableData(ratio, idx, field, val)}
              />
            ))}
          </div>
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
  );
}

// Editable Table Component
function MeteringTable({ ratio, rows, onUpdate }: { ratio: string, rows: any[], onUpdate: (idx: number, f: string, v: string) => void }) {
  if (!rows) return null;

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
              <td className="bg-gray-50">{row.current}</td>
              <td className="p-1">
                <Input className={`h-7 text-xs text-center border-none shadow-none focus-visible:ring-0 bg-transparent ${row.r100_pass === false ? 'text-red-700 font-bold' : ''}`}
                  value={row.r100} onChange={(e) => onUpdate(idx, 'r100', e.target.value)} />
              </td>
              <td className="p-1">
                <Input className={`h-7 text-xs text-center border-none shadow-none focus-visible:ring-0 bg-transparent ${row.r100_pass === false ? 'text-red-700 font-bold' : ''}`}
                  value={row.p100} onChange={(e) => onUpdate(idx, 'p100', e.target.value)} />
              </td>
              <td className="p-1">
                <Input className={`h-7 text-xs text-center border-none shadow-none focus-visible:ring-0 bg-transparent ${row.r25_pass === false ? 'text-red-700 font-bold' : ''}`}
                  value={row.r25} onChange={(e) => onUpdate(idx, 'r25', e.target.value)} />
              </td>
              <td className="p-1">
                <Input className={`h-7 text-xs text-center border-none shadow-none focus-visible:ring-0 bg-transparent ${row.r25_pass === false ? 'text-red-700 font-bold' : ''}`}
                  value={row.p25} onChange={(e) => onUpdate(idx, 'p25', e.target.value)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


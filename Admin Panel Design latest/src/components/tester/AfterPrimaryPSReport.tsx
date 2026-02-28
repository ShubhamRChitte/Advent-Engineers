import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ArrowLeft, Save, Printer } from 'lucide-react';
import { toast } from 'sonner';


export function AfterPrimaryPSReport({ transformer, core, testerName, onBack }: any) {
  // Use ratios from transformer, fallback to defaults
  const dynamicRatios = transformer.ratios && transformer.ratios.length > 0 ? transformer.ratios : ['200/1'];

  // State initialization
  const [psData, setPsData] = useState(() => {
    return dynamicRatios.map((ratio: string) => ({
      ratioValue: ratio,
      turnRatioError: '',
      resistance: '',
      vk: '',
      vkVal: '',
      iexVk: '',
      iex11Vk: ''
    }));
  });

  // Load existing data if available
  useEffect(() => {
    // 1. Initial load from props (fast load)
    if (transformer.testHistory?.primary_test?.ps_results?.length > 0) {
      loadDataFromHistory(transformer.testHistory.primary_test.ps_results);
    }

    // 2. Fetch fresh data from backend (reliable load)
    const fetchLatestData = async () => {
      try {
        const res = await axios.get(`http://localhost:3002/api/transformers/${transformer.uniqueId}`, { withCredentials: true });
        const freshTransformer = res.data;
        if (freshTransformer?.testHistory?.primary_test?.ps_results?.length > 0) {
          console.log("PS Report: Fetched latest data from backend");
          loadDataFromHistory(freshTransformer.testHistory.primary_test.ps_results);
        }
      } catch (err) {
        console.error("Failed to load existing PS test data", err);
      }
    };

    fetchLatestData();
  }, [transformer.uniqueId, core.coreId]);

  const loadDataFromHistory = (results: any[]) => {
    // Filter for THIS core
    const myResults = results.filter((res: any) =>
      res.internalCoreNo === core.coreId || res.coreId === core.coreId
    );

    if (myResults.length > 0) {
      // Merge with current ratios
      setPsData((prev: any[]) => {
        return prev.map(row => {
          const found = myResults.find((r: any) => r.ratioValue === row.ratioValue);
          if (found) {
            // Merge found data into row
            return { ...row, ...found };
          }
          return row;
        });
      });
    }
  };

  const handleUpdate = (idx: number, field: string, val: string) => {
    const updated = [...psData];
    updated[idx] = { ...updated[idx], [field]: val };
    setPsData(updated);
  };



  const handleDatabaseSave = async () => {
    console.log("handleDatabaseSave (PS): STARTED");
    try {
      // 1. Prepare the payload based on PSBlockSchema
      const payload = {
        uniqueId: transformer.uniqueId,
        tester: testerName || 'shubham', // Use prop or fallback
        coreId: core.coreId,
        ps_results: psData.map((row: any) => ({
          internalCoreNo: core.coreId, // key for identification
          ratioValue: row.ratioValue,
          turnRatioError: row.turnRatioError,
          resistance: row.resistance,
          vk: row.vk,
          vkVal: row.vkVal,
          iexVk: row.iexVk,
          iex11Vk: row.iex11Vk
        }))
      };

      console.log("handleDatabaseSave (PS): Payload ready", payload);

      // 2. Execute POST request
      const response = await axios.post(
        "http://localhost:3002/transformer-primary-ps-tests",
        payload,
        { withCredentials: true }
      );

      console.log("handleDatabaseSave (PS): Response received", response);
      toast.success("Primary PS Test results saved successfully!");

    } catch (error: any) {
      console.error("handleDatabaseSave (PS): ERROR", error);
      toast.error(error.response?.data?.message || "Failed to save PS data to database.");
    }
  };

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
          </div>
        </div>

        {/* Banners */}
        <div className="report-title-banner">
          PS CORE TEST REPORT
        </div>
        <div className="description-banner">
          Primary Verification - {core.coreId}
        </div>

        <div className="mt-4">
          <div className="overflow-x-auto">
            <table className="nested-table">
              <thead>
                <tr className="bg-yellow">
                  <th className="w-[160px]" rowSpan={2}>PS Core Ratio</th>
                  <th className="w-[120px]" rowSpan={2}>Turn Ratio Error at 100%</th>
                  <th className="w-[100px]" rowSpan={2}>Resistance (Ω)</th>
                  <th className="text-center" colSpan={3}>Excitation Current Details</th>
                </tr>
                <tr className="bg-yellow">
                  <th className="text-center">Vk / 1.1Vk (V)</th>
                  <th className="text-center">lex at Vk</th>
                  <th className="text-center">lex at 1.1Vk</th>
                </tr>
              </thead>
              <tbody>
                {psData.map((row: any, i: number) => (
                  <React.Fragment key={i}>
                    <tr>
                      <td rowSpan={2} className="bg-yellow font-bold text-center align-middle">
                        PS Core Ratio - {row.ratioValue}
                      </td>
                      <td className="border border-gray-400 p-0" rowSpan={2}>
                        <Input className="border-none text-center h-16 shadow-none text-blue-800 font-bold"
                          value={row.turnRatioError} onChange={e => handleUpdate(i, 'turnRatioError', e.target.value)} />
                      </td>
                      <td className="border border-gray-400 p-0" rowSpan={2}>
                        <Input className="border-none text-center h-16 shadow-none text-blue-800 font-bold"
                          value={row.resistance} onChange={e => handleUpdate(i, 'resistance', e.target.value)} />
                      </td>
                      <td className="bg-white border-b-0 h-8">
                        <div className="flex items-center px-1">
                          <span className="font-bold text-[#0070c0]">Vk :</span>
                          <Input className="border-none text-[#0070c0] font-bold h-6 shadow-none flex-1 text-center"
                            value={row.vk} onChange={e => handleUpdate(i, 'vk', e.target.value)} />
                        </div>
                      </td>
                      <td className="border border-gray-400 p-0" rowSpan={2}>
                        <Input className="border-none text-center h-16 shadow-none text-blue-800 font-bold"
                          value={row.iexVk} onChange={e => handleUpdate(i, 'iexVk', e.target.value)} />
                      </td>
                      <td className="border border-gray-400 p-0" rowSpan={2}>
                        <Input className="border-none text-center h-16 shadow-none text-blue-800 font-bold"
                          value={row.iex11Vk} onChange={e => handleUpdate(i, 'iex11Vk', e.target.value)} />
                      </td>
                    </tr>
                    <tr className="border-b border-gray-400">
                      <td className="bg-white h-8">
                        <div className="flex items-center px-1">
                          <span className="font-bold text-[#0070c0]">1.1Vk :</span>
                          <Input className="border-none text-[#0070c0] font-bold h-6 shadow-none flex-1 text-center"
                            value={row.vkVal} onChange={e => handleUpdate(i, 'vkVal', e.target.value)} />
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
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

      <div className="flex gap-3 no-print pt-4">
        <Button onClick={handleDatabaseSave} variant="outline" size="sm" className="gap-2">
          <Save className="w-4 h-4" /> Save
        </Button>
      </div>
    </div>
  );
}

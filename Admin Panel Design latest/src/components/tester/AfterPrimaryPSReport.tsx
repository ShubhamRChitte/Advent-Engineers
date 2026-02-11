import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ArrowLeft, Save, Download, Printer } from 'lucide-react';
import { toast } from 'sonner';

interface CoreConfig {
  coreNumber: number;
  coreType: 'metering' | 'ps' | 'protection';
  coreId: string;
}

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
    <div className="space-y-6 p-4 bg-white">
      <div className="flex items-center justify-between no-print">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
          <Printer className="w-4 h-4" /> Print
        </Button>
      </div>

      <Card className="p-0 border border-gray-400 overflow-hidden shadow-none rounded-none">
        <div className="bg-[#92d050] border-b border-gray-400 p-2 text-center">
          <h2 className="text-sm font-bold uppercase">Pretest After Primary Winding</h2>
        </div>

        <div className="flex justify-between items-center p-3 border-b border-gray-400">
          <div>
            <h3 className="text-red-600 font-bold uppercase italic text-xl">Advent Engineers</h3>
            <span className="text-[10px] font-bold text-gray-500 uppercase">PS Core Test Report</span>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase">PS Core No: <span className="border-b border-black px-2 text-blue-700 italic">{core.coreId}</span></p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-400 p-2 w-[160px]" rowSpan={2}>PS Core Ratio</th>
                <th className="border border-gray-400 p-2 w-[120px]" rowSpan={2}>Turn Ratio Error at 100%</th>
                <th className="border border-gray-400 p-2 w-[100px]" rowSpan={2}>Resistance (Ω)</th>
                <th className="border border-gray-400 p-2 text-center" colSpan={3}>Excitation Current Details</th>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-2 text-center">Vk / 1.1Vk (V)</th>
                <th className="border border-gray-400 p-2 text-center">lex at Vk</th>
                <th className="border border-gray-400 p-2 text-center">lex at 1.1Vk</th>
              </tr>
            </thead>
            <tbody>
              {psData.map((row: any, i: number) => (
                <React.Fragment key={i}>
                  <tr>
                    <td rowSpan={2} className="border border-gray-400 p-2 bg-[#ffff00] font-bold text-center align-middle">
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
                    <td className="border border-gray-400 p-1 bg-white border-b-0 h-8 flex items-center">
                      <span className="font-bold text-[#0070c0]">Vk :</span>
                      <Input className="border-none text-[#0070c0] font-bold h-6 shadow-none flex-1"
                        value={row.vk} onChange={e => handleUpdate(i, 'vk', e.target.value)} />
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
                    <td className="border border-gray-400 p-1 bg-white h-8 flex items-center">
                      <span className="font-bold text-[#0070c0]">1.1Vk :</span>
                      <Input className="border-none text-[#0070c0] font-bold h-6 shadow-none flex-1"
                        value={row.vkVal} onChange={e => handleUpdate(i, 'vkVal', e.target.value)} />
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex gap-3 no-print pt-4">
        <Button onClick={handleDatabaseSave} variant="outline" className="gap-2">
          <Save className="w-4 h-4" /> Save to Database
        </Button>
      </div>
    </div>
  );
}
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ArrowLeft, Save, Download, Printer } from 'lucide-react';
import { Transformer } from './SecondaryTransformersList';
import { toast } from 'sonner';

interface CoreConfig {
  coreNumber: number;
  coreType: 'metering' | 'ps' | 'protection';
  coreId: string;
}

interface PrimaryProtectionReportProps {
  transformer: Transformer;
  core: CoreConfig;
  testerName: string;
  onBack: () => void;
}

interface ProtectionTestRow {
  ratio: string;
  burden100_1: string;
  burden100_2: string;
  resistance: string;
  secondaryLimitingVtg: string;
  excitationCurrent: string;
  compositeError: string;
}

export function AfterPrimaryProtectionReport({
  transformer,
  core,
  testerName,
  onBack,
}: PrimaryProtectionReportProps) {

  // Use ratios from transformer, fallback to defaults
  const dynamicRatios = (transformer as any).ratios && (transformer as any).ratios.length > 0 ? (transformer as any).ratios : ['200/1'];

  const [testResults, setTestResults] = useState<ProtectionTestRow[]>(() =>
    dynamicRatios.map((ratio: string) => ({
      ratio,
      burden100_1: '',
      burden100_2: '',
      resistance: '',
      secondaryLimitingVtg: '',
      excitationCurrent: '',
      compositeError: ''
    }))
  );

  // Load existing data if available
  useEffect(() => {
    // 1. Initial load from props
    if ((transformer as any).testHistory?.primary_test?.protection_results?.length > 0) {
      loadDataFromHistory((transformer as any).testHistory.primary_test.protection_results);
    }

    // 2. Fetch fresh data from backend
    const fetchLatestData = async () => {
      try {
        const res = await axios.get(`http://localhost:3002/api/transformers/${transformer.uniqueId}`, { withCredentials: true });
        const freshTransformer = res.data;
        if (freshTransformer?.testHistory?.primary_test?.protection_results?.length > 0) {
          console.log("Protection Report: Fetched latest data from backend");
          loadDataFromHistory(freshTransformer.testHistory.primary_test.protection_results);
        }
      } catch (err) {
        console.error("Failed to load existing Protection test data", err);
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
      setTestResults((prev) => {
        return prev.map(row => {
          const found = myResults.find((r: any) => r.ratioValue === row.ratio);
          if (found) {
            return {
              ...row,
              burden100_1: found.burden100_1 || '',
              burden100_2: found.burden100_2 || '',
              resistance: found.resistance || '',
              secondaryLimitingVtg: found.secondaryLimitingVtg || '',
              excitationCurrent: found.excitationCurrent || '',
              compositeError: found.compositeError || ''
            };
          }
          return row;
        });
      });
    }
  };


  const handleInputChange = (index: number, field: keyof ProtectionTestRow, value: string) => {
    const updated = [...testResults];
    updated[index] = { ...updated[index], [field]: value };
    setTestResults(updated);
  };



  const handleDatabaseSave = async () => {
    console.log("handleDatabaseSave: STARTED (Protection)");
    try {
      // 1. Build the array based on your ProtectionBlockSchema
      const protectionResults = testResults.map(row => ({
        internalCoreNo: core.coreId,
        ratioValue: row.ratio,
        burden100_1: row.burden100_1,
        burden100_2: row.burden100_2,
        resistance: row.resistance,
        secondaryLimitingVtg: row.secondaryLimitingVtg,
        excitationCurrent: row.excitationCurrent,
        compositeError: row.compositeError
      }));

      console.log("handleDatabaseSave: protectionResults built", protectionResults);

      const payload = {
        uniqueId: transformer.uniqueId,
        loginType: "primary_login", // Consistent with your schema path
        tester: testerName,
        coreId: core.coreId,
        protection_results: protectionResults
      };

      console.log("handleDatabaseSave: Payload ready", payload);

      console.log("handleDatabaseSave: Sending Request...");
      const response = await axios.post(
        "http://localhost:3002/transformer-primary-protection-tests",
        payload,
        { withCredentials: true }
      );

      console.log("handleDatabaseSave: Response received", response);
      toast.success("Protection data saved to database successfully!");

    } catch (error: any) {
      console.error("handleDatabaseSave: ERROR CAUGHT", error);
      toast.error("Failed to save protection data.");
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Top Navigation */}
      <div className="flex items-center justify-between no-print">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
          <Printer className="w-4 h-4" /> Print
        </Button>
      </div>

      <Card className="p-0 border border-gray-400 overflow-hidden">
        {/* Main Title Header */}
        <div className="bg-[#92d050] border-b border-gray-400 p-2 text-center">
          <h2 className="text-sm font-bold uppercase">Pretest After Primary Winding</h2>
        </div>

        {/* Advent Engineers Sub-Header */}
        <div className="flex justify-between items-center p-3 border-b border-gray-400">
          <div>
            <h3 className="text-red-600 font-bold uppercase italic text-lg leading-tight">Advent Engineers</h3>
            <p className="text-[10px] text-gray-500 font-medium tracking-tighter">TRANSFORMER TESTING REPORT</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="flex items-center gap-1 text-xs">
              <span className="font-bold">protection core no.</span>
              <span className="border-b border-gray-600 px-4 min-w-[80px] italic text-blue-700">{core.coreId}</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 uppercase">Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-400 p-2 w-[140px]" rowSpan={2}>Core Ratio</th>
                <th className="border border-gray-400 p-2 w-[80px]" rowSpan={2}>100%</th>
                <th className="border border-gray-400 p-2 text-center" colSpan={4}>Protection Analysis Results</th>
              </tr>
              <tr className="bg-gray-50">
                <th className="border border-gray-400 p-2 text-center font-semibold">Resistance (Ω)</th>
                <th className="border border-gray-400 p-2 text-center font-semibold">Secondary Limiting Voltage</th>
                <th className="border border-gray-400 p-2 text-center font-semibold">Excitation Current</th>
                <th className="border border-gray-400 p-2 text-center font-semibold">Composite Error</th>
              </tr>
            </thead>
            <tbody>
              {testResults.map((row, index) => (
                <React.Fragment key={index}>
                  {/* First row of the block: Handling the ratio label and burden error */}
                  <tr key={`${index}-row1`}>
                    <td rowSpan={2} className="border border-gray-400 p-2 bg-[#ffff00] font-bold text-center align-middle">
                      Protection Core<br />Ratio - {row.ratio}
                    </td>
                    <td className="border border-gray-400 bg-gray-100">100%</td>
                    <td className="border border-gray-400 bg-gray-100"></td>
                    <td className="border border-gray-400 p-0">
                      <Input
                        className="border-none text-center h-8 bg-transparent text-blue-800 font-medium"
                        value={row.burden100_1}
                        onChange={(e) => handleInputChange(index, 'burden100_1', e.target.value)}
                        placeholder=""
                      />
                    </td>
                    <td className="border border-gray-400 p-0">
                      <Input
                        className="border-none text-center h-8 bg-transparent text-blue-800 font-medium"
                        value={row.burden100_2}
                        onChange={(e) => handleInputChange(index, 'burden100_2', e.target.value)}
                        placeholder=""
                      />
                    </td>
                    <td className="border border-gray-400 bg-gray-100"></td>
                  </tr>
                  {/* Second row of the block: The "Value" row with primary data */}
                  <tr key={`${index}-row2`}>
                    <td className="border border-gray-400 p-2 text-center font-bold bg-gray-50 uppercase text-[9px]">Value</td>
                    <td className="border border-gray-400 p-0">
                      <Input
                        className="border-none text-center h-8 bg-transparent text-blue-800 font-bold"
                        value={row.resistance}
                        onChange={(e) => handleInputChange(index, 'resistance', e.target.value)}
                      />
                    </td>
                    <td className="border border-gray-400 p-0">
                      <Input
                        className="border-none text-center h-8 bg-transparent text-blue-800 font-bold"
                        value={row.secondaryLimitingVtg}
                        onChange={(e) => handleInputChange(index, 'secondaryLimitingVtg', e.target.value)}
                      />
                    </td>
                    <td className="border border-gray-400 p-0">
                      <Input
                        className="border-none text-center h-8 bg-transparent text-blue-800 font-bold"
                        value={row.excitationCurrent}
                        onChange={(e) => handleInputChange(index, 'excitationCurrent', e.target.value)}
                      />
                    </td>
                    <td className="border border-gray-400 p-0">
                      <Input
                        className="border-none text-center h-8 bg-transparent text-blue-800 font-bold"
                        value={row.compositeError}
                        onChange={(e) => handleInputChange(index, 'compositeError', e.target.value)}
                      />
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Database Actions */}
      <div className="flex gap-3 no-print">
        <Button
          onClick={handleDatabaseSave}
          className="bg-red-600 hover:bg-red-700 gap-2"
        >
          <Save className="w-4 h-4" /> Save to Database
        </Button>
      </div>
    </div>
  );
}
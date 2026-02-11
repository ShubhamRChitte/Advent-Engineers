import axios from "axios";
import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Printer, Download, ArrowLeft, Save } from 'lucide-react';
import { AfterPrimaryTransformer } from './AfterPrimaryTransformersList';
import { toast } from 'sonner';

interface CoreConfig {
  coreNumber: number;
  coreType: 'metering' | 'ps' | 'protection';
  coreId: string;
}

interface AfterPrimaryMeteringReportProps {
  transformer: AfterPrimaryTransformer;
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

  // State management: Map Ratio -> Array of Rows
  const [dataByRatio, setDataByRatio] = useState<{ [ratio: string]: any[] }>(() => {
    // 1️⃣ Initialize with Defaults first
    const initial: { [ratio: string]: any[] } = {};
    dynamicRatios.forEach(ratio => {
      initial[ratio] = getInitialData('', '', '', '');
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
            myResults.forEach((block: any) => {
              // Only update if we have this ratio in our current config
              if (newState[block.ratioValue]) {
                newState[block.ratioValue] = block.rows;
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
  }, [transformer.uniqueId, core.coreId]);

  const updateTableData = (ratio: string, index: number, field: string, value: string) => {
    setDataByRatio(prev => {
      const currentRows = [...prev[ratio]];
      currentRows[index] = { ...currentRows[index], [field]: value };
      return { ...prev, [ratio]: currentRows };
    });
  };

  const buildMeteringResults = () => {
    return dynamicRatios.map(ratio => ({
      internalCoreNo: core.coreId,
      ratioValue: ratio,
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

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between no-print">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleDatabaseSave} className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md hover:bg-green-600 hover:text-white">
            <Save className="w-4 h-4" /> Save to Database
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="text-center mb-6 pb-4 border-b border-gray-200">
          <h3 className="text-red-600 font-bold text-xl uppercase">Advent Engineers</h3>
          <p className="text-sm font-semibold">AFTER PRIMARY METERING REPORT - {dynamicRatios.join(' / ')}</p>
        </div>

        {/* Info Header */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm border p-4 rounded bg-gray-50">
          <div>
            <p className="text-gray-500">Transformer ID</p>
            <p className="font-semibold">{transformer.uniqueId}</p>
          </div>
          <div>
            <p className="text-gray-500">Core ID</p>
            <p className="font-semibold text-blue-600">{core.coreId}</p>
          </div>
          <div>
            <p className="text-gray-500">Core Number</p>
            <p className="font-semibold">Core {core.coreNumber}</p>
          </div>
          <div>
            <p className="text-gray-500">Tester</p>
            <p className="font-semibold">{testerName}</p>
          </div>
        </div>

        <div className="space-y-10">
          {dynamicRatios.map((ratio) => (
            <MeteringTable
              key={ratio}
              ratio={ratio}
              rows={dataByRatio[ratio]}
              onUpdate={(idx, field, val) => updateTableData(ratio, idx, field, val)}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

// Editable Table Component
function MeteringTable({ ratio, rows, onUpdate }: { ratio: string, rows: any[], onUpdate: (idx: number, f: string, v: string) => void }) {
  if (!rows) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-400 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="border border-gray-400 p-2 w-32" rowSpan={2}>Testing</th>
            <th className="border border-gray-400 p-2" rowSpan={2}>% Current</th>
            <th className="border border-gray-400 p-2 text-center" colSpan={2}>100% Burden</th>
            <th className="border border-gray-400 p-2 text-center" colSpan={2}>25% Burden</th>
          </tr>
          <tr>
            <th className="border border-gray-400 p-1 text-[10px]">Ratio Error</th>
            <th className="border border-gray-400 p-1 text-[10px]">Phase Error</th>
            <th className="border border-gray-400 p-1 text-[10px]">Ratio Error</th>
            <th className="border border-gray-400 p-1 text-[10px]">Phase Error</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td rowSpan={6} className="border border-gray-400 p-2 bg-yellow-50 font-bold text-center">
              Metering {ratio}
            </td>
          </tr>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td className="border border-gray-400 p-2 text-center bg-gray-50">{row.current}</td>
              <td className="border border-gray-400 p-1">
                <Input className="h-7 text-xs text-center border-none shadow-none focus-visible:ring-1"
                  value={row.r100} onChange={(e) => onUpdate(idx, 'r100', e.target.value)} />
              </td>
              <td className="border border-gray-400 p-1">
                <Input className="h-7 text-xs text-center border-none shadow-none"
                  value={row.p100} onChange={(e) => onUpdate(idx, 'p100', e.target.value)} />
              </td>
              <td className="border border-gray-400 p-1">
                <Input className="h-7 text-xs text-center border-none shadow-none"
                  value={row.r25} onChange={(e) => onUpdate(idx, 'r25', e.target.value)} />
              </td>
              <td className="border border-gray-400 p-1">
                <Input className="h-7 text-xs text-center border-none shadow-none"
                  value={row.p25} onChange={(e) => onUpdate(idx, 'p25', e.target.value)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getInitialData(r100: string, p100: string, r25: string, p25: string) {
  return [
    { current: '120%', r100, p100, r25, p25 },
    { current: '100%', r100, p100, r25, p25 },
    { current: '20%', r100, p100, r25, p25 },
    { current: '5%', r100, p100, r25, p25 },
    { current: '1%', r100, p100, r25, p25 },
  ];
}
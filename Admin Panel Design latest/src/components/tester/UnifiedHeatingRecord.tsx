import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Save, ArrowLeft, Loader2, CheckCircle, Clock, Printer } from 'lucide-react';
import { Card } from '../ui/card';
import logoImage from 'figma:asset/9d5dbd3020690d903579eb3ff66bac216cd36f83.png';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { TimePicker24h } from '../ui/time-picker-24h';

// ─── Type Definitions ──────────────────────────────────────────────────────────

export interface ProcessStep {
  process: string;
  duration: string;
  startDate: string;
  startTime: string;
  completionDate: string;
  completionTime: string;
  remarks: string;
}

export interface HeatingRecordBlock {
  id: string;
  transformerId: string;
  groupNo: string;
  serialNumber: string;
  jobNo: string;
  leftInputs?: { col1: string; col2: string }[];
  startDate: string;
  processSteps: ProcessStep[];
  preparedBy: string;
  productionManager: string;
  verifiedBy: string;
  date: string;
}

interface UnifiedHeatingRecordProps {
  voltage: string;
  type: string; // "CT" or "PT"
  record: HeatingRecordBlock;
  saving: boolean;
  onBack: () => void;
  onSave: (isApprove?: boolean) => void;
  onUpdateProcessStep: (blockId: string, stepIndex: number, field: keyof ProcessStep, value: string) => void;
  onUpdateBlockField: (blockId: string, field: keyof HeatingRecordBlock, value: string) => void;
  readOnly?: boolean;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

/** Company letterhead header */
function SheetHeader() {
  return (
    <div className="flex items-center border-b-2 border-black p-4">
      <div className="w-28 h-24 flex items-center justify-center flex-shrink-0">
        <ImageWithFallback src={logoImage} alt="Advent Logo" className="max-w-full max-h-full object-contain" />
      </div>
      <div className="flex-1 text-center">
        <h1 className="font-bold text-red-600 tracking-wide" style={{ fontFamily: 'serif', fontSize: '48px', lineHeight: '1.2' }}>
          Advent Engineers
        </h1>
        <p className="text-gray-700 font-medium mt-1">A-12, MIDC, Malegaon, Sinnar,Nashik</p>
      </div>
      <div className="w-28 flex-shrink-0" />
    </div>
  );
}

/** Bordered document title (Dynamic Voltage & Type) */
function SheetTitle({ voltage, type }: { voltage: string; type: string }) {
  return (
    <div className="border-b-2 border-black py-5 px-4 text-center">
      <h2 className="text-3xl font-bold" style={{ fontFamily: 'serif' }}>
        Heating Record [{voltage} {type}]
      </h2>
    </div>
  );
}

function TableHeader() {
  return (
    <thead>
      <tr className="text-sm">
        <th colSpan={2} className="border border-black p-2 font-bold text-center align-bottom" style={{ width: '14%' }}>
          Job ID
        </th>
        <th className="border border-black p-2 font-bold text-center align-bottom" style={{ width: '24%' }}>
          Required Process<br />/temp.
        </th>
        <th className="border border-black p-2 font-bold text-center align-bottom" style={{ width: '13%' }}>
          Duration
        </th>
        <th className="border border-black p-2 font-bold text-center align-bottom" style={{ width: '17%' }}>
          Date and<br />Time of<br />Start
        </th>
        <th className="border border-black p-2 font-bold text-center align-bottom" style={{ width: '17%' }}>
          Date of<br />Completio<br />and Time
        </th>
        <th className="border border-black p-2 font-bold text-center align-bottom" style={{ width: '19%' }}>
          Remarks
        </th>
      </tr>
    </thead>
  );
}

/** A single transformer group (Refactored for Transformer-wise view) */
function GroupBlock({ 
  block, 
  onUpdateProcessStep, 
  onUpdateBlockField, 
  readOnly,
  voltage 
}: { 
  block: HeatingRecordBlock; 
  onUpdateProcessStep: any; 
  onUpdateBlockField: any; 
  readOnly?: boolean | undefined;
  voltage: string;
}) {
  return (
    <React.Fragment>
      <tr className="font-bold text-sm">
        <td colSpan={2} className="border border-black px-1 py-1 align-middle text-center">
          <Input
            value={block.jobNo || ""}
            readOnly
            className="h-6 text-sm font-bold border-none shadow-none focus-visible:ring-0 bg-transparent w-full text-center p-0 rounded-none bg-white cursor-default"
          />
        </td>
        <td colSpan={3} className="border border-black px-1 py-1 text-center align-middle">
          <Input
            value={block.serialNumber || ""}
            onChange={(e) => onUpdateBlockField(block.id, 'serialNumber', e.target.value)}
            className={`h-6 text-sm font-bold text-center border-none shadow-none focus-visible:ring-0 bg-transparent w-full p-0 rounded-none ${readOnly ? 'bg-gray-100' : 'bg-white'}`}
            placeholder={`${voltage} – CT = 1`}
            disabled={readOnly}
          />
        </td>
        <td colSpan={2} className="border border-black px-2 py-1 text-right align-middle">
          <div className="flex items-center justify-end font-bold text-sm">
            <span className="mr-1">Date-</span>
            <Input
              type="date"
              value={block.startDate || ""}
              onChange={(e) => onUpdateBlockField(block.id, 'startDate', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className={`h-6 text-sm border-none bg-transparent shadow-none focus-visible:ring-0 font-bold w-[120px] text-right p-0 rounded-none ${readOnly ? 'bg-gray-100' : 'bg-white'}`}
              disabled={readOnly}
            />
          </div>
        </td>
      </tr>

      {block.processSteps.map((step, sIndex) => (
        <React.Fragment key={sIndex}>
          <tr className="text-sm">
            <td className="border border-black px-1 py-1 text-center align-middle">
              <Input
                type="text"
                value={block.leftInputs?.[sIndex * 2]?.col1 || ''}
                onChange={(e) => {
                  const arr = [...(block.leftInputs || [])];
                  const current = arr[sIndex * 2] || { col1: "", col2: "" };
                  arr[sIndex * 2] = { col1: e.target.value, col2: current.col2 || "" };
                  onUpdateBlockField(block.id, 'leftInputs', arr);
                }}
                className={`w-full text-center border-none bg-transparent outline-none shadow-none focus-visible:ring-0 text-xs p-0 rounded-none h-6`}
                disabled={readOnly}
              />
            </td>
            <td className="border border-black px-1 py-1 text-center align-middle">
              <Input
                type="text"
                value={block.leftInputs?.[sIndex * 2]?.col2 || ''}
                onChange={(e) => {
                  const arr = [...(block.leftInputs || [])];
                  const current = arr[sIndex * 2] || { col1: "", col2: "" };
                  arr[sIndex * 2] = { col1: current.col1 || "", col2: e.target.value };
                  onUpdateBlockField(block.id, 'leftInputs', arr);
                }}
                className={`w-full text-center border-none bg-transparent outline-none shadow-none focus-visible:ring-0 text-xs p-0 rounded-none h-6`}
                disabled={readOnly}
              />
            </td>
            <td rowSpan={2} className="border border-black px-2 py-1 font-medium align-middle text-left">
              {step.process}
            </td>
            <td rowSpan={2} className="border border-black px-1 py-1 text-center align-middle">
              <Input
                value={step.duration || ""}
                onChange={(e) => onUpdateProcessStep(block.id, sIndex, 'duration', e.target.value)}
                className={`h-6 text-xs text-center border-none outline-none shadow-none focus-visible:ring-0 bg-transparent w-full p-0 rounded-none`}
                disabled={readOnly}
              />
            </td>
            <td className="border border-black p-0 align-middle">
              <Input
                type="date"
                value={step.startDate || ""}
                onChange={(e) => onUpdateProcessStep(block.id, sIndex, 'startDate', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="h-6 text-[11px] text-center border-none outline-none shadow-none focus-visible:ring-0 bg-transparent w-full p-0 rounded-none"
                disabled={readOnly}
              />
            </td>
            <td className="border border-black p-0 align-middle">
              <Input
                type="date"
                value={step.completionDate || ""}
                onChange={(e) => onUpdateProcessStep(block.id, sIndex, 'completionDate', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="h-6 text-[11px] text-center border-none outline-none shadow-none focus-visible:ring-0 bg-transparent w-full p-0 rounded-none"
                disabled={readOnly}
              />
            </td>
            <td rowSpan={2} className="border border-black px-1 py-1 align-middle text-left">
              <Input
                value={step.remarks || ""}
                onChange={(e) => onUpdateProcessStep(block.id, sIndex, 'remarks', e.target.value)}
                className={`h-full min-h-[48px] text-xs border-none outline-none shadow-none focus-visible:ring-0 bg-transparent w-full p-1 rounded-none text-left`}
                disabled={readOnly}
              />
            </td>
          </tr>
          <tr className="text-sm">
            <td className="border border-black px-1 py-1 text-center align-middle">
              <Input
                type="text"
                value={block.leftInputs?.[sIndex * 2 + 1]?.col1 || ''}
                onChange={(e) => {
                  const arr = [...(block.leftInputs || [])];
                  const current = arr[sIndex * 2 + 1] || { col1: "", col2: "" };
                  arr[sIndex * 2 + 1] = { col1: e.target.value, col2: current.col2 || "" };
                  onUpdateBlockField(block.id, 'leftInputs', arr);
                }}
                className={`w-full text-center border-none bg-transparent outline-none shadow-none focus-visible:ring-0 text-xs p-0 rounded-none h-6`}
                disabled={readOnly}
              />
            </td>
            <td className="border border-black px-1 py-1 text-center align-middle">
              <Input
                type="text"
                value={block.leftInputs?.[sIndex * 2 + 1]?.col2 || ''}
                onChange={(e) => {
                  const arr = [...(block.leftInputs || [])];
                  const current = arr[sIndex * 2 + 1] || { col1: "", col2: "" };
                  arr[sIndex * 2 + 1] = { col1: current.col1 || "", col2: e.target.value };
                  onUpdateBlockField(block.id, 'leftInputs', arr);
                }}
                className={`w-full text-center border-none bg-transparent outline-none shadow-none focus-visible:ring-0 text-xs p-0 rounded-none h-6`}
                disabled={readOnly}
              />
            </td>
            <td className="border border-black p-0 align-middle">
              <TimePicker24h
                value={step.startTime || ""}
                onChange={(val) => onUpdateProcessStep(block.id, sIndex, 'startTime', val)}
                readOnly={readOnly}
              />
            </td>
            <td className="border border-black p-0 align-middle">
              <TimePicker24h
                value={step.completionTime || ""}
                onChange={(val) => onUpdateProcessStep(block.id, sIndex, 'completionTime', val)}
                readOnly={readOnly}
              />
            </td>
          </tr>
        </React.Fragment>
      ))}

      <tr className="text-[12px] font-semibold bg-transparent">
        <td colSpan={3} className="border border-black px-1 py-1 align-middle text-left">
          <div className="flex items-center gap-1">
            <span className="whitespace-nowrap px-1">Prepared By:</span>
            <Input
              value={block.preparedBy || ""}
              onChange={(e) => onUpdateBlockField(block.id, 'preparedBy', e.target.value)}
              className="h-6 flex-1 text-center border-none bg-transparent px-1 focus-visible:ring-0 shadow-none text-sm rounded-none"
              disabled={readOnly}
            />
          </div>
        </td>
        <td colSpan={2} className="border border-black px-1 py-1 align-middle text-left">
          <div className="flex items-center gap-1">
            <span className="whitespace-nowrap px-1">Production Mgr:</span>
            <Input
              value={block.productionManager || ""}
              onChange={(e) => onUpdateBlockField(block.id, 'productionManager', e.target.value)}
              className="h-6 flex-1 text-center border-none bg-transparent px-1 focus-visible:ring-0 shadow-none text-sm rounded-none"
              disabled={readOnly}
            />
          </div>
        </td>
        <td className="border border-black px-1 py-1 align-middle text-left">
          <div className="flex items-center gap-1">
            <span className="whitespace-nowrap px-1">Verified By:</span>
            <Input
               value={block.verifiedBy || ""}
               onChange={(e) => onUpdateBlockField(block.id, 'verifiedBy', e.target.value)}
               className="h-6 flex-1 text-center border-none bg-transparent px-1 focus-visible:ring-0 shadow-none text-sm rounded-none"
               disabled={readOnly}
            />
          </div>
        </td>
        <td className="border border-black px-1 py-1 align-middle text-left">
          <div className="flex items-center gap-1 whitespace-nowrap">
            <span className="px-1">Date</span>
            <Input
               type="date"
               value={block.date || ""}
               onChange={(e) => onUpdateBlockField(block.id, 'date', e.target.value)}
               max={new Date().toISOString().split('T')[0]}
               className="h-6 flex-1 text-[11px] border-none bg-transparent px-1 focus-visible:ring-0 shadow-none rounded-none"
               disabled={readOnly}
            />
          </div>
        </td>
      </tr>
    </React.Fragment>
  );
}

export function UnifiedHeatingRecord({
  voltage,
  type,
  record,
  saving,
  onBack,
  onSave,
  onUpdateProcessStep,
  onUpdateBlockField,
  readOnly
}: UnifiedHeatingRecordProps) {

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  // Validation strictly for the current transformer's steps
  const allFieldsFilled = React.useMemo(() => {
    return record.processSteps.every(step => 
      step.startTime && step.completionTime && step.remarks?.trim() !== ""
    );
  }, [record.processSteps]);

  return (
    <>
      <style>
{`
@media print {
  html, body { height: 297mm; overflow: hidden; }
  body { margin: 0; -webkit-print-color-adjust: exact; }
  .print-hidden { display: none !important; }
  input { border: none !important; outline: none !important; background: transparent !important; appearance: none !important; -webkit-appearance: none !important; pointer-events: none; font-weight: normal; }
  input[type="date"]::-webkit-calendar-picker-indicator { display: none !important; }
  input[type="time"]::-webkit-calendar-picker-indicator { display: none !important; }
  input::placeholder { color: transparent !important; }
  .max-w-6xl { max-width: 210mm !important; }
  #printable-report { padding: 0 !important; margin: 0 auto !important; transform: scale(0.95); transform-origin: top center; font-size: 11px; }
  table { width: 100% !important; border-collapse: collapse !important; }
  table, tr, td, th { page-break-inside: avoid !important; }
  tr { height: 20px; }
  th, td { border: 1px solid black !important; }
  .footer { margin-top: 2px !important; padding-bottom: 0 !important; }
}
`}
      </style>

      <div className="flex items-center justify-between print-hidden mb-4 max-w-6xl mx-auto">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="flex gap-3">
          <Button onClick={handlePrint} variant="outline" size="sm" className="border-[#003a70] text-[#003a70] hover:bg-blue-50">
            <Printer className="w-4 h-4 mr-2" />
            Print Report
          </Button>

          {!readOnly && (
            <>
              <Button 
                onClick={() => onSave(false)} 
                size="sm"
                disabled={saving} 
                variant="outline"
                className="border-gray-800 text-gray-800"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Readings
              </Button>


            </>
          )}
        </div>
      </div>



      <div ref={printRef} id="printable-report" className="max-w-6xl mx-auto pb-24 space-y-4 print:block">
        <Card className="bg-white shadow-md rounded-none border border-gray-400 overflow-hidden">
          <SheetHeader />
          <SheetTitle voltage={voltage} type={type} />

          <div className="w-full overflow-x-auto print:overflow-visible">
            <table className="w-full border-collapse" style={{ tableLayout: 'fixed', minWidth: '700px' }}>
              <TableHeader />
              <tbody>
                <GroupBlock
                  block={record}
                  onUpdateProcessStep={onUpdateProcessStep}
                  onUpdateBlockField={onUpdateBlockField}
                  readOnly={readOnly}
                  voltage={voltage}
                />
              </tbody>
            </table>
          </div>

          <div className="footer flex justify-end pr-3 pb-2 pt-1 border-t border-gray-100">
            <span className="text-[11px] text-gray-500 font-mono">AE-PRD-09Rev. 02</span>
          </div>
        </Card>
      </div>
    </>
  );
}

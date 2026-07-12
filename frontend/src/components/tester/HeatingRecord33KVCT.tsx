import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
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
  groupNo: string;       // editable: "No.-1", "No.-4", "No.-3" etc.
  serialNumber: string;  // editable: "33KV - CT = 1", "33KV - CT = 4, 13" etc.
  jobNo: string;         // newline-separated job numbers shown in left column
  leftInputs?: { col1: string; col2: string }[];
  startDate: string;
  processSteps: ProcessStep[];
  preparedBy: string;
  productionManager: string;
  verifiedBy: string;
  date: string;
}

interface HeatingRecord33KVCTProps {
  records: HeatingRecordBlock[];
  saving: boolean;
  onBack: () => void;
  onSave: () => void;
  onUpdateProcessStep: (blockId: string, stepIndex: number, field: keyof ProcessStep, value: string) => void;
  onUpdateBlockField: (blockId: string, field: keyof HeatingRecordBlock, value: string) => void;
  readOnly?: boolean | undefined;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

export const ensureLeftInputs = (inputs?: any) => {
  const base = Array(8).fill(null).map(() => ({ col1: "", col2: "" }));
  if (!inputs) return base;

  return base.map((_: any, i: number) => ({
    col1: inputs[i]?.col1 || "",
    col2: inputs[i]?.col2 || ""
  }));
};

/** Company letterhead header */
function SheetHeader() {
  return (
    <div className="flex items-center border-b-2 border-black p-4">
      {/* Logo */}
      <div className="w-28 h-24 flex items-center justify-center flex-shrink-0">
        <ImageWithFallback src={logoImage} alt="Advent Logo" className="max-w-full max-h-full object-contain" />
      </div>
      {/* Company name + address */}
      <div className="flex-1 text-center">
        <h1 className="font-bold text-red-600 tracking-wide" style={{ fontFamily: 'serif', fontSize: '48px', lineHeight: '1.2' }}>
          Advent Engineers
        </h1>
        <p className="text-gray-700 font-medium mt-1">A-12, MIDC, Malegaon, Sinnar,Nashik</p>
      </div>
      {/* Spacer to balance the logo */}
      <div className="w-28 flex-shrink-0" />
    </div>
  );
}

/** Bordered document title */
function SheetTitle() {
  return (
    <div className="border-b-2 border-black py-5 px-4 text-center">
      <h2 className="text-3xl font-bold" style={{ fontFamily: 'serif' }}>
        Heating Record [33KV CT]
      </h2>
    </div>
  );
}

/** Column header row */
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

interface GroupBlockProps {
  block: HeatingRecordBlock;
  onUpdateProcessStep: (blockId: string, stepIndex: number, field: keyof ProcessStep, value: string) => void;
  onUpdateBlockField: (blockId: string, field: keyof HeatingRecordBlock, value: string) => void;
  readOnly?: boolean | undefined;
}

/** A single transformer group: header row + 4 process rows + footer row */
function GroupBlock({ block, onUpdateProcessStep, onUpdateBlockField, readOnly }: GroupBlockProps) {
  return (
    <React.Fragment>
      {/* ── Group Header Row ──────────────────────────────────────────── */}
      <tr className="font-bold text-sm">
        {/* Job ID derived from context */}
        <td colSpan={2} className="border border-black px-1 py-1 align-middle text-center">
          <Input
            value={block.jobNo || ""}
            readOnly
            className="h-6 text-sm font-bold border-none shadow-none focus-visible:ring-0 bg-transparent w-full text-center p-0 rounded-none bg-white cursor-default"
          />
        </td>
        {/* Editable CT label e.g. "33KV - CT = 1", "33KV - CT = 4, 13" */}
        <td colSpan={3} className="border border-black px-1 py-1 text-center align-middle">
          <Input
            value={block.serialNumber || ""}
            onChange={(e) => onUpdateBlockField(block.id, 'serialNumber', e.target.value)}
            className={`h-6 text-sm font-bold text-center border-none shadow-none focus-visible:ring-0 bg-transparent w-full p-0 rounded-none ${readOnly ? 'bg-gray-100' : 'bg-white'}`}
            placeholder="33KV - CT = 1"
            disabled={readOnly}
          />
        </td>
        {/* "Date- DD-MM-YYYY" on right */}
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

      {/* ── Job number + process rows ─────────────────────────────────── */}
      {block.processSteps.map((step, sIndex) => (
        <React.Fragment key={sIndex}>
          {/* DATE ROW */}
          <tr className="text-sm">
            {/* LEFT COLUMN INPUT 1 */}
            <td className="border border-black px-1 py-1 text-center align-middle">
              <Input
                type="text"
                value={block.leftInputs?.[sIndex * 2]?.col1 || ''}
                onChange={(e) => {
                  const arr = [...(block.leftInputs || [])];
                  while (arr.length < 8) arr.push({ col1: "", col2: "" });
                  const current = arr[sIndex * 2] || { col1: "", col2: "" };
                  arr[sIndex * 2] = { col1: e.target.value, col2: current.col2 || "" };
                  onUpdateBlockField(block.id, 'leftInputs', arr as any);
                }}
                className={`w-full text-center border-none bg-transparent outline-none shadow-none focus-visible:ring-0 text-xs p-0 rounded-none h-6 ${readOnly ? 'cursor-default' : ''}`}
                disabled={readOnly}
              />
            </td>
            {/* LEFT COLUMN INPUT 2 */}
            <td className="border border-black px-1 py-1 text-center align-middle">
              <Input
                type="text"
                value={block.leftInputs?.[sIndex * 2]?.col2 || ''}
                onChange={(e) => {
                  const arr = [...(block.leftInputs || [])];
                  while (arr.length < 8) arr.push({ col1: "", col2: "" });
                  const current = arr[sIndex * 2] || { col1: "", col2: "" };
                  arr[sIndex * 2] = { col1: current.col1 || "", col2: e.target.value };
                  onUpdateBlockField(block.id, 'leftInputs', arr as any);
                }}
                className={`w-full text-center border-none bg-transparent outline-none shadow-none focus-visible:ring-0 text-xs p-0 rounded-none h-6 ${readOnly ? 'cursor-default' : ''}`}
                disabled={readOnly}
              />
            </td>

            {/* Process name */}
            <td rowSpan={2} className="border border-black px-2 py-1 font-medium align-middle text-left">
              {step.process}
            </td>

            {/* Duration */}
            <td rowSpan={2} className="border border-black px-1 py-1 text-center align-middle">
              <Input
                value={step.duration || ""}
                onChange={(e) => onUpdateProcessStep(block.id, sIndex, 'duration', e.target.value)}
                className={`h-6 text-xs text-center border-none outline-none shadow-none focus-visible:ring-0 bg-transparent w-full p-0 rounded-none ${readOnly ? 'cursor-default' : ''}`}
                disabled={readOnly}
              />
            </td>

            {/* Date and Time of Start — DATE */}
            <td className="border border-black p-0 align-middle">
              <Input
                type="date"
                value={step.startDate || ""}
                onChange={(e) => onUpdateProcessStep(block.id, sIndex, 'startDate', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className={`h-6 text-[11px] text-center border-none outline-none shadow-none focus-visible:ring-0 bg-transparent w-full p-0 rounded-none ${readOnly ? 'cursor-default' : ''}`}
                disabled={readOnly}
              />
            </td>

            {/* Date of Completion and Time — DATE */}
            <td className="border border-black p-0 align-middle">
              <Input
                type="date"
                value={step.completionDate || ""}
                onChange={(e) => onUpdateProcessStep(block.id, sIndex, 'completionDate', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className={`h-6 text-[11px] text-center border-none outline-none shadow-none focus-visible:ring-0 bg-transparent w-full p-0 rounded-none ${readOnly ? 'cursor-default' : ''}`}
                disabled={readOnly}
              />
            </td>

            {/* Remarks */}
            <td rowSpan={2} className="border border-black px-1 py-1 align-middle text-left">
              <Input
                value={step.remarks || ""}
                onChange={(e) => onUpdateProcessStep(block.id, sIndex, 'remarks', e.target.value)}
                className={`h-full min-h-[48px] text-xs border-none outline-none shadow-none focus-visible:ring-0 bg-transparent w-full p-1 rounded-none text-left ${readOnly ? 'cursor-default' : ''}`}
                disabled={readOnly}
              />
            </td>
          </tr>

          {/* TIME ROW */}
          <tr className="text-sm">
            {/* LEFT COLUMN INPUT 1 (Time Row) */}
            <td className="border border-black px-1 py-1 text-center align-middle">
              <Input
                type="text"
                value={block.leftInputs?.[sIndex * 2 + 1]?.col1 || ''}
                onChange={(e) => {
                  const arr = [...(block.leftInputs || [])];
                  while (arr.length < 8) arr.push({ col1: "", col2: "" });
                  const current = arr[sIndex * 2 + 1] || { col1: "", col2: "" };
                  arr[sIndex * 2 + 1] = { col1: e.target.value, col2: current.col2 || "" };
                  onUpdateBlockField(block.id, 'leftInputs', arr as any);
                }}
                className={`w-full text-center border-none bg-transparent outline-none shadow-none focus-visible:ring-0 text-xs p-0 rounded-none h-6 ${readOnly ? 'cursor-default' : ''}`}
                disabled={readOnly}
              />
            </td>
            {/* LEFT COLUMN INPUT 2 (Time Row) */}
            <td className="border border-black px-1 py-1 text-center align-middle">
              <Input
                type="text"
                value={block.leftInputs?.[sIndex * 2 + 1]?.col2 || ''}
                onChange={(e) => {
                  const arr = [...(block.leftInputs || [])];
                  while (arr.length < 8) arr.push({ col1: "", col2: "" });
                  const current = arr[sIndex * 2 + 1] || { col1: "", col2: "" };
                  arr[sIndex * 2 + 1] = { col1: current.col1 || "", col2: e.target.value };
                  onUpdateBlockField(block.id, 'leftInputs', arr as any);
                }}
                className={`w-full text-center border-none bg-transparent outline-none shadow-none focus-visible:ring-0 text-xs p-0 rounded-none h-6 ${readOnly ? 'cursor-default' : ''}`}
                disabled={readOnly}
              />
            </td>

            {/* Date and Time of Start — TIME */}
            <td className="border border-black p-0 align-middle">
              <TimePicker24h
                value={step.startTime || ""}
                onChange={(val) => onUpdateProcessStep(block.id, sIndex, 'startTime', val)}
                readOnly={readOnly}
              />
            </td>

            {/* Date of Completion and Time — TIME */}
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

      {/* ── Footer / Signature Row ────────────────────────────────────── */}
      <tr className="text-[12px] font-semibold bg-transparent">
        {/* Prepared By */}
        <td colSpan={3} className="border border-black px-1 py-1 align-middle text-left">
          <div className="flex items-center gap-1">
            <span className="whitespace-nowrap px-1">Prepared By:</span>
            <Input
              value={block.preparedBy || ""}
              onChange={(e) => onUpdateBlockField(block.id, 'preparedBy', e.target.value)}
              className={`h-6 flex-1 text-center border-none bg-transparent px-1 focus-visible:ring-0 shadow-none text-sm rounded-none ${readOnly ? 'cursor-default' : ''}`}
              disabled={readOnly}
            />
          </div>
        </td>

        {/* Production Mgr */}
        <td colSpan={2} className="border border-black px-1 py-1 align-middle text-left">
          <div className="flex items-center gap-1">
            <span className="whitespace-nowrap px-1">Production Mgr:</span>
            <Input
              value={block.productionManager || ""}
              onChange={(e) => onUpdateBlockField(block.id, 'productionManager', e.target.value)}
              className={`h-6 flex-1 text-center border-none bg-transparent px-1 focus-visible:ring-0 shadow-none text-sm rounded-none ${readOnly ? 'cursor-default' : ''}`}
              disabled={readOnly}
            />
          </div>
        </td>

        {/* Verified By */}
        <td className="border border-black px-1 py-1 align-middle text-left">
          <div className="flex items-center gap-1">
            <span className="whitespace-nowrap px-1">Verified By:</span>
            <Input
               value={block.verifiedBy || ""}
               onChange={(e) => onUpdateBlockField(block.id, 'verifiedBy', e.target.value)}
               className={`h-6 flex-1 text-center border-none bg-transparent px-1 focus-visible:ring-0 shadow-none text-sm rounded-none ${readOnly ? 'cursor-default' : ''}`}
               disabled={readOnly}
            />
          </div>
        </td>
        
        {/* Date */}
        <td className="border border-black px-1 py-1 align-middle text-left">
          <div className="flex items-center gap-1 whitespace-nowrap">
            <span className="px-1">Date</span>
            <Input
               type="date"
               value={block.date || ""}
               onChange={(e) => onUpdateBlockField(block.id, 'date', e.target.value)}
               max={new Date().toISOString().split('T')[0]}
               className={`h-6 flex-1 text-[11px] border-none bg-transparent px-1 focus-visible:ring-0 shadow-none rounded-none ${readOnly ? 'cursor-default' : ''}`}
               disabled={readOnly}
            />
          </div>
        </td>
      </tr>
    </React.Fragment>
  );
}

// ─── Main Exported Component ───────────────────────────────────────────────────

export function HeatingRecord33KVCT({
  records,
  saving,
  onBack,
  onSave,
  onUpdateProcessStep,
  onUpdateBlockField,
  readOnly = false
}: HeatingRecord33KVCTProps) {

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  // Standardize first block steps if empty
  const defaultSteps = [
    { process: 'Heating 80°C',       duration: '12 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
    { process: 'Heating 90°C',       duration: '24 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
    { process: 'Cooling 60°C',       duration: '06 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
    { process: 'Oil Filling at 60°C', duration: '04 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
  ];

  // Create empty placeholder block
  const createEmptyBlock = (index: number): HeatingRecordBlock => ({
    id: `temp-${index}`,
    transformerId: '',
    groupNo: `No.-${index + 1}`,
    serialNumber: '',
    jobNo: '',
    leftInputs: Array(8).fill(null).map(() => ({ col1: "", col2: "" })),
    startDate: '',
    processSteps: defaultSteps,
    preparedBy: '',
    productionManager: '',
    verifiedBy: '',
    date: ''
  });

  // Force exactly 1 block
  const fixedBlocks = records.length ? [records[0]] : [createEmptyBlock(0)];

  return (
    <>
      <style>
{`
@media print {

  html, body {
    height: 297mm;
    overflow: hidden;
  }

  body {
    margin: 0;
    -webkit-print-color-adjust: exact;
  }

  .print-hidden {
    display: none !important;
  }

  input {
    border: none !important;
    outline: none !important;
    background: transparent !important;
    appearance: none !important;
    -webkit-appearance: none !important;
    pointer-events: none;
    font-weight: normal;
  }

  input[type="date"]::-webkit-calendar-picker-indicator {
    display: none !important;
  }

  input[type="time"]::-webkit-calendar-picker-indicator {
    display: none !important;
  }

  input::placeholder {
    color: transparent !important;
  }

  .max-w-6xl {
    max-width: 210mm !important;
  }

  /* Force Single Page Print */
  #printable-report {
    padding: 0 !important;
    margin: 0 auto !important;
    transform: scale(0.95);
    transform-origin: top center;
    font-size: 11px;
  }

  table {
    width: 100% !important;
    border-collapse: collapse !important;
  }

  table, tr, td, th {
    page-break-inside: avoid !important;
  }

  tr {
    height: 20px;
  }

  th, td {
    border: 1px solid black !important;
  }

  .footer {
    margin-top: 2px !important;
    padding-bottom: 0 !important;
  }

}
`}
      </style>

      {/* ── Action toolbar (Hide in Print) ── */}
      <div className="flex items-center justify-between print-hidden mb-4 max-w-6xl mx-auto">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
        <div className="flex gap-3">
          <Button onClick={handlePrint} variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
            Print Report
          </Button>
          {!readOnly && (
            <Button onClick={onSave} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Records
            </Button>
          )}
        </div>
      </div>

      <div
        ref={printRef}
        id="printable-report"
        className="max-w-6xl mx-auto pb-24 space-y-4 print:block"
      >
        <Card className="bg-white shadow-md rounded-none border border-gray-400 overflow-hidden">
          <SheetHeader />
          <SheetTitle />

          {/* Table */}
          <div className="w-full overflow-x-auto print:overflow-visible">
            <table
              className="w-full border-collapse"
              style={{ tableLayout: 'fixed', minWidth: '700px' }}
            >
              <TableHeader />
              <tbody>
                {fixedBlocks.map((blk) => (
                  blk && (
                    <GroupBlock
                      key={blk.id}
                      block={blk}
                      onUpdateProcessStep={onUpdateProcessStep}
                      onUpdateBlockField={onUpdateBlockField}
                      readOnly={readOnly}
                    />
                  )
                ))}
              </tbody>
            </table>
          </div>

          <div className="footer flex justify-end pr-3 pb-2 pt-1">
            <span className="text-[11px] text-gray-500 font-mono">AE-PRD-09 Rev. 02</span>
          </div>
        </Card>
      </div>
    </>
  );
}

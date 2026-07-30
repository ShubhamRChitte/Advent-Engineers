import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Hash, 
  Type, 
  Sparkles, 
  Copy, 
  Check, 
  Layers, 
  Minus,
  Briefcase,
  Zap,
  SlidersHorizontal,
  X,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { toast } from 'sonner';

export interface PatternBlock {
  id: string;
  type: 'static' | 'year' | 'month' | 'day' | 'sequence' | 'counter' | 'separator' | 'jobRef' | 'orderRef' | 'coreType';
  value?: string | undefined;
  format?: string | undefined;
  padLength?: number | undefined;
  meteringCode?: string | undefined;
  psCode?: string | undefined;
  protectionCode?: string | undefined;
  selectedParts?: string[] | undefined;
  useOrderWiseSequence?: boolean | undefined;
}

interface IdPatternBuilderProps {
  categoryKey: string;
  label: string;
  desc: string;
  config: {
    enabled: boolean;
    prefix: string;
    lastSequence: number;
    lastSequencePT?: number;
    padLength: number;
    patternBlocks?: PatternBlock[];
  };
  orderIdBlocks?: PatternBlock[];
  onChange: (key: string, updatedConfig: any) => void;
}

export function IdPatternBuilder({ categoryKey, label, desc, config, orderIdBlocks, onChange }: IdPatternBuilderProps) {
  const [showInlineAdd, setShowInlineAdd] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dropdownOpenForBlock, setDropdownOpenForBlock] = useState<string | null>(null);
  const [isCanvasExpanded, setIsCanvasExpanded] = useState(false);

  // Default fallback blocks if empty
  const blocks: PatternBlock[] = config.patternBlocks && config.patternBlocks.length > 0 
    ? config.patternBlocks 
    : (categoryKey === 'preTestCoreId' 
      ? [
          { id: 'b-coreType', type: 'coreType', meteringCode: 'M', psCode: 'PS', protectionCode: 'P' },
          { id: 'b-year', type: 'year', format: 'YYYY' },
          { id: 'b-sep', type: 'separator', value: '-' },
          { id: 'b-seq', type: 'sequence', padLength: config.padLength || 3 }
        ]
      : [
          { id: 'b-prefix', type: 'static', value: config.prefix || 'PREFIX-' },
          { id: 'b-year', type: 'year', format: 'YYYY' },
          { id: 'b-sep', type: 'separator', value: '-' },
          { id: 'b-seq', type: 'sequence', padLength: config.padLength || 3 }
        ]);

  const updateConfig = (
    newBlocks: PatternBlock[], 
    newSeqVal?: number, 
    seqField: 'lastSequence' | 'lastSequencePT' = 'lastSequence', 
    newEnabled?: boolean
  ) => {
    const prefixStr = evaluatePreview(newBlocks, 0, false);
    const seqBlock = newBlocks.find(b => b.type === 'sequence');
    const padLen = seqBlock?.padLength || config.padLength || 3;

    onChange(categoryKey, {
      ...config,
      enabled: newEnabled !== undefined ? newEnabled : config.enabled,
      [seqField]: newSeqVal !== undefined ? newSeqVal : (config[seqField] !== undefined ? config[seqField] : 0),
      prefix: config.prefix || prefixStr,
      padLength: padLen,
      patternBlocks: newBlocks
    });
  };

  const handleToggleEnabled = () => {
    updateConfig(blocks, undefined, 'lastSequence', !config.enabled);
  };

  const handleSequenceChange = (val: number, field: 'lastSequence' | 'lastSequencePT' = 'lastSequence') => {
    updateConfig(blocks, val, field);
  };

  const addBlock = (type: PatternBlock['type'], defaultVal?: string, defaultFmt?: string) => {
    const newBlock: PatternBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      value: defaultVal || (type === 'static' ? 'PREFIX-' : type === 'separator' ? '-' : ''),
      format: defaultFmt || (type === 'year' ? 'YYYY' : type === 'month' ? 'MM' : undefined),
      padLength: type === 'sequence' ? 3 : undefined
    };
    updateConfig([...blocks, newBlock]);
    setShowInlineAdd(false);
    toast.success(`Added ${type.toUpperCase()} node to flowchart`);
  };

  const removeBlock = (id: string) => {
    if (blocks.length <= 1) {
      toast.error("ID Pattern must contain at least one node");
      return;
    }
    updateConfig(blocks.filter(b => b.id !== id));
  };

  const moveBlock = (index: number, direction: 'left' | 'right') => {
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(index, 1);
    if (moved) {
      newBlocks.splice(newIndex, 0, moved);
      updateConfig(newBlocks);
    }
  };

  const updateBlockProp = (id: string, field: keyof PatternBlock, value: any) => {
    const newBlocks = blocks.map(b => {
      if (b.id === id) {
        return { ...b, [field]: value };
      }
      return b;
    });
    updateConfig(newBlocks);
  };

  const getOrderIdParts = (): { id: string; label: string; sampleVal: string }[] => {
    const targetBlocks = orderIdBlocks && orderIdBlocks.length > 0
      ? orderIdBlocks
      : [
          { id: 'b-prefix', type: 'static', value: 'ORD-' },
          { id: 'b-year', type: 'year', format: 'YYYY' },
          { id: 'b-sep', type: 'separator', value: '-' },
          { id: 'b-seq', type: 'sequence', padLength: 3 }
        ];

    const now = new Date();
    const YYYY = now.getFullYear().toString();
    const YY = YYYY.slice(-2);
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const monthShortNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const Mon = monthShortNames[now.getMonth()];
    const Full = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][now.getMonth()];
    const DD = String(now.getDate()).padStart(2, '0');

    return targetBlocks.map((b, i) => {
      let sampleVal = '';
      let labelText = '';
      switch (b.type) {
        case 'static':
          sampleVal = b.value || 'ORD-';
          labelText = `Text (${sampleVal})`;
          break;
        case 'separator':
          sampleVal = b.value || '-';
          labelText = `Separator (${sampleVal})`;
          break;
        case 'year':
          sampleVal = b.format === 'YY' ? YY : YYYY;
          labelText = `Year (${sampleVal})`;
          break;
        case 'month':
          sampleVal = b.format === 'Mon' ? (Mon || '') : b.format === 'Full' ? (Full || '') : MM;
          labelText = `Month (${sampleVal})`;
          break;
        case 'day':
          sampleVal = DD;
          labelText = `Day (${sampleVal})`;
          break;
        case 'sequence':
          sampleVal = String(8).padStart(b.padLength || 3, '0');
          labelText = `Seq (${sampleVal})`;
          break;
        default:
          sampleVal = b.value || '';
          labelText = `Node #${i + 1} (${sampleVal})`;
      }
      return {
        id: b.id || `part-${i}`,
        label: `${i + 1}. ${labelText}`,
        sampleVal
      };
    });
  };

  const hasOrderWiseSequence = blocks.some(b => (b.type === 'orderRef' || b.type === 'jobRef') && b.useOrderWiseSequence === true);

  const evaluatePreview = (targetBlocks: PatternBlock[], nextSeqOffset: number = 1, includeSeqNumber: boolean = true) => {
    const now = new Date();
    const YYYY = now.getFullYear().toString();
    const YY = YYYY.slice(-2);
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const monthShortNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const Mon = monthShortNames[now.getMonth()];
    const Full = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][now.getMonth()];
    const DD = String(now.getDate()).padStart(2, '0');

    const isOrderWise = targetBlocks.some(b => (b.type === 'orderRef' || b.type === 'jobRef') && b.useOrderWiseSequence === true);
    const baseSeq = isOrderWise ? 0 : Number(config.lastSequence || 0);
    const nextSeq = baseSeq + nextSeqOffset;

    let result = '';
    for (const b of targetBlocks) {
      switch (b.type) {
        case 'static':
          result += b.value || '';
          break;
        case 'separator':
          result += b.value || '-';
          break;
        case 'year':
          result += b.format === 'YY' ? YY : YYYY;
          break;
        case 'month':
          result += b.format === 'Mon' ? (Mon || '') : b.format === 'Full' ? (Full || '') : MM;
          break;
        case 'day':
          result += DD;
          break;
        case 'sequence':
          if (includeSeqNumber) {
            result += String(nextSeq).padStart(b.padLength || 3, '0');
          }
          break;
        case 'orderRef':
        case 'jobRef':
          const orderParts = getOrderIdParts();
          const selected = b.selectedParts || orderParts.map(p => p.id);
          const orderRefVal = orderParts
            .filter(p => selected.includes(p.id))
            .map(p => p.sampleVal)
            .join('');
          result += orderRefVal || 'ORD-2026-008';
          break;
        case 'coreType':
          result += b.meteringCode !== undefined ? b.meteringCode : (b.value || 'M');
          break;
        default:
          result += b.value || '';
      }
    }

    // Auto-append sequence fallback if no sequence block is in pattern blocks (matches backend buildIdFromBlocks)
    const hasSeqBlock = targetBlocks.some(b => b && (b.type === 'sequence' || (b.type as string) === 'counter'));
    if (!hasSeqBlock && includeSeqNumber) {
      const pad = config.padLength || 3;
      const separator = result.endsWith('-') ? '' : '-';
      result += `${separator}${String(nextSeq).padStart(pad, '0')}`;
    }

    return result;
  };

  const previewNextId = evaluatePreview(blocks, 1, true);

  const copyPreviewToClipboard = () => {
    navigator.clipboard.writeText(previewNextId);
    setCopied(true);
    toast.success("Copied sample ID to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const getNodeBadgeStyle = (type: PatternBlock['type']) => {
    switch (type) {
      case 'static':
        return {
          bg: 'bg-amber-50/90',
          border: 'border-2 border-amber-300 hover:border-amber-500',
          headerBg: 'bg-amber-200/80 text-amber-950',
          icon: <Type className="w-4 h-4 text-amber-700" />,
          accent: 'text-amber-900'
        };
      case 'separator':
        return {
          bg: 'bg-slate-100/90',
          border: 'border-2 border-slate-300 hover:border-slate-500',
          headerBg: 'bg-slate-200 text-slate-950',
          icon: <Minus className="w-4 h-4 text-slate-700" />,
          accent: 'text-slate-900'
        };
      case 'year':
        return {
          bg: 'bg-emerald-50/90',
          border: 'border-2 border-emerald-300 hover:border-emerald-500',
          headerBg: 'bg-emerald-200/80 text-emerald-950',
          icon: <Calendar className="w-4 h-4 text-emerald-700" />,
          accent: 'text-emerald-900'
        };
      case 'month':
        return {
          bg: 'bg-teal-50/90',
          border: 'border-2 border-teal-300 hover:border-teal-500',
          headerBg: 'bg-teal-200/80 text-teal-950',
          icon: <Calendar className="w-4 h-4 text-teal-700" />,
          accent: 'text-teal-900'
        };
      case 'day':
        return {
          bg: 'bg-cyan-50/90',
          border: 'border-2 border-cyan-300 hover:border-cyan-500',
          headerBg: 'bg-cyan-200/80 text-cyan-950',
          icon: <Calendar className="w-4 h-4 text-cyan-700" />,
          accent: 'text-cyan-900'
        };
      case 'sequence':
      case 'counter':
        return {
          bg: 'bg-purple-50/90',
          border: 'border-2 border-purple-300 hover:border-purple-500',
          headerBg: 'bg-purple-200/80 text-purple-950',
          icon: <Hash className="w-4 h-4 text-purple-700" />,
          accent: 'text-purple-900'
        };
      case 'orderRef':
      case 'jobRef':
        return {
          bg: 'bg-blue-50/90',
          border: 'border-2 border-blue-300 hover:border-blue-500',
          headerBg: 'bg-blue-200/80 text-blue-950',
          icon: <Briefcase className="w-4 h-4 text-blue-700" />,
          accent: 'text-blue-900'
        };
      case 'coreType':
        return {
          bg: 'bg-pink-50/90',
          border: 'border-2 border-pink-300 hover:border-pink-500',
          headerBg: 'bg-pink-200/80 text-pink-950',
          icon: <Zap className="w-4 h-4 text-pink-700" />,
          accent: 'text-pink-900'
        };
      default:
        return {
          bg: 'bg-blue-50/90',
          border: 'border-2 border-blue-300 hover:border-blue-500',
          headerBg: 'bg-blue-200/80 text-blue-950',
          icon: <SlidersHorizontal className="w-4 h-4 text-blue-700" />,
          accent: 'text-blue-900'
        };
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden transition-all">
      
      {/* Top Header Controls */}
      <div className="p-6 bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-white border-b border-gray-200 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        
        {/* Left Category Info & Override Switch */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-extrabold text-gray-900">{label}</h3>
              <span className="px-2.5 py-0.5 text-xs font-mono font-extrabold rounded-full bg-blue-600 text-white shadow-sm">
                {categoryKey}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">{desc}</p>
          </div>
        </div>
      </div>

      {/* Real-Time Flowchart ID Output Banner */}
      <div className="px-6 pt-4 pb-1 bg-white border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50 border-2 border-blue-200 px-5 py-3.5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-sm">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-blue-900 block">
                  Real-Time Flowchart ID Output:
                </span>
                {hasOrderWiseSequence && (
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white rounded-md shadow-sm">
                    Order-Wise Sequence (001..N)
                  </span>
                )}
              </div>
              <span className="font-mono text-2xl font-black tracking-wider text-blue-700 block mt-0.5">
                {previewNextId}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={copyPreviewToClipboard}
            className="flex items-center gap-2 px-4 py-2 text-xs font-extrabold bg-white hover:bg-blue-100 text-blue-900 rounded-xl border border-blue-300 shadow-sm transition-all self-start sm:self-center"
            title="Copy Sample ID"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-blue-600" />
                <span>Copy Sample ID</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Flowchart Studio Canvas */}
      <div className="p-6 bg-slate-50/50">
        
        {/* Quick Insert Node Toolbar + Database Counter Header */}
        <div className="mb-5 p-4 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 mr-1 shrink-0">
              <Plus className="w-4 h-4 text-blue-600 font-bold" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-900">
                Quick Add Flowchart Node:
              </span>
            </div>

            <button
              onClick={() => addBlock('static', 'PREFIX-')}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Type className="w-3.5 h-3.5 text-amber-700" /> + Text
            </button>
            <button
              onClick={() => addBlock('year', undefined, 'YYYY')}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-700" /> + Year
            </button>
            <button
              onClick={() => addBlock('month', undefined, 'MM')}
              className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-300 rounded-xl text-xs font-bold text-teal-900 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5 text-teal-700" /> + Month
            </button>
            <button
              onClick={() => addBlock('day')}
              className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 border border-cyan-300 rounded-xl text-xs font-bold text-cyan-900 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5 text-cyan-700" /> + Day
            </button>
            <button
              onClick={() => addBlock('sequence')}
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-300 rounded-xl text-xs font-bold text-purple-900 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Hash className="w-3.5 h-3.5 text-purple-700" /> + Sequence Counter
            </button>
            <button
              onClick={() => addBlock('separator', '-')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Minus className="w-3.5 h-3.5 text-slate-700" /> + Separator
            </button>
            {categoryKey === 'transformerId' && (
              <button
                onClick={() => addBlock('orderRef')}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-xl text-xs font-bold text-blue-900 flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Briefcase className="w-3.5 h-3.5 text-blue-700" /> + Order Ref
              </button>
            )}
            {(categoryKey === 'preTestCoreId' || categoryKey === 'preTestBatchId') && (
              <button
                onClick={() => addBlock('coreType')}
                className="px-3 py-1.5 bg-pink-50 hover:bg-pink-100 border border-pink-300 rounded-xl text-xs font-bold text-pink-900 flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Zap className="w-3.5 h-3.5 text-pink-700" /> + Core Code
              </button>
            )}
          </div>

          {/* Database Counter Widgets (CT Counter & PT Counter for Order/Transformer tabs) */}
          {(categoryKey === 'orderId' || categoryKey === 'transformerId') ? (
            <div className="flex items-center gap-3 shrink-0 ml-auto flex-wrap">
              <div className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100/80 px-3.5 py-1.5 rounded-xl border border-purple-200 shadow-sm transition-colors" title="CT stored counter in database.">
                <Hash className="w-4 h-4 text-purple-700 font-bold" />
                <span className="text-xs font-extrabold text-purple-950 whitespace-nowrap">CT Counter:</span>
                <input
                  type="number"
                  value={config.lastSequence !== undefined ? config.lastSequence : 0}
                  onChange={(e) => handleSequenceChange(parseInt(e.target.value) || 0, 'lastSequence')}
                  className="w-16 h-7 bg-white font-mono font-black text-center border-purple-300 text-gray-900 text-xs rounded-lg px-1 shadow-inner"
                />
              </div>

              <div className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100/80 px-3.5 py-1.5 rounded-xl border border-indigo-200 shadow-sm transition-colors" title="PT stored counter in database.">
                <Hash className="w-4 h-4 text-indigo-700 font-bold" />
                <span className="text-xs font-extrabold text-indigo-950 whitespace-nowrap">PT Counter:</span>
                <input
                  type="number"
                  value={config.lastSequencePT !== undefined ? config.lastSequencePT : 0}
                  onChange={(e) => handleSequenceChange(parseInt(e.target.value) || 0, 'lastSequencePT')}
                  className="w-16 h-7 bg-white font-mono font-black text-center border-indigo-300 text-gray-900 text-xs rounded-lg px-1 shadow-inner"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100/80 px-3.5 py-1.5 rounded-xl border border-purple-200 shrink-0 shadow-sm ml-auto transition-colors" title="Stored counter number in database. The next generated ID will be counter + 1.">
              <Hash className="w-4 h-4 text-purple-700 font-bold" />
              <span className="text-xs font-extrabold text-purple-950 whitespace-nowrap">Database Counter:</span>
              <input
                type="number"
                value={config.lastSequence}
                onChange={(e) => handleSequenceChange(parseInt(e.target.value) || 0, 'lastSequence')}
                className="w-20 h-7 bg-white font-mono font-black text-center border-purple-300 text-gray-900 text-xs rounded-lg px-1 shadow-inner"
              />
            </div>
          )}
        </div>

        {/* Flowchart Horizontal Canvas */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-bold text-gray-900">ID Pattern Flowchart Pipeline</h4>
            </div>
            <span className="text-xs text-gray-500 font-medium">
              Use arrows to shift position • Adjust parameters inside cards
            </span>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto min-h-[280px] pb-40 pt-6 w-full">
            <div className="flex items-start gap-4 min-w-max pb-4">
              {blocks.map((block, idx) => {
                const style = getNodeBadgeStyle(block.type);
                const isDropdownOpen = dropdownOpenForBlock === block.id;
                return (
                  <React.Fragment key={block.id}>
                    
                    {/* Flowchart Node Card */}
                    <div className={`relative group ${style.bg} ${style.border} rounded-2xl p-4 flex flex-col justify-between w-60 shadow-sm transition-all hover:shadow-md ${isDropdownOpen ? 'z-50' : 'z-10'}`}>
                      
                      <div>
                        {/* Node Header */}
                        <div className={`flex items-center justify-between gap-1 p-2 rounded-xl mb-3 ${style.headerBg} border border-black/5`}>
                          <div className="flex items-center gap-1.5 min-w-0">
                            {style.icon}
                            <span className={`text-[11px] font-black uppercase tracking-wider truncate ${style.accent}`}>
                              {block.type === 'orderRef' ? 'orderRef' : block.type}
                            </span>
                          </div>

                          {/* Node Controls */}
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              disabled={idx === 0}
                              onClick={() => moveBlock(idx, 'left')}
                              className="p-1 text-gray-700 hover:text-black disabled:opacity-20 hover:bg-white/80 rounded-md transition-colors cursor-pointer"
                              title="Move left"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={idx === blocks.length - 1}
                              onClick={() => moveBlock(idx, 'right')}
                              className="p-1 text-gray-700 hover:text-black disabled:opacity-20 hover:bg-white/80 rounded-md transition-colors cursor-pointer"
                              title="Move right"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => removeBlock(block.id)}
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-md transition-colors ml-0.5 cursor-pointer"
                              title="Delete node"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Node Config Body */}
                        <div className="space-y-2.5">
                          {block.type === 'static' && (
                            <div>
                              <label className="block text-[10px] font-black uppercase text-amber-900 tracking-wider mb-1">Text / Prefix Value</label>
                              <input
                                type="text"
                                value={block.value || ''}
                                onChange={(e) => updateBlockProp(block.id, 'value', e.target.value)}
                                placeholder="e.g. TR-"
                                className="w-full bg-white border border-amber-300/80 rounded-xl px-3 py-2 text-xs text-amber-950 font-mono font-extrabold focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                              />
                            </div>
                          )}

                          {block.type === 'separator' && (
                            <div>
                              <label className="block text-[10px] font-black uppercase text-slate-900 tracking-wider mb-1">Separator Character</label>
                              <select
                                value={block.value || '-'}
                                onChange={(e) => updateBlockProp(block.id, 'value', e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-950 font-mono font-extrabold focus:outline-none focus:ring-2 focus:ring-slate-500 shadow-sm cursor-pointer"
                              >
                                <option value="-">Dash ( - )</option>
                                <option value="/">Slash ( / )</option>
                                <option value="_">Underscore ( _ )</option>
                                <option value=".">Dot ( . )</option>
                              </select>
                            </div>
                          )}

                          {block.type === 'year' && (
                            <div>
                              <label className="block text-[10px] font-black uppercase text-emerald-900 tracking-wider mb-1">Year Format</label>
                              <select
                                value={block.format || 'YYYY'}
                                onChange={(e) => updateBlockProp(block.id, 'format', e.target.value)}
                                className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs text-emerald-950 font-mono font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer"
                              >
                                <option value="YYYY">YYYY (4 Digits e.g. 2026)</option>
                                <option value="YY">YY (2 Digits e.g. 26)</option>
                              </select>
                            </div>
                          )}

                          {block.type === 'month' && (
                            <div>
                              <label className="block text-[10px] font-black uppercase text-teal-900 tracking-wider mb-1">Month Format</label>
                              <select
                                value={block.format || 'MM'}
                                onChange={(e) => updateBlockProp(block.id, 'format', e.target.value)}
                                className="w-full bg-white border border-teal-300 rounded-xl px-3 py-2 text-xs text-teal-950 font-mono font-extrabold focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm cursor-pointer"
                              >
                                <option value="MM">MM (Numeric e.g. 07)</option>
                                <option value="Mon">Mon (Short e.g. JUL)</option>
                                <option value="Full">Full (Full e.g. July)</option>
                              </select>
                            </div>
                          )}

                          {block.type === 'day' && (
                            <div>
                              <label className="block text-[10px] font-black uppercase text-cyan-900 tracking-wider mb-1">Day Value</label>
                              <div className="w-full bg-white border border-cyan-300 rounded-xl px-3 py-2 text-xs text-cyan-950 font-mono font-extrabold text-center shadow-sm">
                                DD (Day 01-31)
                              </div>
                            </div>
                          )}

                          {block.type === 'sequence' && (
                            <div>
                              <label className="block text-[10px] font-black uppercase text-purple-900 tracking-wider mb-1">Digits Padding</label>
                              <select
                                value={block.padLength || 3}
                                onChange={(e) => updateBlockProp(block.id, 'padLength', parseInt(e.target.value) || 1)}
                                className="w-full bg-white border border-purple-300 rounded-xl px-3 py-2 text-xs text-purple-950 font-mono font-extrabold text-center focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm cursor-pointer"
                              >
                                <option value={2}>2 Digits (01, 02...)</option>
                                <option value={3}>3 Digits (001, 002...)</option>
                                <option value={4}>4 Digits (0001, 0002...)</option>
                                <option value={5}>5 Digits (00001...)</option>
                              </select>
                            </div>
                          )}

                          {(block.type === 'orderRef' || block.type === 'jobRef') && (
                            <div className="space-y-2.5 relative">
                              <label className="block text-[10px] font-black uppercase text-blue-950 tracking-wider">Order ID Parts to Keep</label>
                              
                              <button
                                type="button"
                                onClick={() => setDropdownOpenForBlock(dropdownOpenForBlock === block.id ? null : block.id)}
                                className="w-full bg-white border border-blue-300 rounded-xl px-3 py-2 text-xs text-blue-950 font-mono font-extrabold text-left flex items-center justify-between shadow-sm hover:border-blue-400 cursor-pointer"
                              >
                                <span className="truncate">
                                  {(() => {
                                    const parts = getOrderIdParts();
                                    const sel = block.selectedParts || parts.map(p => p.id);
                                    if (sel.length === 0) return 'None Selected';
                                    if (sel.length === parts.length) return 'All Parts';
                                    return `${sel.length} of ${parts.length} parts`;
                                  })()}
                                </span>
                                <span className="text-[10px] text-blue-600 font-bold ml-1">
                                  {dropdownOpenForBlock === block.id ? '▲' : '▼'}
                                </span>
                              </button>

                              {/* Normal Floating Absolute Dropdown Box */}
                              {dropdownOpenForBlock === block.id && (
                                <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border-2 border-blue-400 rounded-xl p-2.5 flex flex-col gap-1.5 shadow-2xl animate-in zoom-in-95 duration-100">
                                  <div className="text-[10px] font-black uppercase text-blue-900 pb-1 border-b border-blue-100 flex justify-between items-center">
                                    <span>Select Parts</span>
                                    <button
                                      type="button"
                                      onClick={() => setDropdownOpenForBlock(null)}
                                      className="text-blue-600 hover:text-blue-900 text-[10px] font-black cursor-pointer"
                                    >
                                      Done
                                    </button>
                                  </div>
                                  <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-0.5">
                                    {getOrderIdParts().map(part => {
                                      const currentSel = block.selectedParts || getOrderIdParts().map(p => p.id);
                                      const isChecked = currentSel.includes(part.id);
                                      return (
                                        <label key={part.id} className="flex items-center gap-2 px-1.5 py-1 hover:bg-blue-50 rounded-lg text-xs cursor-pointer select-none">
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                              let updated: string[];
                                              if (e.target.checked) {
                                                updated = [...currentSel, part.id];
                                              } else {
                                                updated = currentSel.filter(id => id !== part.id);
                                              }
                                              updateBlockProp(block.id, 'selectedParts', updated);
                                            }}
                                            className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                                          />
                                          <span className="font-mono text-xs text-gray-800 truncate font-semibold">{part.label}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              <div className="pt-2 border-t border-blue-100">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={block.useOrderWiseSequence === true}
                                    onChange={(e) => updateBlockProp(block.id, 'useOrderWiseSequence', e.target.checked)}
                                    className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold text-blue-950">Enable Order-Wise Sequence</span>
                                    <span className="text-[10px] text-blue-700 font-medium">Resets sequence (001..N) per order</span>
                                  </div>
                                </label>
                              </div>
                            </div>
                          )}

                          {block.type === 'coreType' && (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-black uppercase text-pink-900 w-16">Metering:</span>
                                <input
                                  type="text"
                                  value={block.meteringCode !== undefined ? block.meteringCode : (block.value || 'M')}
                                  onChange={(e) => updateBlockProp(block.id, 'meteringCode', e.target.value)}
                                  className="w-20 bg-white border border-pink-300 rounded-lg px-2 py-1 text-xs text-pink-950 font-mono font-bold text-center focus:outline-none focus:ring-2 focus:ring-pink-500 shadow-sm"
                                />
                              </div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-black uppercase text-pink-900 w-16">PS:</span>
                                <input
                                  type="text"
                                  value={block.psCode !== undefined ? block.psCode : 'PS'}
                                  onChange={(e) => updateBlockProp(block.id, 'psCode', e.target.value)}
                                  className="w-20 bg-white border border-pink-300 rounded-lg px-2 py-1 text-xs text-pink-950 font-mono font-bold text-center focus:outline-none focus:ring-2 focus:ring-pink-500 shadow-sm"
                                />
                              </div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-black uppercase text-pink-900 w-16">Protection:</span>
                                <input
                                  type="text"
                                  value={block.protectionCode !== undefined ? block.protectionCode : 'P'}
                                  onChange={(e) => updateBlockProp(block.id, 'protectionCode', e.target.value)}
                                  className="w-20 bg-white border border-pink-300 rounded-lg px-2 py-1 text-xs text-pink-950 font-mono font-bold text-center focus:outline-none focus:ring-2 focus:ring-pink-500 shadow-sm"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Bottom Step Indicator */}
                      <div className="mt-4 pt-2.5 border-t border-black/5 flex items-center justify-between text-[10px] font-bold text-gray-400">
                        <span>Step {idx + 1}</span>
                        <span className="font-mono text-[9px] uppercase tracking-wide px-1.5 py-0.5 bg-white/80 rounded border border-gray-200">{block.type}</span>
                      </div>
                    </div>

                    {/* Flowchart Arrow */}
                    {idx < blocks.length - 1 && (
                      <div className="flex items-center justify-center text-blue-500 px-1 shrink-0 self-start mt-14">
                        <ChevronRight className="w-6 h-6 stroke-[3]" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Inline Interactive Node Selection Palette or Add Node Button */}
              {showInlineAdd ? (
                <div className="relative p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-400 rounded-2xl flex flex-col justify-between w-80 shadow-md shrink-0 animate-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-200">
                    <div className="flex items-center gap-1.5 text-blue-950 font-black text-xs uppercase tracking-wider">
                      <Plus className="w-4 h-4 text-blue-600" />
                      <span>Select Node to Insert</span>
                    </div>
                    <button
                      onClick={() => setShowInlineAdd(false)}
                      className="p-1 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-white/60 transition-colors"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    <button
                      onClick={() => addBlock('static', 'PREFIX-')}
                      className="p-2 bg-white hover:bg-amber-100/80 border border-amber-300 rounded-xl text-left transition-all group shadow-sm"
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Type className="w-3.5 h-3.5 text-amber-700" />
                        <span className="text-xs font-extrabold text-amber-950">Text</span>
                      </div>
                      <span className="text-[10px] text-amber-800 font-medium">Custom text</span>
                    </button>

                    <button
                      onClick={() => addBlock('year', undefined, 'YYYY')}
                      className="p-2 bg-white hover:bg-emerald-100/80 border border-emerald-300 rounded-xl text-left transition-all group shadow-sm"
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="text-xs font-extrabold text-emerald-950">Year</span>
                      </div>
                      <span className="text-[10px] text-emerald-800 font-medium">YYYY / YY</span>
                    </button>

                    <button
                      onClick={() => addBlock('month', undefined, 'MM')}
                      className="p-2 bg-white hover:bg-teal-100/80 border border-teal-300 rounded-xl text-left transition-all group shadow-sm"
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Calendar className="w-3.5 h-3.5 text-teal-700" />
                        <span className="text-xs font-extrabold text-teal-950">Month</span>
                      </div>
                      <span className="text-[10px] text-teal-800 font-medium">MM / Mon</span>
                    </button>

                    <button
                      onClick={() => addBlock('day')}
                      className="p-2 bg-white hover:bg-cyan-100/80 border border-cyan-300 rounded-xl text-left transition-all group shadow-sm"
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Calendar className="w-3.5 h-3.5 text-cyan-700" />
                        <span className="text-xs font-extrabold text-cyan-950">Day</span>
                      </div>
                      <span className="text-[10px] text-cyan-800 font-medium">DD (Day)</span>
                    </button>

                    <button
                      onClick={() => addBlock('sequence')}
                      className="p-2 bg-white hover:bg-purple-100/80 border border-purple-300 rounded-xl text-left transition-all group shadow-sm"
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Hash className="w-3.5 h-3.5 text-purple-700" />
                        <span className="text-xs font-extrabold text-purple-950">Counter</span>
                      </div>
                      <span className="text-[10px] text-purple-800 font-medium">001 (Seq)</span>
                    </button>

                    <button
                      onClick={() => addBlock('separator', '-')}
                      className="p-2 bg-white hover:bg-slate-200 border border-slate-300 rounded-xl text-left transition-all group shadow-sm"
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Minus className="w-3.5 h-3.5 text-slate-700" />
                        <span className="text-xs font-extrabold text-slate-950">Separator</span>
                      </div>
                      <span className="text-[10px] text-slate-800 font-medium">Dash / Slash</span>
                    </button>

                    {categoryKey === 'transformerId' && (
                      <button
                        onClick={() => addBlock('orderRef')}
                        className="p-2 bg-white hover:bg-blue-100/80 border border-blue-300 rounded-xl text-left transition-all group shadow-sm"
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Briefcase className="w-3.5 h-3.5 text-blue-700" />
                          <span className="text-xs font-extrabold text-blue-950">Order Ref</span>
                        </div>
                        <span className="text-[10px] text-blue-800 font-medium">Order ID Ref</span>
                      </button>
                    )}

                    {(categoryKey === 'preTestCoreId' || categoryKey === 'preTestBatchId') && (
                      <button
                        onClick={() => addBlock('coreType')}
                        className="p-2 bg-white hover:bg-pink-100/80 border border-pink-300 rounded-xl text-left transition-all group shadow-sm"
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Zap className="w-3.5 h-3.5 text-pink-700" />
                          <span className="text-xs font-extrabold text-pink-950">Core Code</span>
                        </div>
                        <span className="text-[10px] text-pink-800 font-medium">Metering / PS / Protection</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowInlineAdd(true)}
                  className="h-full min-h-[110px] w-40 px-4 border-2 border-dashed border-blue-300 hover:border-blue-600 bg-blue-50/60 hover:bg-blue-100 text-blue-800 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all shadow-sm shrink-0"
                >
                  <div className="p-2 bg-blue-600 text-white rounded-full shadow-md">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider">Add Node</span>
                </Button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

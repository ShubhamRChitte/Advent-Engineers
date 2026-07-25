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
  X
} from 'lucide-react';
import { toast } from 'sonner';

export interface PatternBlock {
  id: string;
  type: 'static' | 'year' | 'month' | 'day' | 'sequence' | 'separator' | 'jobRef' | 'coreType';
  value?: string | undefined;
  format?: string | undefined;
  padLength?: number | undefined;
}

interface IdPatternBuilderProps {
  categoryKey: string;
  label: string;
  desc: string;
  config: {
    enabled: boolean;
    prefix: string;
    lastSequence: number;
    padLength: number;
    patternBlocks?: PatternBlock[];
  };
  onChange: (key: string, updatedConfig: any) => void;
}

export function IdPatternBuilder({ categoryKey, label, desc, config, onChange }: IdPatternBuilderProps) {
  const [showInlineAdd, setShowInlineAdd] = useState(false);
  const [copied, setCopied] = useState(false);

  // Default fallback blocks if empty
  const blocks: PatternBlock[] = config.patternBlocks && config.patternBlocks.length > 0 
    ? config.patternBlocks 
    : [
        { id: 'b-prefix', type: 'static', value: config.prefix || 'PREFIX-' },
        { id: 'b-year', type: 'year', format: 'YYYY' },
        { id: 'b-sep', type: 'separator', value: '-' },
        { id: 'b-seq', type: 'sequence', padLength: config.padLength || 3 }
      ];

  const updateConfig = (newBlocks: PatternBlock[], newLastSeq?: number, newEnabled?: boolean) => {
    const prefixStr = evaluatePreview(newBlocks, 0, false);
    const seqBlock = newBlocks.find(b => b.type === 'sequence');
    const padLen = seqBlock?.padLength || config.padLength || 3;

    onChange(categoryKey, {
      ...config,
      enabled: newEnabled !== undefined ? newEnabled : config.enabled,
      lastSequence: newLastSeq !== undefined ? newLastSeq : config.lastSequence,
      prefix: config.prefix || prefixStr,
      padLength: padLen,
      patternBlocks: newBlocks
    });
  };

  const handleToggleEnabled = () => {
    updateConfig(blocks, undefined, !config.enabled);
  };

  const handleSequenceChange = (val: number) => {
    updateConfig(blocks, val);
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

  const evaluatePreview = (targetBlocks: PatternBlock[], nextSeqOffset: number = 1, includeSeqNumber: boolean = true) => {
    const now = new Date();
    const YYYY = now.getFullYear().toString();
    const YY = YYYY.slice(-2);
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const monthShortNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const Mon = monthShortNames[now.getMonth()];
    const Full = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][now.getMonth()];
    const DD = String(now.getDate()).padStart(2, '0');

    const nextSeq = Number(config.lastSequence || 0) + nextSeqOffset;

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
          result += b.format === 'Mon' ? Mon : b.format === 'Full' ? Full : MM;
          break;
        case 'day':
          result += DD;
          break;
        case 'sequence':
          if (includeSeqNumber) {
            result += String(nextSeq).padStart(b.padLength || 3, '0');
          }
          break;
        case 'jobRef':
          result += 'JOB-2026-298';
          break;
        case 'coreType':
          if (b.format === 'MEDIUM') {
            result += 'MTR';
          } else if (b.format === 'FULL') {
            result += 'Metering';
          } else {
            result += 'M';
          }
          break;
        default:
          result += b.value || '';
      }
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
        return {
          bg: 'bg-purple-50/90',
          border: 'border-2 border-purple-300 hover:border-purple-500',
          headerBg: 'bg-purple-200/80 text-purple-950',
          icon: <Hash className="w-4 h-4 text-purple-700" />,
          accent: 'text-purple-900'
        };
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
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                {categoryKey}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">{desc}</p>
          </div>

          {/* Override Logic Toggle */}
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm ml-auto xl:ml-4">
            <div className="text-right">
              <span className="text-xs font-black text-gray-900 block">Override Default Logic</span>
              <span className={`text-[10px] font-bold ${config.enabled ? 'text-emerald-700' : 'text-gray-500'}`}>
                {config.enabled ? '🟢 Flowchart Active' : '⚪ Standard Format'}
              </span>
            </div>
            <button
              onClick={handleToggleEnabled}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                config.enabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className="inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md"
                style={{ transform: config.enabled ? 'translateX(24px)' : 'translateX(4px)' }}
              />
            </button>
          </div>
        </div>

        {/* Right Live ID Preview Box */}
        <div className="flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-2xl border border-slate-800 shadow-md shrink-0">
          <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Real-Time Flowchart ID Output:
            </span>
            <span className="font-mono text-xl font-black tracking-wider text-emerald-300">
              {previewNextId}
            </span>
          </div>

          <button
            type="button"
            onClick={copyPreviewToClipboard}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2"
            title="Copy Sample ID"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-blue-400" />}
          </button>
        </div>
      </div>

      {/* Main Flowchart Studio Canvas */}
      <div className={`p-6 bg-slate-50/50 transition-opacity ${config.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        
        {/* Quick Insert Node Toolbar */}
        <div className="mb-5 p-4 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600 font-bold" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-gray-900">
              Quick Add Flowchart Node:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
            <button
              onClick={() => addBlock('jobRef')}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-xl text-xs font-bold text-blue-900 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Briefcase className="w-3.5 h-3.5 text-blue-700" /> + Job Ref
            </button>
            <button
              onClick={() => addBlock('coreType')}
              className="px-3 py-1.5 bg-pink-50 hover:bg-pink-100 border border-pink-300 rounded-xl text-xs font-bold text-pink-900 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-pink-700" /> + Core Code
            </button>
          </div>
        </div>

        {/* Flowchart Horizontal Canvas */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-bold text-gray-900">ID Pattern Flowchart Pipeline</h4>
            </div>
            <span className="text-xs text-gray-500 font-medium">
              Use arrows to shift position • Adjust parameters inside cards
            </span>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto pb-8">
            <div className="flex items-center gap-3 min-w-max">
              {blocks.map((block, idx) => {
                const style = getNodeBadgeStyle(block.type);
                return (
                  <React.Fragment key={block.id}>
                    
                    {/* Flowchart Node Card */}
                    <div className={`relative group ${style.bg} ${style.border} rounded-2xl p-4 flex flex-col gap-2.5 w-52 shadow-sm transition-all hover:shadow-md`}>
                      
                      {/* Node Header */}
                      <div className={`flex items-center justify-between gap-1 p-2 rounded-xl ${style.headerBg}`}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          {style.icon}
                          <span className={`text-xs font-black uppercase tracking-wider truncate ${style.accent}`}>
                            {block.type}
                          </span>
                        </div>

                        {/* Node Controls */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            disabled={idx === 0}
                            onClick={() => moveBlock(idx, 'left')}
                            className="p-1 text-gray-700 hover:text-black disabled:opacity-20 hover:bg-white/80 rounded transition-colors"
                            title="Move left"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            disabled={idx === blocks.length - 1}
                            onClick={() => moveBlock(idx, 'right')}
                            className="p-1 text-gray-700 hover:text-black disabled:opacity-20 hover:bg-white/80 rounded transition-colors"
                            title="Move right"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeBlock(block.id)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors ml-0.5"
                            title="Delete node"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Node Config Body */}
                      <div className="pt-1">
                        {block.type === 'static' && (
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-amber-900 mb-1">Text Value</label>
                            <input
                              type="text"
                              value={block.value || ''}
                              onChange={(e) => updateBlockProp(block.id, 'value', e.target.value)}
                              placeholder="e.g. TR-JOB-"
                              className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs text-amber-950 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
                            />
                          </div>
                        )}

                        {block.type === 'separator' && (
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-900 mb-1">Separator Character</label>
                            <select
                              value={block.value || '-'}
                              onChange={(e) => updateBlockProp(block.id, 'value', e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-950 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-slate-500 shadow-inner"
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
                            <label className="block text-[10px] font-bold uppercase text-emerald-900 mb-1">Year Format</label>
                            <select
                              value={block.format || 'YYYY'}
                              onChange={(e) => updateBlockProp(block.id, 'format', e.target.value)}
                              className="w-full bg-white border border-emerald-300 rounded-lg px-2 py-1.5 text-xs text-emerald-950 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
                            >
                              <option value="YYYY">4-Digit (2026)</option>
                              <option value="YY">2-Digit (26)</option>
                            </select>
                          </div>
                        )}

                        {block.type === 'month' && (
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-teal-900 mb-1">Month Format</label>
                            <select
                              value={block.format || 'MM'}
                              onChange={(e) => updateBlockProp(block.id, 'format', e.target.value)}
                              className="w-full bg-white border border-teal-300 rounded-lg px-2 py-1.5 text-xs text-teal-950 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-inner"
                            >
                              <option value="MM">Numeric (07)</option>
                              <option value="Mon">Short (JUL)</option>
                              <option value="Full">Full (July)</option>
                            </select>
                          </div>
                        )}

                        {block.type === 'day' && (
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-cyan-900 mb-1">Day Value</label>
                            <span className="text-xs text-cyan-950 font-mono font-bold bg-white px-2.5 py-1.5 rounded-lg block border border-cyan-300 text-center shadow-inner">
                              Current Day (DD)
                            </span>
                          </div>
                        )}

                        {block.type === 'sequence' && (
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-purple-900 mb-1">Digits Padding</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={block.padLength || 3}
                              onChange={(e) => updateBlockProp(block.id, 'padLength', parseInt(e.target.value) || 1)}
                              className="w-full bg-white border border-purple-300 rounded-lg px-2.5 py-1.5 text-xs text-purple-950 font-mono font-bold text-center focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-inner"
                            />
                          </div>
                        )}

                        {block.type === 'jobRef' && (
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-blue-900 mb-1">Job Ref</label>
                            <span className="text-xs text-blue-950 font-mono font-bold bg-white px-2.5 py-1.5 rounded-lg block border border-blue-300 text-center shadow-inner truncate">
                              JOB-2026-298
                            </span>
                          </div>
                        )}

                        {block.type === 'coreType' && (
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-pink-900 mb-1">Core Code Format</label>
                            <select
                              value={block.format || 'SHORT'}
                              onChange={(e) => updateBlockProp(block.id, 'format', e.target.value)}
                              className="w-full bg-white border border-pink-300 rounded-lg px-2 py-1.5 text-xs text-pink-950 font-bold text-center focus:outline-none focus:ring-2 focus:ring-pink-500 shadow-inner"
                            >
                              <option value="SHORT">M / PS / P (Short)</option>
                              <option value="MEDIUM">MTR / PS / PRT (Standard)</option>
                              <option value="FULL">Metering / PS / Protection (Full)</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Flowchart Arrow */}
                    {idx < blocks.length - 1 && (
                      <div className="flex items-center justify-center text-blue-500 px-1">
                        <ChevronRight className="w-6 h-6 stroke-[3]" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Inline Interactive Node Selection Palette or Add Node Button */}
              {showInlineAdd ? (
                <div className="relative p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-400 rounded-2xl flex flex-col gap-3 w-80 shadow-md shrink-0 animate-in zoom-in-95 duration-150">
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

                    <button
                      onClick={() => addBlock('jobRef')}
                      className="p-2 bg-white hover:bg-blue-100/80 border border-blue-300 rounded-xl text-left transition-all group shadow-sm"
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Briefcase className="w-3.5 h-3.5 text-blue-700" />
                        <span className="text-xs font-extrabold text-blue-950">Job Ref</span>
                      </div>
                      <span className="text-[10px] text-blue-800 font-medium">Job Ref No</span>
                    </button>

                    <button
                      onClick={() => addBlock('coreType')}
                      className="p-2 bg-white hover:bg-pink-100/80 border border-pink-300 rounded-xl text-left transition-all group shadow-sm"
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Zap className="w-3.5 h-3.5 text-pink-700" />
                        <span className="text-xs font-extrabold text-pink-950">Core Code</span>
                      </div>
                      <span className="text-[10px] text-pink-800 font-medium">M/PS/P</span>
                    </button>
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

        {/* Counter Settings Footer */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-gray-900 block">Database Current Counter</span>
              <span className="text-xs text-gray-500">Stored counter number in database. The next generated ID will be counter + 1.</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-bold text-gray-700">Current Value:</span>
            <Input
              type="number"
              value={config.lastSequence}
              onChange={(e) => handleSequenceChange(parseInt(e.target.value) || 0)}
              className="w-28 bg-gray-50 font-mono font-black text-center border-gray-300 text-gray-900"
            />
          </div>
        </div>

      </div>
    </div>
  );
}

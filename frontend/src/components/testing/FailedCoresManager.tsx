import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  ArrowLeft,
  AlertTriangle,
  Printer,
  Search,
  Eye,
  RotateCcw,
  Recycle,
  Clock,
  RefreshCw,
  XCircle,
  ClipboardList
} from 'lucide-react';
import axios from '@/utils/axiosConfig';
import { toast } from 'sonner';
import { FailedCore } from './CoreTestingForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { FailedCoreReturnForm } from './FailedCoreReturnForm';

interface FailedCoresManagerProps {
  failedCores: FailedCore[];
  onBack: () => void;
}

// Production-Safe Helper: Normalizes strings to prevent crashes
const safeLower = (value: string | undefined | null): string => {
  return (value || "").toString().toLowerCase();
};

export function FailedCoresManager({ failedCores, onBack }: FailedCoresManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [localCores, setLocalCores] = useState<FailedCore[]>([]);
  const [selectedCores, setSelectedCores] = useState<string[]>([]);
  
  // Return Form Modal State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnModalVendor, setReturnModalVendor] = useState('');
  const [returnModalCores, setReturnModalCores] = useState<FailedCore[]>([]);

  // Reason Modal State
  const [reasonModalData, setReasonModalData] = useState<{
    isOpen: boolean;
    reason: string;
    serialNo: string;
  } | null>(null);

  // Column Visibility State
  const [visibleColumns, setVisibleColumns] = useState({
    orderId: false,
    jobId: true,
    client: false,
    coreType: true,
    vendorNo: false,
    failureStage: true,
    failureReason: false,
    testValues: false,
    status: true
  });

  const toggleColumn = (colName: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [colName]: !prev[colName] }));
  };

  const renderChipsRow = (colSpan: number, availableColumns: (keyof typeof visibleColumns)[]) => {
    const columnLabels: Record<keyof typeof visibleColumns, string> = {
      orderId: 'Order ID',
      jobId: 'Job ID',
      client: 'Client',
      coreType: 'Core Type',
      vendorNo: 'Vendor No',
      failureStage: 'Failure Stage',
      failureReason: 'Failure Reason',
      testValues: 'Test Values',
      status: 'Status'
    };

    return (
      <tr className="bg-white">
        <th colSpan={colSpan} className="px-4 py-3 font-normal text-left bg-white border-b border-gray-100">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
            <span className="text-sm font-semibold text-gray-500 mr-2 whitespace-nowrap">Visible Columns:</span>
            
            <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed select-none whitespace-nowrap">Date</div>
            <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed select-none whitespace-nowrap">Internal Core No</div>
            
            {availableColumns.map((colId) => (
              <button
                key={colId}
                onClick={() => toggleColumn(colId)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                  visibleColumns[colId]
                    ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {columnLabels[colId]}
              </button>
            ))}
            
            <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed select-none whitespace-nowrap">Actions</div>
          </div>
        </th>
      </tr>
    );
  };

  useEffect(() => {
    // 1. Structural Protection: Ensure failedCores is always an array
    setLocalCores(Array.isArray(failedCores) ? failedCores : []);
  }, [failedCores]);

  // 2. Filter logic: Show only non-returned cores by default unless searched specifically
  const visibleCores = localCores.filter(c => (c as any).status !== 'RETURNED');

  const filteredCores = visibleCores.filter(core => {
    if (!core) return false;
    const searchLow = safeLower(searchTerm);
    return (
      safeLower(core.orderId).includes(searchLow) ||
      safeLower(core.jobId).includes(searchLow) ||
      safeLower(core.clientName).includes(searchLow) ||
      safeLower(core.internalCoreNo).includes(searchLow) ||
      safeLower(core.coreVendorNo).includes(searchLow) ||
      safeLower(core.vendorCoreNo).includes(searchLow)
    );
  });

  const groupByVendor = () => {
    const grouped: { [key: string]: FailedCore[] } = {};
    visibleCores.forEach(core => {
      const vendorKey = core.coreVendorNo || core.vendorCoreNo || "Unknown Vendor";
      if (!grouped[vendorKey]) {
        grouped[vendorKey] = [];
      }
      grouped[vendorKey].push(core);
    });
    return grouped;
  };

  const handleOpenReturnModal = (vendorName: string, cores: FailedCore[]) => {
    setReturnModalVendor(vendorName);
    setReturnModalCores(cores);
    setShowReturnModal(true);
  };

  const handleReturnSuccess = (newForm: any) => {
    // Update local state to reflect returned status
    const returnedIds = returnModalCores.map(c => (c as any)._id);
    setLocalCores(prev => prev.map(c => 
      returnedIds.includes((c as any)._id) 
      ? { ...c, status: 'RETURNED' } 
      : c
    ));
    setSelectedCores(prev => prev.filter(id => !returnedIds.includes(id)));
    setShowReturnModal(false);
  };

  const groupByOrder = () => {
    const grouped: { [key: string]: FailedCore[] } = {};
    visibleCores.forEach(core => {
      const orderKey = core.orderId ? String(core.orderId) : "Unknown Order";
      if (!grouped[orderKey]) {
        grouped[orderKey] = [];
      }
      grouped[orderKey].push(core);
    });
    return grouped;
  };

  const handlePrint = () => {
    const reportDate = new Date().toLocaleDateString('en-GB');
    const firstJobId = localCores[0]?.jobId || '';
    const jobSuffix = firstJobId.split('-').pop() || '000';
    const docId = `AE-FCR-${new Date().getFullYear()}-${jobSuffix}`;

    const totalFailed = localCores.length;
    const meteringCount = localCores.filter(c => c.coreType?.toUpperCase() === 'METERING').length;
    const protectionCount = localCores.filter(c => c.coreType?.toUpperCase() === 'PROTECTION').length;
    const specialCount = localCores.filter(
      c => c.coreType?.toUpperCase() !== 'METERING' && c.coreType?.toUpperCase() !== 'PROTECTION'
    ).length;

    const rows = localCores.map((item, i) => {
      const date = item.failedAt
        ? new Date(item.failedAt).toLocaleDateString('en-GB')
        : item.createdAt
          ? new Date(item.createdAt).toLocaleDateString('en-GB')
          : '-';
      const vendor = item.vendorCoreNo || item.coreVendorNo || 'NOT-RECORDED-YET';
      return `
        <tr style="background:${i % 2 === 0 ? '#fff' : '#F8FAFC'}">
          <td style="padding:10px 12px;border:1px solid #E2E8F0;font-weight:600;">${date}</td>
          <td style="padding:10px 12px;border:1px solid #E2E8F0;">${vendor}</td>
          <td style="padding:10px 12px;border:1px solid #E2E8F0;font-family:monospace;font-weight:600;">${item.internalCoreNo}</td>
          <td style="padding:10px 12px;border:1px solid #E2E8F0;text-transform:uppercase;">${item.coreType || '-'}</td>
          <td style="padding:10px 12px;border:1px solid #E2E8F0;">${item.failureReason || '-'}</td>
          <td style="padding:10px 12px;border:1px solid #E2E8F0;text-align:center;font-weight:700;color:#E31E24;">Rejected</td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Failed Core Report — ${docId}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #2D3748; font-size: 12px; background: #fff; }

    .watermark {
      position: fixed; top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 110px; font-weight: 800;
      color: rgba(35,31,97,0.015); pointer-events: none;
      white-space: nowrap; letter-spacing: 12px; z-index: 0;
    }
    .content { position: relative; z-index: 1; }

    /* Header */
    .header { border-bottom: 1px solid #D2D6DC; padding-bottom: 18px; margin-bottom: 20px; }
    .header-top { display: grid; grid-template-columns: 80px 1fr 80px; align-items: center; }
    .brand h1 { color: #231F61; font-size: 26px; font-weight: 800; text-align: center; text-transform: uppercase; }
    .brand p  { font-size: 11px; color: #E31E24; font-weight: 700; text-align: center; text-transform: uppercase; letter-spacing: 0.6px; margin-top: 4px; }
    .meta-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 15px; margin-top: 20px; padding-top: 12px; border-top: 1px solid #E2E8F0; }
    .meta-label { font-size: 10px; text-transform: uppercase; color: #606F7B; font-weight: 600; display: block; margin-bottom: 2px; }
    .meta-value { font-size: 12px; font-weight: 700; }

    /* Section Title */
    .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #231F61; margin-bottom: 12px; display: flex; align-items: center; letter-spacing: 0.5px; }
    .section-title::after { content:''; flex-grow:1; height:1px; background:#E2E8F0; margin-left:10px; }

    /* KPI */
    .kpi-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 10px; margin-bottom: 25px; }
    .kpi-card { border: 1px solid #E2E8F0; border-radius: 4px; padding: 12px 10px; background: #F8FAFC; }
    .kpi-val { font-size: 22px; font-weight: 700; color: #231F61; }
    .kpi-val.red { color: #E31E24; }
    .kpi-lbl { font-size: 9.5px; font-weight: 600; color: #606F7B; text-transform: uppercase; }

    /* Table */
    table { width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed; margin-bottom: 30px; }
    th { background: #F0F4F8; color: #231F61; font-weight: 700; text-transform: uppercase; font-size: 10px; padding: 10px 12px; border: 1px solid #E2E8F0; text-align: left; }
    td { padding: 10px 12px; border: 1px solid #E2E8F0; vertical-align: top; word-wrap: break-word; }
    col.c1 { width: 85px; } col.c2 { width: 130px; } col.c3 { width: 140px; }
    col.c4 { width: 90px; }  col.c5 { width: auto; }  col.c6 { width: 85px; }

    /* Footer */
    .sig-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 30px; margin-top: 20px; margin-bottom: 20px; }
    .sig-box { text-align: center; }
    .sig-line { border-top: 1px dashed #606F7B; margin-bottom: 6px; }
    .sig-title { font-size: 11px; font-weight: 700; }
    .sig-name { font-size: 11px; color: #606F7B; }
    .sig-name.bold { font-weight: 700; color: #2D3748; }
    .legal { display: flex; justify-content: space-between; font-size: 9px; color: #606F7B; border-top: 1px solid #E2E8F0; padding-top: 8px; }
  </style>
</head>
<body>
<div class="watermark">ADVENT</div>
<div class="content">

  <div class="header">
    <div class="header-top">
      <div></div>
      <div class="brand">
        <h1>ADVENT ENGINEERS</h1>
        <p>Excellence in Transformer Core Testing</p>
      </div>
      <div></div>
    </div>
    <div class="meta-grid">
      <div><span class="meta-label">Document ID</span><span class="meta-value">${docId}</span></div>
      <div><span class="meta-label">Batch Reference</span><span class="meta-value">${firstJobId || '—'}</span></div>
      <div><span class="meta-label">Report Date</span><span class="meta-value">${reportDate}</span></div>
      <div><span class="meta-label">Classification</span><span class="meta-value">Quality Controlled</span></div>
    </div>
  </div>

  <div class="section-title">Audit Metrics &amp; Distributions</div>
  <div class="kpi-grid">
    <div class="kpi-card"><div class="kpi-val">${totalFailed}</div><div class="kpi-lbl">Total Failed Units</div></div>
    <div class="kpi-card"><div class="kpi-val">${meteringCount}</div><div class="kpi-lbl">Metering Cores</div></div>
    <div class="kpi-card"><div class="kpi-val">${protectionCount}</div><div class="kpi-lbl">Protection Cores</div></div>
    <div class="kpi-card"><div class="kpi-val">${specialCount}</div><div class="kpi-lbl">Special Cores</div></div>
    <div class="kpi-card"><div class="kpi-val red">100%</div><div class="kpi-lbl">Rejection Rate</div></div>
  </div>

  <div class="section-title">Detailed Core Failure Ledger</div>
  <table>
    <colgroup><col class="c1"/><col class="c2"/><col class="c3"/><col class="c4"/><col class="c5"/><col class="c6"/></colgroup>
    <thead>
      <tr>
        <th>Test Date</th><th>Vendor Core No.</th><th>Internal Core ID</th>
        <th>Core Type</th><th>Failure Reason / Metric Observation</th><th style="text-align:center;">Remark</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:#94a3b8;font-style:italic;">No failed core records.</td></tr>'}</tbody>
  </table>

  <div class="sig-row">
    <div class="sig-box"><div class="sig-line"></div><div class="sig-title">Tested By</div><div class="sig-name">Quality Lab Tech</div></div>
    <div class="sig-box"><div class="sig-line"></div><div class="sig-title">Verified By</div><div class="sig-name">QA Line Inspector</div></div>
    <div class="sig-box"><div class="sig-line"></div><div class="sig-title">Authorised Signatory</div><div class="sig-name bold">Rahul Sharma</div></div>
  </div>
  <div class="legal">
    <span>Advent Engineers © ${new Date().getFullYear()} | Quality Control System Audit Data</span>
    <span>Page 1 of 1</span>
    <span>Generated: ${reportDate}</span>
  </div>

</div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
      alert('Please allow pop-ups for this site to print the report.');
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 250);
  };

  const handleReturnToVendor = async (coreId?: string) => {
    if (!coreId) {
      alert("This core has not been saved to the database yet. Please save testing data first.");
      return;
    }

    if (!window.confirm("Are you sure you want to return this core to the vendor? This action is irreversible.")) {
      return;
    }

    try {
      // API Call to backend
      const { default: axios } = await import('axios');
      const res = await axios.put(`/failed-cores/${coreId}/return`, {}, { withCredentials: true });

      if (res.data.success) {
        alert("Core successfully marked as RETURNED to vendor.");
        // Update local state to show it immediately
        setLocalCores(prev => prev.map(c =>
          c._id === coreId ? { ...c, status: "RETURNED" } : c
        ));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to return core to vendor");
    }
  };

  const handleBulkReturn = async () => {
    if (selectedCores.length === 0) return;
    if (!window.confirm(`Are you sure you want to return ${selectedCores.length} selected cores?`)) return;

    try {
      const { default: axios } = await import('axios');
      const res = await axios.post(`/failed-cores/bulk-return`, { coreIds: selectedCores }, { withCredentials: true });
      if (res.data.success) {
        alert(res.data.message);
        setLocalCores(prev => prev.map(c => c._id && selectedCores.includes(c._id) ? { ...c, status: "RETURNED" } : c));
        setSelectedCores([]);
      }
    } catch (err: any) {
      alert("Failed to perform bulk return");
    }
  };

  const handleUndoReturn = async (coreId?: string) => {
    if (!coreId) return;
    if (!window.confirm("Are you sure you want to undo the return of this core? It will be marked as FAILED again.")) return;

    try {
      const res = await axios.put(`/failed-cores/${coreId}/undo-return`, {}, { withCredentials: true });
      if (res.data.success) {
        alert("Core return undone successfully.");
        setLocalCores(prev => prev.map(c => c._id === coreId ? { ...c, status: "FAILED" } : c));
        setSelectedCores(prev => prev.filter(id => id !== coreId));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to undo return");
    }
  };

  const handleReuseCore = async (core: FailedCore) => {
    if (!core || !(core as any)._id) {
      toast.error("Invalid core record.");
      return;
    }
    if (!confirm(`Are you sure you want to mark core ${core.internalCoreNo} for Reuse?\n\nThis will send the core to the Ready Stock Individual Core Testing page.`)) return;

    try {
      const res = await axios.put(`/failed-cores/${(core as any)._id}/reuse`, {}, { withCredentials: true });
      if (res.data.success) {
        toast.success(`Core ${core.internalCoreNo} sent to Ready Stock for Individual Core Testing!`);
        setLocalCores(prev => prev.map(c => 
          (c as any)._id === (core as any)._id ? { ...c, status: 'REUSED' } : c
        ));
      } else {
        toast.error(res.data.message || "Failed to reuse core.");
      }
    } catch (err: any) {
      console.error("Reuse core failed:", err);
      toast.error(err.response?.data?.message || "Failed to mark core for reuse.");
    }
  };

  const toggleSelectAll = (coresToToggle: FailedCore[]) => {
    const returnable = coresToToggle.filter(c => (c as any).status !== "RETURNED" && c._id);
    const returnableIds = returnable.map(c => c._id as string);
    const allSelected = returnableIds.length > 0 && returnableIds.every(id => selectedCores.includes(id));
    if (allSelected) {
      setSelectedCores(prev => prev.filter(id => !returnableIds.includes(id)));
    } else {
      const newSelected = new Set([...selectedCores, ...returnableIds]);
      setSelectedCores(Array.from(newSelected));
    }
  };

  const toggleSelectOne = (coreId?: string) => {
    if (!coreId) return;
    setSelectedCores(prev => prev.includes(coreId) ? prev.filter(id => id !== coreId) : [...prev, coreId]);
  };

  const vendorGroups = groupByVendor();
  const orderGroups = groupByOrder();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            Failed Cores Management
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Track and manage cores that failed testing - Return to vendor for repair
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1 border-gray-300 text-gray-700 hover:bg-gray-100" 
            onClick={handlePrint}
          >
            <Printer className="w-3 h-3" />
            Print Summary Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="text-sm text-red-600 font-medium">Total Failed Cores</div>
          <div className="text-3xl font-bold text-red-700 mt-1">{localCores.length}</div>
        </Card>
        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="text-sm text-orange-600 font-medium">Pending Return</div>
          <div className="text-3xl font-bold text-orange-700 mt-1">{localCores.filter(c => (c as any).status !== 'RETURNED').length}</div>
        </Card>
        <Card className="p-4 border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600 font-medium">Returned to Vendor</div>
          <div className="text-3xl font-bold text-gray-700 mt-1">{localCores.filter(c => (c as any).status === 'RETURNED').length}</div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Order ID, Job ID, Client, Core No, or Vendor No..."
            className="border-0 focus:ring-0 shadow-none"
          />
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedCores.length > 0 && (
        <div className="bg-red-50 p-3 rounded-md flex items-center justify-between border border-red-200">
          <span className="text-red-700 font-medium">{selectedCores.length} cores selected</span>
          <div className="flex gap-2">
            <Button 
                onClick={() => {
                   const cores = localCores.filter(c => c._id && selectedCores.includes(c._id));
                   handleOpenReturnModal('Multiple Vendors', cores);
                }} 
                size="sm" 
                className="bg-red-600 hover:bg-red-700 text-white"
            >
              Generate Return Form
            </Button>
            <Button onClick={handleBulkReturn} size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
              Bulk Mark as Returned
            </Button>
          </div>
        </div>
      )}

      {/* Tabbed View */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-transparent p-0 gap-2 mb-4 flex-wrap h-auto">
          <TabsTrigger
            value="all"
            className="border border-gray-200 bg-white hover:bg-gray-50 data-[state=active]:bg-red-50 data-[state=active]:border-red-500 data-[state=active]:text-red-700 px-4 py-2 rounded-md shadow-sm transition-all"
          >
            All Failed Cores ({filteredCores.length})
          </TabsTrigger>
          <TabsTrigger
            value="vendor"
            className="border border-gray-200 bg-white hover:bg-gray-50 data-[state=active]:bg-red-50 data-[state=active]:border-red-500 data-[state=active]:text-red-700 px-4 py-2 rounded-md shadow-sm transition-all"
          >
            Grouped by Vendor ({Object.keys(vendorGroups).length})
          </TabsTrigger>
          <TabsTrigger
            value="order"
            className="border border-gray-200 bg-white hover:bg-gray-50 data-[state=active]:bg-blue-50 data-[state=active]:border-blue-500 data-[state=active]:text-blue-700 px-4 py-2 rounded-md shadow-sm transition-all"
          >
            Grouped by Order ({Object.keys(orderGroups).length})
          </TabsTrigger>
        </TabsList>

        {/* Tab: All Cores */}
        <TabsContent value="all">
          <Card className="p-4">
            <h3 className="text-lg font-bold mb-4">All Failed Cores List</h3>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm border-separate" style={{ borderSpacing: 0 }}>
                <thead className="bg-white">
                  {renderChipsRow(12, ['orderId', 'jobId', 'client', 'coreType', 'vendorNo', 'failureStage', 'failureReason', 'status'])}
                  <tr className="bg-gray-50">
                    <th className="p-2 w-10 bg-gray-50 border-b border-gray-200">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                        checked={filteredCores.filter(c => (c as any).status !== 'RETURNED' && c._id).length > 0 && filteredCores.filter(c => (c as any).status !== 'RETURNED' && c._id).every(c => selectedCores.includes(c._id as string))}
                        onChange={() => toggleSelectAll(filteredCores)}
                      />
                    </th>
                    <th className="p-2 text-left font-medium bg-gray-50 border-b border-gray-200 whitespace-nowrap">Date</th>
                    {visibleColumns.orderId && <th className="p-2 text-left font-medium bg-gray-50 border-b border-gray-200 whitespace-nowrap">Order ID</th>}
                    {visibleColumns.jobId && <th className="p-2 text-left font-medium bg-gray-50 border-b border-gray-200 whitespace-nowrap">Job ID</th>}
                    {visibleColumns.client && <th className="p-2 text-left font-medium bg-gray-50 border-b border-gray-200 whitespace-nowrap">Client</th>}
                    {visibleColumns.coreType && <th className="p-2 text-left font-medium bg-gray-50 border-b border-gray-200 whitespace-nowrap">Core Type</th>}
                    <th className="p-2 text-left font-medium bg-gray-50 border-b border-gray-200 whitespace-nowrap">Internal Core No</th>
                    {visibleColumns.vendorNo && <th className="p-2 text-left font-medium bg-gray-50 border-b border-gray-200 whitespace-nowrap">Vendor No</th>}
                    {visibleColumns.failureStage && <th className="p-2 text-left font-medium bg-gray-50 border-b border-gray-200 whitespace-nowrap">Failure Stage</th>}
                    {visibleColumns.failureReason && <th className="p-2 text-left font-medium bg-gray-50 border-b border-gray-200 whitespace-nowrap">Failure Reason</th>}
                    {visibleColumns.status && <th className="p-2 text-left font-medium bg-gray-50 border-b border-gray-200 whitespace-nowrap">Status</th>}
                    <th className="p-2 text-left font-medium bg-gray-50 border-b border-gray-200 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="[&>tr>td]:border-b [&>tr>td]:border-gray-100 [&>tr:last-child>td]:border-b-0">
                  {filteredCores.map((core, index) => (
                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-2">
                        {(core as any).status !== "RETURNED" && core._id && (
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                            checked={selectedCores.includes(core._id)}
                            onChange={() => toggleSelectOne(core._id)}
                          />
                        )}
                      </td>
                      <td className="p-2 whitespace-nowrap">{core.failedAt ? new Date(core.failedAt).toLocaleDateString('en-GB') : (core.createdAt ? new Date(core.createdAt).toLocaleDateString('en-GB') : '-')}</td>
                      {visibleColumns.orderId && <td className="p-2 font-mono text-xs">{String(core.orderId || '')}</td>}
                      {visibleColumns.jobId && <td className="p-2 font-mono text-xs">{String(core.jobId || '')}</td>}
                      {visibleColumns.client && <td className="p-2 whitespace-nowrap">{String(core.clientName || '')}</td>}
                      {visibleColumns.coreType && <td className="p-2 whitespace-nowrap">{String(core.coreType || '')}</td>}
                      <td className="p-2 font-mono font-medium text-red-700">{String(core.internalCoreNo || '')}</td>
                      {visibleColumns.vendorNo && <td className="p-2 whitespace-nowrap">{String(core.coreVendorNo || core.vendorCoreNo || '')}</td>}
                      {visibleColumns.failureStage && <td className="p-2 whitespace-nowrap text-xs font-semibold text-gray-700">{String(core.failureStage || '').replace(/_/g, ' ').toUpperCase()}</td>}
                      {visibleColumns.failureReason && (
                        <td className="p-2 min-w-[200px]">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-1.5 h-8 px-2"
                            onClick={() => setReasonModalData({ 
                              isOpen: true, 
                              reason: String(core.failureReason || ''), 
                              serialNo: String(core.internalCoreNo || '')
                            })}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Reason
                          </Button>
                        </td>
                      )}
                      {visibleColumns.status && <td className="p-2 whitespace-nowrap">
                        {(core as any).status === "RETURNED" ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            <RotateCcw className="w-3.5 h-3.5 mr-1" /> RETURNED
                          </span>
                        ) : (core as any).status === "REUSED" ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                            <Recycle className="w-3.5 h-3.5 mr-1" /> REUSED
                          </span>
                        ) : (core as any).adminApprovalStatus === "PENDING" ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Clock className="w-3.5 h-3.5 mr-1" /> REVIEW PENDING
                          </span>
                        ) : ((core as any).adminApprovalStatus === "APPROVED" || (core as any).status === "RETEST_APPROVED" || (core as any).retestStatus === "PENDING") ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            <RefreshCw className="w-3.5 h-3.5 mr-1" /> RETESTING
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="w-3.5 h-3.5 mr-1" /> FAILED
                          </span>
                        )}
                      </td>}
                      <td className="p-2 flex gap-2">
                        {(core as any).status !== "RETURNED" && (core as any).status !== "REUSED" && (core as any).adminApprovalStatus !== "PENDING" && (core as any).adminApprovalStatus !== "APPROVED" && (core as any).status !== "RETEST_APPROVED" && (core as any).retestStatus !== "PENDING" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs border-green-600 text-green-700 hover:bg-green-50 flex items-center gap-1 font-semibold"
                              onClick={() => handleReuseCore(core)}
                              title="Send this core to Ready Stock for Individual Core Testing"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Reuse
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs border-orange-300 text-orange-700 hover:bg-orange-50"
                              onClick={() => handleReturnToVendor(core._id)}
                            >
                              Return
                            </Button>
                          </>
                        )}
                        {(core as any).status === "RETURNED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs border-gray-300 text-gray-700 hover:bg-gray-50"
                            onClick={() => handleUndoReturn(core._id)}
                          >
                            Undo
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab: Grouped by Vendor */}
        <TabsContent value="vendor">
          <Card className="p-4">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded">Vendor Metrics</span>
            </h3>
            <div className="space-y-4">
              {Object.entries(vendorGroups).map(([vendorNo, cores]) => (
                <div key={vendorNo} className="border border-red-200 rounded-lg overflow-hidden">
                  <div className="bg-red-100 p-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-red-900">Vendor No: {vendorNo}</h4>
                      <p className="text-sm text-red-700">Total Failed Cores: {cores.length}</p>
                    </div>
                    <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => handleOpenReturnModal(vendorNo, cores)}
                    >
                      Generate Return Form
                    </Button>
                  </div>
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-sm border-separate" style={{ borderSpacing: 0 }}>
                      <thead className="bg-white">
                        {renderChipsRow(11, ['orderId', 'jobId', 'client', 'coreType', 'failureStage', 'failureReason', 'status'])}
                        <tr className="bg-gray-50">
                          <th className="p-2 w-10 bg-gray-50 border-b border-gray-200">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                              checked={cores.filter(c => (c as any).status !== 'RETURNED' && c._id).length > 0 && cores.filter(c => (c as any).status !== 'RETURNED' && c._id).every(c => selectedCores.includes(c._id as string))}
                              onChange={() => toggleSelectAll(cores)}
                            />
                          </th>
                          <th className="p-2 text-left font-medium bg-gray-50 border-b border-gray-200 whitespace-nowrap">Date</th>
                          {visibleColumns.orderId && <th className="p-2 text-left font-medium bg-gray-50 border-b border-gray-200 whitespace-nowrap">Order ID</th>}
                          {visibleColumns.jobId && <th className="p-2 text-left font-medium bg-gray-50 border-b border-gray-200 whitespace-nowrap">Job ID</th>}
                          {visibleColumns.client && <th className="p-2 text-left font-medium bg-gray-50 border-b border-gray-200 whitespace-nowrap">Client</th>}
                          {visibleColumns.coreType && <th className="p-2 text-left font-medium bg-gray-50 border-b border-gray-200 whitespace-nowrap">Core Type</th>}
                          <th className="p-2 text-left font-medium bg-gray-50 border-b border-gray-200 whitespace-nowrap">Internal Core No</th>
                          {visibleColumns.failureStage && <th className="p-2 text-left font-medium bg-gray-50 border-b border-gray-200 whitespace-nowrap">Failure Stage</th>}
                          {visibleColumns.failureReason && <th className="p-2 text-left font-medium bg-gray-50 border-b border-gray-200 whitespace-nowrap">Failure Reason</th>}
                          {visibleColumns.status && <th className="p-2 text-left font-medium bg-gray-50 border-b border-gray-200 whitespace-nowrap">Status</th>}
                          <th className="p-2 text-left font-medium bg-gray-50 border-b border-gray-200 whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="[&>tr>td]:border-b [&>tr>td]:border-gray-100 [&>tr:last-child>td]:border-b-0">
                        {cores.map((core, idx) => (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="p-2">
                              {(core as any).status !== "RETURNED" && core._id && (
                                <input
                                  type="checkbox"
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                  checked={selectedCores.includes(core._id)}
                                  onChange={() => toggleSelectOne(core._id)}
                                />
                              )}
                            </td>
                            <td className="p-2 whitespace-nowrap">{core.failedAt ? new Date(core.failedAt).toLocaleDateString('en-GB') : (core.createdAt ? new Date(core.createdAt).toLocaleDateString('en-GB') : '-')}</td>
                            {visibleColumns.orderId && <td className="p-2 font-mono text-xs">{String(core.orderId || '')}</td>}
                            {visibleColumns.jobId && <td className="p-2 font-mono text-xs">{String(core.jobId || '')}</td>}
                            {visibleColumns.client && <td className="p-2 whitespace-nowrap">{String(core.clientName || '')}</td>}
                            {visibleColumns.coreType && <td className="p-2 whitespace-nowrap">{String(core.coreType || '')}</td>}
                            <td className="p-2 font-mono font-medium text-red-700">{String(core.internalCoreNo || '')}</td>
                            {visibleColumns.failureStage && <td className="p-2 whitespace-nowrap text-xs font-semibold text-gray-700">{String(core.failureStage || '').replace(/_/g, ' ').toUpperCase()}</td>}
                            {visibleColumns.failureReason && (
                              <td className="p-2 min-w-[200px]">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-1.5 h-8 px-2"
                                  onClick={() => setReasonModalData({ 
                                    isOpen: true, 
                                    reason: String(core.failureReason || ''), 
                                    serialNo: String(core.internalCoreNo || '')
                                  })}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  View Reason
                                </Button>
                              </td>
                            )}
                            {visibleColumns.status && <td className="p-2 whitespace-nowrap">
                              {(core as any).status === "RETURNED" ? (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> RETURNED
                                </span>
                              ) : (core as any).status === "REUSED" ? (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                  <Recycle className="w-3.5 h-3.5 mr-1" /> REUSED
                                </span>
                              ) : (core as any).adminApprovalStatus === "PENDING" ? (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <Clock className="w-3.5 h-3.5 mr-1" /> REVIEW PENDING
                                </span>
                              ) : ((core as any).adminApprovalStatus === "APPROVED" || (core as any).status === "RETEST_APPROVED" || (core as any).retestStatus === "PENDING") ? (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> RETESTING
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                                  <XCircle className="w-3.5 h-3.5 mr-1" /> FAILED
                                </span>
                              )}
                            </td>}
                            <td className="p-2 flex gap-2">
                              {(core as any).status !== "RETURNED" && (core as any).status !== "REUSED" && (core as any).adminApprovalStatus !== "PENDING" && (core as any).adminApprovalStatus !== "APPROVED" && (core as any).status !== "RETEST_APPROVED" && (core as any).retestStatus !== "PENDING" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs border-green-600 text-green-700 hover:bg-green-50 flex items-center gap-1 font-semibold"
                                    onClick={() => handleReuseCore(core)}
                                    title="Send this core to Ready Stock for Individual Core Testing"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    Reuse
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs border-orange-300 text-orange-700 hover:bg-orange-50"
                                    onClick={() => handleReturnToVendor(core._id)}
                                  >
                                    Return
                                  </Button>
                                </>
                              )}
                              {(core as any).status === "RETURNED" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs border-gray-300 text-gray-700 hover:bg-gray-50"
                                  onClick={() => handleUndoReturn(core._id)}
                                >
                                  Undo
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Tab: Grouped by Order */}
        <TabsContent value="order">
          <Card className="p-4">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded">Order Metrics</span>
            </h3>
            <div className="space-y-4">
              {Object.entries(orderGroups).map(([orderId, cores]) => (
                <div key={orderId} className="border border-blue-200 rounded-lg overflow-hidden">
                  <div className="bg-blue-100 p-3">
                    <h4 className="font-bold text-blue-900">Order: {orderId}</h4>
                    <p className="text-sm text-blue-700">
                      {cores[0]?.jobId || 'Unknown Job'} - {cores[0]?.clientName || 'Unknown Client'} - Failed Cores: {cores.length}
                    </p>
                  </div>
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-sm border-separate" style={{ borderSpacing: 0 }}>
                      <thead className="bg-white">
                        {renderChipsRow(10, ['coreType', 'vendorNo', 'failureStage', 'failureReason', 'testValues', 'status'])}
                        <tr className="bg-gray-50">
                          <th className="p-2 w-10 bg-gray-50 border-b border-gray-200">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                              checked={cores.filter(c => (c as any).status !== 'RETURNED' && c._id).length > 0 && cores.filter(c => (c as any).status !== 'RETURNED' && c._id).every(c => selectedCores.includes(c._id as string))}
                              onChange={() => toggleSelectAll(cores)}
                            />
                          </th>
                          <th className="p-2 text-left font-medium bg-gray-50 border-b border-gray-200 whitespace-nowrap">Date</th>
                          {visibleColumns.coreType && <th className="p-2 text-left font-medium bg-gray-50 border-b border-gray-200 whitespace-nowrap">Core Type</th>}
                          <th className="p-2 text-left font-medium bg-gray-50 border-b border-gray-200 whitespace-nowrap">Internal Core No</th>
                          {visibleColumns.vendorNo && <th className="p-2 text-left font-medium bg-gray-50 border-b border-gray-200 whitespace-nowrap">Vendor No</th>}
                          {visibleColumns.failureStage && <th className="p-2 text-left font-medium bg-gray-50 border-b border-gray-200 whitespace-nowrap">Failure Stage</th>}
                          {visibleColumns.failureReason && <th className="p-2 text-left font-medium bg-gray-50 border-b border-gray-200 whitespace-nowrap">Failure Reason</th>}
                          {visibleColumns.testValues && <th className="p-2 text-left font-medium bg-gray-50 border-b border-gray-200 whitespace-nowrap">Test Values</th>}
                          {visibleColumns.status && <th className="p-2 text-left font-medium bg-gray-50 border-b border-gray-200 whitespace-nowrap">Status</th>}
                          <th className="p-2 text-left font-medium bg-gray-50 border-b border-gray-200 whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="[&>tr>td]:border-b [&>tr>td]:border-gray-100 [&>tr:last-child>td]:border-b-0">
                        {cores.map((core, idx) => (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="p-2">
                              {(core as any).status !== "RETURNED" && core._id && (
                                <input
                                  type="checkbox"
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                  checked={selectedCores.includes(core._id)}
                                  onChange={() => toggleSelectOne(core._id)}
                                />
                              )}
                            </td>
                            <td className="p-2 whitespace-nowrap">{core.failedAt ? new Date(core.failedAt).toLocaleDateString('en-GB') : (core.createdAt ? new Date(core.createdAt).toLocaleDateString('en-GB') : '-')}</td>
                            {visibleColumns.coreType && <td className="p-2 whitespace-nowrap">{String(core.coreType || '')}</td>}
                            <td className="p-2 font-mono font-medium text-red-700">{String(core.internalCoreNo || '')}</td>
                            {visibleColumns.vendorNo && <td className="p-2 whitespace-nowrap">{String(core.coreVendorNo || core.vendorCoreNo || '')}</td>}
                            {visibleColumns.failureStage && <td className="p-2 whitespace-nowrap text-xs font-semibold text-gray-700">{String(core.failureStage || '').replace(/_/g, ' ').toUpperCase()}</td>}
                            {visibleColumns.failureReason && (
                              <td className="p-2 min-w-[200px]">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-1.5 h-8 px-2"
                                  onClick={() => setReasonModalData({ 
                                    isOpen: true, 
                                    reason: String(core.failureReason || ''), 
                                    serialNo: String(core.internalCoreNo || '')
                                  })}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  View Reason
                                </Button>
                              </td>
                            )}
                            {visibleColumns.testValues && <td className="p-2 text-xs">
                              <span className="font-mono">
                                1K:{String(core.value1000 || '-')} | 3K:{String(core.value3000 || '-')} | 5K:{String(core.value5000 || '-')} | 7K:{String(core.value7000 || '-')}
                              </span>
                            </td>}
                            <td className="p-2">
                              {(core as any).status === "RETURNED" ? (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> RETURNED
                                </span>
                              ) : (core as any).status === "REUSED" ? (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                  <Recycle className="w-3.5 h-3.5 mr-1" /> REUSED
                                </span>
                              ) : (core as any).adminApprovalStatus === "PENDING" ? (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <Clock className="w-3.5 h-3.5 mr-1" /> REVIEW PENDING
                                </span>
                              ) : ((core as any).adminApprovalStatus === "APPROVED" || (core as any).status === "RETEST_APPROVED" || (core as any).retestStatus === "PENDING") ? (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> RETESTING
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                                  <XCircle className="w-3.5 h-3.5 mr-1" /> FAILED
                                </span>
                              )}
                            </td>
                            <td className="p-2 flex gap-2">
                              {(core as any).status !== "RETURNED" && (core as any).status !== "REUSED" && (core as any).adminApprovalStatus !== "PENDING" && (core as any).adminApprovalStatus !== "APPROVED" && (core as any).status !== "RETEST_APPROVED" && (core as any).retestStatus !== "PENDING" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs border-green-600 text-green-700 hover:bg-green-50 flex items-center gap-1 font-semibold"
                                    onClick={() => handleReuseCore(core)}
                                    title="Send this core to Ready Stock for Individual Core Testing"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    Reuse
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs border-orange-300 text-orange-700 hover:bg-orange-50"
                                    onClick={() => handleReturnToVendor(core._id)}
                                  >
                                    Return
                                  </Button>
                                </>
                              )}
                              {(core as any).status === "RETURNED" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs border-gray-300 text-gray-700 hover:bg-gray-50"
                                  onClick={() => handleUndoReturn(core._id)}
                                >
                                  Undo
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Notes */}
      < Card className="p-4 bg-yellow-50 border-yellow-200" >
        <h4 className="font-bold text-yellow-900 mb-2 flex items-center gap-1.5"><ClipboardList className="w-4 h-4 text-yellow-700" /> Vendor Return Instructions</h4>
        <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
          <li>All failed cores must be documented and returned to respective vendors for warranty/repair</li>
          <li>Generate return forms grouped by vendor for easier processing</li>
          <li>Replacement cores have been logged with (R) marker in the testing system</li>
          <li>Keep detailed records of failure reasons for quality control and vendor feedback</li>
          <li>Follow company policy for core handling and vendor communication</li>
        </ul>
      </Card>

      {/* Return Form Modal */}
      {showReturnModal && (
        <FailedCoreReturnForm 
            vendorName={returnModalVendor}
            selectedCores={returnModalCores}
            onClose={() => setShowReturnModal(false)}
            onSuccess={handleReturnSuccess}
        />
      )}

      {/* Reason Modal */}
      {reasonModalData?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-2xl p-6 bg-white shadow-2xl rounded-xl border border-gray-100 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h2 className="text-xl font-bold text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Failure Reason
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Detailed reason for failure for core <span className="font-mono font-bold text-red-600">{reasonModalData.serialNo}</span>.
              </p>
            </div>
            
            <div className="bg-red-50/50 border border-red-100 rounded-lg p-4 my-2 max-h-[60vh] overflow-y-auto">
              {reasonModalData.reason ? (
                <ul className="list-disc pl-5 space-y-2 text-sm text-red-800 font-medium">
                  {reasonModalData.reason.split(' | ').map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">No reason provided.</p>
              )}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => setReasonModalData(null)}
                className="text-sm font-semibold"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}


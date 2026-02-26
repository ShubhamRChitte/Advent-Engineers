import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  ArrowLeft,
  AlertTriangle,
  Printer,
  Search,
  Download,
} from 'lucide-react';
import { FailedCore } from './CoreTestingForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

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

  // 1. Structural Protection: Ensure failedCores is always an array
  const safeCores = Array.isArray(failedCores) ? failedCores : [];

  // Debug Visibility (Temporary for verification, remove in final prod if noisy)
  // console.log("FAILED CORES API:", safeCores); 

  // 2. Safe Filtering Logic
  const filteredCores = safeCores.filter(core => {
    if (!core) return false;
    const searchLow = safeLower(searchTerm);
    return (
      safeLower(core.orderId).includes(searchLow) ||
      safeLower(core.jobId).includes(searchLow) ||
      safeLower(core.clientName).includes(searchLow) ||
      safeLower(core.internalCoreNo).includes(searchLow) ||
      safeLower(core.coreVendorNo).includes(searchLow) ||
      safeLower(core.vendorCoreNo).includes(searchLow) // Added potential backend field match
    );
  });

  const groupByVendor = () => {
    const grouped: { [key: string]: FailedCore[] } = {};
    safeCores.forEach(core => {
      // Handle missing vendor numbers gracefully
      const vendorKey = core.coreVendorNo || core.vendorCoreNo || "Unknown Vendor";
      if (!grouped[vendorKey]) {
        grouped[vendorKey] = [];
      }
      grouped[vendorKey].push(core);
    });
    return grouped;
  };

  const groupByOrder = () => {
    const grouped: { [key: string]: FailedCore[] } = {};
    safeCores.forEach(core => {
      // Handle missing order IDs gracefully
      const orderKey = core.orderId ? String(core.orderId) : "Unknown Order";
      if (!grouped[orderKey]) {
        grouped[orderKey] = [];
      }
      grouped[orderKey].push(core);
    });
    return grouped;
  };

  const handlePrint = () => {
    window.print();
  };

  const vendorGroups = groupByVendor();
  const orderGroups = groupByOrder();

  return (
    <div className="space-y-4">
      {/* Print-only styles */}
      <style>
        {`
          #print-section {
            display: none !important;
          }

          @media print {
            @page {
              size: A4 landscape;
              margin: 8mm;
            }
            body * {
              visibility: hidden;
            }
            #print-section, #print-section * {
              visibility: visible;
              display: block !important;
            }
            #print-section {
              display: block !important;
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white !important;
              color: black !important;
              padding: 0;
              margin: 0;
              visibility: visible !important;
            }
            .no-print {
              display: none !important;
            }
            
            /* Strict Table Layout */
            .report-table {
              display: table !important;
              width: 100% !important;
              border-collapse: collapse !important;
              border: 1.5px solid #000 !important;
              table-layout: fixed !important;
            }
            .report-table thead {
              display: table-header-group !important;
            }
            .report-table tbody {
              display: table-row-group !important;
            }
            .report-table tr {
              display: table-row !important;
              page-break-inside: avoid !important;
            }
            .report-table th, .report-table td {
              display: table-cell !important;
              border: 1px solid #000 !important;
              padding: 6px 4px !important;
              text-align: left !important;
              font-size: 10px !important;
              vertical-align: middle !important;
              word-wrap: break-word !important;
            }
            .report-table th {
              background-color: #f8fafc !important;
              font-weight: bold !important;
              text-transform: uppercase !important;
              font-size: 9px !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            /* Enterprise Branding */
            .report-header-grid {
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              border: 1.5px solid #000 !important;
              margin-bottom: 0px !important;
            }
            .header-info-cell {
              padding: 8px !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: center !important;
              border-right: 1.5px solid #000 !important;
            }
            .header-info-cell-last {
              border-right: none !important;
            }
            .header-logo-title {
              font-size: 20px !important;
              font-weight: 900 !important;
              color: #000 !important;
              letter-spacing: -0.5px !important;
              line-height: 1 !important;
            }
            .header-motto {
              font-size: 8px !important;
              color: #333 !important;
              font-style: italic !important;
              margin-top: 2px !important;
            }
            
            .report-title-banner {
              background-color: #ffffff !important;
              border-left: 1.5px solid #000 !important;
              border-right: 1.5px solid #000 !important;
              border-bottom: 2.5px solid #000 !important;
              text-align: center !important;
              padding: 8px !important;
              font-weight: bold !important;
              font-size: 18px !important;
              text-transform: uppercase !important;
              letter-spacing: 1px !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .footer-sig {
              margin-top: 40px !important;
              display: flex !important;
              justify-content: space-between !important;
              padding: 0 50px !important;
            }
            .sig-line {
              border-top: 1.5px solid #000 !important;
              width: 180px !important;
              text-align: center !important;
              font-size: 11px !important;
              padding-top: 4px !important;
              font-weight: bold !important;
            }
          }
        `}
      </style>

      {/* 
        ======================================================================
        PRINT SECTION (Visible only during print)
        ======================================================================
      */}
      <div id="print-section" className="hidden print:block font-sans">
        {/* Enterprise Header */}
        <div className="report-header-grid">
          <div className="header-info-cell">
            <div className="header-logo-title">ADVENT ENGINEERS</div>
            <div className="header-motto">Excellence in Electrical Infrastructure & Services</div>
          </div>
          <div className="header-info-cell header-info-cell-last text-right">
            <div className="text-[10px] leading-tight">
              <b>DATE:</b> {new Date().toLocaleDateString()}<br />
              <b>DOCUMENT:</b> FAILED CORES SUMMARY
            </div>
          </div>
        </div>

        <div className="report-title-banner">
          FAILED CORES SUMMARY REPORT
        </div>

        <div className="mt-4 px-1">
          <div className="flex justify-between items-end mb-2">
            <p className="text-[11px] text-gray-700 font-medium">
              SUMMARY OF NON-CONFORMING CORES IDENTIFIED DURING FINAL UNIT TESTING
            </p>
            <p className="text-[10px] bg-slate-100 px-2 py-0.5 border border-slate-300">
              TOTAL RECORDS: <b>{safeCores.length}</b>
            </p>
          </div>

          <table className="report-table">
            <thead>
              <tr>
                <th style={{ width: '10%' }}>DATE</th>
                <th style={{ width: '15%' }}>JOB ID</th>
                <th style={{ width: '15%' }}>CLIENT NAME</th>
                <th style={{ width: '10%' }}>CORE TYPE</th>
                <th style={{ width: '12%' }}>INTERNAL ID</th>
                <th style={{ width: '13%' }}>VENDOR NO</th>
                <th style={{ width: '25%' }}>FAILURE RESON / OBSERVATION</th>
              </tr>
            </thead>
            <tbody>
              {safeCores.map((core, i) => (
                <tr key={i}>
                  <td>{core.date || '-'}</td>
                  <td className="font-mono">{core.jobId || '-'}</td>
                  <td>{core.clientName || '-'}</td>
                  <td>{core.coreType || '-'}</td>
                  <td className="font-bold underline">{core.internalCoreNo || '-'}</td>
                  <td>{core.coreVendorNo || core.vendorCoreNo || '-'}</td>
                  <td className="text-[9px] leading-relaxed italic">{core.failureReason || '-'}</td>
                </tr>
              ))}
              {safeCores.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400 italic">No non-conforming cores recorded in current session.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 mx-1 py-3 px-4 bg-slate-50 border border-slate-200">
          <h5 className="text-[11px] font-bold text-slate-900 mb-1 uppercase underline">Disposition Instructions:</h5>
          <p className="text-[10px] text-slate-700 leading-normal">
            The cores listed above have failed specific performance criteria (Ratio, Accuracy, or Excitation) during
            primary/secondary testing. These components are strictly prohibited from being dispatched.
            Logistics department to coordinate with the Quality Manager for immediate return-to-vendor (RTV) processing.
          </p>
        </div>

        {/* Footer */}
        <div className="footer-sig">
          <div>
            <div className="sig-line">TESTED BY</div>
            <div className="text-[8px] text-center mt-1 text-gray-400 tracking-tight">Technical Testing Division</div>
          </div>
          <div className="text-right">
            <div className="sig-line">AUTHORISED SIGNATORY</div>
            <div className="text-[8px] text-center mt-1 text-gray-500 font-bold uppercase tracking-widest leading-none">
              STAMP & SIGNATURE REQUIRED
            </div>
          </div>
        </div>
      </div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="outline"
            onClick={onBack}
            size="sm"
            className="mb-2 gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Testing
          </Button>
          <h2 className="text-2xl font-bold text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            Failed Cores Management
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Track and manage cores that failed testing - Return to vendor for repair
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={handlePrint}>
            <Printer className="w-3 h-3" />
            Print Report
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="w-3 h-3" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="text-sm text-red-600 font-medium">Total Failed Cores</div>
          <div className="text-3xl font-bold text-red-700 mt-1">{safeCores.length}</div>
        </Card>
        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="text-sm text-orange-600 font-medium">Unique Vendors</div>
          <div className="text-3xl font-bold text-orange-700 mt-1">{Object.keys(vendorGroups).length}</div>
        </Card>
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <div className="text-sm text-yellow-700 font-medium">Affected Orders</div>
          <div className="text-3xl font-bold text-yellow-800 mt-1">{Object.keys(orderGroups).length}</div>
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300">
                    <th className="p-2 text-left font-medium">Date</th>
                    <th className="p-2 text-left font-medium">Order ID</th>
                    <th className="p-2 text-left font-medium">Job ID</th>
                    <th className="p-2 text-left font-medium">Client</th>
                    <th className="p-2 text-left font-medium">Core Type</th>
                    <th className="p-2 text-left font-medium">Internal Core No</th>
                    <th className="p-2 text-left font-medium">Vendor No</th>
                    <th className="p-2 text-left font-medium">Failure Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCores.map((core, index) => (
                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-2">{String(core.date || '')}</td>
                      <td className="p-2 font-mono text-xs">{String(core.orderId || '')}</td>
                      <td className="p-2 font-mono text-xs">{String(core.jobId || '')}</td>
                      <td className="p-2">{String(core.clientName || '')}</td>
                      <td className="p-2">{String(core.coreType || '')}</td>
                      <td className="p-2 font-mono font-medium text-red-700">{String(core.internalCoreNo || '')}</td>
                      <td className="p-2">{String(core.coreVendorNo || core.vendorCoreNo || '')}</td>
                      <td className="p-2 text-xs text-red-600">{String(core.failureReason || '')}</td>
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
                    <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                      Generate Return Form
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="p-2 text-left font-medium">Date</th>
                          <th className="p-2 text-left font-medium">Order ID</th>
                          <th className="p-2 text-left font-medium">Job ID</th>
                          <th className="p-2 text-left font-medium">Client</th>
                          <th className="p-2 text-left font-medium">Core Type</th>
                          <th className="p-2 text-left font-medium">Internal Core No</th>
                          <th className="p-2 text-left font-medium">Failure Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cores.map((core, idx) => (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="p-2">{String(core.date || '')}</td>
                            <td className="p-2 font-mono text-xs">{String(core.orderId || '')}</td>
                            <td className="p-2 font-mono text-xs">{String(core.jobId || '')}</td>
                            <td className="p-2">{String(core.clientName || '')}</td>
                            <td className="p-2">{String(core.coreType || '')}</td>
                            <td className="p-2 font-mono font-medium text-red-700">{String(core.internalCoreNo || '')}</td>
                            <td className="p-2 text-xs text-red-600">{String(core.failureReason || '')}</td>
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
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="p-2 text-left font-medium">Date</th>
                          <th className="p-2 text-left font-medium">Core Type</th>
                          <th className="p-2 text-left font-medium">Internal Core No</th>
                          <th className="p-2 text-left font-medium">Vendor No</th>
                          <th className="p-2 text-left font-medium">Failure Reason</th>
                          <th className="p-2 text-left font-medium">Test Values</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cores.map((core, idx) => (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="p-2">{String(core.date || '')}</td>
                            <td className="p-2">{String(core.coreType || '')}</td>
                            <td className="p-2 font-mono font-medium text-red-700">{String(core.internalCoreNo || '')}</td>
                            <td className="p-2">{String(core.coreVendorNo || core.vendorCoreNo || '')}</td>
                            <td className="p-2 text-xs text-red-600">{String(core.failureReason || '')}</td>
                            <td className="p-2 text-xs">
                              <span className="font-mono">
                                1K:{String(core.value1000 || '-')} | 3K:{String(core.value3000 || '-')} | 5K:{String(core.value5000 || '-')} | 7K:{String(core.value7000 || '-')}
                              </span>
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
        <h4 className="font-bold text-yellow-900 mb-2">📋 Vendor Return Instructions</h4>
        <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
          <li>All failed cores must be documented and returned to respective vendors for warranty/repair</li>
          <li>Generate return forms grouped by vendor for easier processing</li>
          <li>Replacement cores have been logged with (R) marker in the testing system</li>
          <li>Keep detailed records of failure reasons for quality control and vendor feedback</li>
          <li>Follow company policy for core handling and vendor communication</li>
        </ul>
      </Card >
    </div >
  );
}

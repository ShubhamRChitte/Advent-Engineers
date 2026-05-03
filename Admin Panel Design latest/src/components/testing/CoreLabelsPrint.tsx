import { Button } from '../ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { CoreTestingOrder } from './CoreTestingOrders';

interface CoreTestRow {
  date: string;
  coreVendorNo: string;
  internalCoreNo: string;
  value1000: string;
  value3000: string;
  value5000: string;
  value7000: string;
  remark: string;
  isReplacement?: boolean;
}

interface CoreLabelsPrintProps {
  cores: CoreTestRow[];
  order: CoreTestingOrder;
  coreType: 'Metering' | 'PS' | 'Protection';
  onBack: () => void;
}

export function CoreLabelsPrint({ cores, order, coreType, onBack }: CoreLabelsPrintProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Hidden on print */}
      <div className="no-print bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
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
              <h2 className="text-xl font-bold">Core ID Labels - Ready to Print</h2>
              <p className="text-sm text-gray-600 mt-1">
                {order.jobId} - {order.clientName} - {coreType} - {cores.length} Passed Cores
              </p>
            </div>
            <Button
              size="lg"
              className="gap-2 bg-green-600 hover:bg-green-700"
              onClick={handlePrint}
            >
              <Printer className="w-4 h-4" />
              Print Labels
            </Button>
          </div>
        </div>
      </div>

      {/* Instructions - Hidden on print */}
      <div className="no-print max-w-7xl mx-auto px-4 py-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-blue-900 mb-2">📄 Printing Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Click "Print Labels" button to open print dialog</li>
            <li>Recommended: Use adhesive label sheets (4x2 or 6x3 layout)</li>
            <li>Or print on regular paper and cut labels manually</li>
            <li>Each label contains the core ID to stick on transformer</li>
            <li>Print settings: Portrait orientation, fit to page</li>
          </ul>
        </div>
      </div>

      {/* Printable Labels Area */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 print:shadow-none print:p-0">
          {/* Print Header */}
          <div className="mb-8 text-center border-b-2 border-[#003a70] pb-4 print:mb-6">
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="w-12 h-12 bg-[#003a70] rounded flex items-center justify-center text-white font-bold text-xl">
                AE
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#003a70]">ADVENT ENGINEERS</h1>
                <p className="text-sm text-gray-600">Transformer Core Testing - Passed Cores</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
              <div>
                <span className="text-gray-600">Order ID:</span>
                <span className="font-bold ml-2">{order.orderId}</span>
              </div>
              <div>
                <span className="text-gray-600">Job ID:</span>
                <span className="font-bold ml-2">{order.jobId}</span>
              </div>
              <div>
                <span className="text-gray-600">Client:</span>
                <span className="font-bold ml-2">{order.clientName}</span>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-gray-600">Core Type:</span>
              <span className="font-bold ml-2 text-[#003a70]">{coreType}</span>
              <span className="text-gray-600 ml-4">Total Passed:</span>
              <span className="font-bold ml-2 text-green-600">{cores.length}</span>
            </div>
          </div>

          {/* Labels Grid */}
          <div className="grid grid-cols-3 gap-4 print:gap-3">
            {cores.map((core, index) => (
              <div
                key={index}
                className="border-2 border-dashed border-gray-400 rounded-lg p-4 flex flex-col items-center justify-center bg-white print:border-solid print:break-inside-avoid"
                style={{ minHeight: '140px' }}
              >
                {/* Logo/Header */}
                <div className="text-xs font-bold text-[#003a70] mb-2 text-center border-b border-gray-300 pb-1 w-full">
                  ADVENT ENGINEERS
                </div>

                {/* Core Type Badge */}
                <div className="bg-[#003a70] text-white px-3 py-1 rounded text-xs font-bold mb-2">
                  {coreType}
                </div>

                {/* Core ID - Large and Bold */}
                <div className="font-mono text-lg font-bold text-center text-gray-900 mb-2 break-all">
                  {String(core.internalCoreNo || '')}
                </div>

                {/* Additional Info */}
                <div className="text-xs text-gray-600 text-center space-y-1 w-full">
                  <div className="flex justify-between px-2">
                    <span>Date:</span>
                    <span className="font-medium">{String(core.date || 'N/A')}</span>
                  </div>
                  <div className="flex justify-between px-2">
                    <span>Vendor:</span>
                    <span className="font-medium">{String(core.coreVendorNo || 'N/A')}</span>
                  </div>
                  <div className="mt-1 pt-1 border-t border-gray-200">
                    <span className="inline-block bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold text-xs">
                      ✓ PASSED
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t-2 border-gray-300 text-center text-xs text-gray-600 print:mt-6">
            <p className="font-medium">These cores have successfully passed all testing requirements</p>
            <p className="mt-1">Stick these labels on corresponding transformers for identification</p>
            <p className="mt-2 text-gray-500">Printed: {new Date().toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            background: white;
          }
          
          @page {
            margin: 1cm;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          .print\\:p-0 {
            padding: 0 !important;
          }
          
          .print\\:mb-6 {
            margin-bottom: 1.5rem !important;
          }
          
          .print\\:mt-6 {
            margin-top: 1.5rem !important;
          }
          
          .print\\:gap-3 {
            gap: 0.75rem !important;
          }
          
          .print\\:border-solid {
            border-style: solid !important;
          }
          
          .print\\:break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      ` }} />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Download, ArrowLeft, Save, Loader2, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';
import { exportCoreTestingReport } from '../../utils/pdfExport';
import axios from 'axios';
import { PrintableCoreReport } from '../reports/PrintableCoreReport';

interface Order {
  _id: string;
  jobId: string;
  client: string;
  transformerType: string;
  coresRequired: number;
  assignedDate: string;
  status: string;
  priority: string;
  assignedUnitIds?: string[];
  coreDetails?: any[];
}

interface CoreTestData {
  date: string;
  vendorCoreNo: string;
  internalCoreNo: string;
  bsat1: string;
  bsat2: string;
  bsat3: string;
  bsat4: string;
  remark: string;
}

interface CoreTestingReportProps {
  order: Order;
  onBack: () => void;
}

export function CoreTestingReport({ order, onBack }: CoreTestingReportProps) {
  const [toroidalType] = useState('M4CRGO');
  const [turnsUsed] = useState('10');
  const [coreSize1] = useState('115');
  const [coreSize2] = useState('145');
  const [coreSize3] = useState('35');
  const [tataRef] = useState('TR-2024-001');
  const [leLimitSpec] = useState('1696');

  // Multi-point specifications
  const [bsatSpecs] = useState(['1000', '3000', '5000', '7000']);
  const [setMvSpecs] = useState(['93.19', '277.64', '465.96', '652.34']);

  const [coreTests, setCoreTests] = useState<CoreTestData[]>([]);
  const [isApproving, setIsApproving] = useState(false);

  // Auto-generate rows based on Assignments
  useEffect(() => {
    const today = new Date().toLocaleDateString('en-GB');

    // Determine the units to test:
    // If assignedUnitIds is present, use those.
    // Otherwise, fallback to coresRequired (Legacy behavior, or if explicit assignments missing)
    let unitsToTest: string[] = [];

    if (order.assignedUnitIds && order.assignedUnitIds.length > 0) {
      unitsToTest = order.assignedUnitIds;
    } else {
      // Fallback or Full Order view
      unitsToTest = Array.from({ length: order.coresRequired }, (_, i) => `M-${2082 + i}`);
    }

    // Find vendor_no for Metering cores (as this report uses 'M-' prefix)
    const meteringDetail = order.coreDetails?.find((d: any) => d.coreType === 'Metering');
    const defaultVendorNo = meteringDetail?.vendorNo || '';

    const initialTests: CoreTestData[] = unitsToTest.map(unitId => ({
      date: today,
      vendorCoreNo: defaultVendorNo,
      internalCoreNo: unitId,
      bsat1: '',
      bsat2: '',
      bsat3: '',
      bsat4: '',
      remark: '',
    }));
    setCoreTests(initialTests);
  }, [order.coresRequired, order.assignedUnitIds]);

  // Recalculate Pass/Fail when BSAT specs change
  useEffect(() => {
    if (bsatSpecs.every(s => !s) || coreTests.length === 0) return;

    const updatedTests = coreTests.map(test => {
      const bsatValues = [
        parseFloat(test.bsat1),
        parseFloat(test.bsat2),
        parseFloat(test.bsat3),
        parseFloat(test.bsat4),
      ];

      const allValid = bsatValues.every(v => !isNaN(v));
      if (allValid) {
        const specs = bsatSpecs.map(s => parseFloat(s));
        const allPass = bsatValues.every((v, i) => specs[i] !== undefined && v <= specs[i]);
        return { ...test, remark: allPass ? 'P' : 'F' };
      }
      return test;
    });

    setCoreTests(updatedTests);
  }, [bsatSpecs]);

  const handleSave = () => {
    toast.success('Core testing data saved successfully');
  };

  const handleDownload = () => {
    const reportData = {
      jobId: order.jobId,
      client: order.client,
      transformerType: order.transformerType,
      toroidalType,
      turnsUsed,
      coreSize1,
      coreSize2,
      coreSize3,
      tataRef,
      bsatSpecs,
      setMvSpecs,
      leLimitSpec,
      coreTests,
    };

    exportCoreTestingReport(reportData);
    toast.success('Core testing report downloaded successfully');
  };

  const handleApprove = async () => {
    if (!order._id) {
      toast.error("Order ID needed for approval.");
      return;
    }

    try {
      setIsApproving(true);
      // Call the Granular Batch Approval Endpoint
      const response = await axios.put(
        `http://localhost:5001/api/core-tests/approve/${order._id}`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success(response.data.message || 'Batch approved & forwarded successfully!');
        // Optional: Redirect back or refresh
        setTimeout(() => {
          onBack(); // Go back to list as this order/batch is done
        }, 1000);
      }
    } catch (error: any) {
      console.error("Approval Error:", error);
      toast.error(error.response?.data?.message || "Failed to approve batch.");
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="space-y-6">
      <style>{`
        #print-section {
          background: white;
          padding: 5mm 10mm;
          min-height: 297mm;
          width: 100%;
          box-sizing: border-box;
          color: black;
          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }
        
        .report-header-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border: 1.5px solid #000;
          margin-bottom: 0;
        }
        
        .header-left {
          padding: 10px;
          border-right: 1.5px solid #000;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .header-right {
          display: grid;
          grid-template-rows: repeat(5, 1fr);
        }
        
        .header-field {
          display: grid;
          grid-template-columns: 100px 1fr;
          border-bottom: 1px solid #000;
          font-size: 11px;
        }
        
        .header-field:last-child {
          border-bottom: none;
        }
        
        .field-label {
          padding: 4px 8px;
          border-right: 1px solid #000;
          text-align: right;
          font-weight: 600;
        }
        
        .field-value {
          padding: 4px 8px;
          font-weight: 500;
        }
        
        .report-title-banner {
          background-color: #ffffff !important; /* White */
          border-left: 1.5px solid #000;
          border-right: 1.5px solid #000;
          border-bottom: 2px solid #000; /* Thicker bottom border for title */
          text-align: center;
          padding: 6px;
          font-weight: bold;
          font-size: 18px;
          text-transform: uppercase;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .description-banner {
          background-color: #f8fafc !important; /* Minimalist Light Gray */
          border-left: 1.5px solid #000;
          border-right: 1.5px solid #000;
          border-bottom: 1px solid #000;
          text-align: center;
          padding: 4px;
          font-weight: bold;
          font-size: 14px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .nested-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.5px solid #000;
          table-layout: fixed;
        }
        
        .nested-table td, .nested-table th {
          border: 1px solid #000;
          padding: 4px;
          text-align: center;
          font-size: 11px;
          height: 24px;
        }
        
        .bg-yellow { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .bg-blue { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .bg-green { background-color: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .bg-cyan { background-color: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.5px solid #000;
          margin-top: 10px;
        }
        
        .data-table th, .data-table td {
          border: 1px solid #000;
          padding: 4px;
          text-align: center;
          font-size: 12px;
        }
        
        .data-table th {
          font-weight: bold;
          background-color: #f2f2f2;
        }

        .footer-sig {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
          padding: 0 40px;
        }
        
        .sig-item {
          text-align: center;
          width: 200px;
        }
        
        .sig-line {
          border-top: 1.5px solid #000;
          margin-top: 60px;
          padding-top: 5px;
          font-weight: bold;
          font-size: 13px;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body * {
            visibility: hidden;
          }
          #print-section, #print-section * {
            visibility: visible;
          }
          #print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 190mm;
          }
          input, select {
            border: none !important;
            background: transparent !important;
            outline: none !important;
            font-weight: 500 !important;
            text-align: center !important;
            width: 100% !important;
            color: black !important;
          }
        }
      `}</style>

      {/* Header (Screen Only) */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
          <div>
            <h2 className="text-xl font-bold">Core Testing - {order.jobId}</h2>
            <p className="text-gray-500">{order.client}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} variant="outline">
            <Save className="w-4 h-4 mr-2" /> Save
          </Button>
          <Button onClick={() => window.print()} variant="outline" className="bg-slate-800 text-white hover:bg-slate-900 border-none">
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
          <Button onClick={handleDownload} className="bg-red-600 hover:bg-red-700">
            <Download className="w-4 h-4 mr-2" /> Download Report
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden shadow-xl border-none">

        {/* We use the extracted component here! */}
        <PrintableCoreReport
          order={order}
          coreData={{
            coreName: toroidalType,
            coreType: toroidalType,
            testSetup: {
              coreMaterial: toroidalType,
              turnsUsed: turnsUsed,
              coreSizeMm: { id: coreSize1, od: coreSize2, height: coreSize3 },
              mmp: 42.39,
              areaSqCm: 41.225
            },
            testLimits: {
              bsatGauss: bsatSpecs,
              setMilliVolt: setMvSpecs,
              leLimitMa: [leLimitSpec]
            },
            testSpecification: {
              fluxTesla: 1.5,
              voltageV: 7.04,
              iexLimitMa: leLimitSpec
            },
            testedBy: "Current Tester",
            tableData: coreTests
          }}
        />

        {/* Download Button at Bottom (Screen Only) */}
        <div className="flex justify-end p-6 no-print">
          <Button onClick={handleDownload} size="sm" className="bg-red-600 hover:bg-red-700">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Approve Section (Screen Only) */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 no-print">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-green-900 font-bold mb-1">Approve & Forward to Next Stage</h3>
            <p className="text-sm text-gray-700">
              Click approve to complete testing and send notification to Secondary Testing team.
            </p>
          </div>
          <Button
            onClick={handleApprove}
            disabled={isApproving}
            className="bg-green-600 hover:bg-green-700 gap-2"
            size="lg"
          >
            {isApproving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            {isApproving ? 'Approving...' : 'Approve & Forward'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

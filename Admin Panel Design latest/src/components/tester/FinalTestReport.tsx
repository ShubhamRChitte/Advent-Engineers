import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { ArrowLeft, Save, Download, Printer } from 'lucide-react';
import { FinalTransformer } from './FinalTransformersList';
import { exportFinalTestReport } from '../../utils/pdfExport';
import { toast } from 'sonner';

interface FinalTestReportProps {
  transformer: FinalTransformer;
  testerName: string;
  onBack: () => void;
}

export function FinalTestReport({
  transformer,
  testerName,
  onBack,
}: FinalTestReportProps) {
  const testDate = new Date().toLocaleDateString();

  // Polarity Testing
  const [polarityResult, setPolarityResult] = useState('');

  // Meggar Test
  const [meggarPrimaryToSecondary, setMeggarPrimaryToSecondary] = useState('');
  const [meggarPrimaryToEarth, setMeggarPrimaryToEarth] = useState('');
  const [meggarSecondaryToEarth, setMeggarSecondaryToEarth] = useState('');
  const [meggarCoreToCore, setMeggarCoreToCore] = useState('');

  // H.V. Test on Secondary Winding
  const [hvSecondaryWinding, setHvSecondaryWinding] = useState('');

  // H.V. Test on Primary Winding
  const [hvPrimaryWinding, setHvPrimaryWinding] = useState('');

  // H.V. Test between Core
  const [hvBetweenCore, setHvBetweenCore] = useState('');

  // O.V.I.T. Test
  const [ovitTest, setOvitTest] = useState('');

  // Accuracy Test
  const [accuracyTest, setAccuracyTest] = useState('');
  const [turnRatioError, setTurnRatioError] = useState('');

  const handleSave = () => {
    alert('Final Test Report saved successfully!');
  };

  const handleGenerate = () => {
    const reportData = {
      transformerId: transformer.uniqueId,
      transformerName: transformer.name,
      rating: transformer.rating,
      voltageClass: transformer.voltageClass,
      testerName,
      polarityResult,
      meggarPrimaryToSecondary,
      meggarPrimaryToEarth,
      meggarSecondaryToEarth,
      meggarCoreToCore,
      hvSecondaryWinding,
      hvPrimaryWinding,
      hvBetweenCore,
      ovitTest,
      accuracyTest,
      turnRatioError,
    };

    exportFinalTestReport(reportData);
    toast.success('Final test report downloaded successfully!');
  };

  const handlePrint = () => {
    window.print();
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
          border-bottom: 2px solid #000;
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
          input, select, textarea {
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Print
          </Button>
        </div>
      </div>

      <div>
        <h2>Final Testing Report</h2>
        <p className="text-gray-500 mt-1">Transformer: {transformer.uniqueId}</p>
      </div>

      {/* Main Report Card */}
      <div id="print-section">
        {/* Header Grid */}
        <div className="report-header-grid">
          <div className="header-left">
            <h1 className="text-2xl font-bold italic text-red-600 leading-tight">ADVENT ENGINEERS</h1>
          </div>
          <div className="header-right">
            <div className="header-field">
              <span className="field-label">Date :</span>
              <span className="field-value">{testDate}</span>
            </div>
            <div className="header-field">
              <span className="field-label">Order No :</span>
              <span className="field-value">{transformer.uniqueId}</span>
            </div>
            <div className="header-field">
              <span className="field-label">Client :</span>
              <span className="field-value">N/A</span>
            </div>
            <div className="header-field">
              <span className="field-label">Unit No :</span>
              <span className="field-value">{transformer.uniqueId}</span>
            </div>
          </div>
        </div>

        {/* Banners */}
        <div className="report-title-banner">
          FINAL TESTING RECORD OF CURRENT TRANSFORMER
        </div>
        <div className="description-banner">
          Transformer Verification
        </div>

        <div className="mt-4">


          {/* Test Sections */}
          <div className="space-y-4">
            {/* 2. Polarity Testing */}
            <div className="border border-gray-300">
              <div className="description-banner text-left px-4">
                <h4>2. Polarity Testing</h4>
              </div>
              <div className="p-3">
                <Input
                  className="h-10"
                  placeholder="Enter polarity test result"
                  value={polarityResult}
                  onChange={(e) => setPolarityResult(e.target.value)}
                />
              </div>
            </div>

            {/* 3. Meggar Test */}
            <div className="border border-gray-300">
              <div className="description-banner text-left px-4">
                <h4>3. Meggar Test</h4>
              </div>
              <div className="p-3">
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-2 text-sm w-1/3">a) Primary to Secondary</td>
                      <td className="py-2">
                        <Input
                          className="h-9"
                          placeholder="Enter value"
                          value={meggarPrimaryToSecondary}
                          onChange={(e) => setMeggarPrimaryToSecondary(e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-2 text-sm">b) Primary to Earth</td>
                      <td className="py-2">
                        <Input
                          className="h-9"
                          placeholder="Enter value"
                          value={meggarPrimaryToEarth}
                          onChange={(e) => setMeggarPrimaryToEarth(e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-2 text-sm">c) Secondary to Earth</td>
                      <td className="py-2">
                        <Input
                          className="h-9"
                          placeholder="Enter value"
                          value={meggarSecondaryToEarth}
                          onChange={(e) => setMeggarSecondaryToEarth(e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 text-sm">d) Core to Core</td>
                      <td className="py-2">
                        <Input
                          className="h-9"
                          placeholder="Enter value"
                          value={meggarCoreToCore}
                          onChange={(e) => setMeggarCoreToCore(e.target.value)}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. H.V. Test on Secondary Winding */}
            <div className="border border-gray-300">
              <div className="bg-gray-100 border-b border-gray-300 p-3">
                <h4>4. H.V. Test on Secondary Winding</h4>
              </div>
              <div className="p-3">
                <Input
                  className="h-10"
                  placeholder="Enter H.V. test result"
                  value={hvSecondaryWinding}
                  onChange={(e) => setHvSecondaryWinding(e.target.value)}
                />
              </div>
            </div>

            {/* 5. H.V. Test on Primary Winding */}
            <div className="border border-gray-300">
              <div className="bg-gray-100 border-b border-gray-300 p-3">
                <h4>5. H.V. Test on Primary Winding</h4>
              </div>
              <div className="p-3">
                <Input
                  className="h-10"
                  placeholder="Enter H.V. test result"
                  value={hvPrimaryWinding}
                  onChange={(e) => setHvPrimaryWinding(e.target.value)}
                />
              </div>
            </div>

            {/* 6. H.V. Test between Core */}
            <div className="border border-gray-300">
              <div className="bg-gray-100 border-b border-gray-300 p-3">
                <h4>6. H.V. Test between Core</h4>
              </div>
              <div className="p-3">
                <Input
                  className="h-10"
                  placeholder="Enter H.V. test result"
                  value={hvBetweenCore}
                  onChange={(e) => setHvBetweenCore(e.target.value)}
                />
              </div>
            </div>

            {/* 7. O.V.I.T. Test */}
            <div className="border border-gray-300">
              <div className="bg-gray-100 border-b border-gray-300 p-3">
                <h4>7. O.V.I.T. Test</h4>
              </div>
              <div className="p-3">
                <Textarea
                  className="min-h-20"
                  placeholder="Enter O.V.I.T. test results"
                  value={ovitTest}
                  onChange={(e) => setOvitTest(e.target.value)}
                />
              </div>
            </div>

            {/* 8. Accuracy Test */}
            <div className="border border-gray-300">
              <div className="bg-yellow-300 border-b border-gray-300 p-3">
                <h4>8. Accuracy Test</h4>
              </div>
              <div className="p-3">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm mb-1 block">Turn Ratio Error</label>
                    <Input
                      className="h-10"
                      placeholder="Enter turn ratio error"
                      value={turnRatioError}
                      onChange={(e) => setTurnRatioError(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm mb-1 block">Additional Accuracy Test Results</label>
                    <Textarea
                      className="min-h-24"
                      placeholder="Enter accuracy test results and observations"
                      value={accuracyTest}
                      onChange={(e) => setAccuracyTest(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Signatures */}
        <div className="footer-sig">
          <div className="sig-item">
            <div className="sig-line">Tested by</div>
            <div className="text-xs mt-1 font-bold">{testerName}</div>
          </div>
          <div className="sig-item">
            <div className="sig-line">Authorised Signatory</div>
            <div className="text-[10px] mt-1 italic italic-bold text-gray-500">Stamp & Signature</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleSave} variant="outline" size="sm" className="gap-2">
          <Save className="w-4 h-4" />
          Save
        </Button>
        <Button onClick={handleGenerate} className="bg-red-600 hover:bg-red-700 gap-2">
          <Download className="w-4 h-4" />
          Generate & Upload
        </Button>
      </div>
    </div>
  );
}

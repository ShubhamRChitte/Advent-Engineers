import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '../ui/button';
import { Printer } from 'lucide-react';
import { 
  ReportHeader, 
  ReportSectionTitle, 
  ReportSignatures, 
  formatReportDate,
  secondaryReportPrintStyles,
  ReportSpecBox
} from './SecondaryReportPrintLayout';

interface FinalQAReportProps {
  transformer: any;
  testerName: string;
  mode?: 'standalone' | 'embedded';
}

export function FinalQAReport({ transformer, testerName, mode = 'standalone' }: FinalQAReportProps) {
  const finalTest = transformer.testHistory?.final_test || {};

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const order = transformer.fullOrder || transformer.orderId;

  const polarityResult = finalTest.polarityResult || '';
  const meggarPrimaryToSecondary = finalTest.meggarPrimaryToSecondary || '';
  const meggarPrimaryToEarth = finalTest.meggarPrimaryToEarth || '';
  const meggarSecondaryToEarth = finalTest.meggarSecondaryToEarth || '';
  const meggarCoreToCore = finalTest.meggarCoreToCore || '';
  const hvSecondaryWinding = finalTest.hvSecondaryWinding || '';
  const hvPrimaryWinding = finalTest.hvPrimaryWinding || '';
  const hvBetweenCore = finalTest.hvBetweenCore || '';
  const ovitTest = finalTest.ovitTest || '';

  const parseMeggar = (val: string) => {
    if (!val) return null;
    if (val.toLowerCase().includes('ok') || val.includes('>')) return 999999;
    const parsed = parseFloat(val.replace(/[^0-9.]/g, ''));
    return isNaN(parsed) ? null : parsed;
  };

  const m1 = parseMeggar(meggarPrimaryToSecondary);
  const m2 = parseMeggar(meggarPrimaryToEarth);
  const m3 = parseMeggar(meggarSecondaryToEarth);
  const m4 = parseMeggar(meggarCoreToCore);

  const isM1Fail = m1 !== null && m1 < 1000;
  const isM2Fail = m2 !== null && m2 < 1000;
  const isM3Fail = m3 !== null && m3 < 500;
  const isM4Fail = m4 !== null && m4 < 200;

  const renderStatus = (val: string, isFail?: boolean) => {
    if (val === 'Fail' || isFail) return 'FAIL';
    if (val === 'Pass' || (val && !isFail)) return 'PASS';
    return 'Not recorded';
  };

  const renderValWithUnit = (val: string, unit: string) => {
    if (!val || val.trim() === '') return 'Not recorded';
    return `${val} ${unit}`;
  };

  const accuracyClass = (transformer.cores && transformer.cores.map((c: any) => c.accuracyClass).filter(Boolean).join('/')) || 'N/A';

  const displayBurden = (() => {
    let rawBurden = order?.burden;
    if (Array.isArray(rawBurden)) {
      rawBurden = rawBurden.join('/');
    }
    const val = rawBurden || transformer.burden;
    if (!val) return 'N/A';
    return String(val).replace(/VA/i, '').trim() + ' VA';
  })();

  const displaySTC = order?.stc || order?.STC || transformer.stc || 'N/A';

  const generalRatio = (() => {
    const orderObj = transformer.fullOrder || transformer.orderId;
    if (orderObj?.ratio) {
      if (Array.isArray(orderObj.ratio)) {
        return orderObj.ratio.join(' - ');
      }
      return String(orderObj.ratio);
    }
    if (transformer.rating) {
      return `${transformer.rating}/${transformer.ratedSecondaryCurrent || '1'} A`;
    }
    return 'N/A';
  })();

  const qaTableContent = (
    <div className="mt-6">
      <ReportSectionTitle title="FINAL QA & COMPREHENSIVE TEST RESULTS" />
      <table className="w-full border-collapse border border-[#0f4f83] mt-2 final-qa-table">
        <thead>
          <tr>
            <th style={{ width: '10%', textAlign: 'center' }}>Sr. No.</th>
            <th style={{ width: '55%', textAlign: 'left' }}>Name of Test</th>
            <th style={{ width: '35%', textAlign: 'center' }}>Observed Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>1</td>
            <td style={{ fontWeight: 'semibold' }}>Polarity Testing</td>
            <td style={{ textAlign: 'center' }}>{polarityResult || 'Not recorded'}</td>
          </tr>
          <tr>
            <td style={{ textAlign: 'center', fontWeight: 'bold' }} rowSpan={4}>2</td>
            <td style={{ fontWeight: 'semibold' }} colSpan={2}>Meggar Test (Insulation Resistance):</td>
          </tr>
          <tr>
            <td style={{ paddingLeft: '24px' }}>a) Primary to Secondary (at 1000V DC)</td>
            <td style={{ textAlign: 'center' }}>{renderValWithUnit(meggarPrimaryToSecondary, 'M\u03A9')}</td>
          </tr>
          <tr>
            <td style={{ paddingLeft: '24px' }}>b) Primary to Earth (at 1000V DC)</td>
            <td style={{ textAlign: 'center' }}>{renderValWithUnit(meggarPrimaryToEarth, 'M\u03A9')}</td>
          </tr>
          <tr>
            <td style={{ paddingLeft: '24px' }}>c) Secondary to Earth (at 500V DC)</td>
            <td style={{ textAlign: 'center' }}>{renderValWithUnit(meggarSecondaryToEarth, 'M\u03A9')}</td>
          </tr>
          <tr>
            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>3</td>
            <td style={{ paddingLeft: '24px' }}>d) Meggar Test: Core to Core (at 500V DC)</td>
            <td style={{ textAlign: 'center' }}>{renderValWithUnit(meggarCoreToCore, 'M\u03A9')}</td>
          </tr>
          <tr>
            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>4</td>
            <td style={{ fontWeight: 'semibold' }}>H.V. Test on Secondary Winding (2KV for 1 min)</td>
            <td style={{ textAlign: 'center' }}>{hvSecondaryWinding || 'Not recorded'}</td>
          </tr>
          <tr>
            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>5</td>
            <td style={{ fontWeight: 'semibold' }}>H.V. Test on Primary Winding</td>
            <td style={{ textAlign: 'center' }}>{hvPrimaryWinding || 'Not recorded'}</td>
          </tr>
          <tr>
            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>6</td>
            <td style={{ fontWeight: 'semibold' }}>H.V. Test between Core (3KV for 1 min)</td>
            <td style={{ textAlign: 'center' }}>{hvBetweenCore || 'Not recorded'}</td>
          </tr>
          <tr>
            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>7</td>
            <td style={{ fontWeight: 'semibold' }}>O.V.I.T. Test (Double Voltage Double Frequency for 1 min)</td>
            <td style={{ textAlign: 'center' }}>{ovitTest || 'Not recorded'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  if (mode === 'embedded') {
    return (
      <>
        <style>{`
          .final-qa-table th, .final-qa-table td {
            border: 1px solid #0f4f83 !important;
            padding: 6px 8px !important;
            font-size: 11px !important;
          }
          .final-qa-table th {
            background-color: #f1f5f9 !important;
            color: #0f4f83 !important;
            font-weight: bold !important;
          }
        `}</style>
        {qaTableContent}
      </>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-gray-50 py-4 flex justify-start md:justify-center no-print-scroll">
      <style>{secondaryReportPrintStyles}</style>
      <style>{`
        .final-qa-table th, .final-qa-table td {
          border: 1px solid #0f4f83 !important;
          padding: 6px 8px !important;
          font-size: 11px !important;
        }
        .final-qa-table th {
          background-color: #f1f5f9 !important;
          color: #0f4f83 !important;
          font-weight: bold !important;
        }
      `}</style>

      <div className="print-container w-[210mm] min-w-[210mm] print:w-full print:min-w-0 print:max-w-full secondary-print-page">
        {/* Print Controls (Screen only) */}
        <div className="flex items-center justify-between no-print mb-4 w-full px-2">
          <div></div>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Print
          </Button>
        </div>

        <div ref={printRef} id="secondary-printable-report" className="report-wrapper secondary-report-wrapper">
          <ReportHeader
            stage="final"
            date={formatReportDate(finalTest.reportDate)}
            orderNo={transformer.jobId || order?.jobId || transformer.uniqueId}
            client={transformer.clientName || order?.clientName || 'N/A'}
            unitNo={transformer.uniqueId}
          />

          <div className="ae-section-container">
            <ReportSectionTitle title="TESTING RECORD OF CURRENT TRANSFORMER" />
            <ReportSpecBox
              items={[
                { label: 'Specification', value: `${transformer.voltageRating || '33'} KV` },
                { label: 'CT Ratio', value: generalRatio },
                { label: 'Burden', value: displayBurden },
                { label: 'STC', value: displaySTC }
              ]}
            />
          </div>

          <div className="ae-section-container">
            {qaTableContent}
          </div>

          <ReportSignatures testerName={finalTest.tester || testerName} hideStampAndSignature={true} />
        </div>
      </div>
    </div>
  );
}

import { 
  ReportHeader, 
  ReportSectionTitle, 
  ReportSignatures, 
  formatReportDate,
  secondaryReportPrintStyles,
  ReportSpecBox
} from '../SecondaryReportPrintLayout';
import { SecondaryMeteringReport } from '../SecondaryMeteringReport';
import { SecondaryProtectionReport } from '../SecondaryProtectionReport';
import { SecondaryPSReport } from '../SecondaryPSReport';
import { FinalQAReport } from '../FinalQAReport';

interface UnifiedCTReportProps {
  transformer: any;
  order: any;
}

export function UnifiedCTReport({ transformer, order }: UnifiedCTReportProps) {
  const finalTest = transformer.testHistory?.final_test || {};

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

  const coreDetails = order?.coreDetails || [];
  const typeCounts: Record<string, number> = {};

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
    if (transformer.rating) {
      return `${transformer.rating}/${transformer.ratedSecondaryCurrent || '1'} A`;
    }
    if (Array.isArray(order?.ratio)) {
      return order.ratio.join(' / ');
    }
    return order?.ratio || 'N/A';
  })();

  return (
    <div className="w-full bg-white print:p-0 select-none">
      <style>{secondaryReportPrintStyles}</style>
      <style>{`
        .unified-report-wrapper {
          background: #fff;
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          box-sizing: border-box;
        }
        @media print {
          .unified-report-wrapper {
            width: 190mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .page-break-before {
            page-break-before: always !important;
            break-before: page !important;
          }
          .print-break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
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

      <div className="unified-report-wrapper p-8 print:p-0">
        {/* PAGE 1: Shared Header, Title, Final QA Results */}
        <div className="print:min-h-[285mm] flex flex-col justify-start">
          <ReportHeader
            stage="final"
            date={formatReportDate(finalTest.reportDate)}
            orderNo={transformer.jobId || order?.jobId || transformer.uniqueId}
            client={transformer.clientName || order?.clientName || 'N/A'}
            unitNo={transformer.uniqueId}
            accuracyClass={accuracyClass}
          />

          <div className="text-center font-bold text-base border-2 border-[#0f4f83] border-t-0 py-2.5 text-[#0f4f83] tracking-wide bg-slate-50 uppercase">
            TESTING RECORD OF CURRENT TRANSFORMER
          </div>

          <div className="mt-4">
            <ReportSpecBox
              items={[
                { label: 'Specification', value: `${transformer.voltageRating || '33'} KV` },
                { label: 'CT Ratio', value: generalRatio },
                { label: 'Burden', value: displayBurden },
                { label: 'Class', value: accuracyClass },
                { label: 'STC', value: displaySTC }
              ]}
            />
          </div>

          <FinalQAReport
            transformer={transformer}
            testerName={finalTest.tester || 'Unknown'}
            mode="embedded"
          />
        </div>

        {/* ORDER-DRIVEN CORE REPORTS */}
        {coreDetails.map((core: any, idx: number) => {
          const coreType = core.coreType;
          const lowercaseType = coreType.toLowerCase();
          if (typeCounts[lowercaseType] === undefined) {
            typeCounts[lowercaseType] = 0;
          } else {
            typeCounts[lowercaseType]++;
          }
          const typeIndex = typeCounts[lowercaseType];
          
          // Get coreId
          const results = finalTest[`${lowercaseType}_results`] || [];
          const resultForCore = results[typeIndex];
          const coreId = resultForCore?.internalCoreNo || resultForCore?.coreId || `Core-${idx + 1}`;

          const isFirstCore = idx === 0;

          return (
            <div key={idx} className={`${isFirstCore ? 'page-break-before' : 'print-break-inside-avoid'} flex flex-col justify-start`}>
              <div className="mt-6 flex-1">
                {coreType === 'Metering' && (
                  <SecondaryMeteringReport
                    transformer={transformer}
                    coreNumber={idx + 1}
                    coreId={coreId}
                    testerName={finalTest.tester || 'Unknown'}
                    onBack={() => {}}
                    readOnly={true}
                    stage="final"
                    order={order}
                    isUnified={true}
                  />
                )}
                {coreType === 'Protection' && (
                  <SecondaryProtectionReport
                    transformer={transformer}
                    coreNumber={idx + 1}
                    coreId={coreId}
                    testerName={finalTest.tester || 'Unknown'}
                    onBack={() => {}}
                    readOnly={true}
                    stage="final"
                    order={order}
                    isUnified={true}
                  />
                )}
                {coreType === 'PS' && (
                  <SecondaryPSReport
                    transformer={transformer}
                    coreNumber={idx + 1}
                    coreId={coreId}
                    testerName={finalTest.tester || 'Unknown'}
                    onBack={() => {}}
                    readOnly={true}
                    stage="final"
                    order={order}
                    isUnified={true}
                  />
                )}
              </div>
            </div>
          );
        })}

        {/* Unified Signatures block at the very end of the document */}
        <div className="mt-8 print-break-inside-avoid">
          <ReportSignatures 
            testerName={finalTest.tester || 'Unknown'} 
            blankSignatureFields={true} 
          />
        </div>
      </div>
    </div>
  );
}

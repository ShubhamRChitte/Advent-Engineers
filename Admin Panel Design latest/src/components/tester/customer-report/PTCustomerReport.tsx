import React from 'react';
import { Page1Overview } from './Page1Overview';
import { Page2TestDetails } from './Page2TestDetails';
import { Page3TestResults } from './Page3TestResults';
import { Page4FinalRemarks } from './Page4FinalRemarks';

export interface PTCustomerReportProps {
  order: any;
  transformer: any;
  reportData: any;
  pretestData: any;
  activeCores: string[];
  user: any;
}

/** Shared print CSS — identical pattern to PTFinalPrintReport */
const PRINT_STYLE = `
  @page { size: A4 portrait; margin: 0; }
  @media print {
    html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; }
    /* Force absolute positioning on print so sidebar/header margins don't offset the page */
    .pt-print-wrapper { position: relative !important; width: 100% !important; margin: 0 auto !important; }
    .cr-print-root { padding: 12mm 14mm !important; margin: 0 auto !important; box-shadow: none !important; border: none !important; border-radius: 0 !important; width: 100% !important; max-width: 100% !important; }
    .screen-only { display: none !important; }
    .no-print { display: none !important; }
    .cr-page { page-break-after: always; page-break-inside: avoid; display: flex; flex-direction: column; min-height: 275mm; }
    .cr-page:last-child { page-break-after: auto; }
  }
  .cr-page { display: flex; flex-direction: column; min-height: 275mm; }
  .cr-print-root { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #000; background: #fff; width: 210mm; margin: 0 auto; padding: 16px; box-sizing: border-box; }
  .cr-header-table,.cr-main-table { width:100%; border-collapse:collapse; table-layout:fixed; }
  .cr-main-table td,.cr-main-table th { border:1px solid #000; padding:4px 6px; vertical-align:middle; word-break:break-word; }
  .cr-header-table td { padding:4px 6px; vertical-align:middle; }
  .cr-logo-cell { border:none; text-align:center; }
  .cr-logo-box { font-weight:900; font-size:15px; color:#c0392b; border:2px solid #c0392b; display:inline-block; padding:4px 8px; letter-spacing:2px; }
  .cr-company-name { font-size:16px; font-weight:900; text-align:center; letter-spacing:1px; text-transform:uppercase; padding:4px 0; }
  .cr-company-address { font-size:11px; text-align:center; }
  .cr-report-title { font-size:13px; font-weight:bold; text-align:center; text-transform:uppercase; text-decoration:underline; }
  .cr-page-info-table { width:100%; border-collapse:collapse; table-layout:fixed; font-size:11px; margin-bottom:2px; }
  .cr-right { text-align:right; }
  .cr-label { font-weight:bold; font-size:11px; background:#f8f8f8; }
  .cr-value { font-size:11px; }
  .cr-th { font-weight:bold; text-align:center; background:#e8e8e8; font-size:11px; border:1px solid #000; padding:4px 6px; }
  .cr-td { border:1px solid #000; padding:4px 6px; font-size:11px; }
  .cr-center { text-align:center; }
  .cr-section-title { font-size:13px; font-weight:bold; text-decoration:underline; margin:8px 0 4px; }
  .cr-test-section { margin-bottom:10px; }
  .cr-test-heading { font-size:12px; text-decoration:underline; margin-bottom:2px; }
  .cr-test-subheading { font-size:11px; margin-bottom:2px; margin-left:4px; }
  .cr-test-para { font-size:11px; margin:2px 0 2px 4px; line-height:1.5; }
  .cr-remark { font-size:11px; font-weight:bold; margin-top:3px; margin-left:4px; }
  .cr-remarks-block,.cr-notes-block,.cr-caution-block { font-size:11px; margin:4px 0; line-height:1.5; }
  .cr-notes-block ol { margin:2px 0 0 0; padding-left:24px; list-style-type:decimal; }
  .cr-sig-table { width:100%; border-collapse:collapse; table-layout:fixed; margin-top:auto; padding-top:10px; }
  .cr-sig-cell { padding:4px 6px; vertical-align:bottom; font-size:11px; }
  .cr-sig-line { width:80%; min-height:28px; margin-bottom:3px; }
  .cr-sig-name { font-size:11px; font-weight:bold; }
  .cr-sig-title { font-size:10px; }
  .cr-qr-footer { text-align:right; font-size:10px; font-style:italic; border-top:1px solid #000; padding-top:2px; margin-top:4px; }
  .cr-end-report { text-align:center; font-weight:bold; font-size:12px; margin:8px 0; }
  .cr-page { width:100%; min-height:257mm; box-sizing:border-box; display:flex; flex-direction:column; padding-bottom:6px; }
`;

function getCoreLabel(core: string) {
  if (core === 'metering' || core === 'metering1') return 'Metering';
  if (core === 'metering2') return 'Metering 2';
  if (core === 'protection' || core === 'protection1') return 'Protection';
  if (core === 'protection2') return 'Protection 2';
  return core;
}

export function PTCustomerReport({ order, transformer, reportData, pretestData, activeCores, user }: PTCustomerReportProps) {
  const today = new Date().toLocaleDateString('en-GB').replace(/\//g, '.');
  const testDate = reportData?.date || today;
  const reportNo = order?.jobId
    ? `AEPL/TR/${order.jobId.replace('JOB-', '').replace('-', '/')}`
    : 'AEPL/TR/25-26/05';

  const preparedBy   = reportData?.testedBy || user?.name || user?.fullName || 'Kanchan Sirsat';
  const checkedBy    = 'M. Ali';
  const authorisedBy = 'M. Ali';

  const accuracyTest = reportData?.accuracyTest || {};

  const sharedSig = {
    preparedBy, preparedByTitle: 'Testing Engineer',
    checkedBy,  checkedByTitle:  'Technical Manager',
    authorisedBy, authorisedByTitle: 'Technical Manager',
  };

  const finalTesting = reportData?.finalTesting || {};

  // ── On-screen rows ──────────────────────────────────────────
  const finalRows = [
    { id: 1, label: 'Leakage Current (mA)',          val: finalTesting.leakageCurrent },
    { id: 2, label: 'Polarity Test',                  val: finalTesting.polarityTest },
    { id: 3, label: 'Insulation Resistance (MΩ)',      val: finalTesting.insulationResistance },
    { id: 4, label: 'HV Withstand (kV)',               val: finalTesting.hvWithstand },
    { id: 5, label: 'Burden (VA)',                     val: order?.burden },
    { id: 6, label: 'Accuracy Class',                  val: order?.accuracyClass },
  ];

  // ── Print-page shared props ──────────────────────────────────
  const page1Props = {
    reportNo, date: testDate,
    customerName:    order?.clientName    || 'Advent Engineers',
    customerAddress: 'A-12, Midc Malegaon, Sinnar, Nashik',
    customerRef:     order?.customerRef   || today,
    receiptDate:     order?.receiptDate   || today,
    testDate,
    tsrfNo:          `AEPL/TSRF/${reportNo.replace('AEPL/TR/', '')}`,
    sampleIdNo:      transformer?.uniqueId || 'AEPL/ID/25-26/05-01',
    productName:     'Potential Transformer',
    ratedVoltage:    order?.voltageRating ? `${order.voltageRating} KV` : '33 KV',
    vf:              '1.2 Cont. & 1.5 for 30 Sec.',
    yearOfMfg:       order?.yearOfMfg    || new Date().getFullYear().toString(),
    ptRatio:         order?.ratio?.[0]   || '33KV/√3/110V/√3',
    ptSpecification: `${order?.burden || '50'}VA, ${order?.accuracyClass || '0.2'}`,
    bll:             order?.bll          || '36KV/70KVrms/170KVp',
    srNo:            transformer?.uniqueId || 'AE-15561',
    make:            'Advent Engineers',
    testMethod:      'AS Per IS 16227-2016',
    detailsOfTest:   'As Per Sheet No-02',
    testedBy:        preparedBy,
    enclosure:       '',
    ambientTemp:     `${order?.ambientTemp || '22.4'}°C / ${order?.humidity || '32'}%`,
    conditionOfSample: 'Satisfactory',
    ...sharedSig,
  };

  return (
    <>
      {/* ── Print CSS ── */}
      <style>{PRINT_STYLE}</style>

      {/* ── Unified Layout: 4-Page Report rendered natively on screen and print ── */}
      <div 
        className="cr-print-root pt-print-wrapper bg-white rounded-lg shadow-sm border border-gray-300"
        style={{ 
          maxWidth: '210mm', 
          margin: '0 auto', 
          marginBottom: '3rem',
          boxSizing: 'border-box'
        }}
      >
        <Page1Overview {...page1Props} />
        <div className="cr-page-divider no-print" style={{ height: '16px', background: '#f9fafb', borderTop: '1px dashed #cbd5e1', borderBottom: '1px dashed #cbd5e1', margin: '20px -8px' }}></div>
        <Page2TestDetails reportNo={reportNo} date={testDate} {...sharedSig} />
        <div className="cr-page-divider no-print" style={{ height: '16px', background: '#f9fafb', borderTop: '1px dashed #cbd5e1', borderBottom: '1px dashed #cbd5e1', margin: '20px -8px' }}></div>
        <Page3TestResults
          reportNo={reportNo} date={testDate}
          ptRatio={order?.ratio?.[0] || '33KV/√3/110V/√3'}
          burden={`${order?.burden || '50'}VA`}
          accuracyClass={order?.accuracyClass || '0.2'}
          accuracyTest={accuracyTest}
          activeCores={activeCores}
          primaryTerminals="A-N"
          secondaryTerminals="a-n"
          terminalMarkingResult="Confirms"
          hvPrimaryResult="Confirms"
          {...sharedSig}
        />
        <div className="cr-page-divider no-print" style={{ height: '16px', background: '#f9fafb', borderTop: '1px dashed #cbd5e1', borderBottom: '1px dashed #cbd5e1', margin: '20px -8px' }}></div>
        <Page4FinalRemarks reportNo={reportNo} date={testDate} {...sharedSig} />
      </div>
    </>
  );
}

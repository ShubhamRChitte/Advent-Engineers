import React from 'react';
import { CTPage1Overview } from './CTPage1Overview';
import { CTPage2TestDetails } from './CTPage2TestDetails';
import { CTPage3Results } from './CTPage3Results';

export interface CTCustomerReportProps {
  order: any;
  transformer: any;
  reportData: any;
  user: any;
}

const PRINT_STYLE = `
  @page { size: A4 portrait; margin: 0; }
  @media print {
    html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; }
    body * { visibility: hidden !important; }
    .ct-print-wrapper { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; }
    .ct-print-root, .ct-print-root * { visibility: visible !important; }
    .ct-print-root { padding: 12mm 14mm !important; margin: 0 auto !important; box-shadow: none !important; border: none !important; border-radius: 0 !important; }
    .no-print { display: none !important; }
    .ct-page { page-break-after: always; page-break-inside: avoid; display: flex; flex-direction: column; min-height: 275mm; }
    .ct-page:last-child { page-break-after: auto; }
  }
  .ct-page { display: flex; flex-direction: column; min-height: 275mm; }
  .ct-print-root { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #000; background: #fff; width: 210mm; margin: 0 auto; padding: 16px; box-sizing: border-box; }
  .ct-header-table, .ct-main-table { width:100%; border-collapse:collapse; table-layout:fixed; }
  .ct-main-table td, .ct-main-table th { border:1px solid #000; padding:4px 6px; vertical-align:middle; word-break:break-word; }
  .ct-header-table td { padding:4px 6px; vertical-align:middle; }
  .ct-logo-cell { border:none; text-align:center; }
  .ct-company-name { font-size:16px; font-weight:900; text-align:center; letter-spacing:1px; text-transform:uppercase; padding:4px 0; }
  .ct-company-address { font-size:11px; text-align:center; }
  .ct-report-title { font-size:14px; font-weight:bold; text-align:center; text-transform:uppercase; margin: 10px 0; }
  .ct-page-info-table { width:100%; border-collapse:collapse; table-layout:fixed; font-size:11px; margin-bottom:2px; }
  .ct-right { text-align:right; }
  .ct-center { text-align:center; }
  .ct-label { font-weight:bold; font-size:11px; background:#f8f8f8; border: 1px solid #000; }
  .ct-value { font-size:11px; border: 1px solid #000; padding: 4px; }
  .ct-th { font-weight:bold; text-align:center; background:#e8e8e8; font-size:11px; border:1px solid #000; padding:4px 6px; }
  .ct-td { border:1px solid #000; padding:4px 6px; font-size:11px; }
  .ct-test-section { margin-bottom:15px; }
  .ct-test-heading { font-size:12px; margin-bottom:4px; }
  .ct-test-subheading { font-size:11px; margin-bottom:4px; }
  .ct-test-para { font-size:11px; margin:4px 0; line-height:1.4; }
  .ct-remark { font-size:11px; font-weight:bold; margin-top:5px; }
  .ct-notes-block { font-size:10.5px; margin:10px 0; line-height:1.4; }
  .ct-notes-block ol { margin:5px 0; padding-left:20px; }
  .ct-sig-table { width:100%; border-collapse:collapse; table-layout:fixed; margin-top:auto; }
  .ct-sig-cell { padding:10px 5px; vertical-align:bottom; font-size:11px; text-align: center; }
  .ct-sig-line { width:80%; margin: 0 auto 5px; border-bottom: 1px solid #000; height: 30px; }
  .ct-qr-footer { text-align:right; font-size:10px; font-weight: bold; margin-top:10px; }
`;

export function CTCustomerReport({ order, transformer, reportData, user }: CTCustomerReportProps) {
  const today = new Date().toLocaleDateString('en-GB').replace(/\//g, '.');
  const testDate = reportData?.date || today;
  const reportNo = order?.jobId
    ? `AEPL/TR/${order.jobId.replace('JOB-', '').replace('-', '/')}`
    : 'AEPL/TR/25-26/02';

  const preparedBy = reportData?.testedBy || user?.name || 'Kanchan Sirsat';
  const checkedBy = 'M. Ali';
  const authorisedBy = 'M. Ali';

  const sharedSig = {
    preparedBy, preparedByTitle: 'Testing Engineer',
    checkedBy, checkedByTitle: 'Technical Manager',
    authorisedBy, authorisedByTitle: 'Technical Manager',
  };

  const page1Props = {
    reportNo,
    date: testDate,
    customerName: order?.clientName || 'Advent Engineers',
    customerAddress: 'A-12, Midc Malegaon, Sinnar, Nashik',
    customerRef: order?.customerRef || today,
    receiptDate: order?.receiptDate || today,
    tsrfNo: `AEPL/TSRF/${reportNo.split('/').slice(-2).join('/')}`,
    sampleIdNo: transformer?.uniqueId || 'AEPL/ID/25-26/02-01',
    productName: 'Current Transformer',
    ratedVoltage: order?.voltageRating ? `${order.voltageRating} KV` : '33 KV',
    stc: order?.stc || '26.2KA for 1 sec',
    ctRatio: order?.ratio?.[0] || '200/1A',
    ctSpecification: `${order?.burden || '15'}VA, ${order?.accuracyClass || '0.2S'}`,
    bil: order?.bil || '36KV/70KVrms/170KVp',
    srNo: transformer?.uniqueId || 'AE-16736',
    make: 'Advent Engineers',
    drgNo: order?.drgNo || '-',
    ...sharedSig
  };

  return (
    <>
      <style>{PRINT_STYLE}</style>
      <div className="ct-print-root ct-print-wrapper bg-white rounded-lg shadow-sm border border-gray-200"
           style={{ maxWidth: '210mm', margin: '0 auto', marginBottom: '3rem' }}>
        <CTPage1Overview {...page1Props} />
        <div className="no-print" style={{ height: '20px', background: '#f8fafc', borderY: '1px dashed #e2e8f0', margin: '20px 0' }}></div>
        <CTPage2TestDetails reportNo={reportNo} date={testDate} {...sharedSig} />
        <div className="no-print" style={{ height: '20px', background: '#f8fafc', borderY: '1px dashed #e2e8f0', margin: '20px 0' }}></div>
        <CTPage3Results 
          reportNo={reportNo} 
          date={testDate}
          ctRatio={order?.ratio?.[0] || '200/1A'}
          burden={`${order?.burden || '15'}VA`}
          accuracyClass={order?.accuracyClass || '0.2S'}
          reportData={reportData}
          {...sharedSig} 
        />
      </div>
    </>
  );
}

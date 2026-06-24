
import logoImage from 'figma:asset/d4d1bc6f9b0c444f1821bbe84a4da57caf7080d2.png';
import { ImageWithFallback } from '../figma/ImageWithFallback';

type ReportStage = 'secondary' | 'primary' | 'final';

interface ReportHeaderProps {
  stage: ReportStage;
  date: string;
  orderNo: string;
  client: string;
  unitNo: string;
  accuracyClass?: string;
}

export const getStageBannerTitle = (stage: ReportStage) => {
  if (stage === 'primary') return 'AFTER PRIMARY CORE TEST REPORT';
  if (stage === 'final') return 'FINAL CORE TEST REPORT';
  return 'METERING & PROTECTION CORE TEST REPORT';
};

export const formatReportDate = (value?: string | Date) => {
  if (!value) return new Date().toLocaleDateString('en-GB');
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toLocaleDateString('en-GB') : parsed.toLocaleDateString('en-GB');
};

export function ReportHeader({
  stage,
  date,
  orderNo,
  client,
  unitNo,
  accuracyClass,
}: ReportHeaderProps) {
  return (
    <header className="ae-report-header secondary-report-header">
      <div className="ae-logo-panel">
        <ImageWithFallback src={logoImage} alt="Advent Logo" className="ae-logo-image" />
      </div>
      <div className="ae-title-panel">
        <h1>ADVENT ENGINEERS</h1>
        <div className="ae-document-title">CURRENT TRANSFORMER TEST REPORT</div>
        <div className="ae-tagline">Excellence in Transformer Core Testing</div>
      </div>
      <div className="ae-meta-panel">
        <div><strong>Date:</strong> {date}</div>
        <div><strong>Order No:</strong> {orderNo || '-'}</div>
        <div><strong>Client:</strong> {client || '-'}</div>
        <div><strong>Unit No:</strong> {unitNo || '-'}</div>
        <div><strong>Class:</strong> {accuracyClass || '-'}</div>
      </div>
      <div className="ae-banner">{getStageBannerTitle(stage)}</div>
    </header>
  );
}

export function ReportSectionTitle({
  title,
}: {
  index?: number | string;
  title: string;
  tone?: 'gray' | 'blue' | 'purple';
}) {
  return (
    <div className="ae-section-banner secondary-report-section">
      {title}
    </div>
  );
}

export function CoreInformationBar({
  label,
  value
}: {
  label: string;
  value: string | number;
}) {
  const formattedLabel = label.toLowerCase().endsWith('no.') || label.toLowerCase().endsWith('no')
    ? label.replace(/no\.?$/i, 'No.').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : label.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <div className="ae-core-info-bar">
      <span className="ae-core-info-badge">
        <span className="ae-core-info-label">{formattedLabel}: </span>
        <strong className="ae-core-info-value">{value}</strong>
      </span>
    </div>
  );
}

export interface SpecItem {
  label: string;
  value: string | number;
}

interface ReportSpecBoxProps {
  items: SpecItem[];
  columns?: 2 | 3;
}

export function ReportSpecBox({ items, columns = 2 }: ReportSpecBoxProps) {
  const activeItems = items.filter(
    item => item.value !== undefined && item.value !== null && String(item.value).trim() !== ''
  );

  return (
    <div className={`ae-spec-grid-container ae-cols-${columns} secondary-spec-grid`}>
      {activeItems.map((item, idx) => {
        let spanClass = '';
        if (columns === 2) {
          const isLastOdd = activeItems.length % 2 !== 0 && idx === activeItems.length - 1;
          if (isLastOdd) spanClass = 'ae-spec-grid-span-all';
        } else if (columns === 3) {
          const remainder = activeItems.length % 3;
          if (remainder === 1 && idx === activeItems.length - 1) {
            spanClass = 'ae-spec-grid-span-all';
          } else if (remainder === 2 && idx === activeItems.length - 1) {
            spanClass = 'ae-spec-grid-span-2';
          }
        }

        return (
          <div
            key={idx}
            className={`ae-spec-grid-item ${spanClass}`}
          >
            <span className="ae-spec-grid-label">{item.label}:</span>
            <span className="ae-spec-grid-value">{item.value}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ReportSignatures({
  testerName,
  hideStampAndSignature = false,
  hideTesterName = false,
  blankSignatureFields = false,
}: {
  testerName: string;
  hideStampAndSignature?: boolean;
  hideTesterName?: boolean;
  blankSignatureFields?: boolean;
}) {
  const shouldHideTester = hideTesterName || blankSignatureFields;
  const shouldHideStamp = hideStampAndSignature || blankSignatureFields;

  return (
    <div className="report-signatures ae-footer-sig secondary-signatures">
      <div className="signature-column ae-sig-block">
        <div className="signature-space ae-sig-name">
          {shouldHideTester ? '\u00A0' : (testerName || 'Tester')}
        </div>
        <div className="signature-line" />
        <div className="signature-label">Tested By</div>
      </div>

      <div className="signature-column ae-sig-block">
        <div className="signature-space ae-sig-name italic text-gray-500 font-normal">
          {shouldHideStamp ? '\u00A0' : 'Stamp & Signature'}
        </div>
        <div className="signature-line" />
        <div className="signature-label">Authorised Signatory</div>
      </div>
    </div>
  );
}

export const secondaryReportPrintStyles = `
  @media screen {
    .no-print-scroll {
      width: 100%;
      overflow-x: auto;
      background: #f9fafb;
      padding: 16px 0;
      display: flex;
      justify-content: flex-start;
    }
    @media (min-width: 830px) {
      .no-print-scroll {
        justify-content: center;
      }
    }
  }

  .report-wrapper {
    background: #fff;
    width: 210mm;
    min-height: auto;
    padding: 10mm 10mm;
    margin: 0 auto;
    color: #1F2937;
    font-family: 'Arial', 'Helvetica', sans-serif;
    box-sizing: border-box;
  }

  @media screen {
    .report-wrapper {
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
      border-radius: 4px;
      margin-bottom: 20px;
    }
  }

  /* Phase 2: Header Reconstruction */
  .ae-report-header {
    display: grid;
    grid-template-columns: 32mm 1fr 64mm;
    border: 1px solid #D5DCE5;
    margin-bottom: 20px;
    min-height: 18mm;
  }

  .ae-logo-panel {
    min-height: 18mm;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    padding: 1.5mm;
  }

  .ae-logo-panel::after {
    content: "";
    position: absolute;
    right: 0;
    top: 15%;
    height: 70%;
    width: 1px;
    background-color: #D5DCE5;
  }

  .ae-logo-image {
    width: auto;
    height: 27mm;
    max-width: 90%;
    object-fit: contain;
  }

  .ae-title-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2mm;
  }

  .ae-title-panel h1 {
    margin: 0;
    color: #0F4C81;
    font-size: 24px;
    line-height: 1.1;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  .ae-document-title {
    margin-top: 3px;
    color: #1F2937;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.2px;
    text-transform: uppercase;
  }

  .ae-tagline {
    margin-top: 2px;
    font-size: 11px;
    color: #4B5563;
    font-weight: 400;
  }

  .ae-meta-panel {
    border-left: 1px solid #D5DCE5;
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: left;
    gap: 2px;
    padding: 1.5mm 4mm;
    font-size: 10px;
    line-height: 1.25;
    color: #1F2937;
    word-break: break-all;
  }

  .ae-meta-panel strong {
    font-weight: 700;
    margin-right: 4px;
  }

  .ae-banner {
    grid-column: 1 / -1;
    background: #0F4C81;
    color: #fff;
    border-top: 1px solid #D5DCE5;
    text-align: center;
    font-size: 13px;
    font-weight: 700;
    line-height: 7mm;
    text-transform: uppercase;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Phase 3 & 4: Section Architecture & Banner System */
  .ae-section-container {
    margin-bottom: 20px;
  }

  .ae-section-banner {
    background: #DCEAF8;
    border-top: 1px solid #0F4C81;
    border-bottom: 1px solid #0F4C81;
    color: #1F2937;
    font-size: 16px;
    font-weight: 700;
    padding: 6px 12px;
    margin-bottom: 8px; /* Banner -> Core Info Bar = 8px */
    text-transform: uppercase;
    text-align: center;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Phase 5: Core Information Bar */
  .ae-core-info-bar {
    background: #F7F8FA;
    border: 1px solid #D5DCE5;
    border-bottom: none; /* Merges with table below */
    padding: 6px 12px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .ae-core-info-badge {
    background: #EBF3FC;
    border: 1px solid #B9D5F3;
    border-radius: 4px;
    padding: 2px 8px;
    font-size: 11px;
    display: inline-flex;
    align-items: center;
  }

  .ae-core-info-label {
    color: #4B5563;
    font-weight: 500;
  }

  .ae-core-info-value {
    color: #0F4C81;
    margin-left: 4px;
  }

  /* Phase 6 & 7: Table Design System */
  .ae-report-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    border: 1px solid #D5DCE5;
  }

  .ae-report-table th,
  .ae-report-table td {
    border: 1px solid #D5DCE5;
    padding: 5px 6px; /* Better horizontal padding, reduced vertical for density */
    text-align: center;
    vertical-align: middle;
    line-height: 1.2;
  }

  .ae-report-table th {
    background: #DCEAF8;
    color: #1F2937;
    font-weight: 600;
    font-size: 14px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .ae-report-table td {
    color: #1F2937;
    font-size: 13px;
    font-weight: 400;
  }

  .ae-spec-table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #D5DCE5;
    margin-bottom: 20px;
    background: #ffffff;
  }

  .ae-spec-table td {
    border: 1px solid #D5DCE5;
    padding: 8px 14px;
    font-size: 13px;
    color: #1F2937;
    text-align: left;
    line-height: 1.4;
  }

  .ae-spec-table td span.font-bold {
    display: inline-block;
    width: 110px;
    color: #4B5563;
    font-weight: 600;
  }

  /* Spec Box Grid System */
  .ae-spec-grid-container {
    display: grid;
    gap: 1px;
    background-color: #D5DCE5;
    border: 1px solid #D5DCE5;
    margin-bottom: 20px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .ae-spec-grid-container.ae-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ae-spec-grid-container.ae-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .ae-spec-grid-item {
    background-color: #ffffff;
    padding: 8px 14px;
    font-size: 13px;
    display: flex;
    align-items: center;
    line-height: 1.4;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .ae-spec-grid-span-all {
    grid-column: 1 / -1;
  }

  .ae-spec-grid-span-2 {
    grid-column: span 2;
  }

  .ae-spec-grid-label {
    display: inline-block;
    width: 110px;
    color: #4B5563;
    font-weight: 600;
    flex-shrink: 0;
  }

  .ae-spec-grid-value {
    color: #1F2937;
    font-weight: 400;
    word-break: break-word;
  }

  /* Responsive Spec Grid styling */
  @media (max-width: 640px) {
    .ae-spec-grid-container.ae-cols-2,
    .ae-spec-grid-container.ae-cols-3 {
      grid-template-columns: 1fr;
    }
    .ae-spec-grid-span-2 {
      grid-column: 1 / -1;
    }
  }

  @media print {
    .ae-spec-grid-container.ae-cols-2 {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
    .ae-spec-grid-container.ae-cols-3 {
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    }
  }

  /* Phase 9: Metering Burden Bands */
  .ae-burden-band {
    background: #DDEED2 !important;
    font-weight: 600 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Alternate row shading */
  .ae-report-table tbody tr:nth-child(even) {
    background: #F7F8FA;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Inputs inside tables */
  .ae-report-table input,
  .input-field {
    width: 100%;
    height: 28px;
    padding: 2px 6px;
    border: 1.5px solid #CBD5E1;
    border-radius: 4px;
    outline: 0;
    background: #ffffff;
    color: #1F2937;
    font-size: 12px;
    font-weight: 500;
    text-align: center;
    transition: all 0.15s ease-in-out;
    box-sizing: border-box;
  }

  .ae-report-table input:focus,
  .input-field:focus {
    background: #ffffff;
    border-color: #3B82F6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
  }

  .ae-report-table input:disabled,
  .input-field:disabled {
    background: #F3F4F6;
    border-color: #E5E7EB;
    color: #9CA3AF;
  }

  /* Real-time Validation Color Feedback */
  .invalid-reading,
  .out-of-limit {
    color: #B91C1C !important;
    border-color: #EF4444 !important;
    background-color: #FFF1F2 !important;
    font-weight: 600 !important;
  }

  .invalid-reading:focus,
  .out-of-limit:focus {
    border-color: #DC2626 !important;
    box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.15) !important;
  }

  .ae-report-table td.input-cell {
    padding: 3px;
  }

  .ae-ratio-cell {
    font-weight: 500;
  }

  /* Class PS Table Styling */
  .ps-core-table {
    table-layout: fixed;
    width: 100%;
  }

  .ps-input {
    width: 100%;
    max-width: 120px;
    margin: 0 auto;
  }

  .vk-cell-fields {
    display: inline-grid;
    gap: 6px;
    justify-content: center;
    align-items: center;
  }

  .vk-cell-row {
    display: grid;
    grid-template-columns: max-content 90px;
    align-items: center;
    column-gap: 6px;
  }

  .vk-cell-label {
    font-weight: 600;
    color: #4B5563;
    white-space: nowrap;
    text-align: left;
    font-size: 11px;
  }

  .vk-input {
    width: 90px !important;
  }

  /* Phase 13: Footer Standardization */
  .ae-footer-sig {
    margin-top: 40px;
    display: flex;
    justify-content: space-between;
    padding: 0 40px;
    page-break-inside: avoid;
  }

  .ae-sig-block {
    text-align: center;
    width: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .ae-sig-name {
    font-size: 13px;
    font-weight: 600;
    min-height: 20px;
    margin-bottom: 4px;
  }

  .ae-sig-line {
    width: 100%;
    border-top: 1px solid #1F2937;
    padding-top: 6px;
    font-weight: 600;
    font-size: 13px;
  }

  @media print {
    html,
    body {
      background: #ffffff !important;
      width: 100% !important;
      min-height: auto;
      margin: 0 !important;
      padding: 0 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .secondary-print-page {
      position: relative !important;
      width: 100% !important;
      max-width: 100% !important;
      min-height: auto;
      margin: 0 auto !important;
      padding: 0 !important;
      background: #ffffff !important;
      box-shadow: none !important;
      overflow: visible !important;
    }

    .secondary-report-wrapper {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      padding: 0 !important;
      box-sizing: border-box;
      overflow: visible !important;
    }

    .no-print,
    .screen-only {
      display: none !important;
    }

    .no-print-scroll {
      overflow: visible !important;
    }

    .secondary-report-section,
    .secondary-spec-grid,
    .secondary-report-table,
    .secondary-signatures,
    .ae-report-header,
    .ae-section-banner,
    .ae-spec-grid-container,
    .ae-footer-sig,
    table,
    tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    .secondary-signatures {
      margin-top: 18mm !important;
    }

    .ae-report-table input {
      -webkit-appearance: none !important;
      appearance: none !important;
      border: none !important;
      outline: none !important;
      background: transparent !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      padding: 0 !important;
      margin: 0 !important;
      color: inherit !important;
    }
  }

  .report-signatures {
    margin-top: 40px;
    display: grid;
    grid-template-columns: 200px 200px;
    justify-content: space-between;
    padding: 0 40px;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .signature-column {
    text-align: center;
    width: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .signature-space {
    font-size: 13px;
    font-weight: 600;
    height: 48px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    margin-bottom: 4px;
  }

  .signature-line {
    width: 100%;
    border-top: 1px solid #1F2937;
  }

  .signature-label {
    padding-top: 6px;
    font-weight: 600;
    font-size: 13px;
    color: #1F2937;
  }

  @media print {
    .report-signatures {
      margin-top: 18mm !important;
      display: grid !important;
      grid-template-columns: 200px 200px !important;
      justify-content: space-between !important;
    }
  }
`;


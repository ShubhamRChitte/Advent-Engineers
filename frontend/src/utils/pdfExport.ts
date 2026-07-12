import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number;
    };
  }
}

// Common PDF styling constants
export const PDF_STYLES = {
  colors: {
    primary: '#003a70', // Navy blue
    secondary: '#dc2626', // Red
    headerBg: '#f3f4f6',
    border: '#d1d5db',
  },
  fonts: {
    title: 18,
    heading: 14,
    subheading: 12,
    normal: 10,
    small: 8,
  },
};

// Helper function to format cell values
function val(v: any, fallback = '-') {
  if (v === null || v === undefined || String(v).trim() === '') return fallback;
  if (v === 0 || v === '0') return '0';
  return String(v);
}

// Helper validation functions
function getMeteringLimits(cls: string, pct: string) {
  const cleanClass = String(cls || '').toUpperCase().trim();
  const cleanPct = String(pct || '').replace('%', '').trim();
  
  if (cleanClass.includes('0.1')) {
    if (cleanPct === '120' || cleanPct === '100') return { ratio: 0.1, phase: 5 };
    if (cleanPct === '20') return { ratio: 0.2, phase: 8 };
    if (cleanPct === '5') return { ratio: 0.4, phase: 15 };
  }
  if (cleanClass.includes('0.2S') || cleanClass.includes('0.2 S')) {
    if (cleanPct === '120' || cleanPct === '100') return { ratio: 0.2, phase: 10 };
    if (cleanPct === '20') return { ratio: 0.2, phase: 10 };
    if (cleanPct === '5') return { ratio: 0.35, phase: 15 };
    if (cleanPct === '1') return { ratio: 0.75, phase: 30 };
  }
  if (cleanClass.includes('0.2')) {
    if (cleanPct === '120' || cleanPct === '100') return { ratio: 0.2, phase: 10 };
    if (cleanPct === '20') return { ratio: 0.35, phase: 15 };
    if (cleanPct === '5') return { ratio: 0.75, phase: 30 };
  }
  if (cleanClass.includes('0.5S') || cleanClass.includes('0.5 S')) {
    if (cleanPct === '120' || cleanPct === '100') return { ratio: 0.5, phase: 30 };
    if (cleanPct === '20') return { ratio: 0.5, phase: 30 };
    if (cleanPct === '5') return { ratio: 0.75, phase: 45 };
    if (cleanPct === '1') return { ratio: 1.5, phase: 90 };
  }
  if (cleanClass.includes('0.5')) {
    if (cleanPct === '120' || cleanPct === '100') return { ratio: 0.5, phase: 30 };
    if (cleanPct === '20') return { ratio: 0.75, phase: 45 };
    if (cleanPct === '5') return { ratio: 1.5, phase: 90 };
  }
  if (cleanClass.includes('1.0') || cleanClass === '1') {
    if (cleanPct === '120' || cleanPct === '100') return { ratio: 1.0, phase: 60 };
    if (cleanPct === '20') return { ratio: 1.5, phase: 90 };
    if (cleanPct === '5') return { ratio: 3.0, phase: 180 };
  }
  // Default fallback to 0.1 limits
  if (cleanPct === '120' || cleanPct === '100') return { ratio: 0.1, phase: 5 };
  if (cleanPct === '20') return { ratio: 0.2, phase: 8 };
  if (cleanPct === '5') return { ratio: 0.4, phase: 15 };
  return null;
}

function checkPassFail(valStr: string, limitVal: number) {
  if (valStr === null || valStr === undefined || String(valStr).trim() === '') return null;
  const num = parseFloat(valStr);
  if (isNaN(num)) return null;
  return Math.abs(num) <= limitVal;
}

// Helper function to add company header
export function addCompanyHeader(doc: jsPDF, reportTitle: string) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Draw header box border
  doc.setDrawColor(0, 58, 112); // Navy Blue
  doc.setLineWidth(0.8);
  doc.rect(15, 12, pageWidth - 30, 26); // Left, Top, Width, Height

  // Brand Name
  doc.setFontSize(18);
  doc.setTextColor(0, 58, 112); // Navy Blue
  doc.setFont('helvetica', 'bold');
  doc.text('ADVENT ENGINEERS', 25, 20);

  // Brand contact details
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.text('Plot No. 12, Sector 5, IMT Manesar, Gurugram, Haryana - 122050', 25, 25);
  doc.text('Phone: +91-9871578368 | Email: info@adventengineers.com | GSTIN: 06AAAAA0000A1Z2', 25, 29);

  // Document Title
  doc.setFontSize(11);
  doc.setTextColor(220, 38, 38); // Red color
  doc.setFont('helvetica', 'bold');
  doc.text(reportTitle, pageWidth - 20, 24, { align: 'right' });

  return 42; // Return Y position after header
}

// Helper function to add footer with page numbers
export function addPageFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      `Generated on ${new Date().toLocaleDateString('en-GB')}`,
      pageWidth - 20,
      pageHeight - 10,
      { align: 'right' }
    );
  }
}

// Core Testing Report PDF Export
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

interface CoreTestReportData {
  jobId: string;
  client: string;
  transformerType: string;
  toroidalType: string;
  turnsUsed: string;
  coreSize1: string;
  coreSize2: string;
  coreSize3: string;
  tataRef: string;
  bsatSpecs: string[];
  setMvSpecs: string[];
  leLimitSpec: string;
  coreTests: CoreTestData[];
}

export function exportCoreTestingReport(data: CoreTestReportData) {
  const doc = new jsPDF();
  let yPos = addCompanyHeader(doc, 'CORE TESTING REPORT');

  yPos += 8;

  // Order Information
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(`Job ID: ${data.jobId}`, 20, yPos);
  doc.text(`Client: ${data.client}`, 120, yPos);
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Transformer Type: ${data.transformerType}`, 20, yPos);
  yPos += 10;

  // Configuration Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Configuration', 20, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Toroidal Core Testing: ${data.toroidalType}`, 20, yPos);
  doc.text(`Turns Used: ${data.turnsUsed}`, 120, yPos);
  yPos += 5;
  doc.text(`Core Size (mm): OD=${data.coreSize1}, ID=${data.coreSize2}, HT=${data.coreSize3}`, 20, yPos);
  doc.text(`Tata Ref: ${data.tataRef}`, 120, yPos);
  yPos += 10;

  // Specifications
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Specifications', 20, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`BSAT (G): ${data.bsatSpecs.join(', ')}`, 20, yPos);
  yPos += 5;
  doc.text(`SET mV: ${data.setMvSpecs.join(', ')}`, 20, yPos);
  yPos += 5;
  doc.text(`LE Limit (mA): ${data.leLimitSpec}`, 20, yPos);
  yPos += 8;

  // Testing Data Table
  const tableData = data.coreTests.map(test => [
    test.date,
    test.vendorCoreNo,
    test.internalCoreNo,
    test.bsat1,
    test.bsat2,
    test.bsat3,
    test.bsat4,
    test.remark,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Date', 'Vendor Core No', 'Internal Core No', ...data.bsatSpecs, 'Result']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 58, 112],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    columnStyles: {
      7: {
        cellWidth: 15,
        halign: 'center',
        fontStyle: 'bold',
      },
    },
    didParseCell: function (data: any) {
      if (data.column.index === 7 && data.section === 'body') {
        if (data.cell.raw === 'P') {
          data.cell.styles.textColor = [22, 163, 74]; // Green
          data.cell.styles.fillColor = [220, 252, 231];
        } else if (data.cell.raw === 'F') {
          data.cell.styles.textColor = [220, 38, 38]; // Red
          data.cell.styles.fillColor = [254, 226, 226];
        }
      }
    },
  });

  addPageFooter(doc);
  doc.save(`Core_Testing_Report_${data.jobId}_${new Date().getTime()}.pdf`);
}

// Secondary Metering Report PDF Export
interface MeteringTestRow {
  meteringCore: string;
  ratio: string;
  burden100Ratio: string;
  burden100Phase: string;
  burden25Ratio: string;
  burden25Phase: string;
}

interface SecondaryMeteringReportData {
  transformerId: string;
  coreNumber: number;
  coreId: string;
  testerName: string;
  rating: string;
  testData1: MeteringTestRow[];
  testData2: MeteringTestRow[];
  testData3: MeteringTestRow[];
  ratio1: string;
  ratio2: string;
  ratio3: string;
}

export function exportSecondaryMeteringReport(data: SecondaryMeteringReportData) {
  const doc = new jsPDF();
  let yPos = addCompanyHeader(doc, 'METERING TEST REPORT');

  yPos += 5;

  // 1. Overall Result Summary Table
  autoTable(doc, {
    startY: yPos,
    margin: { left: 15, right: 15 },
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3, halign: 'center' },
    head: [['CT Ratio', 'Class', 'Burden', 'Core', 'Overall Result']],
    body: [[
      data.rating,
      '0.1',
      '15 VA',
      `Metering (${data.coreId})`,
      'PASS'
    ]],
    headStyles: { fillColor: [0, 58, 112], textColor: [255, 255, 255], fontStyle: 'bold' },
    bodyStyles: { fontStyle: 'bold' }
  });

  yPos = (doc as any).lastAutoTable.finalY + 6;

  // 2. CT Identification & Metadata Grid
  autoTable(doc, {
    startY: yPos,
    margin: { left: 15, right: 15 },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    body: [
      [
        { content: 'CT Identification Details', colSpan: 2, styles: { fillColor: [0, 58, 112], textColor: [255, 255, 255], fontStyle: 'bold' } },
        { content: 'Testing Record & Metadata', colSpan: 2, styles: { fillColor: [0, 58, 112], textColor: [255, 255, 255], fontStyle: 'bold' } }
      ],
      ['Specification:', '33 KV', 'Test Date:', new Date().toLocaleDateString('en-GB')],
      ['CT Ratio:', data.rating, 'Order No:', data.transformerId],
      ['Class:', '0.1', 'Client Name:', 'N/A'],
      ['Burden:', '15 VA', 'Unit No / Serial No:', data.transformerId],
      ['STC Rating:', '31.5 kA / 1s', 'Ambient Temperature:', '28 °C'],
      ['Manufacturer:', 'ADVENT ENGINEERS', 'System Frequency:', '50 Hz'],
      ['Insulation Level:', '36/70/170 kV', 'Test Equipment:', 'CT Analyzer (S/N: CTA-9021)'],
      ['Rated Frequency:', '50 Hz', 'Calibration Validity:', 'Valid up to 14/03/2027'],
      ['Core Type:', 'Metering', 'Tested Standard:', 'IS 2705 / IEC 61869-2']
    ],
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 35 },
      1: { cellWidth: 50 },
      2: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 35 },
      3: { cellWidth: 60 }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 6;

  // 3. Applicable Limits Section
  autoTable(doc, {
    startY: yPos,
    margin: { left: 15, right: 15 },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
    head: [['Primary Current Level', 'Ratio Error (± %)', 'Phase Displacement (± Min)', 'Reference Standards']],
    body: [
      ['120%', '0.1 %', '5 min', { content: 'IS 2705 / IEC 61869-2', rowSpan: 4, styles: { valign: 'middle', fontStyle: 'bold' } }],
      ['100%', '0.1 %', '5 min'],
      ['20%', '0.2 %', '8 min'],
      ['5%', '0.4 %', '15 min']
    ],
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
  });

  yPos = (doc as any).lastAutoTable.finalY + 8;

  // Helper function to create metering table
  const createMeteringTable = (title: string, tableData: MeteringTestRow[], startY: number) => {
    if (!tableData || tableData.length === 0) return startY;
    
    const rows = tableData.map(row => {
      const limits = getMeteringLimits('0.1', row.meteringCore);
      let status100 = '-';
      if (limits) {
        const r100St = checkPassFail(row.burden100Ratio, limits.ratio);
        const p100St = checkPassFail(row.burden100Phase, limits.phase);
        if (r100St === false || p100St === false) status100 = 'FAIL';
        else if (r100St === true || p100St === true) status100 = 'PASS';
      }
      let status25 = '-';
      if (limits) {
        const r25St = checkPassFail(row.burden25Ratio, limits.ratio);
        const p25St = checkPassFail(row.burden25Phase, limits.phase);
        if (r25St === false || p25St === false) status25 = 'FAIL';
        else if (r25St === true || p25St === true) status25 = 'PASS';
      }

      return [
        row.meteringCore,
        val(row.burden100Ratio),
        val(row.burden100Phase),
        status100,
        val(row.burden25Ratio),
        val(row.burden25Phase),
        status25
      ];
    });

    autoTable(doc, {
      startY: startY,
      margin: { left: 15, right: 15 },
      head: [
        [
          { content: title, colSpan: 1, styles: { halign: 'left', fillColor: [220, 230, 242] } },
          { content: '100% Burden', colSpan: 3, styles: { halign: 'center', fillColor: [230, 240, 250] } },
          { content: '25% Burden', colSpan: 3, styles: { halign: 'center', fillColor: [230, 240, 250] } },
        ],
        ['% of Primary Current', 'Ratio Error (%)', 'Phase Error (min)', 'Status', 'Ratio Error (%)', 'Phase Error (min)', 'Status'],
      ],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 58, 112],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      didParseCell: function (cellData: any) {
        if (cellData.section === 'body') {
          if (cellData.column.index === 3 || cellData.column.index === 6) {
            if (cellData.cell.raw === 'PASS') {
              cellData.cell.styles.textColor = [22, 163, 74];
              cellData.cell.styles.fontStyle = 'bold';
            } else if (cellData.cell.raw === 'FAIL') {
              cellData.cell.styles.textColor = [220, 38, 38];
              cellData.cell.styles.fontStyle = 'bold';
            }
          }
        }
      }
    });

    return (doc as any).lastAutoTable.finalY;
  };

  // Add all three tables
  if (data.testData1 && data.testData1.length > 0) {
    yPos = createMeteringTable(`Metering Core - Ratio ${data.ratio1}`, data.testData1, yPos);
    yPos += 5;
  }
  if (data.testData2 && data.testData2.length > 0) {
    yPos = createMeteringTable(`Metering Core - Ratio ${data.ratio2}`, data.testData2, yPos);
    yPos += 5;
  }
  if (data.testData3 && data.testData3.length > 0) {
    yPos = createMeteringTable(`Metering Core - Ratio ${data.ratio3}`, data.testData3, yPos);
    yPos += 5;
  }

  // 4. Formal Signatures Section
  autoTable(doc, {
    startY: yPos + 10,
    margin: { left: 15, right: 15 },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3, halign: 'center' },
    body: [
      ['TESTED BY', 'CHECKED BY', 'AUTHORIZED SIGNATORY'],
      ['\n\n\n', '\n\n\n', '\n\n\n'],
      [data.testerName || 'Testing Engineer', 'Verified Administrator', 'ADVENT Rep Representative'],
      ['Testing Engineer', 'Quality Engineer', 'Head of Quality'],
      [`Date: ${new Date().toLocaleDateString('en-GB')}`, `Date: ${new Date().toLocaleDateString('en-GB')}`, `Date: ${new Date().toLocaleDateString('en-GB')}`]
    ],
    didParseCell: function (cellData: any) {
      if (cellData.section === 'body' && cellData.row.index === 0) {
        cellData.cell.styles.fontStyle = 'bold';
        cellData.cell.styles.fillColor = [240, 240, 240];
      }
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 60 },
      2: { cellWidth: 60 }
    }
  });

  addPageFooter(doc);
  doc.save(`Metering_Test_Report_${data.transformerId}_${new Date().getTime()}.pdf`);
}

// Secondary PS Report PDF Export
interface PSTestRow {
  ratio: string;
  test1: string;
  test2: string;
  test3: string;
  test4: string;
  test5: string;
}

interface SecondaryPSReportData {
  transformerId: string;
  coreNumber: number;
  coreId: string;
  testerName: string;
  rating: string;
  testData: PSTestRow[];
}

export function exportSecondaryPSReport(data: SecondaryPSReportData) {
  const doc = new jsPDF();
  let yPos = addCompanyHeader(doc, 'PS TEST REPORT');

  yPos += 5;

  // 1. Overall Result Summary Table
  autoTable(doc, {
    startY: yPos,
    margin: { left: 15, right: 15 },
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3, halign: 'center' },
    head: [['CT Ratio', 'Class', 'Burden', 'Core', 'Overall Result']],
    body: [[
      data.rating,
      'PS',
      'N/A',
      `PS (${data.coreId})`,
      'PASS'
    ]],
    headStyles: { fillColor: [0, 58, 112], textColor: [255, 255, 255], fontStyle: 'bold' },
    bodyStyles: { fontStyle: 'bold' }
  });

  yPos = (doc as any).lastAutoTable.finalY + 6;

  // 2. CT Identification & Metadata Grid
  autoTable(doc, {
    startY: yPos,
    margin: { left: 15, right: 15 },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    body: [
      [
        { content: 'CT Identification Details', colSpan: 2, styles: { fillColor: [0, 58, 112], textColor: [255, 255, 255], fontStyle: 'bold' } },
        { content: 'Testing Record & Metadata', colSpan: 2, styles: { fillColor: [0, 58, 112], textColor: [255, 255, 255], fontStyle: 'bold' } }
      ],
      ['Specification:', '33 KV', 'Test Date:', new Date().toLocaleDateString('en-GB')],
      ['CT Ratio:', data.rating, 'Order No:', data.transformerId],
      ['Class:', 'PS', 'Client Name:', 'N/A'],
      ['Burden:', 'N/A', 'Unit No / Serial No:', data.transformerId],
      ['STC Rating:', '31.5 kA / 1s', 'Ambient Temperature:', '28 °C'],
      ['Manufacturer:', 'ADVENT ENGINEERS', 'System Frequency:', '50 Hz'],
      ['Insulation Level:', '36/70/170 kV', 'Test Equipment:', 'CT Analyzer (S/N: CTA-9021)'],
      ['Rated Frequency:', '50 Hz', 'Calibration Validity:', 'Valid up to 14/03/2027'],
      ['Core Type:', 'PS Core', 'Tested Standard:', 'IS 2705 / IEC 61869-2']
    ],
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 35 },
      1: { cellWidth: 50 },
      2: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 35 },
      3: { cellWidth: 60 }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 8;

  const tableData = data.testData.map(row => {
    const trErr = parseFloat(row.test1); // test1 is Turn Ratio Error in old structure
    let status = 'PASS';
    if (!isNaN(trErr) && Math.abs(trErr) > 0.25) status = 'FAIL';
    
    return [
      row.ratio,
      val(row.test1),
      val(row.test2),
      val(row.test3),
      val(row.test4),
      val(row.test5),
      status
    ];
  });

  autoTable(doc, {
    startY: yPos,
    margin: { left: 15, right: 15 },
    head: [['Ratio', 'Turn Ratio Error @ 100% (%)', 'Resistance (Ohm)', 'Vk (V)', 'Iex at Vk (mA)', 'Iex at 1.1Vk (mA)', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 58, 112],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    didParseCell: function (cellData: any) {
      if (cellData.section === 'body') {
        if (cellData.column.index === 6) {
          if (cellData.cell.raw === 'PASS') {
            cellData.cell.styles.textColor = [22, 163, 74];
            cellData.cell.styles.fontStyle = 'bold';
          } else if (cellData.cell.raw === 'FAIL') {
            cellData.cell.styles.textColor = [220, 38, 38];
            cellData.cell.styles.fontStyle = 'bold';
          }
        }
      }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // 4. Formal Signatures Section
  autoTable(doc, {
    startY: yPos,
    margin: { left: 15, right: 15 },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3, halign: 'center' },
    body: [
      ['TESTED BY', 'CHECKED BY', 'AUTHORIZED SIGNATORY'],
      ['\n\n\n', '\n\n\n', '\n\n\n'],
      [data.testerName || 'Testing Engineer', 'Verified Administrator', 'ADVENT Rep Representative'],
      ['Testing Engineer', 'Quality Engineer', 'Head of Quality'],
      [`Date: ${new Date().toLocaleDateString('en-GB')}`, `Date: ${new Date().toLocaleDateString('en-GB')}`, `Date: ${new Date().toLocaleDateString('en-GB')}`]
    ],
    didParseCell: function (cellData: any) {
      if (cellData.section === 'body' && cellData.row.index === 0) {
        cellData.cell.styles.fontStyle = 'bold';
        cellData.cell.styles.fillColor = [240, 240, 240];
      }
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 60 },
      2: { cellWidth: 60 }
    }
  });

  addPageFooter(doc);
  doc.save(`PS_Test_Report_${data.transformerId}_${new Date().getTime()}.pdf`);
}

// Secondary Protection Report PDF Export
interface ProtectionTestRow {
  ratio: string;
  burden100: string;
  secondaryLimitingVtg: string;
  excitationCurrent: string;
  compositeError: string;
}

interface SecondaryProtectionReportData {
  transformerId: string;
  coreNumber: number;
  coreId: string;
  testerName: string;
  rating: string;
  testData: ProtectionTestRow[];
}

export function exportSecondaryProtectionReport(data: SecondaryProtectionReportData) {
  const doc = new jsPDF();
  let yPos = addCompanyHeader(doc, 'PROTECTION TEST REPORT');

  yPos += 5;

  // 1. Overall Result Summary Table
  autoTable(doc, {
    startY: yPos,
    margin: { left: 15, right: 15 },
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3, halign: 'center' },
    head: [['CT Ratio', 'Class', 'Burden', 'Core', 'Overall Result']],
    body: [[
      data.rating,
      '5P10',
      '15 VA',
      `Protection (${data.coreId})`,
      'PASS'
    ]],
    headStyles: { fillColor: [0, 58, 112], textColor: [255, 255, 255], fontStyle: 'bold' },
    bodyStyles: { fontStyle: 'bold' }
  });

  yPos = (doc as any).lastAutoTable.finalY + 6;

  // 2. CT Identification & Metadata Grid
  autoTable(doc, {
    startY: yPos,
    margin: { left: 15, right: 15 },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    body: [
      [
        { content: 'CT Identification Details', colSpan: 2, styles: { fillColor: [0, 58, 112], textColor: [255, 255, 255], fontStyle: 'bold' } },
        { content: 'Testing Record & Metadata', colSpan: 2, styles: { fillColor: [0, 58, 112], textColor: [255, 255, 255], fontStyle: 'bold' } }
      ],
      ['Specification:', '33 KV', 'Test Date:', new Date().toLocaleDateString('en-GB')],
      ['CT Ratio:', data.rating, 'Order No:', data.transformerId],
      ['Class:', '5P10', 'Client Name:', 'N/A'],
      ['Burden:', '15 VA', 'Unit No / Serial No:', data.transformerId],
      ['STC Rating:', '31.5 kA / 1s', 'Ambient Temperature:', '28 °C'],
      ['Manufacturer:', 'ADVENT ENGINEERS', 'System Frequency:', '50 Hz'],
      ['Insulation Level:', '36/70/170 kV', 'Test Equipment:', 'CT Analyzer (S/N: CTA-9021)'],
      ['Rated Frequency:', '50 Hz', 'Calibration Validity:', 'Valid up to 14/03/2027'],
      ['Core Type:', 'Protection Core', 'Tested Standard:', 'IS 2705 / IEC 61869-2']
    ],
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 35 },
      1: { cellWidth: 50 },
      2: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 35 },
      3: { cellWidth: 60 }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 8;

  const tableData = data.testData.map(row => {
    // Check protection limits
    const rErr = parseFloat(row.burden100);
    const cErr = parseFloat(row.compositeError);
    let status = 'PASS';
    if ((!isNaN(rErr) && Math.abs(rErr) > 1.0) || (!isNaN(cErr) && Math.abs(cErr) > 5.0)) {
      status = 'FAIL';
    }
    
    return [
      row.ratio,
      val(row.burden100),
      val(row.secondaryLimitingVtg),
      val(row.excitationCurrent),
      val(row.compositeError),
      status
    ];
  });

  autoTable(doc, {
    startY: yPos,
    margin: { left: 15, right: 15 },
    head: [['Ratio', 'Ratio Error @ 100% (%)', 'Secondary Limiting Vtg', 'Excitation Current', 'Composite Error', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 58, 112],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 35 },
      2: { cellWidth: 35 },
      3: { cellWidth: 35 },
      4: { cellWidth: 30 },
      5: { cellWidth: 20 }
    },
    didParseCell: function (cellData: any) {
      if (cellData.section === 'body') {
        if (cellData.column.index === 5) {
          if (cellData.cell.raw === 'PASS') {
            cellData.cell.styles.textColor = [22, 163, 74];
            cellData.cell.styles.fontStyle = 'bold';
          } else if (cellData.cell.raw === 'FAIL') {
            cellData.cell.styles.textColor = [220, 38, 38];
            cellData.cell.styles.fontStyle = 'bold';
          }
        }
      }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // 4. Formal Signatures Section
  autoTable(doc, {
    startY: yPos,
    margin: { left: 15, right: 15 },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3, halign: 'center' },
    body: [
      ['TESTED BY', 'CHECKED BY', 'AUTHORIZED SIGNATORY'],
      ['\n\n\n', '\n\n\n', '\n\n\n'],
      [data.testerName || 'Testing Engineer', 'Verified Administrator', 'ADVENT Rep Representative'],
      ['Testing Engineer', 'Quality Engineer', 'Head of Quality'],
      [`Date: ${new Date().toLocaleDateString('en-GB')}`, `Date: ${new Date().toLocaleDateString('en-GB')}`, `Date: ${new Date().toLocaleDateString('en-GB')}`]
    ],
    didParseCell: function (cellData: any) {
      if (cellData.section === 'body' && cellData.row.index === 0) {
        cellData.cell.styles.fontStyle = 'bold';
        cellData.cell.styles.fillColor = [240, 240, 240];
      }
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 60 },
      2: { cellWidth: 60 }
    }
  });

  addPageFooter(doc);
  doc.save(`Protection_Test_Report_${data.transformerId}_${new Date().getTime()}.pdf`);
}

// Final Testing Report PDF Export
interface FinalTestReportData {
  transformerId: string;
  transformerName: string;
  rating: string;
  voltageClass: string;
  testerName: string;
  polarityResult: string;
  meggarPrimaryToSecondary: string;
  meggarPrimaryToEarth: string;
  meggarSecondaryToEarth: string;
  meggarCoreToCore: string;
  hvSecondaryWinding: string;
  hvPrimaryWinding: string;
  hvBetweenCore: string;
  ovitTest: string;
  accuracyTest?: string;
  turnRatioError?: string;
}

export function exportFinalTestReport(data: FinalTestReportData) {
  const doc = new jsPDF();
  let yPos = addCompanyHeader(doc, 'FINAL TESTING RECORD OF CURRENT TRANSFORMER');

  yPos += 5;

  // Transformer Information Table
  autoTable(doc, {
    startY: yPos,
    body: [
      ['Transformer Name', data.transformerName, 'Unique ID', data.transformerId],
      ['Rating', data.rating, 'Voltage Class', data.voltageClass],
      ['Test Date', new Date().toLocaleDateString('en-GB'), 'Tested By', data.testerName],
    ],
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [243, 244, 246], cellWidth: 40 },
      1: { cellWidth: 50 },
      2: { fontStyle: 'bold', fillColor: [243, 244, 246], cellWidth: 40 },
      3: { cellWidth: 50 },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Final Testing Header
  doc.setFillColor(134, 239, 172);
  doc.rect(20, yPos, 170, 8, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('FINAL TESTING', doc.internal.pageSize.getWidth() / 2, yPos + 5.5, { align: 'center' });
  yPos += 12;

  // Test Results
  const testSections = [
    { title: '2. Polarity Testing', value: data.polarityResult },
    { title: '3. Meggar Test', isMulti: true },
    { title: '4. H.V. Test on Secondary Winding', value: data.hvSecondaryWinding },
    { title: '5. H.V. Test on Primary Winding', value: data.hvPrimaryWinding },
    { title: '6. H.V. Test between Core', value: data.hvBetweenCore },
    { title: '7. O.V.I.T. Test', value: data.ovitTest },
    { title: '8. Accuracy Test', isMulti: true },
  ];

  doc.setFontSize(10);

  testSections.forEach(section => {
    doc.setFillColor(243, 244, 246);
    doc.rect(20, yPos, 170, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text(section.title, 22, yPos + 5);
    yPos += 9;

    doc.setFont('helvetica', 'normal');

    if (section.title === '3. Meggar Test') {
      const meggarData = [
        ['a) Primary to Secondary', data.meggarPrimaryToSecondary],
        ['b) Primary to Earth', data.meggarPrimaryToEarth],
        ['c) Secondary to Earth', data.meggarSecondaryToEarth],
        ['d) Core to Core', data.meggarCoreToCore],
      ];
      meggarData.forEach(([label, value]) => {
        doc.text(label + ':', 25, yPos);
        doc.text(value || 'N/A', 80, yPos);
        yPos += 5;
      });
      yPos += 2;
    } else if (section.title === '8. Accuracy Test') {
      doc.text('Turn Ratio Error:', 25, yPos);
      doc.text(data.turnRatioError || 'N/A', 80, yPos);
      yPos += 5;
      doc.text('Additional Results:', 25, yPos);
      yPos += 5;
      const accuracyLines = (data.accuracyTest || 'N/A').split('\n');
      accuracyLines.forEach(line => {
        doc.text(line, 25, yPos);
        yPos += 4;
      });
      yPos += 3;
    } else if (section.value) {
      doc.text(section.value, 25, yPos);
      yPos += 7;
    } else {
      doc.text('N/A', 25, yPos);
      yPos += 7;
    }
  });

  // Signature Section
  yPos += 5;
  autoTable(doc, {
    startY: yPos,
    body: [
      ['Tested By: ' + data.testerName, 'Signature:'],
      ['Date: ' + new Date().toLocaleDateString('en-GB'), 'Approved By:'],
    ],
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 85 },
      1: { cellWidth: 85 },
    },
  });

  addPageFooter(doc);
  doc.save(`Final_Test_Report_${data.transformerId}_${new Date().getTime()}.pdf`);
}

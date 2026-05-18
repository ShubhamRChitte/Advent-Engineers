/**
 * Report Data Adapter
 * 
 * Maps various data shapes from different parts of the application
 * into the universal UnifiedCoreReportData interface.
 * 
 * This adapter layer ensures zero breaking changes to existing consumers:
 * - CoreTestingForm → CoreReportPrint → adapter → UnifiedCoreReport
 * - ReportPage → PrintableCoreReport → adapter → UnifiedCoreReport
 * - AdminReportViewPage → PrintableCoreReport → adapter → UnifiedCoreReport
 * - CoreTestingReport → PrintableCoreReport → adapter → UnifiedCoreReport
 */

// ---------- Universal Interface ----------

export interface BSATColumnData {
  id: string;
  bsatValue: string;
  setMvValue: string;
  leLimitValue: string;
}

export interface ReportRowData {
  date: string;
  vendorCoreNo: string;
  internalCoreNo: string;
  dynamicValues: Record<string, string>;
  remark: string;
}

export interface UnifiedCoreReportData {
  // Header metadata
  reportDate: string;
  orderId: string;
  clientName: string;
  batchId: string;
  tataRef: string;
  coreType: 'Metering' | 'PS' | 'Protection';
  materialType: string;

  // Specifications
  coreSize: { id: string; od: string; ht: string };
  turnsUsed: string;
  areaSqCm: string;
  mmp: string;

  // BSAT columns (dynamic count)
  bsatColumns: BSATColumnData[];

  // Data rows
  rows: ReportRowData[];

  // Signatures
  testedBy: string;
  authorizedSignatory: string;
}

// ---------- Adapter 1: From CoreReportPrintProps ----------
// Used by CoreTestingForm.tsx

interface CoreReportPrintInput {
  order: any;
  coreType: 'Metering' | 'PS' | 'Protection';
  specs: any;
  rows: Array<{
    date: string;
    coreVendorNo: string;
    internalCoreNo: string;
    dynamicValues: Record<string, string>;
    remark: string;
  }>;
  bsatColumns: Array<{
    id: string;
    bsatValue: string;
    setMvValue: string;
    leLimitValue: string;
  }>;
  testDate: string;
  testBy: string;
  authorizedSignatory: string;
  tataRef?: string | undefined;
  materialType: string;
}

export function fromCoreReportPrintProps(input: CoreReportPrintInput): UnifiedCoreReportData {
  const { order, coreType, specs, rows, bsatColumns, testDate, testBy, authorizedSignatory, tataRef, materialType } = input;

  // Resolve order ID safely
  const orderId = order?.jobId || order?.mainOrderId || order?.orderId || '';
  const clientName = order?.clientName || order?.client || '';
  const batchId = order?.jobId || '';

  return {
    reportDate: testDate,
    orderId,
    clientName,
    batchId,
    tataRef: tataRef || '',
    coreType,
    materialType: materialType || 'TOROIDAL CORE NANO CRYSTALLINE',

    coreSize: {
      id: specs?.coreSize1 || '',
      od: specs?.coreSize2 || '',
      ht: specs?.coreSize3 || '',
    },
    turnsUsed: specs?.turnUsed || '10',
    areaSqCm: String(specs?.area || ''),
    mmp: String(specs?.mmp || ''),

    bsatColumns: bsatColumns.map(col => ({
      id: col.id,
      bsatValue: col.bsatValue,
      setMvValue: col.setMvValue,
      leLimitValue: col.leLimitValue,
    })),

    rows: rows.map(row => ({
      date: row.date,
      vendorCoreNo: row.coreVendorNo,
      internalCoreNo: row.internalCoreNo,
      dynamicValues: row.dynamicValues || {},
      remark: row.remark,
    })),

    testedBy: testBy,
    authorizedSignatory,
  };
}

// ---------- Adapter 2: From PrintableCoreReportProps ----------
// Used by ReportPage, AdminReportViewPage, CoreTestingReport

interface PrintableCoreReportInput {
  order: any;
  coreData: any;
}

export function fromPrintableCoreReportProps(input: PrintableCoreReportInput): UnifiedCoreReportData {
  const { order, coreData } = input;

  if (!coreData) {
    return createEmptyReport();
  }

  const isProtection = coreData.coreType === 'Protection' || coreData.coreType === 'PS';
  const coreType: 'Metering' | 'PS' | 'Protection' = 
    coreData.coreType === 'PS' ? 'PS' : 
    coreData.coreType === 'Protection' ? 'Protection' : 'Metering';

  const testSetup = coreData.testSetup || {};
  const testLimits = coreData.testLimits || {};
  const testSpec = coreData.testSpecification || {};
  const tableData = coreData.tableData || [];

  // Build BSAT columns
  let bsatColumns: BSATColumnData[] = [];

  if (isProtection) {
    // Protection/PS: single column from testSpecification
    bsatColumns = [{
      id: '1',
      bsatValue: String(testSpec.fluxTesla || '1.5'),
      setMvValue: String(testSpec.voltageV || '7.04'),
      leLimitValue: String(testSpec.iexLimitMa || '1696'),
    }];
  } else {
    // Metering: multiple BSAT columns from testLimits
    const bsatGauss = testLimits.bsatGauss || ['1000', '3000', '5000', '7000'];
    const setMv = testLimits.setMilliVolt || ['93.1928', '277.643', '465.964', '652.349'];
    const leLimit = testLimits.leLimitMa || ['17.1444', '34.2888', '42.861', '56.7398'];

    bsatColumns = bsatGauss.map((bsat: string, i: number) => ({
      id: String(i + 1),
      bsatValue: String(bsat),
      setMvValue: String(setMv[i] || ''),
      leLimitValue: String(leLimit[i] || ''),
    }));
  }

  // Map table data to rows
  const rows: ReportRowData[] = tableData.map((test: any) => {
    const dynamicValues: Record<string, string> = {};

    if (isProtection) {
      // Protection: single "value" field
      dynamicValues['1'] = String(test.value || test.measuredMa?.[0] || '-');
    } else {
      // Metering: map measuredMa array to column IDs
      const measured = test.measuredMa || [];
      bsatColumns.forEach((col, i) => {
        dynamicValues[col.id] = String(measured[i] || '-');
      });
    }

    return {
      date: test.date || '',
      vendorCoreNo: test.vendorCoreNo || '',
      internalCoreNo: test.internalCoreNo || '',
      dynamicValues,
      remark: test.result || test.remark || '',
    };
  });

  const tataRef = order?.tataRef || '';

  return {
    reportDate: new Date(order?.updatedAt || new Date()).toLocaleDateString('en-GB'),
    orderId: order?.jobId || '',
    clientName: order?.clientName || order?.client || '',
    batchId: order?.jobId ? `JOB-${new Date(order?.createdAt || new Date()).getFullYear()}-${(order?.jobId || '').slice(-3)}` : '',
    tataRef,
    coreType,
    materialType: coreData.coreName || coreData.coreType || 'TOROIDAL CORE NANO CRYSTALLINE',

    coreSize: {
      id: String(testSetup.coreSizeMm?.id || '115'),
      od: String(testSetup.coreSizeMm?.od || '145'),
      ht: String(testSetup.coreSizeMm?.height || '35'),
    },
    turnsUsed: String(testSetup.turnsUsed || '10'),
    areaSqCm: String(testSetup.areaSqCm || '41.225'),
    mmp: String(testSetup.mmp || '42.39'),

    bsatColumns,
    rows,
    testedBy: coreData.testedBy || 'Rahul Sharma',
    authorizedSignatory: 'Rahul Sharma',
  };
}

// ---------- Empty Report Fallback ----------

function createEmptyReport(): UnifiedCoreReportData {
  return {
    reportDate: new Date().toLocaleDateString('en-GB'),
    orderId: '',
    clientName: '',
    batchId: '',
    tataRef: '',
    coreType: 'Metering',
    materialType: '',
    coreSize: { id: '', od: '', ht: '' },
    turnsUsed: '',
    areaSqCm: '',
    mmp: '',
    bsatColumns: [],
    rows: [],
    testedBy: '',
    authorizedSignatory: '',
  };
}

import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  ArrowLeft,
  Save,
  Printer,
  Plus,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  Tag,
  Edit,
  Trash2,
} from 'lucide-react';
import { CoreTestingOrder } from './CoreTestingOrders';
import { FailedCoresManager } from './FailedCoresManager';
import { CoreLabelsPrint } from './CoreLabelsPrint';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import axios from 'axios';



interface CoreTestingFormProps {
  order: CoreTestingOrder;
  coreType: 'Metering' | 'PS' | 'Protection';
  onBack: () => void;
}

interface CoreTestRow {
  date: string;
  coreVendorNo: string;
  internalCoreNo: string;
  value1000: string;
  value3000: string;
  value5000: string;
  value7000: string;
  singleValue: string; // For Protection core
  dynamicValues: { [key: string]: string }; // For dynamic BSAT columns
  remark: string;
  isReplacement?: boolean;
  replacedCoreId?: string;
}

interface BSATColumn {
  id: string;
  bsatValue: string;
  setMvValue: string;
  leLimitValue: string;
}

export interface FailedCore {
  orderId: string;
  jobId: string;
  clientName: string;
  coreType: string;
  internalCoreNo: string;
  coreVendorNo: string;
  date: string;
  failureReason: string;
  value1000: string;
  value3000: string;
  value5000: string;
  value7000: string;
  singleValue?: string;
  dynamicValues?: { [key: string]: string };
}

export function CoreTestingForm({ order, coreType, onBack }: CoreTestingFormProps) {
  // const generateCoreId = (transformerNum: number) => {
  //   const prefix = coreType === 'Metering' ? 'M' : coreType === 'PS' ? 'PS' : 'P';
  //   const orderPrefix = order.orderId.replace('ORD-', '').replace('-', '');
  //   return `${prefix}-${orderPrefix}-${String(transformerNum).padStart(3, '0')}`;
  // };


  // ------------------------update-1

  const generateCoreId = (transformerNum: number) => {
    // 1. Prefix based on core type
    const prefix = coreType === 'Metering' ? 'M' : coreType === 'PS' ? 'PS' : 'P';

    // 2. Safe Job ID logic: Takes "JOB-2025-015" and gets "015"
    // The ?. ensures it doesn't crash if order or jobId is missing
    const jobSuffix = order?.jobId?.split('-').pop() ?? '000';

    // 3. Final Format: Prefix-JobSuffix-Sequence (e.g., M-015-001)
    return `${prefix}-${jobSuffix}-${String(transformerNum).padStart(3, '0')}`;
  };



  // ----------------------

  const isProtectionCore = coreType === 'Protection';
  const isPSCore = coreType === 'PS';





  /** Helper to find the next logical sequence number in existing rows */
  const getNextSequenceNumber = (currentRows: CoreTestRow[]) => {
    const existingIds = currentRows
      .map(r => r.internalCoreNo)
      .filter(id => id && id.includes('-'));

    if (existingIds.length === 0) return 1;

    const numbers = existingIds.map(id => {
      const parts = id.split('-');
      return parseInt(parts[parts.length - 1]) || 0;
    });

    return Math.max(...numbers) + 1;
  };




  const getSystemDate = () => new Date().toLocaleDateString('en-GB');


  ///-------------------------------update -4
  // Initialize rows
  // const initializeRows = (): CoreTestRow[] => {
  //   return Array.from({ length: 20 }, (_, i) => ({
  //     date: '',
  //     coreVendorNo: '',
  //     internalCoreNo: i < order.transformerQuantity ? generateCoreId(i + 1) : '',
  //     value1000: '',
  //     value3000: '',
  //     value5000: '',
  //     value7000: '',
  //     singleValue: '',
  //     dynamicValues: {},
  //     remark: '',
  //   }));
  // };
  //----------------------------
  const initializeRows = (): CoreTestRow[] => {
    return Array.from({ length: 20 }, (_, i) => ({
      date: getSystemDate(),
      coreVendorNo: '',
      internalCoreNo: i < order.transformerQuantity ? generateCoreId(i + 1) : '',
      value1000: '',
      value3000: '',
      value5000: '',
      value7000: '',
      singleValue: '',
      dynamicValues: {},
      remark: '',
    }));
  };

  //   const initializeRows = (): CoreTestRow[] => {
  //   // Use the core type prefix
  // const prefix = coreType === 'Metering' ? 'M' : coreType === 'PS' ? 'PS' : 'P';

  // //   // Clean the JobID (e.g., "JOB-2025-015" -> "25015")
  // const jobSuffix = order.jobId.split('-').pop();

  // return Array.from({ length: 20 }, (_, i) => {
  //   const isWithinQuantity = i < order.transformerQuantity;

  //   return {
  //     date: getSystemDate(),
  //     coreVendorNo: '',
  //     // Generate ID only if within the order quantity
  //     internalCoreNo: isWithinQuantity
  //       ? `${prefix}-${jobSuffix}-${String(i + 1).padStart(3, '0')}`
  //       : '',
  //     value1000: '', value3000: '', value5000: '', value7000: '',
  //     singleValue: '',
  //     dynamicValues: {},
  //     remark: '',
  //   };
  // });
  // };






  // ---------------------------------------

  const [rows, setRows] = useState<CoreTestRow[]>(initializeRows());
  const [failedCores, setFailedCores] = useState<FailedCore[]>([]);
  const [showFailedCores, setShowFailedCores] = useState(false);
  const [showPrintLabels, setShowPrintLabels] = useState(false);
  const [currentDate] = useState(new Date().toISOString().split('T')[0]);
  const [testDate, setTestDate] = useState(new Date().toLocaleDateString('en-GB'));
  const [testBy, setTestBy] = useState('');
  const [authorizedSignatory, setAuthorizedSignatory] = useState('');

  // Metering configuration state
  const [meteringConfigured, setMeteringConfigured] = useState(false);
  const [coreTypeNano, setCoreTypeNano] = useState<'TOROIDAL CORE NANO CRYSTALLINE' | 'M4CRGO'>('TOROIDAL CORE NANO CRYSTALLINE');
  const [bsatColumns, setBsatColumns] = useState<BSATColumn[]>([
    { id: '1', bsatValue: '1000', setMvValue: '93.1928', leLimitValue: '17.1444' },
    { id: '2', bsatValue: '3000', setMvValue: '277.643', leLimitValue: '34.2888' },
    { id: '3', bsatValue: '5000', setMvValue: '465.964', leLimitValue: '42.861' },
    { id: '4', bsatValue: '7000', setMvValue: '652.349', leLimitValue: '56.7398' },
  ]);

  // Protection configuration state
  const [protectionConfigured, setProtectionConfigured] = useState(false);
  const [protectionCoreTypeM4CRGO, setProtectionCoreTypeM4CRGO] = useState<'M4CRGO'>('M4CRGO');
  const [protectionBColumns, setProtectionBColumns] = useState<BSATColumn[]>([
    { id: '1', bsatValue: '1.5', setMvValue: '7.04', leLimitValue: '1696' },
  ]);

  // PS configuration state
  const [psConfigured, setPsConfigured] = useState(false);
  const [psCoreTypeM4CRGO, setPsCoreTypeM4CRGO] = useState<'M4CRGO'>('M4CRGO');
  const [psBColumns, setPsBColumns] = useState<BSATColumn[]>([
    { id: '1', bsatValue: '1.5', setMvValue: '7.04', leLimitValue: '1150' },
  ]);

  // Specification data - Different for Protection
  const [specs, setSpecs] = useState(
    isProtectionCore ? {
      coreSize1: '85',
      coreSize2: '185',
      coreSize3: '85',
      turnUsed: '10',
      area: '11.225',
      mmp: '47.39',
      bFlux: '1.08',
      voltage: '7.586',
      setMvAt50: '758.6',
    } : isPSCore ? {
      coreSize1: '110',
      coreSize2: '210',
      coreSize3: '60',
      turnUsed: '10',
      area: '29.1',
      mmp: '50.24',
      bFlux: '11',
      voltage: '9.5',
      iexLimit: '1150',
    } : {
      coreSize1: '115',
      coreSize2: '145',
      coreSize3: '35',
      turnUsed: '10',
      area: '5.0925',
      mmp: '40.82',
      bFlux: '1.5',
      voltage: '9.6903',
    }
  );

  // Re-initialize rows when coreType or order changes to verify correct ID generation
  useEffect(() => {
    setRows(initializeRows());
  }, [coreType, order]);

  // LE Limits - Only for Metering/PS
  const leLimits = {
    limit1000: 17.1444,
    limit3000: 34.2888,
    limit5000: 42.861,
    limit7000: 56.7398,
  };

  // Protection core limit (simpler - just one value)
  const protectionLimit = 600; // Example limit in mA

  // PS core limit
  const psLimit = parseFloat(specs.iexLimit || '1150');

  const handleSpecChange = (field: string, value: string) => {
    setSpecs({ ...specs, [field]: value });
  };

  const getFailureReason = (row: CoreTestRow): string => {
    if (isProtectionCore) {
      // Check dynamic values against protection column limits
      const reasons: string[] = [];
      protectionBColumns.forEach(column => {
        const value = row.dynamicValues[column.id];
        const limit = parseFloat(column.leLimitValue);
        if (value && parseFloat(value) > limit) {
          reasons.push(`B${column.bsatValue}T: ${value}mA > ${limit}mA`);
        }
      });
      return reasons.join('; ');
    }

    if (isPSCore) {
      // PS core - check dynamic values like Protection core
      const reasons: string[] = [];
      psBColumns.forEach(column => {
        const value = row.dynamicValues[column.id];
        const limit = parseFloat(column.leLimitValue);
        if (value && parseFloat(value) > limit) {
          reasons.push(`B${column.bsatValue}T: ${value}mA > ${limit}mA`);
        }
      });
      return reasons.join('; ');
    }

    const reasons: string[] = [];

    // Check dynamic metering values
    bsatColumns.forEach(column => {
      const value = row.dynamicValues[column.id];
      const limit = parseFloat(column.leLimitValue);
      if (value && parseFloat(value) > limit) {
        reasons.push(`${column.bsatValue}G: ${value}mA > ${limit}mA`);
      }
    });

    return reasons.join('; ');
  };

  const calculateRemark = (row: CoreTestRow): string => {
    if (isProtectionCore) {
      // Protection core - check all dynamic values
      if (Object.keys(row.dynamicValues).length === 0) return '';

      for (const column of protectionBColumns) {
        const value = row.dynamicValues[column.id];
        if (!value) continue;
        const numValue = parseFloat(value);
        const limit = parseFloat(column.leLimitValue);
        if (isNaN(numValue)) continue;
        if (numValue > limit) return 'F';
      }

      // If we have at least one value and none failed, it's a pass
      const hasAnyValue = Object.values(row.dynamicValues).some(v => v !== '');
      return hasAnyValue ? 'P' : '';
    }

    if (isPSCore) {
      // PS core - check all dynamic values like Protection core
      if (Object.keys(row.dynamicValues).length === 0) return '';

      for (const column of psBColumns) {
        const value = row.dynamicValues[column.id];
        if (!value) continue;
        const numValue = parseFloat(value);
        const limit = parseFloat(column.leLimitValue);
        if (isNaN(numValue)) continue;
        if (numValue > limit) return 'F';
      }

      // If we have at least one value and none failed, it's a pass
      const hasAnyValue = Object.values(row.dynamicValues).some(v => v !== '');
      return hasAnyValue ? 'P' : '';
    }

    // Metering - check dynamic values
    if (Object.keys(row.dynamicValues).length === 0) return '';

    for (const column of bsatColumns) {
      const value = row.dynamicValues[column.id];
      if (!value) continue;
      const numValue = parseFloat(value);
      const limit = parseFloat(column.leLimitValue);
      if (isNaN(numValue)) continue;
      if (numValue > limit) return 'F';
    }

    // If we have at least one value and none failed, it's a pass
    const hasAnyValue = Object.values(row.dynamicValues).some(v => v !== '');
    return hasAnyValue ? 'P' : '';
  };

  const handleRowChange = (index: number, field: keyof CoreTestRow, value: string | any) => {
    const updatedRows = [...rows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };

    // Auto-calculate remark when values change
    if (field === 'dynamicValues' || field === 'singleValue') {
      updatedRows[index].remark = calculateRemark(updatedRows[index]);
    }

    setRows(updatedRows);
  };

  // const handleReplaceCore = (index: number) => {
  //   const failedRow = rows[index];

  //   // Add to failed cores list
  //   const failedCore: FailedCore = {
  //     orderId: order.orderId,
  //     jobId: order.jobId,
  //     clientName: order.clientName,
  //     coreType: coreType,
  //     internalCoreNo: failedRow.internalCoreNo,
  //     coreVendorNo: failedRow.coreVendorNo,
  //     date: failedRow.date,
  //     failureReason: getFailureReason(failedRow),
  //     value1000: failedRow.value1000,
  //     value3000: failedRow.value3000,
  //     value5000: failedRow.value5000,
  //     value7000: failedRow.value7000,
  //     singleValue: failedRow.singleValue,
  //     dynamicValues: failedRow.dynamicValues,
  //   };

  //   setFailedCores([...failedCores, failedCore]);

  //   // Reset the row for replacement core
  //   const updatedRows = [...rows];
  //   updatedRows[index] = {
  //     date: '',
  //     coreVendorNo: '',
  //     internalCoreNo: failedRow.internalCoreNo,
  //     value1000: '',
  //     value3000: '',
  //     value5000: '',
  //     value7000: '',
  //     singleValue: '',
  //     dynamicValues: {},
  //     remark: '',
  //     isReplacement: true,
  //     replacedCoreId: failedRow.internalCoreNo,
  //   };

  //   setRows(updatedRows);
  // };

  // const addRow = () => {
  //   setRows([...rows, {
  //     date: '',
  //     coreVendorNo: '',
  //     internalCoreNo: '',
  //     value1000: '',
  //     value3000: '',
  //     value5000: '',
  //     value7000: '',
  //     singleValue: '',
  //     dynamicValues: {},
  //     remark: '',
  //   }]);
  // };



  //--------------------------------------------------------update-2
  /** Handles core failure: archives the data and generates a NEW ID for the replacement */
  // const handleReplaceCore = (index: number) => {
  //   const failedRow = rows[index];
  //   const systemDate = getSystemDate();

  //   // Archive the failure
  //   const failedCore: FailedCore = {
  //     orderId: order.orderId,
  //     jobId: order.jobId,
  //     clientName: order.clientName,
  //     coreType: coreType,
  //     internalCoreNo: failedRow.internalCoreNo,
  //     coreVendorNo: failedRow.coreVendorNo,
  //     date: failedRow.date || systemDate,
  //     failureReason: getFailureReason(failedRow),
  //     dynamicValues: failedRow.dynamicValues,
  //     // ... fill other fields as needed
  //   };
  //   setFailedCores([...failedCores, failedCore]);

  //   // Update row with a fresh unique ID for the new physical core
  //   const nextSeq = getNextSequenceNumber(rows);
  //   const updatedRows = [...rows];
  //   updatedRows[index] = {
  //     date: systemDate,
  //     coreVendorNo: '',
  //     internalCoreNo: generateUniqueCoreId(nextSeq, coreType, order.orderId),
  //     value1000: '', value3000: '', value5000: '', value7000: '',
  //     singleValue: '',
  //     dynamicValues: {},
  //     remark: '',
  //     isReplacement: true,
  //     replacedCoreId: failedRow.internalCoreNo,
  //   };
  //   setRows(updatedRows);
  // };

  //---------------------------------------------



  const handleReplaceCore = (index: number) => {
    const failedRow = rows[index];
    const systemDate = getSystemDate();

    // Archive the failure to the FailedCores state
    const failedCore: FailedCore = {
      orderId: order.orderId,
      jobId: order.jobId,
      clientName: order.clientName,
      coreType: coreType,
      internalCoreNo: failedRow.internalCoreNo,
      coreVendorNo: failedRow.coreVendorNo,
      date: failedRow.date || systemDate,
      failureReason: getFailureReason(failedRow),
      dynamicValues: failedRow.dynamicValues,
    };
    setFailedCores([...failedCores, failedCore]);

    // Generate a NEW ID based on the total count of cores existing in the table
    const nextSeq = getNextSequenceNumber(rows);
    const updatedRows = [...rows];

    updatedRows[index] = {
      date: systemDate,
      coreVendorNo: '',
      internalCoreNo: generateCoreId(nextSeq), // Fixed naming here
      value1000: '', value3000: '', value5000: '', value7000: '',
      singleValue: '',
      dynamicValues: {},
      remark: '',
      isReplacement: true,
      replacedCoreId: failedRow.internalCoreNo,
    };

    setRows(updatedRows);
  };



  // const handleReplaceCore = (index: number) => {
  //   const failedRow = rows[index];

  //   // Create the replacement ID by adding an 'R'
  //   // Example: M-25015-001 becomes M-25015-001-R1
  //   const currentId = failedRow.internalCoreNo;
  //   const replacementId = `${currentId}-R`; 

  //   const updatedRows = [...rows];
  //   updatedRows[index] = {
  //     ...initializeRows()[0], // Get a clean object structure
  //     date: getSystemDate(),
  //     internalCoreNo: replacementId,
  //     isReplacement: true,
  //     replacedCoreId: currentId,
  //     remark: ''
  //   };

  //   setRows(updatedRows);
  // };


  //-------------------------------update -4
  // const addRow = () => {
  //   const nextSeq = getNextSequenceNumber(rows);
  //   setRows([...rows, {
  //     date: getSystemDate(),
  //     coreVendorNo: '',
  //     internalCoreNo: generateUniqueCoreId(nextSeq, coreType, order.orderId),
  //     value1000: '', value3000: '', value5000: '', value7000: '',
  //     singleValue: '',
  //     dynamicValues: {},
  //     remark: '',
  //   }]);
  // };

  // -------------------------------------------

  const addRow = () => {
    const nextSeq = getNextSequenceNumber(rows);
    setRows([...rows, {
      date: getSystemDate(),
      coreVendorNo: '',
      internalCoreNo: generateCoreId(nextSeq), // Fixed naming here
      value1000: '',
      value3000: '',
      value5000: '',
      value7000: '',
      singleValue: '',
      dynamicValues: {},
      remark: '',
    }]);
  };



  // const handleSave = async () => {
  //   try {
  //     // 1. Determine the path and type
  //     const isMetering = coreType === 'Metering';
  //     const isPS = coreType === 'PS';
  //     const isProtection = coreType === 'Protection';

  //     // Segregate Endpoint: Metering goes to its own, others go to protection-tests
  //     const endpoint = isMetering ? '/metering-tests' : '/protection-tests';

  //     let finalPayload = {
  //       // orderId: order._id, // Ensure this is mapped for all types
  //       coreType: coreType,  // Dynamically sets "Metering", "Protection", or "PS"
  //       testedBy: testBy,
  //       authorisedBy: authorizedSignatory,
  //       testSetup: {
  //         // Metering uses coreTypeNano, Protection/PS uses description/M4CRGO logic
  //         [isMetering ? 'coreMaterial' : 'description']: isMetering
  //           ? coreTypeNano
  //           : (isProtection ? protectionCoreTypeM4CRGO : "PS Core Material"),
  //         coreSizeMm: {
  //           id: parseFloat(specs.coreSize1),
  //           od: parseFloat(specs.coreSize2),
  //           height: parseFloat(specs.coreSize3)
  //         },
  //         turnsUsed: parseInt(specs.turnUsed),
  //         areaSqCm: parseFloat(specs.area),
  //         mmp: parseFloat(specs.mmp)
  //       }
  //     };

  //     // 2. Segregate Schema-Specific Data
  //     if (isMetering) {
  //       // --- METERING SPECIFIC FIELDS ---
  //       finalPayload.testLimits = {
  //         bsatGauss: bsatColumns.map(col => parseFloat(col.bsatValue)),
  //         setMilliVolt: bsatColumns.map(col => parseFloat(col.setMvValue)),
  //         leLimitMa: bsatColumns.map(col => parseFloat(col.leLimitValue))
  //       };

  //       finalPayload.readings = rows
  //         .filter(row => row.internalCoreNo && row.remark)
  //         .map(row => ({
  //           date: row.date ? new Date(row.date) : new Date(),
  //           vendorCoreNo: row.coreVendorNo,
  //           internalCoreNo: row.internalCoreNo,
  //           measuredMa: bsatColumns.map(col => parseFloat(row.dynamicValues[col.id] || 0)),
  //           result: row.remark
  //         }));
  //     } else {
  //       // --- PROTECTION & PS SPECIFIC FIELDS ---
  //       finalPayload.testSpecification = {
  //         fluxTesla: parseFloat(specs.bFlux || 0),
  //         voltageV: parseFloat(specs.voltage || 0),
  //         iexLimitMa: isPS ? parseFloat(specs.iexLimit) : parseFloat(protectionLimit)
  //       };

  //       finalPayload.readings = rows
  //         .filter(row => row.internalCoreNo && row.remark)
  //         .map(row => ({
  //           date: row.date ? new Date(row.date) : new Date(),
  //           vendorCoreNo: row.coreVendorNo,
  //           internalCoreNo: row.internalCoreNo,
  //           // Both PS and Protection save to a single 'value' field in the schema
  //           value: parseFloat(row.singleValue || Object.values(row.dynamicValues)[0] || 0),
  //           result: row.remark
  //         }));
  //     }

  //     // 3. Send Request
  //     const response = await axios.post(`http://localhost:3002${endpoint}`, finalPayload, {
  //       withCredentials: true,
  //       headers: { 'Content-Type': 'application/json' }
  //     });

  //     if (response.status === 201 || response.status === 200) {
  //       alert(`${coreType} Data Saved Successfully!`);
  //     }

  //   } catch (error) {
  //     console.error("Save Error:", error);
  //     const errorMsg = error.response?.data?.message || error.message;
  //     alert(`Error saving ${coreType} report: ${errorMsg}`);
  //   }
  // };




  // const handleSave = async () => {
  //   try {
  //     const isMetering = coreType === 'Metering';
  //     const isPS = coreType === 'PS';

  //     // 1. AUTO-FILL MISSING IDs
  //     // If the user didn't type the ID (because they saw the placeholder), we populate it now.
  //     const processedRows = rows.map((row, index) => {
  //       const hasValues = Object.values(row.dynamicValues || {}).some(v => v !== '' && v !== null && v !== undefined);
  //       let currentId = row.internalCoreNo && String(row.internalCoreNo).trim() !== '' ? row.internalCoreNo : '';

  //       // RELAXED CONDITION: If no ID but has values, generate the ID regardless of order quantity
  //       if (!currentId && hasValues) {
  //         currentId = generateCoreId(index + 1);
  //       }

  //       // Auto-calculate remark if missing but values exist (Fix for missing remarks)
  //       let remark = row.remark;
  //       if (hasValues && !remark) {
  //         remark = calculateRemark({ ...row, internalCoreNo: currentId });
  //       }

  //       return { ...row, internalCoreNo: currentId, remark };
  //     });

  //     // Update state so the UI reflects the real values instead of placeholders
  //     setRows(processedRows);

  //     // 2. FILTER VALID READINGS
  //     // Check for ID and verify that at least one test value has been entered
  //     const validReadings = processedRows.filter((row) => {
  //       const hasId = row.internalCoreNo && String(row.internalCoreNo).trim() !== '';
  //       const hasValues = Object.values(row.dynamicValues || {}).some(v => v !== '' && v !== null && v !== undefined);
  //       return hasId && hasValues;
  //     });

  //     if (validReadings.length === 0) {
  //       alert("No data to save. Please enter Internal Core Nos and test readings.");
  //       return;
  //     }

  //     const endpoint = isMetering ? '/metering-tests' : '/protection-tests';

  //     // SAFE ORDER ID ACCESS
  //     // Check _id (Mongo), id (string fallback), or orderId (string fallback)
  //     const txnOrderId = (order as any)._id || order.id;

  //     if (!txnOrderId) {
  //       console.error("Missing Order ID:", order);
  //       alert("Critical Error: Order ID is missing. Cannot save report.");
  //       return;
  //     }

  //     let finalPayload: any = {
  //       orderId: txnOrderId, // Sending the MongoDB ObjectID
  //       coreType: coreType,
  //       testedBy: testBy,
  //       authorisedBy: authorizedSignatory,
  //       testSetup: {
  //         [isMetering ? 'coreMaterial' : 'description']: isMetering
  //           ? coreTypeNano
  //           : (coreType === 'Protection' ? protectionCoreTypeM4CRGO : "PS Core Material"),
  //         coreSizeMm: {
  //           id: parseFloat(specs.coreSize1) || 0,
  //           od: parseFloat(specs.coreSize2) || 0,
  //           height: parseFloat(specs.coreSize3) || 0
  //         },
  //         turnsUsed: parseInt(specs.turnUsed) || 0,
  //         areaSqCm: parseFloat(specs.area) || 0,
  //         mmp: parseFloat(specs.mmp) || 0
  //       }
  //     };

  //     // Parse Date for Backend
  //     const [day, month, year] = testDate.split('/');
  //     const formattedDate = new Date(`${year}-${month}-${day}`);

  //     if (isMetering) {
  //       finalPayload.testLimits = {
  //         bsatGauss: bsatColumns.map(col => parseFloat(col.bsatValue) || 0),
  //         setMilliVolt: bsatColumns.map(col => parseFloat(col.setMvValue) || 0),
  //         leLimitMa: bsatColumns.map(col => parseFloat(col.leLimitValue) || 0)
  //       };

  //       finalPayload.readings = validReadings.map(row => {
  //         const remark = row.remark || calculateRemark(row);
  //         return {
  //           date: formattedDate, // Use parsed Date object
  //           vendorCoreNo: row.coreVendorNo,
  //           internalCoreNo: row.internalCoreNo,
  //           // Map dynamic values using the actual BSAT column sequence
  //           measuredMa: bsatColumns.map(col => parseFloat(row.dynamicValues[col.id]) || 0),
  //           // Ensure result is strictly "P" or "F". Default to "F" if undetermined but data exists.
  //           result: (remark === "P" || remark === "F") ? remark : "F"
  //         };
  //       });
  //     } else {
  //       finalPayload.testSpecification = {
  //         fluxTesla: parseFloat(specs.bFlux) || 0,
  //         voltageV: parseFloat(specs.voltage) || 0,
  //         iexLimitMa: isPS ? parseFloat(specs.iexLimit) : 600 // using default protection limit
  //       };

  //       finalPayload.readings = validReadings.map(row => {
  //         const remark = row.remark || calculateRemark(row);
  //         return {
  //           date: formattedDate, // Use parsed Date object
  //           vendorCoreNo: row.coreVendorNo,
  //           internalCoreNo: row.internalCoreNo,
  //           value: parseFloat(row.singleValue || Object.values(row.dynamicValues)[0] || 0),
  //           result: (remark === "P" || remark === "F") ? remark : "F"
  //         };
  //       });
  //     }

  //     // DEBUG: Log the payload to your browser console to verify it before sending
  //     console.log("Saving Payload [DEBUG]:", JSON.stringify(finalPayload, null, 2));

  //     const response = await axios.post(`http://localhost:3002${endpoint}`, finalPayload, {
  //       withCredentials: true,
  //       headers: { 'Content-Type': 'application/json' }
  //     });

  //     if (response.status === 201 || response.status === 200) {
  //       alert(`${coreType} Data Saved Successfully!`);
  //     }

  //   } catch (error: any) {
  //     console.error("Save Error:", error);
  //     const errorMsg = error.response?.data?.message || error.message;
  //     const validationErr = error.response?.data?.error || '';
  //     alert(`Error saving report: ${errorMsg} ${validationErr ? `(${validationErr})` : ''}`);
  //   }
  // };



  const handleSave = async () => {
  try {
    const isMetering = coreType === 'Metering';
    const isPS = coreType === 'PS';

    // 1. AUTO-FILL IDs & CALCULATE REMARKS
    const processedRows = rows.map((row, index) => {
      // FIX: Check both dynamicValues AND singleValue
      const hasDynValues = Object.values(row.dynamicValues || {}).some(v => v !== '' && v !== null);
      const hasSingleValue = row.singleValue !== '' && row.singleValue !== null;
      const hasAnyValue = hasDynValues || hasSingleValue;

      let currentId = row.internalCoreNo && String(row.internalCoreNo).trim() !== '' ? row.internalCoreNo : '';

      // Auto-fill ID if user saw placeholder but didn't type
      if (!currentId && hasAnyValue) {
        currentId = generateCoreId(index + 1);
      }

      let remark = row.remark;
      if (hasAnyValue && !remark) {
        remark = calculateRemark({ ...row, internalCoreNo: currentId });
      }

      return { ...row, internalCoreNo: currentId, remark };
    });

    setRows(processedRows);

    // 2. FILTER VALID READINGS
    const validReadings = processedRows.filter((row) => {
      const hasId = row.internalCoreNo && String(row.internalCoreNo).trim() !== '';
      const hasDynValues = Object.values(row.dynamicValues || {}).some(v => v !== '' && v !== null);
      const hasSingleValue = row.singleValue !== '' && row.singleValue !== null;
      return hasId && (hasDynValues || hasSingleValue); // Include row if it has any data
    });

    if (validReadings.length === 0) {
      alert("No data to save. Please enter Internal Core Nos and test readings.");
      return;
    }

    // 3. CONVERT DATE (Fixes the "Cast to date failed" error)
    const [day, month, year] = testDate.split('/');
    const formattedDate = new Date(`${year}-${month}-${day}`);

    const endpoint = isMetering ? '/metering-tests' : '/protection-tests';
    const txnOrderId = (order as any)._id || order.id;

    let finalPayload: any = {
      orderId: txnOrderId,
      coreType: coreType,
      testedBy: testBy,
      authorisedBy: authorizedSignatory,
      testSetup: {
        [isMetering ? 'coreMaterial' : 'description']: isMetering
          ? coreTypeNano
          : (coreType === 'Protection' ? protectionCoreTypeM4CRGO : "PS Core Material"),
        coreSizeMm: {
          id: parseFloat(specs.coreSize1) || 0,
          od: parseFloat(specs.coreSize2) || 0,
          height: parseFloat(specs.coreSize3) || 0
        },
        turnsUsed: parseInt(specs.turnUsed) || 0,
        areaSqCm: parseFloat(specs.area) || 0,
        mmp: parseFloat(specs.mmp) || 0
      },
      readings: validReadings.map(row => ({
        date: formattedDate,
        vendorCoreNo: row.coreVendorNo,
        internalCoreNo: row.internalCoreNo,
        // For Protection/PS, use value; for Metering, use measuredMa
        ...(isMetering 
            ? { measuredMa: bsatColumns.map(col => parseFloat(row.dynamicValues[col.id]) || 0) }
            : { value: parseFloat(row.singleValue || Object.values(row.dynamicValues)[0] || 0) }
        ),
        result: row.remark || "F"
      }))
    };

    if (isMetering) {
      finalPayload.testLimits = {
        bsatGauss: bsatColumns.map(col => parseFloat(col.bsatValue) || 0),
        setMilliVolt: bsatColumns.map(col => parseFloat(col.setMvValue) || 0),
        leLimitMa: bsatColumns.map(col => parseFloat(col.leLimitValue) || 0)
      };
    } else {
      finalPayload.testSpecification = {
        fluxTesla: parseFloat(specs.bFlux) || 0,
        voltageV: parseFloat(specs.voltage) || 0,
        iexLimitMa: isPS ? parseFloat(specs.iexLimit) : 600
      };
    }

    await axios.post(`http://localhost:3002${endpoint}`, finalPayload, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' }
    });

    alert(`${coreType} Data Saved Successfully!`);

  } catch (error: any) {
    console.error("Save Error:", error);
    alert(`Error: ${error.response?.data?.message || error.message}`);
  }
};

  const getFilledRowsCount = () => {
    // For Protection, PS, and Metering, check if any dynamic values are filled
    return rows.filter(row => {
      if (!row.internalCoreNo) return false;
      const hasAnyValue = Object.values(row.dynamicValues).some(v => v !== '');
      return hasAnyValue;
    }).length;
  };

  const getPassFailCount = () => {
    const passed = rows.filter(row => row.remark === 'P').length;
    const failed = rows.filter(row => row.remark === 'F').length;
    return { passed, failed };
  };

  const getPassedCores = () => {
    return rows.filter(row => row.remark === 'P' && row.internalCoreNo);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handlePrintLabels = () => {
    const passedCores = getPassedCores();
    if (passedCores.length === 0) {
      alert('No passed cores to print labels for!');
      return;
    }
    setShowPrintLabels(true);
  };

  const { passed, failed } = getPassFailCount();

  if (showPrintLabels) {
    return (
      <CoreLabelsPrint
        cores={getPassedCores()}
        order={order}
        coreType={coreType}
        onBack={() => setShowPrintLabels(false)}
      />
    );
  }

  if (showFailedCores) {
    return (
      <FailedCoresManager
        failedCores={failedCores}
        onBack={() => setShowFailedCores(false)}
      />
    );
  }

  // Protection Core Template
  if (isProtectionCore) {
    // Protection Configuration Screen
    if (!protectionConfigured) {
      const addBColumn = () => {
        const newId = String(protectionBColumns.length + 1);
        setProtectionBColumns([...protectionBColumns, { id: newId, bsatValue: '', setMvValue: '', leLimitValue: '' }]);
      };

      const removeBColumn = (id: string) => {
        if (protectionBColumns.length > 1) {
          setProtectionBColumns(protectionBColumns.filter(col => col.id !== id));
        }
      };

      const updateBColumn = (id: string, field: keyof BSATColumn, value: string) => {
        setProtectionBColumns(protectionBColumns.map(col =>
          col.id === id ? { ...col, [field]: value } : col
        ));
      };

      const handleProtectionConfigSave = () => {
        // Validate that all fields are filled
        const allFilled = protectionBColumns.every(col =>
          col.bsatValue && col.setMvValue && col.leLimitValue
        ) && specs.coreSize1 && specs.coreSize2 && specs.coreSize3 && specs.turnUsed;

        if (!allFilled) {
          alert('Please fill in all Protection configuration fields');
          return;
        }

        setProtectionConfigured(true);
        alert('Configuration saved successfully! You can now enter core testing data.');
      };

      return (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="outline"
                onClick={onBack}
                size="sm"
                className="mb-2 gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                Back
              </Button>
              <h2 className="text-xl">Protection Core Configuration</h2>
              <p className="text-sm text-gray-600 mt-1">
                {order.jobId} - {order.clientName} • Configure testing parameters before entering core data
              </p>
            </div>
          </div>

          {/* Configuration Form */}
          <Card className="p-6">
            <h3 className="text-lg mb-4 pb-3 border-b">Testing Configuration</h3>

            {/* M4CRGO and Turns */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <Label htmlFor="protectionCoreType">M4CRGO</Label>
                <Select value={protectionCoreTypeM4CRGO} onValueChange={(value: any) => setProtectionCoreTypeM4CRGO(value)}>
                  <SelectTrigger id="protectionCoreType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M4CRGO">M4CRGO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="turnUsed">TURN USED FOR TESTING</Label>
                <Select value={specs.turnUsed} onValueChange={(value) => handleSpecChange('turnUsed', value)}>
                  <SelectTrigger id="turnUsed">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="40">40</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Core Size Fields */}
            <div className="mb-6">
              <Label className="mb-3 block">CORE SIZE (ID, OD, HT in mm)</Label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="coreSize1" className="text-xs text-gray-600">ID (Inner Diameter)</Label>
                  <Input
                    id="coreSize1"
                    value={specs.coreSize1}
                    onChange={(e) => handleSpecChange('coreSize1', e.target.value)}
                    placeholder="85"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="coreSize2" className="text-xs text-gray-600">OD (Outer Diameter)</Label>
                  <Input
                    id="coreSize2"
                    value={specs.coreSize2}
                    onChange={(e) => handleSpecChange('coreSize2', e.target.value)}
                    placeholder="185"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="coreSize3" className="text-xs text-gray-600">HT (Height)</Label>
                  <Input
                    id="coreSize3"
                    value={specs.coreSize3}
                    onChange={(e) => handleSpecChange('coreSize3', e.target.value)}
                    placeholder="85"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* B (Flux) Columns Configuration */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base">B (Flux in Tesla) Testing Columns</Label>
                <Button onClick={addBColumn} size="sm" variant="outline" className="gap-1">
                  <Plus className="w-3 h-3" />
                  Add Column
                </Button>
              </div>

              <div className="space-y-3">
                {protectionBColumns.map((column, index) => (
                  <Card key={column.id} className="p-4 bg-gray-50">
                    <div className="flex items-end gap-3">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div>
                          <Label htmlFor={`b-flux-${column.id}`} className="text-xs">B (Flux in Tesla)</Label>
                          <Input
                            id={`b-flux-${column.id}`}
                            value={column.bsatValue}
                            onChange={(e) => updateBColumn(column.id, 'bsatValue', e.target.value)}
                            placeholder="1.5"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`voltage-${column.id}`} className="text-xs">Voltage (V)</Label>
                          <Input
                            id={`voltage-${column.id}`}
                            value={column.setMvValue}
                            onChange={(e) => updateBColumn(column.id, 'setMvValue', e.target.value)}
                            placeholder="7.04"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`lex-limit-${column.id}`} className="text-xs">Lex Limit (mA)</Label>
                          <Input
                            id={`lex-limit-${column.id}`}
                            value={column.leLimitValue}
                            onChange={(e) => updateBColumn(column.id, 'leLimitValue', e.target.value)}
                            placeholder="1696"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      {protectionBColumns.length > 1 && (
                        <Button
                          onClick={() => removeBColumn(column.id)}
                          size="sm"
                          variant="outline"
                          className="gap-1 border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button onClick={handleProtectionConfigSave} className="gap-2 bg-[#003a70] hover:bg-[#002a50]">
                <Save className="w-4 h-4" />
                Save Configuration
              </Button>
            </div>
          </Card>

          {/* Help Card */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex gap-3">
              <div className="text-blue-600 mt-1">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Configuration Instructions</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Select M4CRGO as core type and turns used for testing</li>
                  <li>• Enter core dimensions (ID, OD, HT) in millimeters</li>
                  <li>• Configure B (Flux in Tesla) testing columns with corresponding Voltage (V) and Lex Limit (mA) values</li>
                  <li>• For Protection cores, typically only 1 B (flux) column is used (unlike Metering which uses 4 BSAT values)</li>
                  <li>• Add or remove B columns as needed for your testing requirements</li>
                  <li>• After saving, you'll be able to enter the actual core testing data</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    // Protection Testing Form (after configuration)
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="outline"
              onClick={onBack}
              size="sm"
              className="mb-2 gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Back
            </Button>
            <h2 className="text-xl">Core Testing Report - Protection</h2>
            <p className="text-sm text-gray-600 mt-1">
              {order.jobId} - {order.clientName}
            </p>
          </div>
          <div className="flex gap-2">
            {protectionConfigured && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1 border-blue-300 text-blue-600 hover:bg-blue-50"
                onClick={() => setProtectionConfigured(false)}
              >
                <Edit className="w-3 h-3" />
                Edit Config
              </Button>
            )}
            {failedCores.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1 border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => setShowFailedCores(true)}
              >
                <AlertTriangle className="w-3 h-3" />
                View Failed ({failedCores.length})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={handlePrintReport}
            >
              <Printer className="w-3 h-3" />
              Print Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 border-green-300 text-green-600 hover:bg-green-50"
              onClick={handlePrintLabels}
              disabled={getPassedCores().length === 0}
            >
              <Tag className="w-3 h-3" />
              Print Labels ({getPassedCores().length})
            </Button>
            <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700" onClick={handleSave}>
              <Save className="w-3 h-3" />
              Save All
            </Button>
          </div>
        </div>

        {/* Progress */}
        <Card className="p-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Cores Tested: <span className="font-medium text-gray-900">{getFilledRowsCount()} / {order.transformerQuantity}</span></span>
              <span className="flex items-center gap-1 text-green-600">
                <Check className="w-4 h-4" />
                Pass: <span className="font-medium">{passed}</span>
              </span>
              <span className="flex items-center gap-1 text-red-600">
                <X className="w-4 h-4" />
                Fail: <span className="font-medium">{failed}</span>
              </span>
              {failedCores.length > 0 && (
                <span className="flex items-center gap-1 text-orange-600">
                  <AlertTriangle className="w-4 h-4" />
                  Replaced: <span className="font-medium">{failedCores.length}</span>
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Protection Core Testing Form */}
        <Card className="overflow-x-auto shadow-sm">
          <div className="min-w-full">
            <table className="w-full border-collapse text-sm">
              <tbody>
                {/* Title Row */}
                <tr>
                  <td colSpan={3} className="bg-gradient-to-r from-cyan-100 to-blue-100 p-4 border border-gray-400 text-center font-bold text-base">
                    Toroidal Core Testing
                  </td>
                  <td colSpan={protectionBColumns.length + 1} className="bg-gradient-to-r from-cyan-100 to-blue-100 p-4 border border-gray-400 text-center font-bold text-base">
                    {protectionCoreTypeM4CRGO}
                  </td>
                </tr>

                {/* Description Row */}
                <tr>
                  <td className="bg-amber-50 p-3 border border-gray-400 font-semibold text-gray-700">
                    Description
                  </td>
                  <td colSpan={protectionBColumns.length + 3} className="bg-white p-3 border border-gray-400"></td>
                </tr>

                {/* Core Size Row */}
                <tr>
                  <td className="bg-emerald-50 p-3 border border-gray-400 font-semibold text-gray-700">
                    CORE SIZE IN MM
                  </td>
                  <td className="bg-white p-3 border border-gray-400 text-center font-medium">
                    {specs.coreSize1}
                  </td>
                  <td className="bg-white p-3 border border-gray-400 text-center font-medium">
                    {specs.coreSize2}
                  </td>
                  <td className="bg-white p-3 border border-gray-400 text-center font-medium">
                    {specs.coreSize3}
                  </td>
                  <td colSpan={protectionBColumns.length} className="bg-emerald-50 p-3 border border-gray-400 text-center font-semibold text-gray-700">
                    ID - OD - HT
                  </td>
                </tr>

                {/* Turn Used Row */}
                <tr>
                  <td className="bg-amber-50 p-3 border border-gray-400 font-semibold text-gray-700">
                    TURN USED FOR TESTING
                  </td>
                  <td colSpan={protectionBColumns.length + 3} className="bg-white p-3 border border-gray-400 text-center font-medium">
                    {specs.turnUsed} turns
                  </td>
                </tr>

                {/* Specification Section Header */}
                <tr>
                  <td colSpan={protectionBColumns.length + 4} className="bg-slate-100 p-2 border border-gray-400">
                    <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Specification</div>
                  </td>
                </tr>

                {/* Area */}
                <tr>
                  <td className="bg-gray-50 p-3 border border-gray-400 font-medium text-gray-600">
                    Area (Sq cm)
                  </td>
                  <td colSpan={protectionBColumns.length + 3} className="bg-white p-3 border border-gray-400 font-medium">
                    {specs.area}
                  </td>
                </tr>

                {/* MMP */}
                <tr>
                  <td className="bg-gray-50 p-3 border border-gray-400 font-medium text-gray-600">
                    MMP (cm)
                  </td>
                  <td colSpan={protectionBColumns.length + 3} className="bg-white p-3 border border-gray-400 font-medium">
                    {specs.mmp}
                  </td>
                </tr>

                {/* B(G) - Flux Density Row */}
                <tr>
                  <td rowSpan={3} className="bg-gray-100 p-3 border border-gray-400 font-medium text-gray-600 text-center align-middle">
                    Specification
                  </td>
                  <td className="bg-white p-3 border border-gray-400 font-medium text-gray-700">
                    B(G)
                  </td>
                  <td colSpan={2} className="bg-white p-3 border border-gray-400"></td>
                  {protectionBColumns.map(column => (
                    <td key={column.id} className="bg-amber-50 p-3 border border-gray-400 text-center font-bold text-gray-700">
                      {column.bsatValue}
                    </td>
                  ))}
                  <td className="bg-white p-3 border border-gray-400"></td>
                </tr>

                {/* SET mV - Voltage Row */}
                <tr>
                  <td className="bg-blue-100 p-3 border border-gray-400 font-medium text-gray-700">
                    SET mV
                  </td>
                  <td colSpan={2} className="bg-white p-3 border border-gray-400"></td>
                  {protectionBColumns.map(column => (
                    <td key={column.id} className="bg-blue-50 p-3 border border-gray-400 text-center font-medium text-gray-700">
                      {column.setMvValue}
                    </td>
                  ))}
                  <td className="bg-white p-3 border border-gray-400"></td>
                </tr>

                {/* LE LIMIT in mA - Limit Row */}
                <tr>
                  <td className="bg-white p-3 border border-gray-400 font-medium text-gray-700">
                    LE LIMIT in mA.
                  </td>
                  <td colSpan={2} className="bg-white p-3 border border-gray-400"></td>
                  {protectionBColumns.map(column => (
                    <td key={column.id} className="bg-white p-3 border border-gray-400 text-center font-medium text-gray-700">
                      {column.leLimitValue}
                    </td>
                  ))}
                  <td className="bg-blue-100 p-3 border border-gray-400 text-center font-medium text-gray-700">
                    Remark
                  </td>
                </tr>

                {/* Column Headers - Data Entry Section */}
                <tr className="bg-gray-100">
                  <td className="p-3 border border-gray-400 font-semibold text-gray-700 text-center text-xs">Date</td>
                  <td className="p-3 border border-gray-400 font-semibold text-gray-700 text-center text-xs">Vendor core No.</td>
                  <td colSpan={2} className="p-3 border border-gray-400 font-semibold text-gray-700 text-center text-xs">Internal core No.</td>
                  {protectionBColumns.map(column => (
                    <td key={column.id} className="p-3 border border-gray-400 font-semibold text-gray-700 text-center text-xs bg-amber-50">
                      {column.bsatValue}
                    </td>
                  ))}
                  <td className="p-3 border border-gray-400 font-semibold text-gray-700 text-center text-xs">Remark</td>
                </tr>

                {/* Data Entry Rows */}
                {rows.map((row, index) => (
                  <tr key={index} className={`hover:bg-gray-50 transition-colors ${row.isReplacement ? 'bg-blue-50' : 'bg-white'}`}>
                    {/* <td className="p-2 border border-gray-300">
                      <Input
                        value={row.date}
                        onChange={(e) => handleRowChange(index, 'date', e.target.value)}
                        className="w-full h-8 text-xs border-0 focus:ring-1 focus:ring-blue-300 text-center"
                        placeholder="DD/MM/YY"
                      />
                    </td> */}
                    <td className="bg-white p-3 border border-gray-400 text-center font-medium">
                      <Input
                        value={testDate} // Use the state variable
                        onChange={(e) => setTestDate(e.target.value)} // Allow manual changes if needed
                        className="w-28 h-7 text-xs border-gray-300 text-center mx-auto"
                      />
                    </td>
                    <td className="p-2 border border-gray-300">
                      <Input
                        value={String(row.coreVendorNo || '')}
                        onChange={(e) => handleRowChange(index, 'coreVendorNo', e.target.value)}
                        className="w-full h-8 text-xs border-0 focus:ring-1 focus:ring-blue-300 text-center"
                        placeholder="16"
                      />
                    </td>
                    <td colSpan={2} className="p-2 border border-gray-300">
                      <div className="flex items-center gap-1">
                        <Input
          value={String(row.internalCoreNo || '')}
          onChange={(e) => handleRowChange(index, 'internalCoreNo', e.target.value)}
          className="flex-1 h-8 text-xs border-0 focus:ring-1 focus:ring-blue-500 font-mono font-bold text-gray-900"
          placeholder={generateCoreId(index + 1)}
        />
                        {row.isReplacement && (
                          <span className="text-xs text-blue-600 font-semibold whitespace-nowrap px-1 py-0.5 bg-blue-100 rounded">(R)</span>
                        )}
                      </div>
                    </td>
                    {protectionBColumns.map(column => (
                      <td key={column.id} className="p-2 border border-gray-300 bg-white">
                        <Input
                          value={String(row.dynamicValues[column.id] || '')}
                          onChange={(e) => handleRowChange(index, 'dynamicValues', { ...row.dynamicValues, [column.id]: e.target.value })}
                          className={`w-full h-8 text-xs border-0 focus:ring-1 focus:ring-blue-300 text-center font-medium ${row.dynamicValues[column.id] && parseFloat(row.dynamicValues[column.id]) > parseFloat(column.leLimitValue) ? 'bg-red-50 text-red-700' : ''
                            }`}
                          placeholder="9.5"
                        />
                      </td>
                    ))}
                    <td className="p-2 border border-gray-300">
                      <div className="flex items-center justify-center gap-2">
                        <div className={`min-w-[2rem] h-8 flex items-center justify-center font-medium text-xs ${row.remark === 'P' ? 'text-green-700' :
                          row.remark === 'F' ? 'text-red-600' : 'text-gray-400'
                          }`}>
                          {row.remark}
                        </div>
                        {row.remark === 'F' && !row.isReplacement && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReplaceCore(index)}
                            className="h-7 px-2 text-xs gap-1 border-orange-300 text-orange-600 hover:bg-orange-50"
                            title="Replace this failed core"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Replace
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Footer - Signatures */}
                <tr className="bg-slate-50">
                  <td colSpan={2} className="p-6 border border-gray-400">
                    <div>
                      <div className="text-xs text-gray-500 mb-3 font-medium">Test by</div>
                      <Input
                        value={testBy}
                        onChange={(e) => setTestBy(e.target.value)}
                        className="w-full h-10 border-b-2 border-t-0 border-x-0 rounded-none px-0 focus:ring-0 focus:border-blue-500"
                        placeholder="Enter name"
                      />
                    </div>
                  </td>
                  <td colSpan={protectionBColumns.length + 3} className="p-6 border border-gray-400">
                    <div>
                      <div className="text-xs text-gray-500 mb-3 font-medium">Authorised Signatory</div>
                      <Input
                        value={authorizedSignatory}
                        onChange={(e) => setAuthorizedSignatory(e.target.value)}
                        className="w-full h-10 border-b-2 border-t-0 border-x-0 rounded-none px-0 focus:ring-0 focus:border-blue-500"
                        placeholder="Enter name"
                      />
                    </div>
                  </td>
                </tr>

                {/* For Advent Engineers */}
                <tr>
                  <td colSpan={protectionBColumns.length + 5} className="p-3 border border-gray-400 text-right font-semibold text-sm text-gray-700 bg-slate-50">
                    For Advent Engineers
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Add More Rows Button */}
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={addRow} className="gap-1">
            <Plus className="w-3 h-3" />
            Add More Rows
          </Button>
        </div>

        {/* Completion Summary */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900">Testing Summary</h4>
              <p className="text-sm text-blue-700 mt-1">
                {getFilledRowsCount()} cores tested out of {order.transformerQuantity} total
                {failedCores.length > 0 && ` • ${failedCores.length} cores replaced`}
              </p>
            </div>
            {getFilledRowsCount() === order.transformerQuantity && (
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <span className="font-medium">Complete</span>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // PS Core Template (Exact replica of Protection Core)
  if (isPSCore) {
    // PS Configuration Screen
    if (!psConfigured) {
      const addBColumn = () => {
        const newId = String(psBColumns.length + 1);
        setPsBColumns([...psBColumns, { id: newId, bsatValue: '', setMvValue: '', leLimitValue: '' }]);
      };

      const removeBColumn = (id: string) => {
        if (psBColumns.length > 1) {
          setPsBColumns(psBColumns.filter(col => col.id !== id));
        }
      };

      const updateBColumn = (id: string, field: keyof BSATColumn, value: string) => {
        setPsBColumns(psBColumns.map(col =>
          col.id === id ? { ...col, [field]: value } : col
        ));
      };

      const handlePSConfigSave = () => {
        // Validate that all fields are filled
        const allFilled = psBColumns.every(col =>
          col.bsatValue && col.setMvValue && col.leLimitValue
        ) && specs.coreSize1 && specs.coreSize2 && specs.coreSize3 && specs.turnUsed;

        if (!allFilled) {
          alert('Please fill in all PS configuration fields');
          return;
        }

        setPsConfigured(true);
        alert('Configuration saved successfully! You can now enter core testing data.');
      };

      return (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="outline"
                onClick={onBack}
                size="sm"
                className="mb-2 gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                Back
              </Button>
              <h2 className="text-xl">PS Core Configuration</h2>
              <p className="text-sm text-gray-600 mt-1">
                {order.jobId} - {order.clientName} • Configure testing parameters before entering core data
              </p>
            </div>
          </div>

          {/* Configuration Form */}
          <Card className="p-6">
            <h3 className="text-lg mb-4 pb-3 border-b">Testing Configuration</h3>

            {/* M4CRGO and Turns */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <Label htmlFor="psCoreType">M4CRGO</Label>
                <Select value={psCoreTypeM4CRGO} onValueChange={(value: any) => setPsCoreTypeM4CRGO(value)}>
                  <SelectTrigger id="psCoreType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M4CRGO">M4CRGO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="turnUsed">TURN USED FOR TESTING</Label>
                <Select value={specs.turnUsed} onValueChange={(value) => handleSpecChange('turnUsed', value)}>
                  <SelectTrigger id="turnUsed">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="40">40</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Core Size Fields */}
            <div className="mb-6">
              <Label className="mb-3 block">CORE SIZE (ID, OD, HT in mm)</Label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="coreSize1" className="text-xs text-gray-600">ID (Inner Diameter)</Label>
                  <Input
                    id="coreSize1"
                    value={specs.coreSize1}
                    onChange={(e) => handleSpecChange('coreSize1', e.target.value)}
                    placeholder="110"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="coreSize2" className="text-xs text-gray-600">OD (Outer Diameter)</Label>
                  <Input
                    id="coreSize2"
                    value={specs.coreSize2}
                    onChange={(e) => handleSpecChange('coreSize2', e.target.value)}
                    placeholder="210"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="coreSize3" className="text-xs text-gray-600">HT (Height)</Label>
                  <Input
                    id="coreSize3"
                    value={specs.coreSize3}
                    onChange={(e) => handleSpecChange('coreSize3', e.target.value)}
                    placeholder="60"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* B (Flux) Columns Configuration */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base">B (Flux in Tesla) Testing Columns</Label>
                <Button onClick={addBColumn} size="sm" variant="outline" className="gap-1">
                  <Plus className="w-3 h-3" />
                  Add Column
                </Button>
              </div>

              <div className="space-y-3">
                {psBColumns.map((column, index) => (
                  <Card key={column.id} className="p-4 bg-gray-50">
                    <div className="flex items-end gap-3">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div>
                          <Label htmlFor={`b-flux-${column.id}`} className="text-xs">B (Flux in Tesla)</Label>
                          <Input
                            id={`b-flux-${column.id}`}
                            value={column.bsatValue}
                            onChange={(e) => updateBColumn(column.id, 'bsatValue', e.target.value)}
                            placeholder="1.5"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`voltage-${column.id}`} className="text-xs">Voltage (V)</Label>
                          <Input
                            id={`voltage-${column.id}`}
                            value={column.setMvValue}
                            onChange={(e) => updateBColumn(column.id, 'setMvValue', e.target.value)}
                            placeholder="7.04"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`lex-limit-${column.id}`} className="text-xs">Lex Limit (mA)</Label>
                          <Input
                            id={`lex-limit-${column.id}`}
                            value={column.leLimitValue}
                            onChange={(e) => updateBColumn(column.id, 'leLimitValue', e.target.value)}
                            placeholder="1150"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      {psBColumns.length > 1 && (
                        <Button
                          onClick={() => removeBColumn(column.id)}
                          size="sm"
                          variant="outline"
                          className="gap-1 border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button onClick={handlePSConfigSave} className="gap-2 bg-[#003a70] hover:bg-[#002a50]">
                <Save className="w-4 h-4" />
                Save Configuration
              </Button>
            </div>
          </Card>

          {/* Help Card */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex gap-3">
              <div className="text-blue-600 mt-1">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Configuration Instructions</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Select M4CRGO as core type and turns used for testing</li>
                  <li>• Enter core dimensions (ID, OD, HT) in millimeters</li>
                  <li>• Configure B (Flux in Tesla) testing columns with corresponding Voltage (V) and Lex Limit (mA) values</li>
                  <li>• For PS cores, typically only 1 B (flux) column is used (similar to Protection cores)</li>
                  <li>• Add or remove B columns as needed for your testing requirements</li>
                  <li>• After saving, you'll be able to enter the actual core testing data</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    // PS Testing Form (after configuration)
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="outline"
              onClick={onBack}
              size="sm"
              className="mb-2 gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Back
            </Button>
            <h2 className="text-xl">Core Testing Report - PS</h2>
            <p className="text-sm text-gray-600 mt-1">
              {order.jobId} - {order.clientName}
            </p>
          </div>
          <div className="flex gap-2">
            {psConfigured && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1 border-blue-300 text-blue-600 hover:bg-blue-50"
                onClick={() => setPsConfigured(false)}
              >
                <Edit className="w-3 h-3" />
                Edit Config
              </Button>
            )}
            {failedCores.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1 border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => setShowFailedCores(true)}
              >
                <AlertTriangle className="w-3 h-3" />
                View Failed ({failedCores.length})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={handlePrintReport}
            >
              <Printer className="w-3 h-3" />
              Print Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 border-green-300 text-green-600 hover:bg-green-50"
              onClick={handlePrintLabels}
              disabled={getPassedCores().length === 0}
            >
              <Tag className="w-3 h-3" />
              Print Labels ({getPassedCores().length})
            </Button>
            <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700" onClick={handleSave}>
              <Save className="w-3 h-3" />
              Save All
            </Button>
          </div>
        </div>

        {/* Progress */}
        <Card className="p-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Cores Tested: <span className="font-medium text-gray-900">{getFilledRowsCount()} / {order.transformerQuantity}</span></span>
              <span className="flex items-center gap-1 text-green-600">
                <Check className="w-4 h-4" />
                Pass: <span className="font-medium">{passed}</span>
              </span>
              <span className="flex items-center gap-1 text-red-600">
                <X className="w-4 h-4" />
                Fail: <span className="font-medium">{failed}</span>
              </span>
              {failedCores.length > 0 && (
                <span className="flex items-center gap-1 text-orange-600">
                  <AlertTriangle className="w-4 h-4" />
                  Replaced: <span className="font-medium">{failedCores.length}</span>
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* PS Core Testing Form */}
        <Card className="overflow-x-auto shadow-sm">
          <div className="min-w-full">
            <table className="w-full border-collapse text-sm">
              <tbody>
                {/* Title Row */}
                <tr>
                  <td colSpan={3} className="bg-gradient-to-r from-cyan-100 to-blue-100 p-4 border border-gray-400 text-center font-bold text-base">
                    Toroidal Core Testing
                  </td>
                  <td colSpan={psBColumns.length + 1} className="bg-gradient-to-r from-cyan-100 to-blue-100 p-4 border border-gray-400 text-center font-bold text-base">
                    {psCoreTypeM4CRGO}
                  </td>
                </tr>

                {/* Description Row */}
                <tr>
                  <td className="bg-amber-50 p-3 border border-gray-400 font-semibold text-gray-700">
                    Description
                  </td>
                  <td colSpan={psBColumns.length + 3} className="bg-white p-3 border border-gray-400"></td>
                </tr>

                {/* Core Size Row */}
                <tr>
                  <td className="bg-emerald-50 p-3 border border-gray-400 font-semibold text-gray-700">
                    CORE SIZE IN MM
                  </td>
                  <td className="bg-white p-3 border border-gray-400 text-center font-medium">
                    {specs.coreSize1}
                  </td>
                  <td className="bg-white p-3 border border-gray-400 text-center font-medium">
                    {specs.coreSize2}
                  </td>
                  <td className="bg-white p-3 border border-gray-400 text-center font-medium">
                    {specs.coreSize3}
                  </td>
                  <td colSpan={psBColumns.length} className="bg-emerald-50 p-3 border border-gray-400 text-center font-semibold text-gray-700">
                    ID - OD - HT
                  </td>
                </tr>

                {/* Turn Used Row */}
                <tr>
                  <td className="bg-amber-50 p-3 border border-gray-400 font-semibold text-gray-700">
                    TURN USED FOR TESTING
                  </td>
                  <td colSpan={psBColumns.length + 3} className="bg-white p-3 border border-gray-400 text-center font-medium">
                    {specs.turnUsed} turns
                  </td>
                </tr>

                {/* Specification Section Header */}
                <tr>
                  <td colSpan={psBColumns.length + 4} className="bg-slate-100 p-2 border border-gray-400">
                    <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Specification</div>
                  </td>
                </tr>

                {/* Area */}
                <tr>
                  <td className="bg-gray-50 p-3 border border-gray-400 font-medium text-gray-600">
                    Area (Sq cm)
                  </td>
                  <td colSpan={psBColumns.length + 3} className="bg-white p-3 border border-gray-400 font-medium">
                    {specs.area}
                  </td>
                </tr>

                {/* MMP */}
                <tr>
                  <td className="bg-gray-50 p-3 border border-gray-400 font-medium text-gray-600">
                    MMP (cm)
                  </td>
                  <td colSpan={psBColumns.length + 3} className="bg-white p-3 border border-gray-400 font-medium">
                    {specs.mmp}
                  </td>
                </tr>

                {/* B(G) - Flux Density Row */}
                <tr>
                  <td rowSpan={3} className="bg-gray-100 p-3 border border-gray-400 font-medium text-gray-600 text-center align-middle">
                    Specification
                  </td>
                  <td className="bg-white p-3 border border-gray-400 font-medium text-gray-700">
                    B(G)
                  </td>
                  <td colSpan={2} className="bg-white p-3 border border-gray-400"></td>
                  {psBColumns.map(column => (
                    <td key={column.id} className="bg-amber-50 p-3 border border-gray-400 text-center font-bold text-gray-700">
                      {column.bsatValue}
                    </td>
                  ))}
                  <td className="bg-white p-3 border border-gray-400"></td>
                </tr>

                {/* SET mV - Voltage Row */}
                <tr>
                  <td className="bg-blue-100 p-3 border border-gray-400 font-medium text-gray-700">
                    SET mV
                  </td>
                  <td colSpan={2} className="bg-white p-3 border border-gray-400"></td>
                  {psBColumns.map(column => (
                    <td key={column.id} className="bg-blue-50 p-3 border border-gray-400 text-center font-medium text-gray-700">
                      {column.setMvValue}
                    </td>
                  ))}
                  <td className="bg-white p-3 border border-gray-400"></td>
                </tr>

                {/* LE LIMIT in mA - Limit Row */}
                <tr>
                  <td className="bg-white p-3 border border-gray-400 font-medium text-gray-700">
                    LE LIMIT in mA.
                  </td>
                  <td colSpan={2} className="bg-white p-3 border border-gray-400"></td>
                  {psBColumns.map(column => (
                    <td key={column.id} className="bg-white p-3 border border-gray-400 text-center font-medium text-gray-700">
                      {column.leLimitValue}
                    </td>
                  ))}
                  <td className="bg-blue-100 p-3 border border-gray-400 text-center font-medium text-gray-700">
                    Remark
                  </td>
                </tr>

                {/* Column Headers - Data Entry Section */}
                <tr className="bg-gray-100">
                  <td className="p-3 border border-gray-400 font-semibold text-gray-700 text-center text-xs">Date</td>
                  <td className="p-3 border border-gray-400 font-semibold text-gray-700 text-center text-xs">Vendor core No.</td>
                  <td colSpan={2} className="p-3 border border-gray-400 font-semibold text-gray-700 text-center text-xs">Internal core No.</td>
                  {psBColumns.map(column => (
                    <td key={column.id} className="p-3 border border-gray-400 font-semibold text-gray-700 text-center text-xs bg-amber-50">
                      {column.bsatValue}
                    </td>
                  ))}
                  <td className="p-3 border border-gray-400 font-semibold text-gray-700 text-center text-xs">Remark</td>
                </tr>

                {/* Data Entry Rows */}
                {rows.map((row, index) => (
                  <tr key={index} className={`hover:bg-gray-50 transition-colors ${row.isReplacement ? 'bg-blue-50' : 'bg-white'}`}>
                    {/* <td className="p-2 border border-gray-300">
                      <Input
                        value={row.date}
                        onChange={(e) => handleRowChange(index, 'date', e.target.value)}
                        className="w-full h-8 text-xs border-0 focus:ring-1 focus:ring-blue-300 text-center"
                        placeholder="DD/MM/YY"
                      />
                    </td> */}
                    <td className="bg-white p-3 border border-gray-400 text-center font-medium">
                      <Input
                        value={testDate} // Use the state variable
                        onChange={(e) => setTestDate(e.target.value)} // Allow manual changes if needed
                        className="w-28 h-7 text-xs border-gray-300 text-center mx-auto"
                      />
                    </td>
                    <td className="p-2 border border-gray-300">
                      <Input
                        value={String(row.coreVendorNo || '')}
                        onChange={(e) => handleRowChange(index, 'coreVendorNo', e.target.value)}
                        className="w-full h-8 text-xs border-0 focus:ring-1 focus:ring-blue-300 text-center"
                        placeholder="16"
                      />
                    </td>
                    <td colSpan={2} className="p-2 border border-gray-300">
                      <div className="flex items-center gap-1">
                        <Input
          value={String(row.internalCoreNo || '')}
          onChange={(e) => handleRowChange(index, 'internalCoreNo', e.target.value)}
          className="flex-1 h-8 text-xs border-0 focus:ring-1 focus:ring-blue-500 font-mono font-bold text-gray-900"
          placeholder={generateCoreId(index + 1)}
        />

                        {row.isReplacement && (
                          <span className="text-xs text-blue-600 font-semibold whitespace-nowrap px-1 py-0.5 bg-blue-100 rounded">(R)</span>
                        )}
                      </div>
                    </td>
                    {psBColumns.map(column => (
                      <td key={column.id} className="p-2 border border-gray-300 bg-white">
                        <Input
                          value={String(row.dynamicValues[column.id] || '')}
                          onChange={(e) => handleRowChange(index, 'dynamicValues', { ...row.dynamicValues, [column.id]: e.target.value })}
                          className={`w-full h-8 text-xs border-0 focus:ring-1 focus:ring-blue-300 text-center font-medium ${row.dynamicValues[column.id] && parseFloat(row.dynamicValues[column.id]) > parseFloat(column.leLimitValue) ? 'bg-red-50 text-red-700' : ''
                            }`}
                          placeholder="9.5"
                        />
                      </td>
                    ))}
                    <td className="p-2 border border-gray-300">
                      <div className="flex items-center justify-center gap-2">
                        <div className={`min-w-[2rem] h-8 flex items-center justify-center font-medium text-xs ${row.remark === 'P' ? 'text-green-700' :
                          row.remark === 'F' ? 'text-red-600' : 'text-gray-400'
                          }`}>
                          {row.remark}
                        </div>
                        {row.remark === 'F' && !row.isReplacement && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReplaceCore(index)}
                            className="h-7 px-2 text-xs gap-1 border-orange-300 text-orange-600 hover:bg-orange-50"
                            title="Replace this failed core"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Replace
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Footer - Signatures */}
                <tr className="bg-slate-50">
                  <td colSpan={2} className="p-6 border border-gray-400">
                    <div>
                      <div className="text-xs text-gray-500 mb-3 font-medium">Test by</div>
                      <Input
                        value={testBy}
                        onChange={(e) => setTestBy(e.target.value)}
                        className="w-full h-10 border-b-2 border-t-0 border-x-0 rounded-none px-0 focus:ring-0 focus:border-blue-500"
                        placeholder="Enter name"
                      />
                    </div>
                  </td>
                  <td colSpan={psBColumns.length + 3} className="p-6 border border-gray-400">
                    <div>
                      <div className="text-xs text-gray-500 mb-3 font-medium">Authorised Signatory</div>
                      <Input
                        value={authorizedSignatory}
                        onChange={(e) => setAuthorizedSignatory(e.target.value)}
                        className="w-full h-10 border-b-2 border-t-0 border-x-0 rounded-none px-0 focus:ring-0 focus:border-blue-500"
                        placeholder="Enter name"
                      />
                    </div>
                  </td>
                </tr>

                {/* For Advent Engineers */}
                <tr>
                  <td colSpan={psBColumns.length + 5} className="p-3 border border-gray-400 text-right font-semibold text-sm text-gray-700 bg-slate-50">
                    For Advent Engineers
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Add More Rows Button */}
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={addRow} className="gap-1">
            <Plus className="w-3 h-3" />
            Add More Rows
          </Button>
        </div>

        {/* Completion Summary */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900">Testing Summary</h4>
              <p className="text-sm text-blue-700 mt-1">
                {getFilledRowsCount()} cores tested out of {order.transformerQuantity} total
                {failedCores.length > 0 && ` • ${failedCores.length} cores replaced`}
              </p>
            </div>
            {getFilledRowsCount() === order.transformerQuantity && (
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <span className="font-medium">Complete</span>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Metering Configuration Screen (only for Metering cores)
  if (!isProtectionCore && !isPSCore && !meteringConfigured) {
    const addBSATColumn = () => {
      const newId = String(bsatColumns.length + 1);
      setBsatColumns([...bsatColumns, { id: newId, bsatValue: '', setMvValue: '', leLimitValue: '' }]);
    };

    const removeBSATColumn = (id: string) => {
      if (bsatColumns.length > 1) {
        setBsatColumns(bsatColumns.filter(col => col.id !== id));
      }
    };

    const updateBSATColumn = (id: string, field: keyof BSATColumn, value: string) => {
      setBsatColumns(bsatColumns.map(col =>
        col.id === id ? { ...col, [field]: value } : col
      ));
    };

    const handleConfigSave = () => {
      // Validate that all fields are filled
      const allFilled = bsatColumns.every(col =>
        col.bsatValue && col.setMvValue && col.leLimitValue
      );

      if (!allFilled) {
        alert('Please fill in all BSAT configuration fields');
        return;
      }

      setMeteringConfigured(true);
      alert('Configuration saved successfully! You can now enter core testing data.');
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="outline"
              onClick={onBack}
              size="sm"
              className="mb-2 gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Back
            </Button>
            <h2 className="text-xl">Metering Core Configuration</h2>
            <p className="text-sm text-gray-600 mt-1">
              {order.jobId} - {order.clientName} • Configure testing parameters before entering core data
            </p>
          </div>
        </div>

        {/* Configuration Form */}
        <Card className="p-6">
          <h3 className="text-lg mb-4 pb-3 border-b">Testing Configuration</h3>

          {/* Core Type and Turns */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <Label htmlFor="coreTypeNano">TOROIDAL CORE NANO CRYSTALLINE</Label>
              <Select value={coreTypeNano} onValueChange={(value: any) => setCoreTypeNano(value)}>
                <SelectTrigger id="coreTypeNano">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TOROIDAL CORE NANO CRYSTALLINE">TOROIDAL CORE NANO CRYSTALLINE</SelectItem>
                  <SelectItem value="M4CRGO">M4CRGO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="turnUsed">TURN USED FOR TESTING</Label>
              <Select value={specs.turnUsed} onValueChange={(value) => handleSpecChange('turnUsed', value)}>
                <SelectTrigger id="turnUsed">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="40">40</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Core Size Fields */}
          <div className="mb-6">
            <Label className="mb-3 block">CORE SIZE (ID, OD, HT in mm)</Label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="coreSize1" className="text-xs text-gray-600">ID (Inner Diameter)</Label>
                <Input
                  id="coreSize1"
                  value={specs.coreSize1}
                  onChange={(e) => handleSpecChange('coreSize1', e.target.value)}
                  placeholder="115"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="coreSize2" className="text-xs text-gray-600">OD (Outer Diameter)</Label>
                <Input
                  id="coreSize2"
                  value={specs.coreSize2}
                  onChange={(e) => handleSpecChange('coreSize2', e.target.value)}
                  placeholder="145"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="coreSize3" className="text-xs text-gray-600">HT (Height)</Label>
                <Input
                  id="coreSize3"
                  value={specs.coreSize3}
                  onChange={(e) => handleSpecChange('coreSize3', e.target.value)}
                  placeholder="35"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* BSAT Columns Configuration */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base">BSAT Testing Columns</Label>
              <Button onClick={addBSATColumn} size="sm" variant="outline" className="gap-1">
                <Plus className="w-3 h-3" />
                Add Column
              </Button>
            </div>

            <div className="space-y-3">
              {bsatColumns.map((column, index) => (
                <Card key={column.id} className="p-4 bg-gray-50">
                  <div className="flex items-end gap-3">
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor={`bsat-${column.id}`} className="text-xs">BSAT (G)</Label>
                        <Input
                          id={`bsat-${column.id}`}
                          value={column.bsatValue}
                          onChange={(e) => updateBSATColumn(column.id, 'bsatValue', e.target.value)}
                          placeholder="1000"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`set-${column.id}`} className="text-xs">SET (mV)</Label>
                        <Input
                          id={`set-${column.id}`}
                          value={column.setMvValue}
                          onChange={(e) => updateBSATColumn(column.id, 'setMvValue', e.target.value)}
                          placeholder="93.1928"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`le-${column.id}`} className="text-xs">LE LIMIT (mA)</Label>
                        <Input
                          id={`le-${column.id}`}
                          value={column.leLimitValue}
                          onChange={(e) => updateBSATColumn(column.id, 'leLimitValue', e.target.value)}
                          placeholder="17.1444"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    {bsatColumns.length > 1 && (
                      <Button
                        onClick={() => removeBSATColumn(column.id)}
                        size="sm"
                        variant="outline"
                        className="gap-1 border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button onClick={handleConfigSave} className="gap-2 bg-[#003a70] hover:bg-[#002a50]">
              <Save className="w-4 h-4" />
              Save Configuration
            </Button>
          </div>
        </Card>

        {/* Help Card */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex gap-3">
            <div className="text-blue-600 mt-1">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Configuration Instructions</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Select the toroidal core type and turns used for testing</li>
                <li>• Enter core dimensions (ID, OD, HT) in millimeters</li>
                <li>• Configure BSAT testing columns with their corresponding SET (mV) and LE LIMIT (mA) values</li>
                <li>• Add or remove BSAT columns as needed for your testing requirements</li>
                <li>• After saving, you'll be able to enter the actual core testing data</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Metering/PS Core Template (Original)
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="outline"
            onClick={onBack}
            size="sm"
            className="mb-2 gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            Back
          </Button>
          <h2 className="text-xl">Core Testing Report - {coreType}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {order.jobId} - {order.clientName}
          </p>
        </div>
        <div className="flex gap-2">
          {!isPSCore && !isProtectionCore && meteringConfigured && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1 border-blue-300 text-blue-600 hover:bg-blue-50"
              onClick={() => setMeteringConfigured(false)}
            >
              <Edit className="w-3 h-3" />
              Edit Config
            </Button>
          )}
          {failedCores.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1 border-red-300 text-red-600 hover:bg-red-50"
              onClick={() => setShowFailedCores(true)}
            >
              <AlertTriangle className="w-3 h-3" />
              View Failed ({failedCores.length})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={handlePrintReport}
          >
            <Printer className="w-3 h-3" />
            Print Report
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 border-green-300 text-green-600 hover:bg-green-50"
            onClick={handlePrintLabels}
            disabled={getPassedCores().length === 0}
          >
            <Tag className="w-3 h-3" />
            Print Labels ({getPassedCores().length})
          </Button>
          <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700" onClick={handleSave}>
            <Save className="w-3 h-3" />
            Save All
          </Button>
        </div>
      </div>

      {/* Progress */}
      <Card className="p-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Cores Tested: <span className="font-medium text-gray-900">{getFilledRowsCount()} / {order.transformerQuantity}</span></span>
            <span className="flex items-center gap-1 text-green-600">
              <Check className="w-4 h-4" />
              Pass: <span className="font-medium">{passed}</span>
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <X className="w-4 h-4" />
              Fail: <span className="font-medium">{failed}</span>
            </span>
            {failedCores.length > 0 && (
              <span className="flex items-center gap-1 text-orange-600">
                <AlertTriangle className="w-4 h-4" />
                Replaced: <span className="font-medium">{failedCores.length}</span>
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Testing Form - Table Layout */}
      <Card className="overflow-x-auto">
        <div className="min-w-full">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {/* Title Row with Date */}
              <tr>
                <td colSpan={3} className="bg-gray-100 p-3 border border-gray-400 text-center font-medium text-gray-700">
                  Toroidal Core Testing
                </td>
                <td className="bg-white p-2 border border-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700">Date -</span>
                    <Input
                      value={testDate}
                      onChange={(e) => setTestDate(e.target.value)}
                      className="w-28 h-7 text-xs border-gray-300"
                    />
                  </div>
                </td>
                <td colSpan={5} className="bg-gray-100 p-3 border border-gray-400 font-medium text-center text-gray-700">
                  {coreTypeNano}
                </td>
              </tr>

              {/* Description and Core Size Row */}
              <tr>
                <td className="bg-gray-50 p-3 border border-gray-400 font-medium text-gray-600">
                  Description
                </td>
                <td colSpan={3} className="bg-white p-2 border border-gray-400">

                </td>
                {/* <td className="bg-white p-2 border border-gray-400 text-center font-medium">
                  <Input
                    value={specs.coreSize1}
                    onChange={(e) => handleSpecChange('coreSize1', e.target.value)}
                    className="w-16 h-7 text-center border-gray-300 bg-white"
                  />
                </td>
                <td className="bg-white p-2 border border-gray-400 text-center font-medium">
                  <Input
                    value={specs.coreSize2}
                    onChange={(e) => handleSpecChange('coreSize2', e.target.value)}
                    className="w-16 h-7 text-center border-gray-300 bg-white"
                  />
                </td> */}
                {/* <td className="bg-white p-2 border border-gray-400 text-center font-medium">
                  <Input
                    value={specs.coreSize3}
                    onChange={(e) => handleSpecChange('coreSize3', e.target.value)}
                    className="w-16 h-7 text-center border-gray-300 bg-white"
                  />
                </td> */}
                <td className="bg-white p-3 border border-gray-400 text-center font-medium">
                  {specs.coreSize1}
                </td>
                <td className="bg-white p-3 border border-gray-400 text-center font-medium">
                  {specs.coreSize2}
                </td>
                <td className="bg-white p-3 border border-gray-400 text-center font-medium">
                  {specs.coreSize3}
                </td>
                <td colSpan={2} className="bg-white p-2 border border-gray-400 text-center font-medium text-gray-700">
                  ID-OD-HT
                </td>
              </tr>

              {/* Core Size Label Row */}
              <tr>
                <td className="bg-gray-50 p-3 border border-gray-400 font-medium text-gray-600">
                  CORE SIZE IN MM
                </td>
                <td colSpan={8} className="bg-white p-2 border border-gray-400">

                </td>
              </tr>

              {/* Turn Used Row */}
              <tr>
                <td className="bg-gray-50 p-3 border border-gray-400 font-medium text-gray-600">
                  TURN USED FOR TESTING
                </td>
                <td colSpan={8} className="bg-white p-3 border border-gray-400 font-medium">
                  {specs.turnUsed} TURN
                </td>
              </tr>

              {/* Area */}
              <tr>
                <td className="bg-gray-50 p-3 border border-gray-400 font-medium text-gray-600">
                  Area (Sq cm)
                </td>
                <td colSpan={8} className="bg-white p-3 border border-gray-400 font-medium">
                  {specs.area}
                </td>
              </tr>

              {/* MMP */}
              <tr>
                <td className="bg-gray-50 p-3 border border-gray-400 font-medium text-gray-600">
                  MMP (cm)
                </td>
                <td colSpan={8} className="bg-white p-3 border border-gray-400 font-medium">
                  {specs.mmp}
                </td>
              </tr>

              {/* BSAT(G) - Flux Density Row */}
              <tr>
                <td rowSpan={3} className="bg-gray-100 p-3 border border-gray-400 font-medium text-gray-600 text-center align-middle">
                  Specification
                </td>
                <td className="bg-white p-3 border border-gray-400 font-medium text-gray-700">
                  BSAT(G)
                </td>
                <td colSpan={2} className="bg-white p-3 border border-gray-400"></td>
                {bsatColumns.map(column => (
                  <td key={column.id} className="bg-amber-50 p-3 border border-gray-400 text-center font-bold text-gray-700">
                    {column.bsatValue}
                  </td>
                ))}
                <td className="bg-white p-3 border border-gray-400"></td>
              </tr>

              {/* SET mV - Voltage Row */}
              <tr>
                <td className="bg-blue-100 p-3 border border-gray-400 font-medium text-gray-700">
                  SET mV
                </td>
                <td colSpan={2} className="bg-white p-3 border border-gray-400"></td>
                {bsatColumns.map(column => (
                  <td key={column.id} className="bg-blue-50 p-3 border border-gray-400 text-center font-medium text-gray-700">
                    {column.setMvValue}
                  </td>
                ))}
                <td className="bg-white p-3 border border-gray-400"></td>
              </tr>

              {/* LE LIMIT in mA - Limit Row */}
              <tr>
                <td className="bg-white p-3 border border-gray-400 font-medium text-gray-700">
                  LE LIMIT in mA.
                </td>
                <td colSpan={2} className="bg-white p-3 border border-gray-400"></td>
                {bsatColumns.map(column => (
                  <td key={column.id} className="bg-white p-3 border border-gray-400 text-center font-medium text-gray-700">
                    {column.leLimitValue}
                  </td>
                ))}
                <td className="bg-blue-100 p-3 border border-gray-400 text-center font-medium text-gray-700">
                  Remark
                </td>
              </tr>

              {/* Column Headers - Data Entry Section */}
              <tr className="bg-gray-100">
                <td className="p-3 border border-gray-400 font-semibold text-gray-700 text-center text-xs">Date</td>
                <td className="p-3 border border-gray-400 font-semibold text-gray-700 text-center text-xs">Vendor core No.</td>
                <td colSpan={2} className="p-3 border border-gray-400 font-semibold text-gray-700 text-center text-xs">Internal core No.</td>
                {bsatColumns.map(column => (
                  <td key={column.id} className="p-3 border border-gray-400 font-semibold text-gray-700 text-center text-xs bg-amber-50">
                    {column.bsatValue}
                  </td>
                ))}
                <td className="p-3 border border-gray-400 font-semibold text-gray-700 text-center text-xs">Remark</td>
              </tr>

              {/* Data Entry Rows */}
              {rows.map((row, index) => (
                <tr key={index} className={`hover:bg-gray-50 transition-colors ${row.isReplacement ? 'bg-blue-50' : 'bg-white'}`}>
                  <td className="p-2 border border-gray-300">
                    <Input
                      value={testDate}
                      onChange={(e) => handleRowChange(index, 'date', e.target.value)}
                      className="w-full h-8 text-xs border-0 focus:ring-1 focus:ring-blue-300 text-center"
                      placeholder="DD/MM/YY"
                    />
                  </td>

                  <td className="p-2 border border-gray-300">
                    <Input
                      value={String(row.coreVendorNo || '')}
                      onChange={(e) => handleRowChange(index, 'coreVendorNo', e.target.value)}
                      className="w-full h-8 text-xs border-0 focus:ring-1 focus:ring-blue-300 text-center"
                      placeholder="16"
                    />
                  </td>
                  {/* <td colSpan={2} className="p-2 border border-gray-300">
                    <div className="flex items-center gap-1">
                      <Input
                        value={row.internalCoreNo}
                        onChange={(e) => handleRowChange(index, 'internalCoreNo', e.target.value)}
                        className="flex-1 h-8 text-xs border-0 focus:ring-1 focus:ring-blue-300 font-mono"
                        placeholder={index < order.transformerQuantity ? generateCoreId(index + 1) : ''}
                      />
                      {row.isReplacement && (
                        <span className="text-xs text-blue-600 font-semibold whitespace-nowrap px-1 py-0.5 bg-blue-100 rounded">(R)</span>
                      )}
                    </div>
                  </td> */}
                  <td colSpan={2} className="p-2 border border-gray-300">
                    <div className="flex items-center gap-1">
                      {/* <Input
                        // Ensure this matches your state property exactly
                        value={String(row.internalCoreNo || '')}
                        onChange={(e) => handleRowChange(index, 'internalCoreNo', e.target.value)}
                        // Added 'text-gray-900' to ensure visibility
                        className="flex-1 h-8 text-xs border-0 focus:ring-1 font-mono font-bold text-gray-900"
                        placeholder=""
                      /> */}
                      <Input
                        // 1. Ensure the value is always a string to avoid React warnings
                        value={String(row.internalCoreNo || '')}

                        // 2. Standard change handler
                        onChange={(e) => handleRowChange(index, 'internalCoreNo', e.target.value)}

                        // 3. UI Styling (Mono font is great for serial numbers)
                        className="flex-1 h-8 text-xs border-0 focus:ring-1 font-mono font-bold text-gray-900"

                        // 4. IMPROVEMENT: Show the expected ID as a hint
                        placeholder={generateCoreId(index + 1)}
                      />
                      {row.isReplacement && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded font-bold border border-blue-200">
                          (R)
                        </span>
                      )}
                    </div>
                  </td>
                  {bsatColumns.map(column => (
                    <td key={column.id} className="p-2 border border-gray-300 bg-white">
                      <Input
                        value={String(row.dynamicValues[column.id] || '')}
                        onChange={(e) => handleRowChange(index, 'dynamicValues', { ...row.dynamicValues, [column.id]: e.target.value })}
                        className={`w-full h-8 text-xs border-0 focus:ring-1 focus:ring-blue-300 text-center font-medium ${row.dynamicValues[column.id] && parseFloat(row.dynamicValues[column.id]) > parseFloat(column.leLimitValue) ? 'bg-red-50 text-red-700' : ''
                          }`}
                        placeholder="9.5"
                      />
                    </td>
                  ))}
                  <td className="p-2 border border-gray-300">
                    <div className="flex items-center justify-center gap-2">
                      <div className={`min-w-[2rem] h-8 flex items-center justify-center font-medium text-xs ${row.remark === 'P' ? 'text-green-700' :
                        row.remark === 'F' ? 'text-red-600' : 'text-gray-400'
                        }`}>
                        {row.remark}
                      </div>
                      {row.remark === 'F' && !row.isReplacement && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReplaceCore(index)}
                          className="h-7 px-2 text-xs gap-1 border-orange-300 text-orange-600 hover:bg-orange-50"
                          title="Replace this failed core"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Replace
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add More Rows Button */}
      <div className="flex justify-center">
        <Button variant="outline" size="sm" onClick={addRow} className="gap-1">
          <Plus className="w-3 h-3" />
          Add More Rows
        </Button>
      </div>

      {/* Completion Summary */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-blue-900">Testing Summary</h4>
            <p className="text-sm text-blue-700 mt-1">
              {getFilledRowsCount()} cores tested out of {order.transformerQuantity} total
              {failedCores.length > 0 && ` • ${failedCores.length} cores replaced`}
            </p>
          </div>
          {getFilledRowsCount() === order.transformerQuantity && (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-5 h-5" />
              <span className="font-medium">Complete</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
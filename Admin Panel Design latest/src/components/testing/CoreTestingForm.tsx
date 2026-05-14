import { useState, useEffect, useRef } from 'react';
// Forcing fresh state reload for activeRowsRef
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  ArrowLeft,
  Save,
  Printer,
  Plus,
  Check,
  X,
  Clock,
  RefreshCw,
  Clock,
  AlertTriangle,
  Tag,
  Edit,
  Trash2,
  Package,
  CheckCircle2,
} from 'lucide-react';
import { CoreTestingOrder } from './CoreTestingOrders';
import { FailedCoresManager } from './FailedCoresManager';
import { CoreLabelsPrint } from './CoreLabelsPrint';
import { ReadyStockModal } from './ReadyStockModal';
import { socket } from '../../utils/socket';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { ReportHeader } from '../reports';
import { CoreReportPrint } from './CoreReportPrint';
import { getSafeOrderId, getSafeClientName, getSafeBatchId } from '../../utils/orderUtils';
import axios from 'axios';



interface CoreTestingFormProps {
  order: CoreTestingOrder;
  coreType: 'Metering' | 'PS' | 'Protection';
  onBack: () => void;
  isReadOnly?: boolean;
  user?: any;
  isPreTest?: boolean;
  batchData?: {
    batchId: string;
    vendorName: string;
    vendorId: string;
    numberOfCores: number;
    turns: string;
    discardedCount?: number;
    passedCount?: number;
    failedCount?: number;
    discardedCoreIds?: string[]; // Permanently consumed IDs — never reuse
  };
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
  status?: 'PENDING' | 'PASS' | 'FAIL' | 'RETURNED';
}

interface BSATColumn {
  id: string;
  bsatValue: string;
  setMvValue: string;
  leLimitValue: string;
}

export interface FailedCore {
  _id?: string;
  orderId: string;
  jobId: string;
  clientName: string;
  coreType: string;
  internalCoreNo: string;
  coreVendorNo: string;
  vendorCoreNo?: string; // Added to match backend schema
  date?: string; // Legacy frontend date
  failedAt?: string; // Backend real timestamp
  createdAt?: string; // Backend fallback timestamp
  failureStage?: string;
  failureReason: string;
  value1000: string;
  value3000: string;
  value5000: string;
  value7000: string;
  singleValue?: string;
  dynamicValues?: { [key: string]: string };
  status?: string;
}

export function CoreTestingForm({
  order,
  coreType,
  onBack,
  isReadOnly = false,
  user,
  isPreTest = false,
  batchData
}: CoreTestingFormProps) {


  // 1. REFINE ID GENERATION
  const generateCoreId = (transformerNum: number) => {
    if (isPreTest && batchData) {
      // Linked Format: PRE-DDMMYY-[TYPE]-[BATCH_SEQ]-[CORE_SEQ]
      // Example Batch: BATCH-300426-MTR-001
      // Example Core: PRE-300426-MTR-01-001

      const parts = batchData.batchId.split('-');
      // parts[0] = BATCH, parts[1] = DDMMYY, parts[2] = TYPE, parts[3] = SEQ

      if (parts.length >= 4) {
        const datePart = parts[1];
        const typePart = parts[2];
        const batchSeq = parts[3]?.slice(-2) || '00'; // Use last 2 digits of batch sequence
        return `PRE-${datePart}-${typePart}-${batchSeq}-${String(transformerNum).padStart(3, '0')}`;
      }

      // Fallback for old batch IDs
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yy = String(now.getFullYear()).slice(-2);
      const datePart = `${dd}${mm}${yy}`;
      const match = batchData.batchId.match(/\d+/);
      const batchDigits = (match ? match[0] : '00').slice(-2).padStart(2, '0');
      return `PRE-${datePart}-B${batchDigits}-${String(transformerNum).padStart(3, '0')}`;
    }
    const upperType = coreType.toUpperCase();
    let prefix = 'P'; // Default for Protection

    if (upperType === 'METERING') prefix = 'M';
    else if (upperType.includes('PS')) prefix = 'PS';

    // Safe Job ID logic: Takes "JOB-2025-015" and gets "015"
    const jobSuffix = order?.jobId?.split('-').pop() ?? '000';

    return `${prefix}-${jobSuffix}-${String(transformerNum).padStart(3, '0')}`;
  };

  const updatePreTestBatchStatus = async (newStatus: string) => {
    if (!isPreTest || !batchData?.batchId) return;
    try {
      await axios.patch(`http://localhost:5001/api/pre-test-batches/${batchData.batchId}/status`, { status: newStatus }, {
        withCredentials: true
      });
    } catch (err) {
      console.error("Failed to update batch status", err);
    }
  };



  // ----------------------

  const isMetering = coreType === 'Metering';
  const isProtectionCore = coreType === 'Protection';
  const isPSCore = coreType === 'PS';










  const getSystemDate = () => new Date().toLocaleDateString('en-GB');

  const isRowLocked = (row: CoreTestRow) => {
    if (isPreTest) return false;
    if (row.isReplacement) return false; // Always allow editing replacements
    // Allow editing even if it's FAIL, as long as it's not approved (isReadOnly)
    return row.status === 'PASS' || row.status === 'RETURNED';
  };

  // Vendor selection helpers
  const getVendors = () => {
    if (isPreTest && batchData?.vendorName) {
      // For pre-test, include the batch vendor as an option
      return [{ serialNo: "V-1", name: batchData.vendorName }];
    }
    const vendorsObj = ((order as any).coreVendors || (order as any).order?.coreVendors) || {};
    return (vendorsObj[coreType.toLowerCase()] || []) as { serialNo: string; name: string }[];
  };

  const applyVendorToAll = () => {
    if (rows.length === 0) return;
    const firstRowVendor = rows[0]?.coreVendorNo;
    if (!firstRowVendor) {
      alert("Please select a vendor in the first row first.");
      return;
    }
    const updatedRows = rows.map(row => ({ ...row, coreVendorNo: firstRowVendor }));
    setRows(updatedRows);
  };

  const renderVendorHeader = () => {
    const vendors = getVendors();
    return (
      <td className="p-3 border border-gray-400 font-semibold text-gray-700 text-center text-xs">
        <div className="flex flex-col items-center gap-1">
          <span>Vendor core No.</span>
          {vendors.length > 1 && !isReadOnly && (
            <button
              onClick={(e) => {
                e.preventDefault();
                applyVendorToAll();
              }}
              className="text-[10px] text-blue-600 hover:text-blue-800 underline font-normal whitespace-nowrap"
              type="button"
            >
              Apply to All
            </button>
          )}
        </div>
      </td>
    );
  };

  const renderVendorCell = (row: CoreTestRow, index: number) => {
    const vendors = getVendors();

    return (
      <td className="p-2 border border-gray-300">
        {vendors.length > 0 ? (
          <select
            value={String(row.coreVendorNo || '')}
            onChange={(e) => handleRowChange(index, 'coreVendorNo', e.target.value)}
            disabled={isReadOnly || isRowLocked(row)}
            className="w-full h-7 text-xs border border-gray-300 text-center focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white rounded cursor-pointer appearance-none hover:bg-gray-50 transition-colors"
            title="Click to select vendor"
          >
            <option value="">- Select Vendor -</option>
            {vendors.map((v: any, i: number) => (
              <option key={i} value={`${v.serialNo} - ${v.name}`}>
                {v.serialNo} - {v.name}
              </option>
            ))}
          </select>
        ) : (
          <Input
            value={String(row.coreVendorNo || '')}
            onChange={(e) => handleRowChange(index, 'coreVendorNo', e.target.value)}
            disabled={isReadOnly || isRowLocked(row)}
            className="w-full h-7 text-xs border-gray-300 text-center mx-auto focus:ring-1 focus:ring-blue-500"
            placeholder="Enter Vendor"
          />
        )}
      </td>
    );
  };



  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 3. PERSISTENT DATA LOADING
  useEffect(() => {
    const loadExistingData = async () => {
      setIsLoading(true);
      try {
        // Correct ID for fetching: batchId for pre-test, else orderId
        const isMeteringCheck = coreType === 'Metering';
        let response: any;
        const token = localStorage.getItem('token');

        if (isPreTest && batchData?.batchId) {
          response = await axios.get(`http://localhost:5001/api/pre-test-batches/${batchData.batchId}`, {
            withCredentials: true,
            headers: { 'Authorization': token ? `Bearer ${token}` : '' }
          });

          if (response.data.numberOfCores !== undefined) {
            setLocalCoreCount(response.data.numberOfCores);
          }

          // Auto-configure if data exists in batch
          if (response.data.testSetup) {
            setSpecs({
              coreSize1: String(response.data.testSetup.coreSizeMm?.id || ''),
              coreSize2: String(response.data.testSetup.coreSizeMm?.od || ''),
              coreSize3: String(response.data.testSetup.coreSizeMm?.height || ''),
              turnUsed: String(response.data.testSetup.turnsUsed || ''),
              area: String(response.data.testSetup.areaSqCm || ''),
              mmp: String(response.data.testSetup.mmp || ''),
              // For Protection/PS
              bFlux: String(response.data.testLimits?.fluxTesla || ''),
              voltage: String(response.data.testLimits?.voltageV || ''),
              iexLimit: String(response.data.testLimits?.iexLimitMa || '')
            });

            if (isMeteringCheck && response.data.testLimits?.bsatGauss) {
              setBsatColumns(response.data.testLimits.bsatGauss.map((val: any, i: number) => ({
                id: String(i + 1),
                bsatValue: String(val),
                setMvValue: String(response.data.testLimits.setMilliVolt?.[i] || ''),
                leLimitValue: String(response.data.testLimits.leLimitMa?.[i] || '')
              })));
              setCoreTypeNano(response.data.testSetup.coreMaterial);
              setMeteringConfigured(true);
            } else if (coreType === 'Protection') {
              if (response.data.testLimits?.bsatGauss) {
                setProtectionBColumns(response.data.testLimits.bsatGauss.map((val: any, i: number) => ({
                  id: String(i + 1),
                  bsatValue: String(val),
                  setMvValue: String(response.data.testLimits.setMilliVolt?.[i] || ''),
                  leLimitValue: String(response.data.testLimits.leLimitMa?.[i] || '')
                })));
              }
              setProtectionConfigured(true);
            } else if (coreType === 'PS') {
              if (response.data.testLimits?.bsatGauss) {
                setPsBColumns(response.data.testLimits.bsatGauss.map((val: any, i: number) => ({
                  id: String(i + 1),
                  bsatValue: String(val),
                  setMvValue: String(response.data.testLimits.setMilliVolt?.[i] || ''),
                  leLimitValue: String(response.data.testLimits.leLimitMa?.[i] || '')
                })));
              }
              setPsConfigured(true);
            }
          }
        } else {
          const txnOrderId = ((order as any).mainOrderId || (order as any).orderId?._id || (order as any)._id);
          const endpoint = isMeteringCheck ? '/metering-tests' : '/protection-tests';
          const typeParam = !isMeteringCheck ? `?type=${coreType}` : '';

          response = await axios.get(`http://localhost:5001/api${endpoint}/${txnOrderId}${typeParam}`, {
            withCredentials: true,
            headers: { 'Authorization': token ? `Bearer ${token}` : '' }
          });
        }

        let dbFailedCoreIds = new Set<string>();
        let dbFailedCores: any[] = [];
        if (!isPreTest) {
          const txnOrderId = getSafeOrderId(order);

          // Use the dedicated order-specific endpoint which is more reliable
          try {
            const fcRes = await axios.get(`http://localhost:5001/api/failed-cores/order/${txnOrderId}`, {
              withCredentials: true,
              headers: { 'Authorization': token ? `Bearer ${token}` : '' }
            });
            dbFailedCores = fcRes.data.data || [];
            dbFailedCores.forEach(fc => dbFailedCoreIds.add(fc.internalCoreNo?.trim().toUpperCase() || ''));
            console.log("[LOAD] FETCHED FAILED CORES FOR ORDER:", dbFailedCores.map((f: any) => f.internalCoreNo));
          } catch (err) {
            console.error("[LOAD] Failed to load actual failed cores", err);
          }
        }

        // If data exists, map it; otherwise, use fresh initialization
        if (response.data && response.data.readings && response.data.readings.length > 0) {
          if (!isMeteringCheck && response.data.coreType !== coreType) {
            console.warn(`Mismatch in loadExistingData: Expected coreType "${coreType}", but backend returned "${response.data.coreType}". Resetting rows to empty skeleton.`);
            setRows(initializeRows());
            return;
          }
          console.log(`Successfully loaded ${response.data.readings?.length || 0} readings for ${coreType} batch ${batchData?.batchId || order.orderId}`);


          // Merge logic considering replacements and visibility
          const initializedSkeleton = initializeRows();
          const mappedSavedRows = response.data.readings.map((r: any) => {
            const dynamicValues: { [key: string]: string } = {};
            if (Array.isArray(r.measuredMa) && r.measuredMa.length > 0) {
              // Metering, or Protection/PS saved with new measuredMa format
              r.measuredMa.forEach((val: any, i: number) => {
                dynamicValues[String(i + 1)] = val != null ? String(val) : '';
              });
            } else if (r.value != null) {
              // Legacy Core Tracking Protection/PS: saved as single `value` — restore into first column
              dynamicValues['1'] = String(r.value);
            }
            return {
              date: r.date ? new Date(r.date).toLocaleDateString('en-GB') : getSystemDate(),
              coreVendorNo: r.vendorCoreNo || '',
              internalCoreNo: r.internalCoreNo || '',
              dynamicValues,
              // Keep singleValue populated for forms that use it directly
              singleValue: r.value != null ? String(r.value) : (dynamicValues['1'] || ''),
              remark: r.result || '',
              status: r.status || 'PENDING',
              isReplacement: r.isReplacement || false,
              replacedCoreId: r.replacedCoreId || null
            };
          });

          const finalRowsToShow: CoreTestRow[] = [];
          const restoredFailedCores: FailedCore[] = [];

          initializedSkeleton.forEach(skel => {
            const baseReading = mappedSavedRows.find((s: any) => 
              s.internalCoreNo?.trim().toUpperCase() === skel.internalCoreNo?.trim().toUpperCase()
            );
            const sourceRow = baseReading || skel;

            const currentSourceId = sourceRow.internalCoreNo?.trim().toUpperCase() || '';
            console.log(`Checking if ${currentSourceId} is in Failed Cores:`, dbFailedCoreIds.has(currentSourceId));
            if (dbFailedCoreIds.has(currentSourceId)) {
              // The user clicked "Replace" and moved it to Failed Cores section
              const dbFc = dbFailedCores.find((fc: any) => fc.internalCoreNo?.trim().toUpperCase() === currentSourceId);
              restoredFailedCores.push({
                _id: dbFc._id,
                orderId: getSafeOrderId(order),
                jobId: order.jobId,
                clientName: order.clientName,
                coreType: coreType,
                internalCoreNo: sourceRow.internalCoreNo,
                coreVendorNo: sourceRow.coreVendorNo,
                vendorCoreNo: sourceRow.coreVendorNo,
                date: sourceRow.date,
                failureReason: dbFc.failureReason || 'Replaced from Ready Stock',
                dynamicValues: sourceRow.dynamicValues,
                value1000: sourceRow.value1000 || '',
                value3000: sourceRow.value3000 || '',
                value5000: sourceRow.value5000 || '',
                value7000: sourceRow.value7000 || '',
                singleValue: sourceRow.singleValue || '',
                status: sourceRow.status || 'FAIL'
              });
            } else {
              // Keep it in the table
              finalRowsToShow.push(sourceRow);
            }

            // Now trace any replacements
            let lastId = sourceRow.internalCoreNo;
            let furtherChild: any;
            do {
              furtherChild = mappedSavedRows.find((s: any) => 
                s.isReplacement && s.replacedCoreId?.trim().toUpperCase() === lastId?.trim().toUpperCase()
              );
              if (furtherChild) {
                const furtherChildId = furtherChild.internalCoreNo?.trim().toUpperCase() || '';
                if (dbFailedCoreIds.has(furtherChildId)) {
                  const dbFc = dbFailedCores.find((fc: any) => fc.internalCoreNo?.trim().toUpperCase() === furtherChildId);
                  restoredFailedCores.push({
                    _id: dbFc._id,
                    orderId: getSafeOrderId(order),
                    jobId: order.jobId,
                    clientName: order.clientName,
                    coreType: coreType,
                    internalCoreNo: furtherChild.internalCoreNo,
                    coreVendorNo: furtherChild.coreVendorNo,
                    vendorCoreNo: furtherChild.coreVendorNo,
                    date: furtherChild.date,
                    failureReason: dbFc.failureReason || 'Replaced from Ready Stock',
                    dynamicValues: furtherChild.dynamicValues,
                    value1000: furtherChild.value1000 || '',
                    value3000: furtherChild.value3000 || '',
                    value5000: furtherChild.value5000 || '',
                    value7000: furtherChild.value7000 || '',
                    singleValue: furtherChild.singleValue || '',
                    status: furtherChild.status || 'FAIL'
                  });
                } else {
                  finalRowsToShow.push(furtherChild);
                }
                lastId = furtherChild.internalCoreNo;
              }
            } while (furtherChild);
          });

          if (restoredFailedCores.length > 0) {
            setFailedCores(restoredFailedCores);
          }

          // STRICT FINAL FILTER: absolutely guarantee no failed cores make it to the grid
          const sanitizedRowsToShow = finalRowsToShow.filter(row => {
            const id = row.internalCoreNo?.trim().toUpperCase();
            return !id || !dbFailedCoreIds.has(id);
          });

          setRows(sanitizedRowsToShow);
        } else {
          if (!isReadOnly) setRows(initializeRows());
          else setRows([]); // No data to show in read-only
        }
      } catch (err) {
        console.warn("No existing data found, starting fresh.", err);
        if (!isReadOnly) setRows(initializeRows());
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingData();
  }, [order, coreType, isReadOnly]);


  // 2. SMART ROW INITIALIZATION & GRANULAR FILTERING
  const getAssignedTransformerIndices = (): number[] | null => {
    // If ReadOnly (View Mode), show ALL rows
    if (isReadOnly) return null;

    // Check both potential locations for assignedUnitIds
    const params = (order as any).assignedUnitIds || (order as any).order?.assignedUnitIds;

    if (!params || params.length === 0) return null; // Show All if no granular data

    const indices = params.map((id: string) => {
      // Expecting format like "TR-2025-001/01" -> 1 
      // OR "TR-2025-001-01" -> 1
      const match = id.match(/[/\-](\d+)$/);
      return match ? parseInt(match[1] ?? '') : null;
    }).filter((n: any): n is number => n !== null);

    // Any valid indices? If not, return NULL to trigger fallback to Quantity-based rows.
    return indices.length > 0 ? indices : null;
  };

  const calculateTotalRowsNeeded = () => {
    if (isPreTest) return localCoreCount;
    const assignedIndices = getAssignedTransformerIndices();
    // If granular assignment exists, use that count. Else use total quantity.
    const validQuantity = assignedIndices ? assignedIndices.length : (order?.quantity || order?.transformerQuantity || 0);

    // Count occurrences of this specific core type in the configuration
    const coresPerTransformer = (order?.coreDetails || []).filter(
      (core: any) => (core.coreType || core.type) === coreType
    ).length || 1;

    return validQuantity * coresPerTransformer;
  };

  const initializeRows = (): CoreTestRow[] => {
    if (isPreTest && batchData) {
      const consumedIds = new Set(batchData.discardedCoreIds || []);
      // Generate enough sequential IDs to fill numberOfCores slots,
      // skipping any IDs that are permanently consumed (discarded/replaced).
      const rows: CoreTestRow[] = [];
      let seq = 1;
      while (rows.length < batchData.numberOfCores) {
        const id = generateCoreId(seq);
        seq++;
        if (!consumedIds.has(id)) {
          rows.push({
            date: getSystemDate(),
            coreVendorNo: batchData.vendorName,
            internalCoreNo: id,
            value1000: '', value3000: '', value5000: '', value7000: '',
            singleValue: '',
            dynamicValues: {},
            remark: '',
          });
        }
      }
      return rows;
    }
    const assignedIndices = getAssignedTransformerIndices();
    const coresPerTransformer = (order?.coreDetails || []).filter(
      (core: any) => (core.coreType || core.type) === coreType
    ).length || 1;
    const totalPossibleRows = calculateTotalRowsNeeded();

    // Strategy: If assignedIndices exists, we populate ONLY those chunks.
    // Each transformer 'k' (1-based) corresponds to Cores: 
    // StartID = (k-1)*coresPerTransformer + 1
    // EndID = k*coresPerTransformer

    let rowsToCreate: { seqNum: number }[] = [];

    if (assignedIndices) {
      assignedIndices.sort((a, b) => a - b).forEach(k => {
        const startSeq = (k - 1) * coresPerTransformer + 1;
        for (let j = 0; j < coresPerTransformer; j++) {
          rowsToCreate.push({ seqNum: startSeq + j });
        }
      });
    } else {
      // Create ALL
      rowsToCreate = Array.from({ length: totalPossibleRows }, (_, i) => ({ seqNum: i + 1 }));
    }

    const vendors = getVendors();
    const defaultVendor = vendors.length > 0 && vendors[0] ? `${vendors[0].serialNo} - ${vendors[0].name}` : '';

    return rowsToCreate.map(item => ({
      date: getSystemDate(),
      coreVendorNo: defaultVendor,
      internalCoreNo: generateCoreId(item.seqNum),
      value1000: '', value3000: '', value5000: '', value7000: '',
      singleValue: '',
      dynamicValues: {},
      remark: '',
    }));
  };


  const [rows, setRows] = useState<CoreTestRow[]>(initializeRows());
  const [failedCores, setFailedCores] = useState<FailedCore[]>([]);
  const [showFailedCores, setShowFailedCores] = useState(false);
  const [showPrintLabels, setShowPrintLabels] = useState(false);
  const [testDate, setTestDate] = useState(new Date().toLocaleDateString('en-GB'));
  const [testBy, setTestBy] = useState(user?.fullName || user?.name || '');
  const [authorizedSignatory, setAuthorizedSignatory] = useState(user?.fullName || user?.name || '');
  const [tataRef, setTataRef] = useState('TR-2024-001');

  // Ready Stock States
  const [matchingReadyCores, setMatchingReadyCores] = useState<any[]>([]);
  const [isReadyModalOpen, setIsReadyModalOpen] = useState(false);
  const [activeReplaceIndex, setActiveReplaceIndex] = useState<number | null>(null);
  const [isReadyLoading, setIsReadyLoading] = useState(false);
  const [isConfirmUseModalOpen, setIsConfirmUseModalOpen] = useState(false);
  const [selectedReadyCore, setSelectedReadyCore] = useState<any>(null);

  const [localCoreCount, setLocalCoreCount] = useState<number>(batchData?.numberOfCores || 0);

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

  const [timerData, setTimerData] = useState<{
    startTime: string | null;
    accumulatedTimeMs: number;
    allocatedMinutes: number;
    status: string;
  } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const handleTimerAction = async (action: 'start' | 'pause' | 'complete') => {
    if (isReadOnly || isPreTest) return;
    try {
      const txnOrderId = getSafeOrderId(order);
      const response = await axios.post(`http://localhost:5001/api/orders/${txnOrderId}/update-timer`, {
        stage: 'core',
        coreType: coreType.toLowerCase(),
        action
      }, { withCredentials: true });
      
      if (response.data.success) {
        setTimerData(response.data.data);
      }
    } catch (err) {
      console.error(`Timer ${action} failed`, err);
    }
  };

  useEffect(() => {
    // Only start timer if we are in the actual testing screens (configured)
    if (meteringConfigured || protectionConfigured || psConfigured) {
      handleTimerAction('start');
    }
    
    return () => {
      // Pause when navigating away from this component (unmount)
      if (meteringConfigured || protectionConfigured || psConfigured) {
        handleTimerAction('pause');
      }
    };
  }, [meteringConfigured, protectionConfigured, psConfigured, coreType]);

  useEffect(() => {
    if (!timerData) return;

    // If paused, just set the static time left
    if (timerData.status !== "In Progress" || !timerData.startTime) {
      const allocatedMs = timerData.allocatedMinutes * 60 * 1000;
      const elapsed = timerData.accumulatedTimeMs || 0;
      setTimeLeft(allocatedMs - elapsed);
      return;
    }

    const interval = setInterval(() => {
      const start = new Date(timerData.startTime!).getTime();
      const accumulated = timerData.accumulatedTimeMs || 0;
      const allocatedMs = timerData.allocatedMinutes * 60 * 1000;
      const now = Date.now();
      
      const totalElapsed = accumulated + (now - start);
      setTimeLeft(allocatedMs - totalElapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [timerData]);

  const formatTime = (ms: number) => {
    const isNegative = ms < 0;
    const absMs = Math.abs(ms);
    const totalSeconds = Math.floor(absMs / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${isNegative ? '-' : ''}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const TimerDisplay = () => {
    if (timeLeft === null) return null;
    const isOver = timeLeft < 0;
    const isPaused = timerData?.status === "Paused";

    return (
      <div className={`mb-4 px-4 py-2 rounded-lg border-2 flex items-center justify-between transition-all ${
        isOver ? 'bg-red-50 border-red-500 text-red-600 animate-pulse' : 
        isPaused ? 'bg-amber-50 border-amber-300 text-amber-600' :
        'bg-green-50 border-green-500 text-green-600'
      }`}>
        <div className="flex items-center gap-2 font-bold">
          {isPaused ? <Clock className="w-4 h-4" /> : <RefreshCw className={`w-4 h-4 ${!isOver ? 'animate-spin-slow' : ''}`} />}
          <span className="text-sm uppercase tracking-wider">
            {coreType} Testing Time {isPaused ? '(Paused)' : 'Limit'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium opacity-80">Remaining:</span>
          <span className="text-2xl font-mono font-black tabular-nums">{formatTime(timeLeft)}</span>
        </div>
      </div>
    );
  };

  const protectionLimit = 600;

  // Socket Listener for real-time inventory updates
  useEffect(() => {
    const handleStockUpdate = () => {
      if (isReadyModalOpen && activeReplaceIndex !== null) {
        fetchMatchingReadyCores(activeReplaceIndex);
      }
    };

    socket.on('readyStockUpdated', handleStockUpdate);
    return () => {
      socket.off('readyStockUpdated', handleStockUpdate);
    };
  }, [isReadyModalOpen, activeReplaceIndex]);

  // Handle "IN_PROGRESS" status update when tester enters the testing report
  useEffect(() => {
    if (isPreTest && (meteringConfigured || protectionConfigured || psConfigured)) {
      updatePreTestBatchStatus("IN_PROGRESS");
    }
  }, [meteringConfigured, protectionConfigured, psConfigured]);

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


  const specsRef = useRef(specs);
  const bsatColumnsRef = useRef(bsatColumns);
  const protectionBColumnsRef = useRef(protectionBColumns);
  const psBColumnsRef = useRef(psBColumns);
  const activeRowsRef = useRef<CoreTestRow[]>(rows);
  const testByRef = useRef(testBy);
  const authSigRef = useRef(authorizedSignatory);
  const testDateRef = useRef(testDate);

  useEffect(() => { specsRef.current = specs; }, [specs]);
  useEffect(() => { bsatColumnsRef.current = bsatColumns; }, [bsatColumns]);
  useEffect(() => { protectionBColumnsRef.current = protectionBColumns; }, [protectionBColumns]);
  useEffect(() => { psBColumnsRef.current = psBColumns; }, [psBColumns]);
  useEffect(() => { activeRowsRef.current = rows; }, [rows]);
  useEffect(() => { testByRef.current = testBy; }, [testBy]);
  useEffect(() => { authSigRef.current = authorizedSignatory; }, [authorizedSignatory]);
  useEffect(() => { testDateRef.current = testDate; }, [testDate]);

  // ADDED: Comprehensive Autosave Effect
  useEffect(() => {
    if (isPreTest && batchData?.batchId) {
      debouncedSaveConfig(specs);
    }
  }, [specs, testBy, authorizedSignatory, testDate, bsatColumns, protectionBColumns, psBColumns]);


  const handleApproveBatch = async () => {
    if (!isPreTest || !batchData?.batchId) return;

    const { passed, failed } = getPassFailCount();
    const totalTested = passed + failed;

    if (totalTested < localCoreCount) {
      if (!window.confirm(`Only ${totalTested} out of ${localCoreCount} cores have been tested. Are you sure you want to approve the batch? Untested cores will remain in the batch.`)) {
        return;
      }
    } else {
      if (!window.confirm(`Are you sure you want to approve this batch? ${passed} cores will be moved to Ready Stock.`)) {
        return;
      }
    }

    try {
      const res = await axios.post(`http://localhost:5001/api/pre-test-batches/${batchData.batchId}/approve`, {}, {
        withCredentials: true
      });
      if (res.status === 200) {
        toast.success("Batch approved and moved to Ready Stock!");
        onBack();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to approve batch");
    }
  };


  // Socket Listener for real-time inventory updates
  useEffect(() => {
    const handleStockUpdate = () => {
      if (isReadyModalOpen && activeReplaceIndex !== null) {
        fetchMatchingReadyCores(activeReplaceIndex);
      }
    };

    socket.on('readyStockUpdated', handleStockUpdate);
    return () => {
      socket.off('readyStockUpdated', handleStockUpdate);
    };
  }, [isReadyModalOpen, activeReplaceIndex]);

  // Handle "IN_PROGRESS" status update when tester enters the testing report
  useEffect(() => {
    if (isPreTest && (meteringConfigured || protectionConfigured || psConfigured)) {
      updatePreTestBatchStatus("IN_PROGRESS");
    }
  }, [meteringConfigured, protectionConfigured, psConfigured]);








  const handleSpecChange = (field: string, value: string) => {
    if (isReadOnly) return;
    const updatedSpecs = { ...specs, [field]: value };
    setSpecs(updatedSpecs);
    specsRef.current = updatedSpecs;

    // Autosave for Pre-Test
    if (isPreTest && batchData?.batchId) {
      debouncedSaveConfig();
    }
  };

  const performConfigSave = async (updatedSpecs?: any) => {
    if (!isPreTest || !batchData?.batchId) return;
    const currentSpecs = updatedSpecs || specsRef.current;
    const currentBsatCols = bsatColumnsRef.current;
    const currentProtCols = protectionBColumnsRef.current;
    const currentPsCols = psBColumnsRef.current;

    try {
      const payload = {
        testSetup: {
          [isMetering ? 'coreMaterial' : 'description']: isMetering
            ? (coreTypeNano || "TOROIDAL CORE NANO CRYSTALLINE")
            : (coreType === 'Protection' ? (protectionCoreTypeM4CRGO || "M4CRGO") : (psCoreTypeM4CRGO || "M4CRGO")),
          coreSizeMm: {
            id: parseFloat(currentSpecs.coreSize1) || 0,
            od: parseFloat(currentSpecs.coreSize2) || 0,
            height: parseFloat(currentSpecs.coreSize3) || 0
          },
          turnsUsed: parseInt(currentSpecs.turnUsed || '0') || 0,
          areaSqCm: parseFloat(currentSpecs.area || '0') || 0,
          mmp: parseFloat(currentSpecs.mmp || '0') || 0,
          testBy: testByRef.current,
          authorizedSignatory: authSigRef.current,
          testDate: testDateRef.current,
          class: isPSCore ? "PS" : ""
        },
        testLimits: isMetering ? {
          bsatGauss: currentBsatCols.map(col => parseFloat(col.bsatValue) || 0),
          setMilliVolt: currentBsatCols.map(col => parseFloat(col.setMvValue) || 0),
          leLimitMa: currentBsatCols.map(col => parseFloat(col.leLimitValue) || 0)
        } : (isProtectionCore || isPSCore) ? {
          bsatGauss: (isProtectionCore ? currentProtCols : currentPsCols).map(col => parseFloat(col.bsatValue) || 0),
          setMilliVolt: (isProtectionCore ? currentProtCols : currentPsCols).map(col => parseFloat(col.setMvValue) || 0),
          leLimitMa: (isProtectionCore ? currentProtCols : currentPsCols).map(col => parseFloat(col.leLimitValue) || 0)
        } : {
          fluxTesla: parseFloat(currentSpecs.bFlux) || 0,
          voltageV: parseFloat(currentSpecs.voltage) || 0,
          iexLimitMa: isPSCore ? parseFloat(currentSpecs.iexLimit || '0') : protectionLimit
        }
      };

      await axios.patch(`http://localhost:5001/api/pre-test-batches/${batchData.batchId}`, payload, {
        withCredentials: true
      });
    } catch (err) {
      console.error("Config autosave failed", err);
    }
  };

  const configSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const debouncedSaveConfig = (updatedSpecs?: any) => {
    if (configSaveTimer.current) clearTimeout(configSaveTimer.current);
    configSaveTimer.current = setTimeout(() => performConfigSave(updatedSpecs), 1500);
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
    if (row.remark === 'PRE_TESTED') return 'PRE_TESTED';

    const columns = isProtectionCore ? protectionBColumns : (isPSCore ? psBColumns : bsatColumns);
    if (columns.length === 0) return '';

    let anyAboveLimit = false;
    let allFilled = true;
    let anyFilled = false;

    for (const column of columns) {
      const value = row.dynamicValues[column.id];
      if (value === '' || value === undefined || value === null) {
        allFilled = false;
        continue;
      }

      anyFilled = true;
      const numValue = parseFloat(value);
      const limit = parseFloat(column.leLimitValue);
      if (!isNaN(numValue) && numValue > limit) {
        anyAboveLimit = true;
      }
    }

    if (anyAboveLimit) return 'F';
    if (allFilled && anyFilled) return 'P';
    return '';
  };

  const handleRowChange = (index: number, field: keyof CoreTestRow, value: string | any) => {
    if (isReadOnly) return;
    const updatedRows = [...rows];
    updatedRows[index] = { ...updatedRows[index], [field]: value } as CoreTestRow;

    // Auto-calculate remark when values change
    if (field === 'dynamicValues' || field === 'singleValue') {
      updatedRows[index].remark = calculateRemark(updatedRows[index]);
    }

    setRows(updatedRows);
    activeRowsRef.current = updatedRows;

    // Add Autosave for Pre-Test
    if (isPreTest && batchData?.batchId) {
      debouncedSaveRow(updatedRows[index], index);
    }
  };




  const handleReplaceCore = (index: number) => {
    if (isReadOnly) return;
    const failedRow = rows[index];

    // Guard against undefined row
    if (!failedRow) {
      console.error('Failed to find row at index:', index);
      return;
    }

    const systemDate = getSystemDate();

    // Use safe resolver instead of unsafe type casting
    const txnOrderId = getSafeOrderId(order);

    const failedCore: FailedCore = {
      orderId: txnOrderId,
      jobId: order.jobId,
      clientName: order.clientName,
      coreType: coreType,
      internalCoreNo: failedRow.internalCoreNo,
      coreVendorNo: failedRow.coreVendorNo,
      date: failedRow.date || systemDate,
      failureReason: getFailureReason(failedRow),
      dynamicValues: failedRow.dynamicValues,
      value1000: failedRow.value1000 || '',
      value3000: failedRow.value3000 || '',
      value5000: failedRow.value5000 || '',
      value7000: failedRow.value7000 || '',
      singleValue: failedRow.singleValue || '',
    };
    setFailedCores([...failedCores, failedCore]);

    // Generate a NEW ID based on the total count of cores existing in the table
    const updatedRows = [...rows];
    const replacementId = `${failedRow.internalCoreNo} (R)`;

    // Replace the failed row entirely with the new blank replacement row
    updatedRows.splice(index, 1, {
      date: systemDate,
      coreVendorNo: failedRow.coreVendorNo, // Keep same vendor by default
      internalCoreNo: replacementId,
      value1000: '', value3000: '', value5000: '', value7000: '',
      singleValue: '',
      dynamicValues: {},
      remark: '',
      isReplacement: true,
      replacedCoreId: failedRow.internalCoreNo,
    });

    setRows(updatedRows);
  };

  const fetchMatchingReadyCores = async (index: number) => {
    console.log(`[FETCH_READY] Triggered for index ${index}. Current coreType: ${coreType}`);
    setIsReadyLoading(true);
    setActiveReplaceIndex(index);
    setIsReadyModalOpen(true);

    try {
      // Search for specs in order details first, fallback to current component specs
      let coreSpecs = (order.coreDetails || []).find((c: any) => {
        const desc = (c.description || "").toUpperCase();
        const cType = c.coreType || "";
        // More robust detection: PS cores often have Iex limit, Protection cores have specific types.
        const looksLikePS = cType === 'PS' || c.class === 'PS' || desc.includes(' PS ') || desc.includes('PS');

        if (coreType === 'PS') return looksLikePS;
        if (coreType === 'Protection') return cType === 'Protection' && !looksLikePS;
        if (coreType === 'Metering') return cType === 'Metering';
        return false;
      });

      console.log(`[FETCH_READY] Detected coreSpecs for ${coreType}:`, coreSpecs);

      const queryParams: any = {
        status: 'available',
        coreType: coreType,
      };

      console.log(`[FETCH_READY] Final Query Params:`, queryParams);

      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5001/api/ready-transformers/available`, {
        params: queryParams,
        withCredentials: true,
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });

      console.log(`[FETCH_READY] Received ${res.data.length} matching cores.`);
      setMatchingReadyCores(res.data);
    } catch (err) {
      console.error("[FETCH_READY] Error fetching ready cores:", err);
      toast.error("Failed to fetch matching stock");
    } finally {
      setIsReadyLoading(false);
    }
  };

  const handleReserveReadyCore = async (core: any) => {
    if (!core?._id) return;
    const token = localStorage.getItem('token');
    try {
      await axios.post(`http://localhost:5001/api/ready-transformers/reserve/${core._id}`, {}, {
        withCredentials: true,
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      setSelectedReadyCore(core);
      setIsReadyModalOpen(false);
      setIsConfirmUseModalOpen(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reserve core");
    }
  };

  const handleUseReadyCore = async () => {
    const currentCore = selectedReadyCore;
    const currentIndex = activeReplaceIndex;

    if (!currentCore || currentIndex === null) return;
    try {
      const failedRow = rows[currentIndex];
      if (!failedRow) return;

      const txnOrderId = getSafeOrderId(order);

      // 1. Move failed unit to Failed Section in Backend ONLY for Pre-Test immediately.
      // For standard orders, we wait until user clicks "Replace" on the UI to move it to Failed Cores.
      if (isPreTest && batchData?.batchId) {
        const token = localStorage.getItem('token');
        // Pre-Test batch: use the batch discard endpoint
        await axios.post(`http://localhost:5001/api/pre-test-batches/${batchData.batchId}/discard-core`, {
          internalCoreNo: failedRow.internalCoreNo,
          vendorCoreNo: failedRow.coreVendorNo,
          reason: "Replaced from Ready Stock",
          isReplacement: true,
          dynamicValues: failedRow.dynamicValues
        }, {
          withCredentials: true,
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
      }

      // 2. Mark as used in Inventory and Link to Order
      const token = localStorage.getItem('token');
      const res = await axios.post(`http://localhost:5001/api/ready-transformers/use/${currentCore._id}`, {
        orderId: txnOrderId,
        replacedCoreId: failedRow.internalCoreNo
      }, {
        withCredentials: true,
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });

      const usedCore = res.data.transformer;
      const systemDate = getSystemDate();
      const testData = usedCore.testResults || {};
      const failedCoreId = failedRow.internalCoreNo;
      const replacementNo = `${failedCoreId} (R)`;
      // Smart reading extraction: Match based on current columns
      let dynamicValues: { [key: string]: string } = {};
      const isPS = (coreType as string) === 'PS';
      const isProtection = (coreType as string) === 'Protection';
      const currentCols = isPS ? psBColumns : (isProtection ? protectionBColumns : bsatColumns);

      console.log(`[USE_READY] Extracting readings for ${coreType} using ${currentCols.length} columns.`);

      // First: map measuredMa array by index to column ids (1-indexed)
      if (Array.isArray(testData.measuredMa) && testData.measuredMa.length > 0) {
        currentCols.forEach((col, i) => {
          if (testData.measuredMa[i] != null) {
            dynamicValues[col.id] = String(testData.measuredMa[i]);
          }
        });
      } else if (testData.dynamicValues && typeof testData.dynamicValues === 'object') {
        // Fallback: try to match by key if dynamicValues exists
        dynamicValues = { ...testData.dynamicValues };
      } else if (testData.value != null) {
        // Fallback for single-value cores (Metering non-BSAT)
        dynamicValues["1"] = String(testData.value);
      }

      console.log(`[USE_READY] Extracted dynamic values:`, dynamicValues);

      // Second: fill any still-missing cols from flat testData keys
      currentCols.forEach(col => {
        if (!dynamicValues[col.id]) {
          const val = testData[`value${col.bsatValue}`] ||
            testData[`v${col.bsatValue}`] ||
            testData[col.bsatValue] ||
            testData[`value_${col.bsatValue}`];
          if (val != null) dynamicValues[col.id] = String(val);
        }
      });

      const replacementRow: CoreTestRow = {
        date: testData.date || systemDate,
        coreVendorNo: currentCore.vendorName || testData.vendorCoreNo || usedCore.vendorCoreNo || usedCore.coreVendorNo || failedRow.coreVendorNo || 'STOCK',
        internalCoreNo: replacementNo,
        value1000: testData.value1000 || testData.v1000 || '',
        value3000: testData.value3000 || testData.v3000 || '',
        value5000: testData.value5000 || testData.v5000 || '',
        value7000: testData.value7000 || testData.v7000 || '',
        singleValue: usedCore.value != null ? String(usedCore.value) : (dynamicValues["1"] || ''),
        dynamicValues,
        remark: testData.remark || 'PRE_TESTED',
        isReplacement: true,
        replacedCoreId: failedRow.internalCoreNo,
        status: (testData.status as any) || 'PASS'
      };

      // Replace the failed row entirely with the new ready stock row
      // No, we keep the failed row and insert the replacement after it!
      const nextRows = [...rows];
      nextRows[currentIndex] = { ...failedRow, status: 'FAIL', remark: 'F' };
      nextRows.splice(currentIndex + 1, 0, replacementRow);

      setRows(nextRows);
      activeRowsRef.current = nextRows;

      // CRITICAL: Save the replacement row IMMEDIATELY
      if (isPreTest && batchData?.batchId) {
        const rowToSave = nextRows[currentIndex + 1];
        if (rowToSave) {
          await performRowSave(rowToSave, currentIndex + 1);
        }
      } else {
        await handleSave(nextRows);
      }

      setIsConfirmUseModalOpen(false);
      setSelectedReadyCore(null);
      setActiveReplaceIndex(null);

      // FIXED: Do NOT decrement localCoreCount for replacements
      // if (isPreTest) {
      //   setLocalCoreCount(prev => Math.max(0, prev - 1));
      // }

      toast.success("Ready core assigned successfully!");
    } catch (err: any) {
      console.error("Use Core Error:", err);
      toast.error(err.response?.data?.message || "Failed to use core");
    }
  };

  const handleMoveToFailed = async (index: number) => {
    const failedRow = rows[index];
    if (!failedRow) return;

    if (!window.confirm(`Are you sure you want to move core ${failedRow.internalCoreNo} to the Failed Core section permanently?`)) {
      return;
    }

    const txnOrderId = getSafeOrderId(order);
    if (!txnOrderId) {
      toast.error("Error: Order ID missing. Cannot move to failed section.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      // 1. Move failed unit to Failed Section in Backend
      const payload = {
        orderId: txnOrderId,
        internalCoreNo: failedRow.internalCoreNo,
        vendorCoreNo: failedRow.coreVendorNo,
        failureReason: getFailureReason(failedRow) || "Replaced from Ready Stock",
        failureStage: "TESTING",
        dynamicValues: failedRow.dynamicValues,
        coreType: coreType // Backend normalizes this
      };

      console.log("Moving core to failed section:", payload);
      await axios.post(`http://localhost:5001/api/failed-cores`, payload, {
        withCredentials: true,
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });

      // 2. Update local UI state
      const nextRows = rows.filter((_, i) => i !== index);
      setRows(nextRows);

      // 3. Persist the grid state immediately (crucial for permanent removal from this order)
      console.log("Persisting grid state after removal...");
      await handleSave(nextRows);

      toast.success("Core moved to failed section and removed from grid.");
    } catch (err: any) {
      console.error("Move to failed error:", err);
      toast.error(err.response?.data?.message || "Failed to move core to Failed Section");
    }
  };

  const saveTimers = useRef<{ [key: number]: NodeJS.Timeout }>({});

  useEffect(() => {
    return () => {
      // Cleanup all pending timers on unmount
      Object.values(saveTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  const performRowSave = async (row: CoreTestRow, index: number) => {
    if (!isPreTest || !batchData?.batchId) return;
    const currentSpecs = specsRef.current;
    const currentBsatCols = bsatColumnsRef.current;
    const currentProtCols = protectionBColumnsRef.current;
    const currentPsCols = psBColumnsRef.current;

    setIsSaving(true);
    try {
      const [day, month, year] = testDate.split('/');
      const formattedDate = new Date(`${year}-${month}-${day}`);

      const payload = {
        reading: {
          date: formattedDate,
          vendorCoreNo: row.coreVendorNo,
          internalCoreNo: row.internalCoreNo,
          ...(isMetering || isProtectionCore || isPSCore
            ? {
              measuredMa: (isMetering ? currentBsatCols : (isProtectionCore ? currentProtCols : currentPsCols)).map(col => {
                const val = row.dynamicValues[col.id];
                if (val === '' || val === undefined || val === null) return null;
                const num = parseFloat(val);
                return isNaN(num) ? null : num;
              })
            }
            : { value: (row.singleValue === '' || row.singleValue === undefined || row.singleValue === null) ? null : parseFloat(row.singleValue) }
          ),
          result: row.remark || "",
          status: row.status || (row.remark === 'P' ? 'PASS' : (row.remark === 'F' ? 'FAIL' : 'PENDING'))
        },
        testSetup: {
          [isMetering ? 'coreMaterial' : 'description']: isMetering
            ? (coreTypeNano || "TOROIDAL CORE NANO CRYSTALLINE")
            : (coreType === 'Protection' ? (protectionCoreTypeM4CRGO || "M4CRGO") : (psCoreTypeM4CRGO || "M4CRGO")),
          coreSizeMm: {
            id: parseFloat(currentSpecs.coreSize1) || 0,
            od: parseFloat(currentSpecs.coreSize2) || 0,
            height: parseFloat(currentSpecs.coreSize3) || 0
          },
          turnsUsed: parseInt(currentSpecs.turnUsed || '0') || 0,
          areaSqCm: parseFloat(currentSpecs.area || '0') || 0,
          mmp: parseFloat(currentSpecs.mmp || '0') || 0
        },
        testLimits: isMetering ? {
          bsatGauss: currentBsatCols.map(col => parseFloat(col.bsatValue) || 0),
          setMilliVolt: currentBsatCols.map(col => parseFloat(col.setMvValue) || 0),
          leLimitMa: currentBsatCols.map(col => parseFloat(col.leLimitValue) || 0)
        } : (isProtectionCore || isPSCore) ? {
          bsatGauss: (isProtectionCore ? currentProtCols : currentPsCols).map(col => parseFloat(col.bsatValue) || 0),
          setMilliVolt: (isProtectionCore ? currentProtCols : currentPsCols).map(col => parseFloat(col.setMvValue) || 0),
          leLimitMa: (isProtectionCore ? currentProtCols : currentPsCols).map(col => parseFloat(col.leLimitValue) || 0)
        } : {
          fluxTesla: parseFloat(currentSpecs.bFlux) || 0,
          voltageV: parseFloat(currentSpecs.voltage) || 0,
          iexLimitMa: isPSCore ? parseFloat(currentSpecs.iexLimit || '0') : protectionLimit
        }
      };

      console.log(`DEBUG: Saving row ${index} (${payload.reading.internalCoreNo}) to batch ${batchData.batchId}`);
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5001/api/pre-test-batches/${batchData.batchId}/save-reading`, payload, {
        withCredentials: true,
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });

      console.log("DEBUG: Save successful for row", index);
      delete saveTimers.current[index];
    } catch (err) {
      console.error("Autosave failed", err);
    } finally {
      setIsSaving(false);
    }
  };

  const debouncedSaveRow = (row: CoreTestRow, index: number) => {
    if (saveTimers.current[index]) clearTimeout(saveTimers.current[index]);
    saveTimers.current[index] = setTimeout(() => performRowSave(row, index), 1500);
  };

  const handleBack = async () => {
    handleTimerAction('pause');
    if (isPreTest && batchData?.batchId) {
      setIsSaving(true);
      // 1. Flush pending row saves
      const timers = Object.entries(saveTimers.current);
      for (const [index, timer] of timers) {
        clearTimeout(timer);
        const idx = parseInt(index);
        const row = activeRowsRef.current[idx];
        if (row) {
          await performRowSave(row, idx);
        }
      }

      // 2. Flush config save
      if (configSaveTimer.current) {
        clearTimeout(configSaveTimer.current);
        await performConfigSave();
      }
      setIsSaving(false);
    }
    onBack();
  };

  const handleDiscardCore = async (index: number) => {
    if (!isPreTest || !batchData?.batchId) return;
    const row = rows[index];
    if (!row) return;
    if (!row.internalCoreNo) return;

    if (!window.confirm(`Are you sure you want to discard core ${row.internalCoreNo}? It will be moved to the failed section and removed from this batch.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`http://localhost:5001/api/pre-test-batches/${batchData.batchId}/discard-core`, {
        internalCoreNo: row.internalCoreNo,
        vendorCoreNo: row.coreVendorNo,
        reason: "Failed testing",
        dynamicValues: row.dynamicValues
      }, {
        withCredentials: true,
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });

      if (response.status === 200) {
        toast.success("Core discarded and moved to Failed Section");
        const newRows = [...rows];
        newRows.splice(index, 1);
        setRows(newRows);
        setLocalCoreCount(prev => Math.max(0, prev - 1));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to discard core");
    }
  };

  const handleSave = async (rowsOverride?: CoreTestRow[]) => {
    if (isReadOnly) return;
    try {
      const isMetering = coreType === 'Metering';
      const isPS = coreType === 'PS';

      const currentRows = rowsOverride || rows;

      // 1. AUTO-FILL IDs & CALCULATE REMARKS
      const processedRows = currentRows.map((row, index) => {
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
        // Include row if it has any data OR if it's a replacement/failed record that needs to persist
        return hasId && (hasDynValues || hasSingleValue || row.isReplacement || row.status);
      });

      if (validReadings.length === 0) {
        alert("No data to save. Please enter Internal Core Nos and test readings.");
        return;
      }

      // 3. CONVERT DATE (Fixes the "Cast to date failed" error)
      const [day, month, year] = testDate.split('/');
      const formattedDate = new Date(`${year}-${month}-${day}`);

      const endpoint = isMetering ? '/metering-tests' : '/protection-tests';
      // const txnOrderId = (order as any)._id || order.id;
      // Grabs the ID of the Parent Order, not the individual Transformer
      // SAFE ORDER ID ACCESS
      // Check mainOrderId (if passed), orderId (if populated object OR string), _id (Mongo), or id (string fallback)
      // We check if orderId is an object with _id, OR if orderId is just a string/value itself.
      const txnOrderId = (order as any).mainOrderId
        || ((typeof (order as any).orderId === 'object') ? (order as any).orderId?._id : (order as any).orderId)
        || (order as any)._id
        || order.id;

      console.log("DEBUG: Sending Order ID to Backend:", txnOrderId);

      if (!txnOrderId && !isPreTest) {
        alert("Error: Order ID is missing from the data. Please contact support.");
        return;
      }

      let finalPayload: any = {
        orderId: txnOrderId,
        coreType: coreType,
        testedBy: testBy,
        authorisedBy: authorizedSignatory,
        // testSetup: {
        //   [isMetering ? 'coreMaterial' : 'description']: isMetering
        //     ? coreTypeNano
        //     : (coreType === 'Protection' ? protectionCoreTypeM4CRGO : "PS Core Material"),
        testSetup: {
          // PROTECTION SCHEMA requires 'description'. METERING requires 'coreMaterial'.
          [isMetering ? 'coreMaterial' : 'description']: isMetering
            ? (coreTypeNano || "TOROIDAL CORE NANO CRYSTALLINE")
            : (coreType === 'Protection' ? (protectionCoreTypeM4CRGO || "M4CRGO") : "PS Core Material"),


          coreSizeMm: {
            id: parseFloat(specs.coreSize1) || 0,
            od: parseFloat(specs.coreSize2) || 0,
            height: parseFloat(specs.coreSize3) || 0
          },
          turnsUsed: parseInt(specs.turnUsed || '0') || 0,
          areaSqCm: parseFloat(specs.area || '0') || 0,
          mmp: parseFloat(specs.mmp || '0') || 0,
          class: isPSCore ? "PS" : ""
        },
        readings: [
          ...validReadings.map(row => ({
            date: formattedDate,
            vendorCoreNo: row.coreVendorNo,
            internalCoreNo: row.internalCoreNo,
            // Always serialize as measuredMa array so load can restore dynamicValues correctly
            ...(isMetering
              ? { measuredMa: bsatColumns.map(col => parseFloat(row.dynamicValues[col.id] || '0') || 0) }
              : (() => {
                  const activeCols = isPS ? psBColumns : protectionBColumns;
                  const maArr = activeCols.length > 0
                    ? activeCols.map(col => {
                        const v = row.dynamicValues[col.id];
                        return (v === '' || v == null) ? null : (parseFloat(v) || 0);
                      })
                    : [parseFloat(row.singleValue || Object.values(row.dynamicValues)[0] || '0') || null];
                  // Also keep `value` for schema backward-compat
                  const firstVal = maArr.find(v => v != null);
                  return { measuredMa: maArr, value: firstVal ?? null };
                })()
            ),
            result: row.remark || "F",
            isReplacement: !!row.isReplacement,
            replacedCoreId: row.replacedCoreId || null
          }))
        ]
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
          iexLimitMa: isPS ? parseFloat(specs.iexLimit || '0') : protectionLimit
        };
      }

      if (isPreTest && batchData) {
        // Redirect to Pre-Test Batch API
        const batchPayload = {
          readings: validReadings.map(row => ({
            date: formattedDate,
            vendorCoreNo: row.coreVendorNo,
            internalCoreNo: row.internalCoreNo,
            ...(isMetering || isProtectionCore || isPSCore
              ? { measuredMa: (isMetering ? bsatColumns : (isProtectionCore ? protectionBColumns : psBColumns)).map(col => {
                  const val = row.dynamicValues[col.id];
                  if (val === '' || val === undefined || val === null) return null;
                  const num = parseFloat(val);
                  return isNaN(num) ? null : num;
                })
              }
              : { value: (row.singleValue === '' || row.singleValue === undefined || row.singleValue === null) ? null : parseFloat(row.singleValue) }
            ),
            result: row.remark || "",
            status: row.status || (row.remark === 'P' ? 'PASS' : (row.remark === 'F' ? 'FAIL' : 'PENDING'))
          })),
          testSetup: finalPayload.testSetup,
          testLimits: isMetering ? finalPayload.testLimits : finalPayload.testSpecification
        };

        await axios.patch(`http://localhost:5001/api/pre-test-batches/${batchData.batchId}`, batchPayload, {
          withCredentials: true
        });

        toast.success("Batch progress saved successfully!");
        return;
      }

      console.log("DEBUG: Sending Final Payload to Backend:", finalPayload);

      const token = localStorage.getItem('token');
      const response = await axios.post(`http://localhost:5001/api${endpoint}`, finalPayload, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (isPreTest) {
        const passCount = response.data.passedCount || 0;
        const failCount = response.data.failedCount || 0;
        toast.success(`Pre-Test Batch Complete! ${passCount} passed → Ready Stock, ${failCount} failed → Return to Vendor.`);
        onBack();
        return;
      }

      if (response.data.readyStockAvailable) {
        toast.warning("Failures detected! Matching ready stock is available.", {
          description: "Click to view and reserve pre-tested cores.",
          action: {
            label: "View Stock",
            onClick: () => setIsReadyModalOpen(true)
          },
          duration: 8000
        });
      } else {
        toast.success(`${coreType} Data Saved Successfully!`);
      }

    } catch (error: any) {
      console.error("Save Error:", error);
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const getFilledRowsCount = () => {
    return rows.filter(row => {
      if (!row.internalCoreNo) return false;
      // If marked Pass/Fail or Replacement, it's completed
      if (row.remark === 'P' || row.remark === 'F' || row.remark === 'PRE_TESTED' || row.remark === 'PRE TESTED') return true;
      
      // Otherwise check if any dynamic values are entered
      const hasAnyValue = Object.values(row.dynamicValues || {}).some(v => v !== '' && v !== null);
      // For legacy/simple protection cores
      const hasSingleValue = row.singleValue !== '' && row.singleValue !== null;
      
      return hasAnyValue || hasSingleValue;
    }).length;
  };

  const getPassFailCount = () => {
    // P: only cores explicitly marked as 'P' (passed threshold test)
    // F: only cores explicitly marked as 'F' (failed threshold test)
    // Cores with empty remark = untested/incomplete — NOT counted in either P or F
    // Replacement cores (PRE_TESTED) are also counted as passed.
    const passed = rows.filter(row => 
      row.remark === 'P' || row.remark === 'PRE_TESTED' || row.remark === 'PRE TESTED'
    ).length;
    const failed = rows.filter(row => row.remark === 'F').length;
    return { passed, failed };
  };

  const getPassedCores = () => {
    return rows.filter(row => 
      (row.remark === 'P' || row.remark === 'PRE_TESTED' || row.remark === 'PRE TESTED') && row.internalCoreNo
    );
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

  // Handle Order Approval (BATCH)
  const handleApprove = async () => {
    if (isReadOnly) return;
    // Check if all rows have a remark (test completed)
    if (getFilledRowsCount() !== rows.length) {
      alert('Please complete all test rows before approving.');
      return;
    }

    if (!window.confirm(`Are you sure you want to approve this batch of ${rows.length} cores? This will move them to the Secondary stage.`)) {
      return;
    }

    try {
      // Collect Internal Core IDs to approve
      const internalCoreNos = rows.map(r => r.internalCoreNo);

      // Send Batch Approval
      const response = await axios.put(`http://localhost:5001/api/core-tests/approve-batch`, {
        jobId: order.jobId,
        internalCoreNos
      }, { withCredentials: true });

      if (response.status === 200) {
        alert('Batch approved and moved to Secondary Testing!');
        onBack(); // Return to the dashboard/previous view
      }
    } catch (error: any) {
      console.error('Approval Error:', error);
      const msg = error.response?.data?.message || 'Failed to approve batch.';
      alert(msg);
    }
  };

  const renderReadyStockModals = () => {
    console.log(`[RENDER_MODALS] Rendering modals. isReadyModalOpen: ${isReadyModalOpen}, matchingReadyCores: ${matchingReadyCores.length}`);
    return (
      <>
        {/* Ready Stock Selection Modal */}
        <ReadyStockModal
          isOpen={isReadyModalOpen}
          onClose={() => setIsReadyModalOpen(false)}
          cores={matchingReadyCores}
          isLoading={isReadyLoading}
          onSelect={handleReserveReadyCore}
        />

        {/* Confirmation Modal for using ready core */}
        <Dialog open={isConfirmUseModalOpen} onOpenChange={setIsConfirmUseModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Assignment</DialogTitle>
              <DialogDescription>
                Are you sure you want to use pre-tested core <strong>{selectedReadyCore?.coreId || selectedReadyCore?.serialNumber}</strong> for this transformer?
                This action will mark the current core as FAILED and assign the ready core as a replacement.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-blue-50 p-4 rounded-md space-y-2">
              <p className="text-sm font-semibold">Ready Core Details:</p>
              <div className="text-xs space-y-1">
                <p>Serial: {selectedReadyCore?.coreId || selectedReadyCore?.serialNumber}</p>
                <p>Type: {selectedReadyCore?.coreType || selectedReadyCore?.specifications?.coreType || 'Core'}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfirmUseModalOpen(false)}>Cancel</Button>
              <Button onClick={handleUseReadyCore} className="bg-green-600 hover:bg-green-700">Confirm & Use</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-gray-500 font-medium">Fetching testing data...</p>
      </div>
    );
  }

  if (showPrintLabels) {
    return (
      <>
        <CoreLabelsPrint
          cores={getPassedCores()}
          order={order}
          coreType={coreType}
          onBack={() => setShowPrintLabels(false)}
        />
        {renderReadyStockModals()}
      </>
    );
  }

  if (showFailedCores) {
    return (
      <>
        <FailedCoresManager
          failedCores={failedCores}
          onBack={() => setShowFailedCores(false)}
        />
        {renderReadyStockModals()}
      </>
    );
  }

  // Protection Core Template
  if (isProtectionCore) {
    // Protection Configuration Screen
    if (!protectionConfigured && !isReadOnly) { // Skip config screen if Read Only (Assume configured)
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
        const updated = protectionBColumns.map(col =>
          col.id === id ? { ...col, [field]: value } : col
        );
        setProtectionBColumns(updated);
        protectionBColumnsRef.current = updated;
        if (isPreTest && batchData?.batchId) debouncedSaveConfig();
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
        // Save config immediately
        debouncedSaveConfig(specs);
        updatePreTestBatchStatus("CONFIGURED");
        alert('Configuration saved successfully! You can now enter core testing data.');
      };

      return (
        <div className="space-y-6 p-2 sm:p-6 max-w-[1600px] mx-auto overflow-x-hidden">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="outline"
                onClick={handleBack}
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
                <Select value={protectionCoreTypeM4CRGO} onValueChange={(value: string) => setProtectionCoreTypeM4CRGO(value as 'M4CRGO')}>
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
                <Select value={specs.turnUsed} onValueChange={(value: string) => handleSpecChange('turnUsed', value)}>
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
                {protectionBColumns.map((column) => (
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
        {isReadOnly && (
          <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 mb-4" role="alert">
            <div className="flex items-center">
              <div className="py-1"><AlertTriangle className="h-6 w-6 text-amber-500 mr-4" /></div>
              <div>
                <p className="font-bold">Read-Only View</p>
                <p className="text-sm">You are viewing a historical record. Modifications are disabled.</p>
              </div>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="outline"
              onClick={handleBack}
              size="sm"
              className="mb-2 gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-800">Core Testing Report - Protection</h2>
              {isPreTest && getFilledRowsCount() >= rows.length && rows.length > 0 && (
                <Badge className="bg-green-600 text-white border-none shadow-sm animate-in fade-in zoom-in duration-300">
                  <Check className="w-3 h-3 mr-1" />
                  COMPLETED
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1 font-medium flex items-center gap-2">
              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">{order.jobId}</span>
              <span>•</span>
              <span>{order.clientName}</span>
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
            {!isReadOnly && !isPreTest && (getFilledRowsCount() >= calculateTotalRowsNeeded()) && (
              <Button
                size="sm"
                className="gap-1 bg-[#003a70] hover:bg-[#002a50] text-white shadow-md border border-[#001a30] px-4 font-bold"
                onClick={handleApprove}
              >
                <Check className="w-3 h-3" />
                Approve Batch
              </Button>
            )}
            <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700" onClick={() => handleSave()}>
              <Save className="w-3 h-3" />
              Save All
            </Button>
          </div>
        </div>

        {/* Progress */}
        <Card className="p-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Cores Tested: <span className="font-medium text-gray-900">{getFilledRowsCount()} / {calculateTotalRowsNeeded()}</span></span>
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
                {/* PRINT ONLY HEADER */}
                <tr className="print-only">
                  <td colSpan={3 + protectionBColumns.length + 1} className="border-0 p-0">
                    <ReportHeader
                      title={`Core Testing Report - ${coreType}`}
                      orderId={getSafeOrderId(order)}
                      clientName={getSafeClientName(order)}
                      reportDate={testDate}
                      batchId={getSafeBatchId(order)}
                    />
                    {/* DEDICATED PRINT COMPONENT (HIDDEN ON SCREEN) */}
                    <div className="print-only">
                      <CoreReportPrint
                        order={order}
                        coreType={coreType}
                        specs={specs}
                        rows={rows}
                        bsatColumns={protectionBColumns}
                        testDate={testDate}
                        testBy={testBy}
                        authorizedSignatory={authorizedSignatory}
                        materialType={protectionCoreTypeM4CRGO}
                      />
                    </div>
                  </td>
                </tr>

                {/* Title Row */}
                <tr className="screen-only">
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
                  <td colSpan={protectionBColumns.length + 3} className="bg-white p-3 border border-gray-400">
                    <span className="print-only font-bold">{protectionCoreTypeM4CRGO}</span>
                  </td>
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
                  {renderVendorHeader()}
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
                    <td className="bg-white p-3 border border-gray-400 text-center font-medium">
                      <Input
                        value={testDate} // Use the state variable
                        onChange={(e) => setTestDate(e.target.value)} // Allow manual changes if needed
                        className="w-28 h-7 text-xs border-gray-300 text-center mx-auto"
                      />
                    </td>
                    {renderVendorCell(row, index)}
                    <td colSpan={2} className="p-2 border border-gray-300">
                      <div className="flex items-center gap-1">
                        <Input
                          value={String(row.internalCoreNo || '')}
                          onChange={(e) => handleRowChange(index, 'internalCoreNo', e.target.value)}
                          disabled={isReadOnly || isRowLocked(row)}
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
                          onKeyDown={(e) => {
                            if (e.ctrlKey || e.metaKey || ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter", "."].includes(e.key)) return;
                            if (!/^[0-9+\-]$/.test(e.key)) e.preventDefault();
                          }}
                          onChange={(e) => {
                            const filtered = e.target.value.replace(/[^0-9+\-.]/g, '');
                            handleRowChange(index, 'dynamicValues', { ...row.dynamicValues, [column.id]: filtered });
                          }}
                          disabled={isReadOnly || isRowLocked(row)}
                          className={`w-full h-8 text-xs border-0 focus:ring-1 focus:ring-blue-300 text-center font-medium ${row.dynamicValues[column.id] !== '' && parseFloat(row.dynamicValues[column.id] || '0') > parseFloat(column.leLimitValue) ? 'bg-red-50 text-red-700' : ''
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
                        {row.remark === 'F' && (
                          <div className="flex flex-col gap-1">
                            {isPreTest ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDiscardCore(index)}
                                className="h-7 px-2 text-[10px] gap-1 border-red-500 text-red-600 hover:bg-red-50 bg-white font-bold shadow-sm"
                                title="Discard this failed core and move to Failed section"
                              >
                                <Trash2 className="w-3 h-3" />
                                Discard
                              </Button>
                            ) : (
                              !rows.some(r => r.replacedCoreId === row.internalCoreNo) ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleReplaceCore(index)}
                                    className="h-7 px-2 text-[10px] gap-1 border-orange-500 text-orange-700 bg-white hover:bg-orange-50 font-bold shadow-sm"
                                    title="Replace this failed core with manual testing"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    Manual Replace
                                  </Button>
                                  <Button
                                    size="sm"
                                    type="button"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log("Use Ready Stock clicked for row", index);
                                      fetchMatchingReadyCores(index);
                                    }}
                                    className="h-7 px-2 text-[10px] gap-1 border-blue-500 text-blue-700 hover:bg-blue-50 bg-white font-bold shadow-sm cursor-pointer relative z-10"
                                    title="Use pre-tested core from stock"
                                  >
                                    <Package className="w-3 h-3 pointer-events-none" />
                                    Use Ready Stock
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMoveToFailed(index)}
                                  className="h-7 px-2 text-[10px] gap-1 border-red-500 text-red-600 hover:bg-red-50 bg-white font-bold shadow-sm"
                                  title="Move this replaced core to the Failed Core section"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Move to Failed
                                </Button>
                              )
                            )}
                          </div>
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
                    <div className="h-16"></div> {/* Space for stamps */}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>



        {/* Completion Summary */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h4 className="font-medium text-blue-900">Testing Summary</h4>
                {isPreTest && (
                  <>
                    {isSaving ? (
                      <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-100/50 px-2 py-0.5 rounded-full animate-pulse border border-blue-200">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        Saving...
                      </div>
                    ) : (
                      Object.keys(saveTimers.current).length === 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                          <Check className="w-3 h-3" />
                          Saved
                        </div>
                      )
                    )}
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-4 mt-2">
                <div className="bg-white p-2 rounded shadow-sm border border-blue-100 min-w-[100px]">
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Assigned</div>
                  <div className="text-lg font-bold text-gray-900">{calculateTotalRowsNeeded()}</div>
                </div>
                <div className="bg-white p-2 rounded shadow-sm border border-blue-100 min-w-[100px]">
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Completed</div>
                  <div className="text-lg font-bold text-green-600">{getFilledRowsCount()}</div>
                </div>
                <div className="bg-white p-2 rounded shadow-sm border border-blue-100 min-w-[100px]">
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Remaining</div>
                  <div className="text-lg font-bold text-blue-600">{Math.max(0, calculateTotalRowsNeeded() - getFilledRowsCount())}</div>
                </div>
                <div className="bg-white p-2 rounded shadow-sm border border-blue-100 min-w-[100px]">
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Auto-added (Failures)</div>
                  <div className="text-lg font-bold text-red-500">{failedCores.length}</div>
                </div>
              </div>
            </div>
            {getFilledRowsCount() >= calculateTotalRowsNeeded() && (
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <span className="font-medium">Complete</span>
              </div>
            )}
          </div>
        </Card>
        {renderReadyStockModals()}
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
        const updated = psBColumns.map(col =>
          col.id === id ? { ...col, [field]: value } : col
        );
        setPsBColumns(updated);
        psBColumnsRef.current = updated;
        if (isPreTest && batchData?.batchId) debouncedSaveConfig();
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
        // Save config immediately
        debouncedSaveConfig(specs);
        updatePreTestBatchStatus("CONFIGURED");
        alert('Configuration saved successfully! You can now enter core testing data.');
      };

      return (
        <div className="space-y-6 p-2 sm:p-6 max-w-[1600px] mx-auto overflow-x-hidden">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="outline"
                onClick={handleBack}
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
                <Select value={psCoreTypeM4CRGO} onValueChange={(value: string) => setPsCoreTypeM4CRGO(value as 'M4CRGO')}>
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
                <Select value={specs.turnUsed} onValueChange={(value: string) => handleSpecChange('turnUsed', value)}>
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
                {psBColumns.map((column) => (
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
        {isReadOnly && (
          <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 mb-4" role="alert">
            <div className="flex items-center">
              <div className="py-1"><AlertTriangle className="h-6 w-6 text-amber-500 mr-4" /></div>
              <div>
                <p className="font-bold">Read-Only View</p>
                <p className="text-sm">You are viewing a historical record. Modifications are disabled.</p>
              </div>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="outline"
              onClick={handleBack}
              size="sm"
              className="mb-2 gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-800">Core Testing Report - PS</h2>
              {isPreTest && getFilledRowsCount() >= rows.length && rows.length > 0 && (
                <Badge className="bg-green-600 text-white border-none shadow-sm animate-in fade-in zoom-in duration-300">
                  <Check className="w-3 h-3 mr-1" />
                  COMPLETED
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1 font-medium flex items-center gap-2">
              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">{order.jobId}</span>
              <span>•</span>
              <span>{order.clientName}</span>
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
            {!isReadOnly && !isPreTest && (getFilledRowsCount() >= calculateTotalRowsNeeded()) && (
              <Button
                size="sm"
                className="gap-1 bg-[#003a70] hover:bg-[#002a50] text-white shadow-md border border-[#001a30] px-4 font-bold"
                onClick={handleApprove}
              >
                <Check className="w-3 h-3" />
                Approve Batch
              </Button>
            )}
            <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700" onClick={() => handleSave()}>
              <Save className="w-3 h-3" />
              Save All
            </Button>
          </div>
        </div>

        {/* Progress */}
        <Card className="p-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Cores Tested: <span className="font-medium text-gray-900">{getFilledRowsCount()} / {calculateTotalRowsNeeded()}</span></span>
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
                {/* PRINT ONLY HEADER */}
                <tr className="print-only">
                  <td colSpan={3 + psBColumns.length + 1} className="border-0 p-0">
                    <ReportHeader
                      title={`Core Testing Report - ${coreType}`}
                      orderId={getSafeOrderId(order)}
                      clientName={getSafeClientName(order)}
                      reportDate={testDate}
                      batchId={getSafeBatchId(order)}
                    />
                    <div className="print-only">
                      <CoreReportPrint
                        order={order}
                        coreType={coreType}
                        specs={specs}
                        rows={rows}
                        bsatColumns={psBColumns}
                        testDate={testDate}
                        testBy={testBy}
                        authorizedSignatory={authorizedSignatory}
                        materialType={psCoreTypeM4CRGO || "M4CRGO"}
                      />
                    </div>
                  </td>
                </tr>

                {/* Title Row */}
                <tr className="screen-only">
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
                  <td colSpan={psBColumns.length + 3} className="bg-white p-3 border border-gray-400">
                    <span className="print-only font-bold">{psCoreTypeM4CRGO}</span>
                  </td>
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
                  {renderVendorHeader()}
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
                    <td className="bg-white p-3 border border-gray-400 text-center font-medium">
                      <Input
                        value={testDate} // Use the state variable
                        onChange={(e) => setTestDate(e.target.value)} // Allow manual changes if needed
                        className="w-28 h-7 text-xs border-gray-300 text-center mx-auto"
                      />
                    </td>
                    {renderVendorCell(row, index)}
                    <td colSpan={2} className="p-2 border border-gray-300">
                      <div className="flex items-center gap-1">
                        <Input
                          value={String(row.internalCoreNo || '')}
                          onChange={(e) => handleRowChange(index, 'internalCoreNo', e.target.value)}
                          disabled={isReadOnly || isRowLocked(row)}
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
                          onKeyDown={(e) => {
                            if (e.ctrlKey || e.metaKey || ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter", "."].includes(e.key)) return;
                            if (!/^[0-9+\-]$/.test(e.key)) e.preventDefault();
                          }}
                          onChange={(e) => {
                            const filtered = e.target.value.replace(/[^0-9+\-.]/g, '');
                            handleRowChange(index, 'dynamicValues', { ...row.dynamicValues, [column.id]: filtered });
                          }}
                          className={`w-full h-8 text-xs border-0 focus:ring-1 focus:ring-blue-300 text-center font-medium ${row.dynamicValues[column.id] !== '' && parseFloat(row.dynamicValues[column.id] || '0') > parseFloat(column.leLimitValue ?? '0') ? 'bg-red-50 text-red-700' : ''
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
                        {row.remark === 'F' && (
                          <div className="flex flex-col gap-1">
                            {isPreTest ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDiscardCore(index)}
                                className="h-7 px-2 text-[10px] gap-1 border-red-500 text-red-600 hover:bg-red-50 bg-white font-bold shadow-sm"
                                title="Discard this failed core and move to Failed section"
                              >
                                <Trash2 className="w-3 h-3" />
                                Discard
                              </Button>
                            ) : (
                              (
                                !rows.some(r => r.replacedCoreId === row.internalCoreNo) ? (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleReplaceCore(index)}
                                      className="h-7 px-2 text-[10px] gap-1 border-orange-500 text-orange-700 bg-white hover:bg-orange-50 font-bold shadow-sm"
                                      title="Replace this failed core with manual testing"
                                    >
                                      <RefreshCw className="w-3 h-3" />
                                      Manual Replace
                                    </Button>
                                    <Button
                                      size="sm"
                                      type="button"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log("Use Ready Stock clicked for row", index);
                                        fetchMatchingReadyCores(index);
                                      }}
                                      className="h-7 px-2 text-[10px] gap-1 border-blue-500 text-blue-700 hover:bg-blue-50 bg-white font-bold shadow-sm cursor-pointer relative z-10"
                                      title="Use pre-tested core from stock"
                                    >
                                      <Package className="w-3 h-3 pointer-events-none" />
                                      Use Ready Stock
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMoveToFailed(index)}
                                    className="h-7 px-2 text-[10px] gap-1 border-red-500 text-red-600 hover:bg-red-50 bg-white font-bold shadow-sm"
                                    title="Move this replaced core to the Failed Core section"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Move to Failed
                                  </Button>
                                )
                              )
                            )}
                          </div>
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



        {/* Completion Summary */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h4 className="font-medium text-blue-900">Testing Summary</h4>
                {isPreTest && (
                  <>
                    {isSaving ? (
                      <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-100/50 px-2 py-0.5 rounded-full animate-pulse border border-blue-200">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        Saving...
                      </div>
                    ) : (
                      Object.keys(saveTimers.current).length === 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                          <Check className="w-3 h-3" />
                          Saved
                        </div>
                      )
                    )}
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-4 mt-2">
                <div className="bg-white p-2 rounded shadow-sm border border-blue-100 min-w-[100px]">
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Assigned</div>
                  <div className="text-lg font-bold text-gray-900">{calculateTotalRowsNeeded()}</div>
                </div>
                <div className="bg-white p-2 rounded shadow-sm border border-blue-100 min-w-[100px]">
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Completed</div>
                  <div className="text-lg font-bold text-green-600">{getFilledRowsCount()}</div>
                </div>
                <div className="bg-white p-2 rounded shadow-sm border border-blue-100 min-w-[100px]">
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Remaining</div>
                  <div className="text-lg font-bold text-blue-600">{Math.max(0, calculateTotalRowsNeeded() - getFilledRowsCount())}</div>
                </div>
                <div className="bg-white p-2 rounded shadow-sm border border-blue-100 min-w-[100px]">
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Auto-added (Failures)</div>
                  <div className="text-lg font-bold text-red-500">{failedCores.length}</div>
                </div>
              </div>
            </div>
            {getFilledRowsCount() >= calculateTotalRowsNeeded() && (
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <span className="font-medium">Complete</span>
              </div>
            )}
          </div>
        </Card>
        {renderReadyStockModals()}
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
      const updated = bsatColumns.map(col =>
        col.id === id ? { ...col, [field]: value } : col
      );
      setBsatColumns(updated);
      bsatColumnsRef.current = updated;
      if (isPreTest && batchData?.batchId) debouncedSaveConfig();
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
      updatePreTestBatchStatus("CONFIGURED");
      alert('Configuration saved successfully! You can now enter core testing data.');
    };

    return (
      <div className="space-y-6 p-2 sm:p-6 max-w-[1600px] mx-auto overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="outline"
              onClick={handleBack}
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
              <Select value={coreTypeNano} onValueChange={(value: string) => setCoreTypeNano(value as any)}>
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
              <Select value={specs.turnUsed} onValueChange={(value: string) => handleSpecChange('turnUsed', value)}>
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
              {bsatColumns.map((column) => (
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
        {renderReadyStockModals()}
      </div>
    );
  }

  // Metering/PS Core Template (Original)
  return (
    <div className="space-y-4 p-2 sm:p-6 max-w-[1600px] mx-auto overflow-x-hidden">
      <TimerDisplay />
      {isReadOnly && (
        <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 mb-4" role="alert">
          <div className="flex items-center">
            <div className="py-1"><AlertTriangle className="h-6 w-6 text-amber-500 mr-4" /></div>
            <div>
              <p className="font-bold">Read-Only View</p>
              <p className="text-sm">You are viewing a historical record. Modifications are disabled.</p>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="outline"
            onClick={handleBack}
            size="sm"
            className="mb-2 gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-800">Core Testing Report - {coreType}</h2>
            {isPreTest && getFilledRowsCount() >= rows.length && rows.length > 0 && (
              <Badge className="bg-green-600 text-white border-none shadow-sm animate-in fade-in zoom-in duration-300">
                <Check className="w-3 h-3 mr-1" />
                COMPLETED
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium flex items-center gap-2">
            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">{order.jobId}</span>
            <span>•</span>
            <span>{order.clientName}</span>
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
          {!isReadOnly && !isPreTest && (getFilledRowsCount() >= calculateTotalRowsNeeded()) && (
            <Button
              size="sm"
              className="gap-1 bg-[#003a70] hover:bg-[#002a50] text-white shadow-md border border-[#001a30] px-4 font-bold"
              onClick={handleApprove}
            >
              <Check className="w-3 h-3" />
              Approve Batch
            </Button>
          )}
          <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700" onClick={() => handleSave()}>
            <Save className="w-3 h-3" />
            Save All
          </Button>
        </div>
      </div>

      {/* Progress */}
      <Card className="p-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Cores Tested: <span className="font-medium text-gray-900">{getFilledRowsCount()} / {calculateTotalRowsNeeded()}</span></span>
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

      {/* Testing Information Metadata */}
      <Card className="p-4 bg-gray-50 border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-gray-500 uppercase font-bold">Testing Date</Label>
            <Input
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              className="h-9"
              placeholder="DD/MM/YYYY"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500 uppercase font-bold">Tested By</Label>
            <Input
              value={testBy}
              onChange={(e) => setTestBy(e.target.value)}
              className="h-9"
              placeholder="Tester Name"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500 uppercase font-bold">TATA Reference</Label>
            <Input
              value={tataRef}
              onChange={(e) => setTataRef(e.target.value)}
              placeholder="TR-2024-001"
              className="h-9"
            />
          </div>
        </div>
      </Card>

      {/* Testing Form - Table Layout */}
      <Card className="overflow-x-auto print-content">
        <div className="min-w-full">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {/* PRINT ONLY HEADER */}
              <tr className="print-only">
                {/* Total Cols = 5 + bsatColumns.length */}
                <td colSpan={5 + bsatColumns.length} className="border-0 p-0">
                  <ReportHeader
                    title={`Core Testing Report - ${coreType}`}
                    orderId={getSafeOrderId(order)}
                    clientName={getSafeClientName(order)}
                    reportDate={testDate}
                    batchId={getSafeBatchId(order)}
                  />
                </td>
              </tr>

              {/* Title Row with Date */}
              <tr className="screen-only">
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
                {/* DYNAMIC COL SPAN calculation */}
                <td colSpan={bsatColumns.length + 1} className="bg-gray-100 p-3 border border-gray-400 font-medium text-center text-gray-700">
                  {coreTypeNano}
                </td>
              </tr>

              {/* Description and Core Size Row - DYNAMIC COLSPANS */}
              <tr>
                <td className="bg-gray-50 p-3 border border-gray-400 font-medium text-gray-600">
                  Description
                </td>
                {/* Spacer calculates dynamically: Total(5+N) - First(1) - Cores(3) - ID/OD(2) = N - 1 ?? No.. */}
                {/* Let's align it simpler: Description(1) + Spacer(Var) + CoreSizes(3) + Label(N+1) */}
                <td colSpan={bsatColumns.length} className="bg-white p-2 border border-gray-400">
                  <span className="print-only font-bold">{coreTypeNano}</span>
                  <div className="screen-only flex items-center gap-2">
                    <span className="font-medium text-gray-700">Date -</span>
                    <span className="font-bold">{testDate}</span>
                  </div>
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
                {/* Spans remaining columns */}
                <td colSpan={2} className="bg-white p-2 border border-gray-400 text-center font-medium text-gray-700">
                  ID-OD-HT
                </td>
              </tr>

              {/* Core Size Label Row */}
              <tr>
                <td className="bg-gray-50 p-3 border border-gray-400 font-medium text-gray-600">
                  CORE SIZE IN MM
                </td>
                <td colSpan={4 + bsatColumns.length} className="bg-white p-2 border border-gray-400">
                  {/* Empty spacer to fill row */}
                </td>
              </tr>

              {/* Turn Used Row */}
              <tr>
                <td className="bg-gray-50 p-3 border border-gray-400 font-medium text-gray-600">
                  TURN USED FOR TESTING
                </td>
                <td colSpan={4 + bsatColumns.length} className="bg-white p-3 border border-gray-400 font-medium">
                  {specs.turnUsed} TURN
                </td>
              </tr>

              {/* Area */}
              <tr>
                <td className="bg-gray-50 p-3 border border-gray-400 font-medium text-gray-600">
                  Area (Sq cm)
                </td>
                <td colSpan={4 + bsatColumns.length} className="bg-white p-3 border border-gray-400 font-medium">
                  {specs.area}
                </td>
              </tr>

              {/* MMP */}
              <tr>
                <td className="bg-gray-50 p-3 border border-gray-400 font-medium text-gray-600">
                  MMP (cm)
                </td>
                <td colSpan={4 + bsatColumns.length} className="bg-white p-3 border border-gray-400 font-medium">
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
                {((coreType as string) === 'PS' ? psBColumns : bsatColumns).map(column => (
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
                {((coreType as string) === 'PS' ? psBColumns : bsatColumns).map(column => (
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
                {((coreType as string) === 'PS' ? psBColumns : bsatColumns).map(column => (
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
                {renderVendorHeader()}
                <td colSpan={2} className="p-3 border border-gray-400 font-semibold text-gray-700 text-center text-xs">Internal core No.</td>
                {((coreType as string) === 'PS' ? psBColumns : bsatColumns).map(column => (
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
                  {renderVendorCell(row, index)}
                  <td colSpan={2} className="p-2 border border-gray-300">
                    <div className="flex items-center gap-1">
                      <Input
                        // 1. Ensure the value is always a string to avoid React warnings
                        value={String(row.internalCoreNo || '')}

                        // 2. Standard change handler
                        onChange={(e) => handleRowChange(index, 'internalCoreNo', e.target.value)}

                        // 3. UI Styling (Mono font is great for serial numbers)
                        className="flex-1 h-8 text-xs border-0 focus:ring-1 font-mono font-bold text-gray-900"

                        // 4. IMPROVEMENT: Show the expected ID as a hint
                        placeholder={generateCoreId(index + 1)}
                        disabled={isReadOnly || isRowLocked(row)}
                      />
                      {row.isReplacement && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded font-bold border border-blue-200">
                          (R)
                        </span>
                      )}
                    </div>
                  </td>
                  {((coreType as string) === 'PS' ? psBColumns : bsatColumns).map(column => {
                    if (!column) return null;
                    return (
                      <td key={column.id} className="p-2 border border-gray-300 bg-white">
                        <Input
                          value={String(row.dynamicValues?.[column.id] || '')}
                          onKeyDown={(e) => {
                            if (e.ctrlKey || e.metaKey || ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter", "."].includes(e.key)) return;
                            if (!/^[0-9+\-]$/.test(e.key)) e.preventDefault();
                          }}
                          onChange={(e) => {
                            const filtered = e.target.value.replace(/[^0-9+\-.]/g, '');
                            handleRowChange(index, 'dynamicValues', { ...(row.dynamicValues || {}), [column.id]: filtered });
                          }}
                          disabled={isReadOnly || isRowLocked(row)}
                          className={`w-full h-8 text-xs border-0 focus:ring-1 focus:ring-blue-300 text-center font-medium ${row.dynamicValues?.[column.id] !== '' && parseFloat(row.dynamicValues?.[column.id] || '0') > parseFloat(column.leLimitValue || '0') ? 'bg-red-50 text-red-700' : ''
                            }`}
                          placeholder="9.5"
                        />
                      </td>
                    );
                  })}
                  <td className="p-2 border border-gray-300">
                    <div className="flex items-center justify-center gap-2">
                      <div className={`min-w-[2rem] h-8 flex items-center justify-center font-medium text-xs ${row.remark === 'P' ? 'text-green-700' :
                        row.remark === 'F' ? 'text-red-600' : 'text-gray-400'
                        }`}>
                        {row.remark}
                      </div>
                      {row.remark === 'F' && (
                        <div className="flex flex-col gap-1">
                          {isPreTest ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDiscardCore(index)}
                              className="h-7 px-2 text-[10px] gap-1 border-red-300 text-red-600 hover:bg-red-50"
                              title="Discard this failed core and move to Failed section"
                            >
                              <Trash2 className="w-3 h-3" />
                              Discard
                            </Button>
                          ) : (
                            !rows.some(r => r.replacedCoreId === row.internalCoreNo) ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReplaceCore(index)}
                                  className="h-7 px-2 text-[10px] gap-1 border-orange-500 text-orange-700 bg-white hover:bg-orange-50 font-bold shadow-sm"
                                  title="Replace this failed core with manual testing"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  Manual Replace
                                </Button>
                                <Button
                                  size="sm"
                                  type="button"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log("Use Ready Stock clicked for row", index);
                                    fetchMatchingReadyCores(index);
                                  }}
                                  className="h-7 px-2 text-[10px] gap-1 border-blue-500 text-blue-700 hover:bg-blue-50 bg-white font-bold shadow-sm cursor-pointer relative z-10"
                                  title="Use pre-tested core from stock"
                                >
                                  <Package className="w-3 h-3 pointer-events-none" />
                                  Use Ready Stock
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMoveToFailed(index)}
                                className="h-7 px-2 text-[10px] gap-1 border-red-500 text-red-600 hover:bg-red-50 bg-white font-bold shadow-sm"
                                title="Move this replaced core to the Failed Core section"
                              >
                                <Trash2 className="w-3 h-3" />
                                Move to Failed
                              </Button>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Completion Summary */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-blue-900">Testing Summary</h4>
            <div className="flex flex-wrap gap-4 mt-2">
              <div className="bg-white p-2 rounded shadow-sm border border-blue-100 min-w-[100px]">
                <div className="text-[10px] text-gray-500 uppercase font-bold">
                  {isPreTest ? "Batch Size" : "Target"}
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {calculateTotalRowsNeeded()}
                </div>
              </div>
              <div className="bg-white p-2 rounded shadow-sm border border-blue-100 min-w-[100px]">
                <div className="text-[10px] text-gray-500 uppercase font-bold">Passed</div>
                <div className="text-lg font-bold text-green-600">{passed}</div>
              </div>
              <div className="bg-white p-2 rounded shadow-sm border border-blue-100 min-w-[100px]">
                <div className="text-[10px] text-gray-500 uppercase font-bold">Remaining</div>
                <div className="text-lg font-bold text-blue-600">
                  {Math.max(0, calculateTotalRowsNeeded() - passed)}
                </div>
              </div>
              <div className="bg-white p-2 rounded shadow-sm border border-blue-100 min-w-[100px]">
                <div className="text-[10px] text-gray-500 uppercase font-bold">
                  {isPreTest ? "Discarded" : "Failed"}
                </div>
                <div className="text-lg font-bold text-red-500">
                  {isPreTest ? (batchData?.discardedCount || 0) : failed}
                </div>
              </div>
            </div>
          </div>
          {isPreTest ? (
            <div className="flex flex-col items-end gap-2">
              <Button
                onClick={handleApproveBatch}
                className="bg-[#003a70] hover:bg-[#002a50] text-white px-6 h-12 gap-2 font-bold shadow-lg shadow-blue-100"
              >
                <CheckCircle2 className="w-5 h-5" />
                Approve & Move to Ready Stock
              </Button>
              <p className="text-[10px] text-gray-500 italic">
                Finalizes passed cores and updates inventory
              </p>
            </div>
          ) : (
            passed >= calculateTotalRowsNeeded() && (
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <span className="font-medium">Complete</span>
              </div>
            )
          )}
        </div>
      </Card>

      {/* DEDICATED PRINT COMPONENT (HIDDEN ON SCREEN) */}
      <CoreReportPrint
        order={order}
        coreType={coreType}
        specs={specs}
        rows={rows}
        bsatColumns={isProtectionCore ? protectionBColumns : (isPSCore ? psBColumns : bsatColumns)}
        testDate={testDate}
        testBy={testBy}
        authorizedSignatory={authorizedSignatory}
        tataRef={tataRef}
        materialType={isMetering ? coreTypeNano : (isProtectionCore ? protectionCoreTypeM4CRGO : (psCoreTypeM4CRGO || "M4CRGO"))}
      />

      {renderReadyStockModals()}
    </div>
  );
}

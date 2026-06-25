import { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import axios from '@/utils/axiosConfig';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Save, AlertCircle, ArrowLeft, AlertTriangle, Edit3, Printer, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PTFinalPrintableReport } from './PTFinalPrintableReport';
import { usePTTimer } from '../../utils/usePTTimer';
import { PTTimerBadge } from './PTTimerBadge';

export function validatePTMeteringUI(accClass: string, ratioErrorStr: string, phaseErrorStr: string, meteringLimits: any) {
  if (!meteringLimits) return { isPass: undefined, reason: null };
  if ((!ratioErrorStr || String(ratioErrorStr).trim() === '') && (!phaseErrorStr || String(phaseErrorStr).trim() === '')) {
    return { isPass: undefined, reason: null };
  }
  
  const normalizedClass = accClass ? accClass : "0.5";
  const limitConfig = meteringLimits[normalizedClass] || meteringLimits['0.5'];

  if (!limitConfig) return { isPass: true, reason: null };

  let isPass = true;
  let reasons: string[] = [];

  if (ratioErrorStr && String(ratioErrorStr).trim() !== '') {
    const rVal = parseFloat(String(ratioErrorStr));
    if (!isNaN(rVal) && Math.abs(rVal) >= limitConfig.ratioLimit) {
      isPass = false;
      reasons.push(`Ratio Error (${rVal}%) exceeds ±${limitConfig.ratioLimit}%`);
    }
  }

  if (limitConfig.phaseLimit !== null && phaseErrorStr && String(phaseErrorStr).trim() !== '') {
    const pVal = parseFloat(String(phaseErrorStr));
    if (!isNaN(pVal) && Math.abs(pVal) >= limitConfig.phaseLimit) {
      isPass = false;
      reasons.push(`Phase Error (${pVal}m) exceeds ±${limitConfig.phaseLimit}m`);
    }
  }

  return { isPass, reason: reasons.length > 0 ? reasons.join('; ') : null };
}

export function validatePTProtectionUI(accClass: string, ratioErrorStr: string, phaseErrorStr: string, protectionLimits: any) {
  if (!protectionLimits) return { isPass: undefined, reason: null };
  if ((!ratioErrorStr || String(ratioErrorStr).trim() === '') && (!phaseErrorStr || String(phaseErrorStr).trim() === '')) {
    return { isPass: undefined, reason: null };
  }
  
  const normalizedClass = accClass && accClass.includes('6P') ? '6P' : '3P'; // Default to 3P if unknown protection
  const limitConfig = protectionLimits[normalizedClass] || protectionLimits['3P'];

  if (!limitConfig) return { isPass: true, reason: null };

  let isPass = true;
  let reasons: string[] = [];

  if (ratioErrorStr && String(ratioErrorStr).trim() !== '') {
    const rVal = parseFloat(String(ratioErrorStr));
    if (!isNaN(rVal) && Math.abs(rVal) >= limitConfig.ratioLimit) {
      isPass = false;
      reasons.push(`Ratio Error (${rVal}%) exceeds ±${limitConfig.ratioLimit}%`);
    }
  }

  if (phaseErrorStr && String(phaseErrorStr).trim() !== '') {
    const pVal = parseFloat(String(phaseErrorStr));
    if (!isNaN(pVal) && Math.abs(pVal) >= limitConfig.phaseLimit) {
      isPass = false;
      reasons.push(`Phase Error (${pVal}m) exceeds ±${limitConfig.phaseLimit}m`);
    }
  }

  return { isPass, reason: reasons.length > 0 ? reasons.join('; ') : null };
}

interface PTTestingReportProps {
  order: any; // The selected order from the list
  transformer: any; // The specific transformer to test
  onBack: () => void;
  user: any; // The logged-in PT Tester user
  noTimer?: boolean; // If true, skip timer entirely (used for failed transformer retesting)
  onApproveSuccess?: () => void; // Called after successful approval (e.g. to remove from failed list)
}

export function PTTestingReport({ order, transformer, onBack, user, noTimer = false, onApproveSuccess }: PTTestingReportProps) {
  const [loading, setLoading] = useState(false);
  const [reportsData, setReportsData] = useState<Record<string, any>>({});
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [invalidConfig, setInvalidConfig] = useState(false);

  // Failure Modal State
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [failureReason, setFailureReason] = useState("");
  const [failingCoresInfo, setFailingCoresInfo] = useState<any[]>([]);
  const [hasAnyFailures, setHasAnyFailures] = useState(false);

  const [transformersData, setTransformersData] = useState<any[]>([]);
  const [isApproving, setIsApproving] = useState(false);

  const [retestHistory, setRetestHistory] = useState<any>({});

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const [limitsLoading, setLimitsLoading] = useState(true);
  const [activeCores, setActiveCores] = useState<string[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [coreClassesMap, setCoreClassesMap] = useState<Record<string, string>>({});

  const [dbMeteringLimits, setDbMeteringLimits] = useState<any>(null);
  const [pretestData, setPretestData] = useState<Record<string, any>>({}); // Locked pretest data from pretester
  const [dbProtectionLimits, setDbProtectionLimits] = useState<any>(null);

  // ── PT Delay Timer (tracking-only, non-blocking) ─────────────────────────
  const { timeLeftMs, isOverdue, expectedMinutes, endTimer } = usePTTimer({
    transformerId: transformer?._id || '',
    orderId:       order?._id || '',
    jobId:         order?.jobId || '',
    stage:         'pt',
    testerName:    user?.name || user?.fullName || 'PT Tester',
    role:          'pt-tester',
    enabled:       !noTimer && !isReadOnly && !!transformer?._id
  });

  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const [metRes, protRes] = await Promise.all([
          axios.get(`/accuracy-limits/metering?transformerType=PT`, { withCredentials: true }),
          axios.get(`/accuracy-limits/protection?transformerType=PT`, { withCredentials: true })
        ]);

        if (Array.isArray(metRes.data)) {
          const metMap: any = {};
          metRes.data.forEach((item: any) => {
             // For PT, we take the first limit in the array since the UI doesn't track multiple loads yet
             if (item.limits && item.limits.length > 0) {
               metMap[item.accuracyClass] = { 
                 ratioLimit: item.limits[0].ratioLimit, 
                 phaseLimit: item.limits[0].phaseLimit 
               };
             }
          });
          setDbMeteringLimits(metMap);
        }

        if (Array.isArray(protRes.data)) {
          const protMap: any = {};
          protRes.data.forEach((item: any) => {
             protMap[item.protectionClass] = { 
               ratioLimit: item.maxCurrentError, 
               phaseLimit: item.maxPhaseError 
             };
          });
          setDbProtectionLimits(protMap);
        }
      } catch (err) {
        console.error("Error fetching PT accuracy limits:", err);
      }
    };
    fetchLimits();
  }, []);

  useEffect(() => {
    if (transformersData.length > 0 && !activeTabId) {
        setActiveTabId(transformersData[0]._id);
    }
  }, [transformersData]);
  
  // Configuration detection
  useEffect(() => {
    // 1. Validation check
    if (order.transformerType !== 'PT') {
        setInvalidConfig(true);
        return;
    }

    const cores = order.coreDetails || order.coreConfigs || [];
    
    let countMetering = 0;
    let countProtection = 0;
    let countPS = 0;
    
    const coresList: string[] = [];
    const classes: Record<string, string> = {};
    cores.forEach((core: any) => {
        const type = typeof core === 'string' ? core : core.coreType;
        const acc = typeof core === 'string' ? '' : core.accuracyClass;
        if (type?.toLowerCase() === 'metering') {
            countMetering++;
            const coreId = countMetering > 1 ? `metering${countMetering}` : 'metering';
            coresList.push(coreId);
            classes[coreId] = acc || order.accuracyClass || '0.2';
        }
        if (type?.toLowerCase() === 'protection') {
            countProtection++;
            const coreId = `protection${countProtection}`;
            coresList.push(coreId);
            classes[coreId] = acc || '3P';
        }
        if (type?.toLowerCase() === 'ps') {
            countPS++;
            const coreId = `ps${countPS}`;
            coresList.push(coreId);
            classes[coreId] = acc || 'PX';
        }
    });

    setCoreClassesMap(classes);
    setActiveCores(coresList);

    // 2. Fetch Transformer associated with this Order
    fetchTransformerData(coresList);
  }, [order]);

  const fetchTransformerData = async (coresList: string[]) => {
    try {
        setLoading(true);

        // Use the single transformer passed via props
        const responseList = [transformer];

        if (responseList.length > 0) {
            setTransformersData(responseList);
            
            let newReportsData: Record<string, any> = {};
            let anyReadOnly = false;

            for (const t of responseList) {
                const testRes = await axios.get(`/pt-tests/${t._id}`, {
                    withCredentials: true
                });

                if (testRes.data.success && testRes.data.data) {
                    let savedData = testRes.data.data;
                    if (!savedData.preTesting) savedData.preTesting = {};
                    coresList.forEach(core => {
                        if (!savedData.preTesting[core]) {
                            savedData.preTesting[core] = { ratioError100: '', phaseError100: '', ratioError25: '', phaseError25: '' };
                        }
                    });

                    if (!savedData.accuracyTest) savedData.accuracyTest = {};
                    coresList.forEach(core => {
                        if (!savedData.accuracyTest[core]) {
                            if (core.startsWith('protection')) {
                                savedData.accuracyTest[core] = {
                                    '100': { ratioError100: '', phaseError100: '', ratioError25: '', phaseError25: '' },
                                };
                            } else {
                                savedData.accuracyTest[core] = {
                                    '120': { ratioError100: '', phaseError100: '', ratioError25: '', phaseError25: '' },
                                    '100': { ratioError100: '', phaseError100: '', ratioError25: '', phaseError25: '' },
                                    '80': { ratioError100: '', phaseError100: '', ratioError25: '', phaseError25: '' },
                                };
                            }
                        }
                    });

                    if (!isReadOnly && !savedData.testedBy) {
                        savedData.testedBy = user?.name || user?.fullName || 'Tester';
                    }
                    newReportsData[t._id] = savedData;

                    // Fetch pretest data from pretester to autofill (read-only)
                    const pretestRes = await axios.get(`/pt-pretests/${t._id}`, { withCredentials: true }).catch(() => null);
                    if (pretestRes?.data?.success && pretestRes.data.data) {
                        // Merge pretest data into the preTesting field (will be rendered read-only)
                        newReportsData[t._id].preTesting = {
                            ...(pretestRes.data.data.preTesting || {}),
                            testedBy: pretestRes.data.data.testedBy || pretestRes.data.data.savedBy || ''
                        };
                    }

                    // Mark as readOnly only when the report has been explicitly saved (savedAt is set on submit)
                    if (savedData.savedAt) {
                         anyReadOnly = true;
                    }
                } else {
                    // Initialize default empty structure
                    let defaultAccuracy: any = {};
                    coresList.forEach(core => {
                        const isProtection = core.startsWith('protection');
                        if (isProtection) {
                            defaultAccuracy[core] = {
                                '100': { ratioError100: '', phaseError100: '', ratioError25: '', phaseError25: '' },
                            };
                        } else {
                            defaultAccuracy[core] = {
                                '120': { ratioError100: '', phaseError100: '', ratioError25: '', phaseError25: '' },
                                '100': { ratioError100: '', phaseError100: '', ratioError25: '', phaseError25: '' },
                                '80': { ratioError100: '', phaseError100: '', ratioError25: '', phaseError25: '' },
                            };
                        }
                    });

                    // Fetch pretest data from pretester to autofill (read-only)
                    const pretestResNew = await axios.get(`/pt-pretests/${t._id}`, { withCredentials: true }).catch(() => null);
                    let defaultPreTesting: any = {};
                    if (pretestResNew?.data?.success && pretestResNew.data.data?.preTesting) {
                        defaultPreTesting = {
                            ...(pretestResNew.data.data.preTesting || {}),
                            testedBy: pretestResNew.data.data.testedBy || pretestResNew.data.data.savedBy || ''
                        };
                    } else {
                        coresList.forEach(core => {
                            defaultPreTesting[core] = { ratioError100: '', phaseError100: '', ratioError25: '', phaseError25: '' };
                        });
                    }

                    newReportsData[t._id] = {
                        preTesting: defaultPreTesting,
                        finalTesting: {
                            leakage: '',
                            terminalMarking: 'OK',
                            polarityTesting: 'OK',
                            insulationResistance: 'OK',
                            primaryToSecondary: '10 GΩ',
                            primaryToEarth: '10 GΩ',
                            secondaryToEarth: '10 GΩ',
                            hvSecondary: 'OK',
                            hvPrimary: 'OK',
                            inducedOverVoltage: 'OK'
                        },
                        accuracyTest: defaultAccuracy,
                        testedBy: user?.name || user?.fullName || 'Tester',
                        signature: '',
                        date: new Date().toLocaleDateString('en-GB')
                    };
                }
            }
            
            setReportsData(newReportsData);
            setIsReadOnly(anyReadOnly);
            
        } else {
            toast.error("No transformers found for this order.");
            setInvalidConfig(true);
        }
    } catch (err) {
        console.error("Failed to fetch transformer data", err);
        toast.error("Failed to load testing data");
    } finally {
        setLoading(false);
    }
  };

  const handleInputChange = (tId: string, section: string, field: string, value: string, subField?: string) => {
    if (isReadOnly) return;
    setReportsData((prev: any) => {
        const allData = { ...prev };
        let newData = { ...(allData[tId] || {}) };
        if (subField) {
            // Apply numeric filter for accuracy/pre-testing related fields
            const filteredValue = (section === 'accuracyTest' || section === 'preTesting') 
                ? value.replace(/[^0-9.\-+]/g, '') 
                : value;
            newData[section] = { ...newData[section] };
            newData[section][field] = { ...newData[section][field], [subField]: filteredValue };
        } else if (section) {
            newData[section] = { ...newData[section], [field]: value };
        } else {
            newData[field] = value;
        }
        allData[tId] = newData;
        return allData;
    });
  };

  const handleAccuracyChange = (tId: string, core: string, percentage: string, field: string, value: string) => {
    if (isReadOnly) return;
    setReportsData((prev: any) => {
        const allData = { ...prev };
        let newData = { ...(allData[tId] || {}) };
        
        if (!newData.accuracyTest) newData.accuracyTest = {};
        if (!newData.accuracyTest[core]) newData.accuracyTest[core] = {};
        if (!newData.accuracyTest[core][percentage]) newData.accuracyTest[core][percentage] = {};
        
        const filteredValue = value.replace(/[^0-9.\-+]/g, '');
        newData.accuracyTest[core] = { ...newData.accuracyTest[core] };
        newData.accuracyTest[core][percentage] = { ...newData.accuracyTest[core][percentage], [field]: filteredValue };
        
        allData[tId] = newData;
        return allData;
    });
  };

  const handleSubmit = async () => {
    try {
        if (transformersData.length === 0) return;
        
        // Validation: Ensure all fields are filled
        for (const t of transformersData) {
            const rData = reportsData[t._id] || {};
            
            // 1. Check finalTesting
            const ft = rData.finalTesting || {};
            const requiredFinalFields = [
                'leakage', 'terminalMarking', 'polarityTesting', 
                'insulationResistance', 'primaryToSecondary', 'primaryToEarth', 
                'secondaryToEarth', 'hvSecondary', 'hvPrimary', 'inducedOverVoltage'
            ];
            for (const field of requiredFinalFields) {
                if (!ft[field] || String(ft[field]).trim() === '') {
                    toast.error(`Please complete Final Testing section (${field}) before saving.`);
                    return;
                }
            }

            // 1.5 Check preTesting
            const pt = rData.preTesting || {};
            for (const core of activeCores) {
                const row = pt[core] || {};
                if (!row.ratioError100 || String(row.ratioError100).trim() === '' ||
                    !row.phaseError100 || String(row.phaseError100).trim() === '' ||
                    !row.ratioError25 || String(row.ratioError25).trim() === '' ||
                    !row.phaseError25 || String(row.phaseError25).trim() === '') {
                    
                    toast.error(`Missing Pre-testing data for ${core}. Please ensure Pre-testing is completed first.`);
                    return;
                }
            }

            // 2. Check accuracyTest
            const at = rData.accuracyTest || {};
            for (const core of activeCores) {
                if (!at[core]) {
                    toast.error(`Missing accuracy test data for core ${core}`);
                    return;
                }
                const isProtection = core.startsWith('protection');
                const percentages = isProtection ? ['100'] : ['120', '100', '80'];
                
                for (const pct of percentages) {
                    const row = at[core][pct] || {};
                    if (!row.ratioError100 || String(row.ratioError100).trim() === '' ||
                        !row.phaseError100 || String(row.phaseError100).trim() === '' ||
                        !row.ratioError25 || String(row.ratioError25).trim() === '' ||
                        !row.phaseError25 || String(row.phaseError25).trim() === '') {
                        
                        toast.error(`Please fill all Ratio and Phase errors for ${core} at ${pct}% Burden`);
                        return;
                    }
                }
            }
        }

        const payloads = transformersData.map(t => {
            const rData = reportsData[t._id] || {};
            return {
                transformerId: t._id,
                orderId: order._id,
                reportData: rData
            };
        });

        // Wait for all to submit sequentially or in parallel
        const responses = await Promise.all(payloads.map(payload => 
            axios.post(`/pt-tests/submit`, payload, { withCredentials: true })
        ));

        if (responses.every(r => r.data.success)) {
            toast.success(`Successfully submitted ${payloads.length} PT test reports.`);
            if (!noTimer) endTimer(); // Record timer end for delay tracking
            setIsReadOnly(true);
        }
    } catch (err: any) {
        console.error("Submission error", err);
        toast.error(err.response?.data?.message || "Failed to submit test reports");
    }
  };

  const handleApproveActiveTransformer = async () => {
    const tId = activeTabId || transformersData[0]?._id;
    if (!tId) {
      toast.error('No transformer to approve.');
      return;
    }

    if (!window.confirm("Are you sure you want to approve this unit?")) return;

    try {
      setIsApproving(true);
      await axios.put(`/pt-tests/transformer/${tId}/approve`, {}, { withCredentials: true });
      toast.success('Transformer approved successfully!');
      if (!noTimer) endTimer(); // Record timer end for delay tracking
      if (onApproveSuccess) {
        setTimeout(() => onApproveSuccess(), 1000);
      } else {
        setTimeout(() => onBack(), 1000);
      }
    } catch (error: any) {
      console.error("Unit Approval Error:", error);
      toast.error(error.response?.data?.message || "Failed to approve transformer.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleApprove = async () => {
    if (!order._id) {
      toast.error("Order ID needed for approval.");
      return;
    }

    try {
      setIsApproving(true);
      // Full order approve
      const response = await axios.put(
        `/pt-tests/${order._id}/approve`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success(response.data.message || 'PT Testing approved successfully!');
        if (!noTimer) endTimer(); // Record timer end
        setTimeout(() => {
          onBack();
        }, 1000);
      }
    } catch (error: any) {
      console.error("Approval Error:", error);
      toast.error(error.response?.data?.message || "Failed to approve PT testing.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleLogFailure = async () => {
    if (!failureReason.trim()) {
        toast.error("Please provide a reason for the failure.");
        return;
    }

    try {
        const payloads = failingCoresInfo.map(info => ({
            transformerId: info.transformerId,
            orderId: order._id,
            jobNumber: order.jobId,
            coreType: info.coreType,
            failureParameters: info.params,
            failureReason: failureReason,
            reportedBy: user?.name || user?.fullName || 'PT Tester'
        }));

        await Promise.all(payloads.map(payload => 
            axios.post(`/pt-tests/failed`, payload, {
                withCredentials: true
            })
        ));

        toast.success("Failed cores logged successfully.");
        setShowFailureModal(false);
        setFailureReason("");
        setIsReadOnly(true);
    } catch (err: any) {
        console.error("Error logging failure:", err);
        toast.error(err.response?.data?.message || "Failed to log errors.");
    }
  };

  const handleAddToFailed = async () => {
    if (!window.confirm('Are you sure you want to mark this transformer as failed? The timer will be stopped and the transformer will be moved to the Failed section.')) return;
    try {
        const t = transformersData[0];
        if (!t) return;
        await axios.post(`/pt-tests/failed`, {
            transformerId: t._id,
            orderId: order._id,
            jobNumber: order.jobId,
            reportedBy: user?.name || user?.fullName || 'PT Tester'
        }, { withCredentials: true });
        if (!noTimer) await endTimer();
        toast.success('Transformer marked as failed.');
        onBack();
    } catch (err: any) {
        console.error('Error marking as failed:', err);
        toast.error(err.response?.data?.message || 'Failed to mark as failed.');
    }
  };

  // derived state isolated per transformer for UI rendering logic
  const getTransformerValidations = (transformerId: string, reportDataLocal: any) => {
      const accValidations: any = {};
      let hasAccFails = false;
      const failsLog: any[] = [];
      const preTestValidations: Record<string, { val100: any, val25: any }> = {};

      activeCores.forEach(core => {
          const isProtection = core.startsWith('protection');
          const isPS = core.startsWith('ps');
          
          let currentCoreClass = coreClassesMap[core] || order.accuracyClass || '0.2';
          if (isProtection && !coreClassesMap[core]) currentCoreClass = '3P';
          if (isPS && !coreClassesMap[core]) currentCoreClass = 'PX';

          // Pre-test validations
          const rowDataPre = reportDataLocal.preTesting?.[core] || {};
          let val100, val25;
          if (isProtection) {
              val100 = validatePTProtectionUI(currentCoreClass, rowDataPre.ratioError100, rowDataPre.phaseError100, dbProtectionLimits);
              val25 = validatePTProtectionUI(currentCoreClass, rowDataPre.ratioError25, rowDataPre.phaseError25, dbProtectionLimits);
          } else {
              val100 = validatePTMeteringUI(currentCoreClass, rowDataPre.ratioError100, rowDataPre.phaseError100, dbMeteringLimits);
              val25 = validatePTMeteringUI(currentCoreClass, rowDataPre.ratioError25, rowDataPre.phaseError25, dbMeteringLimits);
          }
          preTestValidations[core] = { val100, val25 };

          if (val100.isPass === false || val25.isPass === false) {
              const reasons = [val100.reason, val25.reason].filter(Boolean);
              failsLog.push({ coreType: `PRE-TEST ${core.toUpperCase()}`, params: { reasons }, transformerId });
          }

          // Accuracy validations
          accValidations[core] = {};
          const percentages = isProtection ? ['100'] : ['120', '100', '80'];
          const accReasons: any[] = [];
          
          percentages.forEach(perc => {
              const rowData = reportDataLocal.accuracyTest?.[core]?.[perc] || {};
              const v100 = isProtection 
                   ? validatePTProtectionUI(currentCoreClass, rowData.ratioError100, rowData.phaseError100, dbProtectionLimits)
                   : validatePTMeteringUI(currentCoreClass, rowData.ratioError100, rowData.phaseError100, dbMeteringLimits);
              const v25 = isProtection 
                   ? validatePTProtectionUI(currentCoreClass, rowData.ratioError25, rowData.phaseError25, dbProtectionLimits)
                   : validatePTMeteringUI(currentCoreClass, rowData.ratioError25, rowData.phaseError25, dbMeteringLimits);
              
              accValidations[core][perc] = { val100: v100, val25: v25 };
              if (v100.isPass === false) accReasons.push(v100.reason);
              if (v25.isPass === false) accReasons.push(v25.reason);
              if (v100.isPass === false || v25.isPass === false) hasAccFails = true;
          });

          if (accReasons.filter(Boolean).length > 0) {
              failsLog.push({ coreType: `ACCURACY TEST - ${core.toUpperCase()}`, params: { reasons: accReasons.filter(Boolean) }, transformerId });
          }
      });

      const hasFail = failsLog.length > 0;

      return { preTestValidations, accValidations, hasFail, failsLog };
  };

  useEffect(() => {
     let globFails = false;
     let cFails: any[] = [];
     transformersData.forEach(t => {
         const v = getTransformerValidations(t._id, reportsData[t._id] || {});
         if (v.hasFail) globFails = true;
         cFails.push(...v.failsLog);
     });
     setHasAnyFailures(globFails);
     setFailingCoresInfo(cFails);
  }, [reportsData, transformersData, activeCores, order, dbMeteringLimits, dbProtectionLimits]);

  if (invalidConfig) {
    return (
        <Card className="p-8 text-center bg-red-50 border-red-200">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-red-800 text-lg mb-2">Invalid Configuration for Final PT Testing</h3>
            <p className="text-red-600 mb-6">
                No PT transformers found for this order, or the order is incorrectly configured.
            </p>
            <Button onClick={onBack} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
            </Button>
        </Card>
    );
  }

  if (loading || transformersData.length === 0) {
      return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between pt-4">
                <Button onClick={onBack} variant="outline" className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Assigned Orders
                </Button>
            </div>
            <div className="p-8 text-center text-gray-500">Loading Final PT testing layout...</div>
        </div>
      );
  }

  const accuracyClassDisplay = (() => {
    const cores = order?.coreDetails || order?.coreConfigs || [];
    const fallback = order?.accuracyClass || '0.2';

    if (!Array.isArray(cores) || cores.length === 0) return fallback;

    const classStrings: string[] = [];

    const normalize = (v: unknown) => {
      if (v === null || v === undefined) return '';
      const s = String(v).trim();
      if (!s || s.toLowerCase() === 'n/a') return '';
      return s;
    };

    cores.forEach((core: any, idx: number) => {
      let coreClass = normalize(core?.accuracyClass);
      const typeLc = String(core?.coreType || '').toLowerCase();

      // Fallback for metering
      if (!coreClass && typeLc.includes('meter')) coreClass = normalize(fallback);
      
      if (coreClass) {
        classStrings.push(coreClass);
      }
    });

    if (classStrings.length === 0) return fallback;

    return classStrings.join(' / ');
  })();

  const ptRatioDisplay = (() => {
    const params = order?.parameters || {};
    const primaryV = order?.ratedPrimaryVoltage || params.ratedPrimaryVoltage;
    const secondaryV = order?.ratedSecondaryVoltage || params.ratedSecondaryVoltage;
    const coresCount = parseInt(order?.noOfCores || order?.numberOfCores || '1');

    if (!primaryV || !secondaryV) return order?.ratio?.[0] || 'N/A';

    const ratioParts = [primaryV];
    for (let i = 0; i < coresCount; i++) {
      ratioParts.push(secondaryV);
    }

    return ratioParts.join(' / ');
  })();

  const burdenDisplay = (() => {
    const b = order?.burden;
    if (Array.isArray(b)) return b.join(' / ');
    return b || 'N/A';
  })();

  return (
    <>
    <div className="max-w-4xl mx-auto space-y-6">
        {!noTimer && !isReadOnly && (
          <div className="no-print">
            <PTTimerBadge 
              timeLeftMs={timeLeftMs} 
              isOverdue={isOverdue} 
              expectedMinutes={expectedMinutes} 
              title="PT Final Test"
            />
          </div>
        )}
        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            .print-page {
              width: 100%;
              box-sizing: border-box;
              page-break-after: always;
              background-color: white !important;
            }
            .print-page:last-child {
              page-break-after: auto;
            }
            .no-print {
              display: none !important;
            }
            table {
              width: 100% !important;
              border-collapse: collapse !important;
            }
            table th, table td {
              padding: 4px !important;
              font-size: 11px !important;
              border-color: #000 !important;
            }
            .border, .border-b, .border-b-2, .border-t, .border-l, .border-r {
              border-color: #000 !important;
            }
            .bg-gray-50, .bg-gray-100 {
              background-color: #f9fafb !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .text-\\[\\#003a70\\] {
               color: #000 !important;
            }
            .mb-6 {
              margin-bottom: 6px !important;
            }
            .mb-4 {
              margin-bottom: 4px !important;
            }
            .py-1 {
              padding-top: 2px !important;
              padding-bottom: 2px !important;
            }
            input {
              border: none !important;
              background: transparent !important;
              outline: none !important;
              box-shadow: none !important;
              color: black !important;
              font-weight: 600 !important;
              height: 16px !important;
            }
          }
        `}</style>

        <div className="flex items-center justify-between no-print mb-6">
            <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
            </Button>
            <div className="flex gap-2">
                {isReadOnly && <Badge className="bg-green-100 text-green-700 mt-1 self-center">Completed</Badge>}
                
                {isReadOnly && (
                    <Button variant="outline" size="sm" onClick={() => setIsReadOnly(false)} className="gap-2">
                        <Edit3 className="w-4 h-4" /> Edit
                    </Button>
                )}

                {isReadOnly && activeTabId && (noTimer || !(reportsData[activeTabId]?.approved === true || reportsData[activeTabId]?.approved === 'true')) && (
                    <Button 
                        variant="default" 
                        size="sm" 
                        onClick={handleApproveActiveTransformer}
                        disabled={isApproving}
                        className="gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-all hover:scale-105"
                    >
                        {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Approve Unit
                    </Button>
                )}



                {!isReadOnly && (
                    <Button variant="destructive" size="sm" onClick={handleAddToFailed} className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md">
                        <AlertTriangle className="w-4 h-4" /> Add to Failed
                    </Button>
                )}

                {!isReadOnly && (
                  <Button variant="outline" size="sm" onClick={handleSubmit} className="gap-2">
                      <Save className="w-4 h-4" /> Save
                  </Button>
                )}

                <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                    <Printer className="w-4 h-4" /> Print Report
                </Button>
            </div>
        </div>
        


        {transformersData.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-6 no-print justify-center bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                <span className="text-gray-500 font-medium mr-4 self-center">Select Unit to Test:</span>
                {transformersData.map((t, idx) => (
                    <Button 
                        key={t._id} 
                        variant={activeTabId === t._id ? "default" : "outline"}
                        onClick={() => setActiveTabId(t._id)}
                        className={`font-semibold min-w-[100px] transition-all duration-200 ${activeTabId === t._id ? 'bg-[#003a70] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        Unit {idx + 1}
                    </Button>
                ))}
            </div>
        )}

        {/* INTERACTIVE REPORT FORMAT MULTI UNITS */}
        <div className="w-full overflow-x-auto bg-gray-50 py-4 flex justify-start md:justify-center no-print-scroll">
            <div className="print-container w-[210mm] min-w-[210mm] print:w-full print:min-w-0 print:max-w-full">
                {transformersData.map((transformer) => {
                    const reportData = reportsData[transformer._id] || {};
                    const vState = getTransformerValidations(transformer._id, reportData);
                    const { preTestValidations, accValidations: accuracyValidations } = vState;
                    const isActive = activeTabId === transformer._id;
                    if (!isActive) return null;

                    return (
                        <PTFinalPrintableReport
                            key={transformer._id}
                            printRef={printRef}
                            order={order}
                            transformer={transformer}
                            reportData={reportData}
                            pretestData={pretestData[transformer._id] || reportData?.preTesting || {}}
                            activeCores={activeCores}
                            user={user}
                            isReadOnly={isReadOnly}
                            onChange={(section, field, val) => handleInputChange(transformer._id, section, field, val)}
                            onAccuracyChange={(core, perc, field, val) => handleAccuracyChange(transformer._id, core, perc, field, val)}
                            accuracyValidations={accuracyValidations}
                            preTestValidations={preTestValidations}
                        />
                    );
                })}
            </div>
        </div>

        {/* Failure Modal */}
        {showFailureModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white p-6 rounded-lg shadow-xl w-[400px]">
                    <div className="flex items-center gap-2 text-red-600 mb-4">
                        <AlertTriangle className="w-6 h-6" />
                        <h2 className="text-xl font-bold">Log Failed Transformer</h2>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                        You are about to log {failingCoresInfo.length} failing core(s). Please provide a reason for this failure.
                    </p>
                    <textarea 
                        className="w-full border border-gray-300 rounded p-2 text-sm min-h-[100px] mb-4 outline-none focus:ring-1 focus:ring-red-500"
                        placeholder="Enter failure reason and observations here..."
                        value={failureReason}
                        onChange={(e) => setFailureReason(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowFailureModal(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleLogFailure}>Confirm & Log Failure</Button>
                    </div>
                </div>
            </div>
        )}
        {/* Approve Section (Screen Only) */}
        {isReadOnly && activeTabId && (noTimer || !(reportsData[activeTabId]?.approved === true || reportsData[activeTabId]?.approved === 'true')) && (
          <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 no-print mt-6 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-green-900 font-bold mb-1">Approve Testing</h3>
                <p className="text-sm text-gray-700">
                  {noTimer 
                    ? "Click approve unit to finalize testing and move this transformer to the next stage."
                    : "You can approve the active unit individually, or approve the entire order if all units are completed."
                  }
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleApproveActiveTransformer}
                  disabled={isApproving}
                  className="bg-purple-600 hover:bg-purple-700 gap-2 text-white"
                  size="lg"
                >
                  {isApproving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                  Approve Unit
                </Button>
              </div>
            </div>
          </Card>
        )}
    </div>

  </> );
}

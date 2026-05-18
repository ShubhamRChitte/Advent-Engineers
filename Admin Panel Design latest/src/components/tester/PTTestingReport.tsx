import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Save, AlertCircle, ArrowLeft, AlertTriangle, Edit3, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { PTFinalPrintReport } from './PTFinalPrintReport';
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
}

export function PTTestingReport({ order, transformer, onBack, user }: PTTestingReportProps) {
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
    enabled:       !isReadOnly && !!transformer?._id
  });

  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const [metRes, protRes] = await Promise.all([
          axios.get('http://localhost:5001/api/accuracy-limits/metering?transformerType=PT', { withCredentials: true }),
          axios.get('http://localhost:5001/api/accuracy-limits/protection?transformerType=PT', { withCredentials: true })
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
                const testRes = await axios.get(`http://localhost:5001/api/pt-tests/${t._id}`, {
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
                    const pretestRes = await axios.get(`http://localhost:5001/api/pt-pretests/${t._id}`, { withCredentials: true }).catch(() => null);
                    if (pretestRes?.data?.success && pretestRes.data.data) {
                        // Merge pretest data into the preTesting field (will be rendered read-only)
                        newReportsData[t._id].preTesting = {
                            ...(pretestRes.data.data.preTesting || {}),
                            testedBy: pretestRes.data.data.testedBy || ''
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
                    const pretestResNew = await axios.get(`http://localhost:5001/api/pt-pretests/${t._id}`, { withCredentials: true }).catch(() => null);
                    let defaultPreTesting: any = {};
                    if (pretestResNew?.data?.success && pretestResNew.data.data?.preTesting) {
                        defaultPreTesting = pretestResNew.data.data.preTesting;
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
            axios.post('http://localhost:5001/api/pt-tests/submit', payload, { withCredentials: true })
        ));

        if (responses.every(r => r.data.success)) {
            toast.success(`Successfully submitted ${payloads.length} PT core test reports.`);
            endTimer(); // Record timer end for delay tracking
            setIsReadOnly(true);
            setTimeout(() => onBack(), 1500);
        }
    } catch (err: any) {
        console.error("Submission error", err);
        toast.error(err.response?.data?.message || "Failed to submit test reports");
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
            axios.post('http://localhost:5001/api/pt-tests/failed', payload, {
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
        {!isReadOnly && (
          <PTTimerBadge 
            timeLeftMs={timeLeftMs} 
            isOverdue={isOverdue} 
            expectedMinutes={expectedMinutes} 
            title="PT Final Test"
          />
        )}
        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            body * {
              visibility: hidden;
            }
            .print-container, .print-container * {
              visibility: visible;
            }
            .print-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background-color: white !important;
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

                {!isReadOnly && hasAnyFailures && (
                    <Button variant="destructive" size="sm" onClick={() => setShowFailureModal(true)} className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md">
                        <AlertTriangle className="w-4 h-4" /> Add to Failed Transformers
                    </Button>
                )}

                {!isReadOnly && (
                  <Button variant="outline" size="sm" onClick={handleSubmit} className="gap-2">
                      <Save className="w-4 h-4" /> Save
                  </Button>
                )}

                <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
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

        {/* Hidden print layout — only shown on window.print() */}
        <div className="pt-print-wrapper" style={{ position: 'absolute', left: '-9999px', top: 0, width: '210mm', overflow: 'hidden' }}>
            {transformersData.map((t) => (
                <PTFinalPrintReport
                    key={t._id}
                    order={order}
                    transformer={t}
                    reportData={reportsData[t._id] || {}}
                    pretestData={reportsData[t._id]?.preTesting || {}}
                    activeCores={activeCores}
                    user={user}
                />
            ))}
        </div>

        {/* INTERACTIVE REPORT FORMAT MULTI UNITS */}
        <div className="print-container screen-only">
            {transformersData.map((transformer) => {
                const reportData = reportsData[transformer._id] || {};
                const vState = getTransformerValidations(transformer._id, reportData);
                const { preTestValidations, accValidations: accuracyValidations } = vState;
                const isActive = activeTabId === transformer._id;

                return (
                    <div key={transformer._id} className={`print-page bg-white p-8 rounded-lg border border-gray-300 shadow-sm max-w-[800px] mx-auto text-sm mb-12 print:max-w-none print:w-full print:mx-0 print:my-0 print:p-0 print:border-none print:shadow-none print:rounded-none ${isActive ? 'block' : 'hidden print:block'}`}>
                        
                        {/* Header Title */}
                        <div className="text-center mb-6 border-b-2 border-black pb-3 print:pt-4">
                            <h1 className="text-2xl font-bold text-[#003a70] print:text-black mb-1 tracking-widest uppercase">ADVENT ENGINEERS</h1>
                            <h2 className="text-xl font-bold uppercase tracking-wide">Testing Record of Potential Transformer</h2>
                        </div>

                        {/* Section 1: Header Details */}
                        <div className="border border-black mb-4 flex divide-x divide-black">
                            <div className="flex-1 p-2 font-bold bg-gray-50 flex items-center">
                                SERIAL NO. : <span className="ml-2 py-0 h-6 font-normal w-32 border-b border-gray-400">{transformer.uniqueId || 'N/A'}</span>
                            </div>
                            <div className="p-2 w-48 font-bold bg-gray-50 flex items-center justify-end">
                                Date: <span className="ml-2 w-32 text-center text-sm p-1 inline-block border-b border-gray-400 font-normal">{reportData.date || new Date().toLocaleDateString('en-GB')}</span>
                            </div>
                        </div>

                        <table className="w-full border-collapse border border-black mb-4 table-fixed text-sm">
                            <tbody>
                                <tr>
                                    <td className="border border-black p-1 pl-2 font-medium w-1/4">Specification</td>
                                    <td className="border border-black p-1 pl-2 w-1/4 bg-gray-50">{order.voltageRating || '33'} KV PT</td>
                                    <td className="border border-black p-1 pl-2 font-medium w-1/4">Type 1</td>
                                    <td className="border border-black p-1 pl-2 w-1/4 bg-gray-50">{order.indoorOutdoor || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-1 pl-2 font-medium w-1/4">PT Ratio</td>
                                    <td className="border border-black p-1 pl-2 w-1/4 bg-gray-50">{ptRatioDisplay}</td>
                                    <td className="border border-black p-1 pl-2 font-medium w-1/4">Type 2</td>
                                    <td className="border border-black p-1 pl-2 w-1/4 bg-gray-50">{order.insulationType || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-1 pl-2 font-medium w-1/4">Burden</td>
                                    <td className="border border-black p-1 pl-2 w-1/4 bg-gray-50">{burdenDisplay} VA</td>
                                    <td className="border border-black p-1 pl-2 font-medium w-1/4">Class</td>
                                    <td className="border border-black p-1 pl-2 w-1/4 bg-gray-50">{accuracyClassDisplay}</td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-1 pl-2 font-medium w-1/4">Voltage Factor</td>
                                    <td className="border border-black p-1 pl-2 w-1/4 bg-gray-50">1.2 Cont.& 1.5 for 30 Sec</td>
                                    <td className="border border-black p-1 pl-2 font-medium w-1/4">Job No.</td>
                                    <td className="border border-black p-1 pl-2 w-1/4 bg-gray-50">{order.jobId || 'N/A'}</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Section 2: Pre testing */}
                        <div className="border border-black mb-4">
                            <div className="text-center font-bold bg-gray-100 border-b border-black py-1">Pre testing</div>
                            <table className="w-full border-collapse border-hidden table-fixed text-sm text-center">
                                <thead>
                                    <tr>
                                        <td className="border border-black p-1 w-1/3" rowSpan={2}>% of Primary<br/>current</td>
                                        <td className="border border-black p-1 font-bold w-1/3" colSpan={2}>100% Burden</td>
                                        <td className="border border-black p-1 font-bold w-1/3" colSpan={2}>25% Burden</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-1">Ratio Error</td>
                                        <td className="border border-black p-1">Phase Error</td>
                                        <td className="border border-black p-1">Ratio Error</td>
                                        <td className="border border-black p-1">Phase Error</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeCores.map((core) => {
                                        const isProtection = core.startsWith('protection');
                                        const coreNum = core.replace(/[a-z]/gi, '');
                                        const suffix = coreNum === '1' || coreNum === '' ? '' : ` ${coreNum}`;
                                        const label = isProtection 
                                            ? `Protection${suffix} 30%` 
                                            : core.startsWith('metering') 
                                                ? `Metering${suffix} 30%` 
                                                : `${core} 30%`;
                                        
                                        const validations = preTestValidations?.[core];
                                        const v100 = validations?.val100 || { isPass: undefined, reason: null };
                                        const v25 = validations?.val25 || { isPass: undefined, reason: null };

                                        return (
                                            <tr key={core}>
                                                <td className="border border-black p-1 font-medium text-left pl-2 bg-gray-50">
                                                    {label}
                                                </td>
                                                <td className="border border-black p-0.5"><Input className="h-7 border-none shadow-none text-center bg-gray-50 text-gray-600" value={reportData.preTesting?.[core]?.ratioError100 || ''} disabled /></td>
                                                <td className="border border-black p-0.5"><Input className="h-7 border-none shadow-none text-center bg-gray-50 text-gray-600" value={reportData.preTesting?.[core]?.phaseError100 || ''} disabled /></td>
                                                <td className="border border-black p-0.5"><Input className="h-7 border-none shadow-none text-center bg-gray-50 text-gray-600" value={reportData.preTesting?.[core]?.ratioError25 || ''} disabled /></td>
                                                <td className="border border-black p-0.5"><Input className="h-7 border-none shadow-none text-center bg-gray-50 text-gray-600" value={reportData.preTesting?.[core]?.phaseError25 || ''} disabled /></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <div className="flex justify-between items-center p-2 text-sm">
                                <div className="flex items-center">
                                    <span className="font-bold mr-2">Tested By: -</span>
                                    <Input value={reportData.preTesting?.testedBy || ''} className="w-48 h-7 text-blue-600 italic font-medium bg-transparent border-t-0 border-l-0 border-r-0 border-b border-gray-400 rounded-none px-1" readOnly />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Final Testing */}
                        <div className="border border-black mb-4">
                            <div className="text-center font-bold bg-gray-100 border-b border-black py-1">Final Testing</div>
                            <table className="w-full border-collapse border-hidden table-fixed text-sm text-left">
                                <thead>
                                    <tr>
                                        <th className="border border-black p-1 font-normal text-center w-16">Sr no.</th>
                                        <th className="border border-black p-1 font-normal w-1/2 text-center">Parameters</th>
                                        <th className="border border-black p-1 font-normal w-auto text-center">Readings</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { id: 1, label: 'Leakage', field: 'leakage' },
                                        { id: 2, label: 'Terminal Marking', field: 'terminalMarking' },
                                        { id: 3, label: 'Polarity Testing', field: 'polarityTesting' },
                                        { id: 4, label: 'Insulation Resistance Test', field: 'insulationResistance' },
                                        { id: 5, label: 'Primary to Secondary', field: 'primaryToSecondary' },
                                        { id: 6, label: 'Primary to Earth', field: 'primaryToEarth' },
                                        { id: 7, label: 'Secondary to Earth', field: 'secondaryToEarth' },
                                        { id: 9, label: 'H.V.Test on Secondary Winding', field: 'hvSecondary' },
                                        { id: 10, label: 'H.V.Test on Primary Winding', field: 'hvPrimary' },
                                        { id: 11, label: 'Induced Over Voltage Test', field: 'inducedOverVoltage' },
                                    ].map((row) => (
                                        <tr key={row.id}>
                                            <td className="border border-black p-1 text-center">{row.id}</td>
                                            <td className="border border-black p-1 pl-4">{row.label}</td>
                                            <td className="border border-black p-0">
                                                <Input 
                                                    className={`h-6 border-none shadow-none text-center bg-transparent w-full ${['OK', '10 GΩ'].includes(reportData.finalTesting?.[row.field]) ? 'text-blue-600' : ''}`}
                                                    value={reportData.finalTesting?.[row.field] || ''} 
                                                    onChange={(e) => handleInputChange(transformer._id, 'finalTesting', row.field, e.target.value)} 
                                                    disabled={isReadOnly} 
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Section 4: Accuracy Test Layout */}
                        <div className="border border-black mb-4">
                            <div className="text-center font-bold bg-gray-100 border-b border-black py-1 uppercase">Accuracy Test Metering</div>
                            <table className="w-full border-collapse border-hidden table-fixed text-sm text-center">
                                <thead>
                                    <tr>
                                        <td className="border border-black p-1 w-24 align-middle bg-gray-50 font-bold" rowSpan={2}>Core</td>
                                        <td className="border border-black p-1 w-24 align-middle bg-gray-50 font-bold" rowSpan={2}>% of primary<br/>current</td>
                                        <td className="border border-black p-1 font-bold w-auto bg-gray-50" colSpan={2}>100% Burden</td>
                                        <td className="border border-black p-1 font-bold w-auto bg-gray-50" colSpan={2}>25% Burden</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-1 leading-tight bg-gray-50 font-medium">Ratio Error<br/>(%)</td>
                                        <td className="border border-black p-1 leading-tight bg-gray-50 font-medium">Phase Error<br/>(min)</td>
                                        <td className="border border-black p-1 leading-tight bg-gray-50 font-medium">Ratio Error<br/>(%)</td>
                                        <td className="border border-black p-1 leading-tight bg-gray-50 font-medium">Phase error<br/>(min)</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeCores.map((core) => {
                                        const isProtection = core.startsWith('protection');
                                        const percentages = isProtection ? ['100'] : ['120', '100', '80'];
                                        const label = isProtection ? 'Protection' : 'Metering';

                                        return percentages.map((perc, idx) => {
                                            const val100 = accuracyValidations[core]?.[perc]?.val100 || { isPass: null, reason: null };
                                            const val25 = accuracyValidations[core]?.[perc]?.val25 || { isPass: null, reason: null };
                                            
                                            return (
                                                <tr key={`${core}-${perc}`}>
                                                    {idx === 0 && (
                                                        <td className="border border-black p-1 font-bold align-middle bg-gray-100 uppercase" rowSpan={percentages.length}>
                                                            {label}
                                                        </td>
                                                    )}
                                                    <td className="border border-black p-1 text-center relative font-medium bg-gray-50">
                                                        {perc}%
                                                        {(val100.isPass === false || val25.isPass === false) ? (
                                                            <div className="absolute right-0 top-1 text-[10px] font-bold px-1 py-0.5 rounded bg-red-100 text-red-700">FAIL</div>
                                                        ) : null}
                                                    </td>
                                                    <td className="border border-black p-0"><Input className={`h-7 border-none shadow-none text-center bg-transparent ${val100.isPass === false && val100.reason?.includes('Ratio') ? 'text-red-700 font-bold' : 'text-blue-600'}`} value={reportData.accuracyTest?.[core]?.[perc]?.ratioError100 || ''} onChange={(e) => handleAccuracyChange(transformer._id, core, perc, 'ratioError100', e.target.value)} disabled={isReadOnly} /></td>
                                                    <td className="border border-black p-0"><Input className={`h-7 border-none shadow-none text-center bg-transparent ${val100.isPass === false && val100.reason?.includes('Phase') ? 'text-red-700 font-bold' : 'text-blue-600'}`} value={reportData.accuracyTest?.[core]?.[perc]?.phaseError100 || ''} onChange={(e) => handleAccuracyChange(transformer._id, core, perc, 'phaseError100', e.target.value)} disabled={isReadOnly} /></td>
                                                    <td className="border border-black p-0"><Input className={`h-7 border-none shadow-none text-center bg-transparent ${val25.isPass === false && val25.reason?.includes('Ratio') ? 'text-red-700 font-bold' : 'text-blue-600'}`} value={reportData.accuracyTest?.[core]?.[perc]?.ratioError25 || ''} onChange={(e) => handleAccuracyChange(transformer._id, core, perc, 'ratioError25', e.target.value)} disabled={isReadOnly} /></td>
                                                    <td className="border border-black p-0"><Input className={`h-7 border-none shadow-none text-center bg-transparent ${val25.isPass === false && val25.reason?.includes('Phase') ? 'text-red-700 font-bold' : 'text-blue-600'}`} value={reportData.accuracyTest?.[core]?.[perc]?.phaseError25 || ''} onChange={(e) => handleAccuracyChange(transformer._id, core, perc, 'phaseError25', e.target.value)} disabled={isReadOnly} /></td>
                                                </tr>
                                            );
                                        });
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-between items-center p-2 text-sm border border-black bg-gray-50 mt-4">
                            <div className="flex items-center">
                                <span className="font-bold mr-2 ml-2">Tested By:</span>
                                <Input value={reportData.testedBy || user?.name || user?.fullName || ''} className="w-48 h-7 text-blue-600 italic font-medium bg-transparent border-t-0 border-l-0 border-r-0 border-b border-gray-400 rounded-none px-1" readOnly disabled={isReadOnly} />
                            </div>
                        </div>

                    </div>
                );
            })}
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
    </div>

  </> );
}

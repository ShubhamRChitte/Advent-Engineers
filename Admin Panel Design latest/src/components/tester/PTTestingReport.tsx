import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Save, AlertCircle, ArrowLeft, AlertTriangle, Edit3, Printer } from 'lucide-react';
import { toast } from 'sonner';

// IS-16227 Standard Limits for PT
export const PT_METERING_CLASS_LIMITS = {
  "0.1": { ratioLimit: 0.1, phaseLimit: 5 },
  "0.2": { ratioLimit: 0.2, phaseLimit: 10 },
  "0.5": { ratioLimit: 0.5, phaseLimit: 20 },
  "1": { ratioLimit: 1.0, phaseLimit: 40 },
  "3": { ratioLimit: 3.0, phaseLimit: null },
};

export const PT_PROTECTION_CLASS_LIMITS = {
  "3P": { ratioLimit: 3.0, phaseLimit: 120 },
  "6P": { ratioLimit: 6.0, phaseLimit: 240 },
};

export function validatePTMeteringUI(accClass: string, ratioErrorStr: string, phaseErrorStr: string) {
  if ((!ratioErrorStr || String(ratioErrorStr).trim() === '') && (!phaseErrorStr || String(phaseErrorStr).trim() === '')) {
    return { isPass: undefined, reason: null };
  }
  
  const normalizedClass = accClass ? accClass : "0.5";
  const limitConfig = PT_METERING_CLASS_LIMITS[normalizedClass as keyof typeof PT_METERING_CLASS_LIMITS] || PT_METERING_CLASS_LIMITS['0.5'];

  let isPass = true;
  let reasons: string[] = [];

  if (ratioErrorStr && String(ratioErrorStr).trim() !== '') {
    const rVal = parseFloat(String(ratioErrorStr));
    if (!isNaN(rVal) && Math.abs(rVal) > limitConfig.ratioLimit) {
      isPass = false;
      reasons.push(`Ratio Error (${rVal}%) exceeds ±${limitConfig.ratioLimit}%`);
    }
  }

  if (limitConfig.phaseLimit !== null && phaseErrorStr && String(phaseErrorStr).trim() !== '') {
    const pVal = parseFloat(String(phaseErrorStr));
    if (!isNaN(pVal) && Math.abs(pVal) > limitConfig.phaseLimit) {
      isPass = false;
      reasons.push(`Phase Error (${pVal}m) exceeds ±${limitConfig.phaseLimit}m`);
    }
  }

  return { isPass, reason: reasons.length > 0 ? reasons.join('; ') : null };
}

export function validatePTProtectionUI(accClass: string, ratioErrorStr: string, phaseErrorStr: string) {
  if ((!ratioErrorStr || String(ratioErrorStr).trim() === '') && (!phaseErrorStr || String(phaseErrorStr).trim() === '')) {
    return { isPass: undefined, reason: null };
  }
  
  const normalizedClass = accClass && accClass.includes('6P') ? '6P' : '3P'; // Default to 3P if unknown protection
  const limitConfig = PT_PROTECTION_CLASS_LIMITS[normalizedClass as keyof typeof PT_PROTECTION_CLASS_LIMITS] || PT_PROTECTION_CLASS_LIMITS['3P'];

  let isPass = true;
  let reasons: string[] = [];

  if (ratioErrorStr && String(ratioErrorStr).trim() !== '') {
    const rVal = parseFloat(String(ratioErrorStr));
    if (!isNaN(rVal) && Math.abs(rVal) > limitConfig.ratioLimit) {
      isPass = false;
      reasons.push(`Ratio Error (${rVal}%) exceeds ±${limitConfig.ratioLimit}%`);
    }
  }

  if (phaseErrorStr && String(phaseErrorStr).trim() !== '') {
    const pVal = parseFloat(String(phaseErrorStr));
    if (!isNaN(pVal) && Math.abs(pVal) > limitConfig.phaseLimit) {
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
    
    // Check if Configuration B: 1 Metering, 2 Protection
    let countMetering = 0;
    let countProtection = 0;
    
    const coresList: string[] = [];
    cores.forEach((core: any) => {
        const type = typeof core === 'string' ? core : core.coreType;
        if (type?.toLowerCase() === 'metering') {
            countMetering++;
            coresList.push('metering');
        }
        if (type?.toLowerCase() === 'protection') {
            countProtection++;
            coresList.push(`protection${countProtection}`);
        }
    });

    // Valid configurations are: 1 Metering & 0 Protection OR 1 Metering & 2 Protection
    const isValidConfig = (countMetering === 1 && countProtection === 0) || (countMetering === 1 && countProtection === 2);
    
    if (!isValidConfig) {
        setInvalidConfig(true);
        return;
    }

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
                const testRes = await axios.get(`http://localhost:5000/api/pt-tests/${t._id}`, {
                    withCredentials: true
                });

                if (testRes.data.success && testRes.data.data) {
                    let savedData = testRes.data.data;
                    if (savedData.preTesting && !savedData.preTesting.metering) {
                        savedData.preTesting = {
                            metering: { ratioError100: '', phaseError100: '', ratioError25: '', phaseError25: '' },
                            protection1: { ratioError100: '', phaseError100: '', ratioError25: '', phaseError25: '' },
                            protection2: { ratioError100: '', phaseError100: '', ratioError25: '', phaseError25: '' }
                        };
                    }

                    if (savedData.accuracyTest && !savedData.accuracyTest.metering) {
                         const oldAcc = savedData.accuracyTest;
                         let migratedAcc: any = {};
                         coresList.forEach(core => {
                             if (core === 'metering') {
                                  migratedAcc[core] = {
                                      '120': oldAcc['120'] || { ratioError100: '', phaseError100: '', ratioError25: '', phaseError25: '' },
                                      '100': oldAcc['100'] || { ratioError100: '', phaseError100: '', ratioError25: '', phaseError25: '' },
                                      '80': oldAcc['80'] || { ratioError100: '', phaseError100: '', ratioError25: '', phaseError25: '' },
                                  };
                             } else {
                                  migratedAcc[core] = {
                                      '100': { ratioError100: '', phaseError100: '', ratioError25: '', phaseError25: '' },
                                  };
                             }
                         });
                         savedData.accuracyTest = migratedAcc;
                    }

                    if (!isReadOnly && !savedData.testedBy) {
                        savedData.testedBy = user?.name || user?.fullName || 'Tester';
                    }
                    newReportsData[t._id] = savedData;
                    // Mark as readOnly if they already saved a report (they can unlock via Edit button)
                    if (testRes.data.data && Object.keys(testRes.data.data).length > 2) {
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

                    newReportsData[t._id] = {
                        preTesting: {
                            metering: { ratioError100: '', phaseError100: '', ratioError25: '', phaseError25: '' },
                            protection1: { ratioError100: '', phaseError100: '', ratioError25: '', phaseError25: '' },
                            protection2: { ratioError100: '', phaseError100: '', ratioError25: '', phaseError25: '' }
                        },
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
            newData[section] = { ...newData[section] };
            newData[section][field] = { ...newData[section][field], [subField]: value };
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
        
        newData.accuracyTest[core] = { ...newData.accuracyTest[core] };
        newData.accuracyTest[core][percentage] = { ...newData.accuracyTest[core][percentage], [field]: value };
        
        allData[tId] = newData;
        return allData;
    });
  };

  const handleSubmit = async () => {
    try {
        if (transformersData.length === 0) return;
        
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
            axios.post('http://localhost:5000/api/pt-tests/submit', payload, { withCredentials: true })
        ));

        if (responses.every(r => r.data.success)) {
            toast.success(`Successfully submitted ${payloads.length} PT core test reports.`);
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
            axios.post('http://localhost:5000/api/pt-tests/failed', payload, {
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
      const accuracyClassLocal = order.accuracyClass || '0.2';
      
      const metVal100 = validatePTMeteringUI(accuracyClassLocal, reportDataLocal.preTesting?.metering?.ratioError100, reportDataLocal.preTesting?.metering?.phaseError100);
      const metVal25 = validatePTMeteringUI(accuracyClassLocal, reportDataLocal.preTesting?.metering?.ratioError25, reportDataLocal.preTesting?.metering?.phaseError25);
      
      const pr1Val100 = validatePTProtectionUI("3P", reportDataLocal.preTesting?.protection1?.ratioError100, reportDataLocal.preTesting?.protection1?.phaseError100);
      const pr1Val25 = validatePTProtectionUI("3P", reportDataLocal.preTesting?.protection1?.ratioError25, reportDataLocal.preTesting?.protection1?.phaseError25);
      
      const pr2Val100 = validatePTProtectionUI("3P", reportDataLocal.preTesting?.protection2?.ratioError100, reportDataLocal.preTesting?.protection2?.phaseError100);
      const pr2Val25 = validatePTProtectionUI("3P", reportDataLocal.preTesting?.protection2?.ratioError25, reportDataLocal.preTesting?.protection2?.phaseError25);

      const accValidations: any = {};
      let hasAccFails = false;

      activeCores.forEach(core => {
          const isProtection = core.startsWith('protection');
          const protClass = isProtection ? "3P" : "";
          
          accValidations[core] = {};
          const percentages = isProtection ? ['100'] : ['120', '100', '80'];
          percentages.forEach(perc => {
              const rowData = reportDataLocal.accuracyTest?.[core]?.[perc] || {};
              const v100 = isProtection 
                   ? validatePTProtectionUI(protClass, rowData.ratioError100, rowData.phaseError100)
                   : validatePTMeteringUI(accuracyClassLocal, rowData.ratioError100, rowData.phaseError100);
              const v25 = isProtection 
                   ? validatePTProtectionUI(protClass, rowData.ratioError25, rowData.phaseError25)
                   : validatePTMeteringUI(accuracyClassLocal, rowData.ratioError25, rowData.phaseError25);
              
              accValidations[core][perc] = { val100: v100, val25: v25 };
              if (v100.isPass === false || v25.isPass === false) hasAccFails = true;
          });
      });

      const hasFail = metVal100.isPass === false || metVal25.isPass === false ||
          pr1Val100.isPass === false || pr1Val25.isPass === false ||
          pr2Val100.isPass === false || pr2Val25.isPass === false || hasAccFails;

      let failsLog: any[] = [];
      if (metVal100.isPass === false || metVal25.isPass === false) failsLog.push({ coreType: "PRE-TEST METERING", params: { reasons: [metVal100.reason, metVal25.reason].filter(Boolean) }, transformerId });
      if (pr1Val100.isPass === false || pr1Val25.isPass === false) failsLog.push({ coreType: "PRE-TEST PROTECTION 1", params: { reasons: [pr1Val100.reason, pr1Val25.reason].filter(Boolean) }, transformerId });
      if (pr2Val100.isPass === false || pr2Val25.isPass === false) failsLog.push({ coreType: "PRE-TEST PROTECTION 2", params: { reasons: [pr2Val100.reason, pr2Val25.reason].filter(Boolean) }, transformerId });

      activeCores.forEach(core => {
          const isProtection = core.startsWith('protection');
          const protClass = isProtection ? "3P" : "";
          const percentages = isProtection ? ['100'] : ['120', '100', '80'];
          const reasons: any[] = [];
          
          percentages.forEach(perc => {
              const rowData = reportDataLocal.accuracyTest?.[core]?.[perc] || {};
              const v100 = isProtection ? validatePTProtectionUI(protClass, rowData.ratioError100, rowData.phaseError100) : validatePTMeteringUI(accuracyClassLocal, rowData.ratioError100, rowData.phaseError100);
              const v25 = isProtection ? validatePTProtectionUI(protClass, rowData.ratioError25, rowData.phaseError25) : validatePTMeteringUI(accuracyClassLocal, rowData.ratioError25, rowData.phaseError25);
              if (v100.isPass === false) reasons.push(v100.reason);
              if (v25.isPass === false) reasons.push(v25.reason);
          });
          if (reasons.filter(Boolean).length > 0) failsLog.push({ coreType: `ACCURACY TEST - ${core.toUpperCase()}`, params: { reasons: reasons.filter(Boolean) }, transformerId });
      });

      return { metVal100, metVal25, pr1Val100, pr1Val25, pr2Val100, pr2Val25, accValidations, hasFail, failsLog };
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
  }, [reportsData, transformersData, activeCores, order]);

  if (invalidConfig) {
    return (
        <Card className="p-8 text-center bg-red-50 border-red-200">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-red-800 text-lg mb-2">Invalid Configuration for PT Testing</h3>
            <p className="text-red-600 mb-6">
                This testing module is strictly for "PT" type transformers that have exactly one "Metering" core configuration, or one "Metering" and two "Protection" cores.
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
            <div className="p-8 text-center text-gray-500">Loading PT testing layout...</div>
        </div>
      );
  }

  const accuracyClassDisplay = (() => {
    const cores = order?.coreDetails || order?.coreConfigs || [];
    const fallback = order?.accuracyClass || '0.2';

    if (!Array.isArray(cores) || cores.length === 0) return fallback;

    const meteringClasses: string[] = [];
    const protectionClasses: string[] = [];

    const normalize = (v: unknown) => {
      if (v === null || v === undefined) return '';
      const s = String(v).trim();
      if (!s || s.toLowerCase() === 'n/a') return '';
      return s;
    };

    cores.forEach((core: any) => {
      const coreType = typeof core === 'string' ? core : core?.coreType;
      let coreClass = normalize(typeof core === 'string' ? '' : core?.accuracyClass);

      if (!coreType) return;
      const typeLc = String(coreType).toLowerCase();

      // Only fall back to order.accuracyClass for metering cores; do not reuse it for protection cores.
      if (!coreClass && typeLc.includes('meter')) coreClass = normalize(fallback);
      if (!coreClass) return;

      if (typeLc.includes('meter')) meteringClasses.push(coreClass);
      else if (typeLc.includes('protection')) protectionClasses.push(coreClass);
    });

    const ordered = [...meteringClasses, ...protectionClasses].map(normalize).filter(Boolean);
    if (ordered.length === 0) return fallback;

    // De-dup while preserving order: metering first, then protection.
    const uniq: string[] = [];
    ordered.forEach((c) => {
      if (!uniq.includes(c)) uniq.push(c);
    });

    return uniq.join(' / ');
  })();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
                    <Printer className="w-4 h-4" /> Print
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

        {/* PRINTABLE REPORT FORMAT MULTI UNITS */}
        <div className="print-container">
            {transformersData.map((transformer) => {
                const reportData = reportsData[transformer._id] || {};
                const vState = getTransformerValidations(transformer._id, reportData);
                const { metVal100: meteringVal100, metVal25: meteringVal25, pr1Val100: prot1Val100, pr1Val25: prot1Val25, pr2Val100: prot2Val100, pr2Val25: prot2Val25, accValidations: accuracyValidations } = vState;
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
                                    <td className="border border-black p-1 pl-2 w-1/4 bg-gray-50">O/D</td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-1 pl-2 font-medium w-1/4">PT Ratio</td>
                                    <td className="border border-black p-1 pl-2 w-1/4 bg-gray-50">{order.ratio?.[0] || 'N/A'}</td>
                                    <td className="border border-black p-1 pl-2 font-medium w-1/4">Type 2</td>
                                    <td className="border border-black p-1 pl-2 w-1/4 bg-gray-50">O/C</td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-1 pl-2 font-medium w-1/4">Burden</td>
                                    <td className="border border-black p-1 pl-2 w-1/4 bg-gray-50">{order.burden || 'N/A'} VA</td>
                                    <td className="border border-black p-1 pl-2 font-medium w-1/4">Class</td>
                                    <td className="border border-black p-1 pl-2 w-1/4 bg-gray-50">{order.accuracyClass || '0.2'}</td>
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
                                        const label = isProtection ? 'Protection 30%' : 'Metering 30%';
                                        
                                        let v100, v25;
                                        if (core === 'metering') {
                                            v100 = meteringVal100; v25 = meteringVal25;
                                        } else if (core === 'protection1') {
                                            v100 = prot1Val100; v25 = prot1Val25;
                                        } else {
                                            v100 = prot2Val100; v25 = prot2Val25;
                                        }

                                        return (
                                            <tr key={core}>
                                                <td className="border border-black p-1 font-medium text-left pl-2 relative bg-gray-50">
                                                    {label}
                                                    {(v100.isPass === false || v25.isPass === false) ? (
                                                        <div className="absolute right-1 top-1 text-[10px] font-bold px-1 py-0.5 rounded bg-red-100 text-red-700">FAIL</div>
                                                    ) : (v100.isPass && v25.isPass) ? (
                                                        <div className="absolute right-1 top-1 text-[10px] font-bold px-1 py-0.5 rounded bg-green-100 text-green-700">PASS</div>
                                                    ) : null}
                                                </td>
                                                <td className="border border-black p-0.5"><Input className={`h-7 border-none shadow-none text-center bg-transparent ${v100.isPass === false && v100.reason?.includes('Ratio') ? 'text-red-700 font-bold' : 'text-blue-600'}`} value={reportData.preTesting?.[core]?.ratioError100 || ''} onChange={(e) => handleInputChange(transformer._id, 'preTesting', core, e.target.value, 'ratioError100')} disabled={isReadOnly} /></td>
                                                <td className="border border-black p-0.5"><Input className={`h-7 border-none shadow-none text-center bg-transparent ${v100.isPass === false && v100.reason?.includes('Phase') ? 'text-red-700 font-bold' : 'text-blue-600'}`} value={reportData.preTesting?.[core]?.phaseError100 || ''} onChange={(e) => handleInputChange(transformer._id, 'preTesting', core, e.target.value, 'phaseError100')} disabled={isReadOnly} /></td>
                                                <td className="border border-black p-0.5"><Input className={`h-7 border-none shadow-none text-center bg-transparent ${v25.isPass === false && v25.reason?.includes('Ratio') ? 'text-red-700 font-bold' : 'text-blue-600'}`} value={reportData.preTesting?.[core]?.ratioError25 || ''} onChange={(e) => handleInputChange(transformer._id, 'preTesting', core, e.target.value, 'ratioError25')} disabled={isReadOnly} /></td>
                                                <td className="border border-black p-0.5"><Input className={`h-7 border-none shadow-none text-center bg-transparent ${v25.isPass === false && v25.reason?.includes('Phase') ? 'text-red-700 font-bold' : 'text-blue-600'}`} value={reportData.preTesting?.[core]?.phaseError25 || ''} onChange={(e) => handleInputChange(transformer._id, 'preTesting', core, e.target.value, 'phaseError25')} disabled={isReadOnly} /></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <div className="flex justify-between items-center p-2 text-sm">
                                <div className="flex items-center">
                                    <span className="font-bold mr-2">Tested By: -</span>
                                    <Input value={reportData.testedBy || user?.name || user?.fullName || ''} className="w-48 h-7 text-blue-600 italic font-medium bg-transparent border-t-0 border-l-0 border-r-0 border-b border-gray-400 rounded-none px-1" readOnly />
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
                                                        ) : (val100.isPass && val25.isPass) ? (
                                                            <div className="absolute right-0 top-1 text-[10px] font-bold px-1 py-0.5 rounded bg-green-100 text-green-700">PASS</div>
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
  );
}

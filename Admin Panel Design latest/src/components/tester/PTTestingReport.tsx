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
                const testRes = await axios.get(`http://localhost:3002/api/pt-tests/${t._id}`, {
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

        // Basic validation across all sheets
        const missingSigs = payloads.filter(p => !p.reportData.signature);
        if (missingSigs.length > 0) {
            toast.error(`Please provide a signature for all (${missingSigs.length}) reports before saving.`);
            return;
        }

        // Wait for all to submit sequentially or in parallel
        const responses = await Promise.all(payloads.map(payload => 
            axios.post('http://localhost:3002/api/pt-tests/submit', payload, { withCredentials: true })
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
            axios.post('http://localhost:3002/api/pt-tests/failed', payload, {
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
            /* Match CT Metering Core print (PrintableCoreReport #print-section) — A4, no @page inset, absolute layer */
            @page {
              size: A4 portrait;
              margin: 0;
            }
            html,
            body {
              height: 297mm;
              overflow: hidden;
            }
            body * {
              visibility: hidden;
            }
            .print-container,
            .print-container * {
              visibility: visible;
            }
            .print-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              box-sizing: border-box;
            }
            #printable-report {
              max-width: 210mm;
              width: 100%;
              margin: 0 auto !important;
              padding: 10mm 12mm !important;
              padding-bottom: 0 !important;
              box-sizing: border-box;
              color: #000 !important;
              font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
              font-size: 12px !important; /* Slight readability bump */
              line-height: 1.45 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              transform: scale(0.96);
              transform-origin: top center;
            }
            #printable-report.pt-report-document .pt-report-section-title {
              font-size: 0.8125rem !important;
              font-weight: 700 !important;
              letter-spacing: 0.06em !important;
              text-transform: uppercase !important;
            }
            #printable-report.pt-report-document .pt-report-sig input {
              text-align: left !important;
              font-style: normal !important;
            }
            #printable-report.pt-report-document .pt-report-sig-right input {
              text-align: right !important;
            }
            #printable-report table {
              width: 100% !important;
              border-collapse: collapse !important;
              table-layout: fixed;
            }
            #printable-report table,
            #printable-report tr,
            #printable-report td,
            #printable-report th {
              page-break-inside: avoid !important;
            }
            /* CT .report-table density: 11px, ~4px padding, compact rows */
            #printable-report table td,
            #printable-report table th {
              font-size: 11.5px !important;
              padding: 2px 3px !important;
              line-height: 1.15 !important;
              vertical-align: middle !important;
            }
            #printable-report .pt-report-label {
              text-align: left !important;
              font-weight: 600 !important;
            }
            #printable-report .pt-report-value {
              text-align: center !important;
              font-weight: 400 !important;
            }
            #printable-report .pt-report-num,
            #printable-report .pt-report-num input {
              font-variant-numeric: tabular-nums !important;
              text-align: center !important;
            }
            #printable-report h1 {
              font-size: 22px !important;
              font-weight: 900 !important;
              color: #b30000 !important;
              text-align: center !important;
              margin-bottom: 2px !important;
              letter-spacing: 0.04em !important;
            }
            #printable-report h2 {
              font-size: 13px !important;
              font-weight: 800 !important;
              margin-bottom: 10px !important;
            }
            #printable-report .mb-6 {
              margin-bottom: 4px !important;
            }
            #printable-report .mb-4 {
              margin-bottom: 4px !important;
            }
            #printable-report .mb-3 {
              margin-bottom: 3px !important;
            }
            #printable-report .mb-2 {
              margin-bottom: 3px !important;
            }
            #printable-report .mt-4 {
              margin-top: 4px !important;
            }
            #printable-report .pb-2 {
              padding-bottom: 2px !important;
            }
            #printable-report .py-1 {
              padding-top: 2px !important;
              padding-bottom: 2px !important;
            }
            #printable-report .p-2 {
              padding: 2px 4px !important;
            }
            #printable-report .p-1 {
              padding: 1px 3px !important;
            }
            #printable-report .p-0\\.5 {
              padding: 1px 2px !important;
            }
            #printable-report .leading-tight {
              line-height: 1.1 !important;
            }
            #printable-report input,
            #printable-report select {
              border: none !important;
              background: transparent !important;
              outline: none !important;
              font-weight: 500 !important;
              text-align: center !important;
              width: 100% !important;
              color: #000 !important;
              font-size: 11.5px !important;
              min-height: 0 !important;
              height: 20px !important;
              padding: 0 2px !important;
              line-height: 1.2 !important;
              box-shadow: none !important;
              opacity: 1 !important;
              -webkit-text-fill-color: #000 !important;
            }
            #printable-report td.pl-4 input,
            #printable-report td.text-left input {
              text-align: left !important;
            }

            /* PT "Class" field: keep single-line and print-safe */
            #printable-report .class-field {
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: clip !important;
              word-break: keep-all !important;
              font-size: inherit !important;
            }

            /* Hide validation indicators completely during print */
            #printable-report .validation-ui {
              display: none !important;
            }

            /* Remove validation color emphasis during print */
            #printable-report [class*="text-red"],
            #printable-report [class*="text-green"],
            #printable-report [class*="border-red"],
            #printable-report [class*="border-green"],
            #printable-report [class*="bg-red"],
            #printable-report [class*="bg-green"] {
              color: #000 !important;
              border-color: #000 !important;
              background: transparent !important;
            }

            /* Industrial print: enforce solid black borders */
            #printable-report table,
            #printable-report th,
            #printable-report td {
              border: 1px solid #000 !important;
              border-color: #000 !important;
            }
            #printable-report * {
              border-color: #000 !important;
            }

            /* Remove grey background shading in printable output */
            #printable-report [class*="bg-gray"] {
              background: transparent !important;
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
                  <Button variant="outline" size="sm" onClick={handleSubmit} className="gap-2" disabled={hasAnyFailures}>
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
        <div className="print-container pt-report-document" id="printable-report">
            {transformersData.map((transformer) => {
                const reportData = reportsData[transformer._id] || {};
                const isActive = activeTabId === transformer._id;

                return (
                    <div key={transformer._id} className={`print-page bg-white p-6 rounded-lg border border-gray-300 shadow-sm max-w-[800px] mx-auto text-sm mb-6 print:max-w-none print:w-full print:mx-0 print:my-0 print:p-0 print:border-none print:shadow-none print:rounded-none ${isActive ? 'block' : 'hidden print:block'}`}>
                        
                        <header className="mb-5 print:mb-4 border-b-2 border-black pb-4 print:pb-3">
                            <h1 className="text-center text-xl font-bold tracking-wide text-[#003a70] print:text-black uppercase mb-2 print:mb-1.5">
                                Advent Engineers
                            </h1>
                            <h2 className="text-center text-sm font-semibold text-gray-700 print:text-black uppercase tracking-wider mb-5 print:mb-4">
                                Testing Record of Potential Transformer
                            </h2>
                            <div className="flex border border-black text-sm">
                                <div className="flex-1 px-3 py-2.5 bg-gray-50 border-r border-black text-left">
                                    <span className="font-semibold">Serial No.</span>
                                    <span className="ml-2 font-normal tabular-nums">{transformer.uniqueId || '—'}</span>
                                </div>
                                <div className="w-44 shrink-0 px-3 py-2.5 bg-gray-50 text-right tabular-nums">
                                    <span className="font-semibold">Date</span>
                                    <span className="ml-2 font-normal">{reportData.date || new Date().toLocaleDateString('en-GB')}</span>
                                </div>
                            </div>
                        </header>

                        <table className="w-full border-collapse border border-black mb-5 print:mb-4 table-fixed text-sm">
                            <tbody>
                                <tr>
                                    <td className="border border-black px-2 py-2 pt-report-label w-[22%]">Specification</td>
                                    <td className="border border-black px-2 py-2 pt-report-value bg-white w-[28%]">{order.voltageRating || '33'} kV PT</td>
                                    <td className="border border-black px-2 py-2 pt-report-label w-[22%]">Type 1</td>
                                    <td className="border border-black px-2 py-2 pt-report-value bg-white w-[28%]">O/D</td>
                                </tr>
                                <tr>
                                    <td className="border border-black px-2 py-2 pt-report-label">PT Ratio</td>
                                    <td className="border border-black px-2 py-2 pt-report-value bg-white">{Array.isArray(order.ratio) && order.ratio.length > 0 ? order.ratio.join(' / ') : (order.ratio || 'N/A')}</td>
                                    <td className="border border-black px-2 py-2 pt-report-label">Type 2</td>
                                    <td className="border border-black px-2 py-2 pt-report-value bg-white">O/C</td>
                                </tr>
                                <tr>
                                    <td className="border border-black px-2 py-2 pt-report-label">Burden</td>
                                    <td className="border border-black px-2 py-2 pt-report-value bg-white">{order.burden || 'N/A'} VA</td>
                                    <td className="border border-black px-2 py-2 pt-report-label">Class</td>
                                    <td className="border border-black px-2 py-2 pt-report-value bg-white tabular-nums class-field">{accuracyClassDisplay}</td>
                                </tr>
                                <tr>
                                    <td className="border border-black px-2 py-2 pt-report-label">Voltage Factor</td>
                                    <td className="border border-black px-2 py-2 pt-report-value bg-white text-center">1.2 cont. &amp; 1.5 for 30 s</td>
                                    <td className="border border-black px-2 py-2 pt-report-label">Job No.</td>
                                    <td className="border border-black px-2 py-2 pt-report-value bg-white tabular-nums">{order.jobId || 'N/A'}</td>
                                </tr>
                            </tbody>
                        </table>

                        <section className="mb-5 print:mb-4 border border-black">
                            <div className="pt-report-section-title text-center py-2.5 bg-gray-100 border-b border-black">Pre Testing</div>
                            <table className="w-full border-collapse border-0 table-fixed text-sm">
                                <thead>
                                    <tr>
                                        <th className="border border-black px-2 py-2 font-semibold text-left align-middle bg-gray-50 w-[28%]" rowSpan={2}>
                                            % of primary current
                                        </th>
                                        <th className="border border-black px-2 py-2 font-semibold text-center bg-gray-50" colSpan={2}>100% burden</th>
                                        <th className="border border-black px-2 py-2 font-semibold text-center bg-gray-50" colSpan={2}>25% burden</th>
                                    </tr>
                                    <tr>
                                        <th className="border border-black px-2 py-1.5 font-medium text-center bg-gray-50">Ratio error</th>
                                        <th className="border border-black px-2 py-1.5 font-medium text-center bg-gray-50">Phase error</th>
                                        <th className="border border-black px-2 py-1.5 font-medium text-center bg-gray-50">Ratio error</th>
                                        <th className="border border-black px-2 py-1.5 font-medium text-center bg-gray-50">Phase error</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeCores.map((core) => {
                                        const isProtection = core.startsWith('protection');
                                        const label = isProtection ? 'Protection 30%' : 'Metering 30%';
                                        const accuracyClassLocal = order.accuracyClass || '0.2';

                                        const ratioError100 = reportData.preTesting?.[core]?.ratioError100 || '';
                                        const phaseError100 = reportData.preTesting?.[core]?.phaseError100 || '';
                                        const ratioError25 = reportData.preTesting?.[core]?.ratioError25 || '';
                                        const phaseError25 = reportData.preTesting?.[core]?.phaseError25 || '';

                                        const v100 = isProtection
                                            ? validatePTProtectionUI('3P', ratioError100, phaseError100)
                                            : validatePTMeteringUI(accuracyClassLocal, ratioError100, phaseError100);
                                        const v25 = isProtection
                                            ? validatePTProtectionUI('3P', ratioError25, phaseError25)
                                            : validatePTMeteringUI(accuracyClassLocal, ratioError25, phaseError25);

                                        return (
                                            <tr key={core}>
                                                <td className="border border-black px-2 py-1.5 text-left font-medium bg-gray-50 relative">
                                                    {label}
                                                </td>
                                                <td className="border border-black p-0 pt-report-num align-middle">
                                                    <Input
                                                        className={`h-8 min-h-0 w-full px-2 py-1 text-sm pt-report-num ${v100.isPass === false && v100.reason?.includes('Ratio') ? 'text-red-700 font-bold' : 'text-blue-600'}`}
                                                        value={ratioError100}
                                                        onChange={(e) => handleInputChange(transformer._id, 'preTesting', core, e.target.value, 'ratioError100')}
                                                        disabled={isReadOnly}
                                                        readOnly={isReadOnly}
                                                    />
                                                </td>
                                                <td className="border border-black p-0 pt-report-num align-middle">
                                                    <Input
                                                        className={`h-8 min-h-0 w-full px-2 py-1 text-sm pt-report-num ${v100.isPass === false && v100.reason?.includes('Phase') ? 'text-red-700 font-bold' : 'text-blue-600'}`}
                                                        value={phaseError100}
                                                        onChange={(e) => handleInputChange(transformer._id, 'preTesting', core, e.target.value, 'phaseError100')}
                                                        disabled={isReadOnly}
                                                        readOnly={isReadOnly}
                                                    />
                                                </td>
                                                <td className="border border-black p-0 pt-report-num align-middle">
                                                    <Input
                                                        className={`h-8 min-h-0 w-full px-2 py-1 text-sm pt-report-num ${v25.isPass === false && v25.reason?.includes('Ratio') ? 'text-red-700 font-bold' : 'text-blue-600'}`}
                                                        value={ratioError25}
                                                        onChange={(e) => handleInputChange(transformer._id, 'preTesting', core, e.target.value, 'ratioError25')}
                                                        disabled={isReadOnly}
                                                        readOnly={isReadOnly}
                                                    />
                                                </td>
                                                <td className="border border-black p-0 pt-report-num align-middle">
                                                    <Input
                                                        className={`h-8 min-h-0 w-full px-2 py-1 text-sm pt-report-num ${v25.isPass === false && v25.reason?.includes('Phase') ? 'text-red-700 font-bold' : 'text-blue-600'}`}
                                                        value={phaseError25}
                                                        onChange={(e) => handleInputChange(transformer._id, 'preTesting', core, e.target.value, 'phaseError25')}
                                                        disabled={isReadOnly}
                                                        readOnly={isReadOnly}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <div className="flex items-baseline gap-2 px-3 py-2.5 border-t border-black bg-gray-50 text-sm">
                                <span className="font-semibold shrink-0">Tested by</span>
                                <Input value={reportData.testedBy || user?.name || user?.fullName || ''} readOnly className="flex-1 min-w-0 h-8 border-0 border-b border-gray-800 rounded-none bg-transparent px-1 text-sm" />
                            </div>
                        </section>

                        <section className="mb-5 print:mb-4 border border-black">
                            <div className="pt-report-section-title text-center py-2.5 bg-gray-100 border-b border-black">Final Testing</div>
                            <table className="w-full border-collapse border-0 table-fixed text-sm">
                                <thead>
                                    <tr>
                                        <th className="border border-black px-2 py-2 font-semibold text-center w-14 bg-gray-50">Sr.</th>
                                        <th className="border border-black px-2 py-2 font-semibold text-left bg-gray-50 w-[52%]">Parameters</th>
                                        <th className="border border-black px-2 py-2 font-semibold text-center bg-gray-50">Readings</th>
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
                                        { id: 9, label: 'H.V. Test on Secondary Winding', field: 'hvSecondary' },
                                        { id: 10, label: 'H.V. Test on Primary Winding', field: 'hvPrimary' },
                                        { id: 11, label: 'Induced Over Voltage Test', field: 'inducedOverVoltage' },
                                    ].map((row) => (
                                        <tr key={row.id}>
                                            <td className="border border-black px-2 py-1.5 text-center tabular-nums align-middle">{row.id}</td>
                                            <td className="border border-black px-2 py-1.5 text-left align-middle">{row.label}</td>
                                            <td className="border border-black p-0 align-middle pt-report-num">
                                                <Input
                                                    className="h-8 min-h-0 w-full px-2 py-1 text-sm pt-report-num"
                                                    value={reportData.finalTesting?.[row.field] || ''}
                                                    onChange={(e) => handleInputChange(transformer._id, 'finalTesting', row.field, e.target.value)}
                                                    disabled={isReadOnly}
                                                    readOnly={isReadOnly}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>

                        <section className="mb-5 print:mb-4 border border-black">
                            <div className="pt-report-section-title text-center py-2.5 bg-gray-100 border-b border-black">Accuracy Testing</div>
                            <table className="w-full border-collapse border-0 table-fixed text-sm text-center">
                                <thead>
                                    <tr>
                                        <th className="border border-black px-2 py-2 font-semibold align-middle bg-gray-50 w-[14%]" rowSpan={2}>Core</th>
                                        <th className="border border-black px-2 py-2 font-semibold align-middle bg-gray-50 w-[14%]" rowSpan={2}>% of primary current</th>
                                        <th className="border border-black px-2 py-2 font-semibold bg-gray-50" colSpan={2}>100% burden</th>
                                        <th className="border border-black px-2 py-2 font-semibold bg-gray-50" colSpan={2}>25% burden</th>
                                    </tr>
                                    <tr>
                                        <th className="border border-black px-1 py-1.5 font-medium leading-tight bg-gray-50">Ratio error<br />(%)</th>
                                        <th className="border border-black px-1 py-1.5 font-medium leading-tight bg-gray-50">Phase error<br />(min)</th>
                                        <th className="border border-black px-1 py-1.5 font-medium leading-tight bg-gray-50">Ratio error<br />(%)</th>
                                        <th className="border border-black px-1 py-1.5 font-medium leading-tight bg-gray-50">Phase error<br />(min)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeCores.flatMap((core) => {
                                        const isProtection = core.startsWith('protection');
                                        const percentages = isProtection ? ['100'] : ['120', '100', '80'];
                                        const label = isProtection ? 'Protection' : 'Metering';

                                        return percentages.map((perc, idx) => (
                                            <tr key={`${core}-${perc}`}>
                                                {idx === 0 && (
                                                    <td className="border border-black px-2 py-1.5 font-semibold align-middle bg-gray-100 uppercase text-left" rowSpan={percentages.length}>
                                                        {label}
                                                    </td>
                                                )}
                                                <td className="border border-black px-2 py-1.5 font-medium bg-gray-50 tabular-nums relative">
                                                    {perc}%
                                                </td>
                                                <td className="border border-black p-0 pt-report-num align-middle">
                                                    <Input
                                                        className={`h-8 min-h-0 w-full px-2 py-1 text-sm pt-report-num ${
                                                            (() => {
                                                                const accuracyClassLocal = order.accuracyClass || '0.2';
                                                                const rowData = reportData.accuracyTest?.[core]?.[perc] || {};
                                                                const v100 = isProtection
                                                                    ? validatePTProtectionUI('3P', rowData.ratioError100, rowData.phaseError100)
                                                                    : validatePTMeteringUI(accuracyClassLocal, rowData.ratioError100, rowData.phaseError100);
                                                                return (v100.isPass === false && v100.reason?.includes('Ratio')) ? 'text-red-700 font-bold' : 'text-blue-600';
                                                            })()
                                                        }`}
                                                        value={reportData.accuracyTest?.[core]?.[perc]?.ratioError100 || ''}
                                                        onChange={(e) => handleAccuracyChange(transformer._id, core, perc, 'ratioError100', e.target.value)}
                                                        disabled={isReadOnly}
                                                        readOnly={isReadOnly}
                                                    />
                                                </td>
                                                <td className="border border-black p-0 pt-report-num align-middle">
                                                    <Input
                                                        className={`h-8 min-h-0 w-full px-2 py-1 text-sm pt-report-num ${
                                                            (() => {
                                                                const accuracyClassLocal = order.accuracyClass || '0.2';
                                                                const rowData = reportData.accuracyTest?.[core]?.[perc] || {};
                                                                const v100 = isProtection
                                                                    ? validatePTProtectionUI('3P', rowData.ratioError100, rowData.phaseError100)
                                                                    : validatePTMeteringUI(accuracyClassLocal, rowData.ratioError100, rowData.phaseError100);
                                                                return (v100.isPass === false && v100.reason?.includes('Phase')) ? 'text-red-700 font-bold' : 'text-blue-600';
                                                            })()
                                                        }`}
                                                        value={reportData.accuracyTest?.[core]?.[perc]?.phaseError100 || ''}
                                                        onChange={(e) => handleAccuracyChange(transformer._id, core, perc, 'phaseError100', e.target.value)}
                                                        disabled={isReadOnly}
                                                        readOnly={isReadOnly}
                                                    />
                                                </td>
                                                <td className="border border-black p-0 pt-report-num align-middle">
                                                    <Input
                                                        className={`h-8 min-h-0 w-full px-2 py-1 text-sm pt-report-num ${
                                                            (() => {
                                                                const accuracyClassLocal = order.accuracyClass || '0.2';
                                                                const rowData = reportData.accuracyTest?.[core]?.[perc] || {};
                                                                const v25 = isProtection
                                                                    ? validatePTProtectionUI('3P', rowData.ratioError25, rowData.phaseError25)
                                                                    : validatePTMeteringUI(accuracyClassLocal, rowData.ratioError25, rowData.phaseError25);
                                                                return (v25.isPass === false && v25.reason?.includes('Ratio')) ? 'text-red-700 font-bold' : 'text-blue-600';
                                                            })()
                                                        }`}
                                                        value={reportData.accuracyTest?.[core]?.[perc]?.ratioError25 || ''}
                                                        onChange={(e) => handleAccuracyChange(transformer._id, core, perc, 'ratioError25', e.target.value)}
                                                        disabled={isReadOnly}
                                                        readOnly={isReadOnly}
                                                    />
                                                </td>
                                                <td className="border border-black p-0 pt-report-num align-middle">
                                                    <Input
                                                        className={`h-8 min-h-0 w-full px-2 py-1 text-sm pt-report-num ${
                                                            (() => {
                                                                const accuracyClassLocal = order.accuracyClass || '0.2';
                                                                const rowData = reportData.accuracyTest?.[core]?.[perc] || {};
                                                                const v25 = isProtection
                                                                    ? validatePTProtectionUI('3P', rowData.ratioError25, rowData.phaseError25)
                                                                    : validatePTMeteringUI(accuracyClassLocal, rowData.ratioError25, rowData.phaseError25);
                                                                return (v25.isPass === false && v25.reason?.includes('Phase')) ? 'text-red-700 font-bold' : 'text-blue-600';
                                                            })()
                                                        }`}
                                                        value={reportData.accuracyTest?.[core]?.[perc]?.phaseError25 || ''}
                                                        onChange={(e) => handleAccuracyChange(transformer._id, core, perc, 'phaseError25', e.target.value)}
                                                        disabled={isReadOnly}
                                                        readOnly={isReadOnly}
                                                    />
                                                </td>
                                            </tr>
                                        ));
                                    })}
                                </tbody>
                            </table>
                        </section>

                        <footer className="mt-6 print:mt-5 pt-4 print:pt-3 border-t-2 border-black flex flex-row justify-between items-end gap-6 text-sm">
                            <div className="pt-report-sig flex-1 min-w-0">
                                <div className="font-semibold mb-6 print:mb-5">Tested by</div>
                                <Input value={reportData.testedBy || user?.name || user?.fullName || ''} readOnly disabled={isReadOnly} className="w-full max-w-[240px] h-9 border-0 border-b border-black rounded-none bg-transparent px-0 text-sm" />
                            </div>
                            <div className="pt-report-sig pt-report-sig-right flex-1 min-w-0 text-right">
                                <div className="font-semibold mb-6 print:mb-5">Authorised signatory</div>
                                <Input
                                    value={reportData.signature}
                                    onChange={(e) => handleInputChange(transformer._id, '', 'signature', e.target.value)}
                                    className="w-full max-w-[240px] ml-auto h-9 border-0 border-b border-black rounded-none bg-transparent px-0 text-sm block"
                                    disabled={isReadOnly}
                                />
                            </div>
                        </footer>

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

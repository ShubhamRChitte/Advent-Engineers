import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Save, AlertCircle, ArrowLeft, AlertTriangle } from 'lucide-react';
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
  onBack: () => void;
  user: any; // The logged-in PT Tester user
}

export function PTTestingReport({ order, onBack, user }: PTTestingReportProps) {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>({});
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [invalidConfig, setInvalidConfig] = useState(false);

  // Failure Modal State
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [failureReason, setFailureReason] = useState("");
  const [failingCoresInfo, setFailingCoresInfo] = useState<any[]>([]);

  // Derive Transformer Data
  // Using index 0 since PTs are normally tested per job, or mapped 1:1 if needed.
  // Using index 0 since PTs are normally tested per job, or mapped 1:1 if needed.
  // We'll manage testing at the Order level for simplicity or fetch the specific transformer.
  const [transformerData, setTransformerData] = useState<any>(null);
  const [activeCores, setActiveCores] = useState<string[]>([]);
  
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

    if (countMetering === 1 && countProtection === 2) {
        // Valid Config B
    } else if (countMetering !== 1) {
        // If it's not exactly 1 metering (which both Config A and B require)
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
        // Assuming we fetch the first transformer for this order for now.
        // In a real flow, the order might expand into specific units.
        const response = await axios.get(`http://localhost:3002/api/transformers/order/${order._id}`, {
            withCredentials: true
        });

        if (Array.isArray(response.data) && response.data.length > 0) {
            const transformer = response.data[0];
            setTransformerData(transformer);

            // Fetch existing PT test data if any
            const testRes = await axios.get(`http://localhost:3002/api/pt-tests/${transformer._id}`, {
                withCredentials: true
            });

            if (testRes.data.success && testRes.data.data) {
                // If it's old flat structure, migrate it gently so UI doesn't crash
                let savedData = testRes.data.data;
                if (savedData.preTesting && !savedData.preTesting.metering) {
                    savedData.preTesting = {
                        metering: {
                            ratioError100: savedData.preTesting.ratioError100 || '',
                            phaseError100: savedData.preTesting.phaseError100 || '',
                            ratioError25: savedData.preTesting.ratioError25 || '',
                            phaseError25: savedData.preTesting.phaseError25 || ''
                        },
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
                setReportData(savedData);
                setIsReadOnly(order.status.includes('Completed') || transformer.currentStage !== 'pt');
            } else {
                // Initialize default empty structure matching the reference sequence
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

                setReportData({
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
                });
            }
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

  const handleInputChange = (section: string, field: string, value: string, subField?: string) => {
    if (isReadOnly) return;

    setReportData((prev: any) => {
        const newData = { ...prev };
        if (subField) {
            newData[section] = { ...newData[section] };
            newData[section][field] = { ...newData[section][field], [subField]: value };
        } else if (section) {
            newData[section] = { ...newData[section], [field]: value };
        } else {
            newData[field] = value;
        }
        return newData;
    });
  };

  const handleAccuracyChange = (core: string, percentage: string, field: string, value: string) => {
    if (isReadOnly) return;
    setReportData((prev: any) => {
        const newData = { ...prev };
        if (!newData.accuracyTest) newData.accuracyTest = {};
        if (!newData.accuracyTest[core]) newData.accuracyTest[core] = {};
        if (!newData.accuracyTest[core][percentage]) newData.accuracyTest[core][percentage] = {};
        
        newData.accuracyTest[core] = { ...newData.accuracyTest[core] };
        newData.accuracyTest[core][percentage] = { ...newData.accuracyTest[core][percentage], [field]: value };
        return newData;
    });
  };

  const handleSubmit = async () => {
    try {
        if (!transformerData) return;
        
        // Basic validation
        if (!reportData.signature) {
            toast.error("Please provide a signature before saving.");
            return;
        }

        const payload = {
            transformerId: transformerData._id,
            orderId: order._id,
            reportData: reportData
        };

        const response = await axios.post('http://localhost:3002/api/pt-tests/submit', payload, {
            withCredentials: true
        });

        if (response.data.success) {
            toast.success("PT Core test report submitted safely.");
            setIsReadOnly(true);
            setTimeout(() => onBack(), 1500);
        }
    } catch (err: any) {
        console.error("Submission error", err);
        toast.error(err.response?.data?.message || "Failed to submit test report");
    }
  };

  const handleLogFailure = async () => {
    if (!failureReason.trim()) {
        toast.error("Please provide a reason for the failure.");
        return;
    }

    try {
        // Collect failing cores info specifically for logging
        const payloads = failingCoresInfo.map(info => ({
            transformerId: transformerData._id,
            orderId: order._id,
            jobNumber: order.jobId,
            coreType: info.coreType,
            failureParameters: info.params,
            failureReason: failureReason,
            reportedBy: user?.name || user?.fullName || 'PT Tester'
        }));

        // Send each failure to the backend
        await Promise.all(payloads.map(payload => 
            axios.post('http://localhost:3002/api/pt-tests/failed', payload, {
                withCredentials: true
            })
        ));

        toast.success("Failed cores logged successfully.");
        setShowFailureModal(false);
        setFailureReason("");
        // Optionally navigate away or lock form
        setIsReadOnly(true);
    } catch (err: any) {
        console.error("Error logging failure:", err);
        toast.error(err.response?.data?.message || "Failed to log errors.");
    }
  };

  // derived state for UI rendering logic
  const accuracyClass = order.accuracyClass || '0.2';
  
  // Real-time validations
  const meteringVal100 = validatePTMeteringUI(accuracyClass, reportData.preTesting?.metering?.ratioError100, reportData.preTesting?.metering?.phaseError100);
  const meteringVal25 = validatePTMeteringUI(accuracyClass, reportData.preTesting?.metering?.ratioError25, reportData.preTesting?.metering?.phaseError25);
  
  const prot1Val100 = validatePTProtectionUI("3P", reportData.preTesting?.protection1?.ratioError100, reportData.preTesting?.protection1?.phaseError100);
  const prot1Val25 = validatePTProtectionUI("3P", reportData.preTesting?.protection1?.ratioError25, reportData.preTesting?.protection1?.phaseError25);
  
  const prot2Val100 = validatePTProtectionUI("3P", reportData.preTesting?.protection2?.ratioError100, reportData.preTesting?.protection2?.phaseError100);
  const prot2Val25 = validatePTProtectionUI("3P", reportData.preTesting?.protection2?.ratioError25, reportData.preTesting?.protection2?.phaseError25);

  // Dynamic accuracy validations base
  const accuracyValidations: any = {};
  let hasAccuracyFailures = false;

  activeCores.forEach(core => {
      const isProtection = core.startsWith('protection');
      const protClass = isProtection ? "3P" : ""; // Use standard configured class or 3P fallback for Protection
      
      accuracyValidations[core] = {};
      const percentages = isProtection ? ['100'] : ['120', '100', '80'];
      percentages.forEach(perc => {
          const rowData = reportData.accuracyTest?.[core]?.[perc] || {};
          const val100 = isProtection 
               ? validatePTProtectionUI(protClass, rowData.ratioError100, rowData.phaseError100)
               : validatePTMeteringUI(accuracyClass, rowData.ratioError100, rowData.phaseError100);
          const val25 = isProtection 
               ? validatePTProtectionUI(protClass, rowData.ratioError25, rowData.phaseError25)
               : validatePTMeteringUI(accuracyClass, rowData.ratioError25, rowData.phaseError25);
          
          accuracyValidations[core][perc] = { val100, val25 };
          
          if (val100.isPass === false || val25.isPass === false) {
              hasAccuracyFailures = true;
          }
      });
  });

  const hasAnyFailures = 
      meteringVal100.isPass === false || meteringVal25.isPass === false ||
      prot1Val100.isPass === false || prot1Val25.isPass === false ||
      prot2Val100.isPass === false || prot2Val25.isPass === false ||
      hasAccuracyFailures;

  // Build a summary of failures for the modal
  useEffect(() => {
    let failingCores: any[] = [];
    if (meteringVal100.isPass === false || meteringVal25.isPass === false) {
        failingCores.push({
            coreType: "PRE-TEST METERING",
            params: { reasons: [meteringVal100.reason, meteringVal25.reason].filter(Boolean) }
        });
    }

    if (prot1Val100.isPass === false || prot1Val25.isPass === false) {
        failingCores.push({
            coreType: "PRE-TEST PROTECTION 1",
            params: { reasons: [prot1Val100.reason, prot1Val25.reason].filter(Boolean) }
        });
    }

    if (prot2Val100.isPass === false || prot2Val25.isPass === false) {
        failingCores.push({
            coreType: "PRE-TEST PROTECTION 2",
            params: { reasons: [prot2Val100.reason, prot2Val25.reason].filter(Boolean) }
        });
    }

    // Dynamic accuracy failures compute
    activeCores.forEach(core => {
        const isProtection = core.startsWith('protection');
        const protClass = isProtection ? "3P" : "";
        const reasons: any[] = [];

        const percentages = isProtection ? ['100'] : ['120', '100', '80'];
        percentages.forEach(perc => {
            const rowData = reportData.accuracyTest?.[core]?.[perc] || {};
            const val100 = isProtection 
                 ? validatePTProtectionUI(protClass, rowData.ratioError100, rowData.phaseError100)
                 : validatePTMeteringUI(accuracyClass, rowData.ratioError100, rowData.phaseError100);
            const val25 = isProtection 
                 ? validatePTProtectionUI(protClass, rowData.ratioError25, rowData.phaseError25)
                 : validatePTMeteringUI(accuracyClass, rowData.ratioError25, rowData.phaseError25);
            
            if (val100.isPass === false) reasons.push(val100.reason);
            if (val25.isPass === false) reasons.push(val25.reason);
        });

        if (reasons.filter(Boolean).length > 0) {
            failingCores.push({
                coreType: `ACCURACY TEST - ${core.toUpperCase()}`,
                params: { reasons: reasons.filter(Boolean) }
            });
        }
    });

    setFailingCoresInfo(failingCores);
  }, [hasAnyFailures, reportData, activeCores, accuracyClass]);

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

  if (loading || !transformerData) {
      return <div className="p-8 text-center text-gray-500">Loading PT testing layout...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
            <Button onClick={onBack} variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Assigned Orders
            </Button>
            <div className="flex items-center gap-3">
                {isReadOnly && <Badge className="bg-green-100 text-green-700">Completed</Badge>}
                {!isReadOnly && hasAnyFailures && (
                    <Button 
                        onClick={() => setShowFailureModal(true)} 
                        variant="destructive" 
                        className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md"
                    >
                        <AlertTriangle className="w-4 h-4" /> Add to Failed Transformers
                    </Button>
                )}
                <Button 
                    onClick={handleSubmit} 
                    disabled={isReadOnly}
                    className="bg-[#003a70] hover:bg-[#002850] gap-2"
                >
                    <Save className="w-4 h-4" />
                    Save Report
                </Button>
            </div>
        </div>

        {/* PRINTABLE REPORT FORMAT */}
        <div className="bg-white p-8 rounded-lg border border-gray-300 shadow-sm max-w-[800px] mx-auto text-sm">
            
            {/* Header Title */}
            <div className="text-center mb-6 border-b-2 border-black pb-2">
                <h1 className="text-2xl font-bold text-[#003a70] mb-1 tracking-wider uppercase">ADVENT ENGINEERS</h1>
                <h2 className="text-xl font-bold uppercase">Testing Record of Potential Transformer</h2>
            </div>

            {/* Section 1: Header Details */}
            <div className="border border-black mb-4 flex divide-x divide-black">
                <div className="flex-1 p-2 font-bold bg-gray-50 flex items-center">
                    SERIAL NO. : <span className="ml-2 py-0 h-6 font-normal w-32 border-b border-gray-400">{transformerData.uniqueId || 'N/A'}</span>
                </div>
                <div className="p-2 w-48 font-bold bg-gray-50 flex items-center justify-end">
                    Date: <Input value={reportData.date} onChange={(e) => handleInputChange('', 'date', e.target.value)} className="ml-2 w-32 h-6 border-black text-sm p-1 rounded-sm shadow-none" disabled={isReadOnly} />
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
                                    <td className="border border-black p-0.5"><Input className={`h-7 border-none shadow-none text-center bg-transparent ${v100.isPass === false && v100.reason?.includes('Ratio') ? 'text-red-700 font-bold' : 'text-blue-600'}`} value={reportData.preTesting?.[core]?.ratioError100 || ''} onChange={(e) => handleInputChange('preTesting', core, e.target.value, 'ratioError100')} disabled={isReadOnly} /></td>
                                    <td className="border border-black p-0.5"><Input className={`h-7 border-none shadow-none text-center bg-transparent ${v100.isPass === false && v100.reason?.includes('Phase') ? 'text-red-700 font-bold' : 'text-blue-600'}`} value={reportData.preTesting?.[core]?.phaseError100 || ''} onChange={(e) => handleInputChange('preTesting', core, e.target.value, 'phaseError100')} disabled={isReadOnly} /></td>
                                    <td className="border border-black p-0.5"><Input className={`h-7 border-none shadow-none text-center bg-transparent ${v25.isPass === false && v25.reason?.includes('Ratio') ? 'text-red-700 font-bold' : 'text-blue-600'}`} value={reportData.preTesting?.[core]?.ratioError25 || ''} onChange={(e) => handleInputChange('preTesting', core, e.target.value, 'ratioError25')} disabled={isReadOnly} /></td>
                                    <td className="border border-black p-0.5"><Input className={`h-7 border-none shadow-none text-center bg-transparent ${v25.isPass === false && v25.reason?.includes('Phase') ? 'text-red-700 font-bold' : 'text-blue-600'}`} value={reportData.preTesting?.[core]?.phaseError25 || ''} onChange={(e) => handleInputChange('preTesting', core, e.target.value, 'phaseError25')} disabled={isReadOnly} /></td>
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
                                        onChange={(e) => handleInputChange('finalTesting', row.field, e.target.value)} 
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
                                        <td className="border border-black p-0"><Input className={`h-7 border-none shadow-none text-center bg-transparent ${val100.isPass === false && val100.reason?.includes('Ratio') ? 'text-red-700 font-bold' : 'text-blue-600'}`} value={reportData.accuracyTest?.[core]?.[perc]?.ratioError100 || ''} onChange={(e) => handleAccuracyChange(core, perc, 'ratioError100', e.target.value)} disabled={isReadOnly} /></td>
                                        <td className="border border-black p-0"><Input className={`h-7 border-none shadow-none text-center bg-transparent ${val100.isPass === false && val100.reason?.includes('Phase') ? 'text-red-700 font-bold' : 'text-blue-600'}`} value={reportData.accuracyTest?.[core]?.[perc]?.phaseError100 || ''} onChange={(e) => handleAccuracyChange(core, perc, 'phaseError100', e.target.value)} disabled={isReadOnly} /></td>
                                        <td className="border border-black p-0"><Input className={`h-7 border-none shadow-none text-center bg-transparent ${val25.isPass === false && val25.reason?.includes('Ratio') ? 'text-red-700 font-bold' : 'text-blue-600'}`} value={reportData.accuracyTest?.[core]?.[perc]?.ratioError25 || ''} onChange={(e) => handleAccuracyChange(core, perc, 'ratioError25', e.target.value)} disabled={isReadOnly} /></td>
                                        <td className="border border-black p-0"><Input className={`h-7 border-none shadow-none text-center bg-transparent ${val25.isPass === false && val25.reason?.includes('Phase') ? 'text-red-700 font-bold' : 'text-blue-600'}`} value={reportData.accuracyTest?.[core]?.[perc]?.phaseError25 || ''} onChange={(e) => handleAccuracyChange(core, perc, 'phaseError25', e.target.value)} disabled={isReadOnly} /></td>
                                    </tr>
                                );
                            });
                        })}
                    </tbody>
                </table>
                
                <div className="flex justify-between items-center p-2 text-sm border-t border-black bg-gray-100">
                    <div className="flex items-center">
                        <span className="font-bold mr-2 ml-2">Tested By:</span>
                        <Input value={reportData.testedBy || user?.name || user?.fullName || ''} className="w-48 h-7 text-blue-600 italic font-medium bg-transparent border-t-0 border-l-0 border-r-0 border-b border-gray-400 rounded-none px-1" readOnly disabled={isReadOnly} />
                    </div>
                    <div className="flex items-center mr-2">
                        <span className="font-bold mr-2">Signature:</span>
                        <Input 
                            value={reportData.signature} 
                            onChange={(e) => handleInputChange('', 'signature', e.target.value)} 
                            className="w-32 h-7 text-blue-600 italic font-medium bg-transparent border-t-0 border-l-0 border-r-0 border-b border-gray-400 rounded-none px-1" 
                            disabled={isReadOnly} 
                            placeholder="Type signature"
                        />
                    </div>
                </div>
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
    </div>
  );
}

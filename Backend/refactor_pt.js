const fs = require('fs');

const path = 'd:\\advent\\05-03\\Advent-Engineers\\Admin Panel Design latest\\src\\components\\tester\\PTTestingReport.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Rename reportData & transformerData
content = content.replace('const [reportData, setReportData] = useState<any>({});', 'const [reportsData, setReportsData] = useState<Record<string, any>>({});');
content = content.replace('const [transformerData, setTransformerData] = useState<any>(null);', 'const [transformersData, setTransformersData] = useState<any[]>([]);');

// 2. Modify fetchTransformerData
content = content.replace(
`        if (Array.isArray(response.data) && response.data.length > 0) {
            const transformer = response.data[0];
            setTransformerData(transformer);

            // Fetch existing PT test data if any
            const testRes = await axios.get(\`http://localhost:3002/api/pt-tests/\${transformer._id}\`, {
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
        }`, `        if (Array.isArray(response.data) && response.data.length > 0) {
            setTransformersData(response.data);
            let newReportsData: Record<string, any> = {};
            let anyReadOnly = false;

            for (const transformer of response.data) {
                const testRes = await axios.get(\`http://localhost:3002/api/pt-tests/\${transformer._id}\`, {
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
                                  migratedAcc[core] = { '100': { ratioError100: '', phaseError100: '', ratioError25: '', phaseError25: '' } };
                             }
                         });
                         savedData.accuracyTest = migratedAcc;
                    }

                    if (!isReadOnly && !savedData.testedBy) {
                        savedData.testedBy = user?.name || user?.fullName || 'Tester';
                    }
                    newReportsData[transformer._id] = savedData;
                    if (order.status.includes('Completed') || transformer.currentStage !== 'pt') {
                         anyReadOnly = true;
                    }
                } else {
                    let defaultAccuracy: any = {};
                    coresList.forEach(core => {
                        const isProtection = core.startsWith('protection');
                        if (isProtection) {
                            defaultAccuracy[core] = { '100': { ratioError100: '', phaseError100: '', ratioError25: '', phaseError25: '' } };
                        } else {
                            defaultAccuracy[core] = {
                                '120': { ratioError100: '', phaseError100: '', ratioError25: '', phaseError25: '' },
                                '100': { ratioError100: '', phaseError100: '', ratioError25: '', phaseError25: '' },
                                '80': { ratioError100: '', phaseError100: '', ratioError25: '', phaseError25: '' },
                            };
                        }
                    });

                    newReportsData[transformer._id] = {
                        preTesting: {
                            metering: { ratioError100: '', phaseError100: '', ratioError25: '', phaseError25: '' },
                            protection1: { ratioError100: '', phaseError100: '', ratioError25: '', phaseError25: '' },
                            protection2: { ratioError100: '', phaseError100: '', ratioError25: '', phaseError25: '' }
                        },
                        finalTesting: {
                            leakage: '', terminalMarking: 'OK', polarityTesting: 'OK', insulationResistance: 'OK',
                            primaryToSecondary: '10 GΩ', primaryToEarth: '10 GΩ', secondaryToEarth: '10 GΩ',
                            hvSecondary: 'OK', hvPrimary: 'OK', inducedOverVoltage: 'OK'
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
        }`);

// 3. Handlers
content = content.replace(
`  const handleInputChange = (section: string, field: string, value: string, subField?: string) => {
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
  };`, 
`  const handleInputChange = (tId: string, section: string, field: string, value: string, subField?: string) => {
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
  };`);

content = content.replace(
`  const handleAccuracyChange = (core: string, percentage: string, field: string, value: string) => {
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
  };`,
`  const handleAccuracyChange = (tId: string, core: string, percentage: string, field: string, value: string) => {
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
  };`);

// 4. handleSubmit
content = content.replace(
`  const handleSubmit = async () => {
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
  };`,
`  const handleSubmit = async () => {
    try {
        if (transformersData.length === 0) return;
        
        const payloads = transformersData.map(t => {
            const rData = reportsData[t._id] || {};
            // If signature is empty we can skip or block, let's block if ANY lacks signature
            return {
                transformerId: t._id,
                orderId: order._id,
                reportData: rData
            };
        });

        const missingSigs = payloads.filter(p => !p.reportData.signature);
        if (missingSigs.length > 0) {
            toast.error(\`Please provide a signature for all (\${missingSigs.length}) reports before saving.\`);
            return;
        }

        const responses = await Promise.all(payloads.map(payload => 
            axios.post('http://localhost:3002/api/pt-tests/submit', payload, { withCredentials: true })
        ));

        if (responses.every(r => r.data.success)) {
            toast.success(\`Successfully submitted \${payloads.length} PT core test reports.\`);
            setIsReadOnly(true);
            setTimeout(() => onBack(), 1500);
        }
    } catch (err: any) {
        console.error("Submission error", err);
        toast.error(err.response?.data?.message || "Failed to submit test reports");
    }
  };`);

// 5. handleLogFailure
content = content.replace(
`            transformerId: transformerData._id,
            orderId: order._id,
            jobNumber: order.jobId,
            coreType: info.coreType,
            failureParameters: info.params,`,
`            transformerId: info.transformerId,
            orderId: order._id,
            jobNumber: order.jobId,
            coreType: info.coreType,
            failureParameters: info.params,`);

// 6. Validation variables move into internal functions
// Find everything from `const accuracyClass = order.accuracyClass` down to `setFailingCoresInfo(failingCores); }, [...])`
const validationStart = content.indexOf(`  // derived state for UI rendering logic\n  const accuracyClass = order.accuracyClass`);
const validationEndStr = `  }, [hasAnyFailures, reportData, activeCores, accuracyClass]);`;
const validationEnd = content.indexOf(validationEndStr) + validationEndStr.length;

const validationsBlockRaw = content.substring(validationStart, validationEnd);

// Replace it with an effect that tracks global failures
content = content.substr(0, validationStart) + `
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
          if (reasons.filter(Boolean).length > 0) failsLog.push({ coreType: \`ACCURACY TEST - \${core.toUpperCase()}\`, params: { reasons: reasons.filter(Boolean) }, transformerId });
      });

      return { metVal100, metVal25, pr1Val100, pr1Val25, pr2Val100, pr2Val25, accValidations, hasFail, failsLog };
  };

  const [hasAnyFailures, setHasAnyFailures] = useState(false);
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
  }, [reportsData, transformersData, activeCores]);

` + content.substr(validationEnd);

// 7. Fix `if (loading || !transformerData)` -> `if (loading || transformersData.length === 0)`
content = content.replace('if (loading || !transformerData) {', 'if (loading || transformersData.length === 0) {');

// 8. Fix CSS
const oldCss = `            #print-section, #print-section * {
              visibility: visible;
            }
            #print-section {
              position: absolute;
              left: 0;
              top: 0;
              width: 190mm;
            }`;
            
const newCss = `            .print-container, .print-container * {
              visibility: visible;
            }
            .print-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .print-page {
              width: 190mm;
              margin: 0 auto;
              page-break-after: always;
            }
            .print-page:last-child {
              page-break-after: auto;
            }`;
content = content.replace(oldCss, newCss);

// 9. Wrap the PRINTABLE REPORT FORMAT
const reportFormatStart = content.indexOf(`{/* PRINTABLE REPORT FORMAT */}`);
const templateBody = content.substring(reportFormatStart + 31, content.indexOf(`{/* Failure Modal */}`));

let newTemplateBody = `
        {/* PRINTABLE REPORT FORMAT */}
        <div className="print-container">
            {transformersData.map((transformerData, mapIdx) => {
                const reportData = reportsData[transformerData._id] || {};
                const vState = getTransformerValidations(transformerData._id, reportData);
                const { metVal100: meteringVal100, metVal25: meteringVal25, pr1Val100: prot1Val100, pr1Val25: prot1Val25, pr2Val100: prot2Val100, pr2Val25: prot2Val25, accValidations: accuracyValidations } = vState;

                return (
                    <div key={transformerData._id} className="print-page bg-white p-8 rounded-lg border border-gray-300 shadow-sm max-w-[800px] mx-auto text-sm mb-12 relative print:mb-0 print:border-none print:shadow-none">
                        <div className="absolute -top-4 -left-4 bg-slate-800 text-white px-3 py-1 rounded text-xs font-bold no-print">Unit {mapIdx + 1}</div>
                        ` + templateBody.replace(/<div id="print-section"[^>]*>/, '').replace(/handleInputChange\('preTesting'/g, "handleInputChange(transformerData._id, 'preTesting'").replace(/handleInputChange\('finalTesting'/g, "handleInputChange(transformerData._id, 'finalTesting'").replace(/handleInputChange\(''/g, "handleInputChange(transformerData._id, ''").replace(/handleAccuracyChange\(/g, "handleAccuracyChange(transformerData._id, ").trim() + `
            })}
        </div>
`;

// wait, the last </div> of templateBody belongs to #print-section. Let's fix that.
// The templateBody ends with `</div>\n            \n        </div>\n\n        `
// Let's accurately substitute:
const fullReportDivMatch = content.match(/\{\/\* PRINTABLE REPORT FORMAT \*\/\}\n\s*<div id="print-section"[^>]*>([\s\S]*?)<\/div>\n\s*<\/div>/);
if (fullReportDivMatch) {
    let innerHTML = fullReportDivMatch[1];
    innerHTML = innerHTML.replace(/handleInputChange\('([^']+)'/g, "handleInputChange(transformerData._id, '$1'");
    innerHTML = innerHTML.replace(/handleAccuracyChange\((core|'[^']+')/g, "handleAccuracyChange(transformerData._id, $1");

    let mappedBlock = `
        {/* PRINTABLE REPORT FORMAT MULTI UNITS */}
        <div className="print-container">
            {transformersData.map((transformerData, mapIdx) => {
                const reportData = reportsData[transformerData._id] || {};
                const vState = getTransformerValidations(transformerData._id, reportData);
                const { metVal100: meteringVal100, metVal25: meteringVal25, pr1Val100: prot1Val100, pr1Val25: prot1Val25, pr2Val100: prot2Val100, pr2Val25: prot2Val25, accValidations: accuracyValidations } = vState;

                return (
                    <div key={transformerData._id} className="print-page bg-white p-8 rounded-lg border border-gray-300 shadow-sm max-w-[800px] mx-auto text-sm mb-12 relative print:mb-0 print:border-none print:shadow-none">
                        <div className="absolute -top-4 -left-4 bg-slate-800 text-white px-3 py-1 rounded text-xs font-bold no-print shadow-md border border-slate-600">Unit {mapIdx + 1} : {transformerData.uniqueId || 'N/A'}</div>
                        ` + innerHTML + `
                    </div>
                );
            })}
        </div>`;
    content = content.replace(fullReportDivMatch[0], mappedBlock);
} else {
    console.error("NO MATCH FOUND FOR PRINTABLE REPORT FORMAT");
}

fs.writeFileSync(path, content, 'utf8');
console.log('Update Complete!');

import axios from "axios";
import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '../ui/button';

import { Printer, ArrowLeft, Save, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Transformer } from './SecondaryTransformersList';
import { toast } from 'sonner';

import { 
  ReportHeader, 
  ReportSectionTitle, 
  CoreInformationBar,
  ReportSignatures,
  formatReportDate,
  secondaryReportPrintStyles,
  ReportSpecBox,
} from './SecondaryReportPrintLayout';


interface SecondaryMeteringReportProps {
  transformer: Transformer;
  coreNumber?: number;
  coreId: string;
  testerName: string;
  onBack: () => void;
  readOnly?: boolean;
  stage?: 'secondary' | 'primary' | 'final';
  accuracyClass?: string | undefined;
  primaryCurrent?: string;
  secondaryCurrent?: string;
  order?: any;
  onRefresh?: () => void;
  onFail?: () => void;
  onCompleteTimer?: () => Promise<void>;
  sourceStage?: 'secondary' | 'primary' | 'final';
  isFailedSection?: boolean;
  failedTransformerId?: string;
  failedStatus?: string;
  isFailedCore?: boolean;
  retestHistory?: any[];
  isUnified?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
}

export function SecondaryMeteringReport({
  transformer,
  coreNumber,
  coreId,
  testerName,
  onBack,
  readOnly = false,
  stage = 'secondary',
  accuracyClass: explicitClass,
  primaryCurrent: manualPrimary,
  secondaryCurrent: manualSecondary,
  order: propOrder,
  onRefresh,
  onFail,
  onCompleteTimer,
  sourceStage,
  isFailedSection = false,
  failedTransformerId,
  failedStatus,
  isFailedCore,
  retestHistory,
  isUnified = false,
  onNext,
  onPrev
}: SecondaryMeteringReportProps) {
  const coreIndex = (coreNumber && coreNumber > 0) ? (coreNumber - 1) :
    (!isNaN(parseInt(coreId.replace(/[^0-9]/g, ''))) ? parseInt(coreId.replace(/[^0-9]/g, '')) - 1 : 0);

  const hasBeenRetested = !!(retestHistory?.some((h: any) =>
    Array.isArray(h.newTreatmentReadings) && h.newTreatmentReadings.some((r: any) =>
      r.internalCoreNo === coreId || r.coreId === coreId
    )
  ));

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Advent_Engineers_Test_Report_${transformer.uniqueId}`,
  });

  const [dbLimits, setDbLimits] = useState<any[]>([]);

  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const response = await axios.get(`/accuracy-limits/metering`, { withCredentials: true });
        setDbLimits(response.data);
      } catch (error) {
        console.error('Failed to fetch dynamic metering limits', error);
      }
    };
    fetchLimits();
  }, []);

  const dynamicRatios: string[] = (() => {
    // 1. Determine core index from prop or ID
    const order = propOrder || transformer.fullOrder || transformer.orderId;
    const orderCores = order?.coreDetails || [];
    const coreFromOrder = orderCores[coreIndex];

    // Priority: Manual Prop -> Core Specific -> Order Level -> Fallback
    const secCurr = manualSecondary || 
      coreFromOrder?.secondaryCurrent ||
      order?.ratedSecondaryCurrent ||
      '1';

    // Extract and split primary currents
    // Priority: Manual Prop -> Order PrimaryCurrents -> Order Ratio -> Fallback
    const rawPrimaryCurrs = manualPrimary ? [manualPrimary] :
      ((order?.primaryCurrents && order.primaryCurrents.length > 0) ? order.primaryCurrents :
      (Array.isArray(order?.ratio) ? order.ratio.map((r: string) => String(r).split('/')[0]) : ['200']));

    let primaryCurrs = rawPrimaryCurrs.flatMap((pc: string) =>
      String(pc).replace(/[\[\]"']/g, '').split(/[- ,]+/).filter(v => v.trim() !== '')
    );
    primaryCurrs = [...new Set(primaryCurrs)];

    return primaryCurrs.map((p: string) => `${p}/${secCurr}`);
  })();

  const [accuracyClass] = useState<string>(() => {
    if (explicitClass) return extractAccuracyClass(explicitClass);
    const order = propOrder || transformer.fullOrder || transformer.orderId;
    const orderCores = order?.coreDetails || [];
    const coreFromOrder = orderCores[coreIndex];

    return extractAccuracyClass(
      coreFromOrder?.accuracyClass ||
      transformer.accuracyClass ||
      '0.5'
    );
  });

  const displayBurden = (() => {
    const order = propOrder || transformer.fullOrder || transformer.orderId;
    let rawBurden = order?.burden;
    if (Array.isArray(rawBurden)) {
      rawBurden = rawBurden[Math.min(coreIndex, rawBurden.length - 1)];
    }
    const val = rawBurden || transformer.burden;
    if (!val) return 'N/A';
    return String(val).replace(/VA/i, '').trim();
  })();

  const displaySTC = (() => {
    const order = propOrder || transformer.fullOrder || transformer.orderId;
    return order?.stc || order?.STC || transformer.stc || 'N/A';
  })();

  const [testResults, setTestResults] = useState<{ ratioValue: string; rows: any[] }[]>(() => {
    const initial = dynamicRatios.map(ratio => ({
      ratioValue: ratio,
      rows: getInitialData(accuracyClass)
    }));

    let myResults = [];

    const shouldLoadFromTreated = isFailedSection && failedStatus === 'TREATED' && (isFailedCore || hasBeenRetested);
    if (shouldLoadFromTreated) {
      const secHistory = transformer.testHistory?.secondary_test;
      if (secHistory?.metering_results?.length > 0) {
        myResults = secHistory.metering_results.filter((res: any) => res.internalCoreNo === coreId);
        if (myResults.length === 0 && secHistory.meteringCoreId === coreId) {
          myResults = secHistory.metering_results;
        }
      }
    }

    if (myResults.length === 0) {
      const stageHistory = transformer.testHistory?.[`${stage}_test` as keyof typeof transformer.testHistory] as any;
      if (stageHistory?.metering_results?.length > 0) {
        myResults = stageHistory.metering_results.filter((res: any) => res.internalCoreNo === coreId);
        if (myResults.length === 0 && transformer.testHistory?.secondary_test?.meteringCoreId === coreId) {
          myResults = stageHistory.metering_results;
        }
      }
    }

    if (myResults.length === 0 && sourceStage && sourceStage !== stage) {
      const sourceHistory = transformer.testHistory?.[`${sourceStage}_test` as keyof typeof transformer.testHistory] as any;
      if (sourceHistory?.metering_results?.length > 0) {
        myResults = sourceHistory.metering_results.filter((res: any) => res.internalCoreNo === coreId);
        if (myResults.length === 0 && transformer.testHistory?.secondary_test?.meteringCoreId === coreId) {
          myResults = sourceHistory.metering_results;
        }
      }
    }

    if (myResults.length > 0) {
      return initial.map((item, idx) => {
        let matched = myResults.find((r: any) => r.ratioValue === item.ratioValue);
        if (!matched && myResults[idx]) {
          matched = myResults[idx];
        }
        return matched ? { ...item, rows: matched.rows } : item;
      });
    }
    return initial;
  });

  const [approvedCores, setApprovedCores] = useState<string[]>([]);
  const [secondaryTestedCores, setSecondaryTestedCores] = useState<string[]>([]);
  const [selectedCoreId, setSelectedCoreId] = useState<string>(coreId);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [selectSearch, setSelectSearch] = useState('');

  useEffect(() => {
    const fetchApprovedCores = async () => {
      const order = transformer.fullOrder || transformer.orderId;
      const orderId = order?._id || order;
      if (!orderId || readOnly) return;
      try {
        const [appRes, secRes] = await Promise.all([
          axios.get(`/core-tests/approved-ids/${orderId}`, { withCredentials: true }),
          axios.get(`/secondary-core-tests/ready-stock/${orderId}`, { withCredentials: true })
        ]);
        if (appRes.data?.success) {
          setApprovedCores(appRes.data.metering || []);
        }
        if (secRes.data?.success) {
          const testedIds = (secRes.data.metering || []).map((c: any) => c.coreId);
          setSecondaryTestedCores(testedIds);
        }
      } catch (err) {
        console.error("Failed to fetch approved core IDs", err);
      }
    };
    fetchApprovedCores();
  }, [transformer.orderId, transformer.fullOrder, readOnly]);

  useEffect(() => {
    setSelectedCoreId(coreId);
  }, [coreId]);

  useEffect(() => {
    const fetchLatestData = async () => {
      try {
        const initialBlankData = dynamicRatios.map(ratio => ({
          ratioValue: ratio,
          rows: getInitialData(accuracyClass)
        }));

        let freshTransformer = transformer;
        if (transformer.isDummy) {
          const res = await axios.get(`/secondary-core-tests/metering/${selectedCoreId}`, { withCredentials: true });
          if (res.data?.success && res.data.data) {
            const testDoc = res.data.data;
            if (testDoc.metering_results && testDoc.metering_results.length > 0) {
              setTestResults(prev => prev.map((item, idx) => {
                let matched = testDoc.metering_results.find((r: any) => r.ratioValue === item.ratioValue);
                if (!matched && testDoc.metering_results[idx]) {
                  matched = testDoc.metering_results[idx];
                }
                return matched ? { ...item, rows: matched.rows } : item;
              }));
              return;
            }
          }
          setTestResults(initialBlankData);
          return;
        }

        const res = await axios.get(`/transformers/${transformer.uniqueId}`, { withCredentials: true });
        freshTransformer = res.data.data || res.data;
        let myResults = [];

        let currentFailedStatus = failedStatus;
        let currentRetestHistory = retestHistory;

        if (isFailedSection && failedTransformerId) {
          try {
            const failRes = await axios.get(`/failed-transformers/${failedTransformerId}`, { withCredentials: true });
            if (failRes.data?.success && failRes.data?.data) {
              currentFailedStatus = failRes.data.data.status;
              currentRetestHistory = failRes.data.data.retestHistory;
            }
          } catch (e) {
            console.error("Failed to fetch latest failed record", e);
          }
        }

        const currentHasBeenRetested = currentRetestHistory && currentRetestHistory.length > 0;
        const shouldLoadFromTreated = isFailedSection && currentFailedStatus === 'TREATED' && (isFailedCore || currentHasBeenRetested);
        
        if (shouldLoadFromTreated) {
          const secHistory = freshTransformer.testHistory?.secondary_test;
          if (secHistory?.metering_results?.length > 0) {
            myResults = secHistory.metering_results.filter((res: any) => res.internalCoreNo === selectedCoreId);
            if (myResults.length === 0 && secHistory.meteringCoreId === selectedCoreId) {
              myResults = secHistory.metering_results;
            }
          }
        }

        if (myResults.length === 0) {
          const stageHistory = freshTransformer?.testHistory?.[`${stage}_test`] as any;
          if (stageHistory?.metering_results?.length > 0) {
            myResults = stageHistory.metering_results.filter((res: any) => res.internalCoreNo === selectedCoreId);
            if (myResults.length === 0 && freshTransformer.testHistory?.secondary_test?.meteringCoreId === selectedCoreId) {
              myResults = stageHistory.metering_results;
            }
          }
        }

        if (myResults.length === 0 && sourceStage && sourceStage !== stage) {
          const sourceHistory = freshTransformer?.testHistory?.[`${sourceStage}_test`] as any;
          if (sourceHistory?.metering_results?.length > 0) {
            myResults = sourceHistory.metering_results.filter((res: any) => res.internalCoreNo === selectedCoreId);
            if (myResults.length === 0 && freshTransformer.testHistory?.secondary_test?.meteringCoreId === selectedCoreId) {
              myResults = sourceHistory.metering_results;
            }
          }
        }

        if (myResults.length > 0) {
            setTestResults(prev => prev.map((item, idx) => {
              let matched = myResults.find((r: any) => r.ratioValue === item.ratioValue);
              if (!matched && myResults[idx]) {
                matched = myResults[idx];
              }
              return matched ? { ...item, rows: matched.rows } : item;
            }));
        } else {
          setTestResults(initialBlankData);
        }
      } catch (err) {
        console.error("Failed to load existing metering data", err);
      }
    };
    fetchLatestData();
  }, [transformer.uniqueId, selectedCoreId, stage, failedStatus, isFailedCore, retestHistory]);

  const handleDataChange = (ratioIdx: number, rowIndex: number, field: string, value: string) => {
    if (readOnly) return;
    setTestResults(prev => {
      const updated = [...prev];
      const ratioBlock = { ...updated[ratioIdx] } as { ratioValue: string; rows: any[] };
      const updatedRows = [...(ratioBlock.rows || [])];
      const updatedRow = { ...updatedRows[rowIndex], [field]: value };

      const v100 = validateMeteringUI(accuracyClass, updatedRow.current, updatedRow.r100, updatedRow.p100, dbLimits);
      updatedRow.r100_r_pass = v100.rPass;
      updatedRow.r100_p_pass = v100.pPass;
      updatedRow.r100_reason = v100.reason;
      delete updatedRow.r100_pass;
      delete updatedRow.p100_pass;

      const v25 = validateMeteringUI(accuracyClass, updatedRow.current, updatedRow.r25, updatedRow.p25, dbLimits);
      updatedRow.r25_r_pass = v25.rPass;
      updatedRow.r25_p_pass = v25.pPass;
      updatedRow.r25_reason = v25.reason;
      delete updatedRow.r25_pass;
      delete updatedRow.p25_pass;

      updatedRows[rowIndex] = updatedRow;
      ratioBlock.rows = updatedRows;
      updated[ratioIdx] = ratioBlock;
      return updated;
    });
  };

  const handleDatabaseSave = async () => {
    if (readOnly) return;
    try {
      const payload = {
        uniqueId: transformer.uniqueId,
        orderId: typeof transformer.orderId === 'object' && transformer.orderId ? (transformer.orderId as any)._id : transformer.orderId,
        loginType: `${stage}_login`,
        tester: testerName,
        coreId: selectedCoreId,
        metering_results: testResults.map(item => ({
          ratioValue: item.ratioValue,
          rows: item.rows,
          internalCoreNo: selectedCoreId,
          coreId: selectedCoreId,
          accuracyClass: accuracyClass
        }))
      };

      
      if (isFailedSection && failedTransformerId) {
        // Save to retest-save endpoint
        await axios.put(`/failed-transformers/${failedTransformerId}/retest-save`, {
            treatedReadings: payload.metering_results,
            treatedBy: testerName,
            remarks: "Treated After Primary Failure via Metering Report",
            coreType: 'metering'
        }, { withCredentials: true });
      } else {
        await axios.post(`/transformer-${stage}-metering-tests`, payload, { withCredentials: true });
      }

      if (onCompleteTimer) await onCompleteTimer();
      toast.success("Data saved successfully!");
      setSecondaryTestedCores(prev => [...new Set([...prev, selectedCoreId])]);
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error("Failed to save data.");
    }
  };

  const handleMarkAsFailed = async () => {
    if (readOnly) return;
    try {
      const allReasons: string[] = [];
      testResults.forEach(item => {
        item.rows.forEach(row => {
          if (row.r100_r_pass === false || row.r100_p_pass === false) {
            allReasons.push(`${item.ratioValue} (${row.current}) 100% Burden: ${row.r100_reason || 'Limits Exceeded'}`);
          }
          if (row.r25_r_pass === false || row.r25_p_pass === false) {
            allReasons.push(`${item.ratioValue} (${row.current}) 25% Burden: ${row.r25_reason || 'Limits Exceeded'}`);
          }
        });
      });

      const orderObj = propOrder || transformer.fullOrder || transformer.orderId;

      const payload = {
        transformerId: transformer.id || transformer._id,
        transformerUniqueId: transformer.uniqueId,
        orderId: transformer.orderId?._id || transformer.orderId || orderObj?._id || orderObj?.id,
        jobNumber: transformer.jobId || orderObj?.jobId || '',
        clientName: transformer.clientName || orderObj?.clientName || '',
        coreType: "Metering",
        testType: stage === 'primary' ? "After Primary Metering" : stage === 'final' ? "Final Metering" : "Secondary Metering",
        failureParameters: { failureStage: `${stage}_metering_test`, dynamicValues: testResults, coreId: selectedCoreId },
        failureReason: allReasons.length > 0 ? [...new Set(allReasons)].join(' | ') : "Accuracy Limits Exceeded",
        reportedBy: testerName,
        stage: stage === 'primary' ? "PRIMARY_TESTING" : stage === 'final' ? "FINAL_TESTING" : "SECONDARY_TESTING",
        status: "FAILED"
      };

      // Persist the entered test values to the transformer's history first
      await handleDatabaseSave();

      const response = await axios.post(`/failed-transformers`, payload, { withCredentials: true });
      if (response.data.success) {
        toast.success(response.data.message || "Transformer marked as failed successfully.");
        if (onRefresh) onRefresh();
        if (onFail) onFail(); else onBack();
      } else {
        toast.error("Failed to add to failed transformers.");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error adding to failed transformers");
    }
  };

  const hasAnyFailures = testResults.some(item => item.rows.some(row => 
    row.r100_r_pass === false || row.r100_p_pass === false || 
    row.r25_r_pass === false || row.r25_p_pass === false
  ));

  if (isUnified) {
    return (
      <div className="ae-section-container print:break-inside-avoid print:mt-6" style={{ pageBreakInside: 'avoid', marginTop: 24 }}>
        <ReportSectionTitle title={`${transformer.voltageRating || '33'} KV, CT, ${dynamicRatios.join('-')}A, ${displayBurden}VA, METERING`} />
        <div className="mt-2 mb-2">
          <ReportSpecBox
            items={[
              { label: 'Core Number', value: `Core ${coreNumber || 1}` },
              { label: 'Core ID', value: coreId.startsWith('M-') ? coreId : `M-${coreId}` },
              { label: 'Core Type', value: 'Metering' },
              { label: 'CT Ratio', value: `${dynamicRatios.join('-')} A` },
              { label: 'Burden', value: `${displayBurden} VA` },
              { label: 'Class', value: accuracyClass },
              { label: 'STC', value: displaySTC }
            ]}
          />
        </div>
        <MeteringTable testResults={testResults} onUpdate={() => {}} readOnly={true} />
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-gray-50 py-4 flex justify-start md:justify-center no-print-scroll">
      <style>{secondaryReportPrintStyles}</style>

      <div className="print-container w-[210mm] min-w-[210mm] print:w-full print:min-w-0 print:max-w-full secondary-print-page">
        {!readOnly && (
          <div className="flex items-center justify-between no-print mb-4 w-full">
            <Button variant="outline" size="sm" onClick={onBack} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button>
            <div className="flex gap-2">
              {!readOnly && hasAnyFailures && !isFailedSection && (
                <Button variant="destructive" size="sm" onClick={handleMarkAsFailed} className="gap-2"><AlertTriangle className="w-4 h-4" /> Add to Failed Transformer</Button>
              )}
              <Button variant="outline" size="sm" onClick={handleDatabaseSave} className="gap-2"><Save className="w-4 h-4" /> Save</Button>
              {onPrev && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onPrev} 
                  className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 font-medium shadow-sm transition-all duration-200 hover:scale-105"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous Core
                </Button>
              )}
              {onNext && (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={onNext} 
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all duration-200 hover:scale-105"
                >
                  Next Core <ChevronRight className="w-4 h-4" />
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2"><Printer className="w-4 h-4" /> Print</Button>
            </div>
          </div>
        )}

        <div ref={printRef} id="secondary-printable-report" className="report-wrapper secondary-report-wrapper">
          <ReportHeader
            stage={stage}
            date={formatReportDate(transformer.testHistory?.[`${stage}_test` as keyof typeof transformer.testHistory]?.reportDate)}
            orderNo={transformer.jobId || transformer.uniqueId}
            client={transformer.clientName || 'N/A'}
            unitNo={transformer.uniqueId}
            accuracyClass={accuracyClass}
          />

          <div className="ae-section-container">
            <ReportSectionTitle index={1} title="Testing Record of Current Transformer" />
            <ReportSpecBox
              items={[
                { label: 'Specification', value: `${transformer.voltageRating || '33'} KV` },
                { label: 'CT Ratio', value: `${dynamicRatios.join('-')} A` },
                { label: 'Burden', value: `${displayBurden} VA` },
                { label: 'Class', value: accuracyClass },
                { label: 'STC', value: displaySTC }
              ]}
            />
          </div>

          <div className="ae-section-container">
            <ReportSectionTitle 
              index={2} 
              title={`${transformer.voltageRating || '33'} KV , CT , ${dynamicRatios.join('-')}A , ${displayBurden}VA , Metering`} 
            />
            {!readOnly && stage !== 'primary' && stage !== 'final' ? (
              <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-[#103b63]/20 shadow-sm max-w-md my-3 no-print relative">
                <span className="text-xs font-bold text-[#103b63] uppercase tracking-wide shrink-0">Select Core ID (from Core Testing):</span>
                <div className="relative flex-1">
                  <button
                    type="button"
                    onClick={() => setIsSelectOpen(!isSelectOpen)}
                    className="w-full p-2 text-xs font-bold rounded border border-gray-300 bg-white text-blue-800 text-left flex justify-between items-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <span>{selectedCoreId} {selectedCoreId === coreId ? '(Default)' : ''}</span>
                    <span className="text-gray-400">▼</span>
                  </button>

                  {isSelectOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsSelectOpen(false)} />
                      <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
                        <div className="p-2 border-b border-gray-200 bg-gray-50 shrink-0">
                          <input
                            type="text"
                            placeholder="Search Core ID..."
                            value={selectSearch}
                            onChange={(e) => setSelectSearch(e.target.value)}
                            className="w-full p-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        </div>
                        <div className="overflow-y-auto flex-1 max-h-40">
                          {[
                            coreId,
                            ...approvedCores.filter(id => id !== coreId && (id === selectedCoreId || !secondaryTestedCores.includes(id)))
                          ]
                            .filter(id => id.toLowerCase().includes(selectSearch.toLowerCase()))
                            .map(id => (
                              <button
                                key={id}
                                type="button"
                                onClick={() => {
                                  setSelectedCoreId(id);
                                  setIsSelectOpen(false);
                                  setSelectSearch('');
                                }}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-blue-50 hover:text-blue-800 transition-colors ${
                                  id === selectedCoreId ? 'bg-blue-50 text-blue-800 font-bold' : 'text-gray-700'
                                }`}
                              >
                                {id} {id === coreId ? '(Default)' : ''}
                              </button>
                            ))
                          }
                          {[
                            coreId,
                            ...approvedCores.filter(id => id !== coreId && (id === selectedCoreId || !secondaryTestedCores.includes(id)))
                          ]
                            .filter(id => id.toLowerCase().includes(selectSearch.toLowerCase())).length === 0 && (
                            <div className="px-3 py-2 text-xs text-gray-500 italic text-center">
                              No matching cores
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <CoreInformationBar label="metering core no." value={selectedCoreId.startsWith('M-') ? selectedCoreId : `M-${selectedCoreId}`} />
            )}
            <MeteringTable testResults={testResults} onUpdate={(ratioIdx, rowIndex, field, value) => handleDataChange(ratioIdx, rowIndex, field, value)} readOnly={readOnly} />
          </div>

          <ReportSignatures testerName={testerName} hideStampAndSignature={true} />
        </div>
      </div>
    </div>
  );
}

interface MeteringTableProps {
  testResults: { ratioValue: string; rows: any[] }[];
  onUpdate: (ratioIdx: number, rowIndex: number, field: string, value: string) => void;
  readOnly?: boolean;
}

function MeteringTable({ testResults, onUpdate, readOnly }: MeteringTableProps) {
  return (
    <div className="w-full">
      <table className="ae-report-table secondary-report-table">
        <thead>
          <tr>
            <th colSpan={2} rowSpan={2} style={{ width: '25%' }} className="text-center font-bold align-middle">
              %of primary current
            </th>
            <th colSpan={2} style={{ width: '37.5%' }}>100 % Burden</th>
            <th colSpan={2} style={{ width: '37.5%' }}>25% Burden</th>
          </tr>
          <tr>
            <th>Ratio Error (%)</th>
            <th>Phase Error (min)</th>
            <th>Ratio Error (%)</th>
            <th>Phase Error (min)</th>
          </tr>
        </thead>
        <tbody>
          {testResults.map((item, ratioIdx) => (
            <React.Fragment key={ratioIdx}>
              {item.rows.map((row, rowIndex) => (
                <tr key={`${ratioIdx}-${rowIndex}`}>
                  {rowIndex === 0 && (
                    <td className="font-bold text-left align-middle p-2" rowSpan={item.rows.length} style={{ width: '15%' }}>
                      Metering Core<br/>Ratio -{item.ratioValue.replace(/\//g, '/')}
                    </td>
                  )}
                  <td className="ae-ratio-cell">{row.current}</td>
                  <td className="input-cell">
                    {readOnly ? (
                      <div className={`p-2 text-center font-bold text-xs h-8 flex items-center justify-center ${row.r100_r_pass === false ? 'invalid-reading' : 'text-[#103b63]'}`}>
                        {row.r100 !== '' && row.r100 !== null && row.r100 !== undefined ? row.r100 : 'Not recorded'}
                      </div>
                    ) : (
                      <input
                        className={`input-field ${row.r100_r_pass === false ? 'invalid-reading' : ''}`}
                        value={row.r100}
                        onKeyDown={(e) => {
                          if (e.ctrlKey || e.metaKey || ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter", "."].includes(e.key)) return;
                          if (!/^[0-9+\-]$/.test(e.key)) e.preventDefault();
                        }}
                        onChange={(e) => onUpdate(ratioIdx, rowIndex, 'r100', e.target.value.replace(/[^0-9+\-.]/g, ''))}
                        disabled={readOnly}
                      />
                    )}
                  </td>
                  <td className="input-cell">
                    {readOnly ? (
                      <div className={`p-2 text-center font-bold text-xs h-8 flex items-center justify-center ${row.r100_p_pass === false ? 'invalid-reading' : 'text-[#103b63]'}`}>
                        {row.p100 !== '' && row.p100 !== null && row.p100 !== undefined ? row.p100 : 'Not recorded'}
                      </div>
                    ) : (
                      <input
                        className={`input-field ${row.r100_p_pass === false ? 'invalid-reading' : ''}`}
                        value={row.p100}
                        onKeyDown={(e) => {
                          if (e.ctrlKey || e.metaKey || ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter", "."].includes(e.key)) return;
                          if (!/^[0-9+\-]$/.test(e.key)) e.preventDefault();
                        }}
                        onChange={(e) => onUpdate(ratioIdx, rowIndex, 'p100', e.target.value.replace(/[^0-9+\-.]/g, ''))}
                        disabled={readOnly}
                      />
                    )}
                  </td>
                  <td className="input-cell">
                    {readOnly ? (
                      <div className={`p-2 text-center font-bold text-xs h-8 flex items-center justify-center ${row.r25_r_pass === false ? 'invalid-reading' : 'text-[#103b63]'}`}>
                        {row.r25 !== '' && row.r25 !== null && row.r25 !== undefined ? row.r25 : 'Not recorded'}
                      </div>
                    ) : (
                      <input
                        className={`input-field ${row.r25_r_pass === false ? 'invalid-reading' : ''}`}
                        value={row.r25}
                        onKeyDown={(e) => {
                          if (e.ctrlKey || e.metaKey || ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter", "."].includes(e.key)) return;
                          if (!/^[0-9+\-]$/.test(e.key)) e.preventDefault();
                        }}
                        onChange={(e) => onUpdate(ratioIdx, rowIndex, 'r25', e.target.value.replace(/[^0-9+\-.]/g, ''))}
                        disabled={readOnly}
                      />
                    )}
                  </td>
                  <td className="input-cell">
                    {readOnly ? (
                      <div className={`p-2 text-center font-bold text-xs h-8 flex items-center justify-center ${row.r25_p_pass === false ? 'invalid-reading' : 'text-[#103b63]'}`}>
                        {row.p25 !== '' && row.p25 !== null && row.p25 !== undefined ? row.p25 : 'Not recorded'}
                      </div>
                    ) : (
                      <input
                        className={`input-field ${row.r25_p_pass === false ? 'invalid-reading' : ''}`}
                        value={row.p25}
                        onKeyDown={(e) => {
                          if (e.ctrlKey || e.metaKey || ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter", "."].includes(e.key)) return;
                          if (!/^[0-9+\-]$/.test(e.key)) e.preventDefault();
                        }}
                        onChange={(e) => onUpdate(ratioIdx, rowIndex, 'p25', e.target.value.replace(/[^0-9+\-.]/g, ''))}
                        disabled={readOnly}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getInitialData(accClass?: string) {
  let currents = ['120%', '100%', '20%', '5%', '1%'];
  
  if (accClass) {
    const isSpecialClass = accClass.toLowerCase().includes('s');
    if (!isSpecialClass) {
      currents = ['120%', '100%', '20%', '5%'];
    }
  }

  return currents.map(c => ({
    current: c,
    r100: '',
    p100: '',
    r25: '',
    p25: '',
    r100_r_pass: null,
    r100_p_pass: null,
    r25_r_pass: null,
    r25_p_pass: null,
    r100_reason: '',
    r25_reason: ''
  }));
}

function extractAccuracyClass(str: string): string {
  if (!str) return '0.5';
  
  const classes = ['0.2S', '0.5S', '0.1', '0.2', '0.5', '1', '3', '5'];
  const upper = str.toUpperCase().replace(/\s+/g, '');

  for (const cls of classes) {
      if (upper.includes(cls)) return cls;
  }

  return '0.5';
}

function validateMeteringUI(accClass: string, current: string, r: string, p: string, limits: any[]) {
  let rPass: boolean | null = null;
  let pPass: boolean | null = null;
  if (!r && !p) return { rPass: null, pPass: null, reason: null }; 

  const normalizedAccClass = String(accClass || "").toUpperCase().replace(/\s+/g, '');
  const config = limits.find(l => {
    const lClass = l.accuracyClass ? String(l.accuracyClass).toUpperCase().replace(/\s+/g, '') : '';
    return lClass === normalizedAccClass;
  });
  if (!config) return { rPass: true, pPass: true, reason: null }; 

  const loadLimit = config.limits.find((l: any) => String(l.load) === String(current));
  if (!loadLimit) return { rPass: true, pPass: true, reason: null }; 

  let reasons: string[] = [];

  if (r && r.trim() !== '') {
    const rVal = parseFloat(r);
    if (!isNaN(rVal) && loadLimit.ratioLimit !== undefined && loadLimit.ratioLimit !== null) {
      if (Math.abs(rVal) >= loadLimit.ratioLimit) {
        rPass = false;
        reasons.push(`Ratio Error (${rVal}) exceeds or equals ±${loadLimit.ratioLimit}`);
      } else {
        rPass = true;
      }
    }
  }

  if (p && p.trim() !== '') {
    const pVal = parseFloat(p);
    if (!isNaN(pVal) && loadLimit.phaseLimit !== undefined && loadLimit.phaseLimit !== null) {
      if (Math.abs(pVal) >= loadLimit.phaseLimit) {
        pPass = false;
        reasons.push(`Phase Error (${pVal}) exceeds or equals ±${loadLimit.phaseLimit}`);
      } else {
        pPass = true;
      }
    }
  }

  return { rPass, pPass, reason: reasons.length > 0 ? reasons.join('; ') : null };
}

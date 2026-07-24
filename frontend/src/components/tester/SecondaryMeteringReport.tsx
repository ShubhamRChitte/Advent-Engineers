import axios from "axios";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Printer, ArrowLeft, Save, AlertTriangle, ChevronLeft, ChevronRight, CheckCircle, RefreshCw, Loader2, Wrench, Search } from 'lucide-react';
import { Transformer } from './SecondaryTransformersList';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

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
  stage?: 'secondary' | 'primary' | 'final' | 'inspection';
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
  onNext?: (() => void) | undefined;
  onPrev?: (() => void) | undefined;
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

  const printRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
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
    const order = propOrder || (transformer as any).fullOrder || (transformer as any).orderId;
    const orderCores = order?.coreDetails || [];
    const coreFromOrder = orderCores[coreIndex];
    const secCurr = manualSecondary || coreFromOrder?.secondaryCurrent || order?.ratedSecondaryCurrent || '1';
    const rawPrimaryCurrs = manualPrimary ? [manualPrimary] :
      ((order?.primaryCurrents && order.primaryCurrents.length > 0) ? order.primaryCurrents :
      (Array.isArray(order?.ratio) ? order.ratio.map((r: string) => String(r).split('/')[0]) : ['200']));

    let primaryCurrs = rawPrimaryCurrs.flatMap((pc: string) =>
      String(pc).replace(/[\[\]"']/g, '').split(/[- ,]+/).filter(v => v.trim() !== '')
    );
    primaryCurrs = [...new Set(primaryCurrs)];

    return primaryCurrs.map((p: string) => `${p}/${secCurr}`);
  })();

  const accuracyClass = (() => {
    if (explicitClass) return explicitClass;
    const order = propOrder || (transformer as any).fullOrder || (transformer as any).orderId;
    const orderCores = order?.coreDetails || [];
    return orderCores[coreIndex]?.accuracyClass || order?.accuracyClass || extractAccuracyClass(transformer.rating || '');
  })();

  const displayBurden = (() => {
    const order = propOrder || (transformer as any).fullOrder || (transformer as any).orderId;
    let rawBurden = order?.burden;
    if (Array.isArray(rawBurden)) {
      rawBurden = rawBurden[Math.min(coreIndex, rawBurden.length - 1)];
    }
    const val = rawBurden || (transformer as any).burden;
    if (!val) return 'N/A';
    return String(val).replace(/VA/i, '').trim();
  })();

  const displaySTC = (() => {
    const order = propOrder || (transformer as any).fullOrder || (transformer as any).orderId;
    return order?.stc || order?.STC || (transformer as any).stc || 'N/A';
  })();

  const initialBlankData = dynamicRatios.map(ratio => ({
    ratioValue: ratio,
    rows: getInitialData(accuracyClass)
  }));

  const [testResults, setTestResults] = useState(initialBlankData);
  const [approvedCores, setApprovedCores] = useState<string[]>([]);
  const [secondaryTestedCores, setSecondaryTestedCores] = useState<string[]>([]);
  const [selectedCoreId, setSelectedCoreId] = useState<string>(coreId);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [selectSearch, setSelectSearch] = useState('');

  // Replace Core Modal State
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [availableReadyCores, setAvailableReadyCores] = useState<any[]>([]);
  const [loadingReadyCores, setLoadingReadyCores] = useState(false);
  const [selectedNewCoreId, setSelectedNewCoreId] = useState('');
  const [isReplacingCore, setIsReplacingCore] = useState(false);
  const [coreSearchTerm, setCoreSearchTerm] = useState('');

  const filteredReadyCores = useMemo(() => {
    if (!coreSearchTerm.trim()) return availableReadyCores;
    const term = coreSearchTerm.toLowerCase();
    return availableReadyCores.filter((c: any) => {
      const idStr = (c.coreId || c.id || '').toLowerCase();
      const turnsStr = (c.specifications?.turns || '').toString().toLowerCase();
      const typeStr = (c.coreType || '').toLowerCase();
      return idStr.includes(term) || turnsStr.includes(term) || typeStr.includes(term);
    });
  }, [availableReadyCores, coreSearchTerm]);

  const handleOpenReplaceModal = async () => {
    setIsReplaceModalOpen(true);
    setLoadingReadyCores(true);
    setCoreSearchTerm('');
    setSelectedNewCoreId('');
    try {
      const res = await axios.get('/ready-transformers/available?coreType=Metering', { withCredentials: true });
      setAvailableReadyCores(res.data || []);
    } catch (err) {
      toast.error("Failed to load available ready stock cores");
    } finally {
      setLoadingReadyCores(false);
    }
  };

  const handleConfirmReplaceCore = async () => {
    if (!selectedNewCoreId) {
      toast.error("Please select a replacement core from Ready Stock");
      return;
    }
    try {
      setIsReplacingCore(true);
      const orderObj = propOrder || (transformer as any).fullOrder || (transformer as any).orderId;
      const orderId = (transformer as any).orderId?._id || (transformer as any).orderId || orderObj?._id || orderObj?.id;

      const res = await axios.post('/secondary-core-tests/replace-failed-core', {
        orderId,
        transformerId: transformer.id || (transformer as any)._id,
        uniqueId: transformer.uniqueId,
        oldCoreId: selectedCoreId,
        newCoreId: selectedNewCoreId,
        coreType: 'Metering',
        failureReason: "Failed Secondary Metering Test"
      }, { withCredentials: true });

      if (res.data?.success) {
        const replacedCoreId = selectedNewCoreId;
        toast.success(`Core ${selectedCoreId} moved to Failed Cores. Replaced with ${replacedCoreId}!`);
        setIsReplaceModalOpen(false);
        setSelectedCoreId(replacedCoreId);
        setTestResults(initialBlankData);
        await fetchApprovedCores();
        if (onRefresh) onRefresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to replace core");
    } finally {
      setIsReplacingCore(false);
    }
  };

  const fetchApprovedCores = React.useCallback(async () => {
    const order = propOrder || (transformer as any).fullOrder || (transformer as any).orderId;
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
  }, [propOrder, transformer.fullOrder, (transformer as any).orderId, readOnly]);

  useEffect(() => {
    fetchApprovedCores();
  }, [fetchApprovedCores]);

  useEffect(() => {
    setSelectedCoreId(coreId);
  }, [coreId]);

  useEffect(() => {
    let isCancelled = false;

    const fetchLatestData = async () => {
      const targetCoreId = coreId || selectedCoreId;
      try {
        if (stage === 'inspection') {
          let currentInspectionData = (transformer as any).inspectionData || {};
          try {
            const checkRes = await axios.get(`/final/inspection/${encodeURIComponent(transformer.uniqueId)}`, { withCredentials: true });
            if (checkRes.data.success && checkRes.data.data) {
              currentInspectionData = checkRes.data.data;
            }
          } catch (e) {
            console.error("Failed to fetch latest inspection data in fetchLatestData (Metering)", e);
          }
          if (isCancelled) return;
          const savedResults = (currentInspectionData as any).coreTests?.[targetCoreId];
          if (savedResults && savedResults.metering_results) {
            setTestResults(prev => (prev.length > 0 ? prev : initialBlankData).map((item) => {
              const matched = savedResults.metering_results.find((r: any) => r.ratioValue === item.ratioValue);
              return matched ? { ...item, rows: matched.rows } : item;
            }));
          } else {
            setTestResults(initialBlankData);
          }
          return;
        }

        if (transformer.isDummy) {
          const order = propOrder || (transformer as any).fullOrder || (transformer as any).orderId;
          const orderId = order?._id || order;
          const res = await axios.get(`/secondary-core-tests/metering/${targetCoreId}${orderId ? `?orderId=${orderId}` : ''}`, { withCredentials: true });
          if (isCancelled) return;
          if (res.data?.success && res.data.data) {
            const testDoc = res.data.data;
            if (testDoc.metering_results && testDoc.metering_results.length > 0) {
              setTestResults(prev => {
                const base = prev.length > 0 ? prev : initialBlankData;
                return base.map((item, idx) => {
                  let matched = testDoc.metering_results.find((r: any) => r.ratioValue === item.ratioValue);
                  if (!matched && testDoc.metering_results[idx]) {
                    matched = testDoc.metering_results[idx];
                  }
                  if (!matched) return item;
                  return {
                    ...item,
                    rows: item.rows.map((rowItem, rIdx) => {
                      const savedRow = matched.rows?.[rIdx] || {};
                      return {
                        ...rowItem,
                        r100: (savedRow.r100 !== undefined && savedRow.r100 !== null) ? String(savedRow.r100) : rowItem.r100,
                        p100: (savedRow.p100 !== undefined && savedRow.p100 !== null) ? String(savedRow.p100) : rowItem.p100,
                        r25: (savedRow.r25 !== undefined && savedRow.r25 !== null) ? String(savedRow.r25) : rowItem.r25,
                        p25: (savedRow.p25 !== undefined && savedRow.p25 !== null) ? String(savedRow.p25) : rowItem.p25
                      };
                    })
                  };
                });
              });
              return;
            }
          }
          if (!isCancelled) setTestResults(initialBlankData);
          return;
        }

        const res = await axios.get(`/transformers/${transformer.uniqueId}`, { withCredentials: true });
        if (isCancelled) return;
        const freshTransformer = res.data.data || res.data;

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
          if (isCancelled) return;
        }

        const currentHasBeenRetested = currentRetestHistory && currentRetestHistory.length > 0;
        const shouldLoadFromTreated = isFailedSection && currentFailedStatus === 'TREATED' && (isFailedCore || currentHasBeenRetested);
        
        if (shouldLoadFromTreated) {
          const secHistory = freshTransformer.testHistory?.secondary_test;
          if (secHistory?.metering_results?.length > 0) {
            myResults = secHistory.metering_results.filter((res: any) =>
              res.internalCoreNo === targetCoreId || res.coreId === targetCoreId
            );
            if (myResults.length === 0 && secHistory.meteringCoreId === targetCoreId) {
              myResults = secHistory.metering_results;
            }
          }
        }

        if (myResults.length === 0) {
          const stageKey = `${stage}_test` as keyof typeof freshTransformer.testHistory;
          const stageHistory = freshTransformer?.testHistory?.[stageKey];
          if (stageHistory?.metering_results?.length > 0) {
            myResults = stageHistory.metering_results.filter((res: any) =>
              res.internalCoreNo === targetCoreId || res.coreId === targetCoreId
            );
            if (myResults.length === 0 && freshTransformer.testHistory?.secondary_test?.meteringCoreId === targetCoreId) {
              myResults = stageHistory.metering_results;
            }
          }
        }

        if (myResults.length === 0 && sourceStage && sourceStage !== stage) {
          const sourceHistory = freshTransformer?.testHistory?.[`${sourceStage}_test`] as any;
          if (sourceHistory?.metering_results?.length > 0) {
            myResults = sourceHistory.metering_results.filter((res: any) =>
              res.internalCoreNo === targetCoreId || res.coreId === targetCoreId
            );
            if (myResults.length === 0 && freshTransformer.testHistory?.secondary_test?.meteringCoreId === targetCoreId) {
              myResults = sourceHistory.metering_results;
            }
          }
        }

        if (myResults.length > 0) {
          setTestResults(prev => (prev.length > 0 ? prev : initialBlankData).map(item => {
            const matched = myResults.find((r: any) => r.ratioValue === item.ratioValue);
            return matched ? { ...item, rows: matched.rows } : item;
          }));
        } else if (stage === 'secondary') {
          const order = propOrder || (transformer as any).fullOrder || (transformer as any).orderId;
          const orderId = order?._id || order;
          const fallbackRes = orderId ? await axios.get(`/secondary-core-tests/metering/${targetCoreId}?orderId=${orderId}`, { withCredentials: true }) : null;
          if (isCancelled) return;
          if (fallbackRes?.data?.success && fallbackRes.data.data) {
            const testDoc = fallbackRes.data.data;
            if (testDoc.metering_results && testDoc.metering_results.length > 0) {
              setTestResults(prev => {
                const base = prev.length > 0 ? prev : initialBlankData;
                return base.map((item, idx) => {
                  let matched = testDoc.metering_results.find((r: any) => r.ratioValue === item.ratioValue);
                  if (!matched && testDoc.metering_results[idx]) {
                    matched = testDoc.metering_results[idx];
                  }
                  if (!matched) return item;
                  return {
                    ...item,
                    rows: item.rows.map((rowItem, rIdx) => {
                      const savedRow = matched.rows?.[rIdx] || {};
                      return {
                        ...rowItem,
                        r100: (savedRow.r100 !== undefined && savedRow.r100 !== null) ? String(savedRow.r100) : rowItem.r100,
                        p100: (savedRow.p100 !== undefined && savedRow.p100 !== null) ? String(savedRow.p100) : rowItem.p100,
                        r25: (savedRow.r25 !== undefined && savedRow.r25 !== null) ? String(savedRow.r25) : rowItem.r25,
                        p25: (savedRow.p25 !== undefined && savedRow.p25 !== null) ? String(savedRow.p25) : rowItem.p25
                      };
                    })
                  };
                });
              });
              return;
            }
          }
          if (!isCancelled) setTestResults(initialBlankData);
        } else {
          if (!isCancelled) setTestResults(initialBlankData);
        }
      } catch (err) {
        if (!isCancelled) console.error("Failed to load existing metering data", err);
      }
    };

    fetchLatestData();

    return () => {
      isCancelled = true;
    };
  }, [transformer.uniqueId, selectedCoreId, coreId, stage, failedStatus, isFailedCore, retestHistory]);

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

  const areAllReadingsFilled = () => {
    return testResults.every(item => 
      item.rows.every(row => 
        row.r100 !== null && row.r100 !== undefined && String(row.r100).trim() !== '' &&
        row.p100 !== null && row.p100 !== undefined && String(row.p100).trim() !== '' &&
        row.r25 !== null && row.r25 !== undefined && String(row.r25).trim() !== '' &&
        row.p25 !== null && row.p25 !== undefined && String(row.p25).trim() !== ''
      )
    );
  };

  const handleDatabaseSave = async (isApprove: boolean = false) => {
    if (readOnly) return;
    setSaving(true);
    try {
      const payload = {
        uniqueId: transformer.uniqueId,
        orderId: typeof transformer.orderId === 'object' && transformer.orderId ? (transformer.orderId as any)._id : transformer.orderId,
        loginType: `${stage}_login`,
        tester: testerName,
        coreId: selectedCoreId,
        status: isApprove || stage === 'secondary' ? "Pass" : "In-Progress",
        metering_results: testResults.map(item => ({
          ratioValue: item.ratioValue,
          rows: item.rows,
          internalCoreNo: selectedCoreId,
          coreId: selectedCoreId,
          accuracyClass: accuracyClass
        }))
      };

      if (stage === 'inspection') {
        let currentInspectionData = {};
        try {
          const checkRes = await axios.get(`/final/inspection/${encodeURIComponent(transformer.uniqueId)}`, { withCredentials: true });
          if (checkRes.data.success && checkRes.data.data) {
            currentInspectionData = checkRes.data.data;
          }
        } catch (e) {
          console.error("Failed to load existing inspection data for merge, using prop defaults", e);
          currentInspectionData = (transformer as any).inspectionData || {};
        }

        const updatedCoreTests = {
            ...((currentInspectionData as any).coreTests || {}),
            [selectedCoreId]: payload
        };
        const updatedInspectionData = {
            ...currentInspectionData,
            coreTests: updatedCoreTests
        };
        await axios.post(`/final/inspection/${encodeURIComponent(transformer.uniqueId)}`, updatedInspectionData, { withCredentials: true });
      } else if (isFailedSection && failedTransformerId) {
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
      
      setSecondaryTestedCores(prev => [...new Set([...prev, selectedCoreId])]);
      if (onRefresh) onRefresh();

      if (isApprove) {
        toast.success("Metering Core Approved successfully!");
        if (onNext) onNext(); else onBack();
      } else {
        toast.success("Data saved successfully!");
      }
    } catch (error) {
      toast.error("Failed to save data.");
    } finally {
      setSaving(false);
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

      const orderObj = propOrder || (transformer as any).fullOrder || (transformer as any).orderId;

      const payload = {
        transformerId: transformer.id || (transformer as any)._id,
        transformerUniqueId: transformer.uniqueId,
        orderId: (transformer as any).orderId?._id || (transformer as any).orderId || orderObj?._id || orderObj?.id,
        jobNumber: (transformer as any).jobId || orderObj?.jobId || '',
        clientName: (transformer as any).clientName || orderObj?.clientName || '',
        coreType: "Metering",
        testType: stage === 'primary' ? "After Primary Metering" : stage === 'final' ? "Final Metering" : "Secondary Metering",
        failureParameters: { failureStage: `${stage}_metering_test`, dynamicValues: testResults, coreId: selectedCoreId },
        failureReason: allReasons.length > 0 ? [...new Set(allReasons)].join(' | ') : "Accuracy Limits Exceeded",
        reportedBy: testerName,
        stage: stage === 'primary' ? "PRIMARY_TESTING" : stage === 'final' ? "FINAL_TESTING" : "SECONDARY_TESTING",
        status: "FAILED"
      };

      await handleDatabaseSave(false);

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

  const hasAnyFailures = useMemo(() => {
    const isOldCoreFailed = (selectedCoreId === coreId) && (isFailedCore || failedStatus === 'FAILED');
    if (isOldCoreFailed) return true;
    return testResults.some(item => item.rows.some(row => {
      if (row.r100_r_pass === false || row.r100_p_pass === false || row.r25_r_pass === false || row.r25_p_pass === false) return true;
      const v100 = validateMeteringUI(accuracyClass, row.current, row.r100, row.p100, dbLimits);
      const v25 = validateMeteringUI(accuracyClass, row.current, row.r25, row.p25, dbLimits);
      return v100.rPass === false || v100.pPass === false || v25.rPass === false || v25.pPass === false;
    }));
  }, [testResults, accuracyClass, dbLimits, isFailedCore, failedStatus, selectedCoreId, coreId]);

  if (isUnified) {
    return (
      <div className="ae-section-container print:break-inside-avoid print:mt-6" style={{ pageBreakInside: 'avoid', marginTop: 24 }}>
        <ReportSectionTitle title={`${(transformer as any).voltageRating || '33'} KV, CT, ${dynamicRatios.join('-')}A, ${displayBurden}VA, METERING`} />
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
    <div className="w-full flex flex-col">
    <div className="w-full overflow-x-auto bg-gray-50 py-4 flex justify-start md:justify-center no-print-scroll">
      <style>{secondaryReportPrintStyles}</style>

      <div className="print-container w-[210mm] min-w-[210mm] print:w-full print:min-w-0 print:max-w-full secondary-print-page">
        {!readOnly && (
          <div className="flex items-center justify-between no-print mb-4 w-full">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={async () => {
                if (!readOnly && onPrev) await handleDatabaseSave(false);
                if (onPrev) onPrev();
              }}
              disabled={saving || !onPrev}
              className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" /> Previous Core
            </Button>
            <div className="flex gap-2">
              {stage === 'secondary' && !readOnly && hasAnyFailures && (
                <Button
                  onClick={handleOpenReplaceModal}
                  variant="outline"
                  size="sm"
                  className="gap-2 border-orange-500 text-orange-700 bg-orange-50 hover:bg-orange-100 font-bold shadow-sm"
                  title="Replace failed core with a new core from Ready Stock"
                >
                  <RefreshCw className="w-4 h-4 text-orange-600" />
                  Replace Core (Ready Stock)
                </Button>
              )}
              {stage !== 'secondary' && !readOnly && !(transformer as any).isDummy && hasAnyFailures && !isFailedSection && (
                <Button variant="destructive" size="sm" onClick={handleMarkAsFailed} className="gap-2"><AlertTriangle className="w-4 h-4" /> Add to Failed Transformer</Button>
              )}
              {!readOnly && (
                <>
                  <Button
                    onClick={() => handleDatabaseSave(false)}
                    disabled={saving}
                    variant="outline"
                    className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Draft'}
                  </Button>
                  {stage === 'secondary' && areAllReadingsFilled() && (
                    <Button
                      onClick={() => handleDatabaseSave(true)}
                      disabled={saving}
                      className="gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {saving ? 'Approving...' : 'Approve Core'}
                    </Button>
                  )}
                </>
              )}
              {onNext && (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={async () => {
                    if (!readOnly) await handleDatabaseSave(false);
                    onNext();
                  }} 
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all duration-200 hover:scale-105"
                >
                  {(stage === 'primary' || stage === 'final') ? 'Next' : 'Next Core'} <ChevronRight className="w-4 h-4" />
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
            {!readOnly && !isFailedSection && stage !== 'final' ? (
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
                          {(() => {
                            const isPrimaryOrFinal = stage === 'primary';
                            let availableList: string[] = [];
                            if (isPrimaryOrFinal) {
                              availableList.push(...secondaryTestedCores);
                              const secResults = (transformer.testHistory?.secondary_test as any)?.metering_results || [];
                              secResults.forEach((r: any) => { if (r.internalCoreNo) availableList.push(r.internalCoreNo); if (r.coreId) availableList.push(r.coreId); });
                              const secMetaId = (transformer.testHistory?.secondary_test as any)?.meteringCoreId;
                              if (secMetaId) availableList.push(secMetaId);
                              
                              const primResults = (transformer.testHistory?.primary_test as any)?.metering_results || [];
                              primResults.forEach((r: any) => { if (r.internalCoreNo) availableList.push(r.internalCoreNo); if (r.coreId) availableList.push(r.coreId); });
                              
                              availableList.push(...approvedCores);
                              if (selectedCoreId) availableList.push(selectedCoreId);
                            } else {
                              if (selectedCoreId) availableList.push(selectedCoreId);
                              availableList.push(...approvedCores);
                            }
                            return Array.from(new Set(availableList.filter(Boolean)));
                          })()
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
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-blue-50 hover:text-blue-800 transition-colors flex justify-between items-center ${
                                  id === selectedCoreId ? 'bg-blue-50 text-blue-800 font-bold' : 'text-gray-700'
                                }`}
                              >
                                <span>{id} {id === coreId ? '(Default)' : ''}</span>
                                {secondaryTestedCores.includes(id) && (
                                  <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Tested</span>
                                )}
                              </button>
                            ))
                          }
                          {approvedCores.length === 0 && secondaryTestedCores.length === 0 && !coreId && (
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

      {!readOnly && (
        <div className="no-print mt-6 mb-8 flex justify-center gap-3">
          <Button
            onClick={() => handleDatabaseSave(false)}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white px-10 py-2.5 font-semibold text-sm shadow-sm gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
          {onNext && (
            <Button
              onClick={async () => {
                await handleDatabaseSave(false);
                onNext();
              }}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-2.5 font-semibold text-sm shadow-sm gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save & Next'}
            </Button>
          )}
        </div>
      )}
      {/* REPLACE CORE FROM READY STOCK MODAL */}
      {isReplaceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
          <div className="w-full max-w-md p-6 bg-white shadow-2xl rounded-xl border border-gray-100 flex flex-col gap-4 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange-500" />
                Core Replacement
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Replace failed core <span className="font-mono font-bold text-red-600">{selectedCoreId}</span> with a pre-tested core from Ready Stock.
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-xs font-bold text-red-800 uppercase">Failed Core Info:</div>
              <div className="text-sm text-red-700 mt-1 font-mono">
                <strong>Type:</strong> Metering <br />
                <strong>Core Serial No:</strong> {selectedCoreId}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-500 block">
                Choose Core (from Ready Stock)
              </label>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by Core Serial or Turns..."
                  value={coreSearchTerm}
                  onChange={(e) => setCoreSearchTerm(e.target.value)}
                  className="pl-9 text-xs font-mono border-gray-300 h-9"
                />
              </div>

              {loadingReadyCores ? (
                <div className="flex items-center gap-2 py-4 text-xs text-gray-500 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                  Loading ready stock cores...
                </div>
              ) : filteredReadyCores.length === 0 ? (
                <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 mt-1">
                  {coreSearchTerm ? 'No ready stock cores match your search.' : 'No available cores in Ready Stock matching this type.'}
                </p>
              ) : (
                <select
                  value={selectedNewCoreId}
                  onChange={(e) => setSelectedNewCoreId(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm font-mono outline-none focus:border-orange-500 shadow-sm"
                >
                  <option value="">-- Select Replacement Core ({filteredReadyCores.length}) --</option>
                  {filteredReadyCores.map((c: any) => (
                    <option key={c._id || c.id} value={c.coreId || c.id}>
                      {c.coreId || c.id} {c.specifications?.turns ? `(Turns: ${c.specifications.turns})` : ''} ({c.coreType})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => setIsReplaceModalOpen(false)}
                disabled={isReplacingCore}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmReplaceCore}
                disabled={isReplacingCore || !selectedNewCoreId}
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs gap-1.5 font-bold"
              >
                {isReplacingCore ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Replacing...
                  </>
                ) : (
                  <>
                    <Wrench className="w-3.5 h-3.5" />
                    Confirm Replace
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
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

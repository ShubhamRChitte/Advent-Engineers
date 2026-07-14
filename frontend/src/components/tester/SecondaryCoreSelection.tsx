import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Transformer } from './SecondaryTransformersList';
import axios from '@/utils/axiosConfig';
import { toast } from 'sonner';

interface SecondaryCoreSelectionProps {
  transformer: Transformer;
  onCoreSelect: (coreNumber: number, coreType: string, enteredCoreId: string, uniqueId: string, accuracyClass?: string) => void;
  onBack: () => void;
  onRefreshOrders?: () => void;
  onEndTimer?: () => Promise<void>;
}

export function SecondaryCoreSelection({ transformer: initialTransformer, onCoreSelect, onBack, onRefreshOrders, onEndTimer }: SecondaryCoreSelectionProps) {
  const [enteredCoreId, setEnteredCoreId] = useState('');
  const [selectedCore, setSelectedCore] = useState<number | null>(null);
  // Maintain local state for transformer to allow refreshing data
  const [transformer, setTransformer] = useState<Transformer>(initialTransformer);

  // Sync when parent passes updated testHistory (e.g., after saving a report and navigating back)
  useEffect(() => {
    setTransformer(prev => ({
      ...prev,
      testHistory: initialTransformer.testHistory
    }));
  }, [initialTransformer.testHistory]);

  // Fetch latest data on mount to ensure testHistory is fresh
  useEffect(() => {
    const fetchFreshData = async () => {
      try {
        // Re-fetch to get updated testHistory (test status, core IDs)
        // Note: We used localhost:3002 in other files.
        const response = await axios.get(`/transformers/${initialTransformer.uniqueId}`, { withCredentials: true });
        if (response.status === 200) {
          const freshData = response.data;
          console.log("SecondaryCoreSelection: Fetched fresh data", freshData);

          // Merge fresh DB data with existing UI-only fields (like availableCoreIdsPool)
          setTransformer(prev => ({
            ...prev,
            testHistory: freshData.testHistory,
            // We keep 'cores' from prev because it might be mapped from Order details, 
            // whereas DB might strictly have test info. 
            // But 'ratios' etc should probably be synced. 
            // For now, updating testHistory is the critical part for Auto-Select.
          }));
        }
      } catch (error) {
        console.error("Failed to refresh transformer data:", error);
      }
    };
    fetchFreshData();
  }, [initialTransformer.uniqueId]);


  const getCoreTypeColor = (type: string) => {
    switch (type) {
      case 'metering': return 'bg-blue-50 border-blue-300';
      case 'ps': return 'bg-purple-50 border-purple-300';
      case 'protection': return 'bg-green-50 border-green-300';
      default: return 'bg-gray-50 border-gray-300';
    }
  };

  const getCoreTypeLabel = (type: string) => {
    switch (type) {
      case 'metering': return 'Metering Test Report';
      case 'ps': return 'PS Test Report';
      case 'protection': return 'Protection Test Report';
      default: return type;
    }
  };

  const handleCoreSelect = (coreNumber: number) => {
    setSelectedCore(coreNumber);

    // Auto-Populate Logic
    // Find config for this core number
    const config = transformer.cores.find(c => c.coreNumber === coreNumber);
    if (!config) return;

    // Check Test History for an existing ID for this type + index?
    // Since we don't strictly track "Core 1 = Index 0" in the DB array (it's just a list of results),
    // AND the user might test Core 2 before Core 1,
    // We can't perfectly map by index unless we trust the order.
    // However, if we assume the results are stored in order, or if we just want to be helpful:
    // A better heuristic: 
    // Is there a result that corresponds to this "slot"?
    // Since we don't have "slot" in DB, this is tricky.
    // BUT! The user request says "if we select... no need to select core no".
    // Maybe we look at the 'availableCoreIdsPool' logic or something?

    // WAIT. If I tested Core 1 with M-001. Then M-001 is in `metering_results`.
    // If I click Core 1 again, I want M-001 to be selected.
    // How do I know Core 1 maps to M-001?
    // The Frontend doesn't persist "Core 1 -> M-001" mapping explicitly in the `cores` array unless we infer it.
    // In `SecondaryTransformersList`, we just listed the IDs.

    // Heuristic:
    // If there are `metering_results`, and I click the Nth Metering Core, pick the Nth Result's ID.
    // This assumes chronological testing matching the UI order, which is a fair assumption for now.

    // Use FRAME-FRESH transformer state here
    const type = config.coreType;
    const results = transformer.testHistory?.secondary_test?.[type + '_results'] || [];

    // Reliable Logic: 
    // 1. Check if the "Expected ID" from the pool is in the results.
    // 2. Fallback to suffix matching.
    const typeCores = transformer.cores.filter(c => c.coreType === config.coreType);
    const typeIndex = typeCores.findIndex(c => c.coreNumber === coreNumber);
    const expectedId = transformer.availableCoreIdsPool?.[config.coreType as 'metering' | 'ps' | 'protection']?.[typeIndex];
    const suffix = `-${String(coreNumber).padStart(3, '0')}`;
    const typeSeq = typeIndex + 1;
    const typeSuffix = `-${String(typeSeq).padStart(3, '0')}`; // e.g. -001 for 1st PS core (even if it's Core 2)

    const foundResult = results.find((r: any) => {
      const id = r.internalCoreNo || r.coreId || '';
      return (expectedId && id === expectedId) ||
        id.endsWith(suffix) || id.includes(suffix) ||
        id.endsWith(typeSuffix) || id.includes(typeSuffix);
    });

    if (foundResult) {
      const savedId = foundResult.internalCoreNo || foundResult.coreId;
      console.log(`Auto-selecting ID for Core ${coreNumber} (${type}):`, savedId);
      setEnteredCoreId(savedId);
      return;
    }

    setEnteredCoreId('');
  };

  const handleStartTest = () => {
    if (selectedCore !== null && enteredCoreId.trim()) {
      const core = transformer.cores.find(c => c.coreNumber === selectedCore);
      if (core) {
        onCoreSelect(selectedCore, core.coreType, enteredCoreId, transformer.uniqueId, core.accuracyClass);
      }
    }
  };

  const handleApproveTransformer = async () => {
    try {
      if (!confirm(`Are you sure you want to approve Transformer ${transformer.uniqueId} and move it to Primary Testing?`)) return;

      const response = await axios.put(`/transformers/${transformer.uniqueId}/approve-stage`, {
        stage: 'secondary',
        nextStage: 'primary'
      }, { withCredentials: true });

      if (response.data.success) {
        toast.success("Transformer Approved successfully!");
        if (onEndTimer) await onEndTimer(); // Stop the CT timer on approval
        if (onRefreshOrders) onRefreshOrders();
        onBack();
      }
    } catch (err) {
      console.error("Approval failed", err);
      toast.error("Failed to approve transformer");
    }
  };

  // Helper to check if ALL cores are done
  const isAllCoresCompleted = transformer.cores.every(core => {
    const results = transformer.testHistory?.secondary_test?.[`${core.coreType}_results`] || [];

    const typeCores = transformer.cores.filter(c => c.coreType === core.coreType);
    const typeIndex = typeCores.findIndex(c => c.coreNumber === core.coreNumber);
    const expectedId = transformer.availableCoreIdsPool?.[core.coreType as keyof typeof transformer.availableCoreIdsPool]?.[typeIndex];
    const suffix = `-${String(core.coreNumber).padStart(3, '0')}`;
    const typeSeq = typeIndex + 1;
    const typeSuffix = `-${String(typeSeq).padStart(3, '0')}`;

    const coreResults = results.filter((r: any) => {
      const id = r.internalCoreNo || r.coreId || '';
      return (expectedId && id === expectedId) ||
        id.endsWith(suffix) || id.includes(suffix) ||
        id.endsWith(typeSuffix) || id.includes(typeSuffix);
    });

    if (coreResults.length === 0) return false;

    const hasValue = (v: any) => v !== undefined && v !== null && v !== '';

    if (core.coreType === 'metering') {
      return coreResults.every((res: any) =>
        res.rows && res.rows.length > 0 && res.rows.every((row: any) =>
          hasValue(row.r100) && hasValue(row.p100) && hasValue(row.r25) && hasValue(row.p25)
        )
      );
    } else if (core.coreType === 'protection') {
      return coreResults.every((res: any) =>
        hasValue(res.ratioError100) &&
        hasValue(res.resistance) &&
        (hasValue(res.secondaryLimitingVoltage) || hasValue(res.secondaryLimitingVtg))
      );
    } else if (core.coreType === 'ps') {
      // A PS record is complete if the key measurement fields are present
      return coreResults.every((res: any) =>
        hasValue(res.turnRatioError) && hasValue(res.vk) && hasValue(res.iexVk)
      );
    }
    return true;
  });

  const hasFailures = transformer.cores.some(core => {
    const results = transformer.testHistory?.secondary_test?.[`${core.coreType}_results`] || [];
    if (core.coreType === 'metering') {
      return results.some((res: any) => res.rows && res.rows.some((row: any) =>
        row.r100_r_pass === false || row.r100_p_pass === false ||
        row.r25_r_pass === false || row.r25_p_pass === false ||
        row.r100_pass === false || row.r25_pass === false || row.p100_pass === false || row.p25_pass === false
      ));
    }
    if (core.coreType === 'protection') {
      return results.some((res: any) => res.isPass === false);
    }
    if (core.coreType === 'ps') {
      return results.some((res: any) => res.isPass === false);
    }
    return false;
  });

  const handleStrictApproval = async () => {
    try {
      // Automatically fetch failure reasons from results
      let failureReasons: string[] = [];

      transformer.cores.forEach(core => {
        const results = transformer.testHistory?.secondary_test?.[`${core.coreType}_results`] || [];

        if (core.coreType === 'metering') {
          results.forEach((res: any) => {
            if (res.rows) {
              res.rows.forEach((row: any) => {
                if (row.r100_r_pass === false || row.r100_p_pass === false) {
                  failureReasons.push(`Core ${core.coreNumber} (Metering 100%): ${row.r100_reason || 'Limits Exceeded'}`);
                }
                if (row.r25_r_pass === false || row.r25_p_pass === false) {
                  failureReasons.push(`Core ${core.coreNumber} (Metering 25%): ${row.r25_reason || 'Limits Exceeded'}`);
                }
              });
            }
          });
        } else if (core.coreType === 'protection') {
          results.forEach((res: any) => {
            if (res.isPass === false && res.reason) {
              failureReasons.push(`Core ${core.coreNumber} (Protection): ${res.reason}`);
            }
          });
        } else if (core.coreType === 'ps') {
          results.forEach((res: any) => {
            if (res.isPass === false && res.reason) {
              failureReasons.push(`Core ${core.coreNumber} (PS): ${res.reason}`);
            }
          });
        }
      });

      const finalReason = failureReasons.length > 0
        ? [...new Set(failureReasons)].join(' | ')
        : "Accuracy Limits Exceeded";

      const extractedTypes = new Set<string>();
      failureReasons.forEach(r => {
        if (r.toLowerCase().includes('metering')) extractedTypes.add('METERING');
        else if (r.toLowerCase().includes('protection')) extractedTypes.add('PROTECTION');
        else if (r.toLowerCase().includes('ps')) extractedTypes.add('PS');
      });
      const uniqueTypes = Array.from(extractedTypes);
      const dynamicCoreType = uniqueTypes.length === 1 ? uniqueTypes[0] : (uniqueTypes.length > 1 ? 'Multiple' : 'COMPLETE UNIT');

      const payload = {
        orderId: transformer.orderId?._id || transformer.orderId,
        jobId: transformer.jobId,
        unitId: transformer.uniqueId,
        clientName: transformer.clientName || 'N/A',
        coreType: dynamicCoreType,
        testType: 'Secondary Testing',
        failureReason: finalReason,
        testData: transformer.testHistory?.secondary_test,
        requestedBy: 'Tester'
      };


      await axios.post(`/strict-approvals/request`, payload, { withCredentials: true });


      // Update transformer status so it waits for admin
      await axios.put(`/transformers/${transformer.uniqueId}/approve-stage`, {
        stage: 'secondary',
        nextStage: 'admin_review' // Sending to a pending admin review stage
      }, { withCredentials: true });

      toast.success("Strict Approval Requested! Reasons: " + finalReason);
      if (onEndTimer) await onEndTimer(); // Stop the CT timer on strict approval
      if (onRefreshOrders) onRefreshOrders();
      onBack();
    } catch (error) {
      console.error("Strict approval request failed", error);
      toast.error("Failed to request strict approval.");
    }
  };

  const selectedCoreConfig = transformer.cores.find(c => c.coreNumber === selectedCore);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Transformers
        </Button>
      </div>

      <div>
        <h2>Core Selection & Assignment</h2>
        <p className="text-gray-500 mt-1">Select which core to test and enter the core number</p>
      </div>

      {/* Transformer Info */}
      <Card className="p-6 bg-gray-50 border-gray-200">
        <h3 className="mb-4">Transformer Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Transformer Name</p>
            <p className="font-medium mt-1">{transformer.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Rating</p>
            <p className="font-medium mt-1">{transformer.rating}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Unique ID</p>
            <p className="font-medium mt-1">{transformer.uniqueId}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Nominal System Voltage</p>
            <p className="font-medium mt-1">{transformer.voltageRating || 'N/A'}</p>
          </div>
        </div>
      </Card>

      {/* Core Selection */}
      <Card className="p-6">
        <h3 className="mb-4">Select Core to Test</h3>
        <p className="text-sm text-gray-600 mb-4">
          This transformer has {transformer.cores.length} core(s). Click on a core to select it for testing.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {transformer.cores.map((core) => {
            // Keep the robust completion logic
            // Improved Completion Logic:
            // Check if any result exists where the internalCoreNo contains the suffix OR exactly matches a known pool ID for this index
            const results = transformer.testHistory?.secondary_test?.[`${core.coreType}_results`] || [];
            // Improved Completion Logic:
            // 1. Identify the applicable Core ID
            const typeCores = transformer.cores.filter(c => c.coreType === core.coreType);
            const typeIndex = typeCores.findIndex(c => c.coreNumber === core.coreNumber);
            const expectedId = transformer.availableCoreIdsPool?.[core.coreType]?.[typeIndex];
            const suffix = `-${String(core.coreNumber).padStart(3, '0')}`;
            const typeSeq = typeIndex + 1;
            const typeSuffix = `-${String(typeSeq).padStart(3, '0')}`;

            // Find ALL results that belong to this Core (by ID matching)
            const coreResults = results.filter((r: any) => {
              const id = r.internalCoreNo || r.coreId || '';
              return (expectedId && id === expectedId) ||
                id.endsWith(suffix) || id.includes(suffix) ||
                id.endsWith(typeSuffix) || id.includes(typeSuffix);
            });

            // 2. Check: Are there saved results for this core?
            let isCompleted = false;
            if (coreResults.length > 0) {
              const hasValue = (v: any) => v !== undefined && v !== null && v !== '';
              if (core.coreType === 'metering') {
                isCompleted = coreResults.every((res: any) =>
                  res.rows && res.rows.length > 0 && res.rows.every((row: any) =>
                    hasValue(row.r100) && hasValue(row.p100) && hasValue(row.r25) && hasValue(row.p25)
                  )
                );
              } else if (core.coreType === 'protection') {
                isCompleted = coreResults.every((res: any) =>
                  hasValue(res.ratioError100) &&
                  hasValue(res.resistance) &&
                  (hasValue(res.secondaryLimitingVoltage) || hasValue(res.secondaryLimitingVtg))
                );
              } else if (core.coreType === 'ps') {
                isCompleted = coreResults.every((res: any) =>
                  hasValue(res.turnRatioError) && hasValue(res.vk) && hasValue(res.iexVk)
                );
              } else {
                isCompleted = true;
              }
            }

            return (
              <Card
                key={core.coreNumber}
                className={`p-4 cursor-pointer transition-all ${selectedCore === core.coreNumber
                  ? 'ring-2 ring-red-500 ' + getCoreTypeColor(core.coreType)
                  : getCoreTypeColor(core.coreType) + ' hover:shadow-md'
                  } ${isCompleted ? 'bg-green-50' : ''}`}
                onClick={() => handleCoreSelect(core.coreNumber)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">Core {core.coreNumber}</span>
                      {/* Show Check if Selected OR Completed */}
                      {(selectedCore === core.coreNumber || isCompleted) && (
                        <CheckCircle className={`w-5 h-5 ${isCompleted ? 'text-green-600' : 'text-gray-400'}`} />
                      )}
                    </div>
                    <p className="text-sm font-medium mb-1">{getCoreTypeLabel(core.coreType)}</p>
                    <p className="text-xs text-gray-600">
                      Type: {core.coreType.toUpperCase()}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      {/* Core Number Entry (Dropdown) */}
      {selectedCore !== null && (
        <Card className="p-6 bg-yellow-50 border-yellow-200 mt-6">
          <h3 className="mb-4">Select Core ID</h3>
          <div className="max-w-md">
            <Label htmlFor="coreId">Internal Core No</Label>

            <select
              id="coreId"
              value={enteredCoreId}
              onChange={(e) => setEnteredCoreId(e.target.value)}
              className="mt-2 w-full p-2 rounded-md border border-gray-300 bg-white"
            >
              <option value="">-- Select Core ID --</option>
              {(() => {
                let pool: string[] = [];
                if (transformer.availableCoreIdsPool) {
                  const type = transformer.cores.find(c => c.coreNumber === selectedCore)?.coreType;
                  if (type === 'metering') pool = transformer.availableCoreIdsPool.metering;
                  else if (type === 'ps') pool = transformer.availableCoreIdsPool.ps;
                  else if (type === 'protection') pool = transformer.availableCoreIdsPool.protection;
                }

                const showList = [...pool];
                if (enteredCoreId && !showList.includes(enteredCoreId)) {
                  showList.unshift(enteredCoreId);
                }
                const uniqueList = Array.from(new Set(showList)).sort();

                return uniqueList.length > 0 ? (
                  uniqueList.map((id, idx) => (
                    <option key={idx} value={id}>{id}</option>
                  ))
                ) : (
                  <option disabled>No Available IDs found</option>
                );
              })()}
            </select>
            <p className="text-sm text-gray-600 mt-2">
              Select the Internal Core No. generated during the Core Test stage.
            </p>
          </div>

          {/* Helper Text if Pre-Selected */}
          {(() => {
            const typeFn = transformer.cores.find(c => c.coreNumber === selectedCore)?.coreType;

            const isExisting = transformer.testHistory?.secondary_test?.[(typeFn || 'metering') + '_results']?.some((r: any) =>
              (r.internalCoreNo === enteredCoreId) || (r.coreId === enteredCoreId)
            );

            if (isExisting) {
              return (
                <div className="mt-2 text-green-700 text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>This core has already been tested. ID auto-selected.</span>
                </div>
              )
            }
            return null;
          })()}

          <div className="mt-6">
            <Button
              onClick={handleStartTest}
              disabled={!enteredCoreId.trim()}
              className={`${transformer.testHistory?.secondary_test?.[(selectedCoreConfig?.coreType || 'metering') + '_results']?.some((r: any) =>
                (r.internalCoreNo === enteredCoreId) || (r.coreId === enteredCoreId)
              )
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
                } px-8`}
            >
              {(() => {
                const type = selectedCoreConfig?.coreType || 'metering';
                const results = transformer.testHistory?.secondary_test?.[type + '_results'] || [];

                // Fix: Must filter for ALL rows belonging to this Core ID, not just find the first one.
                const coreResults = results.filter((r: any) => (r.internalCoreNo === enteredCoreId) || (r.coreId === enteredCoreId));

                if (coreResults.length > 0) {
                  // Reuse Strict Check Logic for ALL rows
                  let isCompleted = false;

                  if (type === 'metering') {
                    isCompleted = coreResults.every((res: any) =>
                      res.rows && res.rows.length > 0 && res.rows.every((row: any) =>
                        row.r100 && row.p100 && row.r25 && row.p25
                      )
                    );
                  } else if (type === 'protection') {
                    isCompleted = coreResults.every((res: any) =>
                      res.ratioError100 &&
                      (res.protectionClass === '10P' || res.protectionClass === '15P' ? true : res.phaseError) &&
                      res.resistance &&
                      (res.secondaryLimitingVoltage || res.secondaryLimitingVtg) &&
                      res.excitationCurrent && res.compositeError && res.alf
                    );
                  } else if (type === 'ps') {
                    isCompleted = coreResults.every((res: any) =>
                      res.turnRatioError && res.resistance && res.vk &&
                      res.vkVal && res.iexVk && res.iex11Vk
                    );
                  }

                  return isCompleted ? "View Report" : "Complete Test";
                }
                return `Start New ${type.toUpperCase()} Test`;
              })()}
            </Button>
          </div>
        </Card>
      )}

      {/* Approval Section */}
      {isAllCoresCompleted && !hasFailures && (
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold text-green-900">Transformer Ready for Approval</h4>
              <p className="text-sm text-green-700">All {transformer.cores.length} core(s) have been successfully tested and verified within limits.</p>
            </div>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white gap-2 px-8"
              onClick={handleApproveTransformer}
            >
              <CheckCircle className="w-4 h-4" />
              Approve Transformer
            </Button>
          </div>
        </Card>
      )}

      {isAllCoresCompleted && hasFailures && (
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold text-red-900">Strict Approval Required</h4>
              <p className="text-sm text-red-700">One or more cores have failed the accuracy class limit. Admin approval is required.</p>
            </div>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white gap-2 px-8"
              onClick={handleStrictApproval}
            >
              <CheckCircle className="w-4 h-4" />
              Request Strict Approval
            </Button>
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="font-bold">i</span>
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Testing Guide</h4>
            <p className="text-sm text-blue-700 leading-relaxed">
              Verify the Core ID on the physical unit before starting.
              Green completed cards can be reviewed or edited at any time before final approval.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

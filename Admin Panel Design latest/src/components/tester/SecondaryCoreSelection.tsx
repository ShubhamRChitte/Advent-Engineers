import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Transformer } from './SecondaryTransformersList';

interface SecondaryCoreSelectionProps {
  transformer: Transformer;
  onCoreSelect: (coreNumber: number, coreType: string, enteredCoreId: string, uniqueId: string) => void;
  onBack: () => void;
}

export function SecondaryCoreSelection({ transformer: initialTransformer, onCoreSelect, onBack }: SecondaryCoreSelectionProps) {
  const [enteredCoreId, setEnteredCoreId] = useState('');
  const [selectedCore, setSelectedCore] = useState<number | null>(null);
  // Maintain local state for transformer to allow refreshing data
  const [transformer, setTransformer] = useState<Transformer>(initialTransformer);

  // Fetch latest data on mount to ensure testHistory is fresh
  useEffect(() => {
    const fetchFreshData = async () => {
      try {
        // Re-fetch to get updated testHistory (test status, core IDs)
        // Note: We used localhost:3002 in other files.
        const response = await fetch(`http://localhost:3002/api/transformers/${initialTransformer.uniqueId}`);
        if (response.ok) {
          const freshData = await response.json();
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
        onCoreSelect(selectedCore, core.coreType, enteredCoreId, transformer.uniqueId);
      }
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
            <p className="text-sm text-gray-500">Voltage Class</p>
            <p className="font-medium mt-1">{transformer.voltageClass}</p>
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

            // 2. Strict Check: Are there results AND are they fully filled?
            let isCompleted = false;
            if (coreResults.length > 0) {
              if (core.coreType === 'metering') {
                // Metering: Check r100, p100, r25, p25 for all rows
                isCompleted = coreResults.every((res: any) =>
                  res.rows && res.rows.length > 0 && res.rows.every((row: any) =>
                    row.r100 && row.p100 && row.r25 && row.p25
                  )
                );
              } else if (core.coreType === 'protection') {
                // Protection: Check all main test fields
                isCompleted = coreResults.every((res: any) =>
                  res.burden100_1 && res.burden100_2 && res.resistance &&
                  res.secondaryLimitingVtg && res.excitationCurrent && res.compositeError
                );
              } else if (core.coreType === 'ps') {
                // PS: Check all ps fields
                isCompleted = coreResults.every((res: any) =>
                  res.turnRatioError && res.resistance && res.vk &&
                  res.vkVal && res.iexVk && res.iex11Vk
                );
              } else {
                isCompleted = true; // Fallback for unknown types
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
            const targetSuffix = `-${String(selectedCore).padStart(3, '0')}`;

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
                      res.burden100_1 && res.burden100_2 && res.resistance &&
                      res.secondaryLimitingVtg && res.excitationCurrent && res.compositeError
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

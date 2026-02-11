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

    // Find which "Index" of this type this core is.
    // e.g. If I have M1, P1, M2.
    // M1 is 1st Metering core. M2 is 2nd Metering Core.
    // Filter all cores of this type, find index of current coreNumber.
    const coresOfType = transformer.cores.filter(c => c.coreType === type).sort((a, b) => a.coreNumber - b.coreNumber);
    const typeIndex = coresOfType.findIndex(c => c.coreNumber === coreNumber);

    if (typeIndex !== -1 && results[typeIndex]) {
      // Found a result at this index!
      const savedId = results[typeIndex].internalCoreNo || results[typeIndex].coreId; // Handle both fields just in case
      console.log(`Auto-selecting ID for Core ${coreNumber} (${type}):`, savedId);
      if (savedId) {
        setEnteredCoreId(savedId);
        return;
      }
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
          {transformer.cores.map((core) => (
            <Card
              key={core.coreNumber}
              className={`p-4 cursor-pointer transition-all ${selectedCore === core.coreNumber
                ? 'ring-2 ring-red-500 ' + getCoreTypeColor(core.coreType)
                : getCoreTypeColor(core.coreType) + ' hover:shadow-md'
                }`}
              onClick={() => handleCoreSelect(core.coreNumber)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">Core {core.coreNumber}</span>
                    {selectedCore === core.coreNumber && (
                      <CheckCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <p className="text-sm font-medium mb-1">{getCoreTypeLabel(core.coreType)}</p>
                  <p className="text-xs text-gray-600">
                    Type: {core.coreType.toUpperCase()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Core Number Entry (Dropdown) */}
      {selectedCore !== null && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
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
                  if (selectedCoreConfig?.coreType === 'metering') pool = transformer.availableCoreIdsPool.metering;
                  else if (selectedCoreConfig?.coreType === 'ps') pool = transformer.availableCoreIdsPool.ps;
                  else if (selectedCoreConfig?.coreType === 'protection') pool = transformer.availableCoreIdsPool.protection;
                }

                // ALSO include the ID currently assigned to *this* specific core of *this* transformer
                // (so if we re-open a saved report, the ID is still selectable)
                const showList = [...pool];
                if (enteredCoreId && !showList.includes(enteredCoreId)) {
                  showList.unshift(enteredCoreId);
                }

                // Deduplicate just in case
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

          {/* New Block: Helper Text if Pre-Selected */}
          {(() => {
            const isExisting = transformer.testHistory?.secondary_test?.[(selectedCoreConfig?.coreType || 'metering') + '_results']?.some((r: any) =>
              (r.internalCoreNo === enteredCoreId) || (r.coreId === enteredCoreId)
            );

            if (isExisting) {
              return (
                <div className="mt-2 text-green-700 text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  This core has already been tested. ID auto-selected.
                </div>
              );
            }
            return null;
          })()}

          {selectedCoreConfig && enteredCoreId.trim() && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-yellow-300">
              <p className="text-sm mb-2">
                <strong>Ready to test:</strong>
              </p>
              <p className="text-sm text-gray-700">
                Core {selectedCore} ({getCoreTypeLabel(selectedCoreConfig.coreType)}) - ID: {enteredCoreId}
              </p>
            </div>
          )}

          <div className="mt-6">
            <Button
              onClick={handleStartTest}
              disabled={!enteredCoreId.trim()}
              className={`${
                // Check if the CURRENTLY SELECTED ID has data
                transformer.testHistory?.secondary_test?.[(selectedCoreConfig?.coreType || 'metering') + '_results']?.some((r: any) =>
                  (r.internalCoreNo === enteredCoreId) || (r.coreId === enteredCoreId)
                )
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
                } px-8`}
            >
              {(() => {
                const isMetering = selectedCoreConfig?.coreType === 'metering';
                const isPs = selectedCoreConfig?.coreType === 'ps';
                const isProtection = selectedCoreConfig?.coreType === 'protection';

                let isExisting = false;
                const secHistory = transformer.testHistory?.secondary_test;

                if (secHistory) {
                  if (isMetering && secHistory.metering_results) {
                    isExisting = secHistory.metering_results.some((r: any) => r.internalCoreNo === enteredCoreId || r.coreId === enteredCoreId);
                  } else if (isPs && secHistory.ps_results) {
                    isExisting = secHistory.ps_results.some((r: any) => r.internalCoreNo === enteredCoreId || r.coreId === enteredCoreId);
                  } else if (isProtection && secHistory.protection_results) {
                    isExisting = secHistory.protection_results.some((r: any) => r.internalCoreNo === enteredCoreId || r.coreId === enteredCoreId);
                  }
                }

                return isExisting ? "View Report" : `Start New ${selectedCoreConfig?.coreType.toUpperCase()} Test`;
              })()}
            </Button>
            {/* Helper text for context */}
            <p className="text-xs text-gray-500 mt-2">
              {transformer.testHistory?.secondary_test?.[(selectedCoreConfig?.coreType || 'metering') + '_results']?.some((r: any) =>
                (r.internalCoreNo === enteredCoreId) || (r.coreId === enteredCoreId)
              )
                ? "Existing test data found. Click to view/edit."
                : "No data found for this specific ID. Click to start a fresh test."}
            </p>
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white">i</span>
          </div>
          <div>
            <h4 className="mb-1">Testing Workflow</h4>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li>Select which core you want to test from the options above</li>
              <li>Enter the physical core number/ID in the input field</li>
              <li>Click "Start Test" to proceed to the appropriate report</li>
              <li>The system will automatically open the correct report type based on core configuration</li>
            </ol>
          </div>
        </div>
      </Card>
    </div >
  );
}

import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Transformer } from './SecondaryTransformersList';

interface SecondaryCoreSelectionProps {
  transformer: Transformer;
  onCoreSelect: (coreNumber: number, coreType: string, enteredCoreId: string) => void;
  onBack: () => void;
}

export function SecondaryCoreSelection({ transformer, onCoreSelect, onBack }: SecondaryCoreSelectionProps) {
  const [enteredCoreId, setEnteredCoreId] = useState('');
  const [selectedCore, setSelectedCore] = useState<number | null>(null);

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
  };

  const handleStartTest = () => {
    if (selectedCore !== null && enteredCoreId.trim()) {
      const core = transformer.cores.find(c => c.coreNumber === selectedCore);
      if (core) {
        onCoreSelect(selectedCore, core.coreType, enteredCoreId);
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
              className={`p-4 cursor-pointer transition-all ${
                selectedCore === core.coreNumber
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

      {/* Core Number Entry */}
      {selectedCore !== null && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <h3 className="mb-4">Enter Core Number</h3>
          <div className="max-w-md">
            <Label htmlFor="coreId">Core Number / ID</Label>
            <Input
              id="coreId"
              placeholder="e.g., M-2082, PS-1660, PR-2001"
              value={enteredCoreId}
              onChange={(e) => setEnteredCoreId(e.target.value)}
              className="mt-2 bg-white"
            />
            <p className="text-sm text-gray-600 mt-2">
              Enter the physical core number that matches Core {selectedCore} in this transformer
            </p>
          </div>

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
              className="bg-red-600 hover:bg-red-700 px-8"
            >
              Start {selectedCoreConfig?.coreType.toUpperCase()} Test
            </Button>
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
    </div>
  );
}

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, PlayCircle, Loader2, CheckCircle, Eye } from 'lucide-react';
import { AfterPrimaryTransformer } from './AfterPrimaryTransformersList';

interface Order {
  _id: string;
  jobId: string;
  clientName: string;
  quantity: number;
  transformerQuantity?: number;
  assignedDate: string;
  deadline: string;
  status: string;
  priority: string;
}

interface CoreConfig {
  coreNumber: number;
  coreType: 'metering' | 'ps' | 'protection';
  coreId: string;
}

interface AfterPrimaryCoreSelectionProps {
  transformer: AfterPrimaryTransformer;
  order: Order;
  onSelectCore: (core: CoreConfig) => void;
  onBack: () => void;
}

export function AfterPrimaryCoreSelection({
  transformer: initialTransformer,
  order,
  onSelectCore,
  onBack,
}: AfterPrimaryCoreSelectionProps) {

  const [transformer, setTransformer] = useState<AfterPrimaryTransformer>(initialTransformer);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch latest transformer data to ensure status is up-to-date
  useEffect(() => {
    const fetchTransformerData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`http://localhost:3002/api/transformers/${initialTransformer.uniqueId}`, {
          withCredentials: true
        });
        if (response.data) {
          // Merge API response with prop structure if needed, or just assume response is sufficient.
          // However, to keep 'ratios' and other mapped fields correct, we might need to preserve some fields from 'initialTransformer'
          // or re-map them. The easiest viewing logic depends on 'testHistory'.
          setTransformer(prev => ({
            ...prev,
            testHistory: response.data.testHistory // Update history specifically
          }));
        }
      } catch (error) {
        console.error("Failed to refresh transformer data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransformerData();
  }, [initialTransformer.uniqueId]);


  const getCoreTypeColor = (type: string) => {
    switch (type) {
      case 'metering': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'ps': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'protection': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getCoreTypeLabel = (type: string) => {
    switch (type) {
      case 'metering': return 'Metering Core';
      case 'ps': return 'PS Core';
      case 'protection': return 'Protection Core';
      default: return type;
    }
  };

  const checkCoreStatus = (core: CoreConfig) => {
    const history = transformer.testHistory?.primary_test;
    if (!history) return 'pending';

    // Get expected ratios for this transformer
    const expectedRatios = transformer.ratios && transformer.ratios.length > 0 ? transformer.ratios : ['200/1'];

    if (core.coreType === 'metering') {
      const results = history.metering_results || [];
      // Filter for this core
      const coreResults = results.filter((r: any) => r.internalCoreNo === core.coreId || r.coreId === core.coreId);

      // Must have a result block for every expected ratio
      // (Simple check: count of results >= count of ratios. Better: check keys, but count is usually sufficient if created sequentially)
      if (coreResults.length < expectedRatios.length) return 'pending';

      // Check strict field completion
      for (const res of coreResults) {
        if (!res.rows || res.rows.length === 0) return 'pending';
        for (const row of res.rows) {
          // Check all required Metering columns
          if (!row.r100 || !row.p100 || !row.r25 || !row.p25) {
            return 'pending';
          }
        }
      }
      return 'completed';
    }

    if (core.coreType === 'ps') {
      const results = history.ps_results || [];
      const coreResults = results.filter((r: any) => r.internalCoreNo === core.coreId || r.coreId === core.coreId);

      if (coreResults.length < expectedRatios.length) return 'pending';

      for (const res of coreResults) {
        // Check all required PS columns
        // Note: vkVal is the 1.1Vk input
        if (!res.turnRatioError || !res.resistance || !res.vk || !res.vkVal || !res.iexVk || !res.iex11Vk) {
          return 'pending';
        }
      }
      return 'completed';
    }

    if (core.coreType === 'protection') {
      const results = history.protection_results || [];
      const coreResults = results.filter((r: any) => r.internalCoreNo === core.coreId || r.coreId === core.coreId);

      if (coreResults.length < expectedRatios.length) return 'pending';

      for (const res of coreResults) {
        // Check all required Protection columns
        if (!res.burden100_1 || !res.burden100_2 || !res.resistance || !res.secondaryLimitingVtg || !res.excitationCurrent || !res.compositeError) {
          return 'pending';
        }
      }
      return 'completed';
    }

    return 'pending';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Transformers
        </Button>
      </div>

      <div>
        <h2>Select Core for Testing</h2>
        <p className="text-gray-500 mt-1">Choose a core to begin after primary testing</p>
      </div>

      {/* Transformer Info */}
      <Card className="p-4 bg-gray-50 border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Job ID</p>
            <p className="font-medium mt-1">{order.jobId}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Transformer</p>
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
        </div>
      </Card>

      {/* Cores Grid */}
      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {transformer.cores.map((core) => {
            const status = checkCoreStatus(core);
            const isCompleted = status === 'completed';

            return (
              <Card
                key={core.coreNumber}
                className={`p-6 hover:shadow-lg transition-all cursor-pointer border-2 ${isCompleted ? 'border-green-400 bg-green-50' : getCoreTypeColor(core.coreType)}`}
                onClick={() => onSelectCore(core)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Core Number</p>
                    <h3 className="mt-1">{core.coreNumber}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={getCoreTypeColor(core.coreType)}>
                      {core.coreType.toUpperCase()}
                    </Badge>
                    {isCompleted && (
                      <Badge className="bg-green-600 text-white flex gap-1 items-center">
                        <CheckCircle className="w-3 h-3" /> Done
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Core Type</p>
                    <p className="font-medium">{getCoreTypeLabel(core.coreType)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Core ID (from Secondary)</p>
                    <p className="font-medium text-blue-600">{core.coreId}</p>
                  </div>
                </div>

                <Button
                  className={`w-full ${isCompleted ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCore(core);
                  }}
                >
                  {isCompleted ? (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      View Report
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Complete Test
                    </>
                  )}
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info Box */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white">i</span>
          </div>
          <div>
            <h4 className="mb-1">Auto-Loaded Core Information</h4>
            <p className="text-sm text-gray-700">
              All core IDs shown above were automatically loaded from the Secondary Test data.
              When you select a core, the appropriate report template will open with the core information pre-filled.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

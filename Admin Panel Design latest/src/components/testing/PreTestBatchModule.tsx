import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Minus, Settings, Loader2 } from 'lucide-react';
import { CoreTestingForm } from './CoreTestingForm';
import axios from 'axios';
import { toast } from 'sonner';

interface PreTestBatchModuleProps {
  onBack: () => void;
  user?: any;
  initialBatch?: any;
}

type Step = 'BATCH_CREATION' | 'TESTING';

export function PreTestBatchModule({ onBack, user, initialBatch }: PreTestBatchModuleProps) {
  const [currentStep, setCurrentStep] = useState<Step>('BATCH_CREATION');
  const [loading, setLoading] = useState(false);
  
  // Batch State
  const [batchData, setBatchData] = useState({
    batchId: '',
    vendorName: '',
    vendorId: '',
    coreType: 'Metering' as 'Metering' | 'Protection' | 'PS',
    numberOfCores: '10',
    turns: '10'
  });

  const incrementCores = () => {
    setBatchData(prev => ({
      ...prev,
      numberOfCores: String(Number(prev.numberOfCores || 0) + 1)
    }));
  };

  const decrementCores = () => {
    setBatchData(prev => {
      const val = Number(prev.numberOfCores || 0);
      if (val <= 1) return { ...prev, numberOfCores: '1' };
      return { ...prev, numberOfCores: String(val - 1) };
    });
  };

  const [vendors, setVendors] = useState<any[]>([]);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/core-vendors');
        if (res.data.success) {
          setVendors(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch vendors", err);
      }
    };
    fetchVendors();

    if (initialBatch) {
      setBatchData({
        batchId: initialBatch.batchId,
        vendorName: initialBatch.vendorName,
        vendorId: initialBatch.vendorId,
        coreType: initialBatch.coreType,
        numberOfCores: String(initialBatch.numberOfCores),
        turns: initialBatch.turns
      });
      setCurrentStep('TESTING');
    }
  }, [initialBatch]);

  const [customTurns, setCustomTurns] = useState('');

  // Handle Batch Creation — saves to backend, then transitions to CoreTestingForm
  // CoreTestingForm already handles Configuration → Testing internally
  const handleCreateBatch = async () => {
    if (!batchData.vendorName) {
      toast.error("Please enter Vendor Name");
      return;
    }
    const numCores = parseInt(String(batchData.numberOfCores));
    if (isNaN(numCores) || numCores < 1) {
      toast.error("Please enter a valid number of cores");
      return;
    }
    if (batchData.turns === 'Custom' && !customTurns) {
      toast.error("Please enter custom turns value");
      return;
    }

    setLoading(true);
    try {
      const finalTurns = batchData.turns === 'Custom' ? customTurns : batchData.turns;
      const payload = {
        ...batchData,
        numberOfCores: numCores,
        turns: finalTurns
      };

      const response = await axios.post('http://localhost:5001/api/pre-test-batches/create', payload, {
        withCredentials: true
      });

      // Store the full batch data including the server-generated batchId
      setBatchData({
        ...batchData,
        batchId: response.data.batchId,
        turns: finalTurns
      });

      // CoreTestingForm renders Configuration screen first (Metering/Protection/PS config),
      // then transitions to the testing table — exactly like order-based Core Tracking
      setCurrentStep('TESTING');
      toast.success(`Batch ${response.data.batchId} created! Configure testing parameters.`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create batch");
    } finally {
      setLoading(false);
    }
  };

  // ============ STEP 1: BATCH CREATION ============
  if (currentStep === 'BATCH_CREATION') {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4 mb-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Pre-Test Batch</h1>
            <p className="text-gray-500">Define a new batch of cores for initial testing</p>
          </div>
        </div>

        <Card className="p-8 shadow-xl border-t-4 border-t-blue-600">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold uppercase tracking-wider text-gray-500">Vendor Name</Label>
                <Select 
                  value={batchData.vendorId} 
                  onValueChange={(val: string) => {
                    const vendor = vendors.find(v => v._id === val);
                    if (vendor) {
                      setBatchData({
                        ...batchData, 
                        vendorId: vendor._id,
                        vendorName: vendor.vendor_name
                      });
                    }
                  }}
                >
                  <SelectTrigger className="h-12 text-lg border-gray-300">
                    <SelectValue placeholder="Select Vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor._id} value={vendor._id}>
                        {vendor.vendor_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold uppercase tracking-wider text-gray-500">Number of Cores</Label>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={(e) => { e.preventDefault(); decrementCores(); }}
                    disabled={Number(batchData.numberOfCores) <= 1}
                    className="h-12 w-12 border-gray-300 hover:bg-gray-100"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input 
                    type="text"
                    value={batchData.numberOfCores}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d+$/.test(val)) {
                        setBatchData({...batchData, numberOfCores: val});
                      }
                    }}
                    className="h-12 text-lg border-gray-300 text-center w-32"
                    placeholder="10"
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={(e) => { e.preventDefault(); incrementCores(); }}
                    className="h-12 w-12 border-gray-300 hover:bg-gray-100"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold uppercase tracking-wider text-gray-500">Core Type</Label>
                <Select 
                  value={batchData.coreType} 
                  onValueChange={(val: any) => setBatchData({...batchData, coreType: val})}
                >
                  <SelectTrigger className="h-12 text-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Metering">Metering</SelectItem>
                    <SelectItem value="Protection">Protection</SelectItem>
                    <SelectItem value="PS">PS Class</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold uppercase tracking-wider text-gray-500">Number of Turns</Label>
                <div className="flex gap-2">
                  <Select 
                    value={batchData.turns} 
                    onValueChange={(val) => setBatchData({...batchData, turns: val})}
                  >
                    <SelectTrigger className="h-12 text-lg flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 Turns</SelectItem>
                      <SelectItem value="20">20 Turns</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {batchData.turns === 'Custom' && (
                    <Input 
                      placeholder="Enter turns"
                      value={customTurns}
                      onChange={(e) => setCustomTurns(e.target.value)}
                      className="h-12 w-32"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-end gap-4">
            <Button variant="outline" onClick={onBack} className="h-12 px-8">Cancel</Button>
            <Button 
              onClick={handleCreateBatch} 
              disabled={loading}
              className="h-12 px-10 bg-blue-600 hover:bg-blue-700 gap-2 shadow-lg shadow-blue-200"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              Start Testing
            </Button>
          </div>
        </Card>

        {/* Workflow Info */}
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3 text-amber-800">
          <Settings className="w-5 h-5 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-bold mb-1">Batch Workflow:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Create batch → Configure testing parameters (BSAT, dimensions)</li>
              <li>Perform core testing using the standard testing interface</li>
              <li><strong>PASS</strong> cores → automatically added to Ready Stock</li>
              <li><strong>FAIL</strong> cores → marked for Return to Vendor</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // ============ STEP 2: CONFIGURATION + TESTING (handled by CoreTestingForm) ============
  // CoreTestingForm internally renders:
  //   1. Configuration screen first (MeteringCoreConfiguration / Protection config / PS config)
  //   2. After config is saved, transitions to the testing table
  // This is the SAME flow as order-based Core Tracking — no duplication.
  if (currentStep === 'TESTING') {
    const finalTurns = batchData.turns === 'Custom' ? customTurns : batchData.turns;

    const numCores = parseInt(String(batchData.numberOfCores)) || 0;

    // Construct a "virtual order" object that CoreTestingForm can consume
    // It only uses: _id, jobId, clientName, transformerQuantity, quantity, coreDetails
    const virtualOrder: any = {
      _id: batchData.batchId,
      jobId: batchData.batchId,
      clientName: `PRE-TEST: ${batchData.vendorName}`,
      transformerQuantity: numCores,
      quantity: numCores,
      coreDetails: [{ coreType: batchData.coreType, type: batchData.coreType }],
      status: 'In Progress',
      priority: 'Normal'
    };

    return (
      <div className="animate-in fade-in duration-500">
        <CoreTestingForm 
          order={virtualOrder}
          coreType={batchData.coreType}
          onBack={() => {
            setCurrentStep('BATCH_CREATION');
            onBack(); // Return to Ready Stock list
          }}
          user={user}
          isPreTest={true}
          batchData={{
            batchId: batchData.batchId,
            vendorName: batchData.vendorName,
            vendorId: batchData.vendorId,
            numberOfCores: numCores,
            turns: finalTurns
          }}
        />
      </div>
    );
  }

  return null;
}

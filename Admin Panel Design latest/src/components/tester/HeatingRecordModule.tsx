import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { FileText, Loader2, ArrowLeft, PlayCircle, CheckCircle } from 'lucide-react';
import { User } from '../../App';
import {
  HeatingRecord11KVCT,
  HeatingRecordBlock,
  ProcessStep,
} from './HeatingRecord11KVCT';
import { HeatingRecord33KVCT } from './HeatingRecord33KVCT';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

interface Order {
  _id: string;
  jobId: string;
  clientName: string;
  transformerType: string;
  nominalSystemVoltage: string | number;
  voltageRating?: string;
  quantity: number;
}

interface HeatingRecordModuleProps {
  user: User;
}

const DEFAULT_PROCESS_STEPS: ProcessStep[] = [
  { process: 'Heating 80°C',       duration: '12 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
  { process: 'Heating 90°C',       duration: '18 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
  { process: 'Cooling 60°C',       duration: '06 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
  { process: 'Oil Filling at 60°C', duration: '03 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
];

export function HeatingRecordModule({ user }: HeatingRecordModuleProps) {
  const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [currentTab, setCurrentTab] = useState<'assigned' | 'completed'>('assigned');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedTransformer, setSelectedTransformer] = useState<any | null>(null);
  const [transformersList, setTransformersList] = useState<any[]>([]);
  const [loadingTransformers, setLoadingTransformers] = useState(false);

  const [records, setRecords] = useState<HeatingRecordBlock[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // Use dedicated heating-record endpoint which has NO stage restriction.
      // /assigneed_orders filters by transformer.currentStage and misses orders
      // where transformers have already moved past 'heating' stage.
      const response = await axios.get("http://localhost:5001/api/heating-record/assigned-orders?type=CT", {
        withCredentials: true
      });

      // Show ALL CT orders — no voltage filtering here. The correct heating sheet
      // (11KV vs 33KV) is selected at render-time based on the voltage field.
      const eligibleOrders = response.data.success ? response.data.orders : [];

      const orderIds = eligibleOrders.map((o: any) => o._id);
      if (orderIds.length > 0) {
        const completedRes = await axios.post("http://localhost:5001/api/heating-record/completed-status", {
            orderIds,
            prefix: "CT"
        }, { withCredentials: true });
        
        const completedIds = completedRes.data.success ? completedRes.data.completedIds : [];
        setCompletedOrders(eligibleOrders.filter((o: any) => completedIds.includes(o._id)));
        setAssignedOrders(eligibleOrders.filter((o: any) => !completedIds.includes(o._id)));
      } else {
        setAssignedOrders([]);
        setCompletedOrders([]);
      }
    } catch (err) {
      console.error("API Error fetching heating record orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrder = async (order: Order) => {
    setSelectedOrder(order);
    setLoadingTransformers(true);
    try {
      const res = await axios.get(`http://localhost:5001/api/transformers/order/${order._id}`, { withCredentials: true });
      setTransformersList(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Failed to fetch transformers for order', e);
      setTransformersList([]);
    } finally {
      setLoadingTransformers(false);
    }
  };



  const handleSelectTransformer = async (t: any) => {
    setSelectedTransformer(t);
    const voltageStr = String((selectedOrder as any)?.voltageRating || selectedOrder?.nominalSystemVoltage || '');
    const transformerType = voltageStr.includes('33') ? '33KV_CT' : '11KV_CT';

    try {
      const res = await axios.get(`http://localhost:5001/api/heating-record/${selectedOrder!._id}/${transformerType}`, { withCredentials: true });
      if (res.data.success && res.data.data?.blocks?.length > 0) {
        const uiBlocks = res.data.data.blocks.map((b: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          transformerId: '',
          groupNo: b.groupNo || '',
          serialNumber: b.serialNumber || '',
          jobNo: selectedOrder!.jobId,
          leftInputs: ensureLeftInputs(b.leftInputs),
          startDate: b.startDate || new Date().toISOString().split('T')[0],
          processSteps: b.processSteps && b.processSteps.length > 0 ? b.processSteps.map((s: any) => ({
            process: s.process,
            duration: s.duration,
            startDate: s.startDate,
            startTime: s.startTime,
            completionDate: s.endDate,
            completionTime: s.endTime,
            remarks: s.remarks
          })) : JSON.parse(JSON.stringify(DEFAULT_PROCESS_STEPS)),
          preparedBy: b.preparedBy || user.name || '',
          productionManager: b.productionManager || '',
          verifiedBy: b.verifiedBy || '',
          date: b.date || new Date().toISOString().split('T')[0]
        }));
        setRecords(uiBlocks);
        return;
      }
    } catch (e) {
      console.error("Error fetching existing heating records:", e);
    }

    // Default: single fresh block pre-filled with selected transformer
    const block = makeNewBlock(selectedOrder!.jobId, 1, voltageStr);
    block.serialNumber = t.uniqueId || block.serialNumber;
    setRecords([block]);
  };

  const makeNewBlock = (_jobId: string, blockNumber: number, voltage: string): HeatingRecordBlock => {
    let processSteps = JSON.parse(JSON.stringify(DEFAULT_PROCESS_STEPS));
    
    if (voltage.includes('22') || voltage.includes('33')) {
      processSteps = [
        { process: 'Heating 80°C',       duration: '12 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
        { process: 'Heating 90°C',       duration: '24 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
        { process: 'Cooling 60°C',       duration: '06 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
        { process: 'Oil Filling at 60°C', duration: '04 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
      ];
    }
  
    return {
      id: Math.random().toString(36).substr(2, 9),
      transformerId: '',
      groupNo: `No.-${blockNumber}`,
      serialNumber: `${voltage}KV - CT = ${blockNumber}`,
      jobNo: '',
      leftInputs: Array(8).fill(null).map(() => ({ col1: "", col2: "" })),
      startDate: new Date().toISOString().split('T')[0] as string,
      processSteps: processSteps as ProcessStep[],
      preparedBy: user.name || '',
      productionManager: '',
      verifiedBy: '',
      date: new Date().toISOString().split('T')[0] as string,
    };
  };

  const handleAddBlock = () => {
    if (!selectedOrder) return;
    setRecords(prev => [...prev, makeNewBlock(selectedOrder.jobId, prev.length + 1, String(selectedOrder.nominalSystemVoltage))]);
  };


  const updateProcessStep = (blockId: string, processIndex: number, field: keyof ProcessStep, value: string) => {
    setRecords(records.map(block => {
      if (block.id !== blockId) return block;
      let updatedSteps = [...block.processSteps];
      
      // Strict future date validation
      let finalizedValue = value;
      if (field === 'startDate' || field === 'completionDate') {
        const today = new Date().toISOString().split('T')[0];
        if (value && value > today) {
          finalizedValue = today;
        }
      }

      updatedSteps[processIndex] = { ...updatedSteps[processIndex], [field]: finalizedValue };

      // Ripple Forward Logic
      const isStartTimeChange = (field === 'startDate' || field === 'startTime');
      const isEndTimeChange = (field === 'completionDate' || field === 'completionTime');

      if (isStartTimeChange || isEndTimeChange) {
        for (let i = processIndex; i < updatedSteps.length; i++) {
          const step = updatedSteps[i];
          const hoursMatch = step.duration.match(/(\d+)/);
          const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;

          if (i === processIndex) {
            if (isStartTimeChange) {
              if (step.startDate && step.startTime) {
                const start = new Date(`${step.startDate}T${step.startTime}`);
                const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
                updatedSteps[i] = {
                  ...step,
                  completionDate: end.toLocaleDateString('en-CA'),
                  completionTime: end.toTimeString().slice(0, 5)
                };
              }
            }
          } else {
            const prevStep = updatedSteps[i - 1];
            if (prevStep.completionDate && prevStep.completionTime) {
              const start = new Date(`${prevStep.completionDate}T${prevStep.completionTime}`);
              const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
              updatedSteps[i] = {
                ...step,
                startDate: start.toLocaleDateString('en-CA'),
                startTime: start.toTimeString().slice(0, 5),
                completionDate: end.toLocaleDateString('en-CA'),
                completionTime: end.toTimeString().slice(0, 5)
              };
            }
          }
        }
      }
      return { ...block, processSteps: updatedSteps };
    }));
  };

  const updateBlockField = (blockId: string, field: keyof HeatingRecordBlock, value: string) => {
    setRecords(records.map(block => {
      if (block.id !== blockId) return block;

      // Strict future date validation
      let finalizedValue = value;
      if (field === 'startDate' || field === 'date') {
        const today = new Date().toISOString().split('T')[0];
        if (value && value > today) {
          finalizedValue = today;
        }
      }

      return { ...block, [field]: finalizedValue };
    }));
  };

  const ensureLeftInputs = (inputs: any) => {
    const base = Array(8).fill(null).map(() => ({ col1: "", col2: "" }));
    if (!inputs) return base;
    return base.map((_, i) => ({
      col1: inputs[i]?.col1 || "",
      col2: inputs[i]?.col2 || ""
    }));
  };

  const handleSave = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      const voltageStr = String((selectedOrder as any).voltageRating || selectedOrder.nominalSystemVoltage || '');
      const transformerType = voltageStr.includes('33') ? '33KV_CT' : '11KV_CT';

      const blocksPayload = records.map(b => ({
        groupNo: b.groupNo,
        serialNumber: b.serialNumber,
        startDate: b.startDate,
        leftInputs: ensureLeftInputs(b.leftInputs),
        processSteps: b.processSteps.map(step => ({
          process: step.process,
          duration: step.duration,
          startDate: step.startDate,
          startTime: step.startTime,
          endDate: step.completionDate,
          endTime: step.completionTime,
          remarks: step.remarks
        })),
        preparedBy: b.preparedBy,
        productionManager: b.productionManager,
        verifiedBy: b.verifiedBy,
        date: b.date
      }));

      const payload = {
        orderId: selectedOrder._id,
        transformerType,
        blocks: blocksPayload
      };

      await axios.post("http://localhost:5001/api/heating-record", payload, { withCredentials: true });
      alert("Heating records saved successfully!");

      setSelectedTransformer(null);
      setRecords([]);
      await fetchOrders();
    } catch (e) {
      console.error("Error saving heating records", e);
      alert("Failed to save heating records. Ensure Transformer IDs are valid if required.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  // ==== 1. ORDER LIST VIEW ====
  if (!selectedOrder) {
    const displayedOrders = currentTab === 'assigned' ? assignedOrders : completedOrders;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
          <div>
            <h2>Heating Record [CT]</h2>
            <p className="text-gray-500 mt-1">Select an eligible 11KV or 33KV CT order to start recording heating processes.</p>
          </div>
          
          <Tabs value={currentTab} onValueChange={(val: string) => setCurrentTab(val as any)}>
            <TabsList>
              <TabsTrigger value="assigned">Assigned Orders</TabsTrigger>
              <TabsTrigger value="completed">Completed Records</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Card className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#003a70] text-white">
              <tr>
                <th className="p-4 text-left font-medium">Job ID</th>
                <th className="p-4 text-left font-medium">Client</th>
                <th className="p-4 text-left font-medium">Type &amp; Voltage</th>
                <th className="p-4 text-center font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedOrders.length > 0 ? (
                displayedOrders.map(order => (
                  <tr key={order._id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-bold">{order.jobId}</td>
                    <td className="p-4">{order.clientName}</td>
                    <td className="p-4">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-semibold">
                        {order.nominalSystemVoltage}KV {order.transformerType}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Button onClick={() => handleSelectOrder(order)} className={currentTab === 'completed' ? "bg-green-600 hover:bg-green-700" : "bg-[#003a70] hover:bg-[#002f5c]"}>
                        <FileText className="w-4 h-4 mr-2" />
                        {currentTab === 'completed' ? "View / Edit Record" : "Start Heating Record"}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    {currentTab === 'assigned' ? "No 11KV or 33KV CT orders assigned to you currently." : "No completed heating records found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    );
  }

  // ==== 2. TRANSFORMER LIST VIEW ====
  if (selectedOrder && !selectedTransformer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => { setSelectedOrder(null); setTransformersList([]); }} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Orders
          </Button>
          <div className="flex-1">
            <h2 className="text-xl font-bold">Transformers for {selectedOrder.jobId}</h2>
            <p className="text-gray-500 mt-1">Select a transformer unit to begin the Heating Record</p>
          </div>

        </div>

        <Card className="overflow-hidden">
          {loadingTransformers ? (
            <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
          ) : transformersList.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No transformers found for this order.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-[#003a70] text-white">
                <tr>
                  <th className="p-4 text-left font-medium">Unique ID</th>
                  <th className="p-4 text-left font-medium">Current Stage</th>
                  <th className="p-4 text-center font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {transformersList.map((t: any) => (
                  <tr key={t._id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-bold">{t.uniqueId}</td>
                    <td className="p-4">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">{t.currentStage || 'N/A'}</span>
                    </td>
                    <td className="p-4 text-center">
                      <Button size="sm" onClick={() => handleSelectTransformer(t)} className="bg-[#003a70] hover:bg-[#002f5c] gap-2">
                        <PlayCircle className="w-4 h-4" /> Start Record
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    );
  }

  // ==== 3. HEATING SHEET VIEW — delegated to respective components ====
  const commonProps = {
    records,
    saving,
    onBack: () => { setSelectedTransformer(null); setRecords([]); },
    onAddBlock: handleAddBlock,
    onSave: handleSave,
    onUpdateProcessStep: updateProcessStep,
    onUpdateBlockField: updateBlockField,
  };

  const voltage = String((selectedOrder as any).voltageRating || selectedOrder.nominalSystemVoltage || '').toLowerCase().replace(/\s/g, '');
  if (voltage.includes('11')) {
    return <HeatingRecord11KVCT {...commonProps} />;
  }
  return <HeatingRecord33KVCT {...commonProps} />;
}

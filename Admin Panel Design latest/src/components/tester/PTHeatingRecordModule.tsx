import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { FileText, Loader2, ArrowLeft, PlayCircle, CheckCircle } from 'lucide-react';
import { User } from '../../App';
import { HeatingRecord33KVPT, HeatingRecordBlock, ProcessStep } from './HeatingRecord33KVPT';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

interface Order {
  _id: string;
  jobId: string;
  clientName: string;
  transformerType: string;
  nominalSystemVoltage: string | number;
  voltageRating: string;
  quantity: number;
}

interface PTHeatingRecordModuleProps {
  user: User;
}

const DEFAULT_PROCESS_STEPS = [
  { process: 'Heating 80°C', duration: '12 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
  { process: 'V. Heating 90°C', duration: '24 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
  { process: 'V. Cooling 60°C', duration: '06 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
  { process: 'Oil Filling 60°C', duration: '04 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' }
];

export function PTHeatingRecordModule({ user }: PTHeatingRecordModuleProps) {
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
      // /assigneed_orders filters by transformer.currentStage = 'pt' and misses
      // orders where transformers have already moved to later stages.
      const response = await axios.get("http://localhost:3002/api/heating-record/assigned-orders?type=PT", {
        withCredentials: true
      });

      // Show ALL PT orders — no voltage filtering.
      const eligibleOrders = response.data.success ? response.data.orders : [];

      const orderIds = eligibleOrders.map((o: any) => o._id);
      if (orderIds.length > 0) {
        const completedRes = await axios.post("http://localhost:3002/api/heating-record/completed-status", {
            orderIds,
            prefix: "PT"
        }, { withCredentials: true });
        
        const completedIds = completedRes.data.success ? completedRes.data.completedIds : [];
        setCompletedOrders(eligibleOrders.filter((o: any) => completedIds.includes(o._id)));
        setAssignedOrders(eligibleOrders.filter((o: any) => !completedIds.includes(o._id)));
      } else {
        setAssignedOrders([]);
        setCompletedOrders([]);
      }
    } catch (err) {
      console.error("API Error fetching PT heating record orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOrder = async () => {
    if (!selectedOrder) return;
    try {
      await axios.put(`http://localhost:3002/api/heating-record/${selectedOrder._id}/approve`, {
        type: 'PT'
      }, { withCredentials: true });
      alert("Heating record approved successfully!");
      setSelectedOrder(null);
      setTransformersList([]);
      await fetchOrders();
    } catch (e) {
      console.error("Error approving order:", e);
      alert("Failed to approve order.");
    }
  };

  const handleSelectOrder = async (order: Order) => {
    setSelectedOrder(order);
    setLoadingTransformers(true);
    try {
      const res = await axios.get(`http://localhost:3002/api/transformers/order/${order._id}`, { withCredentials: true });
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

    // Try to load existing PT records
    try {
      const res = await axios.get(`http://localhost:3002/api/heating-record/${selectedOrder!._id}/33KV_PT`, {
        withCredentials: true
      });

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

    // Default initialization pre-filled with the selected transformer
    const today = new Date().toISOString().split('T')[0] as string;
    const block: HeatingRecordBlock = {
      id: Math.random().toString(36).substr(2, 9),
      transformerId: '',
      groupNo: `No.-1`,
      serialNumber: t.uniqueId || `33KV - PT = 1`,
      jobNo: selectedOrder!.jobId,
      leftInputs: Array(8).fill(null).map(() => ({ col1: "", col2: "" })),
      startDate: today,
      processSteps: (JSON.parse(JSON.stringify(DEFAULT_PROCESS_STEPS)) as ProcessStep[]),
      preparedBy: user.name || '',
      productionManager: '',
      verifiedBy: '',
      date: today,
    };
    setRecords([block]);
  };

  const addRecordBlock = () => {
    if (!selectedOrder) return;
    const today = new Date().toISOString().split('T')[0] as string;
    setRecords(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      transformerId: '',
      groupNo: `No.-${prev.length + 1}`,
      serialNumber: `33KV - PT = ${prev.length + 1}`,
      jobNo: selectedOrder.jobId,
      leftInputs: Array(8).fill(null).map(() => ({ col1: "", col2: "" })),
      startDate: today,
      processSteps: (JSON.parse(JSON.stringify(DEFAULT_PROCESS_STEPS)) as ProcessStep[]),
      preparedBy: user.name || '',
      productionManager: '',
      verifiedBy: '',
      date: today,
    }]);
  };

  const updateProcessStep = (blockId: string, processIndex: number, field: keyof ProcessStep, value: string) => {
    setRecords(records.map(block => {
      if (block.id !== blockId) return block;
      const newSteps = [...block.processSteps];
      newSteps[processIndex] = { ...newSteps[processIndex], [field]: value } as ProcessStep;
      return { ...block, processSteps: newSteps };
    }));
  };

  const updateBlockField = (blockId: string, field: keyof HeatingRecordBlock, value: string) => {
    setRecords(records.map(block => {
      if (block.id !== blockId) return block;
      return { ...block, [field]: value };
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
        transformerType: '33KV_PT',
        blocks: blocksPayload
      };

      await axios.post("http://localhost:3002/api/heating-record", payload, { withCredentials: true });
      alert("PT Heating records saved successfully!");
      
      setSelectedTransformer(null);
      setRecords([]);
      await fetchOrders();
    } catch (e) {
      console.error("Error saving PT heating records", e);
      alert("Failed to save PT heating records. Please try again.");
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
        <div className={`flex justify-between items-center p-6 rounded-xl border shadow-sm transition-colors duration-300 ${currentTab === 'completed' ? 'bg-green-50/50 border-green-200' : 'bg-gray-50/50 border-gray-200'}`}>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight uppercase">Heating Record [33KV PT]</h2>
            <p className="text-gray-600 mt-2 text-base">Select an eligible 33KV PT assigned order to log active heating records.</p>
          </div>
          
          <Tabs value={currentTab} onValueChange={(val: string) => setCurrentTab(val as any)} className="bg-white/60 p-1.5 rounded-xl border border-gray-200/50">
            <TabsList className="bg-transparent h-auto p-0 space-x-3">
              <TabsTrigger 
                value="assigned" 
                className={`px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide uppercase transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-[#003a70] data-[state=active]:shadow-md data-[state=active]:border-b-2 data-[state=active]:border-[#003a70] hover:bg-white/50`}
              >
                Assigned Orders
              </TabsTrigger>
              <TabsTrigger 
                value="completed" 
                className={`px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide uppercase transition-all duration-200 data-[state=active]:bg-green-100 data-[state=active]:text-green-800 data-[state=active]:shadow-md data-[state=active]:border-b-2 data-[state=active]:border-green-600 hover:bg-green-50/50`}
              >
                Completed Records
              </TabsTrigger>
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
                         33KV PT
                       </span>
                    </td>
                    <td className="p-4 text-center">
                      <Button onClick={() => handleSelectOrder(order)} className={currentTab === 'completed' ? "bg-green-600 hover:bg-green-700" : "bg-[#003a70] hover:bg-[#002f5c]"}>
                        <FileText className="w-4 h-4 mr-2" />
                        {currentTab === 'completed' ? "View / Edit Record" : "Open PT Heating Sheet"}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    {currentTab === 'assigned' ? "No 33KV PT orders assigned to you currently." : "No completed heating records found."}
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
            <p className="text-gray-500 mt-1">Select a PT unit to begin the Heating Record</p>
          </div>
          {currentTab === 'assigned' && (
            <Button size="sm" onClick={handleApproveOrder} className="bg-green-600 hover:bg-green-700 gap-2">
              <CheckCircle className="w-4 h-4" /> Approve Order
            </Button>
          )}
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

  // ==== 3. HEATING SHEET VIEW ====
  return (
    <HeatingRecord33KVPT
      records={records}
      saving={saving}
      onBack={() => { setSelectedTransformer(null); setRecords([]); }}
      onAddBlock={addRecordBlock}
      onSave={handleSave}
      onUpdateProcessStep={updateProcessStep}
      onUpdateBlockField={updateBlockField}
    />
  );
}

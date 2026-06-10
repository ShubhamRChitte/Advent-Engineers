import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { FileText, Loader2, ArrowLeft, PlayCircle, CheckCircle, Search } from 'lucide-react';
import { User } from '../../App';
import { HeatingRecord33KVPT, HeatingRecordBlock, ProcessStep } from './HeatingRecord33KVPT';

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface Order {
  _id: string;
  jobId: string;
  clientName: string;
  transformerType: string;
  nominalSystemVoltage: string | number;
  voltageRating: string;
  quantity: number;
  transformerQuantity?: number;
  assignedDate: string;
  deadline: string;
  status: string;
  priority: string;
  assignedUnitIds?: string[];
}

interface Transformer {
  _id: string;
  uniqueId: string;
  currentStage: string;
  testHistory?: any;
  orderId?: any;
}

interface PTHeatingRecordModuleProps {
  user: User;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_PROCESS_STEPS = [
  { process: 'Heating 80°C', duration: '12 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
  { process: 'V. Heating 90°C', duration: '24 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
  { process: 'V. Cooling 60°C', duration: '06 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
  { process: 'Oil Filling 60°C', duration: '04 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' }
];

// ─── Main Component ────────────────────────────────────────────────────────────

export function PTHeatingRecordModule({ user }: PTHeatingRecordModuleProps) {

  // Navigation state: orders → transformers → heating
  type View = 'orders' | 'transformers' | 'heating';
  const [view, setView] = useState<View>('orders');

  // Orders list state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected order / transformer
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedTransformer, setSelectedTransformer] = useState<Transformer | null>(null);

  // Transformers list state
  const [transformers, setTransformers] = useState<Transformer[]>([]);
  const [transformersLoading, setTransformersLoading] = useState(false);

  // Heating record state
  const [records, setRecords] = useState<HeatingRecordBlock[]>([]);
  const [saving, setSaving] = useState(false);
  const [isEditingRecord, setIsEditingRecord] = useState(false);

  // ── Fetch Orders (same endpoint as PT Testing) ──────────────────────────────

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/heating-record/assigned-orders?type=PT`, {
        withCredentials: true
      });
      setOrders(response.data.success ? response.data.orders : []);
    } catch (err) {
      console.error('Error fetching PT heating orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  // ── Fetch Transformers for selected order ───────────────────────────────────

  const fetchTransformers = async (order: Order) => {
    try {
      setTransformersLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/transformers/order/${order._id}`, {
        withCredentials: true
      });

      const dbTransformers: Transformer[] = response.data || [];

      // Active-only filter: exclude approved transformers (identical to PTTransformersList)
      const activeOnly = dbTransformers.filter((t: any) => {
        const approved = t.testHistory?.pt_test?.approved;
        return approved !== true && approved !== 'true';
      });

      // If assignedUnitIds exist, further restrict to assigned units
      const filtered = (!order.assignedUnitIds || order.assignedUnitIds.length === 0)
        ? activeOnly
        : activeOnly.filter(t =>
          order.assignedUnitIds!.some(id => id === t.uniqueId || id.includes(t.uniqueId))
        );

      setTransformers(filtered);
    } catch (err) {
      console.error('Error fetching transformers:', err);
    } finally {
      setTransformersLoading(false);
    }
  };

  // ── Handle Order Click ──────────────────────────────────────────────────────

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setView('transformers');
    fetchTransformers(order);
  };

  // ── Handle Transformer Click → Load or Init Heating Form ───────────────────

  const ensureLeftInputs = (inputs: any) => {
    const base = Array(8).fill(null).map(() => ({ col1: '', col2: '' }));
    if (!inputs) return base;
    return base.map((_, i) => ({
      col1: inputs[i]?.col1 || '',
      col2: inputs[i]?.col2 || ''
    }));
  };

  const handleTransformerClick = async (t: Transformer) => {
    setSelectedTransformer(t);
    setIsEditingRecord(false);

    const order = selectedOrder!;

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/heating-record/${order._id}/33KV_PT`,
        { withCredentials: true }
      );

      if (res.data.success && res.data.data?.blocks?.length > 0) {
        const uiBlocks = res.data.data.blocks.map((b: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          transformerId: '',
          groupNo: b.groupNo || '',
          serialNumber: b.serialNumber || '',
          jobNo: order.jobId,
          leftInputs: ensureLeftInputs(b.leftInputs),
          startDate: b.startDate || new Date().toISOString().split('T')[0] || '',
          processSteps: b.processSteps && b.processSteps.length > 0
            ? b.processSteps.map((s: any) => ({
              process: s.process,
              duration: s.duration,
              startDate: s.startDate,
              startTime: s.startTime,
              completionDate: s.endDate,
              completionTime: s.endTime,
              remarks: s.remarks
            }))
            : JSON.parse(JSON.stringify(DEFAULT_PROCESS_STEPS)),
          preparedBy: b.preparedBy || user.name || '',
          productionManager: b.productionManager || '',
          verifiedBy: b.verifiedBy || '',
          date: b.date || new Date().toISOString().split('T')[0] || ''
        }));
        setRecords(uiBlocks);
        setIsEditingRecord(true);
        setView('heating');
        return;
      }
    } catch (e) {
      console.error('Error fetching existing heating records:', e);
    }

    // Default: initialize fresh block
    const today = new Date().toISOString().split('T')[0] || '';
    const block: HeatingRecordBlock = {
      id: Math.random().toString(36).substr(2, 9),
      transformerId: '',
      groupNo: 'No.-1',
      serialNumber: t.uniqueId || '33KV - PT = 1',
      jobNo: order.jobId,
      leftInputs: Array(8).fill(null).map(() => ({ col1: '', col2: '' })),
      startDate: today,
      processSteps: JSON.parse(JSON.stringify(DEFAULT_PROCESS_STEPS)) as ProcessStep[],
      preparedBy: user.name || '',
      productionManager: '',
      verifiedBy: '',
      date: today
    };
    setRecords([block]);
    setView('heating');
  };

  // ── Approve transformer ─────────────────────────────────────────────────────

  const handleApproveTransformer = async (t: Transformer) => {
    try {
      if (!window.confirm(`Approve Heating Record for Transformer ${t.uniqueId}?`)) return;
      await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/pt-tests/transformer/${t._id}/approve`,
        {},
        { withCredentials: true }
      );
      alert('Transformer approved successfully!');
      
      // 1. Remove from local transformers list immediately
      setTransformers(prev => prev.filter(tr => tr._id.toString() !== t._id.toString()));
      
      // 2. Refresh parent orders list so the Order moves to "Completed" tab if all units are done
      fetchOrders();
    } catch (e: any) {
      console.error('Error approving transformer:', e);
      alert(e.response?.data?.message || 'Failed to approve transformer.');
    }
  };

  // ── Add record block ────────────────────────────────────────────────────────

  const addRecordBlock = () => {
    if (!selectedOrder) return;
    const today = new Date().toISOString().split('T')[0] || '';
    setRecords(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      transformerId: '',
      groupNo: `No.-${prev.length + 1}`,
      serialNumber: `33KV - PT = ${prev.length + 1}`,
      jobNo: selectedOrder.jobId,
      leftInputs: Array(8).fill(null).map(() => ({ col1: '', col2: '' })),
      startDate: today,
      processSteps: JSON.parse(JSON.stringify(DEFAULT_PROCESS_STEPS)) as ProcessStep[],
      preparedBy: user.name || '',
      productionManager: '',
      verifiedBy: '',
      date: today
    }]);
  };


  const updateProcessStep = (blockId: string, processIndex: number, field: keyof ProcessStep, value: string) => {
    setRecords(records.map(block => {
      if (block.id !== blockId) return block;
      let updatedSteps = [...block.processSteps];

      // Strict future date validation
      let finalizedValue = value;
      if (field === 'startDate' || field === 'completionDate') {
        const today = new Date().toISOString().split('T')[0] || '';
        if (value && value > today) finalizedValue = today;
      }

      updatedSteps[processIndex] = { ...updatedSteps[processIndex], [field]: finalizedValue } as ProcessStep;
      return { ...block, processSteps: updatedSteps };
    }));
  };

  const updateBlockField = (blockId: string, field: keyof HeatingRecordBlock, value: string) => {
    setRecords(records.map(block => {
      if (block.id !== blockId) return block;

      // Strict future date validation
      let finalizedValue = value;
      if (field === 'startDate' || field === 'date') {
        const today = new Date().toISOString().split('T')[0] || '';
        if (value && value > today) finalizedValue = today;
      }

      return { ...block, [field]: finalizedValue };
    }));
  };

  // ── Save heating record ─────────────────────────────────────────────────────

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

      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/heating-record`, payload, { withCredentials: true });
      alert(isEditingRecord ? 'PT Heating records updated successfully!' : 'PT Heating records saved successfully!');

      // Go back to transformers list
      setView('transformers');
      setSelectedTransformer(null);
      setRecords([]);
      setIsEditingRecord(false);
      // Re-fetch transformers to reflect any status changes
      await fetchTransformers(selectedOrder);
    } catch (e) {
      console.error('Error saving PT heating records', e);
      alert('Failed to save PT heating records. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ─── VIEW: HEATING RECORD FORM ──────────────────────────────────────────────

  if (view === 'heating') {
    return (
      <HeatingRecord33KVPT
        records={records}
        saving={saving}
        onBack={() => {
          setView('transformers');
          setSelectedTransformer(null);
          setRecords([]);
          setIsEditingRecord(false);
        }}
        onSave={handleSave}
        onUpdateProcessStep={updateProcessStep}
        onUpdateBlockField={updateBlockField}
        isEditing={isEditingRecord}
      />
    );
  }

  // ─── VIEW: TRANSFORMERS LIST ────────────────────────────────────────────────

  if (view === 'transformers' && selectedOrder) {
    const getStatusColor = (t: Transformer) => {
      const approved = t.testHistory?.pt_test?.approved;
      const hasPtTest = t.testHistory?.pt_test && Object.keys(t.testHistory.pt_test).length > 0;
      if (approved === true || approved === 'true') return 'bg-purple-100 text-purple-700';
      if (hasPtTest) return 'bg-green-100 text-green-700';
      return 'bg-blue-100 text-blue-700';
    };

    const getStatusLabel = (t: Transformer) => {
      const approved = t.testHistory?.pt_test?.approved;
      const hasPtTest = t.testHistory?.pt_test && Object.keys(t.testHistory.pt_test).length > 0;
      if (approved === true || approved === 'true') return 'Approved';
      if (hasPtTest) return 'Testing Completed';
      return 'Pending';
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setView('orders'); setSelectedOrder(null); setTransformers([]); }}
            className="gap-2 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Button>
          <div className="flex-1">
            <h2 className="text-xl font-bold">Transformers — {selectedOrder.jobId}</h2>
            <p className="text-gray-500 mt-1">Select a PT transformer to log heating records</p>
          </div>
        </div>

        {/* Order Summary */}
        <Card className="p-4 bg-gray-50 border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Job ID</p>
              <p className="font-medium mt-1">{selectedOrder.jobId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Client</p>
              <p className="font-medium mt-1">{selectedOrder.clientName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Transformers</p>
              <p className="font-medium mt-1">
                {selectedOrder.assignedUnitIds
                  ? <span className="text-blue-600">Assigned: {selectedOrder.assignedUnitIds.length}</span>
                  : <span>{selectedOrder.quantity || selectedOrder.transformerQuantity}</span>}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Order Date</p>
              <p className="font-medium mt-1">
                {new Date((selectedOrder as any).createdAt || selectedOrder.assignedDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>

        {/* Transformers Table */}
        <Card className="overflow-hidden">
          {transformersLoading ? (
            <div className="p-8 flex justify-center items-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading PT transformers...</span>
            </div>
          ) : transformers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No active PT transformers found for this order.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#003a70] text-white">
                  <tr>
                    <th className="p-4 font-medium">Unique ID</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 text-center font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transformers.map(t => {
                    const hasPtTest = t.testHistory?.pt_test && Object.keys(t.testHistory.pt_test).length > 0;
                    const isApproved = t.testHistory?.pt_test?.approved === true || t.testHistory?.pt_test?.approved === 'true';

                    return (
                      <tr key={t._id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-bold">{t.uniqueId}</td>
                        <td className="p-4">
                          <Badge className={getStatusColor(t)}>
                            {getStatusLabel(t)}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <Button
                              size="sm"
                              onClick={() => handleTransformerClick(t)}
                              className={isApproved
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-[#003a70] hover:bg-[#002f5c]'}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              {isApproved ? 'View Record' : 'Edit Record'}
                            </Button>

                            {hasPtTest && !isApproved && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 gap-2 whitespace-nowrap"
                                onClick={() => handleApproveTransformer(t)}
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approve
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // ─── VIEW: ORDERS LIST ──────────────────────────────────────────────────────

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low': return 'bg-green-100 text-green-700';
      case 'Medium': return 'bg-orange-100 text-orange-700';
      case 'High': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getOrderStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('completed')) return 'bg-green-100 text-green-700';
    if (s.includes('progress') || s.includes('testing')) return 'bg-yellow-100 text-yellow-700';
    return 'bg-blue-100 text-blue-700';
  };

  const filteredOrders = orders.filter(order => {
    const status = (order.status || '').toLowerCase();
    const isCompleted = status.includes('pt testing completed') || status === 'completed' || status.includes('completed');
    
    // Filter 1: Tab-based filtering
    if (activeTab === 'active' && isCompleted) return false;
    if (activeTab === 'completed' && !isCompleted) return false;

    // Filter 2: Search-based filtering
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (order.jobId || '').toLowerCase().includes(q) ||
      (order.clientName || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight uppercase">
            PT Heating Records
          </h2>
          <p className="text-gray-600 mt-1">
            Select an assigned PT order to log heating records for its transformers.
          </p>
        </div>
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg no-print">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'active' 
                ? 'bg-white text-[#003a70] shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Active Orders
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'completed' 
                ? 'bg-white text-[#003a70] shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Completed Orders
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300">
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{orders.length}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300">
          <p className="text-sm text-gray-600">In Progress</p>
          <p className="text-2xl font-bold text-yellow-700 mt-1">
            {orders.filter(o => (o.status || '').toLowerCase().includes('progress')).length}
          </p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-300">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-green-700 mt-1">
            {orders.filter(o => (o.status || '').toLowerCase().includes('completed')).length}
          </p>
        </Card>
      </div>

      {/* Search */}
      <div className="relative w-full md:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          placeholder="Search by Job ID or Client..."
          className="pl-9 w-full bg-white shadow-sm"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Orders Table */}
      <Card className="overflow-hidden">
        {ordersLoading ? (
          <div className="p-8 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading PT orders...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {orders.length === 0
              ? 'No PT orders currently assigned to you.'
              : 'No orders match your search.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 text-sm">Job ID</th>
                  <th className="text-left p-4 text-sm">Client</th>
                  <th className="text-center p-4 text-sm">Units</th>
                  <th className="text-left p-4 text-sm">Order Date</th>
                  <th className="text-center p-4 text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => {
                  const totalQty = order.quantity || order.transformerQuantity || 0;
                  const assignedQty = order.assignedUnitIds ? order.assignedUnitIds.length : totalQty;

                  return (
                    <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium">{order.jobId}</td>
                      <td className="p-4">{order.clientName}</td>
                      <td className="p-4 text-center">
                        <Badge variant="outline" className="bg-blue-50">
                          {assignedQty} / {totalQty}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm">
                        {new Date((order as any).createdAt || order.assignedDate).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-center">
                        <Button
                          size="sm"
                          onClick={() => handleOrderClick(order)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <PlayCircle className="w-4 h-4 mr-2" />
                          View Transformers
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

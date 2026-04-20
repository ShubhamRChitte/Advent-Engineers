import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { FileText, Loader2, ArrowLeft, PlayCircle, CheckCircle, Search } from 'lucide-react';
import { User } from '../../App';
import {
  UnifiedHeatingRecord,
  HeatingRecordBlock,
  ProcessStep,
} from './UnifiedHeatingRecord';
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

interface HeatingTrackingModuleProps {
  user: User;
}

const DEFAULT_PROCESS_STEPS: ProcessStep[] = [
  { process: 'Heating 80°C',       duration: '12 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
  { process: 'Heating 90°C',       duration: '18 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
  { process: 'Cooling 60°C',       duration: '06 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
  { process: 'Oil Filling at 60°C', duration: '03 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
];

export function HeatingTrackingModule({ user }: HeatingTrackingModuleProps) {
  const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [currentTab, setCurrentTab] = useState<'assigned' | 'completed'>('assigned');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedTransformer, setSelectedTransformer] = useState<any | null>(null);
  const [transformersList, setTransformersList] = useState<any[]>([]);
  const [loadingTransformers, setLoadingTransformers] = useState(false);

  const [record, setRecord] = useState<HeatingRecordBlock | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const typeParam = user.role === 'pt-tester' ? 'PT' : 'CT';
      const response = await axios.get(`http://localhost:5000/api/heating-record/assigned-orders?type=${typeParam}`, {
        withCredentials: true
      });

      const eligibleOrders = response.data.success ? response.data.orders : [];
      
      // Use the generic "heating-record/completed-status" check or just local filtering
      // For now keeping existing tab logic but focusing on inside the order
      const orderIds = eligibleOrders.map((o: any) => o._id);
      if (orderIds.length > 0) {
        const completedRes = await axios.post("http://localhost:5000/api/heating-record/completed-status", {
            orderIds,
            prefix: typeParam
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
      // Pass includeApproved=true if we are in the completed tab
      const includeApproved = currentTab === 'completed';
      const res = await axios.get(`http://localhost:5000/api/heating-record/transformers/${order._id}?includeApproved=${includeApproved}`, { withCredentials: true });
      setTransformersList(Array.isArray(res.data.transformers) ? res.data.transformers : []);
    } catch (e) {
      console.error('Failed to fetch transformers for order', e);
      setTransformersList([]);
    } finally {
      setLoadingTransformers(false);
    }
  };

  const handleSelectTransformer = async (t: any) => {
    setSelectedTransformer(t);
    const voltageStr = String(selectedOrder?.voltageRating || selectedOrder?.nominalSystemVoltage || '');
    
    // Check if transformer already has a record in its testHistory
    const existingRecord = t.testHistory?.heating_test;
    
    if (existingRecord) {
        setRecord({
            id: Math.random().toString(36).substr(2, 9),
            transformerId: t._id,
            groupNo: "No.-1",
            serialNumber: t.uniqueId,
            jobNo: t.jobId,
            leftInputs: existingRecord.leftInputs || Array(8).fill(null).map(() => ({ col1: "", col2: "" })),
            startDate: existingRecord.startDate || new Date().toISOString().split('T')[0],
            processSteps: existingRecord.processSteps?.length > 0 ? existingRecord.processSteps.map((s: any) => {
                // Determine values from new schema fields first, then fallback to old ones if they exist
                let sDate = s.startDate || '';
                let sTime = s.startTime || '';
                let eDate = s.completionDate || s.endDate || ''; 
                let eTime = s.completionTime || s.endTime || '';

                if (s.startDateTime) {
                    const dt = new Date(s.startDateTime);
                    if (!isNaN(dt.getTime())) {
                        sDate = dt.toLocaleDateString('en-CA');
                        sTime = dt.toTimeString().slice(0, 5);
                    }
                }
                if (s.completionDateTime) {
                    const dt = new Date(s.completionDateTime);
                    if (!isNaN(dt.getTime())) {
                        eDate = dt.toLocaleDateString('en-CA');
                        eTime = dt.toTimeString().slice(0, 5);
                    }
                }

                return {
                    process: s.process,
                    duration: s.duration,
                    startDate: sDate,
                    startTime: sTime,
                    completionDate: eDate,
                    completionTime: eTime,
                    remarks: s.remarks || ''
                };
            }) : getStepsForVoltage(voltageStr),
            preparedBy: existingRecord.preparedBy || user.name || '',
            productionManager: existingRecord.productionManager || '',
            verifiedBy: existingRecord.verifiedBy || '',
            date: existingRecord.date || new Date().toISOString().split('T')[0]
        });
    } else {
        // Create new fresh block
        const newBlock: HeatingRecordBlock = {
            id: Math.random().toString(36).substr(2, 9),
            transformerId: t._id,
            groupNo: "No.-1",
            serialNumber: t.uniqueId,
            jobNo: t.jobId,
            leftInputs: Array(8).fill(null).map(() => ({ col1: "", col2: "" })),
            startDate: new Date().toISOString().split('T')[0],
            processSteps: getStepsForVoltage(voltageStr),
            preparedBy: user.name || '',
            productionManager: '',
            verifiedBy: '',
            date: new Date().toISOString().split('T')[0],
        };
        setRecord(newBlock);
    }
  };

  const getStepsForVoltage = (voltage: string): ProcessStep[] => {
    const vStr = String(voltage);
    const isHighVoltage = vStr.includes('22') || vStr.includes('33');
    
    // PT Specific Logic
    if (user.role === 'pt-tester' || selectedOrder?.transformerType === 'PT') {
        const d2 = isHighVoltage ? '24 hrs' : '18 hrs';
        const d4 = isHighVoltage ? '04 hrs' : '03 hrs';
        return [
          { process: 'Heating at 90°C (Voltage applied)', duration: '12 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
          { process: 'Heating at 90°C (Voltage applied)', duration: d2, startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
          { process: 'Cooling at 60°C', duration: '06 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
          { process: 'Oil Filling at 60°C', duration: d4, startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' }
        ];
    }

    // Existing CT Logic
    if (isHighVoltage) {
        return [
          { process: 'Heating 80°C',       duration: '12 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
          { process: 'Heating 90°C',       duration: '24 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
          { process: 'Cooling 60°C',       duration: '06 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
          { process: 'Oil Filling at 60°C', duration: '04 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
        ];
    }
    // Default to 11kV settings or DEFAULT_PROCESS_STEPS
    return JSON.parse(JSON.stringify(DEFAULT_PROCESS_STEPS));
  };


  const updateProcessStep = (_blockId: string, processIndex: number, field: keyof ProcessStep, value: string) => {
    if (!record) return;
    let newSteps = [...record.processSteps];
    newSteps[processIndex] = { ...newSteps[processIndex], [field]: value };
    
    // Ripple Forward Logic
    const isStartTimeChange = (field === 'startDate' || field === 'startTime');
    const isEndTimeChange = (field === 'completionDate' || field === 'completionTime');

    if (isStartTimeChange || isEndTimeChange) {
      for (let i = processIndex; i < newSteps.length; i++) {
        const step = newSteps[i];
        const hoursMatch = step.duration.match(/(\d+)/);
        const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;

        // If we are at the step that was edited
        if (i === processIndex) {
          if (isStartTimeChange) {
            // Edited Start -> Update current step completion
            if (step.startDate && step.startTime) {
              const start = new Date(`${step.startDate}T${step.startTime}`);
              const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
              newSteps[i] = {
                ...step,
                completionDate: end.toLocaleDateString('en-CA'),
                completionTime: end.toTimeString().slice(0, 5)
              };
            }
          }
          // If edited completion, we just proceed to ripple to NEXT step
        } else {
          // Rippling subsequent steps: Start = Previous step's completion
          const prevStep = newSteps[i - 1];
          if (prevStep.completionDate && prevStep.completionTime) {
            const start = new Date(`${prevStep.completionDate}T${prevStep.completionTime}`);
            const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
            newSteps[i] = {
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
    setRecord({ ...record, processSteps: newSteps });
  };

  const updateBlockField = (_blockId: string, field: keyof HeatingRecordBlock, value: any) => {
    if (!record) return;
    setRecord({ ...record, [field]: value });
  };

  const handleSave = async (isApprove: boolean = false) => {
    if (!selectedOrder || !selectedTransformer || !record) return;
    setSaving(true);
    try {
      const payload = {
        processSteps: record.processSteps.map(step => {
          let startDateTime = null;
          let completionDateTime = null;

          if (step.startDate && step.startTime) {
              const dt = new Date(`${step.startDate}T${step.startTime}`);
              if (!isNaN(dt.getTime())) startDateTime = dt.toISOString();
          }
          if (step.completionDate && step.completionTime) {
              const dt = new Date(`${step.completionDate}T${step.completionTime}`);
              if (!isNaN(dt.getTime())) completionDateTime = dt.toISOString();
          }

          return {
            process: step.process,
            duration: step.duration,
            startDateTime: startDateTime,
            completionDateTime: completionDateTime,
            startDate: step.startDate,
            startTime: step.startTime,
            completionDate: step.completionDate,
            completionTime: step.completionTime,
            remarks: step.remarks
          };
        }),
        preparedBy: record.preparedBy,
        productionManager: record.productionManager,
        verifiedBy: record.verifiedBy,
        leftInputs: record.leftInputs,
        isApproveCall: isApprove
      };

      const res = await axios.post(`http://localhost:5000/api/heating-record/save/${selectedTransformer.uniqueId}`, payload, { withCredentials: true });
      
      if (res.data.success) {
          alert(isApprove ? "Heating Approved Successfully!" : "Heating Record Saved Successfully!");
          
          // Refresh transformers list to ensure local state has newest testHistory
          if (selectedOrder) {
            handleSelectOrder(selectedOrder);
          }

          if (isApprove) {
              setSelectedTransformer(null);
              setRecord(null);
          }
      }
    } catch (e: any) {
      console.error("Error saving heating records", e);
      alert(e.response?.data?.message || "Failed to save records.");
    } finally {
      setSaving(false);
    }
  };

  const handleApproveByUniqueId = async (uniqueId: string) => {
    if (!window.confirm("Are you sure you want to approve this heating record and move it to Final Test?")) return;
    try {
      setSaving(true);
      await axios.post(`http://localhost:5000/api/heating-record/save/${uniqueId}`, {
        isApproveCall: true
      }, { withCredentials: true });
      alert("Heating Approved Successfully! Transformer sent to Final Stage.");
      if (selectedOrder) handleSelectOrder(selectedOrder);
    } catch (e: any) {
      console.error("Error approving heating record", e);
      alert(e.response?.data?.message || "Failed to approve record.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  // ==== 1. ORDER LIST VIEW ====
  if (!selectedOrder) {
    const displayedOrders = (currentTab === 'assigned' ? assignedOrders : completedOrders).filter(order => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        (order.jobId || '').toLowerCase().includes(q) ||
        (order.clientName || '').toLowerCase().includes(q)
      );
    });

    return (
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight uppercase">
              Heating Section Tracking
            </h2>
            <p className="text-gray-600 mt-1">
              Select an order to manage heating records for units approved in Primary Test.
            </p>
          </div>
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg no-print">
            <button
              onClick={() => setCurrentTab('assigned')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentTab === 'assigned' 
                  ? 'bg-white text-[#003a70] shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Active Testing
            </button>
            <button
              onClick={() => setCurrentTab('completed')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentTab === 'completed' 
                  ? 'bg-white text-[#003a70] shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Completed Testing
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300">
            <p className="text-sm text-gray-600">Total Orders</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{assignedOrders.length + completedOrders.length}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300">
            <p className="text-sm text-gray-600">In Progress</p>
            <p className="text-2xl font-bold text-yellow-700 mt-1">{assignedOrders.length}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-300">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{completedOrders.length}</p>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search Job ID or Client..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Orders Table Container */}
        <Card className="overflow-hidden border-gray-200 shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#003a70] text-white">
                <tr>
                  <th className="p-4 text-sm font-semibold uppercase tracking-wider">Job ID</th>
                  <th className="p-4 text-sm font-semibold uppercase tracking-wider">Client</th>
                  <th className="p-4 text-sm font-semibold uppercase tracking-wider">Type & Voltage</th>
                  <th className="p-4 text-center text-sm font-semibold uppercase tracking-wider whitespace-nowrap">Quantity</th>
                  <th className="p-4 text-center text-sm font-semibold uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedOrders.length > 0 ? (
                  displayedOrders.map(order => (
                    <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <span className="font-mono font-bold text-blue-900">{order.jobId}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                            <span className="text-blue-600 text-xs font-bold">{order.clientName.charAt(0)}</span>
                          </div>
                          <span className="text-gray-700 font-medium">{order.clientName}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-semibold px-3 py-1">
                          {order.voltageRating || (order.nominalSystemVoltage ? `${order.nominalSystemVoltage}KV` : "N/A")} {order.transformerType}
                        </Badge>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {order.quantity} Units
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <Button 
                          size="sm" 
                          onClick={() => handleSelectOrder(order)} 
                          className={currentTab === 'completed' 
                            ? "bg-green-600 hover:bg-green-700 shadow-sm" 
                            : "bg-[#003a70] hover:bg-[#002f5c] shadow-sm"
                          }
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          {currentTab === 'completed' ? "View Transformers" : "Manage Units"}
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <div className="flex flex-col items-center">
                        <Search className="w-10 h-10 text-gray-300 mb-2" />
                        <p className="text-gray-500 font-medium">
                          {searchQuery ? "No matching orders found." : (currentTab === 'assigned' ? "No active primary-approved units found." : "No completed heating records found.")}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  // ==== 2. TRANSFORMER LIST VIEW ====
  if (selectedOrder && !selectedTransformer) {
    return (
      <div className="space-y-6">
        {/* Sub-header with Back Button */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <Button variant="outline" size="sm" onClick={() => { setSelectedOrder(null); setTransformersList([]); }} className="gap-2 border-gray-300 hover:bg-gray-50 shrink-0">
            <ArrowLeft className="w-4 h-4" /> Back to Orders
          </Button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 uppercase">Transformers for {selectedOrder.jobId}</h2>
            <p className="text-gray-500 mt-1 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Showing units approved in Primary Test. Each unit must be approved independently.
            </p>
          </div>
        </div>

        {/* Transformers Table Container */}
        <Card className="overflow-hidden border-gray-200 shadow-md">
          {loadingTransformers ? (
            <div className="p-12 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
              <p className="animate-pulse font-medium">Loading transformers...</p>
            </div>
          ) : transformersList.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium">No units found</p>
              <p className="text-sm">No primary-approved transformers were found for this order.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#003a70] text-white">
                  <tr>
                    <th className="p-4 text-sm font-semibold uppercase tracking-wider">Unique ID</th>
                    <th className="p-4 text-sm font-semibold uppercase tracking-wider">Testing Status</th>
                    <th className="p-4 text-center text-sm font-semibold uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transformersList.map((t: any) => {
                    const hStatus = t.testHistory?.heating_test?.status || 'Pending';
                    const isApproved = hStatus === 'Approved';
                    const isCompleted = hStatus === 'Completed';
                    
                    const pSteps = t.testHistory?.heating_test?.processSteps || [];
                    const isFilled = pSteps.length >= 4 && pSteps.every((s: any) => 
                      s.startDate && s.startTime && (s.completionDate || s.endDate) && (s.completionTime || s.endTime)
                    );

                    return (
                      <tr key={t._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <span className="font-mono font-bold text-blue-900 text-base">{t.uniqueId}</span>
                        </td>

                        <td className="p-4">
                          <Badge 
                            variant={isApproved ? "default" : "outline"}
                            className={`font-semibold px-3 py-1 ${
                                isApproved ? 'bg-green-600 hover:bg-green-600 text-white border-transparent' : 
                                isCompleted || isFilled ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-yellow-50 text-yellow-700 border-yellow-200'
                            }`}
                          >
                            {isApproved ? 'Approved & Finalized' : (isFilled || isCompleted ? 'Ready for Approval' : (hStatus === 'In Progress' ? 'Saved (In Progress)' : hStatus))}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center gap-3">
                            {(isFilled || isCompleted) && !isApproved && (
                              <Button
                                size="sm"
                                onClick={() => handleApproveByUniqueId(t.uniqueId)}
                                className="bg-green-600 hover:bg-green-700 font-bold shadow-sm"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" /> Approve
                              </Button>
                            )}
                            
                            <Button 
                                size="sm" 
                                onClick={() => handleSelectTransformer(t)} 
                                className={`${isApproved ? 'bg-green-600 hover:bg-green-700' : 'bg-[#003a70] hover:bg-[#002f5c]'} gap-2 font-bold shadow-sm transition-all`}
                            >
                              <PlayCircle className="w-4 h-4" />
                              {isApproved ? "View Data" : (isFilled ? "Edit Data" : (hStatus === 'Pending' ? "Start Reading" : "Continue"))}
                            </Button>

                            {isApproved && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`/admin/report/${t._id}?type=heating`, '_blank')}
                                className="border-green-600 text-green-600 hover:bg-green-50 gap-2 font-bold"
                              >
                                <FileText className="w-4 h-4" />
                                Report
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

  // ==== 3. UNIFIED HEATING SHEET VIEW ====
  const voltage = String(selectedOrder?.voltageRating || selectedOrder?.nominalSystemVoltage || '');
  
  if (selectedOrder && selectedTransformer && record) {
      return (
        <UnifiedHeatingRecord
            voltage={voltage}
            type={selectedOrder.transformerType || (user.role === 'pt-tester' ? 'PT' : 'CT')}
            record={record}
            saving={saving}
            onBack={() => { setSelectedTransformer(null); setRecord(null); }}
            onSave={handleSave}
            onUpdateProcessStep={updateProcessStep}
            onUpdateBlockField={updateBlockField}
            readOnly={selectedTransformer.testHistory?.heating_test?.status === 'Approved' || selectedTransformer.testHistory?.heating_test?.status === 'Completed' || currentTab === 'completed'}
        />
      );
  }

  return null;
}


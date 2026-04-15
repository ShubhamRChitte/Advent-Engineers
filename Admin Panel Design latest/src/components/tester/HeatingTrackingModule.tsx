import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { FileText, Loader2, ArrowLeft, PlayCircle, CheckCircle } from 'lucide-react';
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
      const response = await axios.get("http://localhost:3002/api/heating-record/assigned-orders?type=CT", {
        withCredentials: true
      });

      const eligibleOrders = response.data.success ? response.data.orders : [];
      
      // Use the generic "heating-record/completed-status" check or just local filtering
      // For now keeping existing tab logic but focusing on inside the order
      const orderIds = eligibleOrders.map((o: any) => o._id);
      if (orderIds.length > 0) {
        const completedRes = await axios.post("http://localhost:3002/api/heating-record/completed-status", {
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
      // Pass includeApproved=true if we are in the completed tab
      const includeApproved = currentTab === 'completed';
      const res = await axios.get(`http://localhost:3002/api/heating-record/transformers/${order._id}?includeApproved=${includeApproved}`, { withCredentials: true });
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
    if (vStr.includes('22') || vStr.includes('33')) {
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

      const res = await axios.post(`http://localhost:3002/api/heating-record/save/${selectedTransformer.uniqueId}`, payload, { withCredentials: true });
      
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
      await axios.post(`http://localhost:3002/api/heating-record/save/${uniqueId}`, {
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
    const displayedOrders = currentTab === 'assigned' ? assignedOrders : completedOrders;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
          <div>
            <h2 className="text-xl font-bold">Heating Section Tracking</h2>
            <p className="text-gray-500 mt-1">Select an order to manage heating records for individual transformers.</p>
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
                <th className="p-4 text-left font-medium text-sm">Job ID</th>
                <th className="p-4 text-left font-medium text-sm">Client</th>
                <th className="p-4 text-left font-medium text-sm">Type &amp; Voltage</th>
                <th className="p-4 text-center font-medium text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedOrders.length > 0 ? (
                displayedOrders.map(order => (
                  <tr key={order._id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-bold text-sm">{order.jobId}</td>
                    <td className="p-4 text-sm">{order.clientName}</td>
                    <td className="p-4">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                        {order.nominalSystemVoltage}KV {order.transformerType}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Button size="sm" onClick={() => handleSelectOrder(order)} className={currentTab === 'completed' ? "bg-green-600 hover:bg-green-700" : "bg-[#003a70] hover:bg-[#002f5c]"}>
                        <FileText className="w-4 h-4 mr-2" />
                        {currentTab === 'completed' ? "View Transformers" : "Manage Units"}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500 text-sm">
                    {currentTab === 'assigned' ? "No orders with primary-approved units found." : "No completed heating records found."}
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
            <p className="text-gray-500 mt-1 text-sm">Showing only units approved in Primary Test. Each unit must be approved independently.</p>
          </div>
        </div>

        <Card className="overflow-hidden">
          {loadingTransformers ? (
            <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
          ) : transformersList.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No primary-approved transformers found for this order.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-[#003a70] text-white">
                <tr>
                  <th className="p-4 text-left font-medium text-sm">Unique ID</th>
                  <th className="p-4 text-left font-medium text-sm">Internal S.No</th>
                  <th className="p-4 text-left font-medium text-sm">Status</th>
                  <th className="p-4 text-center font-medium text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {transformersList.map((t: any) => {
                  const hStatus = t.testHistory?.heating_test?.status || 'Pending';
                  const isApproved = hStatus === 'Approved';
                  
                  // Check if all 4 mandatory process steps have date and time filled
                  const pSteps = t.testHistory?.heating_test?.processSteps || [];
                  const isFilled = pSteps.length >= 4 && pSteps.every((s: any) => 
                    s.startDate && s.startTime && (s.completionDate || s.endDate) && (s.completionTime || s.endTime)
                  );

                  return (
                    <tr key={t._id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-bold text-sm">{t.uniqueId}</td>
                      <td className="p-4 text-sm">{t.internalCoreNo || 'N/A'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            isApproved ? 'bg-green-100 text-green-800' : 
                            hStatus === 'In Progress' || hStatus === 'Completed' || isFilled ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                          {isApproved ? 'Approved' : (isFilled ? 'Ready for Approval' : (hStatus === 'In Progress' ? 'Saved (In Progress)' : hStatus))}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          {(isFilled || hStatus === 'Completed') && !isApproved && (
                            <Button
                              size="sm"
                              onClick={() => {
                                // We need a way to approve from here. 
                                // handleSave(true) requires the 'record' state to be set.
                                // So we'll first select the transformer and then trigger approve, 
                                // but a better way is to add a dedicated handleApproveToList function.
                                handleSelectTransformer(t).then(() => {
                                  // This is tricky because React state updates are async.
                                  // Let's use a simpler approach: add a handleApproveByUniqueId.
                                  handleApproveByUniqueId(t.uniqueId);
                                });
                              }}
                              className="bg-green-600 hover:bg-green-700 font-medium"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" /> Approve
                            </Button>
                          )}
                          
                          <Button 
                              size="sm" 
                              onClick={() => handleSelectTransformer(t)} 
                              className={`${isApproved ? 'bg-green-600 hover:bg-green-700' : 'bg-[#003a70] hover:bg-[#002f5c]'} gap-2 font-medium`}
                          >
                            <PlayCircle className="w-4 h-4" />
                            {isApproved ? "View Data" : (isFilled ? "Edit Data" : (hStatus === 'Pending' ? "Start Reading" : "Continue"))}
                          </Button>

                          {isApproved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`/admin/report/${t._id}?type=heating`, '_blank')}
                              className="border-green-600 text-green-600 hover:bg-green-50 gap-2"
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
            type="CT"
            record={record}
            saving={saving}
            onBack={() => { setSelectedTransformer(null); setRecord(null); }}
            onSave={handleSave}
            onUpdateProcessStep={updateProcessStep}
            onUpdateBlockField={updateBlockField}
            readOnly={selectedTransformer.testHistory?.heating_test?.status === 'Approved' || currentTab === 'completed'}
        />
      );
  }

  return null;
}


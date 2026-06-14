import { useState, useEffect } from 'react';
import axios from 'axios';
import { User } from '../../App';
import { Loader2 } from 'lucide-react';
import {
  UnifiedHeatingRecord,
  HeatingRecordBlock,
  ProcessStep,
} from './UnifiedHeatingRecord';

interface Order {
    _id: string;
    jobId: string;
    transformerType: string;
    nominalSystemVoltage: string | number;
    voltageRating?: string;
}

interface Transformer {
    _id: string;
    uniqueId: string;
    status: string;
    currentStage: string;
}

interface HeatingTrackingReportProps {
  order: Order;
  transformer: Transformer;
  user: User;
  onBack: () => void;
}

const DEFAULT_PROCESS_STEPS: ProcessStep[] = [
  { process: 'Heating 80°C',       duration: '12 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
  { process: 'V. Heating 90°C',    duration: '18 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
  { process: 'V. Cooling 60°C',    duration: '06 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
  { process: 'Oil Filling at 60°C', duration: '03 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
];

export function HeatingTrackingReport({ order, transformer, user, onBack }: HeatingTrackingReportProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [record, setRecord] = useState<HeatingRecordBlock | null>(null);

  const deviceType = order.transformerType === 'CT' ? 'CT' : 'PT';

  useEffect(() => {
    fetchHeatingRecord();
  }, [order, transformer]);

  const fetchHeatingRecord = async () => {
    setLoading(true);
    try {
      // Use the transformer-specific lookup from the unified backend logic
      const res = await axios.get(`/heating-record/transformers/${order._id}`, {
        withCredentials: true
      });

      const dbTransformer = res.data.transformers?.find((t: any) => t._id === transformer._id);
      const existingRecord = dbTransformer?.processHistory?.heatingRecord?.[0];

      if (existingRecord) {
        setRecord({
            id: crypto.randomUUID(),
            transformerId: dbTransformer._id,
            groupNo: "No.-1",
            serialNumber: dbTransformer.uniqueId,
            jobNo: order.jobId,
            leftInputs: existingRecord.leftInputs || Array(8).fill(null).map(() => ({ col1: "", col2: "" })),
            startDate: existingRecord.startDate || new Date().toISOString().split('T')[0] || '',
            processSteps: existingRecord.processSteps?.length > 0 ? (existingRecord.processSteps as any[]).map((s: any) => ({
                process: s.process || '',
                duration: s.duration || '',
                startDate: s.startDate || '',
                startTime: s.startTime || '',
                completionDate: s.endDate || '',
                completionTime: s.endTime || '',
                remarks: s.remarks || ''
            })) : getStepsForVoltage(),
            preparedBy: existingRecord.preparedBy || user.name || '',
            productionManager: existingRecord.productionManager || '',
            verifiedBy: existingRecord.verifiedBy || '',
            date: existingRecord.date || new Date().toISOString().split('T')[0] || ''
        });
      } else {
        const today = new Date().toISOString().split('T')[0] || '';
        setRecord({
            id: crypto.randomUUID(),
            transformerId: transformer._id,
            groupNo: "No.-1",
            serialNumber: transformer.uniqueId,
            jobNo: order.jobId,
            leftInputs: Array(8).fill(null).map(() => ({ col1: "", col2: "" })),
            startDate: today,
            processSteps: getStepsForVoltage(),
            preparedBy: user.name || '',
            productionManager: '',
            verifiedBy: '',
            date: today,
        });
      }
    } catch (e) {
      console.error("Error fetching heating records:", e);
    } finally {
      setLoading(false);
    }
  };

  const getStepsForVoltage = (): ProcessStep[] => {
    const voltage = String(order.voltageRating || order.nominalSystemVoltage || '');
    const isHighVoltage = voltage.includes('22') || voltage.includes('33');

    // PT Specific Logic
    if (order.transformerType === 'PT') {
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
          { process: 'V. Heating 80°C',    duration: '24 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
          { process: 'V. Cooling 60°C',    duration: '06 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
          { process: 'Oil Filling at 60°C', duration: '04 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
        ];
    }
    return JSON.parse(JSON.stringify(DEFAULT_PROCESS_STEPS));
  };

  const updateProcessStep = (_blockId: string, processIndex: number, field: keyof ProcessStep, value: string) => {
    if (!record) return;
    const newSteps = [...record.processSteps];
    
    // Strict future date validation
    let finalizedValue = value;
    if (field === 'startDate' || field === 'completionDate') {
      const today = new Date().toISOString().split('T')[0] || '';
      if (value && value > today) finalizedValue = today;
    }

    newSteps[processIndex] = { ...newSteps[processIndex], [field]: finalizedValue } as ProcessStep;
    setRecord({ ...record, processSteps: newSteps });
  };

  const updateBlockField = (_blockId: string, field: keyof HeatingRecordBlock, value: any) => {
    if (!record) return;

    // Strict future date validation
    let finalizedValue = value;
    if (field === 'startDate' || field === 'date') {
      const today = new Date().toISOString().split('T')[0] || '';
      if (typeof value === 'string' && value > today) finalizedValue = today;
    }

    setRecord({ ...record, [field]: finalizedValue });
  };

  const handleSave = async (isApprove: boolean = false) => {
    if (!record) return;
    setSaving(true);
    try {
      const payload = {
        processSteps: record.processSteps.map(step => ({
          process: step.process,
          duration: step.duration,
          startDate: step.startDate,
          startTime: step.startTime,
          endDate: step.completionDate, 
          endTime: step.completionTime,
          remarks: step.remarks
        })),
        preparedBy: record.preparedBy,
        productionManager: record.productionManager,
        verifiedBy: record.verifiedBy,
        leftInputs: record.leftInputs,
        isApproveCall: isApprove
      };

      await axios.post(`/heating-record/save/${transformer.uniqueId}`, payload, { withCredentials: true });
      alert(isApprove ? "Approved successfully!" : "Saved successfully!");
      onBack();
    } catch (e: any) {
      console.error("Error saving heating records", e);
      alert(e.response?.data?.message || "Failed to save records.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (!record) {
    return <div className="p-8 text-center text-red-500">Error initializing form block.</div>;
  }

  const isApproved = transformer.status === 'Approved';
  const voltage = String(order.voltageRating || order.nominalSystemVoltage || '');

  return (
    <UnifiedHeatingRecord
      voltage={voltage}
      type={deviceType}
      record={record}
      saving={saving}
      onBack={onBack}
      onSave={handleSave}
      onUpdateProcessStep={updateProcessStep}
      onUpdateBlockField={updateBlockField}
      readOnly={isApproved}
    />
  );
}

import { useState, useEffect } from 'react';
import axios from 'axios';
import { User } from '../../App';
import { Order, Transformer } from './HeatingTrackingModule';
import { Loader2 } from 'lucide-react';
import { HeatingRecord11KVCT, HeatingRecordBlock, ProcessStep } from './HeatingRecord11KVCT';
import { HeatingRecord33KVCT } from './HeatingRecord33KVCT';
import { HeatingRecord33KVPT } from './HeatingRecord33KVPT';

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
  const [currentBlock, setCurrentBlock] = useState<HeatingRecordBlock | null>(null);

  const transformerType = order.transformerType === 'CT' 
    ? (String(order.nominalSystemVoltage) === '33' ? '33KV_CT' : '11KV_CT')
    : '33KV_PT';

  useEffect(() => {
    fetchHeatingRecord();
  }, [order, transformer]);

  const fetchHeatingRecord = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:3002/api/heating-record/transformers/${order._id}`, {
        withCredentials: true
      });

      const dbTransformer = res.data.transformers?.find((t: any) => t._id === transformer._id);
      let blocksData = dbTransformer?.processHistory?.heatingRecord || [];

      // Map API blocks back to UI HeatingRecordBlock structure
      blocksData = blocksData.map((b: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        transformerId: b.transformerId || '',
        groupNo: b.groupNo || '',
        serialNumber: b.serialNumber || '',
        jobNo: order.jobId,
        leftInputs: b.leftInputs || Array(8).fill({ col1: '', col2: '' }),
        startDate: b.reportDate ? b.reportDate.split('T')[0] : new Date().toISOString().split('T')[0],
        processSteps: b.processSteps && b.processSteps.length > 0 ? b.processSteps.map((s: any) => {
          const startDateFull = s.startDateTime ? new Date(s.startDateTime) : null;
          const compDateFull = s.completionDateTime ? new Date(s.completionDateTime) : null;
          
          return {
            process: typeof s.process === 'string' ? s.process : s.process?.type || s.process,
            duration: s.duration,
            startDate: startDateFull ? startDateFull.toISOString().split('T')[0] : '',
            startTime: startDateFull ? startDateFull.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '',
            completionDate: compDateFull ? compDateFull.toISOString().split('T')[0] : '',
            completionTime: compDateFull ? compDateFull.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '',
            remarks: s.remarks
          };
        }) : JSON.parse(JSON.stringify(DEFAULT_PROCESS_STEPS)),
        preparedBy: b.preparedBy || user.name || '',
        productionManager: b.productionManager || '',
        verifiedBy: b.verifiedBy || '',
        date: b.reportDate ? b.reportDate.split('T')[0] : new Date().toISOString().split('T')[0]
      }));

      // Find the block for the selected transformer (should be exactly 1 or 0)
      const existingBlock = blocksData[0];
      
      if (existingBlock) {
        setCurrentBlock(existingBlock);
      } else {
        // Create an empty block exactly for this transformer
        setCurrentBlock(makeNewBlock());
      }

    } catch (e) {
      console.error("Error fetching heating records:", e);
    } finally {
      setLoading(false);
    }
  };

  const makeNewBlock = (): HeatingRecordBlock => {
    let processSteps = JSON.parse(JSON.stringify(DEFAULT_PROCESS_STEPS));
    
    if (String(order.nominalSystemVoltage) === '33') {
      processSteps = [
        { process: 'Heating 80°C',       duration: '12 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
        { process: 'V. Heating 80°C',    duration: '24 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
        { process: 'V. Cooling 60°C',    duration: '06 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
        { process: 'Oil Filling at 60°C', duration: '04 hrs', startDate: '', startTime: '', completionDate: '', completionTime: '', remarks: '' },
      ];
    }
  
    return {
      id: Math.random().toString(36).substr(2, 9),
      transformerId: transformer._id,
      groupNo: `TR-${transformer.uniqueId.slice(-3)}`, // Just an identifier
      serialNumber: transformer.uniqueId,
      jobNo: order.jobId,
      leftInputs: Array(8).fill(null).map(() => ({ col1: "", col2: "" })),
      startDate: new Date().toISOString().split('T')[0] as string,
      processSteps: processSteps as ProcessStep[],
      preparedBy: user.name || '',
      productionManager: '',
      verifiedBy: '',
      date: new Date().toISOString().split('T')[0] as string,
    };
  };

  const handleUpdateProcessStep = (_blockId: string, processIndex: number, field: keyof ProcessStep, value: string) => {
    if (!currentBlock) return;
    const newSteps = [...currentBlock.processSteps];
    newSteps[processIndex] = { ...newSteps[processIndex], [field]: value } as ProcessStep;
    setCurrentBlock({ ...currentBlock, processSteps: newSteps });
  };

  const handleUpdateBlockField = (_blockId: string, field: keyof HeatingRecordBlock, value: string) => {
    if (!currentBlock) return;
    setCurrentBlock({ ...currentBlock, [field]: value });
  };

  const handleSave = async () => {
    if (!currentBlock) return;
    setSaving(true);
    try {
      const formatDateTime = (date: string, time: string) => {
          if (!date) return null;
          // IMPORTANT: Do NOT append 'Z' here. 
          // Appending 'Z' would force the input time to be treated as UTC, 
          // causing an offset when displayed in local time (e.g., +5:30 for IST).
          return time ? new Date(`${date}T${time}:00`) : new Date(`${date}T00:00:00`);
      };

      const payload = {
        processSteps: currentBlock.processSteps.map(step => ({
          process: step.process,
          duration: step.duration,
          startDateTime: formatDateTime(step.startDate, step.startTime),
          completionDateTime: formatDateTime(step.completionDate, step.completionTime),
          remarks: step.remarks
        })),
        preparedBy: currentBlock.preparedBy,
        productionManager: currentBlock.productionManager,
        verifiedBy: currentBlock.verifiedBy,
        isApproveCall: false
      };

      await axios.post(`http://localhost:3002/api/heating-record/save/${transformer.uniqueId}`, payload, { withCredentials: true });
      alert("Heating record for transformer saved successfully!");
      onBack();
    } catch (e: any) {
      console.error("Error saving heating records", e);
      if (e.response?.status === 401) {
        alert("Session expired or unauthorized. Please log out and login again to refresh your session.");
      } else {
        alert("Failed to save heating records. " + (e.response?.data?.message || e.message));
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (!currentBlock) {
    return <div className="p-8 text-center text-red-500">Error initializing form block.</div>;
  }

  // We wrap currentBlock in an array because the existing UI components expect it.
  const records = [currentBlock];
  const isReadOnly = transformer.status === 'completed' || transformer.status === 'approved';

  const commonProps = {
    records,
    saving,
    onBack,
    onSave: handleSave,
    onUpdateProcessStep: handleUpdateProcessStep,
    onUpdateBlockField: handleUpdateBlockField,
    readOnly: isReadOnly,
  };

  if (transformerType === '11KV_CT') {
    return <HeatingRecord11KVCT {...commonProps} />;
  } else if (transformerType === '33KV_CT') {
    return <HeatingRecord33KVCT {...commonProps} />;
  } else if (transformerType === '33KV_PT') {
    return <HeatingRecord33KVPT {...commonProps} />;
  }
  
  return <HeatingRecord33KVCT {...commonProps} />;
}

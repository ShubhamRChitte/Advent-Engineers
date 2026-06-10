import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { TransformerListView } from './TransformerListView';
import { EnhancedOrderForm } from './EnhancedOrderForm';
import { AssignTestingWorkflow } from './AssignTestingWorkflow';
import { OrderSummaryView } from './OrderSummaryView';
import { OrdersListView } from './OrdersListView';

type ViewType = 'transformer-list' | 'order-form' | 'assign-testing' | 'order-summary' | 'orders-list';

interface Transformer {
  id: string;
  name: string;
  type: string;
  voltageRating: string;
  cores: number;
  phase: string;
  serialNumber: string;
}

interface WorkerAssignment {
  worker: any;
  transformerCount: number;
}

interface TestAssignment {
  testType: string;
  workers: WorkerAssignment[];
}

export function OrderManagementModule({ isAdmin = false }: { isAdmin?: boolean }) {
  const [currentView, setCurrentView] = useState<ViewType>('order-form');
  const [selectedTransformer, setSelectedTransformer] = useState<any>(null);
  const [allVendors, setAllVendors] = useState<any[]>([]);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/core-vendors`, { withCredentials: true });
        console.log("Fetch vendors response:", response.data);
        if (response.data.success) {
          setAllVendors(response.data.data);
        } else {
          console.warn("Server returned success:false for vendors:", response.data);
        }
      } catch (err) {
        console.error("Failed to fetch vendors:", err);
        toast.error("Could not load core vendors. Check server connection.");
      }
    };
    fetchVendors();
  }, []);
  const [orderData, setOrderData] = useState<any>(null);
  const [testAssignments, setTestAssignments] = useState<TestAssignment[]>([]);

  const handleOrderTransformer = (transformer: Transformer) => {
    setSelectedTransformer(transformer);
    setCurrentView('order-form');
  };

  const handleSubmitOrder = (data: any) => {
    setOrderData(data);
    setCurrentView('assign-testing');
  };

  const handleCompleteAssignment = (assignments: TestAssignment[]) => {
    setTestAssignments(assignments);
    setCurrentView('order-summary');
  };

  const handleSaveOrder = async () => {
    try {
      // 1. Transform Assignments
      // Logic: Iterate assignments by stage, calculate simple ranges for now.
      const assignmentsByStage = testAssignments.reduce((acc: any[], stage) => {
        let start = 1;
        const stageAssignments = stage.workers.map(w => {
          const range = { from: start, to: start + w.transformerCount - 1 };
          start += w.transformerCount;
          // Map Frontend Stage Name to Backend Enum Pair
          const stageEnumMap: Record<string, string> = {
            'Core Test': 'core',
            'After Secondary Test': 'secondary', // Fixed mapping
            'Secondary Test': 'secondary', // Also support direct name
            'After Primary Test': 'primary',
            'Final Test': 'final',
            'PT Test': 'pt',
            'PT Pretest': 'pt_pretest'
          };

          return {
            testerName: w.worker.name,
            stage: stageEnumMap[stage.testType] || 'core',
            unitRange: range,
            status: 'Assigned'
          };
        });
        return [...acc, ...stageAssignments];
      }, []);

      // 2. Transform Core Types & Capitalize for Enum Match
      // Form: ['metering', 'ps'] -> Backend: [{ coreType: 'Metering' }, { coreType: 'PS' }]
      const formatCoreType = (type: string) => {
        if (!type) return 'Metering';
        const lower = type.toLowerCase();
        if (lower === 'ps') return 'PS';
        if (lower === 'metering') return 'Metering';
        if (lower === 'protection') return 'Protection';
        // Capitalize first letter as fallback
        return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
      };

      let configsToUse = orderData.coreDetails || orderData.coreConfigs || orderData.coreTypes || [];
      
      // Fallback: If we have cores but no config array, create a default array
      const expectedCores = parseInt(orderData.numberOfCores) || 0;
      if (configsToUse.length === 0 && expectedCores > 0) {
        console.warn("Order has cores but no coreDetails found. Generating defaults.");
        configsToUse = Array(expectedCores).fill({ coreType: 'Metering' });
      }

      const coreDetails = configsToUse.map((config: any) => {
        const typeString = typeof config === 'string' ? config : (config.coreType || 'Metering');
        return {
          coreType: formatCoreType(typeString),
          accuracyClass: config.accuracyClass || '0.5',
          vendorNo: config.vendorNo || '',
          secondaryCurrent: config.secondaryCurrent || '1'
        };
      });

      // 3. Construct Final Payload matching OrderSchema
      const payload: Record<string, any> = {
        // ...orderData, // Don't spread first to avoid overwriting strict fields with wrong names
        clientName: orderData.clientName,
        clientContactNo: orderData.clientContact, // Backend expects clientContactNo

        transformerName: orderData.transformerName,
        transformerType: orderData.transformerType,
        quantity: parseInt(orderData.quantity),

        noOfCores: parseInt(orderData.numberOfCores),
        coreDetails: coreDetails,
        primaryCurrents: orderData.primaryCurrents || [],
        ratio: orderData.ratio && orderData.ratio.length > 0 ? orderData.ratio : ["N/A"],

        // Spread parameters to root
        voltageRating: orderData.voltageRating || '',
        nominalSystemVoltage: parseFloat(orderData.parameters?.nominalVoltage) || 0,
        burden: parseFloat(orderData.parameters?.burden) || 0,
        ratedPrimaryCurrent: parseFloat(orderData.parameters?.ratedPrimaryCurrent) || 0,
        ratedSecondaryCurrent: parseFloat(orderData.parameters?.ratedSecondaryCurrent) || 0,
        mountingDetails: orderData.parameters?.mountingDetails || 'N/A',
        overallDimension: orderData.parameters?.overallDimensions || 'N/A', // Schema: overallDimension (singular)
        stc: orderData.parameters?.stc || '',
        ratedPrimaryVoltage: orderData.parameters?.ratedPrimaryVoltage || '',
        ratedSecondaryVoltage: orderData.parameters?.ratedSecondaryVoltage || '',

        images: orderData.images || [],

        isStandard: orderData.isStandard || 'No',
        indoorOutdoor: orderData.indoorOutdoor || '',
        insulationType: orderData.insulationType || '',
        tankType: orderData.tankType || '',
        instructions: "None",

        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // Default 14 days constraints via ISO string

        coreVendors: orderData.coreVendors || { metering: [], protection: [], ps: [] },

        assignments: assignmentsByStage,
        bypassApproval: isAdmin // If Admin, bypass approval (Auto-Approve)
      };

      console.log("Creating Order FormData:", payload);

      const formData = new FormData();
      Object.keys(payload).forEach(key => {
        if (key === 'images') {
          // Append raw file objects
          const images = payload[key] as File[];
          images.forEach(img => formData.append('images', img));
        } else if (typeof payload[key] === 'object' && payload[key] !== null) {
          formData.append(key, JSON.stringify(payload[key]));
        } else {
          formData.append(key, String(payload[key]));
        }
      });

      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/create-order`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success(`Order saved successfully! ID: ${response.data.jobId}`); // Response returns jobId not order.jobId
        // Reset and show orders list
        setCurrentView('orders-list');
        setSelectedTransformer(null);
        setOrderData(null);
        setTestAssignments([]);
      }
    } catch (error: any) {
      console.error("Failed to save order:", error);
      const errMsg = error.response?.data?.error || error.response?.data?.message || "Failed to save order";
      const errDetails = error.response?.data?.details ? JSON.stringify(error.response.data.details) : "";
      toast.error(`${errMsg} ${errDetails}`);
    }
  };

  const handleBackToList = () => {
    setCurrentView('transformer-list');
    setSelectedTransformer(null);
  };

  const handleBackToOrderForm = () => {
    setCurrentView('order-form');
  };

  // Order Form View (Direct Entry)
  if (currentView === 'order-form') {
    return (
      <EnhancedOrderForm
        transformer={selectedTransformer}
        allVendors={allVendors}
        onSubmit={handleSubmitOrder}
        onBack={handleBackToList}
        isEntryOperator={!isAdmin}
      />
    );
  }

  // Assign Testing View
  if (currentView === 'assign-testing' && orderData) {
    return (
      <AssignTestingWorkflow
        orderData={orderData}
        onComplete={handleCompleteAssignment}
        onBack={handleBackToOrderForm}
      />
    );
  }

  // Order Summary View
  if (currentView === 'order-summary' && orderData && testAssignments.length > 0) {
    return (
      <OrderSummaryView
        orderData={orderData}
        testAssignments={testAssignments}
        onSaveOrder={handleSaveOrder}
        allVendors={allVendors}
      />
    );
  }

  // Orders List View
  if (currentView === 'orders-list') {
    return <OrdersListView />;
  }

  // Fallback / Default
  return <OrdersListView />;
}

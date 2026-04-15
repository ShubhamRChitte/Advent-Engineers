import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ArrowLeft, PlayCircle, Loader2, CheckCircle, FileText } from 'lucide-react';
import axios from 'axios';
import { Order, Transformer } from './HeatingTrackingModule';

interface HeatingTransformersListProps {
  order: Order;
  onStartTest: (transformer: Transformer) => void;
  onBack: () => void;
}

export function HeatingTransformersList({ order, onStartTest, onBack }: HeatingTransformersListProps) {
  const [transformers, setTransformers] = useState<Transformer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [order]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resTrans = await axios.get(`http://localhost:3002/api/heating-record/transformers/${order._id}`, {
        withCredentials: true
      });
      const dbTransformers = resTrans.data.transformers || [];

      const mappedTransformers: Transformer[] = dbTransformers.map((t: any) => {
        let status: 'pending' | 'in-progress' | 'completed' | 'approved' = 'pending';
        
        if (t.processHistory?.heatingRecord && t.processHistory.heatingRecord.length > 0) {
            const hrStatus = t.processHistory.heatingRecord[0].status;
            if (hrStatus === 'In Progress') status = 'in-progress';
            else if (hrStatus === 'Completed') status = 'completed';
            else if (hrStatus === 'Approved') status = 'approved';
        }

        return {
          _id: t._id,
          uniqueId: t.uniqueId,
          name: order.transformerType || 'Transformer',
          rating: Array.isArray(order.transformerType) ? order.transformerType.join('/') : (order.transformerType || 'N/A'),
          status
        };
      });

      setTransformers(mappedTransformers);
    } catch (err) {
      console.error("Error fetching transformers:", err);
      setError("Failed to load transformers.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartHeating = async (transformer: Transformer) => {
    // If completed or approved, open the full-screen report view (Static Page)
    if (transformer.status === 'completed' || transformer.status === 'approved') {
      window.open(`/admin/report/${transformer._id}?type=heating`, '_blank');
      return;
    }

    if (transformer.status === 'pending') {
      try {
        await axios.put(`http://localhost:3002/api/heating-record/start/${transformer.uniqueId}`, {}, { withCredentials: true });
        await fetchData(); // Refresh list to show in-progress
      } catch (err) {
        console.error("Error starting heating", err);
      }
    }
    onStartTest(transformer);
  };

  const handleApprove = async (transformer: Transformer) => {
      try {
          await axios.post(`http://localhost:3002/api/heating-record/save/${transformer.uniqueId}`, {
              isApproveCall: true
          }, { withCredentials: true });
          alert("Heating Approved! Transformer sent to Final Stage.");
          await fetchData();
      } catch (error) {
          console.error("Error approving heating", error);
      }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-700';
      case 'in-progress': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Button>
      </div>

      <div>
        <h2>Heating Tracker for Job {order.jobId}</h2>
        <p className="text-gray-500 mt-1">Select a transformer to enter its heating record.</p>
      </div>

      <Card className="p-4 bg-gray-50 border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Job ID</p>
            <p className="font-medium mt-1">{order.jobId}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Client</p>
            <p className="font-medium mt-1">{order.clientName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Type & Voltage</p>
            <p className="font-medium mt-1">{order.nominalSystemVoltage}KV {order.transformerType}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Assigned</p>
            <p className="font-medium mt-1">{transformers.length}</p>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading transformers...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            {error}
            <Button variant="link" onClick={() => window.location.reload()}>Retry</Button>
          </div>
        ) : transformers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No transformers found for this order.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#003a70] text-white">
                <tr>
                  <th className="text-left p-4 text-sm font-medium">Type</th>
                  <th className="text-left p-4 text-sm font-medium">Unique ID</th>
                  <th className="text-left p-4 text-sm font-medium">Status</th>
                  <th className="text-center p-4 text-sm font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {transformers.map((transformer) => (
                  <tr key={transformer._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-medium">{transformer.name}</td>
                    <td className="p-4 font-mono text-gray-700">{transformer.uniqueId}</td>
                    <td className="p-4">
                      <Badge className={getStatusColor(transformer.status)}>
                        {transformer.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        {transformer.status === 'completed' && (
                          <Button
                            size="sm"
                            onClick={() => handleApprove(transformer)}
                            className="bg-green-600 hover:bg-green-700 font-medium"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" /> Approve
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleStartHeating(transformer)}
                          className={(transformer.status === 'completed' || transformer.status === 'approved') ? "bg-blue-600 hover:bg-blue-700 font-medium" : "bg-[#003a70] hover:bg-[#002f5c]"}
                        >
                          {(transformer.status === 'completed' || transformer.status === 'approved') ? (
                            <><FileText className="w-4 h-4 mr-2" /> View Report</>
                          ) : (
                            <><PlayCircle className="w-4 h-4 mr-2" /> {transformer.status === 'pending' ? 'Start Heating' : 'Continue'}</>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

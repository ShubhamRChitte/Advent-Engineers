import { useState, useEffect } from 'react';
import axios from '@/utils/axiosConfig';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Clock, AlertTriangle, CheckCircle2, TrendingDown } from 'lucide-react';

interface ActiveTimer {
  orderId: string;
  jobId: string;
  clientName: string;
  testerName: string;
  coreType: string;
  startTime: string;
  status: string;
  allocatedMinutes: number;
  elapsedMinutes: number;
  elapsedMs?: number;
  isDelayed: boolean;
}

export function EfficiencyMonitor() {
  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);

  const handleAcknowledge = async (orderId: string, jobId: string, coreType: string) => {
    setAcknowledging(`${orderId}-${coreType}`);
    try {
      const response = await axios.put(`/dashboard/efficiency/acknowledge`, {
        orderId,
        jobId,
        coreType
      }, { withCredentials: true });

      if (response.data.success) {
        // Remove it immediately from the UI for a snappy experience
        setActiveTimers(prev => prev.filter(t => !(t.orderId === orderId && t.coreType === coreType)));
      }
    } catch (error) {
      console.error("Failed to acknowledge delay:", error);
    } finally {
      setAcknowledging(null);
    }
  };

  const fetchEfficiency = async () => {
    try {
      const response = await axios.get(`/dashboard/efficiency`, {
        withCredentials: true
      });
      if (response.data.success) {
        setActiveTimers(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch efficiency data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEfficiency();
    const interval = setInterval(fetchEfficiency, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const delayedCount = activeTimers.filter(t => t.isDelayed).length;

  if (loading) return <div className="p-4 text-center text-gray-500">Loading metrics...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-blue-600" />
          Live Testing Efficiency Monitor
        </h3>
        {delayedCount > 0 && (
          <Badge variant="destructive" className="animate-pulse flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {delayedCount} DELAYED SESSIONS
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeTimers.length === 0 ? (
          <Card className="p-8 col-span-full text-center border-dashed border-2">
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <CheckCircle2 className="w-10 h-10" />
              <p>No delayed testing sessions found.</p>
            </div>
          </Card>
        ) : (
          activeTimers.map((timer) => (
            <Card key={`${timer.orderId}-${timer.coreType}`} className={`p-4 border-l-4 transition-all hover:shadow-md ${
              timer.isDelayed ? 'border-l-red-500 bg-red-50/30' : 'border-l-green-500 bg-green-50/30'
            }`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-gray-900">{timer.jobId}</h4>
                  <p className="text-[11px] font-semibold text-blue-600">Tester: {timer.testerName}</p>
                  <p className="text-[10px] text-gray-500 truncate max-w-[150px]">{timer.clientName}</p>
                </div>
                <Badge 
                  variant={timer.isDelayed ? "destructive" : (timer.status === "Paused" ? "outline" : "secondary")} 
                  className={`text-[10px] ${timer.status === 'Paused' ? 'border-amber-500 text-amber-600' : ''}`}
                >
                  {timer.coreType} {timer.status === 'Paused' ? '(PAUSED)' : ''}
                </Badge>
              </div>

              <div className="space-y-3">

                {timer.isDelayed && (
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-[10px] text-red-600 font-bold uppercase tracking-tighter">
                      <AlertTriangle className="w-3 h-3" />
                      Delayed by {
                        timer.elapsedMs ? (() => {
                          const delayMs = timer.elapsedMs - (timer.allocatedMinutes * 60000);
                          const totalSec = Math.floor(delayMs / 1000);
                          const mins = Math.floor(totalSec / 60);
                          const secs = totalSec % 60;
                          return `${mins}m ${secs}s`;
                        })() : `${timer.elapsedMinutes - timer.allocatedMinutes} minutes`
                      }
                    </div>
                    <button
                      onClick={() => handleAcknowledge(timer.orderId, timer.jobId, timer.coreType)}
                      disabled={acknowledging === `${timer.orderId}-${timer.coreType}`}
                      className="text-[10px] flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors disabled:opacity-50"
                      title="Mark as read to hide this delay"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {acknowledging === `${timer.orderId}-${timer.coreType}` ? 'Marking...' : 'Mark as Read'}
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

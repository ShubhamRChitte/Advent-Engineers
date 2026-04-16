import { useState, useEffect } from 'react';
import axios from 'axios';
import { CoreTestingOrders, CoreTestingOrder } from './CoreTestingOrders';
import { CoreTypeSelection } from './CoreTypeSelection';
import { CoreTestingForm } from './CoreTestingForm';
import { Orders } from './Orders';
import { Card } from '../ui/card';
import { User } from '../../App';

type CoreType = 'Metering' | 'PS' | 'Protection';
type TabView = 'testing' | 'orders';

interface CoreTrackingDashboardProps {
  user?: User;
}

export function CoreTrackingDashboard({ user }: CoreTrackingDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabView>('testing');
  const [selectedOrder, setSelectedOrder] = useState<CoreTestingOrder | null>(null);
  const [selectedCoreType, setSelectedCoreType] = useState<CoreType | null>(null);
  const [, setStats] = useState({ active: 0, completed: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [activeRes, historyRes] = await Promise.all([
          axios.get('http://localhost:5000/api/assigneed_orders?type=active', { withCredentials: true }),
          axios.get('http://localhost:5000/api/assigneed_orders?type=history', { withCredentials: true })
        ]);
        // Use stats
        console.log(`Active: ${activeRes.data.length}, Completed: ${historyRes.data.length}`);
        setStats({
          active: activeRes.data.length,
          completed: historyRes.data.length
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    };
    fetchStats();
  }, []);

  const handleStartTesting = (order: CoreTestingOrder) => {
    setSelectedOrder(order);
    setSelectedCoreType(null);
  };

  const handleSelectCoreType = (coreType: CoreType) => {
    setSelectedCoreType(coreType);
  };

  const handleBack = () => {
    if (selectedCoreType) {
      setSelectedCoreType(null);
    } else {
      setSelectedOrder(null);
    }
  };

  // Render testing flow
  const renderTestingView = () => {
    // Show testing form if core type is selected
    if (selectedOrder && selectedCoreType) {
      return (
        <CoreTestingForm
          order={selectedOrder}
          coreType={selectedCoreType}
          onBack={handleBack}
          user={user}
          isReadOnly={selectedOrder['isReadOnly']}
        />
      );
    }

    // Show core type selection if order is selected
    if (selectedOrder) {
      return (
        <CoreTypeSelection
          order={selectedOrder}
          onSelectCoreType={handleSelectCoreType}
          onBack={handleBack}
        />
      );
    }
    // Show orders list by default
    return <CoreTestingOrders onStartTesting={handleStartTesting} user={user} />;
  };

  return (
    <div className="space-y-4">
      {/* Tabs - Only show when not in testing flow */}
      {!selectedOrder && (
        <Card className="p-1">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('testing')}
              className={`flex-1 px-4 py-2 text-sm rounded transition-colors ${activeTab === 'testing'
                ? 'bg-[#003a70] text-white'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              Active Testing
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 px-4 py-2 text-sm rounded transition-colors ${activeTab === 'orders'
                ? 'bg-[#003a70] text-white'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              Completed Reports
            </button>
          </div>
        </Card>
      )}

      {/* Content */}
      {activeTab === 'testing' ? renderTestingView() : <Orders user={user as User} />}
    </div>
  );
}

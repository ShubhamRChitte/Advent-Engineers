import { useState } from 'react';
import { CoreTestingOrders, CoreTestingOrder } from './CoreTestingOrders';
import { CoreTypeSelection } from './CoreTypeSelection';
import { CoreTestingForm } from './CoreTestingForm';
import { CoreTestingReports } from './CoreTestingReports';
import { Card } from '../ui/card';

type CoreType = 'Metering' | 'PS' | 'Protection';
type TabView = 'testing' | 'orders';

export function CoreTrackingDashboard() {
  const [activeTab, setActiveTab] = useState<TabView>('testing');
  const [selectedOrder, setSelectedOrder] = useState<CoreTestingOrder | null>(null);
  const [selectedCoreType, setSelectedCoreType] = useState<CoreType | null>(null);

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
    return <CoreTestingOrders onStartTesting={handleStartTesting} />;
  };

  return (
    <div className="space-y-4">
      {/* Tabs - Only show when not in testing flow */}
      {!selectedOrder && (
        <Card className="p-1">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('testing')}
              className={`flex-1 px-4 py-2 text-sm rounded transition-colors ${
                activeTab === 'testing'
                  ? 'bg-[#003a70] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Testing
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 px-4 py-2 text-sm rounded transition-colors ${
                activeTab === 'orders'
                  ? 'bg-[#003a70] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Orders
            </button>
          </div>
        </Card>
      )}

      {/* Content */}
      {activeTab === 'testing' ? renderTestingView() : <CoreTestingReports />}
    </div>
  );
}

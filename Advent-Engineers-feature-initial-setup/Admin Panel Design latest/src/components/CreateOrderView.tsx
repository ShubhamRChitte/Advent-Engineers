import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Package, Plus } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function CreateOrderView() {
  const [formData, setFormData] = useState({
    client: '',
    transformerType: '',
    quantity: '',
    deliveryDate: '',
    priority: 'medium',
    specifications: '',
  });

  const transformerTypes = [
    'Dead Tank Type-1',
    'Dead Tank Type-2',
    'Live Tank Type',
    'Indoor ERC',
    'Outdoor ERC',
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client || !formData.transformerType || !formData.quantity || !formData.deliveryDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const orderNumber = `ORD-2025-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    toast.success(`Order ${orderNumber} created successfully!`);
    
    // Reset form
    setFormData({
      client: '',
      transformerType: '',
      quantity: '',
      deliveryDate: '',
      priority: 'medium',
      specifications: '',
    });
  };

  const recentOrders = [
    { orderNumber: 'ORD-2025-001', client: 'PowerGrid Corp', type: 'Dead Tank Type-1', quantity: 5 },
    { orderNumber: 'ORD-2025-002', client: 'City Electric Ltd', type: 'Live Tank Type', quantity: 3 },
    { orderNumber: 'ORD-2025-003', client: 'National Grid', type: 'Dead Tank Type-2', quantity: 8 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2>Create New Order</h2>
        <p className="text-gray-500 mt-1">Add new transformer orders from clients</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Form */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-50 rounded-lg">
              <Package className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3>Order Details</h3>
              <p className="text-sm text-gray-500">Fill in the information below</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client">Client Name *</Label>
                <Input
                  id="client"
                  placeholder="Enter client name"
                  value={formData.client}
                  onChange={(e) => handleInputChange('client', e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="transformerType">Transformer Type *</Label>
                <Select
                  value={formData.transformerType}
                  onValueChange={(value) => handleInputChange('transformerType', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {transformerTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="Enter quantity"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  required
                  min="1"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="deliveryDate">Delivery Date *</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="priority">Priority Level</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleInputChange('priority', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="specifications">Special Specifications</Label>
              <textarea
                id="specifications"
                placeholder="Enter any special requirements or specifications..."
                value={formData.specifications}
                onChange={(e) => handleInputChange('specifications', e.target.value)}
                rows={4}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="bg-red-600 hover:bg-red-700 flex-1">
                <Plus className="w-4 h-4 mr-2" />
                Create Order
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormData({
                  client: '',
                  transformerType: '',
                  quantity: '',
                  deliveryDate: '',
                  priority: 'medium',
                  specifications: '',
                })}
              >
                Clear
              </Button>
            </div>
          </form>
        </Card>

        {/* Recent Orders & Quick Info */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="mb-4">Recent Orders</h3>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.orderNumber} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium">{order.orderNumber}</p>
                  <p className="text-xs text-gray-500">{order.client}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {order.type} • {order.quantity} units
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4">Order Guidelines</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex gap-2">
                <span className="text-red-600">•</span>
                <p>Verify client details before submission</p>
              </div>
              <div className="flex gap-2">
                <span className="text-red-600">•</span>
                <p>Check transformer availability in inventory</p>
              </div>
              <div className="flex gap-2">
                <span className="text-red-600">•</span>
                <p>Set realistic delivery dates based on production capacity</p>
              </div>
              <div className="flex gap-2">
                <span className="text-red-600">•</span>
                <p>High priority orders require immediate worker assignment</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

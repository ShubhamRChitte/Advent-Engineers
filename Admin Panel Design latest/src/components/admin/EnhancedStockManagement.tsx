import { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Package, TrendingUp, AlertCircle, PlusCircle, Zap } from 'lucide-react';

export function EnhancedStockManagement() {
  const [transformerStock, setTransformerStock] = useState([
    { 
      id: 1,
      type: '11kV Distribution Transformer', 
      rating: '25 kVA',
      inStock: 45, 
      allocated: 12, 
      available: 33, 
      minLevel: 20,
      cores: 3,
      tested: 145,
      pending: 12
    },
    { 
      id: 2,
      type: '22kV Distribution Transformer', 
      rating: '63 kVA',
      inStock: 38, 
      allocated: 8, 
      available: 30, 
      minLevel: 20,
      cores: 3,
      tested: 122,
      pending: 8
    },
    { 
      id: 3,
      type: '33kV Power Transformer', 
      rating: '100 kVA',
      inStock: 52, 
      allocated: 15, 
      available: 37, 
      minLevel: 25,
      cores: 3,
      tested: 186,
      pending: 15
    },
    { 
      id: 4,
      type: '66kV Power Transformer', 
      rating: '250 kVA',
      inStock: 28, 
      allocated: 10, 
      available: 18, 
      minLevel: 15,
      cores: 3,
      tested: 98,
      pending: 10
    },
    { 
      id: 5,
      type: '132kV Power Transformer', 
      rating: '500 kVA',
      inStock: 15, 
      allocated: 3, 
      available: 12, 
      minLevel: 10,
      cores: 3,
      tested: 52,
      pending: 3
    },
    { 
      id: 6,
      type: '11kV Distribution Transformer', 
      rating: '100 kVA',
      inStock: 32, 
      allocated: 7, 
      available: 25, 
      minLevel: 18,
      cores: 3,
      tested: 110,
      pending: 7
    },
    { 
      id: 7,
      type: '22kV Distribution Transformer', 
      rating: '160 kVA',
      inStock: 25, 
      allocated: 5, 
      available: 20, 
      minLevel: 15,
      cores: 3,
      tested: 89,
      pending: 5
    },
    { 
      id: 8,
      type: '33kV Power Transformer', 
      rating: '315 kVA',
      inStock: 18, 
      allocated: 4, 
      available: 14, 
      minLevel: 12,
      cores: 3,
      tested: 67,
      pending: 4
    },
  ]);

  // Add new transformer form state
  const [newTransformer, setNewTransformer] = useState({
    type: '',
    rating: '',
    quantity: '',
    minLevel: '',
    cores: '3'
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleAddTransformer = () => {
    if (!newTransformer.type || !newTransformer.rating || !newTransformer.quantity || !newTransformer.minLevel) {
      alert('Please fill all fields');
      return;
    }

    const quantity = parseInt(newTransformer.quantity);
    const minLevel = parseInt(newTransformer.minLevel);
    const cores = parseInt(newTransformer.cores);

    const newStock = {
      id: transformerStock.length + 1,
      type: newTransformer.type,
      rating: newTransformer.rating,
      inStock: quantity,
      allocated: 0,
      available: quantity,
      minLevel: minLevel,
      cores: cores,
      tested: 0,
      pending: 0
    };

    setTransformerStock([...transformerStock, newStock]);
    
    // Reset form
    setNewTransformer({
      type: '',
      rating: '',
      quantity: '',
      minLevel: '',
      cores: '3'
    });
    
    setIsAddDialogOpen(false);
  };

  const totalStock = transformerStock.reduce((sum, s) => sum + s.inStock, 0);
  const totalAllocated = transformerStock.reduce((sum, s) => sum + s.allocated, 0);
  const totalAvailable = transformerStock.reduce((sum, s) => sum + s.available, 0);
  const lowStockItems = transformerStock.filter(s => s.available < s.minLevel).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Transformer Inventory Management</h2>
          <p className="text-gray-500 mt-1">Manage transformer stock and inventory levels</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add New Transformer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Transformer to Stock</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="type">Transformer Type</Label>
                <Input
                  id="type"
                  placeholder="e.g., 11kV Distribution Transformer"
                  value={newTransformer.type}
                  onChange={(e) => setNewTransformer({...newTransformer, type: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="rating">Rating</Label>
                <Input
                  id="rating"
                  placeholder="e.g., 25 kVA"
                  value={newTransformer.rating}
                  onChange={(e) => setNewTransformer({...newTransformer, rating: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="e.g., 50"
                    value={newTransformer.quantity}
                    onChange={(e) => setNewTransformer({...newTransformer, quantity: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="minLevel">Min Level</Label>
                  <Input
                    id="minLevel"
                    type="number"
                    placeholder="e.g., 20"
                    value={newTransformer.minLevel}
                    onChange={(e) => setNewTransformer({...newTransformer, minLevel: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="cores">Number of Cores</Label>
                <Input
                  id="cores"
                  type="number"
                  placeholder="e.g., 3"
                  value={newTransformer.cores}
                  onChange={(e) => setNewTransformer({...newTransformer, cores: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleAddTransformer}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Add to Stock
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Stock</p>
              <h3 className="mt-1">{totalStock}</h3>
              <p className="text-xs text-gray-400 mt-1">{transformerStock.length} types</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Allocated</p>
              <h3 className="mt-1">{totalAllocated}</h3>
              <p className="text-xs text-gray-400 mt-1">In testing</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Available</p>
              <h3 className="mt-1 text-green-600">{totalAvailable}</h3>
              <p className="text-xs text-gray-400 mt-1">Ready for testing</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Low Stock Items</p>
              <h3 className="mt-1 text-red-600">{lowStockItems}</h3>
              <p className="text-xs text-gray-400 mt-1">Need reordering</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Transformer-wise Stock Table */}
      <Card className="p-6">
        <h3 className="mb-4">Transformer-wise Inventory</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left p-3 text-sm">Transformer Type</th>
                <th className="text-center p-3 text-sm">Rating</th>
                <th className="text-center p-3 text-sm">Cores</th>
                <th className="text-center p-3 text-sm">In Stock</th>
                <th className="text-center p-3 text-sm">Allocated</th>
                <th className="text-center p-3 text-sm">Available</th>
                <th className="text-center p-3 text-sm">Tested</th>
                <th className="text-center p-3 text-sm">Pending</th>
                <th className="text-center p-3 text-sm">Min Level</th>
                <th className="text-left p-3 text-sm">Status</th>
              </tr>
            </thead>
            <tbody>
              {transformerStock.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium">{item.type}</td>
                  <td className="p-3 text-center text-sm">{item.rating}</td>
                  <td className="p-3 text-center">
                    <Badge className="bg-purple-100 text-purple-700">{item.cores}</Badge>
                  </td>
                  <td className="p-3 text-center font-semibold">{item.inStock}</td>
                  <td className="p-3 text-center text-orange-600">{item.allocated}</td>
                  <td className="p-3 text-center text-green-600 font-semibold">{item.available}</td>
                  <td className="p-3 text-center text-blue-600">{item.tested}</td>
                  <td className="p-3 text-center text-gray-600">{item.pending}</td>
                  <td className="p-3 text-center text-sm text-gray-500">{item.minLevel}</td>
                  <td className="p-3">
                    <Badge className={
                      item.available < item.minLevel
                        ? 'bg-red-100 text-red-700'
                        : item.available < item.minLevel * 1.5
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }>
                      {item.available < item.minLevel
                        ? 'Low Stock'
                        : item.available < item.minLevel * 1.5
                        ? 'Reorder Soon'
                        : 'Good Stock'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Stock Distribution by Voltage */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
          <h4 className="text-blue-900">11kV Transformers</h4>
          <p className="text-sm text-blue-700 mt-2">
            Total: {transformerStock.filter(t => t.type.includes('11kV')).reduce((sum, t) => sum + t.inStock, 0)}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Available: {transformerStock.filter(t => t.type.includes('11kV')).reduce((sum, t) => sum + t.available, 0)}
          </p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
          <h4 className="text-purple-900">22kV Transformers</h4>
          <p className="text-sm text-purple-700 mt-2">
            Total: {transformerStock.filter(t => t.type.includes('22kV')).reduce((sum, t) => sum + t.inStock, 0)}
          </p>
          <p className="text-xs text-purple-600 mt-1">
            Available: {transformerStock.filter(t => t.type.includes('22kV')).reduce((sum, t) => sum + t.available, 0)}
          </p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
          <h4 className="text-green-900">33kV Transformers</h4>
          <p className="text-sm text-green-700 mt-2">
            Total: {transformerStock.filter(t => t.type.includes('33kV')).reduce((sum, t) => sum + t.inStock, 0)}
          </p>
          <p className="text-xs text-green-600 mt-1">
            Available: {transformerStock.filter(t => t.type.includes('33kV')).reduce((sum, t) => sum + t.available, 0)}
          </p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100">
          <h4 className="text-orange-900">66kV Transformers</h4>
          <p className="text-sm text-orange-700 mt-2">
            Total: {transformerStock.filter(t => t.type.includes('66kV')).reduce((sum, t) => sum + t.inStock, 0)}
          </p>
          <p className="text-xs text-orange-600 mt-1">
            Available: {transformerStock.filter(t => t.type.includes('66kV')).reduce((sum, t) => sum + t.available, 0)}
          </p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100">
          <h4 className="text-red-900">132kV Transformers</h4>
          <p className="text-sm text-red-700 mt-2">
            Total: {transformerStock.filter(t => t.type.includes('132kV')).reduce((sum, t) => sum + t.inStock, 0)}
          </p>
          <p className="text-xs text-red-600 mt-1">
            Available: {transformerStock.filter(t => t.type.includes('132kV')).reduce((sum, t) => sum + t.available, 0)}
          </p>
        </Card>
      </div>
    </div>
  );
}

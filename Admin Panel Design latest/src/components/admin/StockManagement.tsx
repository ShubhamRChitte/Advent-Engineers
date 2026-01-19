import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Package, TrendingUp, AlertCircle } from 'lucide-react';

export function StockManagement() {
  const stock = [
    { coreType: 'Type-1 (11kV)', inStock: 45, allocated: 12, available: 33, minLevel: 20 },
    { coreType: 'Type-2 (22kV)', inStock: 38, allocated: 8, available: 30, minLevel: 20 },
    { coreType: 'Type-3 (33kV)', inStock: 52, allocated: 15, available: 37, minLevel: 25 },
    { coreType: 'Type-4 (66kV)', inStock: 28, allocated: 10, available: 18, minLevel: 15 },
    { coreType: 'Type-5 (132kV)', inStock: 15, allocated: 3, available: 12, minLevel: 10 },
  ];

  const vendors = [
    { name: 'ABC Cores Ltd', coresSupplied: 125, quality: 'Excellent' },
    { name: 'XYZ Transformers', coresSupplied: 98, quality: 'Good' },
    { name: 'Premium Core Co', coresSupplied: 76, quality: 'Excellent' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2>Stock Management</h2>
        <p className="text-gray-500 mt-1">Manage transformer cores and vendor inventory</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Stock</p>
              <h3 className="mt-1">{stock.reduce((sum, s) => sum + s.inStock, 0)}</h3>
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
              <h3 className="mt-1">{stock.reduce((sum, s) => sum + s.allocated, 0)}</h3>
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
              <h3 className="mt-1 text-green-600">{stock.reduce((sum, s) => sum + s.available, 0)}</h3>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Package className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Low Stock Items</p>
              <h3 className="mt-1 text-red-600">
                {stock.filter(s => s.available < s.minLevel).length}
              </h3>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Stock Table */}
      <Card className="p-6">
        <h3 className="mb-4">Core Inventory</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left p-3 text-sm">Core Type</th>
                <th className="text-center p-3 text-sm">In Stock</th>
                <th className="text-center p-3 text-sm">Allocated</th>
                <th className="text-center p-3 text-sm">Available</th>
                <th className="text-center p-3 text-sm">Min Level</th>
                <th className="text-left p-3 text-sm">Status</th>
              </tr>
            </thead>
            <tbody>
              {stock.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="p-3 font-medium">{item.coreType}</td>
                  <td className="p-3 text-center">{item.inStock}</td>
                  <td className="p-3 text-center">{item.allocated}</td>
                  <td className="p-3 text-center">{item.available}</td>
                  <td className="p-3 text-center">{item.minLevel}</td>
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

      {/* Vendors */}
      <Card className="p-6">
        <h3 className="mb-4">Registered Core Vendors</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {vendors.map((vendor, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4">
              <h4>{vendor.name}</h4>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Cores Supplied:</span>
                  <span>{vendor.coresSupplied}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Quality Rating:</span>
                  <Badge className={
                    vendor.quality === 'Excellent'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }>
                    {vendor.quality}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

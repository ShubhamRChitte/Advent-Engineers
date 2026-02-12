import { useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Package, AlertTriangle, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface InventoryViewProps {
  userRole?: 'admin' | 'entry-level';
}

export function InventoryView({ userRole = 'admin' }: InventoryViewProps) {
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'production' | 'tested'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const inventory = [
    {
      type: 'Dead Tank Type-1',
      inStock: 12,
      inProduction: 8,
      tested: 10,
      pending: 6,
      color: '#ef4444',
    },
    {
      type: 'Dead Tank Type-2',
      inStock: 8,
      inProduction: 5,
      tested: 6,
      pending: 4,
      color: '#3b82f6',
    },
    {
      type: 'Live Tank Type',
      inStock: 15,
      inProduction: 6,
      tested: 12,
      pending: 3,
      color: '#10b981',
    },
    {
      type: 'Indoor ERC',
      inStock: 20,
      inProduction: 10,
      tested: 18,
      pending: 8,
      color: '#f59e0b',
    },
    {
      type: 'Outdoor ERC',
      inStock: 10,
      inProduction: 7,
      tested: 8,
      pending: 5,
      color: '#8b5cf6',
    },
  ];

  const sortedInventory = [...inventory].sort((a, b) => {
    let compareA, compareB;
    
    switch (sortBy) {
      case 'name':
        compareA = a.type;
        compareB = b.type;
        break;
      case 'stock':
        compareA = a.inStock;
        compareB = b.inStock;
        break;
      case 'production':
        compareA = a.inProduction;
        compareB = b.inProduction;
        break;
      case 'tested':
        compareA = a.tested;
        compareB = b.tested;
        break;
      default:
        compareA = a.type;
        compareB = b.type;
    }

    if (sortOrder === 'asc') {
      return compareA > compareB ? 1 : -1;
    } else {
      return compareA < compareB ? 1 : -1;
    }
  });

  const totalStock = inventory.reduce((sum, item) => sum + item.inStock, 0);
  const totalProduction = inventory.reduce((sum, item) => sum + item.inProduction, 0);
  const totalTested = inventory.reduce((sum, item) => sum + item.tested, 0);
  const totalPending = inventory.reduce((sum, item) => sum + item.pending, 0);

  const stockData = inventory.map(item => ({
    name: item.type,
    stock: item.inStock,
  }));

  const statusData = [
    { name: 'In Stock', value: totalStock, color: '#10b981' },
    { name: 'In Production', value: totalProduction, color: '#3b82f6' },
    { name: 'Pending Test', value: totalPending, color: '#f59e0b' },
  ];

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2>Inventory Management</h2>
        <p className="text-gray-500 mt-1">Track transformer inventory and production status</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Total in Stock</p>
              <h3 className="mt-2">{totalStock}</h3>
              <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span>+12% from last month</span>
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Package className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">In Production</p>
              <h3 className="mt-2">{totalProduction}</h3>
              <div className="flex items-center gap-1 mt-2 text-sm text-blue-600">
                <TrendingUp className="w-4 h-4" />
                <span>+8% from last month</span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Tested & Ready</p>
              <h3 className="mt-2">{totalTested}</h3>
              <div className="flex items-center gap-1 mt-2 text-sm text-purple-600">
                <TrendingUp className="w-4 h-4" />
                <span>+15% from last month</span>
              </div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Tests</p>
              <h3 className="mt-2">{totalPending}</h3>
              <div className="flex items-center gap-1 mt-2 text-sm text-orange-600">
                <TrendingDown className="w-4 h-4" />
                <span>-5% from last month</span>
              </div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      {userRole === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="mb-4">Stock by Transformer Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stockData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="stock" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4">Overall Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Sorting Controls */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <ArrowUpDown className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-500">Sort by:</span>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Transformer Name</SelectItem>
              <SelectItem value="stock">Stock Level</SelectItem>
              <SelectItem value="production">Production Count</SelectItem>
              <SelectItem value="tested">Tested Units</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={toggleSortOrder}
            className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
          >
            {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </button>
        </div>
      </Card>

      {/* Detailed Inventory Table */}
      <Card className="p-6">
        <h3 className="mb-4">Detailed Inventory - Sorted by {sortBy === 'name' ? 'Transformer Name' : sortBy === 'stock' ? 'Stock Level' : sortBy === 'production' ? 'Production Count' : 'Tested Units'}</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left pb-3 text-sm text-gray-500">Transformer Type</th>
                <th className="text-center pb-3 text-sm text-gray-500">In Stock</th>
                <th className="text-center pb-3 text-sm text-gray-500">In Production</th>
                <th className="text-center pb-3 text-sm text-gray-500">Tested</th>
                <th className="text-center pb-3 text-sm text-gray-500">Pending Test</th>
                <th className="text-left pb-3 text-sm text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedInventory.map((item) => (
                <tr key={item.type} className="border-b border-gray-100">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.type}</span>
                    </div>
                  </td>
                  <td className="py-4 text-center">{item.inStock}</td>
                  <td className="py-4 text-center">{item.inProduction}</td>
                  <td className="py-4 text-center">{item.tested}</td>
                  <td className="py-4 text-center">{item.pending}</td>
                  <td className="py-4">
                    <Badge className={
                      item.inStock > 10 
                        ? 'bg-green-100 text-green-700' 
                        : item.inStock > 5 
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }>
                      {item.inStock > 10 ? 'Good Stock' : item.inStock > 5 ? 'Low Stock' : 'Critical'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Stock Summary by Type */}
      <Card className="p-6">
        <h3 className="mb-4">Total Stock by Transformer Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {sortedInventory.map((item) => (
            <div key={item.type} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <p className="text-sm text-gray-500">{item.type}</p>
              </div>
              <h3 className="text-2xl">{item.inStock}</h3>
              <p className="text-xs text-gray-500 mt-1">units in stock</p>
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Production:</span>
                  <span>{item.inProduction}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tested:</span>
                  <span>{item.tested}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
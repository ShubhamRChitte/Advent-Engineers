import { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Search, Zap, Layers, Gauge } from 'lucide-react';
import transformerImg from '../../assets/0db9fabb1635e2b66d423ee0e091febb037691be.png';

interface Transformer {
  id: string;
  name: string;
  type: string;
  capacity: string;
  voltageRating: string;
  hvVoltage: string;
  lvVoltage: string;
  cores: number;
  phase: 'Single Phase' | 'Three Phase';
  model: string;
  status: 'Available' | 'In Stock' | 'Sample Unit';
  image: string;
  coolingType: string;
}

interface TransformerSelectionGridProps {
  onSelectTransformer: (transformer: Transformer) => void;
}

export function TransformerSelectionGrid({ onSelectTransformer }: TransformerSelectionGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    'All Transformers',
    'Current Transformer',
    'Potential Transformer',
    'Distribution Transformer',
    'Power Transformer',
  ];

  const transformers: Transformer[] = [
    {
      id: 'TR-001',
      name: 'Outdoor Epoxy Resin Cast',
      type: 'Current Transformer (CT)',
      capacity: '500 kVA',
      voltageRating: '33/11 kV',
      hvVoltage: '33 kV',
      lvVoltage: '11 kV',
      cores: 3,
      phase: 'Three Phase',
      model: 'CT-OR-500-33',
      status: 'Available',
      image: transformerImg,
      coolingType: 'ONAN',
    },
    {
      id: 'TR-002',
      name: 'Indoor Epoxy Resin Cast',
      type: 'Current Transformer (CT)',
      capacity: '800 kVA',
      voltageRating: '33/11 kV',
      hvVoltage: '33 kV',
      lvVoltage: '11 kV',
      cores: 3,
      phase: 'Three Phase',
      model: 'CT-IR-800-33',
      status: 'In Stock',
      image: transformerImg,
      coolingType: 'ONAN',
    },
    {
      id: 'TR-003',
      name: 'Live Tank Type',
      type: 'Current Transformer (CT)',
      capacity: '1000 kVA',
      voltageRating: '66/11 kV',
      hvVoltage: '66 kV',
      lvVoltage: '11 kV',
      cores: 3,
      phase: 'Three Phase',
      model: 'CT-LT-1000-66',
      status: 'Available',
      image: transformerImg,
      coolingType: 'ONAF',
    },
    {
      id: 'TR-004',
      name: 'Dead Tank Type-1',
      type: 'Current Transformer (CT)',
      capacity: '1500 kVA',
      voltageRating: '132/11 kV',
      hvVoltage: '132 kV',
      lvVoltage: '11 kV',
      cores: 3,
      phase: 'Three Phase',
      model: 'CT-DT1-1500-132',
      status: 'Available',
      image: transformerImg,
      coolingType: 'ONAN',
    },
    {
      id: 'TR-005',
      name: 'Dead Tank Type-2',
      type: 'Current Transformer (CT)',
      capacity: '2000 kVA',
      voltageRating: '132/33 kV',
      hvVoltage: '132 kV',
      lvVoltage: '33 kV',
      cores: 3,
      phase: 'Three Phase',
      model: 'CT-DT2-2000-132',
      status: 'Sample Unit',
      image: transformerImg,
      coolingType: 'ONAF',
    },
    {
      id: 'TR-006',
      name: 'Metering CT Type',
      type: 'Current Transformer (CT)',
      capacity: '100 kVA',
      voltageRating: '11/0.4 kV',
      hvVoltage: '11 kV',
      lvVoltage: '0.4 kV',
      cores: 2,
      phase: 'Single Phase',
      model: 'CT-M-100-11',
      status: 'In Stock',
      image: transformerImg,
      coolingType: 'ONAN',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'In Stock':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Sample Unit':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const filteredTransformers = transformers.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2>Add Orders - Transformer Selection</h2>
          <p className="text-gray-500 mt-1">Select a transformer to create a new order</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            className="pl-10 h-12"
            placeholder="Search product by title or description"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            className={selectedCategory === category ? 'bg-blue-600 hover:bg-blue-700' : ''}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Transformers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTransformers.map((transformer) => (
          <Card key={transformer.id} className="overflow-hidden hover:shadow-xl transition-shadow">
            {/* Transformer Image */}
            <div className="bg-gray-100 p-6 flex items-center justify-center h-48">
              <img
                src={transformer.image}
                alt={transformer.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Name and Status */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg">{transformer.name}</h3>
                  <p className="text-sm text-gray-500">{transformer.type}</p>
                </div>
                <Badge className={getStatusColor(transformer.status)}>
                  {transformer.status}
                </Badge>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3 py-3 border-t border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                    <Gauge className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Capacity</p>
                    <p className="text-sm font-medium">{transformer.capacity}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                    <Zap className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Voltage</p>
                    <p className="text-sm font-medium">{transformer.voltageRating}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                    <Layers className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Cores</p>
                    <p className="text-sm font-medium">{transformer.cores} Cores</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Phase</p>
                  <p className="text-sm font-medium">{transformer.phase}</p>
                </div>
              </div>

              {/* Model Code */}
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-xs text-gray-500">Model / Serial Code</p>
                <p className="text-sm font-mono font-medium">{transformer.model}</p>
              </div>

              {/* Order Button */}
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => onSelectTransformer(transformer)}
              >
                Order This Transformer
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredTransformers.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3>No transformers found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your search criteria</p>
          </div>
        </Card>
      )}
    </div>
  );
}

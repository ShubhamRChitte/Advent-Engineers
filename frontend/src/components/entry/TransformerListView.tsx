import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Search, Zap, Layers, Activity } from 'lucide-react';
import transformerImg from 'figma:asset/0b625c7a0b615a2d4519c60e71f9e9d34fed334d.png';

interface Transformer {
  id: string;
  name: string;
  type: string;
  image: string;
  capacity: string;
  voltageRating: string;
  cores: number;
  phase: 'Single Phase' | 'Three Phase';
  serialNumber: string;
}

interface TransformerListViewProps {
  onOrderTransformer: (transformer: Transformer) => void;
}

export function TransformerListView({ onOrderTransformer }: TransformerListViewProps) {
  const transformers: Transformer[] = [
    {
      id: 'TR-001',
      name: 'Outdoor Epoxy Resin Cast',
      type: 'Current Transformer',
      image: transformerImg,
      capacity: '500 kVA',
      voltageRating: '33/11 kV',
      cores: 3,
      phase: 'Three Phase',
      serialNumber: 'CT-OR-500-33',
    },
    {
      id: 'TR-002',
      name: 'Indoor Epoxy Resin Cast',
      type: 'Current Transformer',
      image: transformerImg,
      capacity: '800 kVA',
      voltageRating: '33/11 kV',
      cores: 3,
      phase: 'Three Phase',
      serialNumber: 'CT-IR-800-33',
    },
    {
      id: 'TR-003',
      name: 'Live Tank Type CT',
      type: 'Current Transformer',
      image: transformerImg,
      capacity: '1000 kVA',
      voltageRating: '66/11 kV',
      cores: 2,
      phase: 'Three Phase',
      serialNumber: 'CT-LT-1000-66',
    },
    {
      id: 'TR-004',
      name: 'Dead Tank Type-1',
      type: 'Current Transformer',
      image: transformerImg,
      capacity: '1500 kVA',
      voltageRating: '132/11 kV',
      cores: 3,
      phase: 'Three Phase',
      serialNumber: 'CT-DT1-1500-132',
    },
    {
      id: 'TR-005',
      name: 'Dead Tank Type-2',
      type: 'Current Transformer',
      image: transformerImg,
      capacity: '2000 kVA',
      voltageRating: '132/33 kV',
      cores: 1,
      phase: 'Single Phase',
      serialNumber: 'CT-DT2-2000-132',
    },
    {
      id: 'TR-006',
      name: 'Metering CT Type',
      type: 'Current Transformer',
      image: transformerImg,
      capacity: '100 kVA',
      voltageRating: '11/0.4 kV',
      cores: 2,
      phase: 'Single Phase',
      serialNumber: 'CT-M-100-11',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2>Add Orders - Transformer Selection</h2>
        <p className="text-gray-500 mt-1">Select a transformer to create a new order</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          className="pl-10 h-12"
          placeholder="Search transformers by name, type, or serial number"
        />
      </div>

      {/* Transformers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {transformers.map((transformer) => (
          <Card key={transformer.id} className="overflow-hidden hover:shadow-xl transition-shadow border-2 border-gray-200">
            {/* Transformer Image */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center h-56 border-b-2 border-gray-200">
              <img
                src={transformer.image}
                alt={transformer.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Name and Type */}
              <div>
                <h3 className="mb-1">{transformer.name}</h3>
                <p className="text-sm text-gray-500">{transformer.type}</p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3 py-3 border-y border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Capacity</p>
                    <p className="text-sm font-medium">{transformer.capacity}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Voltage</p>
                    <p className="text-sm font-medium">{transformer.voltageRating}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Layers className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Cores</p>
                    <p className="text-sm font-medium">{transformer.cores} Core{transformer.cores > 1 ? 's' : ''}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Phase</p>
                  <p className="text-sm font-medium">{transformer.phase}</p>
                </div>
              </div>

              {/* Serial Number */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Serial / Model Number</p>
                <p className="text-sm font-mono font-medium">{transformer.serialNumber}</p>
              </div>

              {/* Order Button */}
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 h-11"
                onClick={() => onOrderTransformer(transformer)}
              >
                Order This Transformer
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

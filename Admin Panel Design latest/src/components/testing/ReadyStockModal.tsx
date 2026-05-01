import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Package, Search, AlertCircle } from 'lucide-react';
import { Input } from '../ui/input';

interface ReadyCore {
  _id: string;
  serialNumber: string;
  specifications: {
    coreType: string;
    ratio?: string;
    burden?: string;
    class?: string;
  };
}

interface ReadyStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  cores: ReadyCore[];
  onSelect: (core: ReadyCore) => void;
  isLoading: boolean;
}

export function ReadyStockModal({ isOpen, onClose, cores, onSelect, isLoading }: ReadyStockModalProps) {
  const [search, setSearch] = useState('');
  
  const filteredCores = cores.filter(c => 
    c.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
    c.specifications.ratio?.includes(search)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Matching Ready Transformers
          </DialogTitle>
          <DialogDescription>
            Select a pre-tested core from inventory to use as a replacement.
          </DialogDescription>
        </DialogHeader>

        <div className="relative my-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            className="pl-10" 
            placeholder="Search by serial number or specs..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="max-h-[400px] overflow-y-auto border rounded-md">
          {isLoading ? (
            <div className="p-10 text-center text-gray-500">Searching matching stock...</div>
          ) : filteredCores.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 font-semibold">Serial No</th>
                  <th className="px-4 py-2 font-semibold">Specifications</th>
                  <th className="px-4 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCores.map((core) => (
                  <tr key={core._id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{core.serialNumber}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {core.specifications.ratio} | {core.specifications.burden} | {core.specifications.class}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" onClick={() => onSelect(core)} className="bg-blue-600 hover:bg-blue-700 h-8">
                        Select
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-10 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="text-gray-600">No matching pre-tested cores found.</p>
              <p className="text-xs text-gray-400">Try manual replacement or update inventory.</p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

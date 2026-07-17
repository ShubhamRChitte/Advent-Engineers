import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Package, Search, AlertCircle, Check } from 'lucide-react';
import { Input } from '../ui/input';

interface ReadyCore {
  _id: string;
  coreId: string;
  serialNumber?: string;
  coreType?: string;
  specifications: {
    coreType?: string;
    ratio?: string;
    burden?: string;
    class?: string;
    turns?: string;
  };
}

interface MultiReadyStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  cores: ReadyCore[];
  initialSelectedIds: string[];
  requiredCount: number;
  coreType: string;
  onSave: (selectedIds: string[]) => void;
  isLoading: boolean;
}

export function MultiReadyStockModal({
  isOpen,
  onClose,
  cores,
  initialSelectedIds,
  requiredCount,
  coreType,
  onSave,
  isLoading
}: MultiReadyStockModalProps) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(initialSelectedIds || []);
      setSearch('');
    }
  }, [isOpen, initialSelectedIds]);

  const filteredCores = cores.filter(c => {
    if (!c) return false;
    return (c.coreId || c.serialNumber || "").toLowerCase().includes(search.toLowerCase());
  });

  const handleToggleCore = (coreId: string) => {
    if (selectedIds.includes(coreId)) {
      setSelectedIds(prev => prev.filter(id => id !== coreId));
    } else {
      if (selectedIds.length >= requiredCount) {
        alert(`You can only select up to ${requiredCount} cores.`);
        return;
      }
      setSelectedIds(prev => [...prev, coreId]);
    }
  };

  const handleSave = () => {
    if (selectedIds.length > requiredCount) {
      alert(`You can only select up to ${requiredCount} cores.`);
      return;
    }
    onSave(selectedIds);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 bg-slate-50 border-none shadow-2xl">
        <DialogHeader className="p-6 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-800">
              Assign Ready Stock Cores ({coreType})
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-500">
            Select up to <strong>{requiredCount}</strong> pre-tested cores from ready stock for this order.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 bg-white border-b border-slate-100 shrink-0 flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by Core ID or Serial..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg"
            />
          </div>
          <div className="text-sm font-bold text-slate-700 bg-slate-100 px-4 py-2 rounded-lg shrink-0">
            Selected: <span className="text-blue-600">{selectedIds.length}</span> / {requiredCount}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 font-medium">Fetching ready stock...</p>
            </div>
          ) : filteredCores.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCores.map((core) => {
                const isSelected = selectedIds.includes(core.coreId);
                return (
                  <div 
                    key={core._id} 
                    onClick={() => handleToggleCore(core.coreId)}
                    className={`group relative bg-white border rounded-2xl p-6 hover:shadow-xl transition-all duration-300 flex flex-col gap-6 cursor-pointer ${
                      isSelected ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-slate-200'
                    }`}
                  >
                    {/* Status & Type Bar */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest px-2.5 py-1 bg-blue-50 rounded-md flex-shrink-0">
                        {core.coreType || core.specifications?.coreType || 'Core Unit'}
                      </span>
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <div className="p-1 bg-blue-600 text-white rounded-full">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-full border border-green-100 flex-shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0"></div>
                          <span className="text-[10px] font-black text-green-700 uppercase tracking-tight whitespace-nowrap">Available</span>
                        </div>
                      </div>
                    </div>

                    {/* Identification Section */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Internal Reference</span>
                      <h4 className="text-lg font-black text-slate-900 break-all leading-none tracking-tight">
                        {core.coreId || core.serialNumber}
                      </h4>
                    </div>

                    {/* Specifications Section */}
                    {core.specifications && (
                      <div className="grid grid-cols-1 gap-2 text-xs border-t pt-3 border-slate-100">
                        <div>
                          <span className="text-slate-400">Turns</span>
                          <p className="font-bold text-slate-700">{core.specifications.turns || '-'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-24 px-6 text-center bg-white rounded-2xl border-2 border-dashed border-slate-100">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">No Matching Stock</h3>
              <p className="text-slate-500 max-w-xs mx-auto">
                We couldn't find any ready cores matching your search query.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSearch('')}
                className="mt-8 border-slate-200 hover:bg-slate-50 rounded-xl px-10 h-10 font-bold"
              >
                Clear Search
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 bg-white border-t flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} className="h-11 px-8 text-slate-400 hover:text-slate-800 font-bold rounded-xl transition-colors">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={selectedIds.length > requiredCount}
            className="h-11 px-8 font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100"
          >
            Confirm Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

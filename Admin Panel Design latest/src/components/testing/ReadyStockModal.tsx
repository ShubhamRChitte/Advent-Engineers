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
  coreId: string;
  serialNumber?: string;
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
  const [filterRatio, setFilterRatio] = useState('');
  const [filterBurden, setFilterBurden] = useState('');
  const [filterClass, setFilterClass] = useState('');
  
  const filteredCores = cores.filter(c => {
    if (!c) return false;
    const matchesSearch = (c.coreId || c.serialNumber || "").toLowerCase().includes(search.toLowerCase());
    const matchesRatio = !filterRatio || c.specifications?.ratio === filterRatio;
    const matchesBurden = !filterBurden || c.specifications?.burden === filterBurden;
    const matchesClass = !filterClass || c.specifications?.class === filterClass;
    return matchesSearch && matchesRatio && matchesBurden && matchesClass;
  });

  const ratios = Array.from(new Set(cores.map(c => c.specifications?.ratio).filter(Boolean)));
  const burdens = Array.from(new Set(cores.map(c => c.specifications?.burden).filter(Boolean)));
  const classes = Array.from(new Set(cores.map(c => c.specifications?.class).filter(Boolean)));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 bg-slate-50 border-none shadow-2xl">
        <DialogHeader className="p-6 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-800">Select Replacement Core</DialogTitle>
          </div>
          <DialogDescription className="text-slate-500">
            Choose a pre-tested core from ready stock to replace the failed unit.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 bg-white border-b border-slate-100 shrink-0">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by Core ID or Serial..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select 
                className="h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={filterRatio}
                onChange={(e) => setFilterRatio(e.target.value)}
              >
                <option value="">All Ratios</option>
                {ratios.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <select 
                className="h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={filterBurden}
                onChange={(e) => setFilterBurden(e.target.value)}
              >
                <option value="">All Burdens</option>
                {burdens.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <select 
                className="h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
              >
                <option value="">All Classes</option>
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 font-medium">Fetching ready stock...</p>
            </div>
          ) : filteredCores.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCores.map((core) => (
                <div 
                  key={core._id} 
                  className="group relative bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider px-2 py-0.5 bg-blue-50 rounded-full mb-1 inline-block">
                          {core.specifications?.coreType || 'Metering'}
                        </span>
                        <h4 className="text-base font-bold text-slate-800 block leading-tight">
                          {core.coreId || core.serialNumber}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase leading-none mb-1">Status</span>
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Available</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase leading-none mb-1">Ratio</span>
                        <span className="text-sm font-bold text-slate-700">{core.specifications?.ratio || 'N/A'}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase leading-none mb-1">Burden</span>
                        <span className="text-sm font-bold text-slate-700">{core.specifications?.burden || 'N/A'}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase leading-none mb-1">Class</span>
                        <span className="text-sm font-bold text-slate-700">{core.specifications?.class || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={() => onSelect(core)} 
                    className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold h-10 rounded-lg transition-all group-hover:shadow-lg active:scale-[0.98]"
                  >
                    Select Core
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 px-6 text-center bg-white rounded-2xl border-2 border-dashed border-slate-100">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">No Matching Stock</h3>
              <p className="text-slate-500 max-w-xs mx-auto">
                We couldn't find any ready cores matching your current specifications and filters.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { setSearch(''); setFilterRatio(''); setFilterBurden(''); setFilterClass(''); }}
                className="mt-8 border-slate-200 hover:bg-slate-50 rounded-xl px-10 h-10 font-bold"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 bg-white border-t flex justify-end">
          <Button variant="ghost" onClick={onClose} className="h-11 px-8 text-slate-400 hover:text-slate-800 font-bold rounded-xl transition-colors">
            Cancel Selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Trash2, AlertTriangle, Database, Search, Eye, FlaskConical, Cpu } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

interface CollectionStat {
  id: string;
  name: string;
  count: number;
}

interface RecordData {
  _id: string;
  title: string;
  description: string;
  sub: string;
  untestedCores?: number;
  availableCores?: number;
  createdAt: string;
}

export function DataCleanupPage() {
  const [collections, setCollections] = useState<CollectionStat[]>([]);
  const [activeCollection, setActiveCollection] = useState<string>('');
  const [records, setRecords] = useState<RecordData[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMessageTarget, setViewMessageTarget] = useState<RecordData | null>(null);

  // Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RecordData | 'ALL' | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const fetchCollections = async () => {
    try {
      const res = await axios.get('/database-admin/collections', { withCredentials: true });
      if (res.data.success) {
        setCollections(res.data.data);
        if (!activeCollection && res.data.data.length > 0) {
          setActiveCollection(res.data.data[0].id);
        }
      }
    } catch (err) {
      toast.error('Failed to load collections');
    }
  };

  const fetchRecords = async (collectionId: string, pageNum: number, search: string = '') => {
    setLoading(true);
    try {
      const res = await axios.get(`/database-admin/records/${collectionId}?page=${pageNum}&limit=10&search=${encodeURIComponent(search)}`, { withCredentials: true });
      if (res.data.success) {
        setRecords(res.data.data);
        setTotalPages(res.data.pagination.pages);
      }
    } catch (err) {
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    if (activeCollection) {
      setPage(1);
      setSearchTerm('');
      fetchRecords(activeCollection, 1, '');
    }
  }, [activeCollection]);

  // Debounced search
  useEffect(() => {
    if (activeCollection) {
      const timer = setTimeout(() => {
        setPage(1);
        fetchRecords(activeCollection, 1, searchTerm);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchTerm]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
      fetchRecords(activeCollection, newPage, searchTerm);
    }
  };

  const openDeleteModal = (target: RecordData | 'ALL') => {
    setDeleteTarget(target);
    setConfirmText('');
    setIsDeleteModalOpen(true);
  };

  const handleDeleteExecute = async () => {
    if (!deleteTarget) return;

    const requiredText = deleteTarget === 'ALL' ? 'DELETE ALL' : 'DELETE';
    if (confirmText !== requiredText) {
      toast.error(`Please type "${requiredText}" to confirm.`);
      return;
    }

    try {
      if (deleteTarget === 'ALL') {
        const res = await axios.delete(`/database-admin/records/${activeCollection}`, { withCredentials: true });
        if (res.data.success) toast.success(`All records in ${activeCollection} deleted successfully.`);
      } else {
        const res = await axios.delete(`/database-admin/records/${activeCollection}/${deleteTarget._id}`, { withCredentials: true });
        if (res.data.success) toast.success('Record deleted successfully.');
      }
      setIsDeleteModalOpen(false);
      fetchCollections();
      fetchRecords(activeCollection, page);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete data');
    }
  };

  return (
    <div className="space-y-6 w-full pb-8">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-red-100 text-red-600 rounded-lg">
          <Database className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Database Data Cleanup</h2>
          <p className="text-muted-foreground mt-1">Manage and cascade-delete system records. Proceed with extreme caution.</p>
        </div>
      </div>

      {collections.length > 0 && (
        <Tabs value={activeCollection} onValueChange={setActiveCollection} className="w-full">
          <TabsList className="bg-gray-100/50 p-1 mb-6 flex flex-wrap gap-1 rounded-lg h-auto">
            {collections.map(col => (
              <TabsTrigger 
                key={col.id} 
                value={col.id} 
                className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm px-4 py-2 rounded-md text-sm font-medium transition-all"
              >
                {col.name}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeCollection === col.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
                }`}>
                  {col.count}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mb-6 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search records by ID, name, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full bg-white border-gray-200"
            />
          </div>

          <TabsContent value={activeCollection} className="mt-0">
            <Card className="border-red-200 shadow-sm w-full">
              <CardHeader className="bg-red-50/50 border-b border-red-100 py-4 flex flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-red-700">
                  <AlertTriangle className="w-5 h-5" />
                  <div>
                    <CardTitle className="text-lg">Danger Zone</CardTitle>
                    <p className="text-sm font-normal text-red-600/80 mt-0.5">
                      Clearing this collection will automatically cascade-delete all linked child records.
                    </p>
                  </div>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={() => openDeleteModal('ALL')}
                  disabled={records.length === 0}
                  className="shrink-0"
                >
                  Delete All {collections.find(c => c.id === activeCollection)?.name}
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-3">
                    <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    <span>Loading records...</span>
                  </div>
                ) : records.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">No records found in this collection.</div>
                ) : (
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50/50 text-gray-600 font-medium border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-4 whitespace-nowrap">
                            {activeCollection === 'notifications' ? 'Type' : 
                             activeCollection === 'orders' ? 'Job ID' :
                             activeCollection === 'transformers' ? 'Transformer ID' :
                             activeCollection === 'failed-transformers' ? 'Transformer ID' :
                             activeCollection === 'ready-stock' ? 'Core ID' : 'ID'}
                          </th>
                          <th className="px-6 py-4">
                            {activeCollection === 'notifications' ? 'Message' : 
                             activeCollection === 'orders' ? 'Client Name' :
                             activeCollection === 'transformers' ? 'Transformer Type' :
                             activeCollection === 'failed-transformers' ? 'Core Type' :
                             activeCollection === 'ready-stock' ? 'Core Type' : 'Details'}
                          </th>
                          <th className="px-6 py-4 whitespace-nowrap">
                            {activeCollection === 'notifications' ? 'Job ID / Date' : 
                             activeCollection === 'transformers' ? 'Current Stage / Date' :
                             'Status / Date'}
                          </th>
                          {activeCollection === 'pre-test-batches' && (
                            <th className="px-6 py-4 whitespace-nowrap">Cores Remaining</th>
                          )}
                          <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {records.map(record => (
                          <tr key={record._id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{record.title}</td>
                            <td className="px-6 py-4 text-gray-500 w-full max-w-0">
                              {activeCollection === 'notifications' ? (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 h-8 px-4 font-medium"
                                  onClick={() => setViewMessageTarget(record)}
                                  title="View Message"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Message
                                </Button>
                              ) : (
                                <div className="truncate w-full">
                                  {record.description}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                              <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md font-medium text-xs mb-1.5">{record.sub}</span>
                              <div className="text-xs text-gray-400">{new Date(record.createdAt).toLocaleDateString()}</div>
                            </td>
                            {activeCollection === 'pre-test-batches' && (
                              <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                                <div className="flex flex-col gap-1 text-xs">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                    <FlaskConical className="w-3 h-3 mr-1" /> {record.untestedCores ?? 0} Untested
                                  </span>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    <Cpu className="w-3 h-3 mr-1" /> {record.availableCores ?? 0} In Ready Stock
                                  </span>
                                </div>
                              </td>
                            )}
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => openDeleteModal(record)}
                                  title="Delete Record"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="p-4 flex items-center justify-between bg-gray-50/50 border-t border-gray-100">
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
                      Previous
                    </Button>
                    <span className="text-sm font-medium text-gray-600">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Confirm Deletion</h3>
            </div>
            
            <div className="mb-6 space-y-4">
              <p className="text-gray-700 text-base">
                {deleteTarget === 'ALL' 
                  ? `You are about to permanently delete ALL records in the ${activeCollection} collection.` 
                  : `You are about to permanently delete record: ${deleteTarget?.title}.`}
              </p>
              <div className="text-sm text-red-700 bg-red-50 p-4 rounded-lg border border-red-200 leading-relaxed">
                <span className="font-bold flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4"/> Warning</span>
                This action will trigger cascading deletes (e.g. deleting an order deletes its transformers and tests). This cannot be undone.
              </div>
              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <span className="font-bold font-mono bg-gray-100 px-2 py-1 rounded-md text-black border">{deleteTarget === 'ALL' ? 'DELETE ALL' : 'DELETE'}</span> to confirm:
                </label>
                <Input 
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={deleteTarget === 'ALL' ? 'DELETE ALL' : 'DELETE'}
                  className="border-gray-300 focus:border-red-500 focus:ring-red-500 h-11"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="px-6">Cancel</Button>
              <Button 
                variant="destructive"
                onClick={handleDeleteExecute}
                disabled={confirmText !== (deleteTarget === 'ALL' ? 'DELETE ALL' : 'DELETE')}
                className="px-6"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Message Modal */}
      {viewMessageTarget && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setViewMessageTarget(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200 border-2 border-gray-300 flex flex-col relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-blue-600 mb-4">
              <div className="p-2 bg-blue-100 rounded-full shrink-0">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">Notification Details</h3>
            </div>
            
            <div className="mb-6 flex-1">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-300 text-gray-800 break-words whitespace-pre-wrap leading-relaxed min-h-[80px] text-sm shadow-inner">
                {viewMessageTarget.description}
              </div>
              <div className="flex flex-col gap-1 mt-4 text-xs text-gray-500 px-1">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Type:</span> 
                  <span>{viewMessageTarget.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">ID/Date:</span> 
                  <span>{viewMessageTarget.sub}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-200 mt-2">
              <Button variant="outline" onClick={() => setViewMessageTarget(null)} className="px-6 h-9 font-medium shadow-sm hover:bg-gray-50">Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

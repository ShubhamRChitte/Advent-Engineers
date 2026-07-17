import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { ChevronRight, Search, PlayCircle } from 'lucide-react';
import axios from '@/utils/axiosConfig';
import { Skeleton } from '../ui/skeleton';
import { CTInspectionReport } from './CTInspectionReport';
import { toast } from 'sonner';

interface CTInspectionModuleProps {
    userName?: string;
}

export function CTInspectionModule({ userName }: CTInspectionModuleProps) {
    const [transformers, setTransformers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTransformer, setSelectedTransformer] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchActiveTransformers();
    }, []);

    const fetchActiveTransformers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/final/active`, {
                withCredentials: true,
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            setTransformers(response.data || []);
        } catch (error) {
            console.error("Error fetching active final transformers:", error);
            toast.error("Failed to fetch transformers.");
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredTransformers = transformers.filter(t => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        return (
            t.uniqueId?.toLowerCase().includes(query) ||
            t.jobId?.toLowerCase().includes(query) ||
            t.orderId?.clientName?.toLowerCase().includes(query) ||
            t.orderId?.transformerName?.toLowerCase().includes(query)
        );
    });

    // --- LEVEL 2: ACTIVE TEST REPORT VIEW ---
    if (selectedTransformer) {
        return (
            <div className="space-y-6">
                {/* Toolbar */}
                <div className="flex items-center justify-between no-print mb-6">
                    <Button variant="outline" size="sm" onClick={() => {
                        setSelectedTransformer(null);
                        fetchActiveTransformers();
                    }} className="gap-2">
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        Back to List
                    </Button>
                    <Badge className="bg-indigo-100 text-indigo-700 mt-1 self-center">Inspection Mode</Badge>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm print:p-0 print:shadow-none print:bg-transparent">
                    <CTInspectionReport
                        transformer={selectedTransformer}
                        testerName={userName || 'Tester'}
                    />
                </div>
            </div>
        );
    }

    // --- LEVEL 1: ACTIVE TRANSFORMERS LIST ---
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Final Test Inspection</h2>
                <p className="text-gray-500 mt-1">Select a transformer that has come for final testing to perform the final test report.</p>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                    placeholder="Search Job ID, Transformer ID, Client..."
                    className="pl-9 w-full bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : filteredTransformers.length === 0 ? (
                <Card className="p-8 text-center text-gray-500 border border-gray-200">
                    No transformers found in final testing stage.
                </Card>
            ) : (
                <Card className="overflow-hidden border border-gray-200 shadow-sm bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs font-semibold">
                                <tr>
                                    <th className="p-4">Transformer ID</th>
                                    <th className="p-4">Job ID</th>
                                    <th className="p-4">Client Name</th>
                                    <th className="p-4">Transformer Name</th>
                                    <th className="p-4 text-center">Stage</th>
                                    <th className="p-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {filteredTransformers.map((t) => (
                                    <tr 
                                        key={t._id} 
                                        className="hover:bg-indigo-50/30 transition-colors cursor-pointer"
                                        onClick={() => setSelectedTransformer(t)}
                                    >
                                        <td className="p-4 font-semibold text-slate-900">{t.uniqueId}</td>
                                        <td className="p-4 text-slate-600 font-medium">{t.jobId || 'N/A'}</td>
                                        <td className="p-4 text-slate-600">{t.orderId?.clientName || 'N/A'}</td>
                                        <td className="p-4 text-slate-600">{t.orderId?.transformerName || 'N/A'}</td>
                                        <td className="p-4 text-center">
                                            <Badge className="bg-amber-50 text-amber-700 border border-amber-200">
                                                Final Testing
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm"
                                                onClick={() => setSelectedTransformer(t)}
                                            >
                                                <PlayCircle className="w-4 h-4" />
                                                Test
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}

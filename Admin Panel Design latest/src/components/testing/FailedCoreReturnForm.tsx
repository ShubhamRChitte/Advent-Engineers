import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
    X,
    FileText,
    Calendar,
    User,
    ClipboardList,
    Send,
} from 'lucide-react';
import axios from 'axios';

interface FailedCore {
    _id?: string;
    internalCoreNo: string;
    vendorCoreNo?: string;
    coreVendorNo?: string;
    failureReason: string;
    orderNumber: string;
    jobId: string;
    clientName: string;
}

interface FailedCoreReturnFormProps {
    vendorName: string;
    selectedCores: FailedCore[];
    onClose: () => void;
    onSuccess: (data: any) => void;
}

export function FailedCoreReturnForm({ vendorName, selectedCores, onClose, onSuccess }: FailedCoreReturnFormProps) {
    const [remarks, setRemarks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = async () => {
        if (selectedCores.length === 0) return;
        
        setIsSubmitting(true);
        try {
            const payload = {
                vendorName,
                returnDate,
                remarks,
                cores: selectedCores.map(c => ({
                    failedCoreId: c._id,
                    internalCoreNo: c.internalCoreNo,
                    vendorCoreNo: c.vendorCoreNo || c.coreVendorNo,
                    failureReason: c.failureReason,
                    orderNumber: c.orderNumber,
                    jobId: c.jobId,
                    clientName: c.clientName
                }))
            };

            const res = await axios.post('http://localhost:5001/api/return-forms', payload, { withCredentials: true });
            
            if (res.data.success) {
                alert("Return Form Generated Successfully!");
                onSuccess(res.data.data);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to generate return form");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border-0">
                {/* Header */}
                <div className="bg-red-700 p-6 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8" />
                        <div>
                            <h3 className="text-xl font-bold tracking-tight">Generate Vendor Return Form</h3>
                            <p className="text-red-100 text-sm opacity-90">Official documentation for returning failed components</p>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={onClose} className="text-white hover:bg-white/20 rounded-full h-10 w-10 p-0">
                        <X className="w-6 h-6" />
                    </Button>
                </div>

                <div className="p-8 flex-1 overflow-y-auto min-h-0 space-y-8 bg-gray-50/50">
                    {/* Header Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <User className="w-3 h-3 text-red-600" /> Vendor Name
                            </label>
                            <div className="p-3 bg-white border border-gray-200 rounded-lg font-semibold text-gray-800 shadow-sm">{vendorName}</div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-red-600" /> Return Date
                            </label>
                            <Input 
                                type="date" 
                                value={returnDate} 
                                onChange={(e) => setReturnDate(e.target.value)}
                                className="bg-white border-gray-200 rounded-lg shadow-sm focus:ring-red-500 focus:border-red-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <ClipboardList className="w-3 h-3 text-red-600" /> Item Count
                            </label>
                            <div className="p-3 bg-white border border-gray-200 rounded-lg font-bold text-red-700 shadow-sm">
                                {selectedCores.length} Failed Cores Selected
                            </div>
                        </div>
                    </div>

                    {/* Cores List */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 border-b border-gray-200 pb-2">
                             Selected Failed Cores Details
                        </h4>
                        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-md bg-white">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-100/80 border-b border-gray-200 text-gray-600">
                                        <th className="p-3 text-left font-bold w-12 text-center">#</th>
                                        <th className="p-3 text-left font-bold">Internal ID</th>
                                        <th className="p-3 text-left font-bold">Vendor No</th>
                                        <th className="p-3 text-left font-bold">Job / Order</th>
                                        <th className="p-3 text-left font-bold">Failure Reason</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedCores.map((core, idx) => (
                                        <tr key={idx} className="border-b border-gray-50 hover:bg-red-50/30 transition-colors">
                                            <td className="p-4 text-center text-gray-400 font-mono">{idx + 1}</td>
                                            <td className="p-4 font-mono font-bold text-red-700">{core.internalCoreNo}</td>
                                            <td className="p-4 font-medium text-gray-600">{core.vendorCoreNo || core.coreVendorNo}</td>
                                            <td className="p-4">
                                                <div className="text-xs font-bold text-gray-800">{core.jobId}</div>
                                                <div className="text-[10px] text-gray-500">{core.orderNumber}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-block px-2 py-1 bg-red-100 text-red-700 rounded text-[11px] font-semibold border border-red-200">
                                                    {core.failureReason}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Remarks Area */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                             Special Instructions / Remarks
                        </label>
                        <textarea
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            className="w-full p-4 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-red-500 focus:border-red-500 transition-all"
                            placeholder="Enter any specific instructions for the vendor regarding repair or replacement..."
                            rows={3}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-gray-100 flex justify-end items-center gap-3 flex-shrink-0 sticky bottom-0 z-10">
                    <Button variant="ghost" onClick={onClose} className="hover:bg-gray-100 px-6 font-medium text-gray-600">
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting || selectedCores.length === 0}
                        className="!bg-[#3b82f6] hover:!bg-[#2563eb] !text-white shadow-md px-6 font-medium h-10 rounded-md whitespace-nowrap flex items-center gap-2 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                        {isSubmitting ? "Generating..." : "Generate & Mark as Returned"}
                    </Button>
                </div>
            </Card>
        </div>
    );
}

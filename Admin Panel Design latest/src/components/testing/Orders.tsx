import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Search, Eye, Users } from 'lucide-react';
import { User } from '../../App';

interface OrdersProps {
    user?: User;
}

interface Order {
    _id: string;
    jobId: string;
    clientName: string;
    transformerType: string;
    testsCompleted: number;
    passCount: number;
    failCount: number;
    status: string;
    [key: string]: any;
}

export function Orders(_props: OrdersProps) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState<string>('All');

    useEffect(() => {
        fetchCompletedOrders();
    }, []);

    const fetchCompletedOrders = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/core-tests/orders/approved`, {
                withCredentials: true,
            });
            setOrders(res.data);
        } catch (err) {
            console.error('Failed to fetch completed orders:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewReport = (jobId: string) => {
        window.open(`/report/${jobId}`, '_blank');
    };

    const clients = useMemo(() => {
        const uniqueClients = new Set(orders.map((o) => o.clientName));
        return ['All', ...Array.from(uniqueClients)];
    }, [orders]);

    const filteredAndGroupedOrders = useMemo(() => {
        // 1. Filter
        const filtered = orders.filter((order) => {
            const matchesSearch = order?.jobId ? order.jobId.toLowerCase().includes(searchTerm.toLowerCase()) : false;
            const matchesClient = selectedClient === 'All' || order.clientName === selectedClient;
            return matchesSearch && matchesClient;
        });

        const grouped = filtered.reduce((acc, order) => {
            if (!acc[order.clientName]) {
                acc[order.clientName] = [];
            }
            acc[order.clientName]!.push(order);
            return acc;
        }, {} as Record<string, Order[]>);

        return grouped;
    }, [orders, searchTerm, selectedClient]);

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading completed orders...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-semibold">Completed Reports & Orders</h2>
                    <p className="text-gray-500 mt-1">View completed core testing orders and multi-core reports</p>
                </div>

                <div className="flex gap-3">
                    {/* Client Filter */}
                    <select
                        className="h-10 px-3 py-2 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#003a70]"
                        value={selectedClient}
                        onChange={(e) => setSelectedClient(e.target.value)}
                    >
                        {clients.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search Job ID..."
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003a70] h-10 w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {Object.keys(filteredAndGroupedOrders).length === 0 ? (
                <Card className="p-8 text-center">
                    <p className="text-gray-500">No completed orders found.</p>
                </Card>
            ) : (
                <div className="space-y-8">
                    {Object.entries(filteredAndGroupedOrders).map(([clientName, clientOrders]) => (
                        <div key={clientName} className="space-y-3">
                            <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-md border border-gray-200">
                                <Users className="w-5 h-5 text-[#003a70]" />
                                <h3 className="text-lg font-medium text-gray-800">{clientName}</h3>
                                <Badge className="ml-auto bg-white text-gray-600 border border-gray-300">
                                    {clientOrders.length} Orders
                                </Badge>
                            </div>

                            <Card className="overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="text-left p-4 text-sm font-semibold text-gray-600">Job ID</th>
                                                <th className="text-left p-4 text-sm font-semibold text-gray-600">Type</th>
                                                <th className="text-center p-4 text-sm font-semibold text-gray-600">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {clientOrders.map((order) => (
                                                <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-0">
                                                    <td className="p-4 font-medium text-gray-900">{order.jobId}</td>
                                                    <td className="p-4 text-sm text-gray-600">{order.transformerType || 'N/A'}</td>
                                                    <td className="p-4">
                                                        <div className="flex gap-2 justify-center">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-[#003a70] text-[#003a70] hover:bg-[#003a70] hover:text-white"
                                                                onClick={() => handleViewReport(order.jobId)}
                                                            >
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                View Report
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

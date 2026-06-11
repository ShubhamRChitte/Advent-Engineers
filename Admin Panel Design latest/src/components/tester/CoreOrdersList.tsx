import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Eye, PlayCircle, ChevronDown, ChevronUp, CheckCircle, XCircle, FileText, Search, Filter } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import axios from 'axios';
import { User } from '../../App';

interface UserReading {
  coreId: string;
  date: string;
  result: 'P' | 'F';
  type: string;
  readingValue?: string;
}

interface Order {
  _id: string;
  jobId: string;
  clientName: string;
  transformerType: string;
  quantity: number;
  transformerQuantity?: number; // fallback
  assignedDate?: string;
  createdAt: string;
  status: string;
  deadline: string;
  currentStage: string;
  assignments: any; // Allow both Object (legacy) and Array (new)
  userStats?: {
    testsCompleted: number;
    passed: number;
    failed: number;
    userReadings: UserReading[];
  };
  assignedUnitIds?: string[]; // Added for granular filtering
}

interface CoreOrdersListProps {
  onStartTesting: (order: any) => void;
  onViewReports?: (order: any) => void;
  user?: User;
  type?: 'active' | 'history';
}

export function CoreOrdersList({ onStartTesting, onViewReports, user, type = 'active' }: CoreOrdersListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [type]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/assigneed_orders`, {
        params: { type },
        withCredentials: true
      });
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      case 'Core Testing In Progress': return 'bg-blue-100 text-blue-700';
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Core Testing Completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };



  // Check if the current user is the ACTIVE assigned tester
  const isAssignedTester = (order: Order) => {
    if (!user || !order.assignments) return false;

    // Check Legacy Object Format
    if (!Array.isArray(order.assignments)) {
      return order.assignments.core_tester === user.name;
    }

    // Check New Array Format
    return order.assignments.some((a: any) =>
      a.stage === 'core' && a.testerName === user.name
    );
  };

  // Check if order is editable
  const isEditable = (order: Order) => {
    if (type === 'history') return false; // History is always read-only
    const isActive = order.currentStage === 'core' &&
      order.status !== 'Completed' &&
      order.status !== 'Core Testing Completed';
    return isAssignedTester(order) && isActive;
  };

  const handleAction = (order: Order) => {
    const editable = isEditable(order);
    // Pass extra flag to indicate read-only mode if not editable
    onStartTesting({ ...order, isReadOnly: !editable });
  };

  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase().trim();
    const status = order.status || '';

    let matchesSearch = true;
    if (q) {
      const normalJobId = (order.jobId || '').toLowerCase().replace(/\s+/g, '');
      const normalQuery = q.replace(/\s+/g, '');

      const extractedJobMatch = q.match(/job-?\d{4}-?\d{1,4}/i)?.[0];
      const isTransformerSearch = q.startsWith('tr-') && q.includes(normalJobId);

      const jobMatch = normalJobId.includes(normalQuery) ||
        (normalQuery.length > 5 && normalJobId.length > 0 && normalQuery.includes(normalJobId)) ||
        (extractedJobMatch && normalJobId.includes(extractedJobMatch.toLowerCase().replace(/\s+/g, '')));

      matchesSearch = jobMatch || isTransformerSearch || (order.clientName || '').toLowerCase().includes(q) || (order.transformerType || '').toLowerCase().includes(q);
    }

    if (selectedStatus === 'all') return matchesSearch;
    if (selectedStatus === 'in-progress') return matchesSearch && (status.includes('Progress') || status === 'Assigned');
    if (selectedStatus === 'completed') return matchesSearch && status.includes('Completed');
    return matchesSearch && status === selectedStatus;
  });

  const statusCounts = {
    all: orders.length,
    inProgress: orders.filter((o) => (o.status || '').includes('Progress') || (o.status || '') === 'Assigned').length,
    completed: orders.filter((o) => (o.status || '').includes('Completed')).length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 bg-gray-50 border-gray-100">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>

        {/* Filters Skeleton */}
        <div className="flex flex-col lg:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>

        {/* Table Skeleton */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-8"></th>
                  <th className="text-left p-4"><Skeleton className="h-4 w-20" /></th>
                  <th className="text-left p-4"><Skeleton className="h-4 w-32" /></th>
                  <th className="text-left p-4"><Skeleton className="h-4 w-24" /></th>
                  <th className="text-center p-4"><Skeleton className="h-4 w-24 mx-auto" /></th>
                  <th className="text-center p-4"><Skeleton className="h-4 w-24 mx-auto" /></th>
                  <th className="text-left p-4"><Skeleton className="h-4 w-20" /></th>
                  <th className="text-center p-4"><Skeleton className="h-4 w-24 mx-auto" /></th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="p-4 text-center"><Skeleton className="h-4 w-4 mx-auto" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="p-4 text-center"><Skeleton className="h-6 w-12 mx-auto" /></td>
                    <td className="p-4 text-center"><Skeleton className="h-6 w-20 mx-auto" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-center">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2>{type === 'history' ? 'Order History' : 'Assigned Orders'}</h2>
          <p className="text-gray-500 mt-1">
            {type === 'history'
              ? 'View your completed tests and audit logs'
              : 'View and start testing on assigned core orders'}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedStatus('all')}>
          <p className="text-sm text-gray-600">All Orders</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{statusCounts.all}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedStatus('in-progress')}>
          <p className="text-sm text-gray-600">Active / In Progress</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{statusCounts.inProgress}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-300 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedStatus('completed')}>
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{statusCounts.completed}</p>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search by Job ID or Transformer ID..."
            className="pl-9 w-full bg-white shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'in-progress', label: 'In Progress' },
            { id: 'completed', label: 'Completed' }
          ].map((status) => (
            <Button
              key={status.id}
              variant={selectedStatus === status.id ? 'default' : 'outline'}
              className={selectedStatus === status.id ? 'bg-blue-600 hover:bg-blue-700' : ''}
              onClick={() => setSelectedStatus(status.id)}
            >
              <Filter className="w-4 h-4 mr-2" />
              {status.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-8"></th>{/* Expand chevron */}
                <th className="text-left p-4 text-sm">Job ID</th>
                <th className="text-left p-4 text-sm">Client</th>
                <th className="text-left p-4 text-sm">Type</th>
                <th className="text-center p-4 text-sm">Tests Completed</th>{/* Personalized */}
                <th className="text-center p-4 text-sm">Pass / Fail</th>{/* Personalized */}
                <th className="text-left p-4 text-sm">Status</th>
                <th className="text-center p-4 text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const isExpanded = expandedOrderId === order._id;
                  const stats = order.userStats || { testsCompleted: 0, passed: 0, failed: 0, userReadings: [] };

                  return (
                    <>
                      <tr key={order._id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-gray-50' : ''}`}>
                        <td className="p-4 text-center">
                          <Button variant="ghost" size="sm" onClick={() => toggleExpand(order._id)} className="h-8 w-8 p-0">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </td>
                        <td className="p-4 font-medium">{order.jobId}</td>
                        <td className="p-4 text-sm">{order.clientName}</td>
                        <td className="p-4 text-sm">{order.transformerType}</td>

                        {/* Personalized Stats */}
                        <td className="p-4 text-center">
                          <div className="font-medium text-gray-900">{stats.testsCompleted}</div>
                          <div className="text-xs text-gray-500">tests by you</div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-green-600 font-medium">{stats.passed}</span>
                            <span className="text-gray-300">/</span>
                            <span className="text-red-600 font-medium">{stats.failed}</span>
                          </div>
                        </td>

                        <td className="p-4">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2 justify-center">
                            {isEditable(order) ? (
                              <Button
                                size="sm"
                                onClick={() => handleAction(order)}
                                className="bg-[#003a70] hover:bg-[#002850]"
                              >
                                <PlayCircle className="w-4 h-4 mr-2" />
                                Start
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAction(order)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-purple-600 hover:bg-purple-700"
                              onClick={() => onViewReports?.(order)}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Reports
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDED ROW - AUDIT VIEW */}
                      {isExpanded && (
                        <tr className="bg-gray-50">
                          <td colSpan={8} className="p-4 pl-12">
                            <div className="bg-white rounded border border-gray-200 overflow-hidden">
                              <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 text-xs font-semibold text-gray-600">
                                My Test History (Ordered by Date)
                              </div>
                              {stats.userReadings.length > 0 ? (
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-gray-100">
                                      <th className="p-2 text-left w-32">Date</th>
                                      <th className="p-2 text-left">Core ID</th>
                                      <th className="p-2 text-left">Type</th>
                                      <th className="p-2 text-left">Readings</th>
                                      <th className="p-2 text-left">Result</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {stats.userReadings.map((reading, idx) => (
                                      <tr key={idx} className="border-b border-gray-100 last:border-0">
                                        <td className="p-2 text-gray-600">{new Date(reading.date).toLocaleDateString('en-GB')}</td>
                                        <td className="p-2 font-mono text-gray-700">{reading.coreId}</td>
                                        <td className="p-2 text-gray-600">{reading.type}</td>
                                        <td className="p-2 text-gray-600 font-mono text-xs">{reading.readingValue || '-'}</td>
                                        <td className="p-2">
                                          {reading.result === 'P' ? (
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px] px-1.5 flex w-fit gap-1 items-center">
                                              <CheckCircle className="w-3 h-3" /> Pass
                                            </Badge>
                                          ) : (
                                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-[10px] px-1.5 flex w-fit gap-1 items-center">
                                              <XCircle className="w-3 h-3" /> Fail
                                            </Badge>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                  No test history found for you on this order.
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    No matching orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

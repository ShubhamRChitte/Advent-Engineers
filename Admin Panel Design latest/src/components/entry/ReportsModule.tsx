import { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ClientOrdersView } from './ClientOrdersView';
import {
  Users,
  Phone,
  Package,
  ChevronRight,
  Search,
  Calendar,
  Filter,
  FileText
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  contactNumber: string;
  totalOrders: number;
  completedOrders: number;
  inProgressOrders: number;
  email: string;
}

interface ReportsModuleProps {
  fromAdmin?: boolean;
}

export function ReportsModule({ fromAdmin = false }: ReportsModuleProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'3months' | '1month' | 'custom'>('3months');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  const [clients, setClients] = useState<Client[]>([]); // Initialize as empty array
  const [loading, setLoading] = useState(true);

  // Fetch client stats on mount
  useEffect(() => {
    const fetchClientStats = async () => {
      try {
        const response = await axios.get(`/orders/clients/stats`);
        const data = response.data;
        if (data.success) {
          setClients(data.clients);
        }
      } catch (error) {
        console.error("Error fetching client reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientStats();
  }, []);

  // const clients: Client[] = [ ... ]; // Logic replaced by API call

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.contactNumber.includes(searchQuery)
  );

  const getDateRangeText = () => {
    if (dateFilter === '3months') return 'Last 3 Months';
    if (dateFilter === '1month') return 'Last 1 Month';
    if (customDateFrom && customDateTo) {
      return `${customDateFrom} to ${customDateTo}`;
    }
    return 'Custom Date Range';
  };

  // If a client is selected, show their orders
  if (selectedClient) {
    return (
      <ClientOrdersView
        client={selectedClient}
        onBack={() => setSelectedClient(null)}
        dateFilter={dateFilter}
        customDateFrom={customDateFrom}
        customDateTo={customDateTo}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2>Client Reports</h2>
        <p className="text-gray-500 mt-1">View and manage test reports for all clients</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-blue-700">Total Clients</p>
              <h3 className="mt-1 text-blue-900">{clients.length}</h3>
            </div>
            <div className="p-3 bg-blue-500 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-purple-700">Total Orders</p>
              <h3 className="mt-1 text-purple-900">
                {clients.reduce((sum, client) => sum + client.totalOrders, 0)}
              </h3>
            </div>
            <div className="p-3 bg-purple-500 rounded-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-green-700">Completed</p>
              <h3 className="mt-1 text-green-900">
                {clients.reduce((sum, client) => sum + client.completedOrders, 0)}
              </h3>
            </div>
            <div className="p-3 bg-green-500 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-orange-700">In Progress</p>
              <h3 className="mt-1 text-orange-900">
                {clients.reduce((sum, client) => sum + client.inProgressOrders, 0)}
              </h3>
            </div>
            <div className="p-3 bg-orange-500 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Date Filter Section */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-gray-900">Filter by Time Period</h3>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          {/* Quick Filters */}
          <div className="flex gap-2">
            <Button
              variant={dateFilter === '3months' ? 'default' : 'outline'}
              className={dateFilter === '3months' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              onClick={() => setDateFilter('3months')}
            >
              Last 3 Months
            </Button>
            <Button
              variant={dateFilter === '1month' ? 'default' : 'outline'}
              className={dateFilter === '1month' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              onClick={() => setDateFilter('1month')}
            >
              Last 1 Month
            </Button>
            <Button
              variant={dateFilter === 'custom' ? 'default' : 'outline'}
              className={dateFilter === 'custom' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              onClick={() => setDateFilter('custom')}
            >
              Custom Range
            </Button>
          </div>

          {/* Custom Date Range */}
          {dateFilter === 'custom' && (
            <div className="flex gap-3 items-center">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">From Date</label>
                <Input
                  type="date"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                  className="h-10"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">To Date</label>
                <Input
                  type="date"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
          )}

          {/* Active Filter Display */}
          <div className="ml-auto">
            <Badge className="bg-blue-600 text-white px-4 py-2">
              <Calendar className="w-4 h-4 mr-2" />
              {getDateRangeText()}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          className="pl-10 h-12"
          placeholder="Search clients by name or contact number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Client List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => (
          <Card key={client.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              {/* Client Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-gray-900 mb-1">{client.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{client.contactNumber}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-lg font-bold text-gray-900">{client.totalOrders}</p>
                </div>
                <div className="text-center border-x border-gray-200">
                  <p className="text-xs text-gray-500">Completed</p>
                  <p className="text-lg font-bold text-green-600">{client.completedOrders}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">In Progress</p>
                  <p className="text-lg font-bold text-orange-600">{client.inProgressOrders}</p>
                </div>
              </div>

              {/* View Reports Button */}
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
                onClick={() => setSelectedClient(client)}
              >
                View Reports
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <Card className="p-12">
          <div className="text-center text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No clients found</p>
            <p className="text-sm mt-1">Try adjusting your search criteria</p>
          </div>
        </Card>
      )}
    </div>
  );
}

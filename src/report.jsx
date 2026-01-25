import React from "react";
import {
  Users,
  Package,
  CheckSquare,
  Calendar,
  Filter,
  Search,
  Phone,
} from "lucide-react";

/* ---------- MAIN COMPONENT ---------- */
export default function Report() {
  return <ClientReports />;
}

/* ---------- Client Reports ---------- */
function ClientReports() {
  const clients = [
    {
      name: "MSED Power Distribution Ltd.",
      phone: "+91 98765 43210",
      total: 12,
      completed: 8,
      progress: 4,
    },
    {
      name: "Gujarat Energy Transmission Corp.",
      phone: "+91 98887 76543",
      total: 18,
      completed: 15,
      progress: 3,
    },
    {
      name: "Tata Power Company",
      phone: "+91 97654 32109",
      total: 25,
      completed: 20,
      progress: 5,
    },
    {
      name: "Reliance Infrastructure",
      phone: "+91 96543 21098",
      total: 10,
      completed: 7,
      progress: 3,
    },
    {
      name: "Adani Transmission Ltd.",
      phone: "+91 95432 10987",
      total: 22,
      completed: 18,
      progress: 4,
    },
    {
      name: "PowerGrid Corporation",
      phone: "+91 94321 09876",
      total: 30,
      completed: 25,
      progress: 5,
    },
    {
      name: "NTPC Limited",
      phone: "+91 93210 98765",
      total: 15,
      completed: 12,
      progress: 3,
    },
    {
      name: "Torrent Power",
      phone: "+91 92109 87654",
      total: 8,
      completed: 6,
      progress: 2,
    },
  ];

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Client Reports
        </h1>
        <p className="text-gray-500">
          View and manage test reports for all clients
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Clients" value="8" bg="bg-blue-100" icon={<Users />} />
        <StatCard title="Total Orders" value="140" bg="bg-purple-100" icon={<Package />} />
        <StatCard title="Completed" value="111" bg="bg-green-100" icon={<CheckSquare />} />
        <StatCard title="In Progress" value="29" bg="bg-orange-100" icon={<Calendar />} />
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <div className="flex items-center gap-2 text-gray-700 mb-4">
          <Filter size={18} />
          <span className="font-medium">Filter by Time Period</span>
        </div>

        <div className="flex justify-between gap-4 flex-wrap">
          <div className="flex gap-3">
            <Button active>Last 3 Months</Button>
            <Button>Last 1 Month</Button>
            <Button>Custom Range</Button>
          </div>

          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg">
            <Calendar size={16} />
            Last 3 Months
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search clients..."
          className="w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Client Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {clients.map((client, index) => (
          <ClientCard key={index} client={client} />
        ))}
      </div>
    </div>
  );
}

/* ---------- Reusable Components ---------- */

function StatCard({ title, value, bg, icon }) {
  return (
    <div className={`flex justify-between items-center p-6 rounded-xl ${bg}`}>
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
      <div className="p-3 bg-blue-600 rounded-lg text-white">
        {icon}
      </div>
    </div>
  );
}

function Button({ children, active }) {
  return (
    <button
      className={`px-4 py-2 rounded-lg border ${
        active
          ? "bg-blue-600 text-white"
          : "bg-white text-gray-700 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

function ClientCard({ client }) {
  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm">
      <div className="flex gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Users className="text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold">{client.name}</h3>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Phone size={14} /> {client.phone}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 text-center bg-gray-50 rounded-lg py-3 mb-4">
        <div>
          <p className="text-xs text-gray-500">Total</p>
          <p className="font-semibold">{client.total}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Completed</p>
          <p className="font-semibold text-green-600">
            {client.completed}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">In Progress</p>
          <p className="font-semibold text-orange-600">
            {client.progress}
          </p>
        </div>
      </div>

      <button className="w-full bg-blue-600 text-white py-2 rounded-lg">
        View Reports →
      </button>
    </div>
  );
}

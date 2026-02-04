import { useEffect, useState } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useNavigate } from "react-router-dom";

import OrderDetailView from "./OrderDetailView";

import {
  Search,
  Eye,
  Filter,
  Download,
  ChevronDown,
} from "lucide-react";

export default function OrderViewList() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);

  // 🔥 FETCH ORDERS FROM BACKEND
  useEffect(() => {
    fetch("http://localhost:5000/api/orders")
      .then((res) => res.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "Assigned":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "In Testing":
        return "bg-purple-100 text-purple-700 border-purple-300";
      case "Completed":
        return "bg-green-100 text-green-700 border-green-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-700";
      case "Medium":
        return "bg-orange-100 text-orange-700";
      case "Low":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.jobId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.transformerName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatus === "all" || order.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: orders.length,
    Pending: orders.filter((o) => o.status === "Pending").length,
    Assigned: orders.filter((o) => o.status === "Assigned").length,
    "In Testing": orders.filter((o) => o.status === "In Testing").length,
    Completed: orders.filter((o) => o.status === "Completed").length,
  };

  if (loading) {
    return <p className="text-center text-gray-500">Loading orders…</p>;
  }

  if (selectedOrder) {
    return (
      <OrderDetailView
        order={selectedOrder}
        onBack={() => setSelectedOrder(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2>Orders List</h2>
          <p className="text-gray-500 mt-1">
            View and manage all transformer orders
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export Orders
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Object.entries(statusCounts).map(([key, value]) => (
          <Card key={key} className="p-4">
            <p className="text-sm text-gray-600">{key}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </Card>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            className="pl-10 h-12"
            placeholder="Search by Order ID, Client Name, or Transformer"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {["all", "Pending", "Assigned", "In Testing", "Completed"].map(
            (status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? "default" : "outline"}
                className={
                  selectedStatus === status
                    ? "bg-blue-600 hover:bg-blue-700"
                    : ""
                }
                onClick={() => setSelectedStatus(status)}
              >
                <Filter className="w-4 h-4 mr-2" />
                {status === "all" ? "All" : status}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Orders Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2">
              <tr>
                <th className="p-4 text-left">Order ID</th>
                <th className="p-4 text-left">Client</th>
                <th className="p-4 text-left">Transformer</th>
                <th className="p-4 text-left">Qty</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Priority</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order._id}>
                  <td className="p-4 font-mono">{order.jobId}</td>
                  <td className="p-4">{order.clientName}</td>
                  <td className="p-4">{order.transformerName}</td>
                  <td className="p-4">{order.quantity}</td>
                  <td className="p-4">
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge className={getPriorityColor(order.priority)}>
                      {order.priority}
                    </Badge>
                  </td>
                  <td className="p-4 flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        navigate(`/orders/${order.jobId}/view`)
                      }
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <ChevronDown className="w-4 h-4 mr-1" />
                      Show Status
                    </Button>
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

import { useState } from "react";

import OrderViewList from "./OrderViewList";
import OrderDetailView from "./OrderDetailView";

import { Card } from "../ui/card";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import { Plus, Filter } from "lucide-react";

export default function OrderView({ role }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState("all");

  const orders = [
    {
      id: "1",
      orderNumber: "ORD-2025-001",
      transformerType: "Dead Tank Type-1",
      quantity: 5,
      client: "PowerGrid Corp",
      orderDate: "2025-01-10",
      deliveryDate: "2025-02-15",
      status: "in-progress",
      priority: "high",
      assignedWorkers: ["John Doe", "Jane Smith"],
      testingStage: 2,
    },
    {
      id: "2",
      orderNumber: "ORD-2025-002",
      transformerType: "Live Tank Type",
      quantity: 3,
      client: "City Electric Ltd",
      orderDate: "2025-01-12",
      deliveryDate: "2025-02-20",
      status: "testing",
      priority: "medium",
      assignedWorkers: ["Mike Johnson"],
      testingStage: 3,
    },
    {
      id: "3",
      orderNumber: "ORD-2025-003",
      transformerType: "Dead Tank Type-2",
      quantity: 8,
      client: "National Grid",
      orderDate: "2025-01-08",
      deliveryDate: "2025-02-10",
      status: "completed",
      priority: "high",
      assignedWorkers: ["Sarah Wilson", "Tom Brown"],
      testingStage: 4,
    },
  ];

  const filteredOrders =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2>Order Management</h2>
          <p className="text-gray-500 mt-1">
            Manage and track all transformer orders
          </p>
        </div>

        {role === "admin" && (
          <Button className="bg-red-600 hover:bg-red-700">
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-500" />

          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="testing">Testing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="dispatched">Dispatched</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-sm text-gray-500">
            Showing {filteredOrders.length} of {orders.length}
          </div>
        </div>
      </Card>

      {/* Orders List */}
      <OrderViewList
        orders={filteredOrders}
        onSelectOrder={setSelectedOrder}
      />

      {/* Order Details */}
      {selectedOrder && (
        <OrderDetailView
          order={selectedOrder}
          onBack={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}

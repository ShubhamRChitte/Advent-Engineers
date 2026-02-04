import { useState } from "react";
import OrderStatusTracker from "./OrderStatusTracker";

import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

import {
  ArrowLeft,
  Search,
  Printer,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";

export default function OrderDetailView({ order, onBack }) {
  const [searchQuery, setSearchQuery] = useState("");

  if (!order) {
    return <div className="p-6 text-gray-500">Select an order to view details</div>;
  }

  // ⭐ SAFE transformer generator using MongoDB jobId
  const generateTransformerUnits = () => {
    if (!order?.jobId) return [];

    const suffix = order.jobId.slice(-6);

    const statuses = [
      { core: "Complete", secondary: "Pending", primary: "Pending", final: "Pending", report: "In Progress" },
      { core: "Complete", secondary: "Rejected", primary: "Rejected", final: "Rejected", report: "Pending" },
      { core: "Complete", secondary: "Complete", primary: "Complete", final: "Complete", report: "Open" },
      { core: "Complete", secondary: "Complete", primary: "Complete", final: "Pending", report: "In Progress" },
    ];

    return Array.from({ length: order.quantity }).map((_, i) => {
      const s = statuses[i % statuses.length];

      return {
        id: i + 1,
        transformerId: `Tata-2407-${suffix}${String(i + 1).padStart(2, "0")}`,
        coreTestStatus: s.core,
        secondaryTestStatus: s.secondary,
        primaryTestStatus: s.primary,
        finalTestStatus: s.final,
        reportStatus: s.report,
      };
    });
  };

  const transformerUnits = generateTransformerUnits();

  const filteredUnits = transformerUnits.filter((u) =>
    u.transformerId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ⭐ STATUS COLORS
  const getStatusColor = (status) => {
    switch (status) {
      case "Complete":
        return "bg-green-100 text-green-700 border-green-300";
      case "Pending":
        return "bg-red-100 text-red-700 border-red-300";
      case "In Progress":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "Rejected":
        return "bg-gray-100 text-gray-700 border-gray-300";
      case "Open":
        return "bg-green-100 text-green-700 border-green-300";
      default:
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Complete":
        return <CheckCircle2 className="w-3 h-3" />;
      case "Pending":
        return <Clock className="w-3 h-3" />;
      case "In Progress":
        return <AlertCircle className="w-3 h-3" />;
      case "Rejected":
        return <XCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const isAllTestsComplete = (u) =>
    u.coreTestStatus === "Complete" &&
    u.secondaryTestStatus === "Complete" &&
    u.primaryTestStatus === "Complete" &&
    u.finalTestStatus === "Complete";

  const completedCount = transformerUnits.filter(isAllTestsComplete).length;

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </Button>

      <Card className="p-6">
        <h1 className="text-center text-red-600 text-3xl mb-6">
          ADVENT ENGINEERS
        </h1>

        {/* ⭐ FIXED — MongoDB fields */}
        <OrderStatusTracker
          currentStage="core-testing"
          orderId={order.jobId}
          orderDate={new Date(order.deadline).toLocaleDateString()}
        />

        <div className="mt-6 flex gap-4">
          <Input
            placeholder="Search Transformer ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </Card>
    </div>
  );
}

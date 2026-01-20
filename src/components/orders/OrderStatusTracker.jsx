import {
  CheckCircle,
  Circle,
  Clock,
  Package,
  Zap,
  Shield,
  Award,
  Truck,
} from "lucide-react";
import { Badge } from "../ui/badge";

export default function OrderStatusTracker({
  currentStage,
  orderDate,
  expectedCompletion,
  orderId,
  compact = false,
}) {
  const stages = [
    {
      id: "order-created",
      label: "Order Created",
      icon: Package,
      description: "Order registered in system",
    },
    {
      id: "core-testing",
      label: "Core Testing",
      icon: Zap,
      description: "Core winding tests in progress",
    },
    {
      id: "secondary-testing",
      label: "Secondary Testing",
      icon: Shield,
      description: "Secondary winding verification",
    },
    {
      id: "after-primary-testing",
      label: "After Primary Testing",
      icon: Clock,
      description: "Primary side testing",
    },
    {
      id: "final-testing",
      label: "Final Testing",
      icon: Award,
      description: "Final quality checks",
    },
    {
      id: "completed",
      label: "Completed",
      icon: Truck,
      description: "Ready for delivery",
    },
  ];

  const currentStageIndex = stages.findIndex(
    (stage) => stage.id === currentStage
  );

  const getStageStatus = (index) => {
    if (index < currentStageIndex) return "completed";
    if (index === currentStageIndex) return "current";
    return "pending";
  };

  /* ===================== COMPACT VIEW ===================== */
  if (compact) {
    return (
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          {stages.map((stage, index) => {
            const status = getStageStatus(index);
            const Icon = stage.icon;
            const isLast = index === stages.length - 1;

            return (
              <div key={stage.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      status === "completed"
                        ? "bg-green-500 border-green-500"
                        : status === "current"
                        ? "bg-blue-500 border-blue-500 animate-pulse"
                        : "bg-gray-200 border-gray-300"
                    }`}
                  >
                    {status === "completed" ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : status === "current" ? (
                      <Icon className="w-5 h-5 text-white" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {!isLast && (
                  <div className="flex-1 h-0.5 mx-2">
                    <div
                      className={`h-full ${
                        index < currentStageIndex
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-between">
          {stages.map((stage, index) => {
            const status = getStageStatus(index);
            return (
              <div key={stage.id} className="flex-1 text-center">
                <p
                  className={`text-xs ${
                    status !== "pending"
                      ? "text-gray-900 font-medium"
                      : "text-gray-500"
                  }`}
                >
                  {stage.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ===================== FULL VIEW ===================== */
  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex justify-between mb-6">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-blue-600" />
          <h3>Order ID: {orderId}</h3>
        </div>

        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500">Order Date</p>
            <Badge className="bg-blue-600 text-white mt-1">
              {orderDate}
            </Badge>
          </div>

          {expectedCompletion && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Expected Completion</p>
              <Badge className="bg-green-600 text-white mt-1">
                {expectedCompletion}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="flex justify-between">
        {stages.map((stage, index) => {
          const status = getStageStatus(index);
          const Icon = stage.icon;
          const isLast = index === stages.length - 1;

          return (
            <div key={stage.id} className="flex flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center border-4 shadow-lg ${
                    status === "completed"
                      ? "bg-green-500 border-green-500"
                      : status === "current"
                      ? "bg-blue-500 border-blue-500 ring-4 ring-blue-200 animate-pulse"
                      : "bg-white border-gray-300"
                  }`}
                >
                  <Icon
                    className={`w-8 h-8 ${
                      status === "pending" ? "text-gray-400" : "text-white"
                    }`}
                  />
                </div>

                <div className="mt-3 text-center">
                  <p
                    className={`text-sm font-medium ${
                      status !== "pending"
                        ? "text-gray-900"
                        : "text-gray-500"
                    }`}
                  >
                    {stage.label}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stage.description}
                  </p>
                </div>
              </div>

              {!isLast && (
                <div className="flex items-center w-10 mt-7">
                  <div
                    className={`h-1 w-full ${
                      index < currentStageIndex
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Status Footer */}
      <div className="mt-6 p-4 bg-white rounded-lg border">
        <div className="flex gap-3">
          <Clock className="w-5 h-5 text-blue-600" />
          <div>
            <p className="font-medium">Current Status</p>
            <p className="text-sm text-gray-600">
              {stages[currentStageIndex].label} –{" "}
              {stages[currentStageIndex].description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
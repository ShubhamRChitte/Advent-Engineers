import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";

import {
  ArrowLeft,
  Play,
  Search,
  Printer,
  Download,
} from "lucide-react";

export default function OrderViewPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [transformers, setTransformers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 Fetch ORDER + TRANSFORMERS together
  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const orderRes = await axios.get(
          `http://localhost:5000/api/orders/${orderId}`
        );

        const transformerRes = await axios.get(
          `http://localhost:5000/api/orders/${orderId}/transformers`
        );

        setOrder(orderRes.data);
        setTransformers(transformerRes.data);
      } catch (err) {
        console.error("Failed to fetch order data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId]);

  if (loading) return <p className="text-gray-500">Loading order...</p>;
  if (!order) return <p className="text-red-500">Order not found</p>;

  // 🔥 Progress calculations from transformers API
  const totalQty = transformers.length;

  const coreCompleted = transformers.filter(
    (t) => t.coreTesting === "Complete"
  ).length;

  const secondaryCompleted = transformers.filter(
    (t) => t.secondaryTesting === "Complete"
  ).length;

  const primaryCompleted = transformers.filter(
    (t) => t.primaryTesting === "Complete"
  ).length;

  const finalCompleted = transformers.filter(
    (t) => t.finalTesting === "Complete"
  ).length;

  const ProgressBar = ({ label, completed, total, color }) => {
    const percent = total ? Math.round((completed / total) * 100) : 0;

    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className={`font-medium ${color}`}>{label}</p>
          <Badge>{completed} Completed</Badge>
        </div>

        <div className="w-full h-2 bg-gray-200 rounded">
          <div
            className="h-2 rounded"
            style={{
              width: `${percent}%`,
              backgroundColor: "currentColor",
            }}
          />
        </div>

        <p className="text-sm text-gray-500 mt-2">
          {completed} out of {total} transformers
        </p>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>

        <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Play className="w-4 h-4" />
          Start Core Testing
        </Button>
      </div>

      {/* Header */}
      <Card className="p-6 space-y-6">
        <h1 className="text-center text-2xl font-bold text-red-600">
          ADVENT ENGINEERS
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500">Client</p>
            <p className="font-semibold">{order.clientName}</p>

            <p className="text-sm text-gray-500 mt-4">Order ID</p>
            <p className="font-mono">{order.jobId}</p>

            <p className="text-sm text-gray-500 mt-4">Deadline</p>
            <p>{new Date(order.deadline).toLocaleDateString()}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Type</p>
            <p className="font-semibold">{order.transformerName}</p>

            <p className="text-sm text-gray-500 mt-4">Quantity</p>
            <p className="font-semibold">{totalQty}</p>
          </div>

          <Card className="p-4 bg-blue-50 border-blue-200">
            <p className="text-sm">Completion Status</p>
            <p className="text-2xl font-bold text-blue-600">
              {finalCompleted}/{totalQty}
            </p>
            <p className="text-sm text-gray-500">Units Completed</p>
          </Card>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="By Transformer Id" className="pl-9" />
          </div>

          <div className="flex gap-2">
            <Button variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              Print All
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* 🔥 Transformer Table FROM BACKEND */}
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 text-left">Transformer Id</th>
              <th className="p-4 text-left">Core Testing</th>
              <th className="p-4 text-left">After Secondary Testing</th>
              <th className="p-4 text-left">After Primary Testing</th>
              <th className="p-4 text-left">Final Testing</th>
              <th className="p-4 text-left">Report</th>
            </tr>
          </thead>

          <tbody>
            {transformers.map((t) => (
              <tr key={t.transformerId} className="border-b">
                <td className="p-4 font-mono">{t.transformerId}</td>

                {[t.coreTesting, t.secondaryTesting, t.primaryTesting, t.finalTesting].map((s, i) => (
                  <td key={i} className="p-4 space-y-2">
                    <Badge
                      className={
                        s === "Complete"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {s}
                    </Badge>
                    <Button variant="outline" size="sm">
                      View Report
                    </Button>
                  </td>
                ))}

                <td className="p-4 space-y-2">
                  <Badge className="bg-blue-100 text-blue-700">
                    {t.reportStatus}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* 🔥 Progress Tracking FROM BACKEND */}
      <Card className="p-6 space-y-6">
        <h3 className="font-semibold">Testing Progress Tracking</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <p className="text-blue-600 font-medium">
              Current State of Testing
            </p>

            <ProgressBar label="Core Testing" completed={coreCompleted} total={totalQty} color="text-blue-600" />
            <ProgressBar label="Secondary Testing" completed={secondaryCompleted} total={totalQty} color="text-purple-600" />
            <ProgressBar label="Primary Testing" completed={primaryCompleted} total={totalQty} color="text-orange-600" />
            <ProgressBar label="Final Testing" completed={finalCompleted} total={totalQty} color="text-green-600" />
          </div>
        </div>
      </Card>
    </div>
  );
}

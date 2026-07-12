import { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  FileText,
  Search,
  Eye,
  Download,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CoreReport {
  coreId: string;
  coreType: 'Metering' | 'PS' | 'Protection';
  transformerNumber: number;
  testStatus: 'Pass' | 'Fail';
  testDate: string;
  testedBy: string;
}

interface OrderReport {
  orderId: string;
  jobId: string;
  clientName: string;
  transformerName: string;
  transformerQuantity: number;
  completedDate: string;
  reports: CoreReport[];
}

export function CoreTestingReports() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);

  // Sample data - would come from backend in real app
  const orderReports: OrderReport[] = [
    {
      orderId: 'ORD-2024-005',
      jobId: 'JOB-2025-012',
      clientName: 'Reliance Energy Ltd.',
      transformerName: 'Indoor Type CT',
      transformerQuantity: 100,
      completedDate: '2024-12-15',
      reports: [
        {
          coreId: '2024-005-MTR-001',
          coreType: 'Metering',
          transformerNumber: 1,
          testStatus: 'Pass',
          testDate: '2024-12-15',
          testedBy: 'Rajesh Kumar',
        },
        {
          coreId: '2024-005-PS-001',
          coreType: 'PS',
          transformerNumber: 1,
          testStatus: 'Pass',
          testDate: '2024-12-15',
          testedBy: 'Rajesh Kumar',
        },
      ],
    },
  ];

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const filteredReports = orderReports.filter(report =>
    report.jobId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCoreTypeColor = (type: string) => {
    switch (type) {
      case 'Metering':
        return 'bg-purple-50 text-purple-700';
      case 'PS':
        return 'bg-blue-50 text-blue-700';
      case 'Protection':
        return 'bg-orange-50 text-orange-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl">Core Testing Reports</h2>
          <p className="text-sm text-gray-600 mt-1">View your completed test reports</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1">
          <Download className="w-3 h-3" />
          Export All
        </Button>
      </div>

      {/* Search */}
      <Card className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by Job ID, Order ID, or Client Name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      {/* Reports List */}
      <div className="space-y-3">
        {filteredReports.map((report) => {
          const isExpanded = expandedOrders.includes(report.orderId);
          const passCount = report.reports.filter(r => r.testStatus === 'Pass').length;
          const failCount = report.reports.filter(r => r.testStatus === 'Fail').length;

          return (
            <Card key={report.orderId} className="overflow-hidden">
              {/* Order Header */}
              <div className="p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-medium text-gray-900">{report.jobId}</h3>
                      <Badge className="bg-green-100 text-green-700 text-xs px-2 py-0">
                        Completed
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{report.clientName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleOrderExpansion(report.orderId)}
                      className="gap-1"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3 h-3" />
                          Hide
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" />
                          View
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-5 gap-4 text-sm mt-3 pt-3 border-t">
                  <div>
                    <p className="text-xs text-gray-500">Transformer</p>
                    <p className="text-gray-900 mt-0.5">{report.transformerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Quantity</p>
                    <p className="text-gray-900 mt-0.5">{report.transformerQuantity} units</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tests Completed</p>
                    <p className="text-gray-900 mt-0.5">{report.reports.length} cores</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Pass / Fail</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-green-600 font-medium">{passCount}</span>
                      <span className="text-gray-400">/</span>
                      <span className="text-red-600 font-medium">{failCount}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Completed Date</p>
                    <p className="text-gray-900 mt-0.5">{report.completedDate}</p>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="p-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Test Results</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-2 text-gray-600 font-medium">Core ID</th>
                          <th className="text-left p-2 text-gray-600 font-medium">Type</th>
                          <th className="text-left p-2 text-gray-600 font-medium">Transformer #</th>
                          <th className="text-center p-2 text-gray-600 font-medium">Status</th>
                          <th className="text-left p-2 text-gray-600 font-medium">Test Date</th>
                          <th className="text-left p-2 text-gray-600 font-medium">Tested By</th>
                          <th className="text-center p-2 text-gray-600 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.reports.map((coreReport) => (
                          <tr key={coreReport.coreId} className="border-t hover:bg-gray-50">
                            <td className="p-2 font-mono text-xs">{coreReport.coreId}</td>
                            <td className="p-2">
                              <Badge className={`${getCoreTypeColor(coreReport.coreType)} text-xs px-1.5 py-0`}>
                                {coreReport.coreType}
                              </Badge>
                            </td>
                            <td className="p-2">{coreReport.transformerNumber}</td>
                            <td className="p-2">
                              <div className="flex justify-center">
                                <Badge
                                  className={
                                    coreReport.testStatus === 'Pass'
                                      ? 'bg-green-100 text-green-700 text-xs px-2 py-0'
                                      : 'bg-red-100 text-red-700 text-xs px-2 py-0'
                                  }
                                >
                                  {coreReport.testStatus === 'Pass' ? (
                                    <Check className="w-3 h-3 mr-1" />
                                  ) : (
                                    <X className="w-3 h-3 mr-1" />
                                  )}
                                  {coreReport.testStatus}
                                </Badge>
                              </div>
                            </td>
                            <td className="p-2 text-gray-600">{coreReport.testDate}</td>
                            <td className="p-2 text-gray-600">{coreReport.testedBy}</td>
                            <td className="p-2">
                              <div className="flex justify-center">
                                <Button variant="outline" size="sm" className="gap-1 h-7">
                                  <Eye className="w-3 h-3" />
                                  View
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {filteredReports.length === 0 && (
        <Card className="p-8">
          <div className="text-center text-gray-500">
            <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No reports found</p>
          </div>
        </Card>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle, 
  XCircle,
  Download,
  Eye,
  ChevronRight,
  Zap,
  Shield,
  Clock,
  Award,
  User,
  Calendar
} from 'lucide-react';

interface Order {
  id: string;
  orderId: string;
  transformerName: string;
  transformerType: string;
  quantity: number;
  orderDate: string;
  testStatus: string;
  testingStage: string;
  completedTests: number;
  totalTests: number;
}

interface TestReport {
  id: string;
  testType: 'Core Testing' | 'Secondary Testing' | 'After Primary Testing' | 'Final Testing';
  reportNumber: string;
  testDate: string;
  testedBy: string;
  result: 'PASS' | 'FAIL';
  transformersTest: number;
  remarks: string;
  testDetails: {
    label: string;
    value: string;
  }[];
}

interface OrderReportsViewProps {
  order: Order;
  clientName: string;
  onBack: () => void;
}

export function OrderReportsView({ order, clientName, onBack }: OrderReportsViewProps) {
  const [selectedReport, setSelectedReport] = useState<TestReport | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Sample test reports for the order
  const testReports: TestReport[] = [
    {
      id: '1',
      testType: 'Core Testing',
      reportNumber: 'CT-2024-001',
      testDate: '2024-11-15',
      testedBy: 'Rajesh Kumar',
      result: 'PASS',
      transformersTest: order.quantity,
      remarks: 'All core tests completed successfully. Winding resistance within acceptable limits.',
      testDetails: [
        { label: 'Winding Resistance', value: '2.5 Ω' },
        { label: 'Insulation Resistance', value: '500 MΩ' },
        { label: 'Turn Ratio', value: '1:100' },
        { label: 'Polarity Test', value: 'Correct' },
      ]
    },
    {
      id: '2',
      testType: 'Secondary Testing',
      reportNumber: 'ST-2024-001',
      testDate: '2024-11-18',
      testedBy: 'Priya Sharma',
      result: 'PASS',
      transformersTest: order.quantity,
      remarks: 'Secondary winding tests completed. All parameters within specification.',
      testDetails: [
        { label: 'Metering Test', value: 'PASS' },
        { label: 'PS Test', value: 'PASS' },
        { label: 'Protection Test', value: 'PASS' },
        { label: 'Accuracy Class', value: '0.2S' },
      ]
    },
    {
      id: '3',
      testType: 'After Primary Testing',
      reportNumber: 'APT-2024-001',
      testDate: '2024-11-20',
      testedBy: 'Amit Patel',
      result: 'PASS',
      transformersTest: order.quantity,
      remarks: 'After primary tests completed successfully. No abnormalities detected.',
      testDetails: [
        { label: 'High Voltage Test', value: 'PASS' },
        { label: 'Impulse Test', value: 'PASS' },
        { label: 'Temperature Rise', value: '45°C' },
        { label: 'Partial Discharge', value: '<10 pC' },
      ]
    },
    {
      id: '4',
      testType: 'Final Testing',
      reportNumber: 'FT-2024-001',
      testDate: '2024-11-22',
      testedBy: 'Sunita Desai',
      result: 'PASS',
      transformersTest: order.quantity,
      remarks: 'Final quality checks completed. All units ready for dispatch.',
      testDetails: [
        { label: 'Visual Inspection', value: 'PASS' },
        { label: 'Nameplate Verification', value: 'PASS' },
        { label: 'Documentation', value: 'Complete' },
        { label: 'Overall Result', value: 'PASS' },
      ]
    },
  ];

  const getTestIcon = (testType: string) => {
    switch (testType) {
      case 'Core Testing':
        return <Zap className="w-6 h-6" />;
      case 'Secondary Testing':
        return <Shield className="w-6 h-6" />;
      case 'After Primary Testing':
        return <Clock className="w-6 h-6" />;
      case 'Final Testing':
        return <Award className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  const getTestColor = (testType: string) => {
    switch (testType) {
      case 'Core Testing':
        return 'from-purple-50 to-purple-100 border-purple-200';
      case 'Secondary Testing':
        return 'from-blue-50 to-blue-100 border-blue-200';
      case 'After Primary Testing':
        return 'from-orange-50 to-orange-100 border-orange-200';
      case 'Final Testing':
        return 'from-green-50 to-green-100 border-green-200';
      default:
        return 'from-gray-50 to-gray-100 border-gray-200';
    }
  };

  const getIconColor = (testType: string) => {
    switch (testType) {
      case 'Core Testing':
        return 'bg-purple-500';
      case 'Secondary Testing':
        return 'bg-blue-500';
      case 'After Primary Testing':
        return 'bg-orange-500';
      case 'Final Testing':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleViewReport = (report: TestReport) => {
    setSelectedReport(report);
    setIsDialogOpen(true);
  };

  const passedTests = testReports.filter(r => r.result === 'PASS').length;
  const failedTests = testReports.filter(r => r.result === 'FAIL').length;

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <button onClick={onBack} className="hover:text-blue-600 transition-colors">
          {clientName}
        </button>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">{order.orderId}</span>
      </div>

      {/* Header with Back Button */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Orders
            </Button>
          </div>
          <h2>Test Reports - {order.orderId}</h2>
          <p className="text-gray-500 mt-1">{order.transformerName}</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Download All Reports
        </Button>
      </div>

      {/* Order Summary Card */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Client Name</p>
            <p className="font-medium text-gray-900">{clientName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Transformer Type</p>
            <p className="font-medium text-gray-900">{order.transformerType}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Quantity</p>
            <p className="font-medium text-gray-900">{order.quantity} units</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Order Date</p>
            <p className="font-medium text-gray-900">{order.orderDate}</p>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-blue-700">Total Reports</p>
              <h3 className="mt-1 text-blue-900">{testReports.length}</h3>
            </div>
            <div className="p-3 bg-blue-500 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-green-700">Passed Tests</p>
              <h3 className="mt-1 text-green-900">{passedTests}</h3>
            </div>
            <div className="p-3 bg-green-500 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-red-700">Failed Tests</p>
              <h3 className="mt-1 text-red-900">{failedTests}</h3>
            </div>
            <div className="p-3 bg-red-500 rounded-lg">
              <XCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-purple-700">Test Progress</p>
              <h3 className="mt-1 text-purple-900">
                {order.completedTests}/{order.totalTests}
              </h3>
            </div>
            <div className="p-3 bg-purple-500 rounded-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Test Reports List */}
      <div>
        <h3 className="text-gray-900 mb-4">All Test Reports</h3>
        <div className="space-y-4">
          {testReports.map((report) => (
            <Card 
              key={report.id} 
              className={`p-6 hover:shadow-lg transition-shadow bg-gradient-to-r ${getTestColor(report.testType)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {/* Test Icon */}
                  <div className={`p-3 ${getIconColor(report.testType)} rounded-lg`}>
                    {getTestIcon(report.testType)}
                  </div>

                  {/* Report Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-gray-900">{report.testType}</h3>
                          <Badge className={report.result === 'PASS' 
                            ? 'bg-green-100 text-green-700 border-green-300' 
                            : 'bg-red-100 text-red-700 border-red-300'
                          }>
                            {report.result === 'PASS' ? (
                              <><CheckCircle className="w-3 h-3 mr-1" /> PASS</>
                            ) : (
                              <><XCircle className="w-3 h-3 mr-1" /> FAIL</>
                            )}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{report.reportNumber}</p>
                      </div>
                    </div>

                    {/* Report Info Grid */}
                    <div className="grid grid-cols-3 gap-4 p-3 bg-white/50 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Test Date</p>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">{report.testDate}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Tested By</p>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">{report.testedBy}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Units Tested</p>
                        <span className="text-sm font-medium">{report.transformersTest} units</span>
                      </div>
                    </div>

                    {/* Remarks */}
                    <div className="mt-3 p-3 bg-white/70 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Remarks</p>
                      <p className="text-sm text-gray-700">{report.remarks}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 gap-2"
                    onClick={() => handleViewReport(report)}
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {testReports.length === 0 && (
        <Card className="p-12">
          <div className="text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No test reports available</p>
            <p className="text-sm mt-1">Test reports will appear here once testing is completed</p>
          </div>
        </Card>
      )}

      {/* Report Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              {selectedReport?.testType} - Detailed Report
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4 mt-4">
              {/* Report Header */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Report Number</p>
                    <p className="font-medium">{selectedReport.reportNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Test Date</p>
                    <p className="font-medium">{selectedReport.testDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Tested By</p>
                    <p className="font-medium">{selectedReport.testedBy}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Result</p>
                    <Badge className={selectedReport.result === 'PASS' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-red-600 text-white'
                    }>
                      {selectedReport.result}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Test Details */}
              <div>
                <h3 className="text-gray-900 mb-3">Test Parameters</h3>
                <div className="space-y-2">
                  {selectedReport.testDetails.map((detail, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">{detail.label}</span>
                      <span className="text-sm font-medium text-gray-900">{detail.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Remarks */}
              <div>
                <h3 className="text-gray-900 mb-2">Remarks</h3>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{selectedReport.remarks}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2">
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

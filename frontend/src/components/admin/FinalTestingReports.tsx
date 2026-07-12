import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Download, Eye, CheckCircle2 } from 'lucide-react';

export function FinalTestingReports() {
  const reports = [
    {
      reportId: 'FINAL-2025-001',
      jobId: 'JOB-2025-001',
      client: 'PowerGrid Corporation',
      coresProcessed: 3,
      coreTestPass: 3,
      secondaryTestPass: 3,
      overallResult: 'PASS',
      testedBy: 'Emma Davis',
      completedDate: '2025-01-12',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2>Final Testing Reports</h2>
        <p className="text-gray-500 mt-1">Complete transformer testing reports ready for delivery</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Completed Reports</p>
          <h3 className="mt-1">{reports.length}</h3>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Cores Processed</p>
          <h3 className="mt-1">{reports.reduce((sum, r) => sum + r.coresProcessed, 0)}</h3>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">All Tests Passed</p>
          <h3 className="mt-1 text-green-600">{reports.filter(r => r.overallResult === 'PASS').length}</h3>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Success Rate</p>
          <h3 className="mt-1 text-blue-600">100%</h3>
        </Card>
      </div>

      {/* Reports Table */}
      <Card className="p-6">
        <h3 className="mb-4">Final Test Reports</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left p-3 text-sm">Report ID</th>
                <th className="text-left p-3 text-sm">Job ID</th>
                <th className="text-left p-3 text-sm">Client</th>
                <th className="text-center p-3 text-sm">Cores</th>
                <th className="text-center p-3 text-sm">Core Tests</th>
                <th className="text-center p-3 text-sm">Secondary Tests</th>
                <th className="text-left p-3 text-sm">Overall Result</th>
                <th className="text-left p-3 text-sm">Tested By</th>
                <th className="text-left p-3 text-sm">Completed</th>
                <th className="text-right p-3 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.reportId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium">{report.reportId}</td>
                  <td className="p-3">{report.jobId}</td>
                  <td className="p-3">{report.client}</td>
                  <td className="p-3 text-center">{report.coresProcessed}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>{report.coreTestPass}/{report.coresProcessed}</span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>{report.secondaryTestPass}/{report.coresProcessed}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge className="bg-green-100 text-green-700">
                      {report.overallResult}
                    </Badge>
                  </td>
                  <td className="p-3">{report.testedBy}</td>
                  <td className="p-3">{new Date(report.completedDate).toLocaleDateString()}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600">
                        <Download className="w-4 h-4" />
                        PDF
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Sample Report Preview */}
      <Card className="p-6">
        <h3 className="mb-4">Sample Final Report Structure</h3>
        <div className="bg-white border-2 border-gray-300 p-6 rounded-lg">
          <div className="text-center mb-6">
            <h2 className="text-red-600">ADVENT ENGINEERS</h2>
            <p className="text-sm text-gray-500">Final Transformer Testing Report</p>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Report ID:</p>
                <p>FINAL-2025-001</p>
              </div>
              <div>
                <p className="text-gray-500">Job ID:</p>
                <p>JOB-2025-001</p>
              </div>
              <div>
                <p className="text-gray-500">Client:</p>
                <p>PowerGrid Corporation</p>
              </div>
              <div>
                <p className="text-gray-500">Date:</p>
                <p>2025-01-12</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="mb-2">Test Summary</h4>
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span>All tests completed successfully - Ready for delivery</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-500">Tested By: Emma Davis</p>
              <p className="text-sm text-gray-500 mt-2">Signature: ___________________</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

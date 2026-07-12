import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Download, Eye } from 'lucide-react';

export function CoreTestingReports() {
  const reports = [
    {
      coreId: 'CORE-2025-001',
      jobId: 'JOB-2025-001',
      vendorCoreNo: 'VC-12345',
      coreSize: '120-150-80',
      result: 'PASS',
      testedBy: 'John Smith',
      testDate: '2025-01-10',
      bsat: 1.65,
      set: 42,
      leLimit: 125,
    },
    {
      coreId: 'CORE-2025-002',
      jobId: 'JOB-2025-001',
      vendorCoreNo: 'VC-12346',
      coreSize: '120-150-80',
      result: 'PASS',
      testedBy: 'John Smith',
      testDate: '2025-01-10',
      bsat: 1.63,
      set: 40,
      leLimit: 120,
    },
    {
      coreId: 'CORE-2025-003',
      jobId: 'JOB-2025-002',
      vendorCoreNo: 'VC-12347',
      coreSize: '100-130-70',
      result: 'FAIL',
      testedBy: 'John Smith',
      testDate: '2025-01-12',
      bsat: 1.80,
      set: 55,
      leLimit: 180,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2>Core Testing Reports</h2>
        <p className="text-gray-500 mt-1">View all core testing results and reports</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Tests</p>
          <h3 className="mt-1">{reports.length}</h3>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Passed</p>
          <h3 className="mt-1 text-green-600">{reports.filter(r => r.result === 'PASS').length}</h3>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Failed</p>
          <h3 className="mt-1 text-red-600">{reports.filter(r => r.result === 'FAIL').length}</h3>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Pass Rate</p>
          <h3 className="mt-1 text-blue-600">
            {((reports.filter(r => r.result === 'PASS').length / reports.length) * 100).toFixed(1)}%
          </h3>
        </Card>
      </div>

      {/* Reports Table */}
      <Card className="p-6">
        <h3 className="mb-4">Core Test Results</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left p-3 text-sm">Core ID</th>
                <th className="text-left p-3 text-sm">Job ID</th>
                <th className="text-left p-3 text-sm">Vendor Core No</th>
                <th className="text-left p-3 text-sm">Size (ID-OD-HT)</th>
                <th className="text-center p-3 text-sm">BSAT (G)</th>
                <th className="text-center p-3 text-sm">SET (mV)</th>
                <th className="text-center p-3 text-sm">LE Limit (mA)</th>
                <th className="text-left p-3 text-sm">Result</th>
                <th className="text-left p-3 text-sm">Tested By</th>
                <th className="text-center p-3 text-sm">Test Date</th>
                <th className="text-right p-3 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.coreId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium">{report.coreId}</td>
                  <td className="p-3">{report.jobId}</td>
                  <td className="p-3">{report.vendorCoreNo}</td>
                  <td className="p-3">{report.coreSize}</td>
                  <td className="p-3 text-center">{report.bsat}</td>
                  <td className="p-3 text-center">{report.set}</td>
                  <td className="p-3 text-center">{report.leLimit}</td>
                  <td className="p-3">
                    <Badge className={report.result === 'PASS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                      {report.result}
                    </Badge>
                  </td>
                  <td className="p-3">{report.testedBy}</td>
                  <td className="p-3 text-center">{new Date(report.testDate).toLocaleDateString()}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
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

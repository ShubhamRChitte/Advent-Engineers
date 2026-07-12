import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Download, Eye } from 'lucide-react';

export function SecondaryTestingReports() {
  const reports = [
    {
      testId: 'SEC-2025-001',
      coreId: 'CORE-2025-001',
      jobId: 'JOB-2025-001',
      ratio: '100/5A',
      ratioError25: 0.5,
      ratioError100: 0.3,
      phaseError25: 15,
      phaseError100: 10,
      result: 'PASS',
      testedBy: 'Mike Wilson',
      testDate: '2025-01-11',
    },
    {
      testId: 'SEC-2025-002',
      coreId: 'CORE-2025-002',
      jobId: 'JOB-2025-001',
      ratio: '100/5A',
      ratioError25: 0.6,
      ratioError100: 0.4,
      phaseError25: 18,
      phaseError100: 12,
      result: 'PASS',
      testedBy: 'Mike Wilson',
      testDate: '2025-01-11',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2>Secondary Testing Reports</h2>
        <p className="text-gray-500 mt-1">View accuracy test results for secondary windings</p>
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
          <h3 className="mt-1 text-blue-600">100%</h3>
        </Card>
      </div>

      {/* Reports Table */}
      <Card className="p-6">
        <h3 className="mb-4">Secondary Test Results</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left p-3 text-sm">Test ID</th>
                <th className="text-left p-3 text-sm">Core ID</th>
                <th className="text-left p-3 text-sm">Job ID</th>
                <th className="text-left p-3 text-sm">Ratio</th>
                <th className="text-center p-3 text-sm">Ratio Error 25%</th>
                <th className="text-center p-3 text-sm">Ratio Error 100%</th>
                <th className="text-center p-3 text-sm">Phase Error 25%</th>
                <th className="text-center p-3 text-sm">Phase Error 100%</th>
                <th className="text-left p-3 text-sm">Result</th>
                <th className="text-left p-3 text-sm">Tested By</th>
                <th className="text-right p-3 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.testId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium">{report.testId}</td>
                  <td className="p-3">{report.coreId}</td>
                  <td className="p-3">{report.jobId}</td>
                  <td className="p-3">{report.ratio}</td>
                  <td className="p-3 text-center">{report.ratioError25}%</td>
                  <td className="p-3 text-center">{report.ratioError100}%</td>
                  <td className="p-3 text-center">{report.phaseError25} min</td>
                  <td className="p-3 text-center">{report.phaseError100} min</td>
                  <td className="p-3">
                    <Badge className={report.result === 'PASS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                      {report.result}
                    </Badge>
                  </td>
                  <td className="p-3">{report.testedBy}</td>
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

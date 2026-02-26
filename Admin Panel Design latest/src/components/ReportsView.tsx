import { Card } from './ui/card';
import { Button } from './ui/button';
import { Download, FileText, Calendar, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

export function ReportsView() {
  const handleExport = (reportType: string, format: string) => {
    toast.success(`Exporting ${reportType} report as ${format.toUpperCase()}...`);
  };

  const reports = [
    {
      title: 'Production Report',
      description: 'Detailed production statistics and transformer output',
      icon: '📊',
      metrics: ['Total Production: 236 units', 'This Month: 67 units', 'Avg. Daily: 3.2 units'],
    },
    {
      title: 'Testing Summary',
      description: 'Complete testing workflow and stage-wise breakdown',
      icon: '🔬',
      metrics: ['Tests Completed: 189', 'Pass Rate: 96.5%', 'Avg. Duration: 14.2 hrs'],
    },
    {
      title: 'Worker Performance',
      description: 'Individual and team performance metrics',
      icon: '👥',
      metrics: ['Active Workers: 18', 'Avg. Efficiency: 91%', 'Top Performer: Sarah Wilson'],
    },
    {
      title: 'Inventory Status',
      description: 'Current stock levels and availability',
      icon: '📦',
      metrics: ['Total Stock: 65 units', 'In Production: 36 units', 'Low Stock Items: 2'],
    },
    {
      title: 'Order Analytics',
      description: 'Order trends, fulfillment rates, and client statistics',
      icon: '📈',
      metrics: ['Total Orders: 25', 'Completed: 15', 'In Progress: 10'],
    },
    {
      title: 'Dispatch Records',
      description: 'Delivery performance and logistics data',
      icon: '🚚',
      metrics: ['Dispatched: 45 units', 'On-Time: 94%', 'Pending: 3'],
    },
  ];

  const recentReports = [
    { name: 'Monthly_Production_Report_May_2025.pdf', date: '2025-05-31', size: '2.4 MB' },
    { name: 'Worker_Performance_Q2_2025.xlsx', date: '2025-06-15', size: '1.8 MB' },
    { name: 'Inventory_Status_June_2025.pdf', date: '2025-06-30', size: '1.2 MB' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Reports & Analytics</h2>
          <p className="text-gray-500 mt-1">Generate and export comprehensive reports</p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700">
          <FileText className="w-4 h-4 mr-2" />
          Custom Report
        </Button>
      </div>

      {/* Quick Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Date Range:</span>
            <Select defaultValue="month">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Format:</span>
            <Select defaultValue="pdf">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Card key={report.title} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="text-4xl">{report.icon}</div>
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4" />
              </Button>
            </div>
            
            <h3 className="mb-2">{report.title}</h3>
            <p className="text-sm text-gray-500 mb-4">{report.description}</p>
            
            <div className="space-y-2 mb-4">
              {report.metrics.map((metric, idx) => (
                <div key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {metric}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleExport(report.title, 'pdf')}
              >
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleExport(report.title, 'excel')}
              >
                Excel
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Reports */}
      <Card className="p-6">
        <h3 className="mb-4">Recently Generated Reports</h3>
        <div className="space-y-3">
          {recentReports.map((report, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium">{report.name}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {report.date}
                    </span>
                    <span>{report.size}</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Scheduled Reports */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3>Scheduled Reports</h3>
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Add Schedule
          </Button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="font-medium">Monthly Production Summary</p>
              <p className="text-sm text-gray-500">Every 1st of the month at 9:00 AM</p>
            </div>
            <Button variant="ghost" size="sm">Edit</Button>
          </div>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="font-medium">Weekly Testing Report</p>
              <p className="text-sm text-gray-500">Every Monday at 8:00 AM</p>
            </div>
            <Button variant="ghost" size="sm">Edit</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

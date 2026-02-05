import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Trophy, TrendingUp, Award, Star } from 'lucide-react';

export function EmployeePerformance() {
  // Mock employee performance data - sorted by tests completed (highest first)
  const employeePerformance = [
    { 
      rank: 1,
      name: 'Rajesh Kumar', 
      role: 'Core Tester', 
      transformersTested: 145, 
      coresTested: 435,
      passRate: 96.5,
      avgTime: '2.3 hrs',
      department: 'Core Testing'
    },
    { 
      rank: 2,
      name: 'Priya Sharma', 
      role: 'Secondary Tester', 
      transformersTested: 138, 
      coresTested: 414,
      passRate: 94.2,
      avgTime: '3.1 hrs',
      department: 'Secondary Testing'
    },
    { 
      rank: 3,
      name: 'Amit Patel', 
      role: 'Final Tester', 
      transformersTested: 132, 
      coresTested: 396,
      passRate: 98.1,
      avgTime: '2.8 hrs',
      department: 'Final Testing'
    },
    { 
      rank: 4,
      name: 'Suresh Reddy', 
      role: 'Core Tester', 
      transformersTested: 128, 
      coresTested: 384,
      passRate: 95.7,
      avgTime: '2.5 hrs',
      department: 'Core Testing'
    },
    { 
      rank: 5,
      name: 'Kavita Singh', 
      role: 'Secondary Tester', 
      transformersTested: 122, 
      coresTested: 366,
      passRate: 93.8,
      avgTime: '3.2 hrs',
      department: 'Secondary Testing'
    },
    { 
      rank: 6,
      name: 'Vikram Desai', 
      role: 'After Primary Tester', 
      transformersTested: 115, 
      coresTested: 345,
      passRate: 97.2,
      avgTime: '2.6 hrs',
      department: 'After Primary Testing'
    },
    { 
      rank: 7,
      name: 'Neha Gupta', 
      role: 'Final Tester', 
      transformersTested: 110, 
      coresTested: 330,
      passRate: 96.8,
      avgTime: '2.9 hrs',
      department: 'Final Testing'
    },
    { 
      rank: 8,
      name: 'Arjun Mehta', 
      role: 'Core Tester', 
      transformersTested: 105, 
      coresTested: 315,
      passRate: 94.5,
      avgTime: '2.7 hrs',
      department: 'Core Testing'
    },
    { 
      rank: 9,
      name: 'Deepak Joshi', 
      role: 'Secondary Tester', 
      transformersTested: 98, 
      coresTested: 294,
      passRate: 92.9,
      avgTime: '3.4 hrs',
      department: 'Secondary Testing'
    },
    { 
      rank: 10,
      name: 'Anita Verma', 
      role: 'After Primary Tester', 
      transformersTested: 92, 
      coresTested: 276,
      passRate: 95.1,
      avgTime: '2.8 hrs',
      department: 'After Primary Testing'
    },
  ];

  const topPerformers = employeePerformance.slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h2>Employee Performance</h2>
        <p className="text-gray-500 mt-1">Performance rankings based on transformers and cores tested</p>
      </div>

      {/* Top 3 Performers Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topPerformers.map((employee) => {
          const Icon = employee.rank === 1 ? Trophy : employee.rank === 2 ? Award : Star;
          const bgColor = employee.rank === 1 ? 'from-yellow-50 to-yellow-100 border-yellow-300' : 
                         employee.rank === 2 ? 'from-gray-50 to-gray-100 border-gray-300' :
                         'from-orange-50 to-orange-100 border-orange-300';
          const iconColor = employee.rank === 1 ? 'text-yellow-600' : 
                           employee.rank === 2 ? 'text-gray-600' : 'text-orange-600';
          const rankBg = employee.rank === 1 ? 'bg-yellow-500' : 
                        employee.rank === 2 ? 'bg-gray-400' : 'bg-orange-500';

          return (
            <Card key={employee.rank} className={`p-6 bg-gradient-to-br ${bgColor} border-2`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${rankBg} rounded-full flex items-center justify-center`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <Badge className={`${rankBg} text-white`}>
                  Rank #{employee.rank}
                </Badge>
              </div>
              <h3 className="text-gray-900">{employee.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{employee.role}</p>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Transformers:</span>
                  <span className="font-semibold text-gray-900">{employee.transformersTested}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cores:</span>
                  <span className="font-semibold text-gray-900">{employee.coresTested}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pass Rate:</span>
                  <span className="font-semibold text-green-600">{employee.passRate}%</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Complete Performance Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3>All Employee Rankings</h3>
          <Badge className="bg-blue-100 text-blue-700">
            Total: {employeePerformance.length} Testers
          </Badge>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left p-3 text-sm">Rank</th>
                <th className="text-left p-3 text-sm">Name</th>
                <th className="text-left p-3 text-sm">Department</th>
                <th className="text-center p-3 text-sm">Transformers Tested</th>
                <th className="text-center p-3 text-sm">Cores Tested</th>
                <th className="text-center p-3 text-sm">Pass Rate</th>
                <th className="text-center p-3 text-sm">Avg Time</th>
                <th className="text-left p-3 text-sm">Performance</th>
              </tr>
            </thead>
            <tbody>
              {employeePerformance.map((employee) => (
                <tr key={employee.rank} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {employee.rank <= 3 && (
                        employee.rank === 1 ? <Trophy className="w-5 h-5 text-yellow-600" /> :
                        employee.rank === 2 ? <Award className="w-5 h-5 text-gray-600" /> :
                        <Star className="w-5 h-5 text-orange-600" />
                      )}
                      <span className="font-semibold">#{employee.rank}</span>
                    </div>
                  </td>
                  <td className="p-3 font-medium">{employee.name}</td>
                  <td className="p-3 text-sm text-gray-600">{employee.department}</td>
                  <td className="p-3 text-center">
                    <span className="font-semibold text-blue-600">{employee.transformersTested}</span>
                  </td>
                  <td className="p-3 text-center">
                    <span className="font-semibold text-purple-600">{employee.coresTested}</span>
                  </td>
                  <td className="p-3 text-center">
                    <Badge className={
                      employee.passRate >= 96 ? 'bg-green-100 text-green-700' :
                      employee.passRate >= 94 ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }>
                      {employee.passRate}%
                    </Badge>
                  </td>
                  <td className="p-3 text-center text-sm">{employee.avgTime}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${employee.passRate}%` }}
                        />
                      </div>
                      {employee.transformersTested >= 130 && (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Department Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Core Testing Team</p>
          <h3 className="mt-2">3 Testers</h3>
          <p className="text-sm text-blue-600 mt-1">378 Transformers</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Secondary Testing Team</p>
          <h3 className="mt-2">3 Testers</h3>
          <p className="text-sm text-purple-600 mt-1">358 Transformers</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">After Primary Team</p>
          <h3 className="mt-2">2 Testers</h3>
          <p className="text-sm text-orange-600 mt-1">207 Transformers</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Final Testing Team</p>
          <h3 className="mt-2">2 Testers</h3>
          <p className="text-sm text-green-600 mt-1">242 Transformers</p>
        </Card>
      </div>
    </div>
  );
}

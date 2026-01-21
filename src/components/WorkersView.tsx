import { useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { UserPlus, Mail, Phone, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

interface Worker {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  joinDate: string;
  assignedOrders: string[];
  status: 'available' | 'busy' | 'on-leave';
  expertise: string[];
  completedTests: number;
}

export function WorkersView() {
  const workers: Worker[] = [
    {
      id: '1',
      name: 'John Doe',
      role: 'Senior Testing Engineer',
      email: 'john.doe@advent.com',
      phone: '+1 234-567-8901',
      joinDate: '2023-03-15',
      assignedOrders: ['ORD-2025-001', 'ORD-2025-006'],
      status: 'busy',
      expertise: ['Dead Tank Type-1', 'Live Tank Type'],
      completedTests: 156,
    },
    {
      id: '2',
      name: 'Jane Smith',
      role: 'Testing Engineer',
      email: 'jane.smith@advent.com',
      phone: '+1 234-567-8902',
      joinDate: '2023-06-20',
      assignedOrders: ['ORD-2025-001'],
      status: 'busy',
      expertise: ['Dead Tank Type-1', 'Indoor ERC'],
      completedTests: 98,
    },
    {
      id: '3',
      name: 'Mike Johnson',
      role: 'Testing Engineer',
      email: 'mike.johnson@advent.com',
      phone: '+1 234-567-8903',
      joinDate: '2024-01-10',
      assignedOrders: ['ORD-2025-002'],
      status: 'busy',
      expertise: ['Live Tank Type', 'Outdoor ERC'],
      completedTests: 67,
    },
    {
      id: '4',
      name: 'Sarah Wilson',
      role: 'Lead Testing Engineer',
      email: 'sarah.wilson@advent.com',
      phone: '+1 234-567-8904',
      joinDate: '2022-11-05',
      assignedOrders: ['ORD-2025-003'],
      status: 'busy',
      expertise: ['Dead Tank Type-2', 'Indoor ERC', 'Outdoor ERC'],
      completedTests: 234,
    },
    {
      id: '5',
      name: 'Tom Brown',
      role: 'Testing Engineer',
      email: 'tom.brown@advent.com',
      phone: '+1 234-567-8905',
      joinDate: '2023-09-12',
      assignedOrders: ['ORD-2025-003'],
      status: 'busy',
      expertise: ['Dead Tank Type-2'],
      completedTests: 89,
    },
    {
      id: '6',
      name: 'Alex Turner',
      role: 'Junior Testing Engineer',
      email: 'alex.turner@advent.com',
      phone: '+1 234-567-8906',
      joinDate: '2024-05-18',
      assignedOrders: ['ORD-2025-005'],
      status: 'busy',
      expertise: ['Outdoor ERC'],
      completedTests: 34,
    },
    {
      id: '7',
      name: 'Emma Davis',
      role: 'Testing Engineer',
      email: 'emma.davis@advent.com',
      phone: '+1 234-567-8907',
      joinDate: '2023-12-03',
      assignedOrders: [],
      status: 'available',
      expertise: ['Live Tank Type', 'Indoor ERC'],
      completedTests: 78,
    },
    {
      id: '8',
      name: 'Chris Lee',
      role: 'Testing Engineer',
      email: 'chris.lee@advent.com',
      phone: '+1 234-567-8908',
      joinDate: '2024-02-14',
      assignedOrders: [],
      status: 'available',
      expertise: ['Dead Tank Type-1', 'Dead Tank Type-2'],
      completedTests: 45,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700';
      case 'busy': return 'bg-yellow-100 text-yellow-700';
      case 'on-leave': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Worker Management</h2>
          <p className="text-gray-500 mt-1">Manage testing engineers and their assignments</p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Worker
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Workers</p>
          <h3 className="mt-1">{workers.length}</h3>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Available</p>
          <h3 className="mt-1 text-green-600">{workers.filter(w => w.status === 'available').length}</h3>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Currently Busy</p>
          <h3 className="mt-1 text-yellow-600">{workers.filter(w => w.status === 'busy').length}</h3>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">On Leave</p>
          <h3 className="mt-1 text-gray-600">{workers.filter(w => w.status === 'on-leave').length}</h3>
        </Card>
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workers.map((worker) => (
          <Card key={worker.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white">
                  {worker.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4>{worker.name}</h4>
                  <p className="text-sm text-gray-500">{worker.role}</p>
                </div>
              </div>
              <Badge className={getStatusColor(worker.status)}>
                {worker.status}
              </Badge>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span className="truncate">{worker.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{worker.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(worker.joinDate).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <div>
                <p className="text-sm text-gray-500 mb-2">Expertise</p>
                <div className="flex flex-wrap gap-1">
                  {worker.expertise.map((exp, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {exp}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Completed Tests</span>
                <span>{worker.completedTests}</span>
              </div>

              {worker.assignedOrders.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    Active Orders ({worker.assignedOrders.length})
                  </p>
                  <div className="space-y-1">
                    {worker.assignedOrders.map((order, idx) => (
                      <div key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        {order}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full mt-4">
                  View Details
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{worker.name} - Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Role</p>
                      <p className="mt-1">{worker.role}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <Badge className={`${getStatusColor(worker.status)} mt-1`}>
                        {worker.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="mt-1 text-sm">{worker.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="mt-1">{worker.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Join Date</p>
                      <p className="mt-1">{new Date(worker.joinDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tests Completed</p>
                      <p className="mt-1">{worker.completedTests}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Expertise Areas</p>
                    <div className="flex flex-wrap gap-2">
                      {worker.expertise.map((exp, idx) => (
                        <Badge key={idx} variant="outline">{exp}</Badge>
                      ))}
                    </div>
                  </div>

                  {worker.assignedOrders.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Current Assignments</p>
                      <div className="space-y-2">
                        {worker.assignedOrders.map((order, idx) => (
                          <div key={idx} className="bg-blue-50 text-blue-700 px-3 py-2 rounded">
                            {order}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </Card>
        ))}
      </div>
    </div>
  );
}

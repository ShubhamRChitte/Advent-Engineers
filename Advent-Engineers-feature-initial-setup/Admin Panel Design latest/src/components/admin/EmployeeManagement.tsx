import { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { UserPlus, Edit, Trash2, Mail, Shield } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'active' | 'inactive';
  joinDate: string;
}

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: 'emp-1',
      name: 'Moni Roy',
      email: 'admin@advent.com',
      role: 'Admin',
      department: 'Management',
      status: 'active',
      joinDate: '2023-01-15',
    },
    {
      id: 'emp-2',
      name: 'Sarah Johnson',
      email: 'entry@advent.com',
      role: 'Entry Operator',
      department: 'Operations',
      status: 'active',
      joinDate: '2023-03-20',
    },
    {
      id: 'emp-3',
      name: 'John Smith',
      email: 'core@advent.com',
      role: 'Core Tester',
      department: 'Core Testing',
      status: 'active',
      joinDate: '2023-05-10',
    },
    {
      id: 'emp-4',
      name: 'Mike Wilson',
      email: 'secondary@advent.com',
      role: 'Secondary Tester',
      department: 'Secondary Testing',
      status: 'active',
      joinDate: '2023-06-15',
    },
    {
      id: 'emp-5',
      name: 'Emma Davis',
      email: 'final@advent.com',
      role: 'Final Tester',
      department: 'Final Testing',
      status: 'active',
      joinDate: '2023-07-01',
    },
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    password: '',
  });

  const handleAddEmployee = () => {
    if (!newEmployee.name || !newEmployee.email || !newEmployee.role || !newEmployee.department || !newEmployee.password) {
      toast.error('Please fill in all fields');
      return;
    }

    const employee: Employee = {
      id: `emp-${employees.length + 1}`,
      name: newEmployee.name,
      email: newEmployee.email,
      role: newEmployee.role,
      department: newEmployee.department,
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0],
    };

    setEmployees([...employees, employee]);
    setNewEmployee({ name: '', email: '', role: '', department: '', password: '' });
    setIsAddDialogOpen(false);
    toast.success('Employee added successfully!');
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployees(employees.filter(e => e.id !== id));
    toast.success('Employee deleted successfully!');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-700';
      case 'Entry Operator':
        return 'bg-blue-100 text-blue-700';
      case 'Core Tester':
        return 'bg-green-100 text-green-700';
      case 'Secondary Tester':
        return 'bg-orange-100 text-orange-700';
      case 'Final Tester':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Employee Management</h2>
          <p className="text-gray-500 mt-1">Manage system users and their roles</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>
                Fill in the details to add a new employee to the system.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter full name"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={newEmployee.role} onValueChange={(value) => setNewEmployee({ ...newEmployee, role: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Entry Operator">Entry Operator</SelectItem>
                    <SelectItem value="Core Tester">Core Tester</SelectItem>
                    <SelectItem value="Secondary Tester">Secondary Tester</SelectItem>
                    <SelectItem value="Final Tester">Final Tester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="Enter department"
                  value={newEmployee.department}
                  onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={newEmployee.password}
                  onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleAddEmployee} className="w-full bg-red-600 hover:bg-red-700">
                Add Employee
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Employees</p>
          <h3 className="mt-1">{employees.length}</h3>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Admins</p>
          <h3 className="mt-1">{employees.filter(e => e.role === 'Admin').length}</h3>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Entry Operators</p>
          <h3 className="mt-1">{employees.filter(e => e.role === 'Entry Operator').length}</h3>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Testers</p>
          <h3 className="mt-1">{employees.filter(e => e.role.includes('Tester')).length}</h3>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Active</p>
          <h3 className="mt-1 text-green-600">{employees.filter(e => e.status === 'active').length}</h3>
        </Card>
      </div>

      {/* Employees Table */}
      <Card className="p-6">
        <h3 className="mb-4">All Employees</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left pb-3 text-sm text-gray-500">Employee</th>
                <th className="text-left pb-3 text-sm text-gray-500">Role</th>
                <th className="text-left pb-3 text-sm text-gray-500">Department</th>
                <th className="text-left pb-3 text-sm text-gray-500">Status</th>
                <th className="text-left pb-3 text-sm text-gray-500">Join Date</th>
                <th className="text-right pb-3 text-sm text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="border-b border-gray-100">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white">
                        {employee.name.charAt(0)}
                      </div>
                      <div>
                        <p>{employee.name}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {employee.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <Badge className={getRoleBadgeColor(employee.role)}>
                      <Shield className="w-3 h-3 mr-1" />
                      {employee.role}
                    </Badge>
                  </td>
                  <td className="py-4">{employee.department}</td>
                  <td className="py-4">
                    <Badge className={employee.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                      {employee.status}
                    </Badge>
                  </td>
                  <td className="py-4">{new Date(employee.joinDate).toLocaleDateString()}</td>
                  <td className="py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEmployee(employee.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
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
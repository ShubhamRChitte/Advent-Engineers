import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { UserPlus, Edit, Trash2, Mail, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import axios from 'axios';

interface Employee {
  _id: string; // MongoDB ID
  fullName: string;
  emailId: string;
  employeeId: string;
  designation: string; // Frontend "Role"
  department: string;
  status: string; // 'active' or others. API returns boolean activeStatus
  createdAt: string; // Join Date
}

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    fullName: '',
    emailId: '',
    employeeId: '',
    designation: '',
    department: '',
    password: '',
    mobileNumber: '',
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3002/api/users', {
        withCredentials: true
      });
      if (response.data.success) {
        setEmployees(response.data.users);
      }
    } catch (error: any) {
      toast.error('Failed to load employees: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async () => {
    // Basic validation
    if (!newEmployee.fullName || !newEmployee.employeeId || !newEmployee.password || !newEmployee.designation) {
      toast.error('Please fill in required fields (Name, Emp ID, Role, Password)');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3002/api/users/add', newEmployee, {
        withCredentials: true
      });

      if (response.data.success) {
        toast.success('Employee added successfully!');
        setIsAddDialogOpen(false);
        // Reset form
        setNewEmployee({ fullName: '', emailId: '', employeeId: '', designation: '', department: '', password: '', mobileNumber: '' });
        // Refresh list
        fetchEmployees();
      }
    } catch (error: any) {
      toast.error('Failed to add employee: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await axios.delete(`http://localhost:3002/api/users/${id}`, {
        withCredentials: true
      });

      if (response.data.success) {
        toast.success('Employee deleted successfully!');
        fetchEmployees();
      }
    } catch (error: any) {
      toast.error('Failed to delete employee: ' + (error.response?.data?.message || error.message));
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-purple-100 text-purple-700';
      case 'Entry Level': return 'bg-blue-100 text-blue-700'; // Match backend enum/value if possible
      case 'Core Tester': return 'bg-green-100 text-green-700';
      case 'Secondary Tester': return 'bg-orange-100 text-orange-700';
      case 'Final Tester': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
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
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>
                Create a new login for the system.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Full Name *</Label>
                <Input
                  placeholder="e.g. Rahul Sharma"
                  value={newEmployee.fullName}
                  onChange={(e) => setNewEmployee({ ...newEmployee, fullName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Employee ID *</Label>
                  <Input
                    placeholder="e.g. AE-001"
                    value={newEmployee.employeeId}
                    onChange={(e) => setNewEmployee({ ...newEmployee, employeeId: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Password *</Label>
                  <Input
                    type="password"
                    placeholder="******"
                    value={newEmployee.password}
                    onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Email (Optional)</Label>
                <Input
                  type="email"
                  placeholder="rahul@advent.com"
                  value={newEmployee.emailId}
                  onChange={(e) => setNewEmployee({ ...newEmployee, emailId: e.target.value })}
                />
              </div>
               <div>
                <Label>Mobile (Optional)</Label>
                <Input
                  placeholder="9876543210"
                  value={newEmployee.mobileNumber}
                  onChange={(e) => setNewEmployee({ ...newEmployee, mobileNumber: e.target.value })}
                />
              </div>

              <div>
                <Label>Role (Designation) *</Label>
                <Select value={newEmployee.designation} onValueChange={(value) => setNewEmployee({ ...newEmployee, designation: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Entry Level">Entry Operator</SelectItem>
                    <SelectItem value="Core Tester">Core Tester</SelectItem>
                    <SelectItem value="Secondary Tester">Secondary Tester</SelectItem>
                    <SelectItem value="Primary Tester">Primary Tester</SelectItem>
                    <SelectItem value="Final Tester">Final Tester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Department *</Label>
                 <Select value={newEmployee.department} onValueChange={(value) => setNewEmployee({ ...newEmployee, department: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Management">Management</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Core Test">Core Test</SelectItem>
                    <SelectItem value="Secondary Test">Secondary Test</SelectItem>
                    <SelectItem value="Primary Test">Primary Test</SelectItem>
                    <SelectItem value="Final Test">Final Test</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleAddEmployee} className="w-full bg-red-600 hover:bg-red-700 mt-2">
                Create User
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
          <h3 className="mt-1">{employees.filter(e => e.designation === 'Admin').length}</h3>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Entry Operators</p>
          <h3 className="mt-1">{employees.filter(e => e.designation === 'Entry Level').length}</h3>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Testers</p>
          <h3 className="mt-1">{employees.filter(e => e.designation && e.designation.includes('Tester')).length}</h3>
        </Card>
      </div>

      {/* Employees Table */}
      <Card className="p-6">
        <h3 className="mb-4">All Employees</h3>
        {loading ? (
           <div className="flex justify-center p-8">
             <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
           </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left pb-3 text-sm text-gray-500">Employee</th>
                <th className="text-left pb-3 text-sm text-gray-500">ID</th>
                <th className="text-left pb-3 text-sm text-gray-500">Role</th>
                <th className="text-left pb-3 text-sm text-gray-500">Department</th>
                <th className="text-left pb-3 text-sm text-gray-500">Join Date</th>
                <th className="text-right pb-3 text-sm text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                        {employee.fullName ? employee.fullName.charAt(0) : '?'}
                      </div>
                      <div>
                        <p className="font-medium">{employee.fullName}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {employee.emailId || 'No Email'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-sm font-mono text-gray-600">
                    {employee.employeeId}
                  </td>
                  <td className="py-4">
                    <Badge className={getRoleBadgeColor(employee.designation)}>
                      <Shield className="w-3 h-3 mr-1" />
                      {employee.designation}
                    </Badge>
                  </td>
                  <td className="py-4 text-sm">{employee.department}</td>
                  <td className="py-4 text-sm">{new Date(employee.createdAt).toLocaleDateString()}</td>
                  <td className="py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEmployee(employee._id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                   <td colSpan={6} className="text-center py-8 text-gray-500">No employees found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
      </Card>
    </div>
  );
}
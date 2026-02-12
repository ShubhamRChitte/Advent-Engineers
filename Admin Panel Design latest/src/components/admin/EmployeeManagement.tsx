import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
<<<<<<< HEAD
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
=======
import { Checkbox } from '../ui/checkbox';
import { UserPlus, Edit, Trash2, Mail, Shield, Smartphone, Calendar, Briefcase, Activity, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface TransformerSkills {
  canTestCT: boolean;
  canTestPT: boolean;
}

interface TestCapabilities {
  ratioTest: boolean;
  polarityTest: boolean;
  burdenTest: boolean;
  accuracyTest: boolean;
  excitationTest: boolean;
  insulationResistanceTest: boolean;
  tanDeltaTest: boolean;
}

interface Employee {
  _id: string; // Backend uses _id
  employeeId: string;
  fullName: string;
  emailId: string;
  mobileNumber: string;
  designation: string;
  department: string;
  dateOfJoining: string;
  employmentType: string;
  activeStatus: boolean;
  transformerSkills?: TransformerSkills;
  testCapabilities?: TestCapabilities;
  voltageExperience?: number[];
  assignedLab?: string;
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
}

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
<<<<<<< HEAD
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
=======
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    emailId: '',
    mobileNumber: '',
    password: '',
    designation: '',
    department: '',
    dateOfJoining: '',
    employmentType: '',
    assignedLab: '',
    voltageExperience: '', // Comma separated for input
    transformerSkills: {
      canTestCT: false,
      canTestPT: false
    },
    testCapabilities: {
      ratioTest: false,
      polarityTest: false,
      burdenTest: false,
      accuracyTest: false,
      excitationTest: false,
      insulationResistanceTest: false,
      tanDeltaTest: false
    }
  });

  // Fetch Employees
  const fetchEmployees = async () => {
    try {
      const response = await fetch('http://localhost:3002/auth/all-employees');
      const data = await response.json();
      if (data.success) {
        setEmployees(data.users);
      } else {
        toast.error('Failed to fetch employees');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error fetching employees');
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

<<<<<<< HEAD
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
=======
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (category: 'transformerSkills' | 'testCapabilities', field: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: checked
      }
    }));
  };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.password || !formData.designation || !formData.department || !formData.mobileNumber || !formData.dateOfJoining || !formData.employmentType) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // Parse voltage experience
      const voltageArray = formData.voltageExperience
        ? formData.voltageExperience.split(',').map(v => Number(v.trim())).filter(n => !isNaN(n))
        : [];

      const payload = {
        ...formData,
        voltageExperience: voltageArray
      };

      const response = await fetch('http://localhost:3002/auth/add-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Employee added! ID: ${data.employeeId}`);
        setIsAddDialogOpen(false);
        setFormData({
          fullName: '', emailId: '', mobileNumber: '', password: '', designation: '', department: '', dateOfJoining: '', employmentType: '', assignedLab: '', voltageExperience: '',
          transformerSkills: { canTestCT: false, canTestPT: false },
          testCapabilities: { ratioTest: false, polarityTest: false, burdenTest: false, accuracyTest: false, excitationTest: false, insulationResistanceTest: false, tanDeltaTest: false }
        });
        fetchEmployees();
      } else {
        toast.error(data.message || 'Failed to add employee');
      }
    } catch (error) {
      toast.error('Error submitting form');
    } finally {
      setIsLoading(false);
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
    }
  };

  const getRoleBadgeColor = (role: string) => {
<<<<<<< HEAD
    switch (role) {
      case 'Admin': return 'bg-purple-100 text-purple-700';
      case 'Entry Level': return 'bg-blue-100 text-blue-700'; // Match backend enum/value if possible
      case 'Core Tester': return 'bg-green-100 text-green-700';
      case 'Secondary Tester': return 'bg-orange-100 text-orange-700';
      case 'Final Tester': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
=======
    if (!role) return 'bg-gray-100 text-gray-700';
    if (role.includes('Admin')) return 'bg-purple-100 text-purple-700';
    if (role.includes('Entry')) return 'bg-blue-100 text-blue-700';
    if (role.includes('Tester')) return 'bg-orange-100 text-orange-700';
    return 'bg-gray-100 text-gray-700';
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
  };

  return (
    <div className="space-y-6">
<<<<<<< HEAD
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
=======
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Employee Management</h2>
          <p className="text-muted-foreground">Manage system users and their roles</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700"><UserPlus className="mr-2 h-4 w-4" /> Add Employee</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>Enter the details for the new employee. Employee ID will be auto-generated to format EMP001.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              {/* Basic Info */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input id="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input id="password" type="password" value={formData.password} onChange={handleInputChange} placeholder="Secret" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number *</Label>
                <Input id="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} placeholder="9876543210" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailId">Email ID</Label>
                <Input id="emailId" value={formData.emailId} onChange={handleInputChange} placeholder="john@example.com" />
              </div>

              {/* Work Info */}
              <div className="space-y-2">
                <Label htmlFor="designation">Designation *</Label>
                <Select onValueChange={(v: string) => handleSelectChange('designation', v)}>
                  <SelectTrigger><SelectValue placeholder="Select Designation" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Entry Operator">Entry Operator</SelectItem>
                    <SelectItem value="Tester">Tester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select onValueChange={(v: string) => handleSelectChange('department', v)}>
                  <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
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

<<<<<<< HEAD
              <Button onClick={handleAddEmployee} className="w-full bg-red-600 hover:bg-red-700 mt-2">
                Create User
=======
              <div className="space-y-2">
                <Label htmlFor="dateOfJoining">Date of Joining *</Label>
                <Input id="dateOfJoining" type="date" value={formData.dateOfJoining} onChange={handleInputChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employmentType">Employment Type *</Label>
                <Select onValueChange={(v: string) => handleSelectChange('employmentType', v)}>
                  <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Permanent">Permanent</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Trainee">Trainee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Skills & Experience */}
              <div className="col-span-1 md:col-span-2 space-y-2 border-t pt-4">
                <Label className="font-semibold text-base">Transformer Skills</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="canTestCT" checked={formData.transformerSkills.canTestCT} onCheckedChange={(c: boolean) => handleCheckboxChange('transformerSkills', 'canTestCT', c)} />
                    <Label htmlFor="canTestCT">Can Test CT</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="canTestPT" checked={formData.transformerSkills.canTestPT} onCheckedChange={(c: boolean) => handleCheckboxChange('transformerSkills', 'canTestPT', c)} />
                    <Label htmlFor="canTestPT">Can Test PT</Label>
                  </div>
                </div>
              </div>

              {/* Capabilities */}
              <div className="col-span-1 md:col-span-2 space-y-2 mt-2">
                <Label className="font-semibold text-base">Test Capabilities</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.keys(formData.testCapabilities).map((key) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox id={key} checked={formData.testCapabilities[key as keyof TestCapabilities]} onCheckedChange={(c: boolean) => handleCheckboxChange('testCapabilities', key, c)} />
                      <Label htmlFor={key} className="capitalize text-sm">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 space-y-2 mt-2">
                <Label htmlFor="voltageExperience">Voltage Experience (kV) - Comma separated</Label>
                <Input id="voltageExperience" value={formData.voltageExperience} onChange={handleInputChange} placeholder="e.g. 11, 33, 66" />
              </div>

              <div className="col-span-1 md:col-span-2 space-y-2">
                <Label htmlFor="assignedLab">Assigned Lab</Label>
                <Input id="assignedLab" value={formData.assignedLab} onChange={handleInputChange} placeholder="e.g. Lab A" />
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleSubmit} className="bg-red-600 hover:bg-red-700 w-full md:w-auto" disabled={isLoading}>
                {isLoading ? 'Adding Employee...' : 'Save & Add Employee'}
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

<<<<<<< HEAD
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
=======
      {/* Employees Table */}
      <Card className="p-6 mt-6">
        <h3 className="mb-4 text-lg font-semibold">Employee List</h3>
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
<<<<<<< HEAD
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
=======
                <th className="text-left pb-3 text-sm font-medium text-gray-500">Employee</th>
                <th className="text-left pb-3 text-sm font-medium text-gray-500">Role</th>
                <th className="text-left pb-3 text-sm font-medium text-gray-500">Department</th>
                <th className="text-left pb-3 text-sm font-medium text-gray-500">Contact</th>
                <th className="text-left pb-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left pb-3 text-sm font-medium text-gray-500">Joined</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">No employees found. Add one to get started.</td></tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee._id} className="border-b border-gray-100 hover:bg-slate-50 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 border flex items-center justify-center text-sm font-bold text-slate-700">
                          {employee.fullName ? employee.fullName.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{employee.fullName}</p>
                          <Badge variant="outline" className="text-xs font-normal mt-0.5">{employee.employeeId}</Badge>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <Badge className={getRoleBadgeColor(employee.designation)}>
                        {employee.designation}
                      </Badge>
                    </td>
                    <td className="py-4 text-sm font-medium text-slate-600">{employee.department}</td>
                    <td className="py-4 text-sm">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1 text-slate-700"><Smartphone className="w-3 h-3" /> {employee.mobileNumber}</span>
                        {employee.emailId && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="w-3 h-3" /> {employee.emailId}</span>}
                      </div>
                    </td>
                    <td className="py-4">
                      <Badge variant={employee.activeStatus ? "secondary" : "destructive"} className={employee.activeStatus ? "bg-green-100 text-green-700 hover:bg-green-200" : ""}>
                        {employee.activeStatus ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-4 text-sm text-slate-500">
                      {new Date(employee.dateOfJoining).toLocaleDateString()}
                    </td>
                  </tr>
                ))
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
              )}
            </tbody>
          </table>
        </div>
<<<<<<< HEAD
        )}
=======
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1
      </Card>
    </div>
  );
}
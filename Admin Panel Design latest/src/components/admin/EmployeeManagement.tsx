import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
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
}

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
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
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

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
    }
  };

  const getRoleBadgeColor = (role: string) => {
    if (!role) return 'bg-gray-100 text-gray-700';
    if (role.includes('Admin')) return 'bg-purple-100 text-purple-700';
    if (role.includes('Entry')) return 'bg-blue-100 text-blue-700';
    if (role.includes('Tester')) return 'bg-orange-100 text-orange-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
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
                  <SelectContent>
                    <SelectItem value="Management">Management</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Core Test">Core Test</SelectItem>
                    <SelectItem value="Secondary Test">Secondary Test</SelectItem>
                    <SelectItem value="Primary Test">Primary Test</SelectItem>
                    <SelectItem value="Final Test">Final Test</SelectItem>
                    <SelectItem value="PT Test">PT Test</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Employees Table */}
      <Card className="p-6 mt-6">
        <h3 className="mb-4 text-lg font-semibold">Employee List</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
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
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

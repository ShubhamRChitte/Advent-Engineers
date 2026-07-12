import { useState, useEffect } from 'react';
import useSWR from 'swr';
import axios from '../../utils/axiosConfig';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { Checkbox } from '../ui/checkbox';
import { UserPlus, Edit, Trash2, Mail, Shield, Smartphone, Calendar, Briefcase, Activity, Zap, Eye, EyeOff } from 'lucide-react';
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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For form submission
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [page, setPage] = useState(1);
  const [showPassword, setShowPassword] = useState(false);

  const fetcher = (url: string) => axios.get(url).then(res => res.data);
  
  const { data, mutate, isLoading: isSWRLoading } = useSWR(
    `/auth/all-employees?paginated=true&limit=${page * 20}`,
    fetcher
  );
  
  const employees: Employee[] = data?.users || [];
  const totalCount = data?.totalCount || 0;

  // Form State
  const initialFormState = {
    fullName: '',
    emailId: '',
    mobileNumber: '',
    password: '',
    designation: '',
    department: '',
    dateOfJoining: '',
    employmentType: '',
    assignedLab: '',
    activeStatus: true,
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
  };

  const [formData, setFormData] = useState(initialFormState);

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

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      fullName: employee.fullName || '',
      emailId: employee.emailId || '',
      mobileNumber: employee.mobileNumber || '',
      password: '', // Don't show password
      designation: employee.designation || '',
      department: employee.department || '',
      dateOfJoining: employee.dateOfJoining ? (new Date(employee.dateOfJoining).toISOString().split('T')[0] || '') : '',
      employmentType: employee.employmentType || '',
      assignedLab: employee.assignedLab || '',
      activeStatus: employee.activeStatus !== undefined ? employee.activeStatus : true,
      voltageExperience: employee.voltageExperience ? employee.voltageExperience.join(', ') : '',
      transformerSkills: employee.transformerSkills || { canTestCT: false, canTestPT: false },
      testCapabilities: employee.testCapabilities || { ratioTest: false, polarityTest: false, burdenTest: false, accuracyTest: false, excitationTest: false, insulationResistanceTest: false, tanDeltaTest: false }
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;

    try {
      const response = await axios.delete(`/auth/delete-employee/${id}`);
      const data = response.data;
      if (data.success) {
        toast.success('Employee deleted');
        mutate();
      } else {
        toast.error(data.message || 'Failed to delete');
      }
    } catch (error) {
      toast.error('Error deleting employee');
    }
  };

  const handleSubmit = async () => {
    const requiredFields = ['fullName', 'emailId', 'designation', 'department', 'mobileNumber', 'dateOfJoining', 'employmentType'];
    if (!editingEmployee) requiredFields.push('password');

    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        toast.error(`Please fill in ${field}`);
        return;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.emailId)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(formData.mobileNumber)) {
      toast.error('Please enter a valid 10-digit mobile number.');
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

      const url = editingEmployee 
        ? `/auth/update-employee/${editingEmployee._id}`
        : `/auth/add-employee`;
      
      let response;
      if (editingEmployee) {
        response = await axios.put(url, payload);
      } else {
        response = await axios.post(url, payload);
      }

      const data = response.data;

      if (data.success) {
        toast.success(editingEmployee ? 'Employee updated!' : `Employee added! ID: ${data.employeeId}`);
        setIsAddDialogOpen(false);
        setEditingEmployee(null);
        setFormData(initialFormState);
        mutate();
      } else {
        toast.error(data.message || 'Operation failed');
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
    if (role.includes('Tester') || role.includes('Testing Engineer')) return 'bg-orange-100 text-orange-700';
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
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setEditingEmployee(null);
            setFormData(initialFormState);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700"><UserPlus className="mr-2 h-4 w-4" /> Add Employee</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
              <DialogDescription>
                {editingEmployee 
                  ? `Updating details for ${editingEmployee.fullName} (${editingEmployee.employeeId})`
                  : 'Enter the details for the new employee. Employee ID will be auto-generated to format EMP001.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              {/* Basic Info */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input id="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password {editingEmployee ? '(Leave blank to keep current)' : '*'}</Label>
                <div className="relative w-full flex items-center">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    value={formData.password} 
                    onChange={handleInputChange} 
                    placeholder="Secret" 
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute text-gray-500 hover:text-gray-700 focus:outline-none flex items-center justify-center"
                    style={{ right: '0.75rem' }}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number *</Label>
                <Input 
                  id="mobileNumber" 
                  value={formData.mobileNumber} 
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, ''); // Allow only digits
                    if (val.length <= 10) {
                      setFormData(prev => ({ ...prev, mobileNumber: val }));
                    }
                  }} 
                  placeholder="9876543210" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailId">Email ID *</Label>
                <Input id="emailId" type="email" value={formData.emailId} onChange={handleInputChange} placeholder="john@example.com" />
              </div>

              {/* Work Info */}
              <div className="space-y-2">
                <Label htmlFor="designation">Designation *</Label>
                <Select value={formData.designation} onValueChange={(v: string) => handleSelectChange('designation', v)}>
                  <SelectTrigger id="designation"><SelectValue placeholder="Select Designation" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Entry Operator">Entry Operator</SelectItem>
                    <SelectItem value="Testing Engineer">Testing Engineer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select value={formData.department} onValueChange={(v: string) => handleSelectChange('department', v)}>
                  <SelectTrigger id="department"><SelectValue placeholder="Select Department" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Management">Management</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Core Test">Core Test</SelectItem>
                    <SelectItem value="Secondary Test">Secondary Test</SelectItem>
                    <SelectItem value="Primary Test">Primary Test</SelectItem>
                    <SelectItem value="Final Test">Final Test</SelectItem>
                    <SelectItem value="PT Test">PT Test</SelectItem>
                    <SelectItem value="PT Pretest">PT Pretest</SelectItem>
                    <SelectItem value="Heating">Heating</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfJoining">Date of Joining *</Label>
                <Input id="dateOfJoining" type="date" value={formData.dateOfJoining} onChange={handleInputChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employmentType">Employment Type *</Label>
                <Select value={formData.employmentType} onValueChange={(v: string) => handleSelectChange('employmentType', v)}>
                  <SelectTrigger id="employmentType"><SelectValue placeholder="Select Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Permanent">Permanent</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Trainee">Trainee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Toggle for Edit */}
              {editingEmployee && (
                <div className="flex items-center space-x-2 py-2">
                  <Checkbox 
                    id="activeStatus" 
                    checked={formData.activeStatus} 
                    onCheckedChange={(c: boolean) => setFormData(prev => ({ ...prev, activeStatus: c }))} 
                  />
                  <Label htmlFor="activeStatus" className="font-semibold text-slate-700">Account Active</Label>
                </div>
              )}

              {/* Skills & Experience */}
              <div className="col-span-1 md:col-span-2 space-y-2 border-t pt-4">
                <Label className="font-semibold text-base">Transformer Skills</Label>
                <div className="flex gap-4">
                  <div 
                    className={`flex items-center gap-3 p-3 border rounded-lg transition-colors cursor-pointer select-none min-h-[3rem] ${formData.transformerSkills.canTestCT ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`} 
                    onClick={() => handleCheckboxChange('transformerSkills', 'canTestCT', !formData.transformerSkills.canTestCT)}
                  >
                    <div className="flex-shrink-0 flex items-center justify-center w-5 h-5 relative">
                      <Checkbox id="canTestCT" checked={formData.transformerSkills.canTestCT} className="absolute inset-0" style={{ pointerEvents: 'none' }} />
                    </div>
                    <span className="font-medium flex-1 text-sm">{formData.transformerSkills.canTestCT ? 'Can Test CT' : 'Can Test CT'}</span>
                  </div>
                  <div 
                    className={`flex items-center gap-3 p-3 border rounded-lg transition-colors cursor-pointer select-none min-h-[3rem] ${formData.transformerSkills.canTestPT ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`} 
                    onClick={() => handleCheckboxChange('transformerSkills', 'canTestPT', !formData.transformerSkills.canTestPT)}
                  >
                    <div className="flex-shrink-0 flex items-center justify-center w-5 h-5 relative">
                      <Checkbox id="canTestPT" checked={formData.transformerSkills.canTestPT} className="absolute inset-0" style={{ pointerEvents: 'none' }} />
                    </div>
                    <span className="font-medium flex-1 text-sm">Can Test PT</span>
                  </div>
                </div>
              </div>

              {/* Capabilities */}
              <div className="col-span-1 md:col-span-2 space-y-2 mt-2">
                <Label className="font-semibold text-base">Test Capabilities</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.keys(formData.testCapabilities).map((key) => (
                    <div 
                      key={key} 
                      className={`flex items-center gap-3 p-3 border rounded-lg transition-colors cursor-pointer select-none min-h-[3.5rem] ${formData.testCapabilities[key as keyof TestCapabilities] ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`} 
                      onClick={() => handleCheckboxChange('testCapabilities', key, !formData.testCapabilities[key as keyof TestCapabilities])}
                    >
                      <div className="flex-shrink-0 flex items-center justify-center w-5 h-5 relative">
                        <Checkbox id={key} checked={formData.testCapabilities[key as keyof TestCapabilities]} className="absolute inset-0" style={{ pointerEvents: 'none' }} />
                      </div>
                      <span className="text-sm font-medium leading-snug flex-1">
                        {(key.replace(/([A-Z])/g, ' $1').trim()).replace(/^./, str => str.toUpperCase())}
                      </span>
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
                {isLoading ? (editingEmployee ? 'Updating...' : 'Adding...') : (editingEmployee ? 'Update Employee' : 'Save & Add Employee')}
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
                <th className="text-right pb-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isSWRLoading && employees.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse border-b">
                    <td colSpan={7} className="py-4 px-2">
                      <div className="h-10 bg-gray-200 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : employees.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">No employees found. Add one to get started.</td></tr>
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
                        {employee.designation === 'Tester' ? 'Testing Engineer' : employee.designation}
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
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-blue-600"
                          onClick={() => handleEdit(employee)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-red-600"
                          onClick={() => handleDelete(employee._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalCount > employees.length && (
          <div className="flex justify-center mt-6">
            <Button 
              variant="outline" 
              onClick={() => setPage(p => p + 1)}
              disabled={isSWRLoading}
            >
              {isSWRLoading ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

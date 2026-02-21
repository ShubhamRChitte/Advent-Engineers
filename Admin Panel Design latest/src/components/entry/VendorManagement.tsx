/* Updated to use Real API */
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { UserPlus, Edit, Trash2, Building2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';

interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  coresSupplied: number;
  status: 'active' | 'inactive';
}

export function VendorManagement() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVendors = async () => {
    try {
      const res = await axios.get('http://localhost:3002/api/vendors', { withCredentials: true });
      setVendors(res.data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      toast.error("Failed to load vendors");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
  });

  const handleAddVendor = async () => {
    if (!newVendor.name || !newVendor.contactPerson || !newVendor.email || !newVendor.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await axios.post('http://localhost:3002/api/vendors', newVendor, { withCredentials: true });
      toast.success('Vendor registered successfully!');
      setNewVendor({ name: '', contactPerson: '', email: '', phone: '', address: '' });
      setIsAddDialogOpen(false);
      fetchVendors(); // Refresh list
    } catch (error) {
      console.error("Error adding vendor:", error);
      toast.error('Failed to add vendor');
    }
  };

  const handleDeleteVendor = async (id: string) => {
    try {
      await axios.delete(`http://localhost:3002/api/vendors/${id}`, { withCredentials: true });
      setVendors(vendors.filter(v => v.id !== id));
      toast.success('Vendor deleted successfully!');
    } catch (error) {
      console.error("Error deleting vendor:", error);
      toast.error('Failed to delete vendor');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Core Vendor Management</h2>
          <p className="text-gray-500 mt-1">Register and manage core suppliers</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Register Vendor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New Vendor</DialogTitle>
              <DialogDescription>
                Add a new core supplier to the system.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="vendorName">Vendor Name *</Label>
                <Input
                  id="vendorName"
                  placeholder="Enter vendor name"
                  value={newVendor.name}
                  onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="contactPerson">Contact Person *</Label>
                <Input
                  id="contactPerson"
                  placeholder="Enter contact person name"
                  value={newVendor.contactPerson}
                  onChange={(e) => setNewVendor({ ...newVendor, contactPerson: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email"
                  value={newVendor.email}
                  onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  placeholder="Enter phone number"
                  value={newVendor.phone}
                  onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="Enter address"
                  value={newVendor.address}
                  onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleAddVendor} className="w-full bg-red-600 hover:bg-red-700">
                Register Vendor
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Vendors</p>
          <h3 className="mt-1">{vendors.length}</h3>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Active Vendors</p>
          <h3 className="mt-1 text-green-600">{vendors.filter(v => v.status === 'active').length}</h3>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Cores Supplied</p>
          <h3 className="mt-1">{vendors.reduce((sum, v) => sum + v.coresSupplied, 0)}</h3>
        </Card>
      </div>

      {/* Vendors Table */}
      <Card className="p-6">
        <h3 className="mb-4">Registered Vendors</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left p-3 text-sm">Vendor</th>
                <th className="text-left p-3 text-sm">Contact Person</th>
                <th className="text-left p-3 text-sm">Email</th>
                <th className="text-left p-3 text-sm">Phone</th>
                <th className="text-left p-3 text-sm">Location</th>
                <th className="text-center p-3 text-sm">Cores Supplied</th>
                <th className="text-left p-3 text-sm">Status</th>
                <th className="text-right p-3 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-gray-400" />
                      <span className="font-medium">{vendor.name}</span>
                    </div>
                  </td>
                  <td className="p-3">{vendor.contactPerson}</td>
                  <td className="p-3">{vendor.email}</td>
                  <td className="p-3">{vendor.phone}</td>
                  <td className="p-3">{vendor.address}</td>
                  <td className="p-3 text-center">{vendor.coresSupplied}</td>
                  <td className="p-3">
                    <Badge className={vendor.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                      {vendor.status}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteVendor(vendor.id)}
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

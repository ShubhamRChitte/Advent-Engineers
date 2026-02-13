import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { User } from '../App';
import logoImage from 'figma:asset/d4d1bc6f9b0c444f1821bbe84a4da57caf7080d2.png';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

interface DebugUser {
  _id: string;
  employeeId: string;
  fullName: string;
  designation: string;
  password?: string;
  department: string;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugUsers, setDebugUsers] = useState<DebugUser[]>([]);

  useEffect(() => {
    // Fetch users for debugging purposes
    const fetchDebugUsers = async () => {
      try {
        const response = await fetch('http://localhost:3002/auth/debug-users');
        const data = await response.json();
        if (data.success) {
          setDebugUsers(data.users);
        }
      } catch (err) {
        console.error("Failed to fetch debug users:", err);
      }
    };
    fetchDebugUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3002/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ employeeId, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Map backend user to frontend User interface
        const user: User = {
          id: data.user.id,
          name: data.user.fullName,
          employeeId: data.user.employeeId,
          role: data.user.role,
          department: data.user.department,
          // email is optional now
        };
        onLogin(user);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100 flex flex-col items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-md p-8 shadow-xl mb-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <ImageWithFallback
              src={logoImage}
              alt="Advent Engineers Logo"
              className="h-20 w-auto"
            />
          </div>
          <h1 className="text-[#003a70]">ADVENT ENGINEERS</h1>
          <p className="text-gray-600 mt-2">Transformer Testing System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="employeeId">Employee ID</Label>
            <Input
              id="employeeId"
              type="text"
              placeholder="e.g. EMP-1001"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full bg-[#003a70] hover:bg-[#002a50] text-white" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-3">Demo Credentials:</p>
          <div className="space-y-2 text-xs">
            <div className="bg-slate-50 p-2 rounded border border-slate-200">
              <p>Admin:</p>
              <p className="text-gray-600">EMP-1001 / password123</p>
            </div>
            {/* Keeping the static demo credentials for reference as well, or removing them? 
                 The user asked to "show the all users in the database with their id and password".
                 The static list might be confusing if it differs from DB. 
                 But I'll keep it as a fallback visual for now, or maybe just replace it with the dynamic list.
                 Actually, the dynamic list is better. I'll render the dynamic list BELOW this card or replace the content.
                 Let's render a separate card below for the database users.
             */}
          </div>
        </div>
      </Card>

      {/* Database Users List */}
      <Card className="w-full max-w-4xl p-6 shadow-xl bg-white">
        <h3 className="text-lg font-bold mb-4 text-[#003a70]">Database Users (Debug)</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-2">Emp ID</th>
                <th className="py-2 px-2">Name</th>
                <th className="py-2 px-2">Designation</th>
                <th className="py-2 px-2">Department</th>
                <th className="py-2 px-2">Password Hash / Note</th>
              </tr>
            </thead>
            <tbody>
              {debugUsers.map(user => (
                <tr key={user._id} className="border-b hover:bg-slate-50">
                  <td className="py-2 px-2 font-medium">{user.employeeId}</td>
                  <td className="py-2 px-2">{user.fullName}</td>
                  <td className="py-2 px-2">{user.designation}</td>
                  <td className="py-2 px-2">{user.department}</td>
                  <td className="py-2 px-2 break-all font-mono text-gray-500">
                    {user.password ? user.password.substring(0, 20) + "..." : "No Password"}
                    <span className="ml-2 text-[10px] text-gray-400">(Hash)</span>
                  </td>
                </tr>
              ))}
              {debugUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500">Loading users or no users found...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
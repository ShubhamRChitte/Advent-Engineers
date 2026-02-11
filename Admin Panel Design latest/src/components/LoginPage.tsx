import { useState } from 'react';
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

export function LoginPage({ onLogin }: LoginPageProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
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
            <div className="bg-slate-50 p-2 rounded border border-slate-200 flex justify-between">
              <span className="font-semibold text-gray-700">Admin:</span>
              <span className="text-gray-600 font-mono">EMP001 / admin</span>
            </div>
            <div className="bg-slate-50 p-2 rounded border border-slate-200 flex justify-between">
              <span className="font-semibold text-gray-700">Core Tester:</span>
              <span className="text-gray-600 font-mono">EMP002 / password123</span>
            </div>
            <div className="bg-slate-50 p-2 rounded border border-slate-200 flex justify-between">
              <span className="font-semibold text-gray-700">Secondary Tester:</span>
              <span className="text-gray-600 font-mono">EMP004 / password123</span>
            </div>
            <div className="bg-slate-50 p-2 rounded border border-slate-200 flex justify-between">
              <span className="font-semibold text-gray-700">Primary Tester:</span>
              <span className="text-gray-600 font-mono">EMP006 / password123</span>
            </div>
            <div className="bg-slate-50 p-2 rounded border border-slate-200 flex justify-between">
              <span className="font-semibold text-gray-700">Final Tester:</span>
              <span className="text-gray-600 font-mono">EMP008 / password123</span>
            </div>
            <div className="bg-slate-50 p-2 rounded border border-slate-200 flex justify-between">
              <span className="font-semibold text-gray-700">Entry Operator:</span>
              <span className="text-gray-600 font-mono">EMP099 / password123</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
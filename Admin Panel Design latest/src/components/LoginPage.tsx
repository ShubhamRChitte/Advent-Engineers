import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { User } from '../App';
import axios from '../utils/axiosConfig';
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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/auth/login', { employeeId, password });
      const data = response.data;

      if (data.success) {
        // Store token for Bearer authentication
        if (data.token) localStorage.setItem('token', data.token);
        
        // Map backend user to frontend User interface
        const user: User = {
          id: data.user.id,
          name: data.user.fullName,
          employeeId: data.user.employeeId,
          role: data.user.role,
          department: data.user.department,
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

      </Card>
    </div>
  );
}

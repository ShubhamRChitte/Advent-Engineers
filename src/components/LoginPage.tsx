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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Mock credentials
  const credentials = [
    {
      email: 'admin@advent.com',
      password: 'admin123',
      user: { id: '1', name: 'Moni Roy', email: 'admin@advent.com', role: 'admin' as const, department: 'Management' },
    },
    {
      email: 'entry@advent.com',
      password: 'entry123',
      user: { id: '2', name: 'Sarah Johnson', email: 'entry@advent.com', role: 'entry-operator' as const, department: 'Operations' },
    },
    {
      email: 'core@advent.com',
      password: 'core123',
      user: { id: '3', name: 'John Smith', email: 'core@advent.com', role: 'core-tester' as const, department: 'Core Testing' },
    },
    {
      email: 'secondary@advent.com',
      password: 'secondary123',
      user: { id: '4', name: 'Mike Wilson', email: 'secondary@advent.com', role: 'secondary-tester' as const, department: 'Secondary Testing' },
    },
    {
      email: 'afterprimary@advent.com',
      password: 'afterprimary123',
      user: { id: '5', name: 'David Martinez', email: 'afterprimary@advent.com', role: 'after-primary-tester' as const, department: 'After Primary Testing' },
    },
    {
      email: 'final@advent.com',
      password: 'final123',
      user: { id: '6', name: 'Emma Davis', email: 'final@advent.com', role: 'final-tester' as const, department: 'Final Testing' },
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const credential = credentials.find(
      c => c.email === email && c.password === password
    );

    if (credential) {
      onLogin(credential.user);
    } else {
      setError('Invalid email or password');
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

          <Button type="submit" className="w-full bg-[#003a70] hover:bg-[#002a50] text-white">
            Login
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-3">Demo Credentials:</p>
          <div className="space-y-2 text-xs">
            <div className="bg-slate-50 p-2 rounded border border-slate-200">
              <p>Admin:</p>
              <p className="text-gray-600">admin@advent.com / admin123</p>
            </div>
            <div className="bg-slate-50 p-2 rounded border border-slate-200">
              <p>Entry Operator:</p>
              <p className="text-gray-600">entry@advent.com / entry123</p>
            </div>
            <div className="bg-slate-50 p-2 rounded border border-slate-200">
              <p>Core Tester:</p>
              <p className="text-gray-600">core@advent.com / core123</p>
            </div>
            <div className="bg-slate-50 p-2 rounded border border-slate-200">
              <p>Secondary Tester:</p>
              <p className="text-gray-600">secondary@advent.com / secondary123</p>
            </div>
            <div className="bg-slate-50 p-2 rounded border border-slate-200">
              <p>After Primary Tester:</p>
              <p className="text-gray-600">afterprimary@advent.com / afterprimary123</p>
            </div>
            <div className="bg-slate-50 p-2 rounded border border-slate-200">
              <p>Final Tester:</p>
              <p className="text-gray-600">final@advent.com / final123</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
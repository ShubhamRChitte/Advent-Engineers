import { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { EntryOperatorLayout } from './components/entry/EntryOperatorLayout';
import { TesterLayout } from './components/tester/TesterLayout';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'entry-operator' | 'core-tester' | 'secondary-tester' | 'after-primary-tester' | 'final-tester';
  department?: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Route based on user role
  if (user.role === 'admin') {
    return <AdminLayout user={user} onLogout={handleLogout} />;
  }
  
  if (user.role === 'entry-operator') {
    return <EntryOperatorLayout user={user} onLogout={handleLogout} />;
  }
  
  if (['core-tester', 'secondary-tester', 'after-primary-tester', 'final-tester'].includes(user.role)) {
    return <TesterLayout user={user} onLogout={handleLogout} />;
  }

  return <LoginPage onLogin={handleLogin} />;
}
import { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { EntryOperatorLayout } from './components/entry/EntryOperatorLayout';
import { TesterLayout } from './components/tester/TesterLayout';
import { Toaster } from 'sonner';
import { ReportPage } from './pages/ReportPage';

export interface User {
  id: string;
  name: string;
  employeeId: string;
  email?: string; // Made optional as we login with employeeId
  role: 'admin' | 'entry-operator' | 'core-tester' | 'secondary-tester' | 'after-primary-tester' | 'final-tester' | 'pt-tester';
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

  // Manual route for the Report Page (accessible without strict tester login depending on needs)
  if (window.location.pathname.startsWith('/report/')) {
    return (
      <>
        <ReportPage />
        <Toaster />
      </>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Route based on user role
  if (user.role === 'admin') {
    return (
      <>
        <AdminLayout user={user} onLogout={handleLogout} />
        <Toaster />
      </>
    );
  }

  if (user.role === 'entry-operator') {
    return (
      <>
        <EntryOperatorLayout user={user} onLogout={handleLogout} />
        <Toaster />
      </>
    );
  }

  if (['core-tester', 'secondary-tester', 'after-primary-tester', 'final-tester', 'pt-tester'].includes(user.role)) {
    return (
      <>
        <TesterLayout user={user} onLogout={handleLogout} />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <LoginPage onLogin={handleLogin} />
      <Toaster />
    </>
  );
}

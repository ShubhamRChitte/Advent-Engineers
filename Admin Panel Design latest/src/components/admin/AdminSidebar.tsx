import { LayoutDashboard, Users, PlusCircle, List, FileText, Bell, AlertTriangle, Warehouse, Timer } from 'lucide-react';
import logoImage from 'figma:asset/9d5dbd3020690d903579eb3ff66bac216cd36f83.png';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { useState, useEffect } from 'react';
import axios from 'axios';

interface AdminSidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

export function AdminSidebar({ activeView, setActiveView }: AdminSidebarProps) {
  const [failedCount, setFailedCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await axios.get('http://localhost:5001/api/failed-cores/count', { 
          withCredentials: true,
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        if (res.data.success) {
          setFailedCount(res.data.count);
        }
      } catch (e) {
        console.error("Failed to fetch failed count", e);
      }
    };

    fetchCount();
    // Poll every 60s
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'failed-cores', label: 'Failed Cores', icon: AlertTriangle, badge: failedCount > 0 ? failedCount : undefined },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'add-order', label: 'Add Orders', icon: PlusCircle },
    { id: 'view-orders', label: 'View Orders', icon: List },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'customer-reports', label: 'Customer Reports', icon: FileText },
    { id: 'ready-stock', label: 'Ready Stock', icon: Warehouse },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'pt-delay-tracker', label: 'PT Delay Tracker', icon: Timer },
    { id: 'ct-delay-tracker', label: 'CT Delay Tracker', icon: Timer },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <ImageWithFallback
          src={logoImage}
          alt="Advent Engineers"
          className="w-full h-auto"
        />
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors group ${isActive
                ? 'bg-[#003a70] text-white'
                : 'text-gray-700 hover:bg-slate-50'
                }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              {item.badge && (
                <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

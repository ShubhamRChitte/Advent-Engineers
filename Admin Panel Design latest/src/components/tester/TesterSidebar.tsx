import { ClipboardCheck, FileText, Home, Bell, Zap, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import logoImage from 'figma:asset/9d5dbd3020690d903579eb3ff66bac216cd36f83.png';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface TesterSidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  userRole: string;
}

export function TesterSidebar({ activeView, setActiveView, userRole }: TesterSidebarProps) {
  const [failedCount, setFailedCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await axios.get('http://localhost:3002/api/failed-cores/count', { withCredentials: true });
        if (res.data.success) {
          setFailedCount(res.data.count);
        }
      } catch (e) {
        console.error("Failed to fetch failed count", e);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const getMenuItems = () => {
    if (userRole === 'core-tester') {
      return [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'view-orders', label: 'View Orders', icon: FileText },
        { id: 'core-tracking', label: 'Core Tracking', icon: Zap },
        { id: 'failed-cores', label: 'Failed Cores', icon: AlertTriangle, badge: failedCount > 0 ? failedCount : undefined },
      ];
    }

    // For secondary, after-primary, and final testers
    return [
      { id: 'home', label: 'Home', icon: Home },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'testing', label: 'Testing', icon: ClipboardCheck },
      { id: 'view-orders', label: 'View Orders', icon: FileText },
      { id: 'failed-cores', label: 'Failed Cores', icon: AlertTriangle, badge: failedCount > 0 ? failedCount : undefined },
      { id: 'reports', label: 'My Reports', icon: FileText },
    ];
  };

  const menuItems = getMenuItems();

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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                ? 'bg-[#003a70] text-white'
                : 'text-gray-700 hover:bg-slate-50'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

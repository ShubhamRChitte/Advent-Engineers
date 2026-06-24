import { ClipboardCheck, FileText, Home, Bell, Zap, AlertTriangle, Warehouse } from 'lucide-react';

import { useState, useEffect } from 'react';
import axios from '@/utils/axiosConfig';
import logoImage from 'figma:asset/9d5dbd3020690d903579eb3ff66bac216cd36f83.png';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface TesterSidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  userRole: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  badge?: number | undefined;
}

export function TesterSidebar({ activeView, setActiveView, userRole }: TesterSidebarProps) {
  const [failedCount, setFailedCount] = useState(0);
  const [failedTransformersCount, setFailedTransformersCount] = useState(0);
  const [ptFailedCount, setPtFailedCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        if (userRole === 'secondary-tester') {
          const res = await axios.get(`/failed-transformers/count`, { withCredentials: true });
          if (res.data.success) {
            setFailedTransformersCount(res.data.count);
          }
        } else if (userRole === 'pt-tester') {
          const res = await axios.get(`/failed-transformers/count?stage=PT_TESTING`, { withCredentials: true });
          if (res.data.success) {
            setPtFailedCount(res.data.count);
          }
        } else if (userRole === 'pt-pretester') {
          const res = await axios.get(`/failed-transformers/count?stage=PT_PRETEST_TESTING`, { withCredentials: true });
          if (res.data.success) {
            setPtFailedCount(res.data.count);
          }
        } else {
          const res = await axios.get(`/failed-cores/count`, { withCredentials: true });
          if (res.data.success) {
            setFailedCount(res.data.count);
          }
        }
      } catch (e) {
        console.error("Failed to fetch count", e);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [userRole]);

  const getMenuItems = (): MenuItem[] => {
    if (userRole === 'pt-tester') {
      return [
        { id: 'home', label: 'Home Dashboard', icon: Home },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'testing', label: 'Final PT Testing', icon: ClipboardCheck },
        { id: 'reports', label: 'Customer Reports', icon: FileText },
        { id: 'view-orders', label: 'View Orders', icon: FileText },
      ];
    }

    if (userRole === 'pt-pretester') {
      return [
        { id: 'home', label: 'Home Dashboard', icon: Home },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'testing', label: 'PT Pretesting', icon: ClipboardCheck },
        { id: 'view-orders', label: 'View Orders', icon: FileText },
        { id: 'pt-failed', label: 'Failed Transformers', icon: AlertTriangle, badge: ptFailedCount > 0 ? ptFailedCount : undefined },
      ];
    }

    if (userRole === 'core-tester') {
      return [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'view-orders', label: 'View Orders', icon: FileText },
        { id: 'core-tracking', label: 'Core Tracking', icon: Zap },
        { id: 'ready-stock', label: 'Ready Stock', icon: Warehouse },
        { id: 'failed-cores', label: 'Failed Cores', icon: AlertTriangle, badge: failedCount > 0 ? failedCount : undefined },
      ];
    }


    // For secondary, after-primary, and final testers
    const baseItems: MenuItem[] = [
      { id: 'home', label: 'Home', icon: Home },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'testing', label: 'Testing', icon: ClipboardCheck },
      { id: 'view-orders', label: 'View Orders', icon: FileText },
    ];

    if (userRole === 'final-tester') {
      baseItems.push({ id: 'reports', label: 'Customer Reports', icon: FileText });
    }

    if (userRole === 'secondary-tester') {
      baseItems.push({ id: 'failed-transformers', label: 'Failed Transformers', icon: AlertTriangle, badge: failedTransformersCount > 0 ? failedTransformersCount : undefined });
    } else {
      baseItems.push({ id: 'failed-cores', label: 'Failed Cores', icon: AlertTriangle, badge: failedCount > 0 ? failedCount : undefined });
    }

    return baseItems;
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
              {item.badge !== undefined && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
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

import { LayoutDashboard, Users, List, FileText, AlertTriangle, Warehouse, Timer, ChevronDown, ChevronRight, PackageSearch, AlertCircle, BarChart2, Database, Settings, Trash2 } from 'lucide-react';
import logoImage from 'figma:asset/9d5dbd3020690d903579eb3ff66bac216cd36f83.png';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { useState, useEffect } from 'react';
import axios from '@/utils/axiosConfig';

interface AdminSidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

interface SubMenuItem {
  id: string;
  label: string;
  icon: any;
  badge?: number | string | undefined;
}

interface MenuNode {
  type: 'item' | 'group';
  id?: string;
  label: string;
  icon: any;
  items?: SubMenuItem[];
}

export function AdminSidebar({ activeView, setActiveView }: AdminSidebarProps) {
  const [failedCount, setFailedCount] = useState(0);
  const [failedTransformersCount, setFailedTransformersCount] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchCount = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const [resCores, resTransformers] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/failed-cores/count`, { 
            withCredentials: true,
            headers: { 'Authorization': token ? `Bearer ${token}` : '' }
          }),
          axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/failed-transformers/count`, { 
            withCredentials: true,
            headers: { 'Authorization': token ? `Bearer ${token}` : '' }
          })
        ]);

        if (resCores.data.success) {
          setFailedCount(resCores.data.count);
        }
        if (resTransformers.data.success) {
          setFailedTransformersCount(resTransformers.data.count);
        }
      } catch (e) {
        console.error("Failed to fetch counts in admin sidebar", e);
      }
    };

    fetchCount();
    // Poll every 60s
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const menuStructure: MenuNode[] = [
    { type: 'item', id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      type: 'group',
      label: 'Orders & Stock',
      icon: PackageSearch,
      items: [
        { id: 'view-orders', label: 'View Orders', icon: List },
        { id: 'ready-stock', label: 'Ready Stock', icon: Warehouse },
      ]
    },
    {
      type: 'group',
      label: 'Failures & Alerts',
      icon: AlertCircle,
      items: [
        { id: 'failed-cores', label: 'Failed Cores', icon: AlertTriangle, badge: failedCount > 0 ? failedCount : undefined },
        { id: 'failed-transformers', label: 'Failed Transformers', icon: AlertTriangle, badge: failedTransformersCount > 0 ? failedTransformersCount : undefined },
      ]
    },
    {
      type: 'group',
      label: 'Reports & Tracking',
      icon: BarChart2,
      items: [
        { id: 'reports', label: 'Internal Reports', icon: FileText },
        { id: 'customer-reports', label: 'Customer Reports', icon: FileText },
        { id: 'pt-delay-tracker', label: 'PT Delay Tracker', icon: Timer },
        { id: 'ct-delay-tracker', label: 'CT Delay Tracker', icon: Timer },
      ]
    },
    {
      type: 'group',
      label: 'Database & Admin',
      icon: Database,
      items: [
        { id: 'employees', label: 'Employees', icon: Users },
        { id: 'data-cleanup', label: 'Data Cleanup', icon: Trash2 },
        { id: 'system-configs', label: 'System Configurations', icon: Settings },
      ]
    },
  ];

  // Auto-expand group if a child is active
  useEffect(() => {
    menuStructure.forEach(menuNode => {
      if (menuNode.type === 'group' && menuNode.items?.some(item => item.id === activeView)) {
        // Enforce exclusive behavior even on auto-expansion
        setExpandedGroups({ [menuNode.label]: true });
      }
    });
  }, [activeView]);

  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups(prev => ({
      // By omitting ...prev, we close all other groups automatically
      [groupLabel]: !prev[groupLabel]
    }));
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm overflow-hidden h-full">
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <ImageWithFallback
          src={logoImage}
          alt="Advent Engineers"
          className="w-full h-auto"
        />
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {menuStructure.map((menuNode, index) => {
          if (menuNode.type === 'item') {
            const Icon = menuNode.icon as any;
            const isActive = activeView === menuNode.id;
            return (
              <button
                key={menuNode.id || index}
                onClick={() => setActiveView(menuNode.id as string)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors group ${isActive
                  ? 'bg-[#003a70] text-white'
                  : 'text-gray-700 hover:bg-slate-50'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`} />
                  <span className="text-sm font-medium text-left leading-snug">{menuNode.label}</span>
                </div>
              </button>
            );
          }

          if (menuNode.type === 'group') {
            const isExpanded = expandedGroups[menuNode.label];
            const GroupIcon = menuNode.icon as any;
            // Check if any child is active
            const isAnyChildActive = menuNode.items?.some(item => item.id === activeView);
            
            return (
              <div key={menuNode.label || index} className="space-y-1">
                <button
                  onClick={() => toggleGroup(menuNode.label)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors group ${
                    isAnyChildActive ? 'text-[#003a70] bg-slate-50' : 'text-gray-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <GroupIcon className={`w-5 h-5 ${isAnyChildActive ? 'text-[#003a70]' : 'text-gray-500 group-hover:text-gray-700'}`} />
                    <span className="text-sm font-medium text-left leading-snug">{menuNode.label}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {isExpanded && menuNode.items && (
                  <div className="relative space-y-1 mt-1">
                    {/* Vertical connecting line */}
                    <div className="absolute top-1 bottom-1 w-[2px] bg-gray-300 rounded-full" style={{ left: '26px' }}></div>
                    {menuNode.items.map((item) => {
                      const ItemIcon = item.icon as any;
                      const isActive = activeView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveView(item.id)}
                          className={`relative z-10 w-full flex items-center justify-between pr-4 py-3 rounded-lg transition-colors group ${isActive
                            ? 'bg-[#003a70] text-white shadow-sm'
                            : 'text-gray-700 hover:bg-slate-50'
                            }`}
                          style={{ paddingLeft: '48px' }}
                        >
                          <div className="flex items-center gap-3">
                            <ItemIcon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`} />
                            <span className="text-sm font-medium text-left leading-snug">{item.label}</span>
                          </div>
                          {item.badge !== undefined && (
                            <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          return null;
        })}
      </nav>
    </aside>
  );
}

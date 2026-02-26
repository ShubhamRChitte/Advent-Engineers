import { LayoutDashboard, Package, Users, Warehouse, Truck, ClipboardCheck, UserPlus, PlusCircle, BarChart3, FileText, Calendar } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  userRole: 'admin' | 'entry-level';
}

export function Sidebar({ activeView, setActiveView, userRole }: SidebarProps) {
  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'workers', label: 'Workers', icon: Users },
    { id: 'inventory', label: 'Inventory', icon: Warehouse },
    { id: 'dispatch', label: 'Dispatch History', icon: Truck },
    { id: 'testing', label: 'Testing Workflow', icon: ClipboardCheck },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  const entryLevelMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create-order', label: 'Create Order', icon: PlusCircle },
    { id: 'assign-work', label: 'Assign Work', icon: UserPlus },
    { id: 'inventory', label: 'Inventory', icon: Warehouse },
  ];

  const menuItems = userRole === 'admin' ? adminMenuItems : entryLevelMenuItems;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-red-600">Advent</h1>
            <p className="text-xs text-gray-500">Engineers</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-red-50 text-red-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

import { LayoutDashboard, PlusCircle, Users, List, FileText, Building2 } from 'lucide-react';
import logoImage from 'figma:asset/9d5dbd3020690d903579eb3ff66bac216cd36f83.png';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface EntrySidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

export function EntrySidebar({ activeView, setActiveView }: EntrySidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'add-order', label: 'Add Order', icon: PlusCircle },
    { id: 'orders-list', label: 'View Orders', icon: List },
    { id: 'vendors', label: 'Core Vendors', icon: Building2 },
    { id: 'reports', label: 'Reports', icon: FileText },
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
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

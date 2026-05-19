import { useState } from 'react';
import { User } from '../../App';
import { HeatingDashboard } from './HeatingDashboard';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import logoImage from 'figma:asset/9d5dbd3020690d903579eb3ff66bac216cd36f83.png';
import { Zap, LogOut, Flame, Bell } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { LogoutConfirmModal } from '../LogoutConfirmModal';

interface HeatingOperatorLayoutProps {
  user: User;
  onLogout: () => void;
}

const menuItems = [
  { id: 'ct-heating', label: 'CT Heating', icon: Zap },
  { id: 'pt-heating', label: 'PT Heating', icon: Flame },
];

export function HeatingOperatorLayout({ user, onLogout }: HeatingOperatorLayoutProps) {
  const [activeView, setActiveView] = useState<'ct-heating' | 'pt-heating'>('ct-heating');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <ImageWithFallback
            src={logoImage}
            alt="Advent Engineers"
            className="w-full h-auto"
          />
        </div>

        <div className="px-4 py-3 border-b border-gray-100 bg-orange-50">
          <p className="text-xs font-semibold text-orange-700 uppercase tracking-wider">Heating Operator</p>
          <p className="text-sm font-medium text-gray-800 mt-0.5 truncate">{user.name}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                id={`heating-nav-${item.id}`}
                onClick={() => setActiveView(item.id as 'ct-heating' | 'pt-heating')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-orange-600 text-white' : 'text-gray-700 hover:bg-orange-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#003a70]">
              {activeView === 'ct-heating' ? 'CT Heating Records' : 'PT Heating Records'}
            </h1>
            <p className="text-sm text-gray-600">Heating Operator Dashboard</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-[#dc2626] text-white text-xs">
                0
              </Badge>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm">{user.name}</p>
                <p className="text-xs text-gray-500">Heating Operator</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#003a70] to-[#005a9c] flex items-center justify-center text-white">
                {user.name.charAt(0)}
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={() => setShowLogoutModal(true)} className="border-gray-300 hover:bg-gray-50">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>

            <LogoutConfirmModal
              isOpen={showLogoutModal}
              onCancel={() => setShowLogoutModal(false)}
              onConfirm={() => { setShowLogoutModal(false); onLogout(); }}
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          <HeatingDashboard user={user} activeView={activeView} />
        </main>
      </div>
    </div>
  );
}

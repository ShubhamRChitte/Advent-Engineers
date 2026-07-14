import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { CTDelayDashboard } from './CTDelayDashboard';
import { PTDelayDashboard } from './PTDelayDashboard';
import { Timer } from 'lucide-react';

interface DelayTrackerPageProps {
  onBack: () => void;
}

export function DelayTrackerPage({ onBack }: DelayTrackerPageProps) {
  const [activeTab, setActiveTab] = useState<'CT' | 'PT'>('CT');

  return (
    <div className="space-y-4">
      {/* Professional Module Navigation Tabs */}
      <div className="border-b border-gray-200 w-full mb-6">
        <nav className="flex flex-row gap-6 sm:gap-12 -mb-px" aria-label="Delay Tracker Switcher">
          <button
            onClick={() => setActiveTab('CT')}
            className={`flex items-center gap-3 py-4 px-3 sm:px-6 text-base border-b-[3px] transition-all duration-200 outline-none ${
              activeTab === 'CT'
                ? 'border-[#003a70] text-[#003a70] font-bold'
                : 'border-transparent text-gray-500 hover:text-[#003a70] hover:border-gray-300/80 font-medium'
            }`}
          >
            <Timer className={`w-5 h-5 transition-colors duration-200 ${activeTab === 'CT' ? 'text-[#003a70]' : 'text-gray-400'}`} />
            <span>CT Delay Tracker</span>
          </button>
          
          <button
            onClick={() => setActiveTab('PT')}
            className={`flex items-center gap-3 py-4 px-3 sm:px-6 text-base border-b-[3px] transition-all duration-200 outline-none ${
              activeTab === 'PT'
                ? 'border-[#003a70] text-[#003a70] font-bold'
                : 'border-transparent text-gray-500 hover:text-[#003a70] hover:border-gray-300/80 font-medium'
            }`}
          >
            <Timer className={`w-5 h-5 transition-colors duration-200 ${activeTab === 'PT' ? 'text-[#003a70]' : 'text-gray-400'}`} />
            <span>PT Delay Tracker</span>
          </button>
        </nav>
      </div>

      <div className="min-h-[500px]">
        {activeTab === 'CT' ? (
          <CTDelayDashboard />
        ) : (
          <PTDelayDashboard />
        )}
      </div>
    </div>
  );
}

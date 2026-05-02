import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { CTReportsList } from '../tester/CTReportsList';
import { PTReportsList } from '../tester/PTReportsList';
import { FileText } from 'lucide-react';

interface CustomerReportsPageProps {
  onBack: () => void;
}

export function CustomerReportsPage({ onBack }: CustomerReportsPageProps) {
  const [activeTab, setActiveTab] = useState<'CT' | 'PT'>('CT');

  return (
    <div className="space-y-6">
      {/* Custom Tab Navigation */}
      <div className="inline-flex bg-gray-100/80 backdrop-blur-sm p-1.5 rounded-xl border border-gray-200/50 mb-6 shadow-sm">
        <button
          onClick={() => setActiveTab('CT')}
          className={`relative flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
            activeTab === 'CT' 
            ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5' 
            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50'
          }`}
        >
          <FileText className={`w-4 h-4 ${activeTab === 'CT' ? 'text-blue-600' : 'text-gray-400'}`} />
          CT Customer Reports
        </button>
        <button
          onClick={() => setActiveTab('PT')}
          className={`relative flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
            activeTab === 'PT' 
            ? 'bg-white text-purple-700 shadow-sm ring-1 ring-black/5' 
            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50'
          }`}
        >
          <FileText className={`w-4 h-4 ${activeTab === 'PT' ? 'text-purple-600' : 'text-gray-400'}`} />
          PT Customer Reports
        </button>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm min-h-[500px]">
        {activeTab === 'CT' ? (
          <CTReportsList onBack={onBack} />
        ) : (
          <PTReportsList onBack={onBack} />
        )}
      </div>
    </div>
  );
}

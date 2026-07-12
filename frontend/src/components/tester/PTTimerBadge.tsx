import { Clock, RefreshCw } from 'lucide-react';

interface PTTimerBadgeProps {
  timeLeftMs: number | null;
  isOverdue: boolean;
  expectedMinutes: number | null;
  title?: string;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(Math.abs(ms) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function PTTimerBadge({ timeLeftMs, isOverdue, expectedMinutes, title = "PT Testing" }: PTTimerBadgeProps) {
  // Don't render until timer has started
  if (timeLeftMs === null || expectedMinutes === null) return null;

  return (
    <div className={`mb-4 px-4 py-2 rounded-lg border-2 flex items-center justify-between transition-all no-print ${
      isOverdue ? 'bg-red-50 border-red-500 text-red-600 animate-pulse' : 
      'bg-green-50 border-green-500 text-green-600'
    }`}>
      <div className="flex items-center gap-2 font-bold">
        <RefreshCw className={`w-4 h-4 ${!isOverdue ? 'animate-spin-slow' : ''}`} />
        <span className="text-sm uppercase tracking-wider">
          {title} Time Limit
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium opacity-80">{isOverdue ? 'Overdue:' : 'Remaining:'}</span>
        <span className="text-2xl font-mono font-black tabular-nums">{formatTime(timeLeftMs)}</span>
      </div>
    </div>
  );
}

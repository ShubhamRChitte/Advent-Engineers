import { useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 0, 14)); // January 14, 2025

  const events = [
    { date: '2025-01-14', type: 'delivery', title: 'Dispatch to National Grid', priority: 'high' },
    { date: '2025-01-15', type: 'delivery', title: 'Delivery to PowerGrid Corp', priority: 'high' },
    { date: '2025-01-15', type: 'testing', title: 'Final QC - Order ORD-2025-001', priority: 'medium' },
    { date: '2025-01-16', type: 'delivery', title: 'Dispatch to Metro Power', priority: 'medium' },
    { date: '2025-01-18', type: 'testing', title: 'Electrical Testing - 3 orders', priority: 'low' },
    { date: '2025-01-20', type: 'delivery', title: 'Delivery to City Electric Ltd', priority: 'high' },
    { date: '2025-01-22', type: 'testing', title: 'Performance Test - Order ORD-2025-005', priority: 'medium' },
    { date: '2025-01-25', type: 'delivery', title: 'Dispatch to Industrial Solutions', priority: 'low' },
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      <div>
        <h2>Delivery & Testing Calendar</h2>
        <p className="text-gray-500 mt-1">Track upcoming deliveries and testing schedules</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <Card className="p-6 lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <h3>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={previousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm text-gray-500 p-2">
                {day}
              </div>
            ))}
            
            {Array.from({ length: startingDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="p-2" />
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dayEvents = getEventsForDay(day);
              const isToday = day === 14; // Current day in demo
              
              return (
                <div
                  key={day}
                  className={`min-h-24 p-2 border rounded-lg ${
                    isToday ? 'border-red-500 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  <div className={`text-sm mb-1 ${isToday ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event, eventIdx) => (
                      <div
                        key={eventIdx}
                        className={`text-xs p-1 rounded truncate ${
                          event.type === 'delivery' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Upcoming Events */}
        <Card className="p-6">
          <h3 className="mb-4">Upcoming Events</h3>
          <div className="space-y-3">
            {events.slice(0, 6).map((event, idx) => (
              <div key={idx} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between mb-1">
                  <Badge
                    className={event.type === 'delivery' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}
                  >
                    {event.type}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      event.priority === 'high'
                        ? 'border-red-500 text-red-600'
                        : event.priority === 'medium'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-gray-500 text-gray-600'
                    }
                  >
                    {event.priority}
                  </Badge>
                </div>
                <p className="text-sm font-medium mb-1">{event.title}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" />
                  {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Event Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">This Month</p>
              <h3 className="mt-2">{events.length}</h3>
              <p className="text-sm text-gray-500 mt-1">Total Events</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Deliveries</p>
              <h3 className="mt-2">{events.filter(e => e.type === 'delivery').length}</h3>
              <p className="text-sm text-gray-500 mt-1">Scheduled</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="w-6 h-6 text-blue-600">🚚</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Testing</p>
              <h3 className="mt-2">{events.filter(e => e.type === 'testing').length}</h3>
              <p className="text-sm text-gray-500 mt-1">Scheduled</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="w-6 h-6 text-green-600">🔬</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

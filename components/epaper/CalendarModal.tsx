'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CalendarModalProps {
  onClose: () => void;
}

interface Edition {
  id: string;
  date: string;
}

export default function CalendarModal({ onClose }: CalendarModalProps) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [editions, setEditions] = useState<Edition[]>([]);
  const [loading, setLoading] = useState(true);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    loadEditions();
  }, []);

  const loadEditions = async () => {
    try {
      const response = await fetch('/api/editions');
      const data = await response.json();
      
      if (data.success && data.data) {
        const loadedEditions = data.data
          .filter((e: any) => e.status?.toLowerCase() === 'published')
          .map((e: any) => ({
            id: e.id.toString(),
            date: e.date
          }));
        
        setEditions(loadedEditions);
      }
    } catch (error) {
      console.error('Failed to load editions:', error);
    }
    setLoading(false);
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const hasEdition = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return editions.some(e => e.date.startsWith(dateStr));
  };

  const getEditionForDate = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return editions.find(e => e.date.startsWith(dateStr));
  };

  const handleDateClick = (day: number) => {
    const edition = getEditionForDate(day);
    if (edition) {
      router.push(`/epaper/view/${edition.id}`);
      onClose();
    }
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Compact Calendar Dropdown */}
      <div 
        className="absolute right-0 top-full mt-1 bg-white rounded-md shadow-xl z-50 w-64 border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-red-600 text-white rounded-t-md">
          <h3 className="text-sm font-bold">Select Date</h3>
          <button
            onClick={onClose}
            className="p-0.5 hover:bg-red-700 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Calendar */}
        <div className="p-3">
          {/* Month/Year Navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={handlePrevMonth}
              className="p-0.5 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
            
            <h4 className="text-sm font-bold text-gray-900">
              {months[currentMonth]} {currentYear}
            </h4>
            
            <button
              onClick={handleNextMonth}
              className="p-0.5 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-700" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div key={day} className="text-center font-semibold text-gray-600 text-[10px] py-0.5">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {/* Empty cells for days before month starts */}
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="w-8 h-8" />
            ))}
            
            {/* Days of month */}
            {days.map((day) => {
              const hasEd = hasEdition(day);
              const isToday = 
                day === new Date().getDate() && 
                currentMonth === new Date().getMonth() && 
                currentYear === new Date().getFullYear();
              
              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  disabled={!hasEd}
                  className={`
                    w-8 h-8 flex items-center justify-center rounded text-[11px] font-medium transition-all
                    ${hasEd 
                      ? 'bg-red-600 text-white hover:bg-red-700 cursor-pointer' 
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    }
                    ${isToday && hasEd ? 'ring-1 ring-red-800' : ''}
                    ${isToday && !hasEd ? 'ring-1 ring-gray-300' : ''}
                  `}
                  title={hasEd ? `View edition for ${months[currentMonth]} ${day}, ${currentYear}` : 'No edition available'}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-2.5 flex items-center justify-center gap-3 text-[10px] border-t border-gray-200 pt-2">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 bg-red-600 rounded"></div>
              <span className="text-gray-600">Available</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 bg-gray-50 border border-gray-200 rounded"></div>
              <span className="text-gray-600">Not Available</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

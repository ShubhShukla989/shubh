'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCategory } from '@/contexts/CategoryContext';

interface EpaperCalendarWidgetProps {
  config: {
    title?: string;
    format?: 'full-calendar' | 'full-calendar-with-button' | 'button-calendar-with-category' | 'dropdown-calendar';
    considerCurrentCategory?: 'yes' | 'no';
    cssClasses?: string;
    style?: string;
  };
}

interface Edition {
  id: number;
  date?: string;
  publication_date: string;
  category_id: number;
}

export function EpaperCalendarWidget({ config }: EpaperCalendarWidgetProps) {
  const { categoryId } = useCategory();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editions, setEditions] = useState<Edition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(config.format !== 'full-calendar-with-button' && config.format !== 'button-calendar-with-category');
  const router = useRouter();

  useEffect(() => {
    fetchEditions();
  }, [categoryId]);

  const fetchEditions = async () => {
    try {
      let url = '/api/editions?status=published';
      
      // Use category from context if considerCurrentCategory is 'yes'
      if (config.considerCurrentCategory === 'yes' && categoryId) {
        url += `&category_id=${categoryId}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setEditions(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch editions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const dateStr = date.toISOString().split('T')[0];
    const edition = editions.find(e => {
      const editionDate = e.date || e.publication_date;
      return editionDate.startsWith(dateStr);
    });
    
    if (edition) {
      router.push(`/epaper/view/${edition.id}`);
    }
  };

  const getDatesWithEditions = () => {
    return editions.map(e => {
      // Use 'date' field instead of 'publication_date'
      const dateStr = e.date || e.publication_date;
      return new Date(dateStr).toDateString();
    });
  };

  const renderCalendar = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    const datesWithEditions = getDatesWithEditions();

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toDateString();
      const hasEdition = datesWithEditions.includes(dateStr);
      const isToday = dateStr === new Date().toDateString();

      days.push(
        <button
          key={day}
          onClick={() => hasEdition && handleDateSelect(date)}
          disabled={!hasEdition}
          className={`p-2 text-center rounded transition-colors ${
            hasEdition 
              ? 'bg-blue-100 hover:bg-blue-200 cursor-pointer text-blue-900 font-semibold' 
              : 'text-gray-400 cursor-not-allowed'
          } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const changeMonth = (delta: number) => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + delta, 1));
  };

  if (loading) {
    return <div className="text-center py-4">Loading calendar...</div>;
  }

  const format = config.format || 'full-calendar';

  return (
    <div className={config.cssClasses || ''} style={parseInlineStyle(config.style)}>
      {config.title && (
        <h2 className="text-xl font-bold mb-4">{config.title}</h2>
      )}

      {/* Button formats */}
      {(format === 'full-calendar-with-button' || format === 'button-calendar-with-category') && (
        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
        </button>
      )}

      {/* Dropdown format */}
      {format === 'dropdown-calendar' && (
        <select
          onChange={(e) => {
            const editionId = parseInt(e.target.value);
            if (editionId) {
              router.push(`/epaper/view/${editionId}`);
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Date</option>
          {editions.map((edition) => {
            const dateStr = edition.date || edition.publication_date;
            return (
              <option key={edition.id} value={edition.id}>
                {new Date(dateStr).toLocaleDateString()}
              </option>
            );
          })}
        </select>
      )}

      {/* Calendar view */}
      {showCalendar && format !== 'dropdown-calendar' && (
        <div className="bg-white rounded-lg shadow-md p-4 max-w-md">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
            >
              ←
            </button>
            <h3 className="text-lg font-semibold">
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
            >
              →
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-gray-600 p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>

          <div className="mt-4 text-xs text-gray-500 text-center">
            Click on highlighted dates to view editions
          </div>
        </div>
      )}
    </div>
  );
}

function parseInlineStyle(styleString?: string): React.CSSProperties {
  if (!styleString) return {};
  
  try {
    const styles: any = {};
    styleString.split(';').forEach(rule => {
      const [property, value] = rule.split(':').map(s => s.trim());
      if (property && value) {
        const camelProperty = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        styles[camelProperty] = value;
      }
    });
    return styles;
  } catch {
    return {};
  }
}

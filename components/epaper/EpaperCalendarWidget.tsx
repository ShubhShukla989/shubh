'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCategory } from '@/contexts/CategoryContext';


interface EpaperCalendarWidgetProps {
  config: {
    title?: string;
    format?: 'full-calendar' | 'full-calendar-with-button' | 'button-calendar-with-category' | 'dropdown-calendar';
    buttonLabel?: string;
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
      
      console.log('🔄 Fetching editions - categoryId:', categoryId, 'considerCurrentCategory:', config.considerCurrentCategory);
      
      // Smart default: if categoryId exists and considerCurrentCategory is not explicitly 'no', filter by category
      const shouldFilterByCategory = categoryId && config.considerCurrentCategory !== 'no';
      
      if (shouldFilterByCategory) {
        url += `&category_id=${categoryId}`;
        console.log('✅ Adding category filter to URL:', url);
      } else {
        console.log('❌ NOT filtering by category - considerCurrentCategory:', config.considerCurrentCategory, 'categoryId:', categoryId);
      }
      
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        console.log('📦 Fetched editions count:', data.data?.length);
        console.log('📦 First 3 editions:', data.data?.slice(0, 3).map((e: Edition) => ({ id: e.id, category_id: e.category_id })));
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
    
    // Format date to YYYY-MM-DD in local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    console.log('Selected date:', dateStr);
    
    // Find editions for this date
    const dateEditions = editions.filter(e => {
      const editionDate = (e.date || e.publication_date).split('T')[0];
      return editionDate === dateStr;
    });
    
    console.log('Found editions:', dateEditions.length, dateEditions);
    console.log('Current categoryId:', categoryId);
    console.log('Consider current category config:', config.considerCurrentCategory);
    console.log('Full config:', config);
    
    if (dateEditions.length === 0) {
      console.log('No editions found for date:', dateStr);
      return;
    }
    
    // Determine which edition to navigate to
    let edition = null;
    
    // Check if we should filter by category
    // Smart default: if categoryId exists and considerCurrentCategory is not explicitly 'no', filter by category
    const shouldFilterByCategory = categoryId && config.considerCurrentCategory !== 'no';
    
    console.log('🔍 Should filter by category?', shouldFilterByCategory, '(categoryId:', categoryId, 'config:', config.considerCurrentCategory, ')');
    
    if (shouldFilterByCategory) {
      // MUST find edition matching current category
      edition = dateEditions.find(e => {
        console.log('Checking edition:', e.id, 'category:', e.category_id, 'vs current:', categoryId);
        return e.category_id === categoryId;
      });
      
      if (!edition) {
        console.log('❌ No edition found for current category:', categoryId);
        console.log('Available editions:', dateEditions.map(e => ({ id: e.id, category_id: e.category_id })));
        alert(`No edition available for this date in the current category.`);
        // Don't navigate if category doesn't match
        return;
      }
      console.log('✅ Found matching edition:', edition.id, 'category:', edition.category_id);
    } else {
      // If not considering category, take first edition
      console.log('⚠️ Not filtering by category, taking first edition');
      edition = dateEditions[0];
    }
    
    if (edition) {
      console.log('Navigating to edition:', edition.id, 'category:', edition.category_id);
      router.push(`/epaper/view/${edition.id}`);
    }
  };

  const getDatesWithEditions = () => {
    // If considerCurrentCategory is enabled, only show dates for current category
    let filteredEditions = editions;
    
    // Smart default: if categoryId exists and considerCurrentCategory is not explicitly 'no', filter by category
    const shouldFilterByCategory = categoryId && config.considerCurrentCategory !== 'no';
    
    if (shouldFilterByCategory) {
      filteredEditions = editions.filter(e => e.category_id === categoryId);
    }
    
    return filteredEditions.map(e => {
      const dateStr = e.date || e.publication_date;
      // Parse date in local timezone to avoid timezone issues
      const [year, month, day] = dateStr.split('T')[0].split('-');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toDateString();
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
    const today = new Date().toDateString();

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toDateString();
      const hasEdition = datesWithEditions.includes(dateStr);
      const isToday = dateStr === today;

      days.push(
        <button
          key={day}
          onClick={() => hasEdition && handleDateSelect(date)}
          disabled={!hasEdition}
          className={`
            aspect-square flex items-center justify-center
            border border-gray-300 text-sm font-medium
            transition-all duration-200
            ${hasEdition 
              ? 'bg-white hover:bg-gray-50 cursor-pointer text-gray-800' 
              : 'bg-white text-gray-300 cursor-not-allowed'
            }
            ${isToday ? 'bg-yellow-200 hover:bg-yellow-300 font-bold' : ''}
          `}
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

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const format = config.format || 'full-calendar';

  return (
    <div className={`relative ${config.cssClasses || ''}`} style={parseInlineStyle(config.style)}>
      {config.title && (
        <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-center">{config.title}</h2>
      )}

      {/* Button formats */}
      {(format === 'full-calendar-with-button' || format === 'button-calendar-with-category') && (
        <div className="relative inline-block">
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm md:text-base"
            dangerouslySetInnerHTML={{ __html: config.buttonLabel || (showCalendar ? 'Hide Calendar' : 'Show Calendar') }}
          />
          
          {/* Calendar Dropdown */}
          {showCalendar && (
            <div className="absolute top-full right-0 mt-2 z-50">
              <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-2 w-72">
                {/* Month/Year Selection with Navigation */}
                <div className="flex items-center justify-center gap-1 mb-2">
                  {/* Previous Month Button */}
                  <button
                    onClick={() => changeMonth(-1)}
                    className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors flex-shrink-0"
                    title="Previous Month"
                  >
                    <svg className="w-3 h-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Month Dropdown */}
                  <div className="relative z-60">
                    <select
                      value={currentMonth}
                      onChange={(e) => setSelectedDate(new Date(currentYear, parseInt(e.target.value), 1))}
                      className="px-2 py-1 border border-gray-300 rounded text-xs font-medium focus:outline-none focus:border-gray-500 cursor-pointer bg-white appearance-none pr-6"
                      style={{ minWidth: '65px' }}
                    >
                      {months.map((month, index) => (
                        <option key={month} value={index}>
                          {month}
                        </option>
                      ))}
                    </select>
                    <svg className="w-3 h-3 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Year Dropdown */}
                  <div className="relative z-60">
                    <select
                      value={currentYear}
                      onChange={(e) => setSelectedDate(new Date(parseInt(e.target.value), currentMonth, 1))}
                      className="px-2 py-1 border border-gray-300 rounded text-xs font-medium focus:outline-none focus:border-gray-500 cursor-pointer bg-white appearance-none pr-6"
                      style={{ minWidth: '60px' }}
                    >
                      {Array.from({ length: 10 }, (_, i) => currentYear - 5 + i).map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    <svg className="w-3 h-3 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Next Month Button */}
                  <button
                    onClick={() => changeMonth(1)}
                    className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors flex-shrink-0"
                    title="Next Month"
                  >
                    <svg className="w-3 h-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-0.5 mb-1">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <div key={day} className="text-center text-xs font-bold text-gray-700 py-1">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days - Square grid */}
                <div className="grid grid-cols-7 gap-0.5">
                  {renderCalendar()}
                </div>
              </div>
            </div>
          )}
        </div>
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
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
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

      {/* Calendar view for non-button formats */}
      {showCalendar && format !== 'dropdown-calendar' && format !== 'full-calendar-with-button' && format !== 'button-calendar-with-category' && (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-full max-w-lg mx-auto">
          {/* Month/Year Selection with Navigation */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {/* Previous Month Button */}
            <button
              onClick={() => changeMonth(-1)}
              className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors flex-shrink-0"
              title="Previous Month"
            >
              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Month Dropdown */}
            <div className="relative z-60">
              <select
                value={currentMonth}
                onChange={(e) => setSelectedDate(new Date(currentYear, parseInt(e.target.value), 1))}
                className="px-3 py-1.5 border-2 border-gray-300 rounded text-base font-medium focus:outline-none focus:border-gray-500 cursor-pointer bg-white appearance-none pr-8"
                style={{ minWidth: '90px' }}
              >
                {months.map((month, index) => (
                  <option key={month} value={index}>
                    {month}
                  </option>
                ))}
              </select>
              <svg className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Year Dropdown */}
            <div className="relative z-60">
              <select
                value={currentYear}
                onChange={(e) => setSelectedDate(new Date(parseInt(e.target.value), currentMonth, 1))}
                className="px-3 py-1.5 border-2 border-gray-300 rounded text-base font-medium focus:outline-none focus:border-gray-500 cursor-pointer bg-white appearance-none pr-8"
                style={{ minWidth: '85px' }}
              >
                {Array.from({ length: 10 }, (_, i) => currentYear - 5 + i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <svg className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Next Month Button */}
            <button
              onClick={() => changeMonth(1)}
              className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors flex-shrink-0"
              title="Next Month"
            >
              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div key={day} className="text-center text-base font-bold text-gray-700 py-1.5">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days - Square grid */}
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
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

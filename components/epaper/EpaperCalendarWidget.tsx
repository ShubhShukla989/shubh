'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCategory } from '@/contexts/CategoryContext';
// Removed EpaperContext import - working independently now


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
  created_at: string;
  category_id: number;
}

export function EpaperCalendarWidget({ config }: EpaperCalendarWidgetProps) {
  const categoryContext = useCategory();
  const categoryId = categoryContext?.categoryId || null;
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  // Lightweight: only dates for calendar highlights
  const [editionDates, setEditionDates] = useState<Set<string>>(new Set());
  // Minimal edition list only for click navigation (id + date)
  const [editions, setEditions] = useState<Edition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(config.format !== 'full-calendar-with-button' && config.format !== 'button-calendar-with-category');
  const router = useRouter();

  const getCleanButtonText = () => {
    if (!config.buttonLabel) {
      return showCalendar ? 'Hide Archive' : 'Archive';
    }
    
    // If buttonLabel contains HTML, extract just the text part
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = config.buttonLabel;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    // If it's just "archive" or "calendar" or similar, use our default
    if (textContent.toLowerCase().trim() === 'archive' || textContent.toLowerCase().trim() === 'calendar') {
      return showCalendar ? 'Hide Archive' : 'Archive';
    }
    
    return textContent.trim() || (showCalendar ? 'Hide Archive' : 'Archive');
  };

  useEffect(() => {
    fetchEditions();
  }, [categoryId]);

  // Auto-navigate to most recent edition month when editions are loaded (use publication date)
  useEffect(() => {
    if (editionDates.size > 0 && !loading) {
      // Find the most recent date string from the set (already sorted DESC from API)
      const mostRecent = Array.from(editionDates)[0];
      if (mostRecent) {
        const [year, month, day] = mostRecent.split('-');
        setSelectedDate(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)));
      }
    }
  }, [editionDates, loading]);

  const fetchEditions = async () => {
    if (!categoryId) {
      setLoading(false);
      return;
    }
    try {
      const shouldFilterByCategory = categoryId && config.considerCurrentCategory !== 'no';

      // 1. Fetch lightweight dates for calendar highlights (new fast endpoint)
      if (shouldFilterByCategory) {
        const datesRes = await fetch(`/api/editions/dates?category_id=${categoryId}`);
        const datesData = await datesRes.json();
        if (datesData.success) {
          setEditionDates(new Set<string>(datesData.dates));
        }
      }

      // 2. Fetch minimal edition list for click navigation only
      let url = '/api/editions?status=published&limit=365';
      if (shouldFilterByCategory) {
        url += `&category_id=${categoryId}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        // Only keep id, date, category_id — discard everything else
        setEditions((data.data || []).map((e: any) => ({
          id: e.id,
          date: e.date,
          created_at: e.created_at,
          category_id: e.category_id,
        })));
      }
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
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
    
    // Find editions for this date (use publication date, not upload date)
    const dateEditions = editions.filter(e => {
      // Use 'date' field (publication date), fallback to created_at only if date is missing
      const editionDateStr = (e.date || e.created_at).split('T')[0];
      return editionDateStr === dateStr;
    });
    
    if (dateEditions.length === 0) {
      return;
    }
    
    // Determine which edition to navigate to
    let edition = null;
    
    // Smart default: if categoryId exists and considerCurrentCategory is not explicitly 'no', filter by category
    const shouldFilterByCategory = categoryId && config.considerCurrentCategory !== 'no';
    
    if (shouldFilterByCategory) {
      // Find edition matching current category
      edition = dateEditions.find(e => e.category_id === categoryId);
      
      if (!edition) {
        alert(`No edition available for this date in the current category.`);
        return;
      }
    } else {
      // Take first available edition (any category)
      edition = dateEditions[0];
    }
    
    if (edition) {
      router.push(`/epaper/view/${edition.id}`);
    }
  };

  const getDatesWithEditions = (): Set<string> => {
    // If we have the lightweight dates set (category mode), use it directly — O(1) lookups
    if (editionDates.size > 0) return editionDates;

    // Fallback: build from full editions list (no-category mode)
    const dates = new Set<string>();
    const shouldFilterByCategory = categoryId && config.considerCurrentCategory !== 'no';
    const filtered = shouldFilterByCategory
      ? editions.filter(e => e.category_id === categoryId)
      : editions;

    for (const e of filtered) {
      const dateStr = (e.date || e.created_at).split('T')[0];
      dates.add(dateStr);
    }
    return dates;
  };

  const renderCalendar = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    const datesWithEditions = getDatesWithEditions(); // now a Set<string>
    const today = new Date();
    const currentDate = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} style={{ height: '26px' }}></div>); // Further reduced from 30px
    }

    // Days of the month - Extra small size for CategoryArchive
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hasEdition = datesWithEditions.has(dateStr);
      const isToday = day === currentDate && month === currentMonth && year === currentYear;

      days.push(
        <button
          key={day}
          onClick={() => hasEdition && handleDateSelect(date)}
          disabled={!hasEdition}
          style={{
            height: '26px', // Further reduced from 30px
            border: '1px solid #e5e7eb',
            borderRadius: '4px', // Smaller border radius
            // Only today gets yellow
            backgroundColor: isToday ? '#fef08a' : (hasEdition ? '#f3f4f6' : '#ffffff'),
            color: isToday ? '#92400e' : (hasEdition ? '#374151' : '#9ca3af'),
            fontSize: '12px', // Further reduced from 14px
            fontWeight: isToday ? '600' : (hasEdition ? '600' : '400'),
            cursor: hasEdition ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: hasEdition ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
          }}
          title={
            isToday ? 'Today' :
            hasEdition ? 'View Edition' : 
            'No Edition Available'
          }
          onMouseEnter={(e) => {
            if (hasEdition && !isToday) {
              e.currentTarget.style.backgroundColor = '#e5e7eb';
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(107, 114, 128, 0.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (hasEdition && !isToday) {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            }
          }}
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
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-red-600" style={{borderRadius: '50%'}}></div>
      </div>
    );
  }

  const format = config.format || 'full-calendar';

  return (
    <div className={`relative ${config.cssClasses || ''}`} style={parseInlineStyle(config.style)}>
      {/* Removed Select Date title - only show calendar */}

      {/* Button formats */}
      {(format === 'full-calendar-with-button' || format === 'button-calendar-with-category') && (
        <div className="relative inline-block">
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors text-xs sm:text-sm md:text-base flex items-center justify-center gap-1 sm:gap-2"
          >
            {/* Calendar Icon */}
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            {/* Button Text - Show on all screens */}
            <span>{getCleanButtonText()}</span>
          </button>
          
          {/* Calendar Dropdown */}
          {showCalendar && (
            <div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-2 z-50" style={{
              right: '0px', // Always align to right on mobile
              left: 'auto'
            }}>
              <div className="bg-white shadow-2xl border border-gray-200 p-2" style={{ width: 'max-content', minWidth: '280px' }}>
                {/* Month/Year Selection with Navigation */}
                <div className="flex items-center justify-center gap-1 mb-2">
                  {/* Previous Month Button */}
                  <button
                    onClick={() => changeMonth(-1)}
                    className="w-6 h-6 bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors flex-shrink-0"
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
                      className="px-2 py-1 border border-gray-300 text-xs font-medium focus:outline-none focus:border-gray-500 cursor-pointer bg-white appearance-none pr-6"
                      style={{ 
                        minWidth: '65px',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#374151',
                        height: '28px',
                        lineHeight: '1.2'
                      }}
                    >
                      {months.map((month, index) => (
                        <option key={month} value={index} style={{ color: '#374151', fontSize: '13px' }}>
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
                      className="px-2 py-1 border border-gray-300 text-xs font-medium focus:outline-none focus:border-gray-500 cursor-pointer bg-white appearance-none pr-6"
                      style={{ 
                        minWidth: '60px',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#374151',
                        height: '28px',
                        lineHeight: '1.2'
                      }}
                    >
                      {Array.from({ length: 10 }, (_, i) => currentYear - 5 + i).map((year) => (
                        <option key={year} value={year} style={{ color: '#374151', fontSize: '13px' }}>
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
                    className="w-6 h-6 bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors flex-shrink-0"
                    title="Next Month"
                  >
                    <svg className="w-3 h-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days - Updated grid */}
                <div className="grid grid-cols-7 gap-1">
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
          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
        >
          <option value="">Select Date</option>
          {editions.map((edition) => {
            const dateStr = edition.date || edition.created_at;
            return (
              <option key={edition.id} value={edition.id}>
                {new Date(dateStr).toLocaleDateString()}
              </option>
            );
          })}
        </select>
      )}

      {/* Calendar view for non-button formats - Extra Small Size for CategoryArchive */}
      {showCalendar && format !== 'dropdown-calendar' && format !== 'full-calendar-with-button' && format !== 'button-calendar-with-category' && (
        <div style={{
          width: '240px', // Further reduced from 280px
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          margin: '0 auto',
          boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}>
          {/* Calendar Header - Extra Small */}
          <div style={{
            padding: '10px 12px', // Further reduced padding
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f8f9fa',
            borderRadius: '12px 12px 0 0',
            position: 'relative'
          }}>
            {/* Month/Year Controls - Extra Small */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px' // Further reduced gap
            }}>
              {/* Previous Month Button - Extra Small */}
              <button 
                onClick={() => changeMonth(-1)}
                style={{
                  width: '28px', // Increased slightly for better circle
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  color: '#6b7280',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  fontSize: '16px', // Increased for better visibility
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                  minWidth: '28px', // Ensure minimum width
                  minHeight: '28px' // Ensure minimum height
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title="Previous Month"
              >
                ‹
              </button>

              {/* Month/Year Dropdowns - Extra Small */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px' // Further reduced gap
              }}>
                <select
                  value={currentMonth}
                  onChange={(e) => setSelectedDate(new Date(currentYear, parseInt(e.target.value), 1))}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px', // Changed back to 4px for rectangular
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#374151',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '65px',
                    height: '30px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease',
                    lineHeight: '1.2'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {months.map((month, index) => (
                    <option key={month} value={index} style={{ color: '#374151', fontSize: '13px' }}>
                      {month.slice(0, 3)}
                    </option>
                  ))}
                </select>
                
                <select
                  value={currentYear}
                  onChange={(e) => setSelectedDate(new Date(parseInt(e.target.value), currentMonth, 1))}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px', // Changed back to 4px for rectangular
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#374151',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '70px',
                    height: '30px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease',
                    lineHeight: '1.2'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {Array.from({ length: 10 }, (_, i) => currentYear - 5 + i).map((year) => (
                    <option key={year} value={year} style={{ color: '#374151', fontSize: '13px' }}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Next Month Button - Extra Small */}
              <button 
                onClick={() => changeMonth(1)}
                style={{
                  width: '28px', // Increased slightly for better circle
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  color: '#6b7280',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  fontSize: '16px', // Increased for better visibility
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                  minWidth: '28px', // Ensure minimum width
                  minHeight: '28px' // Ensure minimum height
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title="Next Month"
              >
                ›
              </button>
            </div>
          </div>

          {/* Calendar Body - Extra Small */}
          <div style={{
            padding: '10px', // Further reduced from 12px
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Day Headers - Extra Small */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '2px', // Further reduced from 3px
              marginBottom: '6px' // Further reduced from 8px
            }}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <div key={day} style={{
                  textAlign: 'center',
                  fontSize: '10px', // Further reduced from 12px
                  fontWeight: '600',
                  color: '#6b7280',
                  padding: '2px', // Further reduced from 4px
                  height: '16px' // Further reduced from 20px
                }}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days - Extra Small */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '2px' // Further reduced from 3px
            }}>
              {renderCalendar()}
            </div>
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

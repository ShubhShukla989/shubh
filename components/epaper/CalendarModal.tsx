'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CalendarModalProps {
  onClose: () => void;
  categoryId?: number; // Add category ID prop
}

interface Edition {
  id: string;
  date: string;
  created_at?: string; // Add created_at as optional fallback
}

export default function CalendarModal({ onClose, categoryId }: CalendarModalProps) {
  const router = useRouter();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [editions, setEditions] = useState<Edition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    loadEditions();
  }, [categoryId]); // Reload when categoryId changes

  // Auto-navigate to most recent edition month when editions are loaded (use publication date)
  useEffect(() => {
    if (editions.length > 0 && !loading) {
      // Find the most recent edition by publication date
      const sortedEditions = [...editions].sort((a, b) => {
        // Use 'date' field (publication date), fallback to created_at only if date is missing
        const dateA = new Date(a.date || a.created_at || new Date());
        const dateB = new Date(b.date || b.created_at || new Date());
        return dateB.getTime() - dateA.getTime();
      });
      
      if (sortedEditions.length > 0) {
        // Use 'date' field (publication date), fallback to created_at only if date is missing
        const mostRecentDate = new Date(sortedEditions[0].date || sortedEditions[0].created_at || new Date());
        setCurrentMonth(mostRecentDate.getMonth());
        setCurrentYear(mostRecentDate.getFullYear());
      }
    }
  }, [editions, loading]);

  const loadEditions = async () => {
    try {
      // Build API URL with category filter if categoryId is provided
      let url = '/api/editions?status=published';
      if (categoryId) {
        url += `&category_id=${categoryId}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && data.data) {
        const loadedEditions = data.data
          .filter((e: any) => e.status?.toLowerCase() === 'published')
          .map((e: any) => ({
            id: e.id.toString(),
            date: e.date, // Use publication date, not upload date
            created_at: e.created_at // Keep for fallback if needed
          }));
        
        setEditions(loadedEditions);
      }
    } catch (error) {
      // Silent fail - editions will remain empty
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
    return editions.some(e => {
      // Use 'date' field (publication date), fallback to created_at only if date is missing
      // Handle both date formats: YYYY-MM-DD and YYYY-MM-DDTHH:MM:SS
      const editionDate = (e.date || e.created_at || '').split('T')[0]; // Get just the date part
      return editionDate === dateStr;
    });
  };

  const getEditionForDate = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return editions.find(e => {
      // Use 'date' field (publication date), fallback to created_at only if date is missing
      // Handle both date formats: YYYY-MM-DD and YYYY-MM-DDTHH:MM:SS
      const editionDate = (e.date || e.created_at || '').split('T')[0]; // Get just the date part
      return editionDate === dateStr;
    });
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
      {/* Backdrop - Click outside to close - BLOCK ALL CLICKS BELOW */}
      <div 
        className="fixed inset-0"
        style={{
          zIndex: isMobile ? 100000 : 40,
          pointerEvents: 'auto',
          backgroundColor: isMobile ? 'rgba(0, 0, 0, 0.5)' : 'transparent'
        }}
        onClick={onClose}
      />
      
      {/* Clean Simple Calendar - Like Reference */}
      <div 
        className="fixed md:absolute bg-white shadow-lg border border-gray-200 rounded-lg"
        style={{
          // Mobile positioning: right side bottom
          right: isMobile ? '8px' : '0px',
          bottom: isMobile ? '80px' : 'auto', // Position from bottom on mobile
          top: isMobile ? 'auto' : 'calc(100% + 4px)', // Position from top on desktop
          left: isMobile ? 'auto' : 'auto',
          width: isMobile ? '300px' : '320px',
          height: isMobile ? 'auto' : 'auto',
          maxHeight: isMobile ? 'calc(100vh - 100px)' : 'auto', 
          maxWidth: isMobile ? 'calc(100vw - 16px)' : 'auto',
          overflow: 'visible',
          boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          zIndex: isMobile ? 100001 : 50,
          pointerEvents: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Calendar Content */}
        <div className="p-3 flex flex-col" style={{ 
          padding: isMobile ? '12px' : '16px',
          height: isMobile ? 'auto' : 'auto',
          minHeight: isMobile ? '280px' : 'auto' // Reduced from 320px to 280px
        }}>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-gray-500">Loading editions...</div>
            </div>
          ) : (
            <>
              {/* Month/Year Navigation - Clean Style */}
          <div className="flex items-center justify-between mb-3" style={{ marginBottom: isMobile ? '8px' : '16px' }}>
            <button
              onClick={handlePrevMonth}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
              style={{
                width: isMobile ? '32px' : '32px',
                height: isMobile ? '32px' : '32px',
                borderRadius: '50%',
                minWidth: isMobile ? '32px' : '32px',
                minHeight: isMobile ? '32px' : '32px'
              }}
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="flex items-center gap-2" style={{ gap: isMobile ? '6px' : '8px' }}>
              <select 
                value={currentMonth}
                onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white focus:outline-none focus:border-blue-500"
                style={{ 
                  padding: isMobile ? '4px 8px' : '4px 12px',
                  fontSize: isMobile ? '14px' : '14px',
                  fontWeight: '500',
                  color: '#374151',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  minWidth: isMobile ? '80px' : '90px',
                  height: isMobile ? '32px' : '32px',
                  lineHeight: '1.2'
                }}
              >
                {months.map((month, index) => (
                  <option key={month} value={index} style={{ color: '#374151', fontSize: '14px' }}>
                    {isMobile ? month.slice(0, 3) : month}
                  </option>
                ))}
              </select>
              
              <select 
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white focus:outline-none focus:border-blue-500"
                style={{ 
                  padding: isMobile ? '4px 8px' : '4px 12px',
                  fontSize: isMobile ? '14px' : '14px',
                  fontWeight: '500',
                  color: '#374151',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  minWidth: isMobile ? '65px' : '70px',
                  height: isMobile ? '32px' : '32px',
                  lineHeight: '1.2'
                }}
              >
                {Array.from({ length: 10 }, (_, i) => currentYear - 5 + i).map(year => (
                  <option key={year} value={year} style={{ color: '#374151', fontSize: '14px' }}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={handleNextMonth}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
              style={{
                width: isMobile ? '32px' : '32px',
                height: isMobile ? '32px' : '32px',
                borderRadius: '50%',
                minWidth: isMobile ? '32px' : '32px',
                minHeight: isMobile ? '32px' : '32px'
              }}
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2" style={{ 
            gap: isMobile ? '2px' : '4px',
            marginBottom: isMobile ? '6px' : '8px'
          }}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div key={day} className="text-center font-medium text-gray-600 text-sm py-1" style={{
                fontSize: isMobile ? '11px' : '12px',
                padding: isMobile ? '2px 0' : '4px 0',
                height: isMobile ? '16px' : 'auto'
              }}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid - Clean Style */}
          <div 
            className="grid grid-cols-7 gap-1 flex-1" 
            style={{ 
              gap: isMobile ? '2px' : '4px',
              minHeight: isMobile ? '180px' : '186px', // Reduced from 210px/216px
              display: 'grid',
              gridTemplateRows: 'repeat(6, 1fr)',
              height: isMobile ? '180px' : '186px' // Reduced from 210px/216px
            }}
          >
            {/* Empty cells for days before month starts */}
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="w-9 h-9" style={{
                width: isMobile ? '32px' : '36px',
                height: isMobile ? '32px' : '36px'
              }} />
            ))}
            
            {/* Days of month */}
            {days.map((day) => {
              const hasEd = hasEdition(day);
              const today = new Date();
              const isToday = 
                day === today.getDate() && 
                currentMonth === today.getMonth() && 
                currentYear === today.getFullYear();
              
              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  disabled={!hasEd}
                  className={`
                    flex items-center justify-center text-sm font-medium transition-all border relative rounded
                    ${isToday && hasEd 
                      ? 'text-white bg-red-600 hover:bg-red-700 cursor-pointer border-red-600 font-bold' 
                      : hasEd 
                        ? 'text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer border-gray-300' 
                        : 'text-gray-400 cursor-not-allowed border-transparent bg-gray-50'
                    }
                    ${isToday && !hasEd ? 'bg-yellow-400 text-gray-900 border-yellow-400 hover:bg-yellow-500 font-bold' : ''}
                  `}
                  style={{
                    width: isMobile ? '32px' : '36px',
                    height: isMobile ? '32px' : '36px',
                    fontSize: isMobile ? '13px' : '12px', // Slightly larger font for mobile
                    minWidth: isMobile ? '32px' : '36px',
                    minHeight: isMobile ? '32px' : '36px'
                  }}
                  title={hasEd ? `View edition for ${months[currentMonth]} ${day}, ${currentYear}` : (isToday ? 'Today' : 'No edition available')}
                >
                  {day}
                </button>
              );
            })}
          </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

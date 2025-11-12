'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Search, Calendar, Filter, ChevronLeft } from 'lucide-react';

interface Edition {
  id: string;
  date: string;
  title: string;
  totalPages: number;
  thumbnail: string;
  month: string;
  year: string;
}

export default function EpaperArchive() {
  const router = useRouter();
  const [editions, setEditions] = useState<Edition[]>([]);
  const [filteredEditions, setFilteredEditions] = useState<Edition[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [loading, setLoading] = useState(true);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = ['2025', '2024', '2023', '2022'];

  useEffect(() => {
    loadEditions();
  }, []);

  useEffect(() => {
    filterEditions();
  }, [searchQuery, selectedMonth, selectedYear, editions]);

  const loadEditions = async () => {
    try {
      // Fetch editions from your database
      const response = await fetch('/api/editions');
      const data = await response.json();
      
      if (data.success && data.data) {
        // Map database editions to archive format
        const loadedEditions: Edition[] = data.data
          .filter((e: any) => e.status?.toLowerCase() === 'published') // Only show published editions
          .map((e: any) => {
            const date = new Date(e.date);
            return {
              id: e.id.toString(),
              date: date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              }),
              title: e.title,
              totalPages: 12, // You can add this to your database if needed
              thumbnail: `/media/epaper/${e.id}/page-1.jpg`,
              month: date.toLocaleDateString('en-US', { month: 'long' }),
              year: date.getFullYear().toString()
            };
          });
        
        setEditions(loadedEditions);
        setFilteredEditions(loadedEditions);
      }
    } catch (error) {
      console.error('Failed to load editions:', error);
    }
    
    setLoading(false);
  };

  const filterEditions = () => {
    let filtered = [...editions];

    if (searchQuery) {
      filtered = filtered.filter(edition =>
        edition.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
        edition.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedMonth) {
      filtered = filtered.filter(edition => edition.month === selectedMonth);
    }

    if (selectedYear) {
      filtered = filtered.filter(edition => edition.year === selectedYear);
    }

    setFilteredEditions(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedMonth('');
    setSelectedYear('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="bg-red-600 text-white py-3">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <Link href="/epaper" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="bg-white text-red-600 px-3 py-1 font-bold text-xl rounded">
                DBD
              </div>
              <span className="font-bold text-lg">दो बजे दोपहर</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Page Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/epaper" className="hover:opacity-80">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-4xl font-bold">E-Paper Archive</h1>
          </div>
          <p className="text-red-100 text-lg">
            Browse past editions and find what you're looking for
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b shadow-sm sticky top-[60px] z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by date..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">All Months</option>
                {months.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">All Years</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {(searchQuery || selectedMonth || selectedYear) && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchQuery && (
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                  Search: {searchQuery}
                </span>
              )}
              {selectedMonth && (
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                  {selectedMonth}
                </span>
              )}
              {selectedYear && (
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                  {selectedYear}
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-gray-600">
            Showing <span className="font-bold">{filteredEditions.length}</span> edition{filteredEditions.length !== 1 ? 's' : ''}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
                <div className="bg-gray-200 h-64 rounded mb-4"></div>
                <div className="bg-gray-200 h-4 rounded mb-2"></div>
                <div className="bg-gray-200 h-4 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredEditions.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No editions found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or search query</p>
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredEditions.map((edition) => (
              <div
                key={edition.id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden group cursor-pointer transform hover:-translate-y-1"
                onClick={() => router.push(`/epaper/view/${edition.id}`)}
              >
                <div className="relative h-64 bg-gray-100 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <BookOpen className="w-16 h-16" />
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-full bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700">
                      Read Now
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <Calendar className="w-4 h-4" />
                    {edition.date}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
                    {edition.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {edition.totalPages} Pages
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>&copy; 2025 Do Boje Dopahar. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Calendar, ChevronLeft, Star } from 'lucide-react';
import Link from 'next/link';

interface Edition {
  id: string;
  date: string;
  title: string;
  totalPages: number;
  thumbnail: string;
  is_featured: boolean;
}

export default function EpaperDisplay() {
  const router = useRouter();
  const [editions, setEditions] = useState<Edition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedEditions();
  }, []);

  const loadFeaturedEditions = async () => {
    try {
      const response = await fetch('/api/editions');
      const data = await response.json();
      
      if (data.success && data.data) {
        // Filter for featured editions only
        let featuredEditions = data.data
          .filter((e: any) => e.status?.toLowerCase() === 'published' && e.is_featured === true);

        // If no featured editions, show latest edition
        if (featuredEditions.length === 0) {
          featuredEditions = data.data
            .filter((e: any) => e.status?.toLowerCase() === 'published')
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 1);
        }

        const loadedEditions: Edition[] = featuredEditions.map((e: any) => {
          const date = new Date(e.date);
          return {
            id: e.id.toString(),
            date: date.toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            }),
            title: e.title,
            totalPages: 12,
            thumbnail: `/media/epaper/${e.id}/page-1.jpg`,
            is_featured: e.is_featured || false
          };
        });
        
        setEditions(loadedEditions);
      }
    } catch (error) {
      console.error('Failed to load featured editions:', error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/" className="hover:opacity-80">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
              <h1 className="text-4xl font-bold">Featured E-Paper</h1>
            </div>
          </div>
          <p className="text-blue-100 text-lg">
            Today's featured editions - handpicked for you
          </p>
        </div>
      </div>

      {/* Featured Editions */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
                <div className="bg-gray-200 h-96 rounded mb-4"></div>
                <div className="bg-gray-200 h-6 rounded mb-2"></div>
                <div className="bg-gray-200 h-4 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : editions.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No editions available</h3>
            <p className="text-gray-600">Check back later for new editions</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {editions.map((edition) => (
              <div
                key={edition.id}
                className="bg-white rounded-lg shadow-lg hover:shadow-2xl transition-all overflow-hidden group cursor-pointer transform hover:-translate-y-2"
                onClick={() => router.push(`/epaper/view/${edition.id}`)}
              >
                {edition.is_featured && (
                  <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-4 py-2 flex items-center gap-2">
                    <Star className="w-4 h-4 fill-white" />
                    <span className="font-bold text-sm">FEATURED</span>
                  </div>
                )}
                <div className="relative h-96 bg-gray-100 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <BookOpen className="w-20 h-20" />
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-700 shadow-lg">
                      Read Now
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <Calendar className="w-4 h-4" />
                    {edition.date}
                  </div>
                  <h3 className="font-bold text-xl text-gray-900 mb-3 line-clamp-2">
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
    </div>
  );
}

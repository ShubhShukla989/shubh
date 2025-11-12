'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Search, Calendar, ChevronRight } from 'lucide-react';

interface Edition {
  id: number;
  title: string;
  date: string;
  status: string;
  is_featured?: boolean;
}

import DynamicLayout from '@/components/DynamicLayout';

export default function EpaperHome() {
  const router = useRouter();
  const [latestEdition, setLatestEdition] = useState<Edition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLatestEdition();
  }, []);

  const loadLatestEdition = async () => {
    try {
      // Fetch latest published edition from your database
      const response = await fetch('/api/editions');
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        // First, try to find a featured edition that is also published
        let featured = data.data.find((e: Edition) => 
          e.is_featured && e.status?.toLowerCase() === 'published'
        );
        
        // If no featured edition, fall back to latest published edition
        if (!featured) {
          featured = data.data.find((e: Edition) => e.status?.toLowerCase() === 'published');
        }
        
        if (featured) {
          setLatestEdition(featured);
          setLoading(false);
          
          // Auto-redirect to viewer
          setTimeout(() => {
            router.push(`/epaper/view/${featured.id}`);
          }, 500);
          return;
        }
      }
      
      // No published editions found
      setLoading(false);
    } catch (error) {
      console.error('Failed to load edition:', error);
      setLoading(false);
    }
  };

  if (!loading && !latestEdition) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <BookOpen className="w-20 h-20 text-gray-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">No Published Editions</h1>
          <p className="text-gray-600 mb-6">
            There are no published e-paper editions available yet.
          </p>
          <Link
            href="/admin/editions"
            className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Go to Admin Panel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <BookOpen className="w-20 h-20 text-red-600 mx-auto mb-4 animate-pulse" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Do Boje Dopahar</h1>
          <p className="text-xl text-gray-600">Loading today's edition...</p>
        </div>
        
        {latestEdition && (
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-2">{latestEdition.title}</h2>
            <p className="text-gray-700 mb-4">
              <Calendar className="w-5 h-5 inline mr-2" />
              {new Date(latestEdition.date).toLocaleDateString('en-IN', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
              })}
            </p>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  );
}

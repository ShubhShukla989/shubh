'use client';

import { useEffect, useState } from 'react';
import { toast } from '@/lib/utils/toast';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number;
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = toast.subscribe((newToasts) => {
      setToasts(newToasts.map(t => ({
        ...t,
        type: t.type || 'info'
      })));
    });
    return unsubscribe;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toastItem) => (
        <div
          key={toastItem.id}
          className={`
            px-4 py-3 rounded-lg shadow-lg max-w-sm animate-in slide-in-from-right duration-300
            ${toastItem.type === 'success' ? 'bg-green-500 text-white' : ''}
            ${toastItem.type === 'error' ? 'bg-red-500 text-white' : ''}
            ${toastItem.type === 'warning' ? 'bg-yellow-500 text-white' : ''}
            ${toastItem.type === 'info' ? 'bg-blue-500 text-white' : ''}
          `}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{toastItem.message}</span>
            <button
              onClick={() => toast.remove(toastItem.id)}
              className="ml-3 text-white hover:text-gray-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
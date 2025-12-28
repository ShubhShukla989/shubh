'use client';

import { X } from 'lucide-react';

interface ProgressModalProps {
  isOpen: boolean;
  title: string;
  fileName?: string;
  fileSize?: string;
  progress: number;
  status: string;
  onCancel?: () => void;
  showCancel?: boolean;
}

export default function ProgressModal({
  isOpen,
  title,
  fileName,
  fileSize,
  progress,
  status,
  onCancel,
  showCancel = true
}: ProgressModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold">{title}</h3>
          {showCancel && onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress Content */}
        <div className="p-6">
          {/* File Info */}
          {fileName && (
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-1">
                {fileName}
              </div>
              {fileSize && (
                <div className="text-xs text-gray-500">
                  {fileSize}
                </div>
              )}
            </div>
          )}

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-bold text-blue-600">{Math.round(progress)}%</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Status */}
          <div className="text-sm text-gray-600 text-center">
            {status}
          </div>
        </div>

        {/* Footer */}
        {showCancel && onCancel && (
          <div className="flex justify-end p-4 border-t">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
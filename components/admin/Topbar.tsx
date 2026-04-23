'use client';

import { LogOut, Menu, Key, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface TopbarProps {
  onMenuClick?: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout, loading: authLoading } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePasswordForm, setChangePasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDropdown(false);
        if (showChangePasswordModal) {
          closeModal();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showChangePasswordModal]);

  const handleLogout = async () => {
    setShowDropdown(false);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleChangePassword = () => {
    setShowDropdown(false);
    setShowChangePasswordModal(true);
    setError('');
    setSuccess('');
    // Reset form when opening modal
    setChangePasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const closeModal = () => {
    setShowChangePasswordModal(false);
    setError('');
    setSuccess('');
    setChangePasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const validateForm = (): string | null => {
    if (!changePasswordForm.currentPassword) {
      return 'Current password is required';
    }
    if (!changePasswordForm.newPassword) {
      return 'New password is required';
    }
    if (changePasswordForm.newPassword.length < 8) {
      return 'New password must be at least 8 characters';
    }
    if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
      return 'New passwords do not match';
    }
    if (changePasswordForm.currentPassword === changePasswordForm.newPassword) {
      return 'New password must be different from current password';
    }
    return null;
  };

  const submitPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: changePasswordForm.currentPassword,
          newPassword: changePasswordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Password changed successfully!');
        // Close modal after 2 seconds
        setTimeout(() => {
          closeModal();
        }, 2000);
      } else {
        setError(data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Change password error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors shadow-sm border border-gray-200"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse"></div>
          <div className="hidden sm:block">
            <div className="w-20 h-4 bg-gray-300 rounded animate-pulse mb-1"></div>
            <div className="w-16 h-3 bg-gray-300 rounded animate-pulse"></div>
          </div>
        </div>
      </header>
    );
  }

  const userInitial = user?.fullname?.charAt(0)?.toUpperCase() || 'A';
  const displayName = user?.fullname || 'Administrator';

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors shadow-sm border border-gray-200"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2 lg:gap-4">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-2 lg:px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              aria-expanded={showDropdown}
              aria-haspopup="true"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                {userInitial}
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-medium text-sm">Welcome!</div>
                <div className="text-xs text-gray-500">{displayName}</div>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  onClick={handleChangePassword}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                >
                  <Key className="w-4 h-4" />
                  Change Password
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-xl transition-colors"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={submitPasswordChange} className="p-4 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  {success}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={changePasswordForm.currentPassword}
                  onChange={(e) => setChangePasswordForm({
                    ...changePasswordForm,
                    currentPassword: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={changePasswordForm.newPassword}
                  onChange={(e) => setChangePasswordForm({
                    ...changePasswordForm,
                    newPassword: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  minLength={8}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
                <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={changePasswordForm.confirmPassword}
                  onChange={(e) => setChangePasswordForm({
                    ...changePasswordForm,
                    confirmPassword: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  minLength={8}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

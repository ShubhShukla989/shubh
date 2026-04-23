'use client';

import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { menuService, MenuLocation, MenuItemResponse } from '@/lib/services/menuService';

interface AddToMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageTitle: string;
  pageAlias: string;
  onSuccess: (menuName: string) => void;
}

export default function AddToMenuModal({
  isOpen,
  onClose,
  pageTitle,
  pageAlias,
  onSuccess,
}: AddToMenuModalProps) {
  const [menuLocations, setMenuLocations] = useState<MenuLocation[]>([]);
  const [selectedMenu, setSelectedMenu] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItemResponse[]>([]);
  const [position, setPosition] = useState<'start' | 'end' | string>('end');
  const [customLabel, setCustomLabel] = useState(pageTitle);
  const [visibility, setVisibility] = useState<'public' | 'logged-in' | 'role-based'>('public');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadMenuLocations();
      setCustomLabel(pageTitle);
    }
  }, [isOpen, pageTitle]);

  useEffect(() => {
    if (selectedMenu) {
      loadMenuItems(selectedMenu);
    }
  }, [selectedMenu]);

  const loadMenuLocations = async () => {
    try {
      const locations = await menuService.getMenuLocations();
      setMenuLocations(locations);
      if (locations.length > 0) {
        setSelectedMenu(locations[0].id);
      }
    } catch (err) {
      // Silent fail - menu locations not critical
    }
  };

  const loadMenuItems = async (menuId: string) => {
    try {
      const menu = await menuService.getMenu(menuId);
      setMenuItems(menu.items);
    } catch (err) {
      // Silent fail - menu items not critical
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await menuService.addMenuItem(selectedMenu, {
        title: customLabel,
        url: `/page/${pageAlias}`,
        alias: pageAlias,
        position,
        visible: visibility,
        target: '_self',
      });

      const selectedLocation = menuLocations.find((loc) => loc.id === selectedMenu);
      onSuccess(selectedLocation?.label || 'menu');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to menu');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Add to Navigation</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Menu Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Menu <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedMenu}
              onChange={(e) => setSelectedMenu(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              {menuLocations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Menu Label <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter menu label"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Default: {pageTitle}
            </p>
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position <span className="text-red-500">*</span>
            </label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="start">At the beginning</option>
              <option value="end">At the end</option>
              {menuItems.map((item) => (
                <option key={item.id} value={`after-${item.id}`}>
                  After "{item.title}"
                </option>
              ))}
            </select>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Visibility <span className="text-red-500">*</span>
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="public">Public (Everyone)</option>
              <option value="logged-in">Logged-in Users Only</option>
              <option value="role-based">Role-based (Advanced)</option>
            </select>
          </div>

          {/* Preview */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-600 mb-1">Preview:</p>
            <p className="text-sm text-gray-900">
              <span className="font-medium">{customLabel}</span>
              <span className="text-gray-500"> → </span>
              <span className="text-purple-600">/page/{pageAlias}</span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add to Menu
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

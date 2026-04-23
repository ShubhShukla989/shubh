'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface CategoryWatermarkSettingsModalProps {
  categoryId: number;
  categoryName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CategoryWatermarkSettingsModal({
  categoryId,
  categoryName,
  isOpen,
  onClose,
}: CategoryWatermarkSettingsModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    override_global_settings: false,
    enable_watermarking: false,
    logo_url: '',
    opacity: 100,
    mode: 'in_outerside',
    position: 'top_center',
    min_width_px: 0,
    background_color: '#ffffff',
    foreground_color: '#000000',
    enable_border: false,
    border_width: 2,
    border_color: '#000000',
    info_text: '',
    info_text_font: 'English',
    enable_center_watermark: false,
    center_watermark_url: '',
    center_watermark_opacity: 100,
  });

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen, categoryId]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/categories/${categoryId}/watermark-settings`);
      const result = await response.json();
      if (result.success) {
        setSettings(result.data);
      }
    } catch (error) {
      // Failed to fetch settings, use defaults
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/categories/${categoryId}/watermark-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const result = await response.json();
      if (result.success) {
        alert('Settings saved successfully!');
        onClose();
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            Override Area Map Watermark/Clip Logo Settings for {categoryName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">Loading settings...</div>
          ) : (
            <div className="space-y-6">
              {/* Override Global Settings */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="override_global"
                  checked={settings.override_global_settings}
                  onChange={(e) =>
                    setSettings({ ...settings, override_global_settings: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="override_global" className="font-medium">
                  Override Global Watermark/Clip Logo Settings
                </label>
              </div>

              {/* Enable Watermarking */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enable_watermarking"
                  checked={settings.enable_watermarking}
                  onChange={(e) =>
                    setSettings({ ...settings, enable_watermarking: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="enable_watermarking" className="font-medium">
                  Enable Watermarking in Area Maps
                </label>
              </div>

              {/* Logo */}
              <div>
                <label className="block text-sm font-medium mb-2">Logo</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.logo_url}
                    onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded-lg"
                    placeholder="https://example.com/logo.png"
                  />
                  <button className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                    Upload Watermark...
                  </button>
                </div>
              </div>

              {/* Row 1: Opacity, Mode, Position, Min Width */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Opacity</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.opacity}
                    onChange={(e) =>
                      setSettings({ ...settings, opacity: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Mode</label>
                  <select
                    value={settings.mode}
                    onChange={(e) => setSettings({ ...settings, mode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="in_outerside">In Outerside</option>
                    <option value="watermark">Watermark</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Position</label>
                  <select
                    value={settings.position}
                    onChange={(e) => setSettings({ ...settings, position: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="top_center">Top Center</option>
                    <option value="top_left">Top Left</option>
                    <option value="top_right">Top Right</option>
                    <option value="bottom_center">Bottom Center</option>
                    <option value="bottom_left">Bottom Left</option>
                    <option value="bottom_right">Bottom Right</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Minimum Width of Map/Clip image (px)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settings.min_width_px}
                    onChange={(e) =>
                      setSettings({ ...settings, min_width_px: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Row 2: Colors and Border */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Background Color</label>
                  <input
                    type="color"
                    value={settings.background_color}
                    onChange={(e) =>
                      setSettings({ ...settings, background_color: e.target.value })
                    }
                    className="w-full h-10 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Foreground Color (Text)</label>
                  <input
                    type="color"
                    value={settings.foreground_color}
                    onChange={(e) =>
                      setSettings({ ...settings, foreground_color: e.target.value })
                    }
                    className="w-full h-10 border rounded-lg"
                  />
                </div>
              </div>

              {/* Border Settings */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enable_border"
                    checked={settings.enable_border}
                    onChange={(e) =>
                      setSettings({ ...settings, enable_border: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <label htmlFor="enable_border" className="font-medium">
                    Enable Border
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Border Width</label>
                  <select
                    value={settings.border_width}
                    onChange={(e) =>
                      setSettings({ ...settings, border_width: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="1">1 - Thin</option>
                    <option value="2">2 - Default</option>
                    <option value="3">3 - Medium</option>
                    <option value="4">4 - Thick</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Border Color</label>
                  <input
                    type="color"
                    value={settings.border_color}
                    onChange={(e) => setSettings({ ...settings, border_color: e.target.value })}
                    className="w-full h-10 border rounded-lg"
                  />
                </div>
              </div>

              {/* Info Text (Only for In Outerside mode) */}
              {settings.mode === 'in_outerside' && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 mb-3">
                    This will appear only if you select 'mode' =&gt; In Outerside
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Info Text</label>
                      <textarea
                        value={settings.info_text}
                        onChange={(e) => setSettings({ ...settings, info_text: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={3}
                        placeholder="Garvi Gujarat English Ahemdabad Edition{newline}{date}"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Templates: {'{edition_title}'} {'{page_title}'} {'{date}'} {'{url}'} {'{page_number}'} {'{total_pages}'}{' '}
                        {'{newline}'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Info Text Font</label>
                      <select
                        value={settings.info_text_font}
                        onChange={(e) =>
                          setSettings({ ...settings, info_text_font: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="English">English</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Gujarati">Gujarati</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Extra Watermark on Center */}
              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="enable_center_watermark"
                    checked={settings.enable_center_watermark}
                    onChange={(e) =>
                      setSettings({ ...settings, enable_center_watermark: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <label htmlFor="enable_center_watermark" className="font-medium">
                    Enable Extra Watermark on Center of Clip/Areamap
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Watermark Logo</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={settings.center_watermark_url}
                        onChange={(e) =>
                          setSettings({ ...settings, center_watermark_url: e.target.value })
                        }
                        className="flex-1 px-3 py-2 border rounded-lg"
                      />
                      <button className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                        Upload Watermark...
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Opacity</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={settings.center_watermark_opacity}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          center_watermark_opacity: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            ← Back to Category List
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

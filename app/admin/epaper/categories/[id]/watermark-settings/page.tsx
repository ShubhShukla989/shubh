'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import MediaBrowser from '@/components/page-manager/MediaBrowser';

export default function CategoryWatermarkSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params?.id ? parseInt(params.id as string) : 0;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);
  const [mediaTargetField, setMediaTargetField] = useState<'logo' | 'center_watermark'>('logo');
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
    fetchCategory();
    fetchSettings();
  }, [categoryId]);

  const fetchCategory = async () => {
    try {
      const response = await fetch(`/api/epaper/categories/${categoryId}`);
      const result = await response.json();
      if (result.success) {
        setCategoryName(result.data.title);
      }
    } catch (error) {
      console.error('Error fetching category:', error);
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/settings/category-watermark?category_id=${categoryId}`);
      const result = await response.json();
      if (result.success) {
        setSettings(result.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/settings/category-watermark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: categoryId,
          ...settings
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert('✅ Settings saved successfully!');
        router.push('/admin/epaper/categories');
      } else {
        alert('❌ Failed to save settings: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('❌ Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-500">
            Override Area Map Watermark/Clip Logo Settings for {categoryName}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="bg-white rounded-lg p-8 text-center">Loading settings...</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 space-y-6">
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
                  <button 
                    onClick={() => {
                      setMediaTargetField('logo');
                      setShowMediaBrowser(true);
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
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
                      setSettings({ ...settings, opacity: parseInt(e.target.value) || 0 })
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
                      setSettings({ ...settings, min_width_px: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Row 2: Colors */}
              <div className="grid grid-cols-2 gap-4">
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
                        Templates: {'{edition_title}'} {'{page_title}'} {'{date}'} {'{url}'}{' '}
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
                      <button 
                        onClick={() => {
                          setMediaTargetField('center_watermark');
                          setShowMediaBrowser(true);
                        }}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                      >
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
                          center_watermark_opacity: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t bg-gray-50">
              <Link
                href="/admin/epaper/categories"
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Category List
              </Link>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Media Browser */}
      <MediaBrowser
        isOpen={showMediaBrowser}
        onClose={() => setShowMediaBrowser(false)}
        onSelect={(url) => {
          if (mediaTargetField === 'logo') {
            setSettings({ ...settings, logo_url: url });
            alert('✅ Logo image selected successfully!');
          } else {
            setSettings({ ...settings, center_watermark_url: url });
            alert('✅ Center watermark image selected successfully!');
          }
          setShowMediaBrowser(false);
        }}
        accept="image/*"
      />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

type SidebarType = 'basic' | 'epaper';
type BasicTabType = 'site' | 'ads' | 'robots' | 'analytics';
type EpaperTabType = 'epaper' | 'watermark';

export default function SettingsPage() {
  const [activeSidebar, setActiveSidebar] = useState<SidebarType>('basic');
  const [activeBasicTab, setActiveBasicTab] = useState<BasicTabType>('site');
  const [activeEpaperTab, setActiveEpaperTab] = useState<EpaperTabType>('epaper');
  const [saving, setSaving] = useState(false);
  
  // Basic settings state
  const [homePage, setHomePage] = useState('website-homepage');
  
  // Ads.txt state
  const [adsContent, setAdsContent] = useState('');
  
  // Robots.txt state
  const [robotsContent, setRobotsContent] = useState('');
  
  // Analytics state
  const [analyticsId, setAnalyticsId] = useState('');

  // Epaper settings state
  const [entriesPerPage, setEntriesPerPage] = useState(12);
  const [includeHeaderFooterMap, setIncludeHeaderFooterMap] = useState(false);
  const [includeHeaderFooterClip, setIncludeHeaderFooterClip] = useState(false);
  const [defaultPublishingStatus, setDefaultPublishingStatus] = useState('publish-immediately');
  const [disableRightClick, setDisableRightClick] = useState(false);
  const [keepArchiveDays, setKeepArchiveDays] = useState(0);
  const [useRandomPrefix, setUseRandomPrefix] = useState(false);

  // Watermark settings state
  const [enableWatermarking, setEnableWatermarking] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [opacity, setOpacity] = useState(100);
  const [mode, setMode] = useState('in_outerside');
  const [position, setPosition] = useState('top_center');
  const [minWidthPx, setMinWidthPx] = useState(0);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [foregroundColor, setForegroundColor] = useState('#000000');
  const [enableBorder, setEnableBorder] = useState(false);
  const [borderWidth, setBorderWidth] = useState(2);
  const [borderColor, setBorderColor] = useState('#000000');
  const [infoText, setInfoText] = useState('');
  const [infoTextFont, setInfoTextFont] = useState('English');
  const [enableCenterWatermark, setEnableCenterWatermark] = useState(false);
  const [centerWatermarkUrl, setCenterWatermarkUrl] = useState('');
  const [centerWatermarkOpacity, setCenterWatermarkOpacity] = useState(100);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load site settings
      const siteRes = await fetch('/api/settings/site');
      const siteData = await siteRes.json();
      if (siteData.success) {
        setHomePage(siteData.data?.setting_value || 'website-homepage');
      }

      // Load ads.txt
      const adsRes = await fetch('/api/settings/ads');
      const adsData = await adsRes.json();
      if (adsData.success) {
        setAdsContent(adsData.data?.content || '');
      }

      // Load robots.txt
      const robotsRes = await fetch('/api/settings/robots');
      const robotsData = await robotsRes.json();
      if (robotsData.success) {
        setRobotsContent(robotsData.data?.content || '');
      }

      // Load analytics
      const analyticsRes = await fetch('/api/settings/analytics');
      const analyticsData = await analyticsRes.json();
      if (analyticsData.success) {
        setAnalyticsId(analyticsData.data?.measurement_id || '');
      }

      // Load epaper settings
      const epaperRes = await fetch('/api/settings/epaper');
      const epaperData = await epaperRes.json();
      if (epaperData.success) {
        const data = epaperData.data;
        setEntriesPerPage(data.entries_per_page || 12);
        setIncludeHeaderFooterMap(data.include_header_footer_map || false);
        setIncludeHeaderFooterClip(data.include_header_footer_clip || false);
        setDefaultPublishingStatus(data.default_publishing_status || 'publish-immediately');
        setDisableRightClick(data.disable_right_click || false);
        setKeepArchiveDays(data.keep_archive_days || 0);
        setUseRandomPrefix(data.use_random_prefix || false);
      }

      // Load watermark settings
      const watermarkRes = await fetch('/api/settings/area-map-watermark');
      const watermarkData = await watermarkRes.json();
      if (watermarkData.success) {
        const data = watermarkData.data;
        setEnableWatermarking(data.enable_watermarking || false);
        setLogoUrl(data.logo_url || '');
        setOpacity(data.opacity || 100);
        setMode(data.mode || 'in_outerside');
        setPosition(data.position || 'top_center');
        setMinWidthPx(data.min_width_px || 0);
        setBackgroundColor(data.background_color || '#ffffff');
        setForegroundColor(data.foreground_color || '#000000');
        setEnableBorder(data.enable_border || false);
        setBorderWidth(data.border_width || 2);
        setBorderColor(data.border_color || '#000000');
        setInfoText(data.info_text || '');
        setInfoTextFont(data.info_text_font || 'English');
        setEnableCenterWatermark(data.enable_center_watermark || false);
        setCenterWatermarkUrl(data.center_watermark_url || '');
        setCenterWatermarkOpacity(data.center_watermark_opacity || 100);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSaveBasic = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/settings/site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          home_page: homePage
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Site settings saved successfully!');
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('❌ Failed to save site settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAds = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/settings/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: adsContent }),
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Ads.txt saved successfully!');
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('❌ Failed to save ads.txt');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRobots = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/settings/robots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: robotsContent }),
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Robots.txt saved successfully!');
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('❌ Failed to save robots.txt');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAnalytics = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/settings/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ measurement_id: analyticsId }),
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Google Analytics saved successfully!');
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('❌ Failed to save analytics settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEpaper = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/settings/epaper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries_per_page: entriesPerPage,
          include_header_footer_map: includeHeaderFooterMap,
          include_header_footer_clip: includeHeaderFooterClip,
          default_publishing_status: defaultPublishingStatus,
          disable_right_click: disableRightClick,
          keep_archive_days: keepArchiveDays,
          use_random_prefix: useRandomPrefix,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Epaper settings saved successfully!');
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('❌ Failed to save epaper settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWatermark = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/settings/area-map-watermark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enable_watermarking: enableWatermarking,
          logo_url: logoUrl,
          opacity,
          mode,
          position,
          min_width_px: minWidthPx,
          background_color: backgroundColor,
          foreground_color: foregroundColor,
          enable_border: enableBorder,
          border_width: borderWidth,
          border_color: borderColor,
          info_text: infoText,
          info_text_font: infoTextFont,
          enable_center_watermark: enableCenterWatermark,
          center_watermark_url: centerWatermarkUrl,
          center_watermark_opacity: centerWatermarkOpacity,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Watermark settings saved successfully!');
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('❌ Failed to save watermark settings');
    } finally {
      setSaving(false);
    }
  };

  const fillDefaultRobots = () => {
    const defaultContent = `User-agent: *
Disallow: /*?page=*
Disallow: /*?forcesingle=*
Disallow: */open?id=*
Disallow: /admin/
Disallow: /login

Sitemap: ${typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}/sitemap.xml`;
    setRobotsContent(defaultContent);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
        <nav className="space-y-1">
          <button
            onClick={() => setActiveSidebar('basic')}
            className={`w-full text-left px-4 py-2 text-sm font-medium rounded-lg ${
              activeSidebar === 'basic'
                ? 'text-white bg-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Basic Settings
          </button>
          <button
            onClick={() => setActiveSidebar('epaper')}
            className={`w-full text-left px-4 py-2 text-sm font-medium rounded-lg ${
              activeSidebar === 'epaper'
                ? 'text-white bg-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Epaper Settings
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              {activeSidebar === 'basic' ? 'Basic Settings' : 'Epaper Settings'}
            </h1>
            <p className="text-gray-600 mt-2">
              {activeSidebar === 'basic' 
                ? 'Manage site configuration and settings' 
                : 'Configure epaper and watermark settings'}
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Basic Settings Tabs */}
            {activeSidebar === 'basic' && (
              <div className="flex border-b border-gray-200 overflow-x-auto">
                <button
                  onClick={() => setActiveBasicTab('site')}
                  className={`px-6 py-3 font-medium whitespace-nowrap ${
                    activeBasicTab === 'site'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Site Settings
                </button>
                <button
                  onClick={() => setActiveBasicTab('ads')}
                  className={`px-6 py-3 font-medium whitespace-nowrap ${
                    activeBasicTab === 'ads'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Adsense (ads.txt)
                </button>
                <button
                  onClick={() => setActiveBasicTab('robots')}
                  className={`px-6 py-3 font-medium whitespace-nowrap ${
                    activeBasicTab === 'robots'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Robot (robots.txt)
                </button>
                <button
                  onClick={() => setActiveBasicTab('analytics')}
                  className={`px-6 py-3 font-medium whitespace-nowrap ${
                    activeBasicTab === 'analytics'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Google Analytics
                </button>
              </div>
            )}

            {/* Epaper Settings Tabs */}
            {activeSidebar === 'epaper' && (
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveEpaperTab('epaper')}
                  className={`px-6 py-3 font-medium whitespace-nowrap ${
                    activeEpaperTab === 'epaper'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Epaper Settings
                </button>
                <button
                  onClick={() => setActiveEpaperTab('watermark')}
                  className={`px-6 py-3 font-medium whitespace-nowrap ${
                    activeEpaperTab === 'watermark'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Area Map Watermark
                </button>
              </div>
            )}

            {/* Tab Content */}
            <div className="p-6">
              {/* Basic Settings - Site Settings Tab */}
              {activeSidebar === 'basic' && activeBasicTab === 'site' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Home Page
                    </label>
                    <select
                      value={homePage}
                      onChange={(e) => setHomePage(e.target.value)}
                      className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="website-homepage">Website Homepage</option>
                      <option value="epaper-archive">Epaper Archive</option>
                      <option value="epaper-display">Epaper Display</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Select which page should be displayed when users visit your site's homepage
                    </p>
                  </div>

                  <button
                    onClick={handleSaveBasic}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              )}

              {/* Basic Settings - Ads.txt Tab */}
              {activeSidebar === 'basic' && activeBasicTab === 'ads' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                The following content will be served from{' '}
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  {typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}/ads.txt
                </span>
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={adsContent}
                  onChange={(e) => setAdsContent(e.target.value)}
                  className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0"
                />
              </div>

              <button
                onClick={handleSaveAds}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          )}

              {/* Basic Settings - Robots.txt Tab */}
              {activeSidebar === 'basic' && activeBasicTab === 'robots' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                The following content will be served from{' '}
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  {typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}/robots.txt
                </span>
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={robotsContent}
                  onChange={(e) => setRobotsContent(e.target.value)}
                  className="w-full h-96 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="User-agent: *&#10;Disallow: /admin/"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={fillDefaultRobots}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Fill Default
                </button>
                <button
                  onClick={handleSaveRobots}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          )}

              {/* Basic Settings - Google Analytics Tab */}
              {activeSidebar === 'basic' && activeBasicTab === 'analytics' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Analytics 4 Measurement ID (G-XXXXXXXXXX)
                </label>
                <input
                  type="text"
                  value={analyticsId}
                  onChange={(e) => setAnalyticsId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="G-XXXXXXXXXX"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your Google Analytics 4 Measurement ID. The tracking script will be automatically added to all pages.
                </p>
              </div>

              <button
                onClick={handleSaveAnalytics}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>

              {analyticsId && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview of tracking code:</p>
                  <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-x-auto">
{`<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${analyticsId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${analyticsId}');
</script>`}
                  </pre>
                </div>
              )}
            </div>
          )}

              {/* Epaper Settings - Epaper Tab */}
              {activeSidebar === 'epaper' && activeEpaperTab === 'epaper' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of entries per page in archive
                    </label>
                    <input
                      type="number"
                      value={entriesPerPage}
                      onChange={(e) => setEntriesPerPage(parseInt(e.target.value, 10) || 12)}
                      className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={includeHeaderFooterMap}
                        onChange={(e) => setIncludeHeaderFooterMap(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">Include Header/Footer in Map Display Layout</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={includeHeaderFooterClip}
                        onChange={(e) => setIncludeHeaderFooterClip(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">Include Header/Footer in Shared Clip Display Layout</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Epaper Publishing Status
                    </label>
                    <select
                      value={defaultPublishingStatus}
                      onChange={(e) => setDefaultPublishingStatus(e.target.value)}
                      className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="publish-immediately">Publish Immediately</option>
                      <option value="private">Private</option>
                      <option value="schedule-same-day">Schedule On Same Day</option>
                      <option value="schedule-tomorrow">Schedule Tomorrow</option>
                      <option value="schedule-edition-date">Schedule On Edition Date</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={disableRightClick}
                      onChange={(e) => setDisableRightClick(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Disable Right Click</span>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Keep Archive of (x) Days
                    </label>
                    <input
                      type="number"
                      value={keepArchiveDays}
                      onChange={(e) => setKeepArchiveDays(parseInt(e.target.value))}
                      className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                    <p className="text-xs text-red-500 mt-1 italic">
                      Setting anything greater than 0 will enable auto deletion. Be careful
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={useRandomPrefix}
                        onChange={(e) => setUseRandomPrefix(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">Use Random Prefix for PDF Files</span>
                    </label>
                    <p className="text-xs text-blue-600 mt-1 ml-6">
                      This will add random prefix to PDF files. Hackers won't be able to guess the file names easily.
                    </p>
                  </div>

                  <button
                    onClick={handleSaveEpaper}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              )}

              {/* Epaper Settings - Watermark Tab */}
              {activeSidebar === 'epaper' && activeEpaperTab === 'watermark' && (
                <div className="space-y-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={enableWatermarking}
                      onChange={(e) => setEnableWatermarking(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable Watermarking in Area Maps</span>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com/logo.png"
                      />
                      <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                        Upload Watermark...
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Opacity</label>
                      <input
                        type="number"
                        value={opacity}
                        onChange={(e) => setOpacity(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
                      <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="in_outerside">In Outerside</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                      <select
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Width (px)
                      </label>
                      <input
                        type="number"
                        value={minWidthPx}
                        onChange={(e) => setMinWidthPx(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-full h-10 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Foreground Color</label>
                      <input
                        type="color"
                        value={foregroundColor}
                        onChange={(e) => setForegroundColor(e.target.value)}
                        className="w-full h-10 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        checked={enableBorder}
                        onChange={(e) => setEnableBorder(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Enable Border</span>
                    </label>

                    {enableBorder && (
                      <div className="grid grid-cols-2 gap-4 ml-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Border Width</label>
                          <select
                            value={borderWidth}
                            onChange={(e) => setBorderWidth(parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            <option value="2">2 - Default</option>
                            <option value="1">1</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Border Color</label>
                          <input
                            type="color"
                            value={borderColor}
                            onChange={(e) => setBorderColor(e.target.value)}
                            className="w-full h-10 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800 mb-2">This will appear only if you select mode: In Outerside</p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Info Text</label>
                        <input
                          type="text"
                          value={infoText}
                          onChange={(e) => setInfoText(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="{category} Edition{newline}{date} - {page_title}"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Templates: {'{edition_title}'} {'{page_title}'} {'{date}'} {'{url}'} {'{newline}'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Info Text Font</label>
                        <select
                          value={infoTextFont}
                          onChange={(e) => setInfoTextFont(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="English">English</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        checked={enableCenterWatermark}
                        onChange={(e) => setEnableCenterWatermark(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Enable Extra Watermark on Center</span>
                    </label>

                    {enableCenterWatermark && (
                      <div className="space-y-3 ml-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Watermark Logo</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={centerWatermarkUrl}
                              onChange={(e) => setCenterWatermarkUrl(e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                            />
                            <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                              Upload...
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Opacity</label>
                          <input
                            type="number"
                            value={centerWatermarkOpacity}
                            onChange={(e) => setCenterWatermarkOpacity(parseInt(e.target.value))}
                            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg"
                            min="0"
                            max="100"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleSaveWatermark}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

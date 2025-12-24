'use client';

import { BarChart3 } from 'lucide-react';
import { useState, useEffect } from 'react';

// Real-time Interactive Chart Component
function RealTimeChart({ data, loading, period }: { data: any[], loading: boolean, period: string }) {
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Use only real data, no fallbacks
  const chartData = data && data.length > 0 ? data : [];

  if (loading) {
    return (
      <div className="h-80 relative">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // If no data, show empty state
  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-80 relative">
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <div className="text-lg font-medium mb-2">No Analytics Data</div>
            <div className="text-sm">Start browsing your site to see analytics</div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate max value for scaling
  const maxViews = Math.max(...chartData.map(d => d.views), 100);
  const yAxisMax = Math.ceil(maxViews / 100) * 100;
  const yAxisSteps = [yAxisMax, yAxisMax * 0.75, yAxisMax * 0.5, yAxisMax * 0.25, 0];

  // Generate SVG path for the chart
  const chartWidth = 400;
  const chartHeight = 200;
  const padding = 20;
  
  const points = chartData.map((item, index) => {
    const x = (index / (chartData.length - 1)) * (chartWidth - padding * 2) + padding;
    const y = chartHeight - padding - ((item.views / yAxisMax) * (chartHeight - padding * 2));
    return { x, y, data: item, index };
  });

  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  const areaPath = `${pathData} L ${chartWidth - padding} ${chartHeight - padding} L ${padding} ${chartHeight - padding} Z`;

  return (
    <div className="h-80 relative">
      <div className="absolute top-0 left-0 text-xs text-gray-500">Pageviews</div>
      <div className="h-full w-full bg-gradient-to-t from-blue-50 to-transparent rounded-lg relative overflow-hidden">
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 py-4">
          {yAxisSteps.map((step, i) => (
            <span key={i}>{step.toLocaleString()}</span>
          ))}
        </div>
        
        {/* Chart Area */}
        <div className="ml-12 mr-4 h-full relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {yAxisSteps.map((_, i) => (
              <div key={i} className="border-t border-gray-200 border-dashed"></div>
            ))}
          </div>
          
          {/* Interactive Chart */}
          <svg 
            className="absolute inset-0 w-full h-full cursor-crosshair" 
            viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
            preserveAspectRatio="none"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * chartWidth;
              const y = ((e.clientY - rect.top) / rect.height) * chartHeight;
              
              // Find closest point
              const closest = points.reduce((prev, curr) => 
                Math.abs(curr.x - x) < Math.abs(prev.x - x) ? curr : prev
              );
              
              if (Math.abs(closest.x - x) < 30) { // 30px tolerance
                setHoveredPoint(closest);
                setMousePosition({ x: e.clientX, y: e.clientY });
              } else {
                setHoveredPoint(null);
              }
            }}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <defs>
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05"/>
              </linearGradient>
            </defs>
            
            {/* Area fill */}
            <path
              d={areaPath}
              fill="url(#chartGradient)"
            />
            
            {/* Chart line */}
            <path
              d={pathData}
              stroke="#3B82F6"
              strokeWidth="3"
              fill="none"
              className="drop-shadow-sm"
            />
            
            {/* Data points */}
            {points.map((point, i) => (
              <circle
                key={i}
                cx={point.x}
                cy={point.y}
                r={hoveredPoint?.index === i ? "8" : "4"}
                fill="#3B82F6"
                className={`drop-shadow-sm transition-all cursor-pointer ${
                  hoveredPoint?.index === i ? 'fill-blue-700' : ''
                }`}
              />
            ))}
            
            {/* Hover line */}
            {hoveredPoint && (
              <line
                x1={hoveredPoint.x}
                y1={padding}
                x2={hoveredPoint.x}
                y2={chartHeight - padding}
                stroke="#3B82F6"
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.7"
              />
            )}
          </svg>
          
          {/* Live indicator */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500">Live</span>
          </div>
        </div>
        
        {/* X-axis labels */}
        <div className="absolute bottom-0 left-12 right-4 flex justify-between text-xs text-gray-400 pb-2">
          {chartData.map((item, i) => {
            // Show every other label to avoid crowding
            if (chartData.length > 7 && i % 2 !== 0) return <span key={i}></span>;
            return <span key={i}>{item.label}</span>;
          })}
        </div>
      </div>

      {/* Tooltip */}
      {hoveredPoint && (
        <div 
          className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm pointer-events-none"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 60,
            transform: mousePosition.x > window.innerWidth - 200 ? 'translateX(-100%)' : 'none'
          }}
        >
          <div className="font-semibold">{hoveredPoint.data.label}</div>
          <div className="text-blue-300">Views: {hoveredPoint.data.views.toLocaleString()}</div>
          <div className="text-green-300">Visitors: {hoveredPoint.data.visitors.toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7');
  const [loading, setLoading] = useState(true);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/analytics/dashboard?period=${selectedPeriod}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          setAnalyticsData(result.data);
        } else {
          // Set empty data if API fails
          console.warn('Analytics API failed');
          setAnalyticsData({
            realtime: {
              activeNow: 0,
              todayViews: 0,
              weekViews: 0,
              monthViews: 0,
            },
            chart: [],
          });
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        // Set empty data on error
        setAnalyticsData({
          realtime: {
            activeNow: 0,
            todayViews: 0,
            weekViews: 0,
            monthViews: 0,
          },
          chart: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, [selectedPeriod]);

  // Stats array removed since cards are deleted

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-500">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome to ePaper CMS Admin Panel</p>
        </div>
        <a
          href="/epaper"
          target="_blank"
          className="px-4 sm:px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <span className="hidden sm:inline">View Public E-Paper Site</span>
          <span className="sm:hidden">View Site</span>
        </a>
      </div>

      {/* Stats cards removed as requested */}

      {/* Analytics Chart Section */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-500">Website Traffic & Viewers</h2>
            <div className="flex items-center gap-2">
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 3 Months</option>
              </select>
            </div>
          </div>
          
          {/* Real-time Analytics Chart */}
          <RealTimeChart 
            data={analyticsData?.chart || []} 
            loading={loading}
            period={selectedPeriod}
          />
          
          {/* Real-time stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {loading ? '...' : (analyticsData?.realtime?.todayViews || 0)}
              </div>
              <div className="text-xs text-gray-500">Today's Views</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {loading ? '...' : (analyticsData?.realtime?.activeNow || 0)}
              </div>
              <div className="text-xs text-gray-500">Active Now</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {loading ? '...' : (analyticsData?.realtime?.weekViews?.toLocaleString() || '0')}
              </div>
              <div className="text-xs text-gray-500">This Week</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {loading ? '...' : (analyticsData?.realtime?.monthViews?.toLocaleString() || '0')}
              </div>
              <div className="text-xs text-gray-500">This Month</div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}

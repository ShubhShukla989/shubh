import { BarChart3, FileText, Users, Newspaper } from 'lucide-react';

export default function AdminDashboard() {
  const stats = [
    {
      label: 'Total Editions',
      value: '156',
      icon: <Newspaper className="w-8 h-8 text-purple-600" />,
      change: '+12%',
    },
    {
      label: 'Total Pages',
      value: '42',
      icon: <FileText className="w-8 h-8 text-blue-600" />,
      change: '+5%',
    },
    {
      label: 'Active Users',
      value: '8',
      icon: <Users className="w-8 h-8 text-green-600" />,
      change: '+2',
    },
    {
      label: 'Total Views',
      value: '12.5K',
      icon: <BarChart3 className="w-8 h-8 text-orange-600" />,
      change: '+18%',
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome to ePaper CMS Admin Panel</p>
        </div>
        <a
          href="/epaper"
          target="_blank"
          className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          View Public E-Paper Site
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gray-50 rounded-lg">{stat.icon}</div>
              <span className="text-sm font-medium text-green-600">{stat.change}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Editions</h2>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">Edition Title {item}</p>
                  <p className="text-sm text-gray-500">Published on Nov {item}, 2024</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  Published
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-left">
              <Newspaper className="w-6 h-6 text-purple-600 mb-2" />
              <p className="font-medium text-gray-900">New Edition</p>
            </button>
            <button className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left">
              <FileText className="w-6 h-6 text-blue-600 mb-2" />
              <p className="font-medium text-gray-900">New Page</p>
            </button>
            <button className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors text-left">
              <Users className="w-6 h-6 text-green-600 mb-2" />
              <p className="font-medium text-gray-900">New User</p>
            </button>
            <button className="p-4 border-2 border-orange-200 rounded-lg hover:bg-orange-50 transition-colors text-left">
              <BarChart3 className="w-6 h-6 text-orange-600 mb-2" />
              <p className="font-medium text-gray-900">View Analytics</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function DebugPages() {
  let pages: any[] = [];
  let error = null;
  let supabaseConfigured = !!supabaseAdmin;

  if (supabaseAdmin) {
    try {
      const { data, error: fetchError } = await supabaseAdmin
        .from('pages')
        .select('id, title, alias, status, created_at')
        .order('created_at', { ascending: false });

      if (fetchError) {
        error = fetchError.message;
      } else {
        pages = data || [];
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Debug: Pages</h1>

        {/* Supabase Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Supabase Configuration</h2>
          <div className="space-y-2">
            <p>
              <strong>Status:</strong>{' '}
              {supabaseConfigured ? (
                <span className="text-green-600">✅ Configured</span>
              ) : (
                <span className="text-red-600">❌ Not Configured</span>
              )}
            </p>
            <p>
              <strong>URL:</strong>{' '}
              {process.env.NEXT_PUBLIC_SUPABASE_URL ? (
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL}
                </code>
              ) : (
                <span className="text-red-600">Not set</span>
              )}
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-red-900 mb-2">Error</h2>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Pages List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">
            Pages in Database ({pages.length})
          </h2>

          {pages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">No pages found in database</p>
              <p className="text-sm">
                Create a page in the admin panel or run the sample pages SQL script
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      ID
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Title
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Alias
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      View URL
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pages.map((page: any) => (
                    <tr key={page.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{page.id}</td>
                      <td className="px-4 py-3 text-sm font-medium">{page.title}</td>
                      <td className="px-4 py-3 text-sm">
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {page.alias}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                            page.status === 'Public'
                              ? 'bg-green-100 text-green-800'
                              : page.status === 'Draft'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {page.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {page.status === 'Public' ? (
                          <a
                            href={`/page/${page.alias}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-700 underline"
                          >
                            /page/{page.alias}
                          </a>
                        ) : (
                          <span className="text-gray-400">Not public</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">
            Troubleshooting Steps
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Verify Supabase is configured (check above)</li>
            <li>Ensure pages table exists in Supabase</li>
            <li>Check that page status is exactly "Public" (case-sensitive)</li>
            <li>Verify the alias matches the URL (no spaces or special characters)</li>
            <li>Try restarting the dev server: <code className="bg-blue-100 px-2 py-1 rounded">npm run dev</code></li>
            <li>Check browser console and terminal for errors</li>
          </ol>
        </div>

        {/* Quick Links */}
        <div className="mt-6 flex gap-4">
          <a
            href="/admin/pages"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Admin Panel
          </a>
          <a
            href="/"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    </div>
  );
}

export default function SetupRequiredPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Supabase Setup Required
          </h1>
          <p className="text-gray-600">
            Your application needs to be configured with Supabase credentials.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h2 className="font-semibold text-yellow-800 mb-2">
              What you need to do:
            </h2>
            <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
              <li>Go to your Supabase dashboard</li>
              <li>Navigate to Settings → API</li>
              <li>Copy your Project URL and anon/public key</li>
              <li>Update your .env.local file</li>
            </ol>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="font-semibold text-blue-800 mb-2">
              Environment Variables Needed:
            </h3>
            <pre className="text-xs text-blue-700 bg-blue-100 p-2 rounded overflow-x-auto">
              {`NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key`}
            </pre>
          </div>

          <div className="text-center">
            <a
              href="https://supabase.com/dashboard/project/_/settings/api"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
            >
              Open Supabase Dashboard
              <svg
                className="ml-2 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>

          <div className="text-center text-sm text-gray-500">
            After updating your environment variables, restart your development
            server.
          </div>
        </div>
      </div>
    </div>
  );
}

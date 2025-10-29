import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="mx-auto h-12 w-12 text-red-600">
            {/* Shield Icon */}
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-7V6m0 0V4m0 2h3m-3 0H9"
              />
            </svg>
          </div>
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900">
            Access Forbidden
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Admin access is restricted for security reasons.
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          <p className="text-sm text-gray-500">
            If you are an administrator, please use the designated admin portal.
          </p>
          
          <div className="flex justify-center">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Return to Home
            </Link>
          </div>
        </div>
        
        <div className="mt-6 text-xs text-gray-400">
          Error Code: ADMIN_ACCESS_DENIED
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Access Forbidden - Oppai Daisuki',
  description: 'Admin access is restricted.',
  robots: 'noindex, nofollow',
};

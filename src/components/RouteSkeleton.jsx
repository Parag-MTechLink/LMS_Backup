/**
 * Skeleton fallback for lazy-loaded routes.
 * Non-blocking: shows layout placeholders instead of a full-screen spinner.
 */
function RouteSkeleton() {
  return (
    <div className="max-w-7xl mx-auto animate-pulse space-y-6" aria-hidden="true">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded-lg" />
          <div className="h-4 w-64 bg-gray-100 rounded" />
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-lg" />
      </div>
      {/* Content blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 space-y-4">
            <div className="h-5 w-3/4 bg-gray-200 rounded" />
            <div className="h-4 w-full bg-gray-100 rounded" />
            <div className="h-4 w-1/2 bg-gray-100 rounded" />
            <div className="h-9 w-full bg-gray-100 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 w-full bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default RouteSkeleton

export default function LessonLoading() {
  return (
    <div className="flex h-screen">
      {/* Sidebar skeleton */}
      <div className="w-80 bg-white border-r p-4">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-6 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-5 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              <div className="pl-4 space-y-2">
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 p-6">
        {/* Header skeleton */}
        <div className="border-b pb-4 mb-6">
          <div className="h-10 bg-gray-200 rounded w-1/2 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        </div>

        {/* Content tabs skeleton */}
        <div className="border-b mb-6">
          <div className="flex space-x-4">
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
        </div>

        {/* Video player skeleton */}
        <div className="aspect-video bg-gray-200 rounded-lg mb-6 animate-pulse"></div>

        {/* Content skeleton */}
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}

export default function LessonLoading() {
  return (
    <div className="flex h-screen">
      <div className="w-80 bg-white border-r p-4">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-6 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
      <div className="flex-1 p-6">
        <div className="h-10 bg-gray-200 rounded w-1/2 mb-6 animate-pulse"></div>
        <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  )
}

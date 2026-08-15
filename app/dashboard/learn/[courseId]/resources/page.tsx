import { createClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, Video, Link as LinkIcon, Code, ArrowLeft, Download, ExternalLink } from 'lucide-react'

export default async function CourseResourcesPage({
  params,
}: {
  params: { courseId: string }
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get course details - fetch by ID instead of slug
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, slug')
    .eq('id', params.courseId)
    .single()

  if (!course) {
    notFound()
  }

  // Get resources for this course
  const { data: resources } = await supabase
    .from('resources')
    .select('*')
    .eq('course_id', course.id)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  const getIcon = (type: string) => {
    switch(type) {
      case 'html': return <Code className="text-blue-500" size={24} />
      case 'pdf': return <FileText className="text-red-500" size={24} />
      case 'video': return <Video className="text-green-500" size={24} />
      case 'link': return <LinkIcon className="text-purple-500" size={24} />
      default: return <FileText className="text-gray-500" size={24} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href={`/dashboard/learn/${params.courseId}`}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            <span>Back to Course</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-2">{course.title} - Resources</h1>
        <p className="text-gray-600 mb-8">Additional learning materials for this course</p>

        {resources && resources.length > 0 ? (
          <div className="space-y-4">
            {resources.map((resource) => (
              <div
                key={resource.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getIcon(resource.resource_type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{resource.title}</h3>
                    {resource.description && (
                      <p className="text-gray-600 text-sm mb-3">{resource.description}</p>
                    )}
                    <div className="flex items-center gap-4">
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded-full uppercase">
                        {resource.resource_type}
                      </span>
                      {resource.resource_type === 'html' ? (
                        <Link
                          href={`/resources/${resource.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                        >
                          <ExternalLink size={14} />
                          View Resource
                        </Link>
                      ) : (
                        <a
                          href={resource.content_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                        >
                          <Download size={14} />
                          Open Resource
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resources yet</h3>
            <p className="text-gray-600">Check back later for additional learning materials.</p>
          </div>
        )}
      </div>
    </div>
  )
}

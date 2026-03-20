import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { 
  MessageSquare, 
  ThumbsUp, 
  Eye, 
  Clock,
  ChevronLeft,
  Plus
} from 'lucide-react'
import NewDiscussionButton from '@/components/dashboard/NewDiscussionButton'

export default async function DiscussionsPage({
  params,
}: {
  params: { courseSlug: string }
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // Get course details
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, slug')
    .eq('slug', params.courseSlug)
    .single()

  if (!course) {
    notFound()
  }

  // Get discussions for this course
  const { data: discussions } = await supabase
    .from('discussions')
    .select(`
      *,
      profiles!discussions_user_id_fkey(
        id,
        full_name,
        avatar_url
      ),
      discussion_replies(count)
    `)
    .eq('course_id', course.id)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href={`/dashboard/learn/${params.courseSlug}`}
              className="text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Discussion Forum</h1>
              <p className="text-sm text-gray-500">{course.title}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New Discussion Button */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-gray-500">
            {discussions?.length || 0} discussions
          </p>
          <NewDiscussionButton courseId={course.id} courseSlug={course.slug} />
        </div>

        {/* Discussions List */}
        <div className="space-y-4">
          {discussions?.map((discussion) => (
            <Link
              key={discussion.id}
              href={`/dashboard/discussions/${params.courseSlug}/${discussion.id}`}
              className="block bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden"
            >
              {discussion.is_pinned && (
                <div className="bg-yellow-50 px-4 py-1 text-xs text-yellow-600 border-b border-yellow-100">
                  📌 Pinned
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {discussion.profiles?.full_name?.[0] || 'U'}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1 hover:text-blue-600">
                      {discussion.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {discussion.content}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MessageSquare size={14} />
                        {discussion.discussion_replies?.[0]?.count || 0} replies
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={14} />
                        {discussion.views || 0} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {new Date(discussion.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {(!discussions || discussions.length === 0) && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No discussions yet</h3>
              <p className="text-gray-500 mb-6">Be the first to start a discussion</p>
              <NewDiscussionButton courseId={course.id} courseSlug={course.slug} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

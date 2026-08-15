import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, MessageSquare, ThumbsUp, Clock, User } from 'lucide-react'
import ReplyForm from '@/components/dashboard/ReplyForm'

export default async function DiscussionPage({
  params,
}: {
  params: { courseId: string; discussionId: string }
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // Get discussion details
  const { data: discussion } = await supabase
    .from('discussions')
    .select(`
      *,
      profiles!discussions_user_id_fkey(
        id,
        full_name,
        avatar_url
      ),
      discussion_replies(
        *,
        profiles!discussion_replies_user_id_fkey(
          id,
          full_name,
          avatar_url
        )
      )
    `)
    .eq('id', params.discussionId)
    .single()

  if (!discussion) {
    notFound()
  }

  // Update view count
  await supabase
    .from('discussions')
    .update({ views: (discussion.views || 0) + 1 })
    .eq('id', discussion.id)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href={`/dashboard/discussions/${params.courseId}`}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2 mb-4"
          >
            <ChevronLeft size={20} />
            Back to Discussions
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">{discussion.title}</h1>
          
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <User size={14} />
              {discussion.profiles?.full_name || 'Anonymous'}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {new Date(discussion.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare size={14} />
              {discussion.discussion_replies?.length || 0} replies
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Original Post */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {discussion.profiles?.full_name?.[0] || 'U'}
            </div>
            <div className="flex-1">
              <p className="text-gray-700 whitespace-pre-wrap">{discussion.content}</p>
            </div>
          </div>
        </div>

        {/* Replies */}
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold">
            {discussion.discussion_replies?.length || 0} Replies
          </h2>

          {discussion.discussion_replies?.map((reply: any) => (
            <div key={reply.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {reply.profiles?.full_name?.[0] || 'U'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">
                      {reply.profiles?.full_name || 'Anonymous'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(reply.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reply Form */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold mb-4">Post a Reply</h3>
          <ReplyForm discussionId={discussion.id} courseId={params.courseId} />
        </div>
      </div>
    </div>
  )
}

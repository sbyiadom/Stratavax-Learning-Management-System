'use client'

import type { Lesson } from '@/lib/supabase'

interface LessonContentProps {
  lesson: Lesson
  courseId: string
}

export default function LessonContent({ lesson, courseId }: LessonContentProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">{lesson.title}</h1>
      
      {lesson.video_url && (
        <div className="aspect-video bg-gray-100 rounded-lg mb-8">
          {/* Add your video player component here */}
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            Video Player Placeholder
          </div>
        </div>
      )}
      
      <div className="prose prose-lg max-w-none">
        {lesson.content ? (
          <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
        ) : (
          <p className="text-gray-500">No content available for this lesson.</p>
        )}
      </div>
    </div>
  )
}

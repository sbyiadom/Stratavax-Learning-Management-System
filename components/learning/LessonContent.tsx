'use client'

import { useState } from 'react'
import ReactPlayer from 'react-player'
import { FileText, Video, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import QuizRenderer from './QuizRenderer'
import MicrosoftFormIntegration from './MicrosoftFormIntegration'

// Local type definitions
interface Lesson {
  id: string
  course_id: string
  module_id: string | null
  title: string
  content: string | null
  video_url: string | null
  duration: string | null
  order_index: number
  created_at: string
  updated_at: string
}

interface LessonContentProps {
  lesson: Lesson
  courseId: string
}

export default function LessonContent({ lesson, courseId }: LessonContentProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'quiz' | 'assignment'>('content')
  const [videoProgress, setVideoProgress] = useState(0)

  if (!lesson) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No lesson content available</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Lesson Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{lesson.title}</h1>
        {lesson.duration && (
          <p className="text-sm text-gray-500 mt-1">Duration: {lesson.duration}</p>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('content')}
            className={`pb-2 px-1 flex items-center gap-2 ${
              activeTab === 'content'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            Content
          </button>
          {lesson.video_url && (
            <button
              onClick={() => setActiveTab('quiz')}
              className={`pb-2 px-1 flex items-center gap-2 ${
                activeTab === 'quiz'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Video className="w-4 h-4" />
              Video
            </button>
          )}
          <button
            onClick={() => setActiveTab('assignment')}
            className={`pb-2 px-1 flex items-center gap-2 ${
              activeTab === 'assignment'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Quiz
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'content' && (
          <div className="prose max-w-none">
            {lesson.content ? (
              <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
            ) : (
              <p className="text-gray-500">No written content available for this lesson.</p>
            )}
          </div>
        )}

        {activeTab === 'quiz' && lesson.video_url && (
          <div className="space-y-4">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <ReactPlayer
                url={lesson.video_url}
                width="100%"
                height="100%"
                controls
                onProgress={(state) => {
                  setVideoProgress(Math.round(state.played * 100))
                }}
                config={{
                  youtube: {
                    playerVars: { showinfo: 1 }
                  }
                }}
              />
            </div>
            {videoProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Your progress</span>
                  <span>{videoProgress}%</span>
                </div>
                <Progress value={videoProgress} className="h-2" />
              </div>
            )}
          </div>
        )}

        {activeTab === 'assignment' && (
          <div className="space-y-6">
            <QuizRenderer lessonId={lesson.id} courseId={courseId} />
            <MicrosoftFormIntegration lessonId={lesson.id} courseId={courseId} />
          </div>
        )}
      </div>
    </div>
  )
}

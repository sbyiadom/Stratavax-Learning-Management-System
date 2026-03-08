'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false })

interface LessonContentProps {
  lesson: any
  contentType: string
}

export default function LessonContent({ lesson, contentType }: LessonContentProps) {
  const [isClient, setIsClient] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="aspect-video bg-gray-200 rounded-lg animate-pulse" />
    )
  }

  if (contentType === 'video') {
    // Get the video URL - either from content_url or content?.videoUrl
    const videoUrl = lesson.content_url || lesson.content?.videoUrl
    
    if (!videoUrl) {
      return (
        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">No video available for this lesson.</p>
        </div>
      )
    }

    return (
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <ReactPlayer
          url={videoUrl}
          width="100%"
          height="100%"
          controls={true}
          playing={isPlaying}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      </div>
    )
  }

  if (contentType === 'reading' || contentType === 'article') {
    return (
      <div className="prose max-w-none">
        <div dangerouslySetInnerHTML={{ 
          __html: lesson.content?.content || '<p>Content coming soon...</p>' 
        }} />
      </div>
    )
  }

  if (contentType === 'quiz') {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Quiz: {lesson.title}</h3>
        <p className="text-gray-600">Quiz content would be loaded here.</p>
      </div>
    )
  }

  return (
    <div className="text-gray-500">
      Content type not supported: {contentType}
    </div>
  )
}

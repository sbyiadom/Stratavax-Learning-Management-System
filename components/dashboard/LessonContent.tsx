'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false })

interface LessonContentProps {
  lesson: any
  contentType: string
}

export default function LessonContent({ lesson, contentType }: LessonContentProps) {
  // All hooks must be called at the top level, unconditionally
  const [isClient, setIsClient] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Then you can have conditional returns
  if (!isClient) {
    return (
      <div className="aspect-video bg-gray-200 rounded-lg animate-pulse" />
    )
  }

  if (contentType === 'video') {
    return (
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <ReactPlayer
          url={lesson.content?.videoUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'}
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

  if (contentType === 'reading') {
    return (
      <div className="prose max-w-none">
        <div dangerouslySetInnerHTML={{ 
          __html: lesson.content?.content || '<p>Content coming soon...</p>' 
        }} />
      </div>
    )
  }

  return (
    <div className="text-gray-500">
      Content type not supported: {contentType}
    </div>
  )
}

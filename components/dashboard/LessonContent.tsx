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
  const [playerError, setPlayerError] = useState(false)

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

    // Clean YouTube URLs - remove playlist parameters and get clean video ID
    let processedUrl = videoUrl
    const isYouTube = videoUrl.includes('youtube') || videoUrl.includes('youtu.be')
    
    if (isYouTube) {
      // Extract just the video ID
      let videoId = ''
      if (videoUrl.includes('youtu.be')) {
        videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0] || ''
      } else if (videoUrl.includes('watch')) {
        videoId = videoUrl.split('v=')[1]?.split('&')[0] || ''
      } else if (videoUrl.includes('embed')) {
        videoId = videoUrl.split('embed/')[1]?.split('?')[0] || ''
      }
      
      if (videoId) {
        processedUrl = `https://www.youtube.com/watch?v=${videoId}`
      }
    }

    // If it's YouTube and ReactPlayer fails, use iframe as fallback
    if (isYouTube && playerError) {
      // Convert to embed URL
      let embedUrl = videoUrl
      if (videoUrl.includes('youtu.be')) {
        const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0]
        embedUrl = `https://www.youtube.com/embed/${videoId}`
      } else if (videoUrl.includes('watch')) {
        const videoId = videoUrl.split('v=')[1]?.split('&')[0]
        embedUrl = `https://www.youtube.com/embed/${videoId}`
      } else if (videoUrl.includes('youtube.com/embed')) {
        embedUrl = videoUrl // Already in embed format
      }

      return (
        <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )
    }

    // Try ReactPlayer first
    return (
      <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
        {playerError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white z-10">
            <div className="text-center">
              <p className="mb-2">Failed to load video with ReactPlayer</p>
              <button 
                onClick={() => setPlayerError(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
        <ReactPlayer
          url={processedUrl}
          width="100%"
          height="100%"
          controls={true}
          playing={isPlaying}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={() => setPlayerError(true)}
          config={{
            youtube: {
              playerVars: { 
                showinfo: 1,
                rel: 0,
                modestbranding: 1
              }
            }
          }}
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

  // Handle HTML/interactive content
  if (contentType === 'html' || contentType === 'interactive') {
    if (lesson.content_url) {
      return (
        <div className="w-full bg-white rounded-lg overflow-hidden">
          <iframe
            srcDoc={lesson.content_url}
            className="w-full min-h-[600px] border-0"
            title={lesson.title}
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
      )
    }
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Interactive content not available</p>
      </div>
    )
  }

  return (
    <div className="text-gray-500">
      Content type not supported: {contentType}
    </div>
  )
}

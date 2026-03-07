'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import ReactPlayer with no SSR
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false })

interface LessonContentProps {
  lesson: any
  contentType: string
}

export default function LessonContent({ lesson, contentType }: LessonContentProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (contentType === 'video') {
    if (!isClient) {
      return (
        <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Loading video player...</p>
        </div>
      )
    }

    return (
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <ReactPlayer
          url={lesson.content?.videoUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'}
          width="100%"
          height="100%"
          controls={true}
          config={{
            youtube: {
              playerVars: { showinfo: 1 }
            }
          }}
        />
      </div>
    )
  }

  // Rest of your component remains the same...
  if (contentType === 'reading') {
    return (
      <div className="prose max-w-none bg-white rounded-lg p-8 border">
        <div dangerouslySetInnerHTML={{ __html: lesson.content?.content || '<p>Content coming soon...</p>' }} />
      </div>
    )
  }

  if (contentType === 'quiz') {
    return (
      <div className="bg-white rounded-lg p-8 border">
        <h2 className="text-2xl font-bold mb-6">{lesson.title}</h2>
        <p className="text-gray-600 mb-8">
          This quiz will test your understanding of the module content.
        </p>
        <button
          onClick={() => window.location.href = `/dashboard/quizzes/${lesson.id}`}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Start Quiz
        </button>
      </div>
    )
  }

  if (contentType === 'project') {
    return (
      <div className="bg-white rounded-lg p-8 border">
        <h2 className="text-2xl font-bold mb-4">{lesson.title}</h2>
        <div className="prose max-w-none mb-8">
          <p>{lesson.content?.description || 'Complete this project to apply what you\'ve learned.'}</p>
          {lesson.content?.rubric && (
            <>
              <h3>Grading Rubric</h3>
              <ul>
                {Object.entries(lesson.content.rubric).map(([key, value]: [string, any]) => (
                  <li key={key}>{key}: {value}%</li>
                ))}
              </ul>
            </>
          )}
        </div>
        <button
          onClick={() => window.location.href = `/dashboard/projects/${lesson.id}/submit`}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Submit Project
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-8 border text-center text-gray-500">
      Content type not supported
    </div>
  )
}

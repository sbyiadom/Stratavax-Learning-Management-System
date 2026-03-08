'use client'

import { useState, useEffect } from 'react'
import { BookOpen } from 'lucide-react'

interface CourseImageProps {
  src: string | null
  alt: string
  title?: string // For generating consistent gradient
  className?: string
}

const gradientPairs = [
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-pink-600',
  'from-green-500 to-teal-600',
  'from-orange-500 to-red-600',
  'from-yellow-500 to-amber-600',
  'from-indigo-500 to-purple-600',
  'from-red-500 to-pink-600',
  'from-teal-500 to-cyan-600',
]

function getGradientForString(str: string): string {
  if (!str) return gradientPairs[0]
  const hash = str.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc)
  }, 0)
  const index = Math.abs(hash) % gradientPairs.length
  return gradientPairs[index]
}

export default function CourseImage({ src, alt, title = alt, className = "w-full h-40 object-cover" }: CourseImageProps) {
  const [error, setError] = useState(false)
  const [gradient, setGradient] = useState('from-blue-500 to-indigo-600')

  useEffect(() => {
    setGradient(getGradientForString(title))
  }, [title])

  if (!src || error) {
    return (
      <div className={`w-full h-40 bg-gradient-to-r ${gradient} flex items-center justify-center`}>
        <BookOpen size={48} className="text-white opacity-50" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      loading="lazy"
    />
  )
}

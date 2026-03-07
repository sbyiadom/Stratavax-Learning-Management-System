
'use client'

import { useRouter } from 'next/navigation'

interface ContinueLearningButtonProps {
  courseSlug: string
  lessonId: string
  children: React.ReactNode
}

export default function ContinueLearningButton({ 
  courseSlug, 
  lessonId,
  children 
}: ContinueLearningButtonProps) {
  const router = useRouter()

  const handleContinue = () => {
    router.push(`/dashboard/learn/${courseSlug}/${lessonId}`)
  }

  return (
    <button
      onClick={handleContinue}
      className="w-full bg-green-600 text-white rounded-lg p-4 text-center font-medium hover:bg-green-700 transition"
    >
      {children}
    </button>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { ChevronLeft, Clock, CheckCircle, XCircle, Award } from 'lucide-react'

interface Question {
  id: string
  type: 'multiple-choice' | 'true-false'
  question: string
  options: string[]
  correct: number
  explanation?: string
}

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [lesson, setLesson] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchQuiz = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Fetch lesson details
      const { data: lessonData } = await supabase
        .from('lessons')
        .select(`
          *,
          module:modules(
            course_id,
            courses(slug)
          )
        `)
        .eq('id', params.lessonId)
        .single()

      if (lessonData) {
        setLesson(lessonData)
        if (lessonData.content?.questions) {
          setQuestions(lessonData.content.questions)
          if (lessonData.content.time_limit) {
            setTimeLeft(lessonData.content.time_limit * 60) // Convert to seconds
          }
        }
      }
      setLoading(false)
    }

    fetchQuiz()
  }, [params.lessonId])

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || showResults) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer)
          handleSubmitQuiz()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, showResults])

  const handleAnswer = (questionId: string, answerIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerIndex }))
  }

  const handleSubmitQuiz = async () => {
    setSubmitting(true)
    
    // Calculate score
    let correctAnswers = 0
    questions.forEach(q => {
      if (answers[q.id] === q.correct) {
        correctAnswers++
      }
    })
    
    const finalScore = Math.round((correctAnswers / questions.length) * 100)
    setScore(finalScore)
    setShowResults(true)

    // Save quiz attempt
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      await supabase
        .from('assessment_attempts')
        .insert({
          user_id: user.id,
          assessment_id: lesson?.id,
          score: finalScore,
          answers: answers,
          passed: finalScore >= (lesson?.content?.passing_score || 70),
          completed_at: new Date().toISOString()
        })

      // If passed, mark lesson as completed
      if (finalScore >= (lesson?.content?.passing_score || 70)) {
        await supabase
          .from('lesson_progress')
          .insert({
            user_id: user.id,
            lesson_id: lesson.id,
            completed: true,
            completed_at: new Date().toISOString()
          })
      }
    }

    setSubmitting(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Quiz not found</h2>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (showResults) {
    const passed = score >= (lesson.content?.passing_score || 70)
    
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="mb-6">
              {passed ? (
                <CheckCircle size={64} className="text-green-500 mx-auto" />
              ) : (
                <XCircle size={64} className="text-red-500 mx-auto" />
              )}
            </div>
            
            <h1 className="text-3xl font-bold mb-2">Quiz Complete!</h1>
            <p className="text-gray-600 mb-6">{lesson.title}</p>
            
            <div className="text-5xl font-bold mb-4">{score}%</div>
            
            {passed ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-700">Congratulations! You passed the quiz.</p>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700">You didn't pass this time. Review the material and try again.</p>
              </div>
            )}

            <div className="space-y-4 text-left mb-8">
              <h3 className="font-semibold">Question Review:</h3>
              {questions.map((q, idx) => {
                const userAnswer = answers[q.id]
                const isCorrect = userAnswer === q.correct
                
                return (
                  <div key={q.id} className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className="font-medium mb-2">
                      {idx + 1}. {q.question}
                    </p>
                    <p className="text-sm mb-1">
                      Your answer: <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                        {q.options[userAnswer]}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p className="text-sm text-green-600">
                        Correct answer: {q.options[q.correct]}
                      </p>
                    )}
                    {q.explanation && (
                      <p className="text-sm text-gray-600 mt-2">{q.explanation}</p>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex gap-4 justify-center">
              <Link
                href={`/dashboard/learn/${lesson.module?.courses?.slug}`}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Back to Course
              </Link>
              {!passed && (
                <button
                  onClick={() => {
                    setShowResults(false)
                    setCurrentQuestion(0)
                    setAnswers({})
                  }}
                  className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentQ = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              href={`/dashboard/learn/${lesson.module?.courses?.slug}`}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <ChevronLeft size={20} />
              Back to Course
            </Link>
            {timeLeft !== null && (
              <div className="flex items-center gap-2 text-gray-600">
                <Clock size={18} />
                <span className="font-mono">{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
          
          <h1 className="text-2xl font-bold mb-2">{lesson.title}</h1>
          <p className="text-gray-600 mb-4">{lesson.content?.description}</p>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Question {currentQuestion + 1} of {questions.length}
          </p>
        </div>

        {/* Question */}
        {currentQ && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-semibold mb-6">{currentQ.question}</h2>
            
            <div className="space-y-3">
              {currentQ.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(currentQ.id, idx)}
                  className={`w-full text-left p-4 rounded-lg border transition ${
                    answers[currentQ.id] === idx
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium">{String.fromCharCode(65 + idx)}.</span> {option}
                </button>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              
              {currentQuestion === questions.length - 1 ? (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={Object.keys(answers).length !== questions.length || submitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestion(prev => prev + 1)}
                  disabled={answers[currentQ.id] === undefined}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

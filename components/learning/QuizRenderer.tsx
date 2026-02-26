'use client'

import { useState } from 'react'
import { useSupabase } from '@/app/providers'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface QuizRendererProps {
  lessonId: string
  courseId: string
}

interface Question {
  id: string
  text: string
  options: string[]
  correctAnswer: number
}

export default function QuizRenderer({ lessonId, courseId }: QuizRendererProps) {
  const { supabase, user } = useSupabase()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [quiz, setQuiz] = useState<any>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [results, setResults] = useState<{
    score: number
    passed: boolean
    totalQuestions: number
    correctAnswers: number
  } | null>(null)

  const fetchQuiz = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('lesson_id', lessonId)
        .single()

      if (error) throw error
      setQuiz(data)
      setAnswers(new Array(data.questions.length).fill(-1))
    } catch (error) {
      console.error('Error fetching quiz:', error)
      toast.error('Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
    const newAnswers = [...answers]
    newAnswers[questionIndex] = optionIndex
    setAnswers(newAnswers)
  }

  const handleSubmit = async () => {
    // Check if all questions are answered
    if (answers.includes(-1)) {
      toast.error('Please answer all questions')
      return
    }

    setSubmitting(true)
    try {
      // Calculate score
      let correctCount = 0
      quiz.questions.forEach((q: Question, index: number) => {
        if (answers[index] === q.correctAnswer) {
          correctCount++
        }
      })

      const totalQuestions = quiz.questions.length
      const score = Math.round((correctCount / totalQuestions) * 100)
      const passed = score >= (quiz.passing_score || 70)

      // Save attempt to database
      const { error } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user?.id,
          quiz_id: quiz.id,
          course_id: courseId,
          answers,
          score,
          passed,
          completed_at: new Date().toISOString()
        })

      if (error) throw error

      // Update user progress if passed
      if (passed) {
        await supabase
          .from('user_progress')
          .upsert({
            user_id: user?.id,
            lesson_id: lessonId,
            course_id: courseId,
            is_completed: true,
            completed_at: new Date().toISOString(),
            last_accessed_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,lesson_id'
          })
      }

      setResults({
        score,
        passed,
        totalQuestions,
        correctAnswers: correctCount
      })

      toast.success(passed ? 'Quiz passed!' : 'Quiz completed')
    } catch (error) {
      console.error('Error submitting quiz:', error)
      toast.error('Failed to submit quiz')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRetry = () => {
    setResults(null)
    setAnswers(new Array(quiz?.questions.length).fill(-1))
    fetchQuiz()
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Please sign in to take the quiz</p>
      </div>
    )
  }

  if (!quiz && !loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No quiz available for this lesson</p>
        <Button onClick={fetchQuiz} variant="outline">
          Check for Quiz
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (results) {
    return (
      <div className="space-y-6">
        <div className={`p-6 rounded-lg ${results.passed ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-center gap-3 mb-4">
            {results.passed ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <XCircle className="w-8 h-8 text-red-500" />
            )}
            <div>
              <h3 className="text-lg font-semibold">
                {results.passed ? 'Congratulations!' : 'Keep Practicing!'}
              </h3>
              <p className="text-gray-600">
                You scored {results.score}% ({results.correctAnswers}/{results.totalQuestions})
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleRetry} variant="outline">
              Retry Quiz
            </Button>
            {results.passed && (
              <Button onClick={() => window.location.reload()} variant="default">
                Continue to Next Lesson
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">{quiz?.title}</h3>
        
        {quiz?.questions.map((question: Question, qIndex: number) => (
          <div key={qIndex} className="mb-6 last:mb-0">
            <p className="font-medium mb-3">
              {qIndex + 1}. {question.text}
            </p>
            <div className="space-y-2">
              {question.options.map((option: string, oIndex: number) => (
                <label
                  key={oIndex}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    answers[qIndex] === oIndex
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${qIndex}`}
                    value={oIndex}
                    checked={answers[qIndex] === oIndex}
                    onChange={() => handleAnswerSelect(qIndex, oIndex)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-3 text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-end mt-6">
          <Button
            onClick={handleSubmit}
            disabled={submitting || answers.includes(-1)}
            className="flex items-center gap-2"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : null}
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        </div>
      </div>
    </div>
  )
}


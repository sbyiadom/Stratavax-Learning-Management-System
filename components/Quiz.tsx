// components/Quiz.tsx
'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, ArrowRight, RotateCcw } from 'lucide-react'

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

interface QuizProps {
  questions: Question[]
  onComplete?: (score: number) => void
  lessonId?: string
}

export default function Quiz({ questions, onComplete, lessonId }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)
  
  const currentQuestionData = questions[currentQuestion]
  const hasAnswered = selectedAnswers[currentQuestion] !== undefined
  
  const handleSelectAnswer = (index: number) => {
    if (hasAnswered) return
    
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestion] = index
    setSelectedAnswers(newAnswers)
    
    // Auto-advance after a short delay
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
      } else {
        // Calculate score
        let correct = 0
        questions.forEach((q, idx) => {
          if (newAnswers[idx] === q.correctAnswer) {
            correct++
          }
        })
        setScore(correct)
        setShowResults(true)
        if (onComplete) {
          onComplete(correct)
        }
      }
    }, 800)
  }
  
  const handleRestart = () => {
    setCurrentQuestion(0)
    setSelectedAnswers([])
    setShowResults(false)
    setScore(0)
  }
  
  if (showResults) {
    const percentage = Math.round((score / questions.length) * 100)
    const passed = percentage >= 70
    
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            passed ? 'bg-green-100' : 'bg-yellow-100'
          }`}>
            {passed ? (
              <CheckCircle size={32} className="text-green-600" />
            ) : (
              <XCircle size={32} className="text-yellow-600" />
            )}
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {passed ? 'Congratulations!' : 'Keep Learning!'}
          </h3>
          <p className="text-gray-600 mt-2">
            You scored {score} out of {questions.length} ({percentage}%)
          </p>
          {passed ? (
            <p className="text-green-600 text-sm mt-1">You have successfully completed this quiz!</p>
          ) : (
            <p className="text-yellow-600 text-sm mt-1">Review the material and try again.</p>
          )}
        </div>
        
        <div className="flex gap-3 justify-center">
          {!passed && (
            <button
              onClick={handleRestart}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <RotateCcw size={16} />
              Try Again
            </button>
          )}
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            <ArrowRight size={16} />
            Continue
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>Question {currentQuestion + 1} of {questions.length}</span>
          <span>{Math.round((currentQuestion / questions.length) * 100)}% complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(currentQuestion / questions.length) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Question */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {currentQuestionData.question}
        </h3>
        <div className="space-y-3">
          {currentQuestionData.options.map((option, index) => {
            const isSelected = selectedAnswers[currentQuestion] === index
            const isCorrect = index === currentQuestionData.correctAnswer
            const showCorrect = hasAnswered && isCorrect
            const showWrong = hasAnswered && isSelected && !isCorrect
            
            return (
              <button
                key={index}
                onClick={() => handleSelectAnswer(index)}
                disabled={hasAnswered}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                  isSelected 
                    ? isCorrect 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-red-500 bg-red-50'
                    : showCorrect
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                } ${hasAnswered ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                    isSelected 
                      ? isCorrect 
                        ? 'border-green-500 text-green-500' 
                        : 'border-red-500 text-red-500'
                      : showCorrect
                      ? 'border-green-500 text-green-500'
                      : 'border-gray-300 text-gray-500'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className={`flex-1 ${hasAnswered ? '' : 'text-gray-700'}`}>
                    {option}
                  </span>
                  {showCorrect && <CheckCircle size={18} className="text-green-500 flex-shrink-0" />}
                  {showWrong && <XCircle size={18} className="text-red-500 flex-shrink-0" />}
                </div>
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Explanation */}
      {hasAnswered && currentQuestionData.explanation && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">{currentQuestionData.explanation}</p>
        </div>
      )}
      
      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-gray-500">
          {currentQuestion + 1} / {questions.length}
        </span>
        <button
          onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
          disabled={currentQuestion === questions.length - 1}
          className="px-4 py-2 text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}

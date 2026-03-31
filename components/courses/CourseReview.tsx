'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Star, Send } from 'lucide-react'

interface ReviewProps {
  courseId: string
  onReviewSubmitted?: () => void
}

export default function CourseReview({ courseId, onReviewSubmitted }: ReviewProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [review, setReview] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating')
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setError('Please log in to submit a review')
        setIsSubmitting(false)
        return
      }
      
      // Check if user has already reviewed this course
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (existingReview) {
        setError('You have already reviewed this course')
        setIsSubmitting(false)
        return
      }
      
      // Submit review
      const { error: submitError } = await supabase
        .from('reviews')
        .insert({
          course_id: courseId,
          user_id: user.id,
          rating: rating,
          review: review.trim() || null,
          created_at: new Date().toISOString()
        })
      
      if (submitError) {
        console.error('Review submission error:', submitError)
        setError('Failed to submit review. Please try again.')
        setIsSubmitting(false)
        return
      }
      
      setSuccess(true)
      setRating(0)
      setReview('')
      onReviewSubmitted?.()
      
      setTimeout(() => setSuccess(false), 3000)
      
    } catch (err) {
      console.error('Review error:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <p className="text-green-700 text-sm font-medium">✓ Thank you for your review!</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-900 mb-3 text-base">Rate this Course</h3>
      
      {/* Star Rating */}
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
            className="focus:outline-none transition-transform hover:scale-110"
            type="button"
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                star <= (hoverRating || rating)
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-xs text-gray-500">
          {rating > 0 ? `${rating} out of 5 stars` : 'Select rating'}
        </span>
      </div>
      
      {/* Review Text */}
      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        placeholder="Share your experience with this course..."
        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
        rows={3}
      />
      
      {/* Error Message */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}
      
      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={rating === 0 || isSubmitting}
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
      >
        {isSubmitting ? (
          'Submitting...'
        ) : (
          <>
            Submit Review
            <Send className="w-3 h-3" />
          </>
        )}
      </button>
      
      <p className="text-xs text-gray-400 mt-3">
        Your review helps other learners discover great courses
      </p>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Star, StarHalf, Send } from 'lucide-react'

interface ReviewProps {
  courseId: string
  onReviewSubmitted?: () => void
}

export default function CourseReview({ courseId, onReviewSubmitted }: ReviewProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [review, setReview] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) return
    
    setIsSubmitting(true)
    
    // Submit review to Supabase
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { error } = await supabase
        .from('reviews')
        .insert({
          course_id: courseId,
          user_id: user.id,
          rating: rating,
          review: review,
          created_at: new Date().toISOString()
        })
      
      if (!error) {
        setRating(0)
        setReview('')
        onReviewSubmitted?.()
      }
    }
    
    setIsSubmitting(false)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Rate this Course</h3>
      
      {/* Star Rating */}
      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
            className="focus:outline-none"
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
        <span className="ml-2 text-sm text-gray-500">
          {rating > 0 ? `${rating} stars` : 'Select rating'}
        </span>
      </div>
      
      {/* Review Text */}
      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        placeholder="Share your experience with this course..."
        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
        rows={3}
      />
      
      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={rating === 0 || isSubmitting}
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Review'}
        <Send className="w-4 h-4" />
      </button>
    </div>
  )
}

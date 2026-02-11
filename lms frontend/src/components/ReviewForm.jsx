// src/components/ReviewForm.jsx
import { useState } from 'react'
import api from '../utils/api'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const ReviewForm = ({ courseId, onReviewSubmitted }) => {
  const [rating, setRating] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    const ratingNum = Number(rating)
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return toast.error('Please select a rating between 1 and 5')
    }

    if (!comment.trim()) {
      return toast.warn('Please write a review comment')
    }

    setSubmitting(true)

    try {
      const res = await api.post(`/api-v1/course/review/submit-review/${courseId}`, {
        Rating: ratingNum,
        Comment: comment.trim(),
      })

      // Success case
      toast.success(res.data.message || 'Review submitted successfully!')
      setRating('')
      setComment('')
      onReviewSubmitted?.() // Refresh parent (reviews + course stats)
    } catch (err) {
      // Handle network/auth errors (rare)
      const msg = err.response?.data?.message?.toLowerCase() || err.message || 'Failed to submit review'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg border">
      <div className="space-y-2">
        <Label htmlFor="rating">Rating (1-5) *</Label>
        <div className="flex items-center gap-3">
          <Input
            id="rating"
            type="number"
            min="1"
            max="5"
            step="1"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            required
            className="w-24"
            placeholder="5"
          />
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${i < Number(rating) ? 'fill-current' : ''}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">Your Review *</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What did you like or dislike? Share your honest feedback..."
          rows={5}
          required
        />
      </div>

      <Button 
        type="submit" 
        disabled={submitting}
        className="w-full"
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  )
}

const Star = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
)

export default ReviewForm
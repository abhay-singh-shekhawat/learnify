// src/pages/CourseDetail.jsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../utils/api'
import ReviewForm from '../components/ReviewForm'
import { toast } from 'react-toastify'
import { getToken } from '../utils/auth'
import { formatDuration } from '../utils/helpers'

// Shadcn imports
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Trash2, Star } from 'lucide-react'

const CourseDetail = () => {
  const { id } = useParams()
  const [course, setCourse] = useState(null)
  const [lectures, setLectures] = useState([])
  const [reviews, setReviews] = useState([])
  const [ownReview, setOwnReview] = useState(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showReviewForm, setShowReviewForm] = useState(false)

  const isLoggedIn = !!getToken()

  useEffect(() => {
    fetchCourseDetail()
    fetchReviews()
  }, [id, isLoggedIn])

  const fetchCourseDetail = async () => {
    setLoading(true)
    setError(null)

    try {
      const endpoint = isLoggedIn
        ? `/api-v1/dashboard/get-course-detail-login/${id}`
        : `/api-v1/dashboard/get-course-detail/${id}`

      const res = await api.get(endpoint)

      if (!res.data.success) {
        throw new Error(res.data.message || 'Failed to fetch course')
      }

      setCourse(res.data.course)
      setLectures(res.data.lectures || [])
      // No isEnrolled field - we don't use it for review button anymore
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load course details'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/api-v1/course/review/get-review/${id}`)

      if (res.data.message?.includes('no reviews')) {
        setReviews([])
        setOwnReview(null)
        return
      }

      setReviews(res.data.reviews || [])
      setOwnReview(res.data.ownreview || null)
    } catch (err) {
      console.error('Failed to load reviews:', err)
    }
  }

  const handleDeleteReview = async () => {
    if (!window.confirm('Are you sure you want to delete your review?')) return

    try {
      const res = await api.delete(`/api-v1/course/review/delete-review/${id}`)

      if (res.data.message === 'review deleted successfully') {
        toast.success('Your review has been deleted')
        setOwnReview(null)
        fetchReviews()
        fetchCourseDetail()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete review')
    }
  }

  const handleAddReviewClick = () => {
    if (!isLoggedIn) {
      return toast.info('Please login to add a review')
    }

    // No frontend enrollment check - let backend handle it
    setShowReviewForm(true)
    setTimeout(() => {
      document.getElementById('review-form-card')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleReviewSubmitted = () => {
    setShowReviewForm(false)
    fetchReviews()
    fetchCourseDetail()
  }

  const handleEnroll = async () => {
    if (!isLoggedIn) {
      toast.info('Please login to enroll')
      return
    }
    if (!id) {
      toast.error('Invalid course')
      return
    }

    setLoading(true)

    try {
      const res = await api.get(`/api-v1/course/enrollment/get-razorpay-signature/${id}`)

      if (res.data.success) {
        toast.success(res.data.message || 'Successfully enrolled!')
        fetchCourseDetail()
        return
      }

      if (res.data.message?.toLowerCase().includes('already enrolled')) {
        toast.info("You're already enrolled in this course!")
        return
      }

      if (res.data.message?.toLowerCase().includes('enroll in your own') || res.data.message?.toLowerCase().includes('own courses')) {
        toast.error("You cannot enroll in your own courses!")
        return
      }

      const { orderId, amount, key_id } = res.data

      if (!orderId || !amount || !key_id) {
        throw new Error('Invalid payment initiation response')
      }

      const options = {
        key: key_id,
        amount: amount * 100,
        currency: 'INR',
        name: 'LMS Platform',
        description: `Enroll in ${course?.Title}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await api.post(`/api-v1/course/enrollment/verify-payment/${id}`, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            })

            toast.success(verifyRes.data.message || 'Payment successful! Enrolled.')
            fetchCourseDetail()
          } catch (verifyErr) {
            toast.error('Payment verification failed')
          }
        },
        prefill: {
          name: 'Student Name',
          email: 'student@example.com',
        },
        theme: { color: '#3b82f6' },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (err) {
      const backendMsg = err.response?.data?.message?.toLowerCase() || ''

      if (backendMsg.includes('already enrolled') || backendMsg.includes('already registered')) {
        toast.info("You're already enrolled in this course!")
      } else if (backendMsg.includes('cannot enroll in your own') || backendMsg.includes('own courses')) {
        toast.error("You cannot enroll in your own courses!")
      } else {
        toast.error(backendMsg || err.message || 'Failed to initiate enrollment')
      }

      console.error('Enrollment attempt failed:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="aspect-video w-full rounded-xl" />
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-destructive mb-6">Error</h2>
        <p className="text-lg text-muted-foreground mb-8">{error || 'Course not found'}</p>
        <Button onClick={fetchCourseDetail} size="lg">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-16">
      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
          {course.Title}
        </h1>

        {/* Thumbnail */}
        <Card className="mb-10 overflow-hidden border-none shadow-xl">
          <CardContent className="p-0">
            <div className="aspect-video relative">
              <img
                src={course.Thumbnail || 'https://via.placeholder.com/1280x720?text=Course+Thumbnail'}
                alt={course.Title}
                className="w-full h-full object-cover"
              />
              {course.Price === 0 && (
                <Badge className="absolute top-4 right-4 text-base px-4 py-2" variant="secondary">
                  Free
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-10">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {course.Description || 'No description available.'}
                </p>
              </CardContent>
            </Card>

            {/* Lectures (only if enrolled) */}
            {isEnrolled && lectures.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Course Content</CardTitle>
                  <CardDescription>
                    {lectures.length} lectures • Total duration: {formatDuration(course.totalDuration)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {lectures.map((lecture, index) => (
                      <Link
                        key={lecture._id}
                        to={`/watch/${course._id}/${lecture._id}`}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-muted-foreground font-medium min-w-[40px]">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium group-hover:text-primary transition-colors">
                              {lecture.Title}
                            </h4>
                            {lecture.Duration && (
                              <p className="text-sm text-muted-foreground">
                                {formatDuration(lecture.Duration)}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline">Watch</Badge>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews Section - Visible to everyone */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center justify-between">
                  Reviews ({course.numReviews || 0})
                  <span className="text-lg font-normal text-muted-foreground">
                    {course.Rating?.toFixed(1) || 0}/5
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Add Review Button - Always visible */}
                <div className="flex justify-center mb-8">
                  <Button 
                    size="lg"
                    className="px-10 bg-primary hover:bg-primary/90 text-white"
                    onClick={handleAddReviewClick}
                  >
                    Add Your Review
                  </Button>
                </div>

                {/* Own Review (with Delete) */}
                {ownReview && (
                  <div className="border rounded-lg p-6 bg-muted/30 relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={ownReview.Student?.Avatar} alt={ownReview.Student?.Name} />
                          <AvatarFallback>{getInitial(ownReview.Student?.Name || 'You')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-lg">Your Review</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(ownReview.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${i < ownReview.Rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={handleDeleteReview}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    <p className="text-muted-foreground mt-2">
                      {ownReview.Comment || 'No comment provided.'}
                    </p>
                  </div>
                )}

                {/* All Reviews */}
                {reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews
                      .filter(r => r._id !== ownReview?._id)
                      .map((review) => (
                        <div key={review._id} className="border-b pb-6 last:border-0">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={review.Student?.Avatar} alt={review.Student?.Name} />
                                <AvatarFallback>{getInitial(review.Student?.Name || 'U')}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{review.Student?.Name || 'Anonymous User'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(review.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>

                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-5 w-5 ${i < review.Rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-muted-foreground mt-2">
                            {review.Comment || 'No comment provided.'}
                          </p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No reviews yet.
                  </p>
                )}

                {/* Review Form */}
                {showReviewForm && (
                  <div id="review-form-card" className="pt-8 border-t">
                    <h3 className="text-xl font-semibold mb-6 text-center md:text-left">
                      Add Your Review
                    </h3>
                    <ReviewForm 
                      courseId={id} 
                      onReviewSubmitted={handleReviewSubmitted}
                    />
                    <Button 
                      variant="ghost" 
                      className="mt-4 w-full sm:w-auto"
                      onClick={() => setShowReviewForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enrollment / Watch Card */}
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center justify-between">
                  <span>
                    {course.Price === 0 ? 'Free' : `₹${course.Price}`}
                  </span>
                  {course.Price > 0 && (
                    <Badge variant="outline" className="text-sm">
                      One-time payment
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Enroll to get full access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Button
                  onClick={handleEnroll}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? 'Processing...' : course.Price === 0 ? 'Enroll for Free' : 'Enroll Now'}
                </Button>

                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Instructor</span>
                    <span>{course.Teacher?.Name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lectures</span>
                    <span>{course.totalLectures || lectures.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span>{formatDuration(course.totalDuration)}</span>
                  </div>

                  <div className="my-6 h-px bg-border" />

                  <div className="flex justify-between font-medium">
                    <span>Rating</span>
                    <span>
                      {course.Rating?.toFixed(1) || 0} ({course.numReviews || 0} reviews)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper for avatar fallback
const getInitial = (name) => {
  return name?.trim()?.charAt(0)?.toUpperCase() || 'U'
}

export default CourseDetail
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'react-toastify'
import { formatDuration } from '../utils/helpers'

const StudentDashboard = () => {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchEnrolledCourses()
  }, [])

  const fetchEnrolledCourses = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await api.get('/api-v1/dashboard/all-my-enrolled-course')
      if (!res.data.success) {
        throw new Error(res.data.message || 'No enrolled courses')
      }
      setCourses(res.data.enrolledCourses || [])
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load enrolled courses'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const getInitial = (text) => text?.trim()?.charAt(0)?.toUpperCase() || '?'
  const getBgColor = () => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-amber-100 text-amber-800',
      'bg-rose-100 text-rose-800',
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-10">My Enrolled Courses</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-video w-full rounded-xl" />
              <Skeleton className="h-6 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold text-destructive mb-4">Error</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={fetchEnrolledCourses}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-bold mb-10 text-center md:text-left">
        My Enrolled Courses
      </h1>

      {courses.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
          <h2 className="text-2xl font-semibold mb-4">No courses yet</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            You haven't enrolled in any courses yet. Start exploring!
          </p>
          <Button asChild size="lg" className="px-8">
            <Link to="/">Browse Courses</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.map((enrollment) => {
            const course = enrollment.Course || {}
            const teacher = course.Teacher || {}

            return (
              <Card
                key={enrollment._id}
                className="overflow-hidden hover:shadow-xl transition-all duration-300 border border-border/60 rounded-xl group"
              >
                <div className="aspect-video relative bg-gradient-to-br from-gray-100 to-gray-200">
                  {course.Thumbnail ? (
                    <img
                      src={course.Thumbnail}
                      alt={course.Title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center text-5xl md:text-6xl font-bold ${getBgColor()}`}>
                      {getInitial(course.Title)}
                    </div>
                  )}
                  <Badge className="absolute top-3 left-3 bg-primary/90 hover:bg-primary text-white text-xs">
                    Enrolled
                  </Badge>
                </div>

                <CardHeader className="p-5 pb-3">
                  <CardTitle className="line-clamp-2 text-lg md:text-xl font-semibold group-hover:text-primary transition-colors">
                    {course.Title || 'Untitled Course'}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="h-7 w-7 border-2 border-background">
                      {teacher.Avatar ? (
                        <AvatarImage src={teacher.Avatar} alt={teacher.Name} />
                      ) : null}
                      <AvatarFallback className="text-xs bg-secondary">
                        {getInitial(teacher.Name)}
                      </AvatarFallback>
                    </Avatar>
                    <CardDescription className="text-sm">
                      {teacher.Name || 'Instructor'}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="px-5 pb-5 pt-0 text-sm text-muted-foreground">
                  <div className="flex justify-between items-center mb-4">
                    <span>{course.totalLectures || 0} lectures</span>
                    <span>{formatDuration(course.totalDuration || 0)}</span>
                  </div>

                  {/* Watch Lectures Button */}
                  <Button asChild className="w-full" variant="default">
                    <Link to={`/watch/${course._id}`}>
                      Watch Lectures
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default StudentDashboard
// src/pages/WatchLecture.jsx
import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronLeft, PlayCircle, Settings } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDuration } from '../utils/helpers'

const WatchLecture = () => {
  const { courseId, lectureId: paramLectureId } = useParams()
  const navigate = useNavigate()
  const [lecture, setLecture] = useState(null)
  const [lectures, setLectures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentLectureId, setCurrentLectureId] = useState(paramLectureId)
  const [quality, setQuality] = useState('auto') // 'auto', '480p', '720p', '1080p'

  const videoRef = useRef(null)

  useEffect(() => {
    fetchCourseLectures()
  }, [courseId])

  const fetchCourseLectures = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch all lectures for the course
      const res = await api.get(`/api-v1/dashboard/course/${courseId}/lectures`)

      if (!res.data.success) {
        throw new Error(res.data.message || 'Failed to load lectures')
      }

      const allLectures = res.data.lectures || []
      setLectures(allLectures)

      let targetLectureId = paramLectureId

      // Auto-select first lecture if no specific ID
      if (!targetLectureId && allLectures.length > 0) {
        targetLectureId = allLectures[0]._id
        setCurrentLectureId(targetLectureId)
        navigate(`/watch/${courseId}/${targetLectureId}`, { replace: true })
      }

      if (!targetLectureId && allLectures.length === 0) {
        throw new Error('No lectures available in this course')
      }

      // Fetch specific lecture details
      const lectureRes = await api.get(`/api-v1/dashboard/course/${courseId}/lecture-url/${targetLectureId}`)

      if (!lectureRes.data.success) {
        throw new Error(lectureRes.data.message || 'Lecture not found')
      }

      setLecture(lectureRes.data.lecture)

      // Auto-play when loaded (muted to avoid browser block)
      if (videoRef.current) {
        videoRef.current.play().catch(e => console.log("Autoplay prevented:", e))
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load lecture'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // Handle quality change
  const getVideoUrlWithQuality = () => {
    if (!lecture?.videoUrl) return ''

    // Cloudinary quality transformations
    const baseUrl = lecture.videoUrl
    const qualityMap = {
      auto: '',              // default
      '480p': 'q_auto:low,fl_quality:low',
      '720p': 'q_auto:good,fl_quality:medium',
      '1080p': 'q_auto:high,fl_quality:high'
    }

    const transform = qualityMap[quality] || ''
    if (!transform) return baseUrl

    return baseUrl.replace('/upload/', `/upload/${transform}/`)
  }

  const handleLectureChange = (newLectureId) => {
    setCurrentLectureId(newLectureId)
    navigate(`/watch/${courseId}/${newLectureId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Skeleton className="h-12 w-3/4 mb-6" />
              <Skeleton className="aspect-video w-full rounded-xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !lecture) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="text-destructive text-center">Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-muted-foreground">{error || 'Lecture not found'}</p>
            <div className="flex justify-center gap-4">
              <Button onClick={fetchCourseLectures}>Try Again</Button>
              <Button variant="outline" onClick={() => navigate(-1)}>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const videoUrlWithQuality = getVideoUrlWithQuality()

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Video & Details - Main Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Back & Title */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <h1 className="text-2xl md:text-3xl font-bold line-clamp-2 flex-1">
                {lecture.Title}
              </h1>
            </div>

            {/* Video Player */}
            <div className="bg-black rounded-xl overflow-hidden border shadow-2xl relative">
              <video
                ref={videoRef}
                src={videoUrlWithQuality}
                controls
                autoPlay
                muted
                playsInline
                className="w-full aspect-video"
                onLoadedMetadata={(e) => console.log("Video ready, duration:", e.target.duration)}
                onError={(e) => console.error("Video playback error:", e.target.error)}
              >
                <source src={videoUrlWithQuality} type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              {/* Quality Selector */}
              <div className="absolute top-4 right-4 z-10">
                <Select value={quality} onValueChange={setQuality}>
                  <SelectTrigger className="w-28 bg-black/70 text-white border-none hover:bg-black/80">
                    <SelectValue placeholder="Quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="480p">480p</SelectItem>
                    <SelectItem value="720p">720p</SelectItem>
                    <SelectItem value="1080p">1080p</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Duration & Description */}
            <div className="space-y-4">
              {lecture.Duration && (
                <p className="text-sm text-muted-foreground">
                  Duration: {Math.floor(lecture.Duration / 60)} min {lecture.Duration % 60} sec
                </p>
              )}

              {lecture.Description && (
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {lecture.Description}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Lecture List Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-xl">Course Lectures</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[50vh] lg:h-[70vh] pr-4">
                  <div className="space-y-2">
                    {lectures.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No lectures available
                      </p>
                    ) : (
                      lectures.map((lec) => (
                        <Button
                          key={lec._id}
                          variant={lec._id === currentLectureId ? "default" : "ghost"}
                          className="w-full justify-start text-left h-auto py-3 px-4"
                          onClick={() => handleLectureChange(lec._id)}
                        >
                          <div className="flex items-start gap-3 w-full">
                            <div className="mt-1">
                              {lec._id === currentLectureId ? (
                                <PlayCircle className="h-5 w-5 text-primary" fill="currentColor" />
                              ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground flex items-center justify-center text-xs font-medium">
                                  {lectures.indexOf(lec) + 1}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium line-clamp-2">{lec.Title}</p>
                              {lec.Duration && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDuration(lec.Duration)}
                                </p>
                              )}
                            </div>
                          </div>
                        </Button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WatchLecture
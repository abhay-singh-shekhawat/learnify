import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { toast } from 'react-toastify'

const cloud_name = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME

const TeacherDashboard = () => {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [selectedCourseId, setSelectedCourseId] = useState(null)
  const navigate = useNavigate()

  // Use 'Thumbnail' to match your model
  const [formData, setFormData] = useState({
    Title: '',
    Description: '',
    Price: 0,
    CatagoryId: '',
    Tags: '',
    Level: 'beginner',
    Thumbnail: '',      // ← changed from ThumbnailUrl
    publicId: ''
  })

  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchMyCourses()
  }, [])

  const fetchMyCourses = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api-v1/course/all-my-courses')
      setCourses(Array.isArray(res.data.allMyCourses) ? res.data.allMyCourses : [])
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load your courses'
      toast.error(msg)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleThumbnailUpload = async (isEdit = false) => {
    if (!thumbnailFile) {
      toast.warn('Please select an image first')
      return null
    }

    try {
      const sigRes = await api.get('/api-v1/course/get-cloudinary-signature-course-thumbnail')
      const { timestamp, signature, api_key } = sigRes.data

      const uploadFormData = new FormData()
      uploadFormData.append('file', thumbnailFile)
      uploadFormData.append('api_key', api_key)
      uploadFormData.append('timestamp', timestamp)
      uploadFormData.append('signature', signature)
      uploadFormData.append('folder', 'course')

      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
        method: 'POST',
        body: uploadFormData
      })

      const cloudData = await cloudRes.json()

      if (!cloudRes.ok) {
        throw new Error(cloudData.error?.message || 'Thumbnail upload failed')
      }

      const newData = {
        Thumbnail: cloudData.secure_url,   // ← key changed to match model
        publicId: cloudData.public_id
      }

      setFormData(prev => ({ ...prev, ...newData }))

      toast.success('Thumbnail uploaded!')
      return newData
    } catch (err) {
      toast.error(err.message || 'Failed to upload thumbnail')
      return null
    }
  }

  const openEditModal = (course) => {
    setEditingCourse(course)
    setFormData({
      Title: course.Title || '',
      Description: course.Description || '',
      Price: course.Price || 0,
      CatagoryId: course.Catagory?._id || course.Catagory || '',
      Tags: course.Tags?.join(', ') || '',
      Level: course.Level || 'beginner',
      Thumbnail: course.Thumbnail || '',   // ← changed
      publicId: course.publicId || ''
    })
    setThumbnailFile(null)
    setShowEditModal(true)
  }

  const handleUpdateCourse = async (e) => {
    e.preventDefault()
    setUpdating(true)

    try {
      if (!formData.Title || !formData.CatagoryId) {
        throw new Error('Title and Category are required')
      }

      let finalPayload = { ...formData }

      if (thumbnailFile) {
        const uploadResult = await handleThumbnailUpload(true)
        if (uploadResult) {
          finalPayload = {
            ...finalPayload,
            Thumbnail: uploadResult.Thumbnail,   // ← key changed
            publicId: uploadResult.publicId
          }
        } else {
          throw new Error('Thumbnail upload failed')
        }
      }

      // Clean payload
      const cleanPayload = Object.fromEntries(
        Object.entries(finalPayload).filter(([_, v]) => v !== undefined && v !== '')
      )

      console.log("Sending update payload:", cleanPayload)

      const res = await api.put(`/api-v1/course/update-course/${editingCourse._id}`, cleanPayload)

      if (res.data.success) {
        toast.success('Course updated successfully!')
        setShowEditModal(false)
        setEditingCourse(null)
        setThumbnailFile(null)
        fetchMyCourses()  // This will reload with new Thumbnail
      } else {
        throw new Error(res.data.message || 'Update failed')
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update course')
      console.error('Update error:', err)
    } finally {
      setUpdating(false)
    }
  }

  const handleCreateCourse = async (e) => {
    e.preventDefault()
    setCreating(true)

    try {
      if (!formData.Title || !formData.CatagoryId) {
        throw new Error('Title and Category are required')
      }

      let finalPayload = { ...formData }

      if (thumbnailFile) {
        const uploadResult = await handleThumbnailUpload(false)
        if (uploadResult) {
          finalPayload = {
            ...finalPayload,
            Thumbnail: uploadResult.Thumbnail,
            publicId: uploadResult.publicId
          }
        }
      }

      const payload = {
        ...finalPayload,
        Tags: finalPayload.Tags.split(',').map(t => t.trim()).filter(Boolean),
        Price: Number(finalPayload.Price) || 0,
        isPublished: false
      }

      await api.post('/api-v1/course/create-course', payload)
      toast.success('Course created successfully!')

      setShowCreateModal(false)
      setFormData({
        Title: '',
        Description: '',
        Price: 0,
        CatagoryId: '',
        Tags: '',
        Level: 'beginner',
        Thumbnail: '',
        publicId: ''
      })
      setThumbnailFile(null)
      fetchMyCourses()
    } catch (err) {
      toast.error(err.message || 'Failed to create course')
    } finally {
      setCreating(false)
    }
  }

  const publishCourse = async (courseId) => {
    if (!window.confirm('Publish this course?')) return

    try {
      await api.patch(`/api-v1/course/publish-course/${courseId}`)
      toast.success('Course published successfully!')
      fetchMyCourses()
    } catch (err) {
      toast.error('Failed to publish course')
    }
  }

  const getInitial = (text) => text?.trim()?.charAt(0)?.toUpperCase() || '?'
  const getBgColor = () => {
    const colors = ['bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-purple-100 text-purple-800', 'bg-amber-100 text-amber-800', 'bg-rose-100 text-rose-800']
    return colors[Math.floor(Math.random() * colors.length)]
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><p className="text-lg animate-pulse">Loading...</p></div>
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-semibold text-destructive mb-4">Error</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={fetchMyCourses}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground mt-2">Create and manage your courses</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} size="lg" className="px-8">
          Create New Course
        </Button>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {courses.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-muted/30 rounded-xl border border-dashed">
            <h2 className="text-2xl font-semibold mb-4">No courses yet</h2>
            <p className="text-muted-foreground mb-6">Start by creating your first course!</p>
            <Button onClick={() => setShowCreateModal(true)} size="lg">
              Create Your First Course
            </Button>
          </div>
        ) : (
          courses.map((course) => (
            <Card
              key={course._id}
              className="overflow-hidden hover:shadow-xl transition-all duration-300 border border-border/60 rounded-xl group cursor-pointer"
              onClick={() => setSelectedCourseId(course._id)}
            >
              <div className="aspect-video relative bg-gradient-to-br from-gray-100 to-gray-200">
                {course.Thumbnail ? (
                  <img 
                    src={course.Thumbnail} 
                    alt={course.Title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-5xl md:text-6xl font-bold ${getBgColor()}`}>
                    {getInitial(course.Title)}
                  </div>
                )}
                <Badge 
                  className="absolute top-3 right-3" 
                  variant={course.isPublished ? "default" : "secondary"}
                >
                  {course.isPublished ? 'Published' : 'Draft'}
                </Badge>
              </div>

              <CardHeader className="p-5 pb-3">
                <CardTitle className="line-clamp-2 text-lg font-semibold group-hover:text-primary transition-colors">
                  {course.Title || 'Untitled Course'}
                </CardTitle>
                <CardDescription className="line-clamp-1 mt-1">
                  {course.Description?.substring(0, 80) || 'No description'}
                </CardDescription>
              </CardHeader>

              <CardContent className="px-5 pb-5 pt-0 text-sm text-muted-foreground">
                <div className="flex justify-between items-center mb-4">
                  <span>₹{course.Price || 0}</span>
                  <span>{course.totalLectures || 0} lectures</span>
                </div>

                <div className="flex gap-2">
                  {!course.isPublished && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        publishCourse(course._id)
                      }}
                    >
                      Publish
                    </Button>
                  )}
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      openEditModal(course)
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Course Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
            <DialogDescription>Fill in the details to create your new course.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCourse} className="space-y-6">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={formData.Title} onChange={e => setFormData({...formData, Title: e.target.value})} required />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.Description} onChange={e => setFormData({...formData, Description: e.target.value})} rows={4} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (₹)</Label>
                <Input type="number" min="0" value={formData.Price} onChange={e => setFormData({...formData, Price: Number(e.target.value)})} />
              </div>

              <div className="space-y-2">
                <Label>Level</Label>
                <select className="w-full border rounded-md p-2" value={formData.Level} onChange={e => setFormData({...formData, Level: e.target.value})}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags (comma separated)</Label>
              <Input value={formData.Tags} onChange={e => setFormData({...formData, Tags: e.target.value})} placeholder="react, javascript, mern" />
            </div>

            <div className="space-y-2">
              <Label>Category ID *</Label>
              <Input value={formData.CatagoryId} onChange={e => setFormData({...formData, CatagoryId: e.target.value})} required />
            </div>

            <div className="space-y-2">
              <Label>Course Thumbnail</Label>
              <Input type="file" accept="image/*" onChange={e => setThumbnailFile(e.target.files?.[0] || null)} />
              {formData.Thumbnail && <img src={formData.Thumbnail} alt="preview" className="w-32 h-32 object-cover rounded mt-2" />}
              {thumbnailFile && (
                <Button type="button" variant="secondary" size="sm" onClick={() => handleThumbnailUpload(false)} className="mt-2">
                  Upload Thumbnail
                </Button>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create Course'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Course Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>Update course details.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateCourse} className="space-y-6">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={formData.Title} onChange={e => setFormData({...formData, Title: e.target.value})} required />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.Description} onChange={e => setFormData({...formData, Description: e.target.value})} rows={4} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (₹)</Label>
                <Input type="number" min="0" value={formData.Price} onChange={e => setFormData({...formData, Price: Number(e.target.value)})} />
              </div>

              <div className="space-y-2">
                <Label>Level</Label>
                <select className="w-full border rounded-md p-2" value={formData.Level} onChange={e => setFormData({...formData, Level: e.target.value})}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags (comma separated)</Label>
              <Input value={formData.Tags} onChange={e => setFormData({...formData, Tags: e.target.value})} placeholder="react, javascript, mern" />
            </div>

            <div className="space-y-2">
              <Label>Category ID *</Label>
              <Input value={formData.CatagoryId} onChange={e => setFormData({...formData, CatagoryId: e.target.value})} required />
            </div>

            <div className="space-y-2">
              <Label>Course Thumbnail (leave blank to keep current)</Label>
              <Input type="file" accept="image/*" onChange={e => setThumbnailFile(e.target.files?.[0] || null)} />
              {formData.Thumbnail && <img src={formData.Thumbnail} alt="Current" className="w-32 h-32 object-cover rounded mt-2" />}
              {thumbnailFile && (
                <Button type="button" variant="secondary" size="sm" onClick={() => handleThumbnailUpload(true)} className="mt-2">
                  Upload New Thumbnail
                </Button>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button type="submit" disabled={updating}>{updating ? 'Updating...' : 'Update Course'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lecture Manager Modal */}
      {selectedCourseId && (
        <CourseLecturesManager
          courseId={selectedCourseId}
          onClose={() => setSelectedCourseId(null)}
          onCourseUpdated={fetchMyCourses}
        />
      )}
    </div>
  )
}

// CourseLecturesManager (unchanged from your last working version with /upload/ routes)
const CourseLecturesManager = ({ courseId, onClose, onCourseUpdated }) => {
  const [lectures, setLectures] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingLecture, setEditingLecture] = useState(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoFile, setVideoFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    fetchLectures()
  }, [courseId])

  const fetchLectures = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api-v1/course/my-course-details/${courseId}`)
      setLectures(res.data.lectures || [])
    } catch (err) {
      toast.error('Failed to load lectures')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setVideoFile(null)
    setEditingLecture(null)
    setShowForm(false)
    setUploadProgress(0)
    setIsUploading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return toast.error('Lecture title is required')

    setLoading(true)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      let videoUrl = editingLecture?.videoUrl || ''
      let publicId = editingLecture?.publicId || ''
      let duration = editingLecture?.Duration || 0

      if (videoFile) {
        const sigRes = await api.get(`/api-v1/course/upload/${courseId}/cloud-signature`)
        const { timestamp, signature, api_key } = sigRes.data

        const formData = new FormData()
        formData.append('file', videoFile)
        formData.append('api_key', api_key)
        formData.append('timestamp', timestamp)
        formData.append('signature', signature)
        formData.append('folder', 'lectures')

        const uploadPromise = new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloud_name}/video/upload`)

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100)
              setUploadProgress(percent)
            }
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const data = JSON.parse(xhr.responseText)
              resolve(data)
            } else {
              reject(new Error('Upload failed: ' + xhr.statusText))
            }
          }

          xhr.onerror = () => reject(new Error('Network error'))
          xhr.send(formData)
        })

        const cloudData = await uploadPromise

        videoUrl = cloudData.secure_url
        publicId = cloudData.public_id
        duration = Math.round(cloudData.duration || 0)
      }

      const payload = {
        Title: title,
        Description: description,
        ...(videoUrl && { videoUrl }),
        ...(publicId && { publicId }),
        ...(duration && { Duration: duration })
      }

      if (editingLecture) {
        await api.patch(`/api-v1/course/upload/lecture/update/${editingLecture._id}`, payload)
        toast.success('Lecture updated successfully!')
      } else {
        await api.post(`/api-v1/course/upload/${courseId}/lecture/add`, payload)
        toast.success('Lecture added successfully!')
      }

      resetForm()
      fetchLectures()
      onCourseUpdated?.()
    } catch (err) {
      toast.error(err.message || 'Failed to save lecture')
      console.error('Lecture save error:', err)
    } finally {
      setLoading(false)
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async (lectureId) => {
    if (!window.confirm('Delete this lecture?')) return

    try {
      await api.delete(`/api-v1/course/upload/${courseId}/lecture/delete/${lectureId}`)
      toast.success('Lecture deleted successfully')
      fetchLectures()
      onCourseUpdated?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete lecture')
    }
  }

  const startEdit = (lecture) => {
    setEditingLecture(lecture)
    setTitle(lecture.Title)
    setDescription(lecture.Description || '')
    setShowForm(true)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl">Manage Lectures</DialogTitle>
          <DialogDescription>Add, edit, or remove lectures for this course</DialogDescription>
        </DialogHeader>

        <div className="mt-6 flex justify-end">
          <Button onClick={() => { resetForm(); setShowForm(true); }} disabled={isUploading}>
            + Add New Lecture
          </Button>
        </div>

        {showForm && (
          <Card className="mt-6 border-primary/30">
            <CardHeader>
              <CardTitle>{editingLecture ? 'Edit Lecture' : 'Add Lecture'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} required disabled={isUploading} />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} disabled={isUploading} />
                </div>

                <div className="space-y-2">
                  <Label>Video File {editingLecture && '(leave blank to keep current)'}</Label>
                  <Input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] || null)} disabled={isUploading} />
                </div>

                {isUploading && (
                  <div className="space-y-2 pt-4">
                    <Label>Uploading video...</Label>
                    <Progress value={uploadProgress} className="w-full h-2" />
                    <p className="text-sm text-center">{uploadProgress}%</p>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={loading || isUploading}>
                    {isUploading ? `Uploading... ${uploadProgress}%` : loading ? 'Saving...' : editingLecture ? 'Update' : 'Add Lecture'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm} disabled={isUploading}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="mt-10">
          <h3 className="text-xl font-semibold mb-4">Lectures ({lectures.length})</h3>

          {loading ? (
            <p className="text-muted-foreground">Loading lectures...</p>
          ) : lectures.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
              <p className="text-lg text-muted-foreground">No lectures yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lectures.map((lecture) => (
                <Card key={lecture._id} className="p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{lecture.Title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {lecture.Description || 'No description'}
                      </p>
                      {lecture.Duration && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Duration: {Math.floor(lecture.Duration / 60)}m {lecture.Duration % 60}s
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => startEdit(lecture)} disabled={isUploading}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(lecture._id)} disabled={isUploading}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default TeacherDashboard
// src/pages/Profile.jsx
import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { LogOut, Edit, Save, X } from 'lucide-react'

const cloud_name = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME

const Profile = () => {
  const [user, setUser] = useState(null)
  const [name, setName] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  // Ref for hidden file input
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api-v1/user/me')
      const userData = res.data.user
      setUser(userData)
      setName(userData.Name || '')
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load profile'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile) return { url: user?.Avatar || '', publicId: user?.publicId || '' }

    try {
      const sigRes = await api.get('/api-v1/user/get-cloudinary-signature-avatar')
      const { timestamp, signature, api_key } = sigRes.data

      const formData = new FormData()
      formData.append('file', avatarFile)
      formData.append('api_key', api_key)
      formData.append('timestamp', timestamp)
      formData.append('signature', signature)
      formData.append('folder', 'user/avatar')

      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
        method: 'POST',
        body: formData,
      })

      const cloudData = await cloudRes.json()

      if (!cloudRes.ok || !cloudData.secure_url) {
        throw new Error(cloudData.error?.message || 'Avatar upload failed')
      }

      // Optional: Delete old avatar
      if (user?.publicId) {
        try {
          await api.post('/api-v1/user/delete-old-avatar', { publicId: user.publicId })
        } catch (deleteErr) {
          console.warn('Old avatar delete failed (non-critical):', deleteErr)
        }
      }

      return {
        url: cloudData.secure_url,
        publicId: cloudData.public_id
      }
    } catch (err) {
      toast.error('Avatar upload failed')
      console.error(err)
      return { url: user?.Avatar || '', publicId: user?.publicId || '' }
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      let avatarUrl = user?.Avatar || ''
      let publicId = user?.publicId || ''

      if (avatarFile) {
        const uploadResult = await handleAvatarUpload()
        avatarUrl = uploadResult.url
        publicId = uploadResult.publicId
      }

      const payload = {}
      if (name.trim() && name !== user?.Name) payload.Name = name.trim()
      if (avatarUrl && avatarUrl !== user?.Avatar) payload.Avatar = avatarUrl
      if (publicId && publicId !== user?.publicId) payload.publicId = publicId

      if (Object.keys(payload).length === 0) {
        toast.info('No changes to save')
        setIsEditing(false)
        return
      }

      const res = await api.patch('/api-v1/user/update-profile', payload)

      toast.success(res.data.message || 'Profile updated successfully')
      setUser((prev) => ({ ...prev, ...payload }))
      setAvatarFile(null)
      setIsEditing(false)
      fetchUserProfile()
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile'
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await api.post('/api-v1/user/logout')
      localStorage.removeItem('token')
      toast.success('Logged out successfully')
      navigate('/login')
    } catch (err) {
      toast.error('Logout failed')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-10 flex-1" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h2 className="text-2xl font-bold text-destructive mb-4">Error</h2>
        <p className="text-muted-foreground mb-6">{error || 'Failed to load profile'}</p>
        <Button onClick={fetchUserProfile}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center justify-between">
            Your Profile
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleSave}
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setIsEditing(false)
                    setAvatarFile(null)
                    setName(user.Name || '')
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {isEditing ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (cannot be changed)</Label>
                <Input id="email" value={user.Email} disabled />
              </div>

              <div className="space-y-2">
                <Label>Profile Picture</Label>
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    {avatarFile ? (
                      <AvatarImage src={URL.createObjectURL(avatarFile)} alt="Preview" />
                    ) : (
                      <AvatarImage src={user.Avatar} alt={user.Name} />
                    )}
                    <AvatarFallback>{name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    {/* Hidden file input */}
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                      className="hidden"
                      ref={fileInputRef}
                    />

                    {/* Visible button that triggers the hidden input */}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {avatarFile ? 'Change Avatar' : 'Upload New Avatar'}
                    </Button>

                    {avatarFile && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Selected: {avatarFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.Avatar} alt={user.Name} />
                  <AvatarFallback>{user.Name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>

                <div>
                  <h3 className="text-xl font-semibold">{user.Name || 'User'}</h3>
                  <p className="text-muted-foreground">{user.Email}</p>
                  <p className="text-sm text-muted-foreground mt-1 capitalize">
                    Role: {user.Role}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Joined</Label>
                  <p className="text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label>Account Status</Label>
                  <p className="text-muted-foreground">
                    {user.isApproved ? 'Approved' : 'Pending Approval'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 pt-6 border-t">
            {!isEditing && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}

            <Button 
              variant="destructive" 
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Profile
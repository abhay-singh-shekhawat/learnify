import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'react-toastify';
import { formatDuration } from '../utils/helpers';

const cloud_name = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

const CourseLecturesManager = ({ courseId, onClose }) => {
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingLecture, setEditingLecture] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);

  useEffect(() => {
    fetchLectures();
  }, [courseId]);

  const fetchLectures = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api-v1/course/my-course-details/${courseId}`);
      setLectures(res.data.lectures || []);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load lectures';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error('Title is required');

    setLoading(true);

    try {
      let videoUrl = editingLecture?.videoUrl || '';
      let publicId = editingLecture?.publicId || '';

      if (videoFile) {
        const sigRes = await api.get(`/api-v1/course/upload/${courseId}/cloud-signature`);
        const { timestamp, signature, api_key } = sigRes.data;

        const formData = new FormData();
        formData.append('file', videoFile);
        formData.append('api_key', api_key);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);
        formData.append('folder', `lectures/${courseId}`);
        formData.append('resource_type', 'video');

        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/video/upload`, {
          method: 'POST',
          body: formData,
        });

        const cloudData = await cloudRes.json();

        if (!cloudRes.ok || !cloudData.secure_url) {
          throw new Error(cloudData.error?.message || 'Video upload failed');
        }

        videoUrl = cloudData.secure_url;
        publicId = cloudData.public_id;
      }

      const payload = {
        Title: title,
        Description: description,
      };
      if (videoUrl) payload.videoUrl = videoUrl;
      if (publicId) payload.publicId = publicId;

      if (editingLecture) {
        await api.patch(`/api-v1/course/lecture/update/${editingLecture._id}`, payload);
        toast.success('Lecture updated successfully');
      } else {
        await api.post(`/api-v1/course/${courseId}/lecture/add`, payload);
        toast.success('Lecture added successfully');
      }

      setTitle('');
      setDescription('');
      setVideoFile(null);
      setShowForm(false);
      setEditingLecture(null);
      fetchLectures();
    } catch (err) {
      toast.error(err.message || 'Failed to save lecture');
      console.error('Lecture save error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (lectureId) => {
    if (!window.confirm('Are you sure you want to delete this lecture?')) return;

    try {
      await api.delete(`/api-v1/course/${courseId}/lecture/delete/${lectureId}`);
      toast.success('Lecture deleted');
      fetchLectures();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete lecture');
    }
  };

  const startEdit = (lecture) => {
    setEditingLecture(lecture);
    setTitle(lecture.Title);
    setDescription(lecture.Description || '');
    setShowForm(true);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setVideoFile(null);
    setEditingLecture(null);
    setShowForm(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl">Manage Lectures</DialogTitle>
        </DialogHeader>

        <div className="mt-6 flex justify-end">
          <Button onClick={() => { resetForm(); setShowForm(true); }}>
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
                  <Input value={title} onChange={e => setTitle(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} />
                </div>

                <div className="space-y-2">
                  <Label>Video File {editingLecture && '(leave blank to keep current)'}</Label>
                  <Input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files[0])} />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : editingLecture ? 'Update' : 'Add Lecture'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
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
            <p className="text-muted-foreground animate-pulse">Loading lectures...</p>
          ) : lectures.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
              <p className="text-lg text-muted-foreground">No lectures yet</p>
              <p className="mt-2 text-sm">Click "Add New Lecture" above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lectures.map(lecture => (
                <Card key={lecture._id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{lecture.Title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {lecture.Description || 'No description'}
                      </p>
                      {lecture.Duration && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Duration: {formatDuration(lecture.Duration)}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" size="sm" onClick={() => startEdit(lecture)}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(lecture._id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CourseLecturesManager;
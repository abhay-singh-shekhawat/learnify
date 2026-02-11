import { useState } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const cloud_name = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

const UpdateLectureForm = ({ lecture, onSuccess, onCancel }) => {
  const [title, setTitle] = useState(lecture.Title || '');
  const [description, setDescription] = useState(lecture.Description || '');
  const [videoFile, setVideoFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error('Title is required');

    setLoading(true);

    try {
      let videoUrl = lecture.videoUrl;
      let publicId = lecture.publicId;

      if (videoFile) {
        const sigRes = await api.get(`/api-v1/course/upload/${lecture.Course}/cloud-signature`);
        const { timestamp, signature, api_key } = sigRes.data;

        const formData = new FormData();
        formData.append('file', videoFile);
        formData.append('api_key', api_key);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);
        formData.append('folder', `lectures/${lecture.Course}`);
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

      await api.patch(`/api-v1/course/lecture/update/${lecture._id}`, {
        Title: title,
        Description: description,
        videoUrl,
        publicId,
      });

      toast.success('Lecture updated successfully');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Update failed');
      console.error('Update lecture error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Lecture Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="video">Update Video (optional)</Label>
        <Input
          id="video"
          type="file"
          accept="video/*"
          onChange={(e) => setVideoFile(e.target.files[0])}
        />
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update Lecture'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default UpdateLectureForm;
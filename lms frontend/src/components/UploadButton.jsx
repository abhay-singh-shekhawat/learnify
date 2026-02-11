import { useState } from 'react'
import api from '../utils/api.js'
import { toast } from 'react-toastify'

const cloud_name = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME

const UploadButton = ({ courseId, onUploadSuccess, type = 'lecture' }) => {
  const [file, setFile] = useState(null);

  const handleUpload = async () => {
    if (!file) return;

    try {
      const sigRes = await api.get(`/api/v1-course/upload/${courseId}/cloud-signature`);
      const { timestamp, signature, cloud_name, api_key } = sigRes.data;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", api_key);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);
      formData.append("folder", `lectures/${courseId}`);
      formData.append("resource_type", "video");

      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/video/upload`, {
        method: "POST",
        body: formData
      });
      const cloudData = await cloudRes.json();

      if (cloudData.secure_url) {
        onUploadSuccess(cloudData);  // pass back url, public_id, duration
        toast.success('Upload successful');
      } else {
        toast.error('Upload failed');
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} accept="video/*" />
      <button onClick={handleUpload} className="bg-blue-600 text-white p-2 rounded">Upload {type}</button>
    </div>
  );
};

export default UploadButton;
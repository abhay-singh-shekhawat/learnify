import { Lecture } from "../models/lecture.js"
import { asyncHandeler } from "../utils/asyncHandeler.js"
import { api_error } from "../utils/errorhandeller.js"
import { Course } from "../models/course.js"
import cloudinary from "../utils/cloudinary.config.js"
import mongoose from "mongoose"

const getCLoudinarySignature = asyncHandeler(async(req,res,next)=>{
    const courseId = req.params.courseId;

    if (!courseId) {
    throw new api_error(400, "courseId is required");
    }

    const courseid = mongoose.Types.ObjectId.isValid(courseId)
    if(!courseid){
        throw new api_error(400,"invalid course id format")
    }

    const course = await Course.findOne({
    _id: courseId,
    Teacher: req.user._id
    });

    if (!course) {
    throw new api_error(403, "You are not allowed to upload lectures for this course");
    }

    const timestamp = Math.round(Date.now() / 1000);

    const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder: `lectures`,
      // resource_type: "video"
    },
    process.env.CLOUDINARY_API_SECRET
    );
   
    res.json({
    timestamp,
    signature,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY
    });
})

const uploadLecture = asyncHandeler(async(req,res,next)=>{
    const courseId = req.params.courseId;
    const { Title , videoUrl , publicId , Duration} = req.body

    if(!Title || !videoUrl || !publicId || !Duration){
        throw new api_error(400,"title , video url , public id and Duration are required")
    }

    const courseid = mongoose.Types.ObjectId.isValid(courseId)
    if(!courseid){
        throw new api_error(400,"invalid course id format")
    }

    const course = await Course.findOne({
        _id : courseId,
        Teacher : req.user._id
    })
    if(!course){
        throw new api_error(404,"you are not authorised to upload course here")
    }
    const lecture = await Lecture.create({
        Title,
        videoUrl,
        publicId,
        Duration : Number(Duration),
        Course : course._id,
        Teacher : req.user._id
    })
    res.status(200)
    .json({
        lecture,
        success : true,
        message : "lecture uploaded successfully"
    })
})

const updateLecture = asyncHandeler(async (req, res) => {
  const { lectureId } = req.params;
  const teacherId = req.user._id;
  const { Title, Description, videoUrl, publicId, Duration } = req.body;

  const lecture = await Lecture.findOne({
    _id: lectureId,
    Teacher: teacherId  // only owner can update
  });

  if (!lecture) {
    throw new api_error(404, "Lecture not found or you don't have permission");
  }

  // Update only provided fields
  if (Title) lecture.Title = Title;
  if (Description) lecture.Description = Description;
  if (videoUrl) lecture.videoUrl = videoUrl;
  if (publicId) lecture.publicId = publicId;
  if (Duration) lecture.Duration = Duration;

  await lecture.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Lecture updated successfully",
    lecture
  });
});

const deleteLecture = asyncHandeler(async (req, res , next) => {
    const lecture = await Lecture.findOne({
    _id: req.params.lectureId,
    Teacher: req.user._id
    });
    
    const course = await Course.findById(lecture.Course)

    if(course.Teacher.toString() !== lecture.Teacher.toString()){
        throw new api_error(401,"unauthorised request for upload")
    }

    if (!lecture) {
    throw new api_error(404, "Lecture not found");
    }

    try {
        await cloudinary.uploader.destroy(lecture.publicId, {
        resource_type: "video",
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        cloud_name : process.env.CLOUDINARY_CLOUD_NAME
        });
    } catch (error) {
        throw new api_error(500,`${error}`)
    }

    await lecture.deleteOne();

    res.json({ success: true });
});

export {getCLoudinarySignature , uploadLecture , deleteLecture  , updateLecture}
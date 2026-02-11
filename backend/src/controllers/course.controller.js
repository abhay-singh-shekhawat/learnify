import { Course } from "../models/course.js";
import {asyncHandeler} from "../utils/asyncHandeler.js"
import { api_error } from "../utils/errorhandeller.js";
import {Catagory} from "../models/catagory.js"
import {User} from "../models/user.js"
import mongoose from "mongoose"
import cloudinary from "../utils/cloudinary.config.js"
import { Lecture } from "../models/lecture.js";

const getCLoudinarySignatureForCourseThumbnail = asyncHandeler(async(req,res,next)=>{
    const Teacher = req.user._id
    if(!Teacher){
        throw new api_error(404,"you are not allowed to create course")
    }
    
    const timestamp = Math.round(Date.now() / 1000);
    
    const signature = cloudinary.utils.api_sign_request(
    {
        timestamp,
        folder: `course`,
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

const createCourse = asyncHandeler(async(req,res,next)=>{
    const {Title ,ThumbnailUrl , publicId, Description , Price , categoryId ,Tags , Level , isPublished } = req.body;
    if(!Title || !categoryId || !Level ){
        throw new api_error(400,"tittle , catagory , level and accessibility type are required")
    }
    const foundCatagory = await Catagory.findById(categoryId);
    if(!foundCatagory){
        throw new api_error(404,"catagory not found")
    }
    const user = req.user;
    const isApproved = user.isApproved;
    if(!isApproved){
        throw new api_error(401,"you are not approved to upload courses")
    }
    const course = await Course.create({
        Title,
        Teacher : user._id,
        Description : Description || "",
        Price : Price || 0,
        Thumbnail : ThumbnailUrl,
        publicId,
        Catagory : categoryId,
        Tags : Tags || [],
        Level,
        isPublished
    })
    res
    .status(201)
    .json({
        course,
        message : "course created",
        success : true
    })
})

const getMyCourses = asyncHandeler(async(req,res,next)=>{
    const teacherId = req.user._id;
    const allMyCourses = await Course.find({Teacher : teacherId}).sort({createdAt : -1}).lean()
    res.status(200)
    .json({
        message : "all courses has fetched",
        success : true,
        allMyCourses
    })
})

const getDetailsOfMyCourse = asyncHandeler(async(req,res,next)=>{
    const user = req.user
    const courseId = req.params.courseId;

    const valid = mongoose.Types.ObjectId.isValid(courseId)
    if(!valid){
        throw new api_error(400,"invalid id format")
    }

    const getDetailsOfCourse = await Course.findOne({Teacher : user._id, _id : courseId})
    const lectures = await Lecture.find({Teacher : user._id, Course : courseId})
    if(!getDetailsOfCourse){
        throw new api_error(404,"course not found");
    }
    res.status(200)
    .json({
        success : true,
        message : "course fetched successfully",
        getDetailsOfCourse,
        lectures
    })
})

const updateCourse = asyncHandeler(async(req,res,next)=>{
    const valid = mongoose.Types.ObjectId.isValid(req.params.courseId)
    if(!valid){
        throw new api_error(400,"invalid id format")
    }

    const course1 = await Course.findOne({
      _id : req.params.courseId,
      Teacher : req.user._id
    })
    if(!course1){
        throw new api_error(404,"course not found")
    }
    await cloudinary.uploader.destroy(course1.publicId, {
            resource_type: "image",
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            cloud_name : process.env.CLOUDINARY_CLOUD_NAME
            });

    const course = await Course.findOneAndUpdate({
        _id : req.params.courseId,
        Teacher : req.user._id
    },{
        $set : req.body
    },{
        new : true
    })
    
    res.status(200)
    .json({
        success : true,
        message : "course upate successfully",
        course
    })
})
const publishCourse = asyncHandeler(async(req,res,next)=>{
    const valid = mongoose.Types.ObjectId.isValid(req.params.courseId)
    if(!valid){
        throw new api_error(400,"invalid id format")
    }
    const course = await Course.findOne({
        _id : req.params.courseId,
        Teacher : req.user._id
    })
    if(!course){
        throw new api_error(404,"course not found to publish")
    }
    if (course.isPublished) {
        return res.status(400).json({ success: false, message: "Course is already published" });
    }

    const published = await Course.findOneAndUpdate({
        _id : req.params.courseId,
        Teacher : req.user._id
    },{
        $set : {isPublished : true}
    },{
        new : true
    })
    
    res.status(200)
    .json({
        success : true,
        message : "course published successfully",
        public : published.isPublished
    })
})

const deleteCourse = asyncHandeler(async(req,res,next)=>{
    const valid = mongoose.Types.ObjectId.isValid(req.params.courseId)
    if(!valid){
        throw new api_error(400,"invalid id format")
    }

    const Delete = await Course.findOneAndDelete({_id : req.params.courseId , Teacher : req.user._id})
    if(!Delete){
        throw new api_error(404,"course not found to delete")
    }
    res.status(200)
    .json({
        success : true,
        message : "course deleted successfully"
    })
})

const getTeacherStats = asyncHandeler(async (req, res) => {
  const teacherId = req.user._id;

  // Get teacher's course IDs
  const teacherCourses = await Course.find({ Teacher: teacherId }).select('_id');
  const courseIds = teacherCourses.map(c => c._id);

  if (courseIds.length === 0) {
    return res.status(200).json({
      success: true,
      stats: {
        totalCourses: 0,
        totalStudents: 0,
        totalIncome: 0,
        teacherShare: 0,
        averageRating: 0
      }
    });
  }

  const stats = await Enrollment.aggregate([
    {
      $match: {
        Course: { $in: courseIds },
        status: 'active'
      }
    },

    {
      $group: {
        _id: null,
        uniqueStudents: { $addToSet: "$Student" },
        totalEnrollments: { $sum: 1 }                   
      }
    },

    {
      $lookup: {
        from: "orders",
        let: { courseIds: courseIds },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $in: ["$Course", "$$courseIds"] },
                  { $eq: ["$status", "succeeded"] }
                ]
              }
            }
          },
          { $group: { _id: null, totalAmount: { $sum: "$Amount" } } }
        ],
        as: "orders"
      }
    },
    {
      $project: {
        totalCourses: { $size: courseIds },
        totalStudents: { $size: "$uniqueStudents" },
        totalIncome: { $ifNull: [{ $arrayElemAt: ["$orders.totalAmount", 0] }, 0] },
        teacherShare: {
          $multiply: [{ $ifNull: [{ $arrayElemAt: ["$orders.totalAmount", 0] }, 0] }, 0.7] 
        }
      }
    }
  ]);

  // Get average rating
  const avgRatingResult = await Course.aggregate([
    { $match: { Teacher: teacherId } },
    { $group: { _id: null, avgRating: { $avg: "$Rating" } } }
  ]);

  const avgRating = avgRatingResult[0]?.avgRating?.toFixed(1) || '0.0';

  res.status(200).json({
    success: true,
    stats: {
      totalCourses: stats[0]?.totalCourses || 0,
      totalStudents: stats[0]?.totalStudents || 0,
      totalIncome: stats[0]?.totalIncome || 0,
      teacherShare: stats[0]?.teacherShare || 0,
      averageRating: avgRating
    }
  });
});

export {createCourse , getMyCourses , getDetailsOfMyCourse , publishCourse , deleteCourse , updateCourse , getCLoudinarySignatureForCourseThumbnail
    , getTeacherStats
}
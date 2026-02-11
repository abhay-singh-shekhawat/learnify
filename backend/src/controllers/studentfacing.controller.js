import { Course } from "../models/course.js";
import { Enrollment } from "../models/enrollment.js";
import { Lecture } from "../models/lecture.js";
import { User } from "../models/user.js";
import { asyncHandeler } from "../utils/asyncHandeler.js";
import { api_error } from "../utils/errorhandeller.js";
import mongoose from "mongoose";

const getAllPublishedCourses = asyncHandeler(async(req,res,next)=>{
    const page = parseInt(req.query.page) || 1 ;
    const limit = parseInt(req.query.limit) || 10 ;
    const skip = (page-1)*limit;

    const allPublishedCourses = await Course.find({isPublished : true})
    .sort({createdAt : -1})
    .skip(skip)
    .limit(limit)
    .populate("Catagory","Name Slug")
    .populate("Teacher","Name Avatar")
    .lean()

    const total = await Course.countDocuments({isPublished : true})

    res.status(200)
    .json({
        message : allPublishedCourses.length >0 ? "all courses fetched" : "no course found",
        count : allPublishedCourses.length,
        success : true,
        allPublishedCourses,
        totalCourses : total,
        totalPage : Math.ceil(total/limit),
        currentPage : page
    })
})

const getSinglePublishedCourseDetails = asyncHandeler(async (req, res) => {
    const courseId = req.params.courseId;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new api_error(400, "Invalid course ID format");
    }

    const course = await Course.findOne({
        _id: courseId,
        isPublished: true
    })
    .populate("Catagory", "Name Slug")
    .populate("Teacher", "Name Avatar")
    .lean();

    if (!course) {
        throw new api_error(404, "Published course not found");
    }

    const lectures = await Lecture.find({ Course: courseId })
    .select("-videoUrl -publicId -Course -Teacher")
    .sort({ createdAt: 1 })
    .lean();

    res.status(200)
    .json({
        message: "Course details fetched successfully",
        success: true,
        course,
        lectures 
    });
});

const getSinglePublishedCourseDetailsAfterLogin = asyncHandeler(async(req,res,next)=>{
    
    const student = await User.findById(req.user?._id)

    const courseId = req.params.courseId
    const courseid = mongoose.Types.ObjectId.isValid(courseId)
    if(!courseid){
           throw new api_error(400,"invalid course id format")
    }
        
    const course = await Course.findOne({
        _id : courseId,
        isPublished : true
    })
    .populate("Catagory","Name Slug")
    .populate("Teacher","Name Avatar")
    .lean()

    if(!course){
        throw new api_error(404,"course not found")
    }

    const enrollment = await Enrollment.findOne({
        Student : student._id,
        Course : course._id
    })
    
    if(!enrollment || enrollment?.Status !== "active"){
        const lectures = await Lecture.find({
            Course : courseId
        })
        .select("-videoUrl -publicId -Course -Teacher")
        .sort({createdAt : 1})
        .lean()

        return res.status(200)
                .json({
                message : "course details fethced successfully",
                success : true,
                course,
                lectures
        })
    }
    const lectures = await Lecture.find({
            Course : courseId
        })
        .sort({createdAt : 1})
        .lean()
    
    res.status(200)
    .json({
        message : "course details fetched successfully",
        success : true,
        course,
        lectures
    })
})

const allMyEnrolledCourses = asyncHandeler(async (req, res, next) => {
  const studentId = req.user._id;

  const enrolled = await Enrollment.find({
    Student: studentId,
    Status: 'active'  
  })
  .populate({
    path: 'Course',
    select: 'Title Thumbnail Description Teacher totalLectures totalDuration isPublished',
    populate: {
      path: 'Teacher',
      select: 'Name Avatar'
    }
  })
  .sort({ createdAt: -1 })
  .lean();

  const validEnrolled = enrolled.filter(enroll => enroll.Course !== null);

  res.status(200).json({
    success: true,
    message: validEnrolled.length > 0 ? "Enrolled courses fetched" : "No enrolled courses found",
    enrolledCourses: validEnrolled
  });
});

const allLectures = asyncHandeler(async(req,res,next)=>{
    const {courseId} = req.params;
    const enrollment = await Enrollment.findOne({
        Course: courseId,
        Student: req.user._id,
        Status: "active"
    });
    if(!enrollment) {
        throw new api_error(403, "You must be enrolled to watch this lecture");
    }

    const lectures = await Lecture.find({
        Course: courseId
    }).lean();

    res.status(200)
    .json({
      success: true,
      message: lectures.length > 0 ? "all lectures fetched" : "No lecture in this course",
      lectures
    })

})

const getLectureForWatching = asyncHandeler(async (req, res) => {
    const { courseId, lectureId } = req.params;
    const courseid = mongoose.Types.ObjectId.isValid(courseId)
    if(!courseid){
        throw new api_error(400,"invalid course id format")
    }

    const enrollment = await Enrollment.findOne({
        Course: courseId,
        Student: req.user._id,
        Status: "active"
    });

    if(!enrollment) {
        throw new api_error(403, "You must be enrolled to watch this lecture");
    }

    const lecture = await Lecture.findOne({
        _id: lectureId,
        Course: courseId
    }).lean();

    if(!lecture) {
    throw new api_error(404, "Lecture not found in this course");
  }

    res.status(200)
    .json({
        success: true,
        lecture: {
        _id: lecture._id,
        Title: lecture.Title,
        Duration: lecture.Duration,
        videoUrl: lecture.videoUrl,
        Description : lecture.Description 
    }
  });
});

const searchAndFilter = asyncHandeler(async (req, res) => {
    const {
    q = '',
    catagory,
    level,
    minPrice,
    maxPrice,
    sort = 'newest',
    page = 1,
    limit = 12,
  } = req.query;

    const query = { isPublished: true };

    if (q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      query.$or = [
        { Title: regex },
        { Description: regex },
        { Tags: regex }, 
      ];
    }

    if (catagory && mongoose.Types.ObjectId.isValid(catagory)) {
      query.Catagory = catagory;
    }

    if (level && ['beginner', 'intermediate', 'advanced'].includes(level.toLowerCase())) {
      query.Level = level.toLowerCase();
    }

    if (minPrice || maxPrice) {
      query.Price = {};
      if (minPrice && !isNaN(Number(minPrice))) {
        query.Price.$gte = Number(minPrice);
      }
      if (maxPrice && !isNaN(Number(maxPrice))) {
        query.Price.$lte = Number(maxPrice);
      }
    }

    let sortOption = { createdAt: -1 }; 
    switch (sort) {
      case 'rating':
        sortOption = { Rating: -1, numReviews: -1 };
        break;
      case 'price-low':
        sortOption = { Price: 1 };
        break;
      case 'price-high':
        sortOption = { Price: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 12)); // cap at 50
    const skip = (pageNum - 1) * limitNum;

    try {

      const courses = await Course.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .populate('Catagory', 'Name Slug')
      .populate('Teacher', 'Name Avatar')
      .select('Title Description Thumbnail Price Rating numReviews totalLectures totalDuration Level Tags Catagory Teacher createdAt')
      .lean();

      const total = await Course.countDocuments(query);

    res.status(200).json({
      success: true,
      message: courses.length > 0 ? 'Courses found' : 'No courses match your search',
      count: courses.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      courses,
    });
  } catch (err) {
      console.error('Search error:', err);
      res.status(500).json({
      success: false,
      message: 'Server error while searching courses',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

export { getAllPublishedCourses , getSinglePublishedCourseDetails ,getSinglePublishedCourseDetailsAfterLogin , allMyEnrolledCourses 
    , getLectureForWatching , searchAndFilter , allLectures
}
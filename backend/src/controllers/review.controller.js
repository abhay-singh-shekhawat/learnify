import { User } from "../models/user.js";
import { Course } from "../models/course.js";
import { Enrollment } from "../models/enrollment.js";
import { Review } from "../models/review.js";
import { asyncHandeler } from "../utils/asyncHandeler.js";
import { api_error } from "../utils/errorhandeller.js";
import mongoose from "mongoose";

const submitReview = asyncHandeler(async (req, res) => {
    const courseId = req.params.courseId;
    const { Rating, Comment } = req.body;

    if (!Rating || Rating < 1 || Rating > 5) {
        throw new api_error(400, "Rating must be between 1 and 5");
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new api_error(400, "Invalid course ID");
    }

    const course = await Course.findOne({
        _id: courseId,
        isPublished: true
    });

    if (!course) {
        throw new api_error(404, "Course not found or not published");
    }

    const enrollment = await Enrollment.findOne({
        Student: req.user._id,
        Course: courseId,
        Status: "active"  
    });

    if (!enrollment) {
        return res.json({ message : "You must be enrolled in this course to review it"});
    }

    const alreadyReviewed = await Review.findOne({
        Student: req.user._id,
        Course: courseId
    })

    if(alreadyReviewed){
        return res.json({ message : "you already reviewed this course" })
    }

    const review = await Review.create({
        Student: req.user._id,
        Course: courseId,
        Rating,
        Comment: Comment || ""
    });

    const updatedCourse = await Course.findById(courseId).lean();

    res.status(201)
    .json({
        success: true,
        message: "Review submitted successfully",
        review,
        course: {
            Rating: updatedCourse.Rating,
            numReviews: updatedCourse.numReviews
        }
    });
});

const getAllReviews = asyncHandeler(async(req,res,next)=>{
    const {courseId} = req.params
    const ownreview = await Review.findOne({
        Course : courseId,
        Student : req.user?._id
    })
    const reviews = await Review.find({Course : courseId})
    
    res.status(200)
    .json({
        message : reviews.length>0 ? "reviews fetched successfully" : "course have no reviews",
        ownreview,
        reviews
    })
})

const deleteReview = asyncHandeler(async(req,res,next)=>{
    const {courseId} = req.params

    await Review.findOneAndDelete({
        Course : courseId,
        Student : req.user._id
    })

    res.status(200)
    .json({
        message : "review deleted successfully"
    })
})

export { submitReview , getAllReviews , deleteReview}
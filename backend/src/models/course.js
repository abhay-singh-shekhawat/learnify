import mongoose from "mongoose"
import { Lecture } from "./lecture.js"
import { Review } from "./review.js"
const courseSchema = new mongoose.Schema({
    Title : {
        type : String,
        required : true,
        trim : true,
        index : true
    },
    Thumbnail : {
        type : String,
        default : ""
    },
    publicId: { 
        type: String, 
        required: true 
    },
    Description : {
        type : String,
        default : "",
    },
    Price : {
        type : Number,
        required : true,
        default : 0,
        min : 0
    },
    Teacher : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true,
        index : true
    },
    Catagory : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Catagory",
        index : true
    },
    Tags : {
        type : [String],
        default : []
    },
    Level : {
        type : String,
        required : true,
        enum : ["beginner","intermediate","advanced"],
    },
    Rating : {
        type : Number,
        required : true,
        default : 1,
        min : 1,
        max : 5
    },
    numReviews: {  
        type: Number,
        default: 0
    },
    isPublished : {
        type : Boolean,
        required : true,
        default : false,
        index : true
    },
    totalDuration : {
        type : Number,
        default : 0
    },
    totalLectures : {
        type : Number,
        default : 0
    }

},{timestamps : true})

courseSchema.index({ isPubliished: 1, Rating: -1 });
courseSchema.index({ Price: 1 });
courseSchema.index({ Tags: 1 });

courseSchema.pre("remove",async function(next){
    try {
        const courseid = this._id
        await Promise.all([
        mongoose.model("Lecture").deleteMany({Course : courseid}),
        mongoose.model("Review").deleteMany({Course : courseid}),
        mongoose.model("Enrollment").deleteMany({Course : courseid}),
        mongoose.model("Order").deleteMany({Course : courseid})
        ])
        next()
    } catch (error) {
        console.log("error happened while deleting a course")
        next(error)   
    }
})

const Course = mongoose.model("Course",courseSchema)

export {Course}
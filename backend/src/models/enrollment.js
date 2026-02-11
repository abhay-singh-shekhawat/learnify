import mongoose from "mongoose"
import { api_error } from "../utils/errorhandeller.js";

const enrollmentSchema = new mongoose.Schema({
    Student : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    },
    Course : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Course"
    },
    Teacher : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true,
        index : true
    },
    Status : {
        type : String,
        enum : ["active","pending"],
        default : "active"
    },
    enrolledAt : {
        type : Date,
        default : new Date(),
        required : true,
    },
    completedAt : {
        type : Date,
        default : null
    },
    Progress : [{
        lectureId : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Lecture"
        },
        Completed : {
            type : Boolean,
            default : false
        }
    }],
    paymentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      sparse: true,
    }
},{timestamps : true})
enrollmentSchema.index({ Student: 1, Course: 1 }, { unique: true });


enrollmentSchema.pre("save",async function(next){
    const alreadyExist = await this.constructor.findOne({
        Student : this.Student,
        Course : this.Course
    })
    if(alreadyExist){
        throw new api_error(400,"you are enrolled to this course already")
    }
})
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

const Enrollment = mongoose.model("Enrollment",enrollmentSchema);

export {Enrollment}
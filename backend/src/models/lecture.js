import mongoose from "mongoose"
import {Course} from "./course.js"
const lectureSchema = new mongoose.Schema({
    Title : {
        type : String,
        required : true,
    },
    videoUrl: { 
        type: String, 
        required: true 
    },
    publicId: { 
        type: String, 
        required: true 
    },
    Duration : {
        type : Number,
        required : true
    },
    Description : {
        type : String
    },
    Course : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Course",
        required : true
    },
    Teacher : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    }
},{timestamps : true})

async function courseUpdate(courseId){

    const id = new mongoose.Types.ObjectId(courseId);
    const course = await Course.findById(id)
    if(!course) return;

    const group = await Lecture.aggregate([{
        $match : {Course : id}
    },
    {
        $group : {
            _id : null,
            totalDuration : { $sum : "$Duration" },
            totalLectures : { $sum : 1 }
        }
    }
])
    course.totalDuration = group[0]?.totalDuration || 0
    course.totalLectures = group[0]?.totalLectures || 0
    await course.save();
}

lectureSchema.post("save",async function(doc){
    await courseUpdate(doc.Course)
})

lectureSchema.post("findOneAndUpdate",async function(doc){
    if(doc) {
        await courseUpdate(doc.Course)
    }
})

lectureSchema.post("findOneAndDelete",async function(doc){
    if(doc) {
        await courseUpdate(doc.Course)
    }    
})

const Lecture = mongoose.model("Lecture",lectureSchema)

export {Lecture}
import mongoose from "mongoose";
import { api_error } from "../utils/errorhandeller.js";

const reviewSchema = new mongoose.Schema({
  Student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  Course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true
  },
  Rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  Comment: {
    type: String,
    trim: true,
    maxlength: 1000
  }
}, { timestamps: true });

reviewSchema.index({ Student: 1, Course: 1 }, { unique: true });

reviewSchema.index({ Rating: -1 });      
reviewSchema.index({ Course: 1 });       
reviewSchema.index({ createdAt: -1 });   

async function updateCourseReviews(courseId) {
  const stats = await mongoose.model("Review").aggregate([
    { $match: { Course: courseId } },
    {
      $group: {
        _id: "$Course",
        averageRating: { $avg: "$Rating" },
        numReviews: { $sum: 1 }
      }
    }
  ]);

  const average = stats.length > 0 ? stats[0].averageRating : 0;
  const numRev = stats.length > 0 ? stats[0].numReviews : 0;

  await mongoose.model("Course").findByIdAndUpdate(courseId, {
    Rating: Math.round(average * 10) / 10,
    numReviews: numRev
  });
}

reviewSchema.post("save", async function (doc) {
  await updateCourseReviews(doc.Course);
});

reviewSchema.post("remove", async function (doc) {
  await updateCourseReviews(doc.Course);
});

const Review = mongoose.model("Review", reviewSchema);

export { Review };
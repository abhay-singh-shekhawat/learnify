import { deleteReview, getAllReviews, submitReview } from "../controllers/review.controller.js"
import { protect } from "../middlewares/auth.middleware.js"
import express from "express"

const router = express.Router()

router.post("/submit-review/:courseId",protect,submitReview)
router.get("/get-review/:courseId",getAllReviews)
router.delete("/delete-review/:courseId",protect, deleteReview)

export default router
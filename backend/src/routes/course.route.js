import { createCourse , getMyCourses , getDetailsOfMyCourse , publishCourse , deleteCourse , updateCourse , getCLoudinarySignatureForCourseThumbnail
    , getTeacherStats
} from "../controllers/course.controller.js";
import express from "express"
import { protect , authorise } from "../middlewares/auth.middleware.js";

const router = express.Router()

router.post("/create-course",protect , authorise("teacher") , createCourse)
router.get("/get-cloudinary-signature-course-thumbnail",protect , authorise("teacher") , getCLoudinarySignatureForCourseThumbnail)
router.get("/all-my-courses",protect , authorise("teacher") , getMyCourses)
router.get("/teacher-stats",protect , authorise("teacher") , getTeacherStats)
router.get("/my-course-details/:courseId",protect , authorise("teacher") , getDetailsOfMyCourse )
router.patch("/publish-course/:courseId",protect , authorise("teacher") , publishCourse)
router.delete("/delete-course/:courseId",protect , authorise("teacher") , deleteCourse)
router.put("/update-course/:courseId",protect , authorise("teacher") , updateCourse)

export default router
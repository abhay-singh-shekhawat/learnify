import {getAllPublishedCourses , getSinglePublishedCourseDetails ,getSinglePublishedCourseDetailsAfterLogin , allMyEnrolledCourses 
    , getLectureForWatching , searchAndFilter, 
    allLectures} from "../controllers/studentfacing.controller.js"
import { protect } from "../middlewares/auth.middleware.js"
import express from "express"

const router = express.Router()

router.get("/get-all-courses",getAllPublishedCourses)
router.get("/get-course-detail/:courseId",getSinglePublishedCourseDetails)
router.get("/get-course-detail-login/:courseId",protect,getSinglePublishedCourseDetailsAfterLogin)
router.get("/all-my-enrolled-course",protect,allMyEnrolledCourses)
router.get("/course/:courseId/lecture-url/:lectureId",protect,getLectureForWatching)
router.get("/course/:courseId/lectures",protect,allLectures)
router.get("/search-filter",searchAndFilter)

export default router
import {enrollcourse , verifyPayment} from "../controllers/enrollment.controller.js"
import { protect  , authorise } from "../middlewares/auth.middleware.js"
import express from "express"

const router = express.Router()

router.get("/get-razorpay-signature/:courseId",protect,enrollcourse)
router.post("/verify-payment/:courseId",protect,verifyPayment)

export default router
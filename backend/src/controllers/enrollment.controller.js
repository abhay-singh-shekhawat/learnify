import { Enrollment } from "../models/enrollment.js";
import { Order } from "../models/order.js";
import {Course} from "../models/course.js"
import mongoose from "mongoose"
import { asyncHandeler } from "../utils/asyncHandeler.js";
import { api_error } from "../utils/errorhandeller.js";
import crypto from "crypto"

import razorpay from "razorpay"
const getRazorpayInstance = () => {
    return new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

const enrollcourse = asyncHandeler(async(req,res,next)=>{
    const studentId = req.user?._id;
    const courseId = req.params?.courseId;
    if (!studentId) {
        throw new api_error(401, "User not authenticated");
    }
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
        throw new api_error(400, "Invalid student ID");
    }
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
        throw new api_error(400, "Invalid or missing course ID");
    }

    const course = await Course.findById(req.params?.courseId)
    if(!course){
        throw new api_error(404,"no course found")
    }
    if(course.Teacher.toString() === studentId.toString()){
        return res.json({message : "You cannot enroll in your own courses"})
    }

    const alreadyEnrolled = await Enrollment.findOne({
        Student: studentId,
        Course: courseId
    });
    if (alreadyEnrolled) {
        return res.json({ message : "You are already enrolled in this course"});
    }
    
    if(course.Price === 0){
        console.log("Creating enrollment with:", { Student: studentId, Course: courseId });
        const enrolled = await Enrollment.findOneAndUpdate({
            Student : studentId,
            Course : courseId 
        },{ $set : {
            Teacher : course.Teacher,
            Status : "active",
            createdAt : new Date()
        }
        },{
            upsert : true,
            new : true,
            runValidators: true
        })
        return res.status(200)
        .json({
            success : true,
            message : "user enrolled successfully",
            enrolled,
        })
    }
    const Razorpay = getRazorpayInstance()
    const razorpayOrder = await Razorpay.orders.create({
        amount : course.Price*100,
        currency : "INR"
    })

    const order = await Order.create({
        Student : studentId,
        Course : courseId,
        Teacher : course.Teacher,
        Amount : course.Price,
        razorpayOrderId : razorpayOrder.id
    })
    res.status(200)
    .json({
        orderId : razorpayOrder.id,
        amount : course.Price,
        key_id : process.env.RAZORPAY_KEY_ID
    })
})

const verifyPayment = asyncHandeler(async(req,res,next)=>{
    const { razorpay_payment_id , razorpay_order_id , razorpay_signature } = req.body

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto.createHmac("sha256",process.env.RAZORPAY_SECRET)
    .update(body)
    .digest("hex")

    if(expectedSignature !== razorpay_signature){
        throw new api_error(402,"payment validation failed")
    }

    const order = await Order.findOne({ razorpayOrderId : razorpay_order_id})
    order.razorpayPaymentId = razorpay_payment_id
    order.Status = "succeeded"
    order.Enrolled = true
    await order.save()

    await Enrollment.create({
        Student : req.user._id,
        Course : order.Course,
        Teacher : order.Teacher,
        Status : "active",
        paymentOrder : order._id
    })

    res.status(200)
    .json({
        message : "payment validation done successfully",
    })
})

export {enrollcourse , verifyPayment}
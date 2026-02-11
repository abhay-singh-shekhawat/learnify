import mongoose from "mongoose"

const orderSchema = new mongoose.Schema({
    Student : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    Course : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Course",
        required : true
    },
    Teacher : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true,
        index : true
    },
    Amount : {
        type : Number,
        required : true
    },
    Currency : {
        type : String,
        required : true,
        default : "INR"
    },
    razorpayOrderId : {          // ← razorpay order id
      type: String,
      sparse: true,
      unique: true,
    },
    razorpayPaymentId : {
        type : String,
        unique : true,
        sparse : true
    },
    Status : {
        type : String,
        enum : ["pending","succeeded","failed","refunded"],
        default : "pending"
    },
    orderDate : {
        type : Date,
        default : Date.now()
    },
    Enrolled : {
        type : Boolean,
        default : false
    }
},{timestamps : true})

const Order = mongoose.model("Order",orderSchema)

export {Order}
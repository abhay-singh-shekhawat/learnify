import mongoose from "mongoose"
import bcrypt from "bcrypt"

const userSchema = new mongoose.Schema({
    Name : {
        type : String,
        required : true,
        trim : true
    },
    Email : {
        type : String,
        required : [true,"email is required"],
        unique : true,
        lowercase : true,
        trim : true
    },
    Password : {
        type : String,
        required : true,
        select : false
    },
    Avatar : {
        type : String,
        default : ""
    },
    publicId: { 
        type: String, 
        required: true ,
        default : ""
    },
    isApproved : {
        type : Boolean,
        default : false
    },
    Role : {
        type : String,
        enum : ["student","teacher","admin"],
        default : "student"
    },
    Otp : {
        type : String,
        default : ""
    },
    otpExpiry : {
        type : Date,
        default : new Date()
    },
    otpVerify : {
        type : Boolean,
        default : false
    }
},{timestamps : true})

userSchema.pre("save", async function(){
    if(this.isModified("Password")) return this.Password = await bcrypt.hash(this.Password,12)
})

userSchema.pre("save", async function(next){
    if(this.Role == "teacher"){
        this.isApproved = false;
    }
    if(this.Role == "student" || this.Role == "admin"){
        this.isApproved = true;
    }
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

const User = mongoose.model("User",userSchema)
export {User}
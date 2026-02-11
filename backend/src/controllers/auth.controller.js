import bcrypt from "bcrypt"
import {asyncHandeler} from "../utils/asyncHandeler.js"
import { api_error } from "../utils/errorhandeller.js"
import {User} from "../models/user.js"
import {generateAccessToken} from "../utils/generateAccessToken.js"
import cloudinary from "../utils/cloudinary.config.js"
import { sendOtp } from "../utils/sendotp.js"

const getCLoudinarySignatureForUserAvatar = asyncHandeler(async(req,res,next)=>{
    const timestamp = Math.round(Date.now() / 1000);
    
    const signature = cloudinary.utils.api_sign_request(
    {
        timestamp,
        folder: `user/avatar`,
    },
    process.env.CLOUDINARY_API_SECRET
    );
    
    res.json({
    timestamp,
    signature,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY
    });
})

const register = asyncHandeler(async (req,res,next)=>{
    const { Name, Email, Password, Role , Avatar , publicId} = req.body;

    if (!Name || !Email || !Password) {
      throw new api_error(400,"name , email ,password are required")
    }

    const otp = await sendOtp(Email)
    const hashedOtp = await bcrypt.hash(otp,10)
    const expiry = new Date(Date.now() + 2*60*1000)

    const existingUser = await User.findOne({ Email });

    if(existingUser){
      if (existingUser?.otpVerify) {
        throw new api_error(400,"user with this email already exist")
      }
      
      if(!existingUser?.otpVerify){
        existingUser.Name = Name
        existingUser.Email = Email
        existingUser.Password = Password
        existingUser.Role = Role
        existingUser.Avatar = Avatar
        existingUser.publicId = publicId
        existingUser.Otp = hashedOtp
        existingUser.otpExpiry = expiry
        await existingUser.save()

        return res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: {
          id: existingUser._id,
          Name: existingUser.Name,
          Email: existingUser.Email,
          Role: existingUser.Role,
          isApproved: existingUser.isApproved,
        },
        });
      }
    }

    const user = await User.create({
      Name,
      Email,
      Password,
      Role: Role || "student",
      Avatar,
      publicId,
      Otp : hashedOtp,
      otpExpiry : expiry
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        Name: user.Name,
        Email: user.Email,
        Role: user.Role,
        isApproved: user.isApproved,
      },
    });
});

const verifyOtp = asyncHandeler(async(req,res,next)=>{
    const {Otp , Email}= req.body
    if(!Otp || !Email){
      throw new api_error(401,"otp and Email are required")
    }

    const user = await User.findOne({Email})
    if(!user){
      throw new api_error(404,"user not found")
    }

    const verifiedOtp = await bcrypt.compare(Otp , user?.Otp)
    if(!verifiedOtp){
      return res.json({message : "otp is incorrect"})
    }
    if(user.otpExpiry < new Date()){
      return res.json({ message : "otp is expired"})
    }

    user.otpVerify = true
    await user.save({validateBeforeSave : false})
    const token = generateAccessToken(user);
        
    res.status(200)
    .json({
      message : "email verified successfully",
      token,
      user: {
        id: user._id,
        Name: user.Name,
        Email: user.Email,
        Role: user.Role,
        isApproved: user.isApproved,
      },
    })
})

const resendOtp = asyncHandeler(async(req,res,next)=>{
    const { Email } = req.body
    const user = await User.findOne({Email})
    if(!user){
      throw new api_error(404,"user not found")
    }
    const otp = await sendOtp(Email)
    const hashedOtp = await bcrypt.hash(otp,10)
    const expiry = new Date(Date.now()+2*60*1000)

    user.Otp = hashedOtp
    user.otpExpiry = expiry
    await user.save({validateBeforeSave : false})
    res.status(200)
    .json({
      message : "otp sent successfully"
    })
})

const login = asyncHandeler(async (req,res,next)=>{
    const { Email, Password } = req.body;

    if (!Email || !Password) {
      throw new api_error(400,"email and password is required")
    }

    const user = await User.findOne({ Email }).select("+Password");
    if (!user) {
      throw new api_error(401,"user not found")
    }

    const isPasswordCorrect = await bcrypt.compare(Password,user.Password)
    if (!isPasswordCorrect) {
      throw new api_error(401,"invalid email or password")
    }

    const token = generateAccessToken(user)

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        Name: user.Name,
        Email: user.Email,
        Role: user.Role,
        isApproved: user.isApproved,
      },
    });
})

const updateProfile = asyncHandeler(async (req, res) => {
    const userId = req.user._id;
    const { Name, Avatar, Email, publicId} = req.body;

    const user = await User.findById(userId);
    if (!user) {
      throw new api_error(404, "User not found");
    }
    if(Avatar && user.publicId){
    await cloudinary.uploader.destroy(user?.publicId, {
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            cloud_name : process.env.CLOUDINARY_CLOUD_NAME
            });
    }
    if (Name) user.Name = Name;
    if (Avatar) user.Avatar = Avatar;
    if (Email) user.Email = Email;
    if (publicId) user.publicId = publicId;

    await user.save()

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        Name: user.Name,
        Email: user.Email,
        Avatar: user.Avatar,
        Role: user.Role,
        isApproved: user.isApproved
      }
    });
});

const me = asyncHandeler(async(req,res,next)=>{
    const user = await User.findById(req.user._id)
    .select("-Password")
    if(!user){
      throw new api_error(404,"user not found")
    }
    res.json({
      user
    })
})
const logout = asyncHandeler(async (req, res) => {
  
    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0), 
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    });


    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
});

export {register , login , logout , getCLoudinarySignatureForUserAvatar , updateProfile ,me , verifyOtp , resendOtp }
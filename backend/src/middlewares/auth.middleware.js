import jwt from "jsonwebtoken"
import {asyncHandeler} from "../utils/asyncHandeler.js"
import {api_error} from "../utils/errorhandeller.js"
import {User} from "../models/user.js"
const protect = asyncHandeler(async(req,res,next)=>{
    try {
        const token = req.headers.authorization;
        if (!token || !token.startsWith("Bearer ")) {
          throw new api_error(401, "No token provided");
        }
        const Token = token?.split(" ")[1];
        const decoded = jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET);
        if(!decoded){
            throw new api_error(400,"token is expired or incorrect")
        }
        const user = await User.findById(decoded.id);
        if(!user){
            throw new api_error(401,"user not found")
        }
        req.user = user
        next();
    } catch (error) {
        console.log("there is error in auth middleware",error)
        next(error)
    }
})

const authorise = (...roles)=>{
    return (req,res,next)=>{
        if(!roles.includes(req.user.Role) &&  !req.user.Role.isApproved ){
            throw new api_error(403,"you are not authorised to access these features")
        }
        next();
    }
}

export { protect, authorise};
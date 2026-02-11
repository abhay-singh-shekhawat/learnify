import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { register, login , logout , getCLoudinarySignatureForUserAvatar, updateProfile, me, verifyOtp, resendOtp} from "../controllers/auth.controller.js";

const router = express.Router();

router.get("/get-cloudinary-signature-avatar",getCLoudinarySignatureForUserAvatar)
router.get("/me" , protect , me)
router.post("/register",register);
router.patch("/update-profile", protect , updateProfile);
router.post("/login",login);
router.post("/logout",logout);
router.post("/verify-otp",verifyOtp);
router.post("/resend-otp",resendOtp);

export default router;
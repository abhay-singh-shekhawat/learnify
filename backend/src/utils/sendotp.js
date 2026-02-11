import nodemailer from "nodemailer"
import { generateOtp } from "./generateOtp.js"

const sendOtp = async function (email){
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, 
  auth: {
    user: process.env.SERVER_EMAIL,
    pass: process.env.SERVER_PASS,
  },
});


    const otp = generateOtp(6)
    const info = await transporter.sendMail({
    from: '"Learnify" <learnify69@ethereal.email>',
    to: email,
    subject: "Your One-Time Password",
    text: `your otp is ${otp}`,
    html: `<p>Your OTP is: <strong>${otp}</strong>.</p>`, 
  });
    console.log("Message sent:", info.messageId);
    return otp;
}

export { sendOtp }
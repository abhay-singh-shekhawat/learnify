import express from "express"
import cors from "cors"
import cookieParser from 'cookie-parser';

const app = express();
app.use(cors({
  origin: [
    'http://localhost:3000',   
    'http://localhost:5173',     
    'http://127.0.0.1:3000',  
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization'], 
  credentials: true, 
  preflightContinue: false,
  optionsSuccessStatus: 204 
}));
app.use(express.json({limit: "20kb"}))

app.use(express.urlencoded({extended: true ,
    limit: "20kb"
}))

app.use(express.static("public"));

app.use(cookieParser())

// router user
import userRegister from "./src/routes/auth.route.js";
app.use("/api-v1/user",userRegister);

// router course
import teachercourse from "./src/routes/course.route.js"
app.use("/api-v1/course",teachercourse)

// router lecture
import lecture from "./src/routes/lecture.route.js";
app.use("/api-v1/course/upload",lecture)

// router enrollment
import enrollment from "./src/routes/enrollment.route.js"
app.use("/api-v1/course/enrollment",enrollment)

// router review
import review from "./src/routes/review.route.js"
app.use("/api-v1/course/review",review)

// router student facing
import studentfacing from "./src/routes/studentfacing.route.js"
app.use("/api-v1/dashboard",studentfacing)

export default app;
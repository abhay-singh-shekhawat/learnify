import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import cookieParser from "cookie-parser"
import app from "./app.js"
import {connect} from "./src/db/connect.js"
dotenv.config()

connect();
const port = process.env.PORT || 5000

app.listen(port , ()=>{
    console.log(`app is running on http://localhost:${port}`);
})


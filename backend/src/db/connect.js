import mongoose from "mongoose";
const connect = async ()=>{
   try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("db is connected")
   } catch (error) {
    console.log("error in db connection",error)
   }
}

export { connect }
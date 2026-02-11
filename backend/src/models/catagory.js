import mongoose from "mongoose"
import slugify from "slugify"

const catagorySchema = new mongoose.Schema({
    Name : {
        type : String,
        required : true,
        unique : true,
    },
    Slug : {
        type : String,
        required : true,
        unique : true
    },
    Thumbnail : {
        type : String,
    },
    Description : {
        type : String,
        default : "",
    }
},{ timestamps : true})

catagorySchema.pre("save",function(){
    if(this.isModified("Name")){
        this.Slug = slugify(this.Name, { lower: true, strict: true });
        return next();
    }
})

const Catagory = mongoose.model("Catagory",catagorySchema);
export {Catagory}
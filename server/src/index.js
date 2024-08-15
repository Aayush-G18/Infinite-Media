import dotenv from "dotenv"
import mongoose from "mongoose";
import {DB_NAME} from "./constants.js"
import connectDB from "./db/index.js"
import {app} from "./app.js"

const PORT=process.env.PORT||8000

dotenv.config({
    path:'./.env'
})
connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log("ERRORL",error);
        throw error;
    })
    app.listen(PORT,()=>{
        console.log(`Server is running at port ${PORT}`);
    })
})
.catch((err)=>{
    console.log("MongoDB connection failed!!",err);
})
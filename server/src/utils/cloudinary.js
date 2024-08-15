import {v2 as cloudinary} from "cloudinary"
import fs from "node:fs"
import ApiError from "./ApiError.js";
import { log } from "node:console";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY , 
    api_secret:  process.env.CLOUDINARY_API_SECRET // Click 'View Credentials' below to copy your API secret
});

const uploadOnCloudinary=async (localFilePath)=>{
    try {
        if (!localFilePath) return null;
        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        // console.log("File has been uploaded on cloudinary",response.url);
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath)
        console.log(error?.message||"something went wrong while uploading resource"); 
        return null;       
    }
}


const deleteImageFromCloudinary=async(publicUrlOfImage)=>{
    try {
        if(!publicUrlOfImage){
            throw new ApiError(404,"No URL found")
        }
        const response=await cloudinary.uploader.destroy(publicUrlOfImage?.split('/').pop().split('.')[0],{resource_type:"image"})
        console.log("Image Deleted successfully:");
        return response;

} catch (error) {
    throw new ApiError(400,error?.message||"Something went wrong while deleting Image from Cloudinary")    
}
}

//destroy requires to specify type of resource to delete i.e auto is not valid
const deleteVideoFromCloudinary=async(publicUrlOfVideo)=>{
    try {
        if(!publicUrlOfVideo){
            throw new ApiError(404,"No Video URL found")
        }
        const response=await cloudinary.uploader.destroy(publicUrlOfVideo?.split('/').pop().split('.')[0],{resource_type:"video"})
        console.log("Video Deleted successfully:");
        return response;

} catch (error) {
    throw new ApiError(400,error?.message||"Something went wrong while deleting Video from Cloudinary")    
}
}
export {uploadOnCloudinary,deleteImageFromCloudinary,deleteVideoFromCloudinary}
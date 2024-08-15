import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import {deleteImageFromCloudinary,deleteVideoFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const aggregate=Video.aggregate([
    {
        $project:{
            thumbnail:1,
            title:1,
            duration:1,
            views:1,
            owner:1,
            videoFile:1,
            updatedAt:1,
            createdAt:1
        }
    },
    {
        $sort:{
            createdAt:-1,
            updatedAt:-1
        }
    }
    ])
    
    const allVideos=await Video.aggregatePaginate(aggregate,{page,limit});
    if(!allVideos){
        throw new ApiError(404,"No videos found")
    }
    return res.status(200)
    .json(new ApiResponse(
        200,
        allVideos,
        "All videos fetched successfully"
    ))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if(!title){
        throw new ApiError(400,"Missing Video title")
    }
    const thumbnailUrl=await uploadOnCloudinary(req.files?.thumbnail[0].path)

    const videoUrl=await uploadOnCloudinary(req.files?.videoFile[0].path)
    if (!videoUrl||!thumbnailUrl){
        throw new ApiError(400,"No video or thumbnail url found")
    }    
    const video=await Video.create({
        title,
        description,
        videoFile:videoUrl.url,
        thumbnail:thumbnailUrl.url,
        views:0,
        isPublished:true,
        owner:req.user?._id,
        duration:videoUrl.duration
    })
    if(!video){
        throw new ApiError(500,"Something went wrong while trying to publish a video")
    }
    return res.status(200)
    .json(new ApiResponse(
        200,
        video,
        "Video published successfully"
    ))

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"No valid videoID found")
    }
    const video=await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"No video found for this ID")
    }
    return res.status(200)
    .json(new ApiResponse(
        200,
        video,
        "Video fetched successfully"
    ))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {newTitle,newDescription}=req.body
    //TODO: update video details like title, description, 
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video ID")
    }
    if(!newTitle||!newDescription){
        throw new ApiError(400,"Required title or description is missing")
    }
    const oldVideo=await Video.findById(videoId)
    if(!oldVideo){
        throw new ApiError(404,"No video with that videoId found")
    }
    if(!(oldVideo.owner.toString()===req.user?._id.toString())){
        throw new ApiError(400,"You do not have permission to edit this video's details")
    }

    const video=await Video.findByIdAndUpdate(
        videoId,
        {$set:{
            title:newTitle,
            description:newDescription
        }},
        {new:true}
    )
    if(!video){
        throw new ApiError(500,"Something went wrong while trying to update video Details")
    }
    return res.status(200)
    .json(new ApiResponse(
        200,
        video,
        "Video updated successfully"
    ))
})

const updateVideoThumbnail=asyncHandler(async(req,res)=>{
    const {videoId}=req.params
    const thumbnailLocalPath=req.file?.thumbnail[0].path
    if(!thumbnailLocalPath||!(isValidObjectId(videoId))){
        throw new ApiError(400,"Invalid videoId or Thumbnail Path")
    }
    const oldVideo=await Video.findById(videoId)
    if(!oldVideo){
        throw new ApiError(404,"Could not find corresponding video to that ID")
    }
    const oldPublicUrlOfThumbnail=oldVideo?.thumbnail;
    if(!(oldVideo.owner.toString()===req.user?._id.toString())){
        throw new ApiError(400,"You do not have permission to update Thumbnail")
    }
    const thumbnail=await uploadOnCloudinary(thumbnailLocalPath);
    if(!thumbnail){
        throw new ApiError(500,"Something went wrong while trying to upload Thumbnail")
    }
    const video=await Video.findByIdAndUpdate(
        videoId,
        {$set:{
            thumbnail:thumbnail.url
        }},
        {new:true}
    )
    if(!video){
        throw new ApiError(500,"something went wrong while trying to update thumbnail")
    }
    await deleteImageFromCloudinary(oldPublicUrlOfThumbnail);
    res.status(200)
    .json(new ApiResponse(
        200,
        video,
        "Thumbnail updated successfully"
    ))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid VideoId")
    }
    const oldVideo=await Video.findById(videoId);
    if(!oldVideo){
        throw new ApiError(404,"No video found at that videoID")
    }
    if(!(oldVideo.owner.toString()===req.user?._id.toString())){
        throw new ApiError(401,"You do not have permission to delete the video")
    }
    const thumbnail=oldVideo.thumbnail
    const video=oldVideo.videoFile
    if(!thumbnail||!video){
        throw new ApiError(404,"Missing  thumbnail or video to delete")
    }
    await deleteImageFromCloudinary(thumbnail)
    await deleteVideoFromCloudinary(video)

    await Video.findByIdAndDelete(videoId)

    return res.status(200)
    .json(new ApiResponse(
        200,
        {},
        "Video Deleted Successfully"
    ))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid videoId")
    }
    
    const video=await Video.findById(videoId)
    
    if(!(video.owner.toString()===req.user._id.toString())){
        throw new ApiError(400,"You do not have permission to edit this video")
    }
    const currentPublishStatus=video.isPublished
    const updatedVideo=await Video.findByIdAndUpdate(
        videoId,
        {$set:{
            isPublished:!currentPublishStatus
        }},
        {new:true}
    )
    if(!updatedVideo){
        throw new ApiError(500,"Something went wrong while updating publish status")
    }
    return res.status(200)
    .json(new ApiResponse(
        200,
        updatedVideo,
        "Video Publish status updated successfully"
    ))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    updateVideoThumbnail
}
import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if (!videoId){
        throw new ApiError(400,"no videoId recieved")
    }
    const likeCheck=await Like.findOne({
        video:videoId,
        likedBy:req.user._id
    }).exec()
    let like;
    let message;
    if (!likeCheck){
            like=await Like.create({
            video:videoId,
            likedBy:req?.user._id
        });
        message="Liked Video"
    }
    else{
    await Like.findByIdAndDelete(likeCheck._id)
    message="Removed Liked Video"
}
    return res.status(200)
    .json(new ApiResponse(
        200,
        likeCheck?{}:like,
        message
    ))

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    try {
        const {commentId} = req.params
        //TODO: toggle like on comment
        if (!commentId){
            throw new ApiError(400,"no commentId recieved")
        }
        const commentCheck=await Like.findOne({
            comment:commentId,
            likedBy:req.user._id
        })
        let like;
        let message;
        if (!commentCheck){
                like=await Like.create({
                comment:commentId,
                likedBy:req?.user._id
            });
            message="Liked Comment"
        }
        else{
        await Like.findByIdAndDelete(commentCheck._id)
        message="Removed Liked Comment"
    }
        return res.status(200)
        .json(new ApiResponse(
            200,
            commentCheck?like:{},
            message
        ))
    
    } catch (error) {
        throw new ApiError(500,error?.message||"Something went wrong trying to like the comment")
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const {page=1,limit=10}=req.query
    const aggregate=Like.aggregate([
        {
            $match:{
                likedBy:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"videoDetails"
            }
        },{
            $unwind:"$videoDetails"
        },{
            $project:{
                videoId:"$videoDetails._id",
                title:"$videoDetails.title",
                thumbnail:"$videoDetails.thumbnail",
                owner:"$videoDetails.owner",
                createdAt:1,
                updatedAt:1
            }
        }
    ])
    const likedVideos=await Like.aggregatePaginate(aggregate,{page,limit})
    const likedCount=await Like.countDocuments({likedBy:req.user._id})
    return res.status(200)
    .json(new ApiResponse(
        200,
        {likedVideos,likedCount},
        "All liked videos fetched succesfully!"
    ))

})

export {
    toggleCommentLike,
    toggleVideoLike,
    getLikedVideos
}
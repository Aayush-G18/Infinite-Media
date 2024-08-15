import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    
    if(!videoId){
        throw new ApiError(401,"No Video ID obtained")
    }

    const aggregate=Comment.aggregate([
        {$match:
            {
                video:new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner"
            }
        },{
            $unwind:"$owner"
        },{
            $project:{
                content:1,
                owner:{
                    _id:1,
                    userName:1,
                    avatar:1
                },
                createdAt:1,
                updatedAt:1
            }
        }
    ])
    const comments=await Comment.aggregatePaginate(aggregate,{page,limit})
    const commentCounts=await Comment.countDocuments({video:videoId})
    return res.status(200)
    .json(
        new ApiResponse(200,{comments,commentCounts},"All comments of a video fetched successfully")
    )
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
        try {
            const {videoId}=req.params
            const {content}=req.body
        
            if(!videoId){
                throw new ApiError(400,"Missing videoId")
            }
            if(!req?.user){
                throw new ApiError(400,"Missing user")
            }
            if(!content){
                throw new ApiError(400,"Missing content")
            }


        
            const comment=await Comment.create({
                content,
                owner:req.user._id,
                video:videoId
            })
            return res.status(200)
            .json(new ApiResponse(
                200,
                comment,
                "Comment added Successfully"
            ))
        } catch (error) {
            throw new ApiError(500,error?.message||"Error while trying to add comment")
        }
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
        const {commentID}=req.params
        const {newContent}=req.body
        
        if(!commentID){
            throw new ApiError(400,"Missing Comment ID ")
        }
        
        if(!newContent){
            throw new ApiError(400,"Missing newContent ")
        }
        
        const oldComment=await Comment.findById(commentID);
        if (oldComment.owner.toString()!==req.user?._id.toString()){
            throw new ApiError(403,"You do not have permission to edit this comment")
        }

        const comment=await Comment.findByIdAndUpdate(
            commentID,
            {$set:
                {
                    content:newContent
                },
            },
            {new:true}
        )
    
        return res.status(200)
        .json(new ApiResponse(
            200,
            comment,
            "Comment updated Successfully"
        ))
    
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

        const {commentID}=req.params
        if (!commentID){
            throw new ApiError(400,"No CommentId Found")
        }
        const comment=await Comment.findById(commentID);
        if (comment.owner.toString()!==req.user?._id.toString()){
            throw new ApiError(403,"You do not have permission to delete this comment")
        }
        await Comment.findByIdAndDelete(commentID)
        return res.status(200)
        .json(new ApiResponse(
            200,
            {},
            "Comment deleted Successfully"
        ))

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }
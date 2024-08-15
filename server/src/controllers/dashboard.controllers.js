import mongoose, { isValidObjectId } from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import { getUserChannelSubscribers } from "./subscription.controllers.js"

const getChannelStats = (async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const {owner}=req.params
    if(!isValidObjectId(owner)){
        throw new ApiError(400,"Invalid channelID")
    }
    const [videoStats]=await Video.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(owner),
                isPublished:true
            }
        },{
            $group:{
                _id:null,
                totalVideoViews:{$sum:"views"},
                totalVideos:{$sum:1}
            }
        }
    ])    
    const {totalVideos=0,totalVideoViews=0}=videoStats||{}

    const totalLikes=await Like.aggregate([
        {
            $match:{
                video:{$in:await Video.find({owner:owner}).distinct('_id')}
            }
        },{
            $group:{
                _id:null,
                totalLikes:{$sum:1}
            }
        },{
            $project:{
                totalLikes:1
            }
        }
    ])
    const totalSubscribers=await Subscription.aggregate([{
        $match:{
            channel:owner
        }
    },{
        $count:"totalSubscribers"
    }])
    return res.status(200)
    .json(new ApiResponse(
        200,
        {totalVideoViews,totalLikes,totalVideos,totalSubscribers},
        "Channel Stats fetched successfully"
    ))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const {page=1,limit=10}=req.query
    const {owner}=req.params
    if(!isValidObjectId(owner)){
        throw new ApiError(400,"Invalid ChannelId")
    }
    const aggregate=Video.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(owner),
                isPublished:true
            }
        },{
            $project:{
                videoFile:1,
                thumbnail:1,
                updatedAt:1,
                createdAt:1,
                title:1,
                duration:1,
                views:1
            }
        },{
            $sort:{
                createdAt:-1,
                updatedAt:-1
            }
        }
    ])
    let videos=await Video.aggregatePaginate(aggregate,{page,limit})
    let message;
    if(videos.docs.length<1){
        videos={},
        message="This channel has 0 videos"
    }
    message="Videos from channel fetched successfully"
    return res.status(200)
    .json(new ApiResponse(
        200,
        videos,
        message
    ))
})

export {
    getChannelStats, 
    getChannelVideos
    }
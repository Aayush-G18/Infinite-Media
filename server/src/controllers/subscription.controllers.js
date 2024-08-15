import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {subscriberId} = req.params
    // TODO: toggle subscription
    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400,"not a valid channel ID")
    }
    const existingSubscription=await Subscription.findOne({
        channel:subscriberId,
        subscriber:req.user?._id
    })
    let responseMessage;
    let newSubscription;
    if (existingSubscription){
        await Subscription.deleteOne({_id:existingSubscription._id})
        responseMessage="Unsubscribed successfully"
    }
    else{
        newSubscription=await Subscription.create({
        channel:subscriberId,
        subscriber:req.user?._id
    })
    responseMessage="Subscribed successfully"
}
    return res.status(200)
    .json(new ApiResponse(
        200,
        newSubscription?newSubscription:{},
        responseMessage
    ))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {subscriberId} = req.params
    const {page=1,limit=10}=req.query

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400,"Invalid channelID")
    }
    const aggregate=Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(subscriberId)
            }
        },{
            $sort:{
                updatedAt:-1
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscribersDetails"
            }
        },
        {
            $unwind:"$subscribersDetails"
        },
        {
            $project:{
                subscribersDetails:{
                    userName:1,
                    avatar:1,
                    email:1
                },
                updatedAt:1
            }
        }
    ])
    const subscribers=await Subscription.aggregatePaginate(aggregate,{page,limit})
    const subscribersCount=await Subscription.countDocuments({subscriber:subscriberId})
    if(!subscribers){
        throw new ApiError(500,"Something went wrong while trying to get subscribers")
    }

    return res.status(200)
    .json(new ApiResponse(
        200,
        {subscribers,subscribersCount},
        "Subscribers fetched successfully"
    ))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    const {page=1,limit=10}=req.query

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400,"Not a valid subscriberID")
    }
    const aggregate=Subscription.aggregate([
        {
            $match:{
                subscriber:new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $sort:{
                updatedAt:-1
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"subscribedToDetails"
            }
        },
        {$unwind:"$subscribedToDetails"},
        {
            $project:{
                subscribedToDetails:{
                    userName:1,
                    email:1,
                    avatar:1
                },
                updatedAt:1
            }
        }
    ])
    const channelSubscribedTo=await Subscription.aggregatePaginate(aggregate,{page,limit})
    const channelSubscribedToCount=await Subscription.countDocuments({subscriber:subscriberId})
    if(!channelSubscribedTo){
        throw new ApiError(500,"something went wrong while trying to fetcch the channels Subscribed to")
    }
    return res.status(200)
    .json(new ApiResponse(
        200,
        {channelSubscribedTo,channelSubscribedToCount},
        "Channels subscribed to fetched successfully"
    ))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
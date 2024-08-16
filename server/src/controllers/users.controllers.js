import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary,deleteImageFromCloudinary } from "../utils/cloudinary.js"
import ApiResponse from "../utils/ApiResponse.js"
import jwt  from "jsonwebtoken"
import mongoose, { mongo } from "mongoose"

const options={httpOnly:true,secure:true};

const generateAccessAndRefreshTokens=async(userId)=>{
    try {
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken();
        const refreshToken=user.generateRefreshToken();
        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})
        return {accessToken,refreshToken};

    } catch (error) {
        throw new ApiError(500,error?.message||"Something went wrong while generating access and refresh tokens")
    }
}

const registerUser=asyncHandler(async (req,res)=>{
  //get user details from frontend
  const {userName,email,fullName,password}=req.body
  
  //validation-not empty
    if(
        [fullName,email,userName,password].some((field)=>
        field?.trim()==="")
    ){
        throw new ApiError(400,"All fields are required")
    }
    //check if usr already exists:username,email
    const existedUser=await User.findOne({
        $or:[{userName},{email}]
    })
    if (existedUser){
        throw new ApiError(409,"User already exists")
    }
    //check for images,avatar
    const avatarLocalPath=req.files?.avatar[0]?.path
    // const coverImageLocalPath=req.files?.coverImage[0]?.path;

    // let coverImageLocalPath;
    // if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
    //     coverImageLocalPath=req.files.coverImage[0].path
    // }
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    //upload images to cloudinary

    const avatar=await uploadOnCloudinary(avatarLocalPath)
    // const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    
    if(!avatar){
        throw new ApiError(400,"Avatar file is required while uploading to cloudinary")
    }

    //create user object-create entry in db

    const user= await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:"",
        email,
        password,
        userName:userName.toLowerCase()
    })
    //remove pwd and refreshToken field for response
    //check for user creation

    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }
    //return res
    return res.status(201).json(
        new ApiResponse(200,createdUser,"USer registered successfully")
    )

})
const loginUser=asyncHandler(async(req,res)=>{
    //get user details from frontend

    const {email,password,userName}=req.body;
    //validation
    if(!email && !userName){
        throw new ApiError(400,"All fields are required")
    }
    //find the user
    const user=await User.findOne({
        $or:[{userName},{email}]
    })
    if (!user){
        throw new ApiError(404,"invalid username/email")
    }
    //check password
    const isPasswordValid=await user.isPasswordCorrect(password) 
    if (!isPasswordValid){
        throw new ApiError(401,"Invalid password")
    }
    // console.log("userid :",user._id);
    //generate access &refresh Token
    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)
    //send cookie
    const loggedInUser=await User.findById(user._id)
    .select("-refreshToken -password")

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {user:loggedInUser,accessToken,refreshToken},
            "User logged in successfully"
        )
    )

})

const logOutUser=asyncHandler(async(req,res)=>{
        
        await User.findByIdAndUpdate(
        req.user._id,
        {$unset:{refreshToken:1}},
        {new:true}
    )

        return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options)
        .json(new ApiResponse(200,{},"User logged out Successfully"))
    }
)

const refreshAccessToken=asyncHandler(async(req,res)=>{
    try {
        const incomingRefreshToken=req.cookies?.refreshToken||req.body?.refreshToken;
        if(!incomingRefreshToken){
            throw new ApiError(401,"Unauthorized Request")
        }
        const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        
        const user=await User.findById(decodedToken?._id)
        if (!user){
            throw new ApiError(401,"Invalid refresh Token")
        }
        if(incomingRefreshToken!==user?.refreshToken){
            throw new ApiError(401,"Refresh token is used or invalid")
        }
    
        const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
        return res.status(200)
        .cookie("accessToken",accessToken)
        .cookie("refreshToken",newRefreshToken)
        .json(new ApiResponse(
            200,
            {accessToken,refreshToken:newRefreshToken},
            "Access token refreshed"
        ))
    } catch (error) {
        throw new ApiError(401,error?.message||"Invalid Refresh Token")
    }
})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body;
    const user=await User.findById(req.user?._id);
    const isPasswordValid=await user.isPasswordCorrect(oldPassword);
    if (!isPasswordValid){
        throw new ApiError(400,"Invalid Password ")
    }
    user.password=newPassword;
    await user.save({validate:false})
    return res.status(200)
    .json(new ApiResponse(
        200,
        {},
        "Password Changed Successfully"
    ))
})

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(new ApiResponse(
        200,req.user,"Current User Data fetched succesfully!"
    ))
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    try {
        const {fullName,email}=req.body;
        
        if(!fullName||!email){
            throw new ApiError(400,"All fields are required")
        }
        
        const user=await User.findByIdAndUpdate(
            req.user?._id,
            {$set:{fullName,email}},
            {new:true}
        ).select("-password -refreshToken")
    
        return res.status(200)
        .json(new ApiResponse(200,user,"Account Details updated Successfully"))
    } catch (error) {
        throw new ApiError(400,error?.message||"Issues while updating")
    }
})

const updateAvatar=asyncHandler(async(req,res)=>{
    
    const avatarLocalPath=req.file?.path
    const test=await User.findById(req.user?._id)
    const oldPublicUrlOfImage = test.avatar;

    if  (!avatarLocalPath){
        throw new ApiError(400,"Avatar File is missing")
    }
    
    const avatar=await uploadOnCloudinary(avatarLocalPath)
    
    if (!avatar){
        throw new ApiError(400,"Error while updating Avatar")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{avatar:avatar.url}
        },
        {new:true}
    ).select("-password")
    
    await deleteImageFromCloudinary(oldPublicUrlOfImage);
    
    res.status(200)
    .json(new ApiResponse(
        200,
        user,
        "Avatar updated Successfully"
    ))
})

const updateCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path
    
    const test=await User.findById(req.user?._id)
    const oldPublicUrlOfImage = test.coverImage?.split('/').pop().split('.')[0];

    if  (!coverImageLocalPath){
        throw new ApiError(400,"Cover Image File is missing")
    }
    
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)
    
    if (!coverImage){
        throw new ApiError(400,"Error while updating Cover Image")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{coverImage:coverImage.url}
        },
        {new:true}
    ).select("-password")

    await deleteImageFromCloudinary(oldPublicUrlOfImage);

    res.status(200)
    .json(new ApiResponse(
        200,
        user,
        "Cover Image updated Successfully"
    ))
})

const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {userName} = req.params

    if (!userName?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                userName: userName?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})

const getWatchHistory=asyncHandler(async(req,res)=>{
    const user=await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        userName:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },{
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200)
    .json(new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch History fetched Successfully"
    ))
})

export {
    registerUser,
    loginUser,
    logOutUser, 
    changeCurrentPassword,
    refreshAccessToken,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory
}

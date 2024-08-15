import mongoose, {Types, isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    if(!name){
        throw new ApiError(401,"Missing playlist name")
    }  
    const playlist=await Playlist.create({
        name,
        description,
        owner:new mongoose.Types.ObjectId(req.user._id)
    })
    if(!playlist){
        throw new ApiError(500,"Something went wrong trying to create new playlist")
    }

    return res.status(200)
    .json(new ApiResponse(
        200,
        playlist,
        "New Playlist created successfully"
    ))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    const {page=1,limit=10}=req.query
    
    //TODO: get user playlists
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"the userid is invalid")
    }
    const aggregate=Playlist.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },{
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"allVideos"
            }
        },{
            $unwind:{
                path:"$allVideos",
                preserveNullAndEmptyArrays:true
            }
        },
        {
            $group:{
                _id:"$_id",
                name:{$first:"$name"},
                description:{$first:"description"},
                owner: { $first: "$owner" },
                videos: { $push: "$allVideos" }, 
                createdAt: { $first: "$createdAt" },
                updatedAt: { $first: "$updatedAt" }
            }
        },{
            $sort:{
                updatedAt:-1
            }
        }
    ]) 
    const playlists=await Playlist.aggregatePaginate(aggregate,{page,limit}) 
    
    return res.status(200)
    .json(new ApiResponse(
        200,
        playlists,
        "User Playlists fetched successfully"
    ))
    
})

const getPlaylistById = asyncHandler(async (req, res) => {
        const {playlistId} = req.params
        const {page=1,limit=10}=req.query
        //TODO: get playlist by id
        if(!isValidObjectId(playlistId)){
            throw new ApiError(400,"Invalid playlistID")
        }
        const aggregate=Playlist.aggregate([{
            $match:{
            _id:new mongoose.Types.ObjectId(playlistId) 
            }
        },{
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"allVideos"
            }
        },{
            $unwind:"$allVideos"
        },{
            $project:{
                _id: 1,
                    name: 1,
                    description: 1,
                    owner: 1,
                    allVideos: {
                        _id: 1,
                        title: 1,
                        description: 1,
                        videoFile: 1,
                        thumbnail: 1,
                        duration: 1,
                        views: 1,
                        isPublished: 1
                    }
                }
            }
    ])
        const playlist=await Playlist.aggregatePaginate(aggregate,{page,limit})
        
        if(!playlist){
            throw new ApiError(400,"No Playlist found")
        }
        return res.status(200)
        .json(new ApiResponse(
            200,
            playlist,
            "Playlist fetched succesfully"
        ))

    })

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId)||!isValidObjectId(videoId)){
        throw new ApiError(400,"Missing appropriate playlistId or videoId")
    }
    const playlist=await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(400,"No playlist found")
    }
    if(playlist.videos.includes(videoId)){
        throw new ApiError(400,"The video is already in the playlist")
    }
    playlist.videos.push(videoId);
    await playlist.save();

    return res.status(200)
    .json(new ApiResponse(
        200,
        playlist,
        "Video added to playlist successfully"
    ))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {

        const {videoId,playlistId} = req.params
        // TODO: remove video from playlist
        if (!isValidObjectId(playlistId)||!isValidObjectId(videoId)){
            throw new error(400,"Playlist id or videoID not appropriate/found")
        }
        const playlist=await Playlist.findById(playlistId)
        if(!playlist){
            throw new ApiError(400,"No playlist found")
        }
        if (!playlist.videos.includes(videoId)) {
            throw new Error('Video not found in the playlist');
        }
        playlist.videos = playlist.videos.filter(video => video.toString() !== videoId.toString());
        await playlist.save();

        return res.status(200)
        .json(new ApiResponse(
            200,
            playlist,
            "video removed from playlist"
        ))
        
    

}) 

const deletePlaylist = asyncHandler(async (req, res) => {
        const {playlistId} = req.params
        // TODO: delete playlist
        if(!isValidObjectId(playlistId)){
            throw new ApiError(400,"Did not recieve a valid playlistID")
        }
        const playlist=await Playlist.findById(playlistId);
        if(playlist.owner.toString()!==req.user._id.toString()){
            throw new ApiError(400,"You cannot delete this playlist as you are not the owner of this playlist")
        }
    
        await Playlist.findByIdAndDelete(playlistId);
        return res.status(200)
        .json(new ApiResponse(
            200,
            {},
            "Playlist deleted successfully"
        ))
     
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Not a valid playlistId")
    }
    const oldPlaylist=await Playlist.findById(playlistId)
    if(!oldPlaylist){
        throw new ApiError(404,"oldPlaylist not found")
    }

    if(oldPlaylist.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"You are not allowed to edit this playlist as oyu are not the owner")
    }
    const updates={}
    if(name && name!=oldPlaylist.name){
        updates.name=name
    }
    if(description && description!=oldPlaylist.description){
        updates.description=description
    }
    let updatedPlaylist;
    if(Object.keys(updates).length>0){
        updatedPlaylist=await Playlist.findByIdAndUpdate(
            playlistId,
            {$set:updates},
            {new:true}
        )
    }
    updatedPlaylist=oldPlaylist;
    return res.status(200)
    .json(new ApiResponse(
        200,
        updatedPlaylist,
        "playlist updated successfully"
    ))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
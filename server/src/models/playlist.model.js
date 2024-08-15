import mongoose,{Schema} from "mongoose";
import AggregatePaginate from "mongoose-aggregate-paginate-v2";

const playlistSchema=new Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
    },

    videos:[{
        type:mongoose.Types.ObjectId,
        ref:"Video"
    }],
    owner:{
        type:mongoose.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true})

playlistSchema.plugin(AggregatePaginate)

export const Playlist=mongoose.model("Playlist",playlistSchema)
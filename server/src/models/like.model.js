import mongoose,{Schema} from "mongoose";
import AggregatePaginate from "mongoose-aggregate-paginate-v2";

const likeSchema=new Schema({
    comment:{
        type:mongoose.Types.ObjectId,
        ref:"Comment"
    },
    video:{
        type:mongoose.Types.ObjectId,
        ref:"Video"
    },
    likedBy:{
        type:mongoose.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true})

likeSchema.plugin(AggregatePaginate)

export const Like=mongoose.model("Like",likeSchema)
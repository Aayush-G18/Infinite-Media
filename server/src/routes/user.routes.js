import { Router } from "express";
import {loginUser, registerUser,logOutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateAvatar, updateCoverImage, getUserChannelProfile, getWatchHistory} from "../controllers/users.controllers.js"
import {upload} from "../middlewares/multer.middlewares.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";
const router=Router()

router.route("/register").post(
    upload.fields([{name:"avatar",maxCount:1},{name:"coverImage",maxCount:1}]),
    registerUser
)
router.route("/login").post(loginUser)

//secured Routes

router.route("/logout").post(verifyJWT,logOutUser)

router.route("/refresh-Token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT,changeCurrentPassword)

router.route("/current-user").get(verifyJWT,getCurrentUser)

router.route("/update-account").patch(verifyJWT,updateAccountDetails)

router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),updateAvatar)

router.route("/update-cover-image").patch(verifyJWT,upload.single("coverImage"),updateCoverImage)


router.route("/c/:userName").get(verifyJWT,getUserChannelProfile)

router.route("/history").get(verifyJWT,getWatchHistory)






export default router;
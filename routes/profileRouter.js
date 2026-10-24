import express from 'express'
import { auth } from '../middlewares/auth.middleware'
import { getProfile, updateProfile } from '../controllers/profileController'
import {upload} from '../middlewares/uploads.middleware.js'
import {UploadProfile} from '../controllers/uploadsControler.js'
const router = express.Router()

router.get('/',auth,getProfile)

router.patch('/',auth,updateProfile)

router.patch('/profileImaeg',auth,upload,UploadProfile)

export const profileRouter=router;
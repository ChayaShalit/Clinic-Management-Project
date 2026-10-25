import express from 'express'
import Joi from 'joi';
import { phone } from './common.validator.js';
import { auth } from '../middlewares/auth.middleware.js'
import { getProfile, updateProfile } from '../controllers/profileController.js'
import {upload} from '../middlewares/uploads.middleware.js'
import {UploadProfile} from '../controllers/uploadsControler.js'
const router = express.Router()

router.get('/',auth,getProfile)

router.patch('/',auth,updateProfile)

router.put('/profileImaeg',auth,upload.single('profileImage'),UploadProfile)

export const profileRouter=router;
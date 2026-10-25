import express from 'express'
import { auth } from '../middlewares/auth.middleware.js'
import { getProfile, updateProfile } from '../controllers/profileController.js'
import { upload } from '../middlewares/uploads.middleware.js'
import { UploadProfile } from '../controllers/uploadsControler.js'
import { validate } from '../middlewares/validate.middleware.js'
import { profileSchemas } from '../validators/profile.validator.js'

const router = express.Router()

router.get('/',auth,getProfile)

router.patch('/', auth, validate(req => profileSchemas[req.currentUser.role]), updateProfile)

router.put('/imaeg',auth,upload.single('profileImage'),UploadProfile)

export const profileRouter=router;
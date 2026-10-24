import express from 'express'
import {auth,authPatient} from '../middlewares/auth.middleware.js'
import { upload} from '../middlewares/uploads.middleware.js'
import {UploadProfile} from '../controllers/uploadsControler.js'
import { getProfile } from '../controllers/profileController.js'


const router = express.Router()

router.get('/:id',auth,authPatient,getProfile);

router.put('/:id',auth,authPatient,upload.single('profileImage'), UploadProfile);


export const patientRouter = router  
import express from 'express'
import {auth} from '../middlewares/auth.middleware.js'
import {getPatientProfile} from '../controllers/patientControler.js'
import { upload } from '../middlewares/uploads.middleware.js'
import {UploadProfile} from '../controllers/uploadsControler.js'


const router = express.Router()

router.get('/:id',auth,getPatientProfile);

router.put('/:id',auth,upload.single('profileImage'), UploadProfile);


export const patientRouter = router
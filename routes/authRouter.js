import express from 'express'
import { register,logIn } from '../controllers/authControler.js'

const router = express.Router()

router.post('/login',logIn)

router.post('/register',register)

export const authRouter = router
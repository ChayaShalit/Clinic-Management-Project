import express from 'express'
import { register,logIn } from '../controllers/authControler.js'
import { validate } from '../middlewares/validate.middleware.js'
import { registerSchema, loginSchema } from '../validators/auth.validator.js'

const router = express.Router()

router.post('/login',validate(loginSchema),logIn)

router.post('/register',validate(registerSchema),register)

export const authRouter = router
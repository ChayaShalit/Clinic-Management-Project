import express from 'express'
import { createReferal,getReferalForPatient,markReferalAsRead

 } from '../controllers/referalControler'
 const router=express.Router();
 router.get('/patients/:id/referals',getReferalForPatient)
 router.post('/referals',createReferal)
 router.put('/referals/:referalId',markReferalAsRead)
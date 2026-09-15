import express from 'express'
import { createReferal,getReferalForPatient,markReferalAsRead

 } from '../controllers/referalControler.js'
 export const referalRouter=express.Router();
 referalRouter.get('/patients/:id/referals',getReferalForPatient)
 referalRouter.post('/referals',createReferal)
 referalRouter.put('/referals/:referalId',markReferalAsRead)
 export default referalRouter;
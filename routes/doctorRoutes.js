import e from 'express';
import { getDoctors } from '../controllers/doctorControler.js';

const router = e.Router();

router.get('/doctors', getDoctors);

export const doctorRouter = router;
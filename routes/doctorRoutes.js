import e from 'express';
import {getTodaysAppointments} from '../controllers/doctorControler.js';
import {auth,authDoctor} from '../middlewares/auth.middleware.js'

const router = e.Router();

router.get('/doctirs/:doctorID/today',auth,authDoctor, async (req, res) => {

    const doctorId = req.params.doctorID;
    const appointments = await getTodaysAppointments(doctorId);
    res.json(appointments);
});

export const doctorRouter = router;
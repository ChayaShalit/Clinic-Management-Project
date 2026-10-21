import e from 'express';
import {getTodaysAppointments,getDoctors} from '../controllers/doctorControler.js';
import {auth,authDoctor} from '../middlewares/auth.middleware.js'

const router = e.Router();
/** */
router.get('/doctors/:doctorID/today',auth,authDoctor, async (req, res) => {

    const doctorId = req.params.doctorID;
    const appointments = await getTodaysAppointments(doctorId);
    res.json(appointments);
});
router.get('/doctors',getDoctors)

export const doctorRouter = router;
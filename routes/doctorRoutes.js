import e from 'express';
import {getTodaysAppointments} from '../controllers/doctorController.js';
const router = e.Router();
router.get('/doctirs/:doctorID/today', async (req, res) => {
    const doctorId = req.params.doctorID;
    const appointments = await getTodaysAppointments(doctorId);
    res.json(appointments);
});
export default router;
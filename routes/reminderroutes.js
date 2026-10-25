import e from "express";
 import { sendAllTomorrowReminders, getAppointmentsForTomorrow} from "../controllers/reminderController.js";

 const router = e.Router();
  import { auth, authDoctor } from "../middlewares/auth.middleware.js";
  router.get('/tomorrow-reminders', auth, authDoctor, async (req, res, next) => {
      try { await sendAllTomorrowReminders(); res.json({ message: 'התזכורות נשלחו' }) }
      catch (err) { next(err) }
  });
 
 export const reminderRouter= router;
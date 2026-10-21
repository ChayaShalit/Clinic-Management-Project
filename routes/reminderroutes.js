import e from "express";
 import { sendAllTomorrowReminders, getAppointmentsForTomorrow} from "../controllers/reminderController.js";

 const router = e.Router();

router.get('/tomorrow-reminders', sendAllTomorrowReminders);
 
 export const reminderRouter= router;
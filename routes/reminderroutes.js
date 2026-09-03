import e
 from "express";
 import { sendAllTomorrowReminders } from "../controllers/reminderController.js";
 const router = e.Router();
 router.get('/tomorrow-reminders',getAllTomorrowReminders);
 export default router;
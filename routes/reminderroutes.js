import e from "express";
 import { getAllTomorrowReminders,sendAllTomorrowReminders } from "../controllers/reminderController.js";

 const router = e.Router();

 router.get('/tomorrow-reminders',getAllTomorrowReminders);
 
 export const reminderRouter= router;
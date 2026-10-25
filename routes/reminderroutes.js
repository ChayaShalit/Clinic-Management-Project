import e from "express";
import { runTomorrowReminders } from "../controllers/reminderController.js";
import { auth, authDoctor } from "../middlewares/auth.middleware.js";

const router = e.Router();

router.get('/tomorrow-reminders', auth, authDoctor, runTomorrowReminders);

export const reminderRouter = router;
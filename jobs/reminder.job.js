import cron from 'node-cron';
import { sendAllTomorrowReminders }  from '../controllers/reminderController.js';

export const startReminderJob = () => {
     cron.schedule('0 20 * * *', () => { sendAllTomorrowReminders(); }, { timezone: 'Asia/Jerusalem' });
     //לצורך העלה שיקלוט את השעה ביממה לפי אזור זמן
   }
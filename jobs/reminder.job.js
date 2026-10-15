import cron from 'node-cron';
import { sendAllTomorrowReminders }  from '../controllers/reminderController.js';

export const startReminderJob = () => {
    cron.schedule('0 9  *  *  *',  () => {
     
         sendAllTomorrowReminders();
    });}
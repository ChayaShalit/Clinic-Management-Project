import cron from 'node-cron';
import { sendAllTomorrowReminders  
 }  from '../controllers/reminderController.js';
 const startReminderJob = () => {
    cron.schedule('0 9 * * *',  () => {
        console.log('Running reminder job at 9 AM every day');
         sendAllTomorrowReminders();
    });}
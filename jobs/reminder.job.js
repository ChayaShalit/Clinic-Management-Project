import cron from 'node-cron';
import { sendAllTomorrowReminders }  from '../controllers/reminderController.js';

cron.schedule('0 20 * * *', async () => {
     try { await sendAllTomorrowReminders(); }
     catch (error) { console.error('[תזכורות] ההרצה נכשלה:', error.message); }
}, { timezone: 'Asia/Jerusalem' });
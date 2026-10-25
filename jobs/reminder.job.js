import cron from 'node-cron';
import { sendAllTomorrowReminders } from '../controllers/reminderController.js';

// העבודה היומית: כל יום ב-20:00 (שעון ישראל) נשלחות תזכורות לתורים של מחר.

export const startReminderJob = () => {
     cron.schedule('0 20 * * *', async () => {
          console.log('[תזכורות] מתחילה הרצה יומית');
          try {
               await sendAllTomorrowReminders();
          } catch (error) {
               console.error('[תזכורות] ההרצה נכשלה:', error.message);
          }
     }, { timezone: 'Asia/Jerusalem' });
};
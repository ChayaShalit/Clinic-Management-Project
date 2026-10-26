import Appointment from '../models/Appointment.model.js';
import { sendReminderNotification } from '../services/notification.service.js';

/**
 * @fileoverview
 * קונטרולר התזכורות: שליחת מייל תזכורת יום לפני התור
 * העבודה היומית (jobs/reminder.job.js) מפעילה אותו כל יום ב-20:00
 * אפשר להפעיל אותו גם ידנית, מהנתיב GET /api/tomorrow-reminders (רופאה בלבד)
 * המייל עצמו נבנה ונשלח בשירות המיילים (services/notification.service.js)
 */

/**
 * מה היא עושה: מחזירה את התורים של מחר שצריך לשלוח להם תזכורת
 * התנאים: התור מתקיים מחר (מתחילת היום ועד סופו), הסטטוס מאושר, המטופלת ביקשה תזכורת, ועוד לא נשלחה
 * populate מביאה גם את שם הרופאה, בשביל המייל
 * למה צריך: כדי לשלוח רק למי שצריך, ולא פעמיים לאותו תור
 * משמשת את sendAllTomorrowReminders
 *
 * @returns {Promise<Array>} התורים של מחר שממתינים לתזכורת
 */
const getAppointmentsForTomorrow = async () => {
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    return await Appointment.find({
        date: { $gte: start, $lte: end },
        status: 'confirmed',
        wantsReminder: true,
        reminderSent: { $ne: true }
    }).populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
};

/**
 * פונקציה ישנה שאינה בשימוש. נשארה מהגרסה שבה התזכורת נבנתה כאן ישירות
 * היום התזכורת נשלחת דרך sendReminderNotification בשירות המיילים, ולכן אף קוד לא קורא לפונקציה הזו
 * שימו לב: היא מתייחסת ל-transporter, CLINIC ו-buildHtml שלא מיובאים בקובץ הזה, ולכן אם תופעל היא תיכשל
 * אפשר למחוק אותה
 *
 * @param {Object} appointment התור
 * @returns {Promise<void>}
 */
const sendReminderEmail = async (appointment) => {
    const date = appointment.date.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    //מבטיח ששולח יום נכון כי התאריכים נשמרים במסד בחצות לפי UTC
    const doctor = appointment.doctorId?.userId?.name ? `ד״ר ${appointment.doctorId.userId.name}` : 'הרופא/ה';
    const mail = {
        from: `"${CLINIC}" <${process.env.EMAIL_USER}>`,
        to: appointment.patientEmail,
        subject: `תזכורת: התור שלך מחר בשעה ${appointment.time}`,
        text: `שלום ${appointment.patientName},\n\nזוהי תזכורת לתור שלך מחר, ${date} בשעה ${appointment.time}.\n\nבברכה,\n${CLINIC}`,
        html: buildHtml({
            preheader: `תזכורת: יש לך תור מחר בשעה ${appointment.time}`,
            title: 'תזכורת: יש לך תור מחר',
            greeting: `שלום ${appointment.patientName},`,
            intro: `רצינו להזכיר לך על התור שלך מחר אצל ${doctor}.`,
            rows: [
                ['רופא/ה', doctor],
                ['תאריך', date],
                ['שעה', appointment.time],
                ['סוג הטיפול', appointment.treatmentType || 'לא צוין'],
            ],
            note: 'צריך לבטל או לשנות? אפשר ליצור קשר עם המרפאה בטלפון, ונשמח לעזור. כדאי להגיע כ-10 דקות לפני השעה.'
        })

    };
    await transporter.sendMail(mail);
};
/**
 * מה היא עושה: שולחת תזכורת לכל התורים של מחר
 * שולפת את התורים, ולכל תור קוראת לשירות המיילים. אם המייל נשלח, מסמנת את התור כ-reminderSent ושומרת
 * Promise.all שולח לכולם במקביל, ורק כשכולם הסתיימו הפונקציה מסתיימת
 * כל תור בנפרד בתוך try/catch: כישלון באחד רק נרשם בלוג ולא מפיל את האחרים
 * למה צריך: ההרצה היומית צריכה לשלוח לכל מי שזכאית, בלי שתקלה אחת תעצור את כולן
 * סימון reminderSent מונע שליחה כפולה בהרצה הבאה
 * משמשת את העבודה היומית ואת runTomorrowReminders
 *
 * @returns {Promise<void>}
 */
const sendAllTomorrowReminders = async () => {
    const appointments = await getAppointmentsForTomorrow();
    console.log(`[תזכורות] נמצאו ${appointments.length} תורים למחר עם תזכורת`);


    await Promise.all(appointments.map(async (appointment) => {
        try {
            const ok = await sendReminderNotification({
                to: appointment.patientEmail,
                patientName: appointment.patientName,
                doctorName: appointment.doctorId?.userId?.name,
                date: appointment.date,
                time: appointment.time,
                treatmentType: appointment.treatmentType
            });
            if (ok) {
                appointment.reminderSent = true;
                await appointment.save();

            }
        } catch (error) {
            console.error('שגיאה בשליחת תזכורת:', error.message);
        }
    }));


};

/**
 * מה היא עושה: מפעילה ידנית את שליחת התזכורות, ומחזירה הודעת הצלחה
 * למה צריך: לבדיקה בלי לחכות ל-20:00
 * משמשת את GET /api/tomorrow-reminders (רופאה בלבד)
 *
 * @param {Object} req הבקשה
 * @param {Object} res התשובה: הודעה שהתזכורות נשלחו
 * @returns {Promise<void>}
 */
const runTomorrowReminders = async (req, res) => {
    await sendAllTomorrowReminders();
    res.json({ message: 'התזכורות נשלחו' });
};



export { getAppointmentsForTomorrow, sendAllTomorrowReminders, runTomorrowReminders };
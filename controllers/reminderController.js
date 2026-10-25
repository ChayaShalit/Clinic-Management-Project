import Appointment from '../models/Appointment.model.js';
import transporter from '../utils/mailer.js';
import { buildHtml, CLINIC } from '../utils/emailTemplate.js';
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
 *הפוונקציה שולחת מייל
 * בפונקציה מגדירים אוביקט שבו יש את כתובת השולח ולאיפה לשלוח על ידי הכתובת שמגיעה מהמטופל
 * הנושא זה מה שיהיה כתוב בשורה השאונה של המייל 
 */

const sendAllTomorrowReminders = async () => {
    const appointments = await getAppointmentsForTomorrow();
    await Promise.all(appointments.map(async (appointment) => {
        try {
            await sendReminderEmail(appointment);
            appointment.reminderSent = true;
            await appointment.save();
        } catch (error) {
            console.error('שגיאה בשליחת תזכורת:', error.message);
        }
    }));
};
/**
הפונקציה שולחת מייל לכל התורים שמחר 
על ידי הפעלת הפונקציה שמחזירה את כל התורים שמחר ומכניסה בתוך משתנה 
הפורמיס אומר תחכה עד שכולם ישלחו 
הפורמיס הוא המבטיח לזה 
כלומר לכל מטופל נוצר מערך ממהמאפ שמנסים לשלוח לו מייל 
הפורמיס אול אומר לשלוח לכלום בייחד רק  אחרי שהפעולה הזו נגמרה אפשר לעבור הלאה 
 */
const runTomorrowReminders = async (req, res) => {
    await sendAllTomorrowReminders();
    res.json({ message: 'התזכורות נשלחו' });
};



export { getAppointmentsForTomorrow, sendAllTomorrowReminders, runTomorrowReminders };
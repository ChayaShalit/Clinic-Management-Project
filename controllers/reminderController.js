import Appointment from '../models/Appointment.model.js';
import PDFDocument from 'pdfkit';
import transporter from '../utils/mailer.js';

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
    });
};

const sendReminderEmail = async (appointment) => {
    const mail = {
        from: process.env.EMAIL_USER,
        to: appointment.patientEmail,
        subject: `שלום${appointment.patientName} תזכורת לתור מחר `,
        text: `שלום ${appointment.patientName},\n\nזוהי תזכורת לתור שלך מחר, בתאריך ${appointment.date.toLocaleDateString('he-IL')} בשעה ${appointment.time}.\n\nבברכה,\nצוות המרפאה`
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
const generatePDFReport = async (req, res) => {
    const appointments = await getAppointmentsForTomorrow();
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=tomorrow_appointments.pdf');
    doc.pipe(res);
    doc.fontSize(16).text('תזכורת לתורים מחר', { align: 'center' });
    doc.moveDown();
    appointments.forEach((appointment, index) => {
        doc.fontSize(12).text(`תור ${index + 1}:`);
        doc.text(`שם המטופל: ${appointment.patientName}`);
    });
    doc.end();
};

export { getAppointmentsForTomorrow, sendAllTomorrowReminders, generatePDFReport };
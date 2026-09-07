import Appointment from '../models/Appointment.model.js';
import PDFDocument from 'pdfkit';
import transporter from '../utils/mailer.js';

const getTomorrowDateString = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };

const getAppointmentsForTomorrow = async () => {
    const appointments =await Appointment.find({ date: getTomorrowDateString(),
        status: 'confirmed', reminderSent: true, wantsReminder: {$ne:true }
    });
    return appointments;
}
    
    const sendReminderEmail = async (appointment) => {
        const mail ={
            from:process.env.EMAIL_USER,
            to: appointment.patientEmail,
            subject: ' תזכורת לתור מחר',
            text: `שלום ${appointment.patientName},\n\nזוהי תזכורת לתור שלך מחר בתאריך ${appointment.date} בשעה ${appointment.time}.\n\nבברכה,\nצוות המרפאה`
        }
        await transporter.sendMail(mail);
    }

    const sendAllTomorrowReminders =async()=>{
        const appointments = await getAppointmentsForTomorrow();
        await Promise.all(appointments.map(async(appointment)=>{
          try{  await sendReminderEmail(appointment);
            appointment.reminderSent = true;
            await appointment.save();
          } catch (error) {
            console.error('Error sending reminder email:', error);
          }
        }));
    }
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
         export{getTodayAppointmentsForTomorrow,sendAllTomorrowReminders, generatePDFReport};
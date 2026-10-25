import Appointment from '../models/Appointment.model.js';
import { Patient } from '../models/Patient.model.js';
import { User } from '../models/User.model.js';
import PDFDocument from 'pdfkit';
import Doctor from '../models/Doctor.model.js';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { sendAppointmentConfirmation } from '../services/notification.service.js';
import { AppError } from '../utils/AppError.js';

// שגיאות נזרקות עם AppError ומטופלות ב-error middleware (Express 5 תופס גם שגיאות של async),
// ולכן אין כאן try/catch. בדיקות תקינות של הנתונים נעשות לפני כן, עם Joi בקובץ הנתיבים

// ב-PDF מספרים בתוך טקסט עברי מתהפכים, אז הופכים אותם מראש
const ltr = (text) => [...String(text)].reverse().join('');

// הגדרות טקסט עברי ב-PDF: יישור לימין וכיוון כתיבה מימין לשמאל
const RTL_TEXT = { align: 'right', features: ['rtla'] };

// שליפת שם המטופלת דרך משתמש המטופלת (משמש את רשימת התורים של הרופא ואת ה-PDF)
const POPULATE_PATIENT_NAME = {
    path: 'patientId',
    populate: { path: 'userId', select: 'name' }
};

const getCurrentPatient = async (currentUser) => {
    const patient = await Patient.findOne({ userId: currentUser.id });

    if (!patient) {
        throw new AppError('לא נמצאה רשומת מטופל למשתמש המחובר', 404, 'not found');
    }

    return patient;
};

const getCurrentDoctor = async (currentUser) => {
    const doctor = await Doctor.findOne({ userId: currentUser.id });

    if (!doctor) {
        throw new AppError('רופא לא נמצא', 404, 'not found');
    }

    return doctor;
};

// בודק שהתור שייך למשתמש המחובר: המטופלת שקבעה אותו, או הרופא שלו
const canManageAppointment = async (appointment, currentUser) => {
    if (currentUser.role === 'patient') {
        const patient = await Patient.findOne({ userId: currentUser.id });
        return Boolean(patient) && String(appointment.patientId) === String(patient._id);
    }

    if (currentUser.role === 'doctor') {
        const doctor = await Doctor.findOne({ userId: currentUser.id });
        return Boolean(doctor) && String(appointment.doctorId) === String(doctor._id);
    }

    return false;
};

// שולף תור לפי מזהה, ומוודא שהוא קיים ושהמשתמש המחובר רשאי לטפל בו (action: 'לשנות' או 'לבטל')
const getManagedAppointment = async (id, currentUser, action) => {
    const appointment = await Appointment.findById(id);

    if (!appointment) {
        throw new AppError('התור לא נמצא', 404, 'not found');
    }

    if (!(await canManageAppointment(appointment, currentUser))) {
        throw new AppError(`אין לך הרשאה ${action} תור זה`, 403, 'auth error');
    }

    return appointment;
};

// מוודא שאין תור מאושר אחר אצל אותו רופא באותה שעה
// excludeId: התור שמעדכנים, כדי שלא יתנגש בעצמו
const assertSlotFree = async ({ doctorId, date, time, excludeId }) => {
    const filter = { doctorId, date, time, status: 'confirmed' };

    if (excludeId) {
        filter._id = { $ne: excludeId };
    }

    if (await Appointment.exists(filter)) {
        throw new AppError('השעה שבחרת כבר תפוסה אצל רופא זה. אנא בחרו זמן אחר.', 409, 'conflict');
    }
};

// המטופלת נקבעת לפי ההתחברות (הטוקן), והרופא נבחר מהרשימה
export const createAppointment = async (req, res) => {
    const { doctorId, date, time, treatmentType, wantsReminder } = req.body;

    const patient = await getCurrentPatient(req.currentUser);
    const user = await User.findById(req.currentUser.id);

    await assertSlotFree({ doctorId, date, time });

    const newAppointment = new Appointment({
        patientId: patient._id,
        doctorId,
        date,
        time,
        treatmentType,
        wantsReminder,
        patientName: user.name,
        patientEmail: user.email
    });

    await newAppointment.save();

    const doctor = await Doctor.findById(doctorId).populate('userId', 'name').catch(() => null);

    // המייל לא מעכב את התשובה, וכישלון בשליחה לא מפיל את הקביעה
    sendAppointmentConfirmation({
        to: user.email,
        patientName: user.name,
        doctorName: doctor?.userId?.name,
        date,
        time,
        treatmentType,
        wantsReminder
    }).catch((error) => console.error('שליחת מייל אישור נכשלה:', error.message));

    res.status(201).json({
        message: 'התור נקבע בהצלחה!',
        appointment: newAppointment
    });
};

// עדכון/דחיית תור. הגוף כבר עבר Joi, אז יש בו רק date, time, treatmentType ו-status
export const updateAppointment = async (req, res) => {
    const { id } = req.params;
    const { date, time } = req.body;

    const currentAppointment = await getManagedAppointment(id, req.currentUser, 'לשנות');

    if (date || time) {
        await assertSlotFree({
            doctorId: currentAppointment.doctorId,
            date: date || currentAppointment.date,
            time: time || currentAppointment.time,
            excludeId: id
        });
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(id, req.body, { new: true });

    res.status(200).json({ message: 'התור עודכן בהצלחה', appointment: updatedAppointment });
};

// ביטול (מחיקת) תור
export const deleteAppointment = async (req, res) => {
    const appointment = await getManagedAppointment(req.params.id, req.currentUser, 'לבטל');

    await appointment.deleteOne();

    res.status(200).json({ message: 'התור בוטל בהצלחה' });
};

// שליפת התורים של רופא ספציפי
export const getDoctorAppointments = async (req, res) => {
    const appointments = await Appointment.find({ doctorId: req.params.doctorId }).sort({ time: 1 });

    res.status(200).json({ appointments });
};

export const getMyAppointments = async (req, res) => {
    const patient = await getCurrentPatient(req.currentUser);

    const appointments = await Appointment.find({ patientId: patient._id })
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
        .sort({ date: 1, time: 1 });

    res.status(200).json({ appointments });
};

export const getMyDoctorAppointments = async (req, res) => {
    const doctor = await getCurrentDoctor(req.currentUser);

    const appointments = await Appointment.find({ doctorId: doctor._id })
        .populate(POPULATE_PATIENT_NAME)
        .sort({ date: 1, time: 1 });

    res.status(200).json({ appointments });
};

export const downloadTodayAppointmentsPDF = async (req, res, next) => {
    try {
        const doctor = await getCurrentDoctor(req.currentUser);

        const now = new Date();

        const start = new Date(now);
        start.setHours(0, 0, 0, 0);

        const end = new Date(now);
        end.setHours(23, 59, 59, 999);

        const appointments = await Appointment.find({
            doctorId: doctor._id,
            date: { $gte: start, $lte: end },
            status: { $ne: 'cancelled' }
        })
            .populate(POPULATE_PATIENT_NAME)
            .sort({ time: 1 });

        // גופן עברי שנמצא בתוך הפרויקט, כדי שיעבוד גם בשרת בענן
        const fontPath = fileURLToPath(new URL('../fonts/Heebo-Regular.ttf', import.meta.url));

        if (!fs.existsSync(fontPath)) {
            throw new AppError('לא נמצא גופן עברי ליצירת PDF', 500, 'server error');
        }

        const doc = new PDFDocument({
            size: 'A4',
            margin: 50
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            'attachment; filename="today-appointments.pdf"'
        );

        doc.pipe(res);
        doc.font(fontPath);

        doc.fontSize(20).text('תורים להיום', RTL_TEXT);

        doc.moveDown();

        doc.fontSize(12).text(now.toLocaleDateString('he-IL'), RTL_TEXT);

        doc.moveDown();

        if (appointments.length === 0) {
            doc.text('אין תורים להיום', RTL_TEXT);
        } else {
            appointments.forEach((appointment, index) => {
                const patientName =
                    appointment.patientId?.userId?.name || 'לא ידוע';

                doc.fontSize(12).text(
                    `${index + 1}. ${ltr(appointment.time)} | ${patientName}`,
                    RTL_TEXT
                );

                doc.text(
                    `סוג טיפול: ${appointment.treatmentType || 'לא צוין'}`,
                    RTL_TEXT
                );

                doc.moveDown();
            });
        }

        doc.end();

    } catch (error) {
        // כאן נשאר try/catch כי אם כבר התחלנו לשלוח את הקובץ אי אפשר לשלוח תשובת שגיאה רגילה
        if (res.headersSent) {
            console.error('PDF error:', error);
            return res.destroy(error);
        }

        next(error);
    }
};

// השעות התפוסות אצל רופא ביום מסוים, כדי שהמטופלת תראה רק שעות פנויות
// הרופא והתאריך מגיעים בכתובת (query) ועוברים Joi בקובץ הנתיבים
export const getAvailability = async (req, res) => {
    const { doctorId, date } = req.query;

    const appointments = await Appointment.find({
        doctorId,
        date,
        status: 'confirmed'
    }).select('time');

    res.status(200).json({ taken: appointments.map(a => a.time) });
};

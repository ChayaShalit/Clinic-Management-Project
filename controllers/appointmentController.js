import Appointment from '../models/Appointment.model.js';
import { Patient } from '../models/Patient.model.js';
import { User } from '../models/User.model.js';
import PDFDocument from 'pdfkit';
import Doctor from '../models/Doctor.model.js';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { sendAppointmentConfirmation } from '../services/notification.service.js';
import { AppError } from '../utils/AppError.js';

/*
 * ה-controller של התורים: כל פונקציה כאן עושה פעולה אחת על תורים.
 * היא מקבלת בקשה (req) ומחזירה תשובה (res), ומדברת עם מסד הנתונים דרך ה-models.
 *
 * מה רץ לפני הפונקציות (בקובץ appointmentRoutes.js):
 *   auth             - בודק שהמשתמש מחובר ומחלץ ממנו את req.currentUser (id ותפקיד)
 *   authPatient / authDoctor - בודקים את התפקיד: מטופלת או רופאה
 *   validate (Joi)   - בודק שהנתונים שנשלחו בפורמט תקין
 *   validateAppointmentTime - הבדיקות העסקיות של זמן התור (שבת, הפסקות, שעות עבודה)
 *
 * שגיאות: זורקים throw new AppError(הודעה, קוד, סוג). Express 5 תופס שגיאות גם בפונקציות
 * async ושולח אותן ל-error middleware, ולכן אין כאן try/catch (חוץ מ-PDF, ראו שם).
 */

// הופכת מחרוזת (למשל '09:00' ל-'00:90'). משמשת רק ב-PDF: מספרים בתוך טקסט עברי מוצגים הפוך,
// ולכן הופכים אותם מראש כדי שיוצגו נכון
const ltr = (text) => [...String(text)].reverse().join('');

// הגדרות טקסט עברי ב-PDF: יישור לימין וכיוון כתיבה מימין לשמאל
const RTL_TEXT = { align: 'right', features: ['rtla'] };

// שליפת שם המטופלת דרך משתמש המטופלת (משמש את רשימת התורים של הרופא ואת ה-PDF)
const POPULATE_PATIENT_NAME = {
    path: 'patientId',
    populate: { path: 'userId', select: 'name' }
};

// מחזירה את רשומת המטופלת (Patient) של המשתמש המחובר.
// למה צריך: בטוקן יש רק משתמש (User), ובתור שמור מזהה של מטופלת (Patient). אם אין רשומה: 404
const getCurrentPatient = async (currentUser) => {
    const patient = await Patient.findOne({ userId: currentUser.id });

    if (!patient) {
        throw new AppError('לא נמצאה רשומת מטופל למשתמש המחובר', 404, 'not found');
    }

    return patient;
};

// מחזירה את רשומת הרופא (Doctor) של המשתמש המחובר. אם אין רשומה: 404
const getCurrentDoctor = async (currentUser) => {
    const doctor = await Doctor.findOne({ userId: currentUser.id });

    if (!doctor) {
        throw new AppError('רופא לא נמצא', 404, 'not found');
    }

    return doctor;
};

// מחזירה true או false: האם התור שייך למשתמש המחובר?
// מטופלת: רק תור שהיא קבעה. רופאה: רק תור שנקבע אצלה. כך אי אפשר לבטל תור של מישהי אחרת
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

// שולפת תור לפי מזהה ומוודאת שני דברים: שהוא קיים (אחרת 404), ושמותר למשתמש לטפל בו (אחרת 403).
// מחזירה את התור, ואם משהו לא תקין זורקת שגיאה
const getManagedAppointment = async (id, currentUser) => {
    const appointment = await Appointment.findById(id);

    if (!appointment) {
        throw new AppError('התור לא נמצא', 404, 'not found');
    }

    if (!(await canManageAppointment(appointment, currentUser))) {
        throw new AppError('אין לך הרשאה לבטל תור זה', 403, 'auth error');
    }

    return appointment;
};

// בודקת שאין כבר תור מאושר אצל אותו רופא, באותו תאריך ובאותה שעה.
// אם יש, זורקת שגיאה 409 (התנגשות). exists מחזירה רק אם נמצא תור, בלי להביא את כל הנתונים
const assertSlotFree = async ({ doctorId, date, time }) => {
    if (await Appointment.exists({ doctorId, date, time, status: 'confirmed' })) {
        throw new AppError('השעה שבחרת כבר תפוסה אצל רופא זה. אנא בחרו זמן אחר.', 409, 'conflict');
    }
};

// התאריך של היום לפי שעון ישראל, בפורמט YYYY-MM-DD (למשל '2026-10-27').
// השרת בענן רץ לפי שעון UTC, ולכן לא סומכים על new Date() הרגיל כדי לדעת מה "היום" אצלנו
const todayInIsrael = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(new Date());

// קביעת תור חדש. POST /appointments. רק מטופלת (authPatient).
// שלבים: 1) מזהים את המטופלת לפי הטוקן 2) בודקים שהשעה פנויה 3) שומרים את התור 4) שולחים מייל אישור.
// שימו לב: המטופלת לא נשלחת בבקשה אלא נקבעת מהטוקן (כדי שלא יוכלו לקבוע תור בשם מישהי אחרת).
// הנתונים כבר עברו Joi וגם validateAppointmentTime, לכן כאן אין בדיקות פורמט
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

    // אין כאן await בכוונה: המייל נשלח ברקע ולא מעכב את התשובה, וכישלון בשליחה לא מבטל את התור
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

// ביטול תור. DELETE /appointments/:id.
// רק המטופלת שקבעה את התור, או הרופאה שלו (getManagedAppointment בודקת הרשאה).
// שימו לב: זו מחיקה אמיתית מהמסד, ולא שינוי סטטוס ל"מבוטל"
export const deleteAppointment = async (req, res) => {
    const appointment = await getManagedAppointment(req.params.id, req.currentUser);

    await appointment.deleteOne();

    res.status(200).json({ message: 'התור בוטל בהצלחה' });
};

// תורים של רופא לפי מזהה בכתובת. GET /appointments/doctor/:doctorId.
// שימו לב: לא בשימוש בלקוח (הרופא משתמש ב-getMyDoctorAppointments)
export const getDoctorAppointments = async (req, res) => {
    const appointments = await Appointment.find({ doctorId: req.params.doctorId }).sort({ time: 1 });

    res.status(200).json({ appointments });
};

// התורים של המטופלת המחוברת. GET /appointments/my. משמשת את הדף הראשי של המטופלת.
// populate מוסיף את שם הרופא (התור שומר רק מזהה), והמיון לפי תאריך ושעה (1 = סדר עולה)
export const getMyAppointments = async (req, res) => {
    const patient = await getCurrentPatient(req.currentUser);

    const appointments = await Appointment.find({ patientId: patient._id })
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
        .sort({ date: 1, time: 1 });

    res.status(200).json({ appointments });
};

// התורים של הרופאה המחוברת. GET /appointments/doctor/my. משמשת את הדף הראשי שלה.
// populate מוסיף את שם המטופלת (דרך POPULATE_PATIENT_NAME)
export const getMyDoctorAppointments = async (req, res) => {
    const doctor = await getCurrentDoctor(req.currentUser);

    const appointments = await Appointment.find({ doctorId: doctor._id })
        .populate(POPULATE_PATIENT_NAME)
        .sort({ date: 1, time: 1 });

    res.status(200).json({ appointments });
};

// דוח PDF של תורי היום של הרופאה. GET /appointments/doctor/my/today/pdf.
// מסננת תורים של היום (לפי שעון ישראל) שלא בוטלו, וכותבת אותם לקובץ PDF בעזרת ספריית pdfkit.
// דברים מיוחדים: 1) pdfkit לא יודעת עברית לבד, ולכן יש גופן עברי בתיקיית fonts, RTL_TEXT ו-ltr.
// 2) הקובץ נשלח כזרם (pipe) ישר לתשובה, ולכן נשאר כאן try/catch: אם כבר התחלנו לשלוח אי אפשר
//    להחזיר שגיאה רגילה, ורק מנתקים את החיבור
export const downloadTodayAppointmentsPDF = async (req, res, next) => {
    try {
        const doctor = await getCurrentDoctor(req.currentUser);

        // תורים נשמרים כתאריך בשעה 00:00 לפי UTC, ולכן מחפשים התאמה מדויקת לתאריך של היום
        const todayKey = todayInIsrael();

        const appointments = await Appointment.find({
            doctorId: doctor._id,
            date: new Date(todayKey),
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

        doc.fontSize(12).text(new Date(todayKey).toLocaleDateString('he-IL', { timeZone: 'UTC' }), RTL_TEXT);

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

// השעות התפוסות אצל רופא ביום מסוים. GET /appointments/availability?doctorId=...&date=...
// הלקוח (היומן) מחסיר אותן מהשעות של הרופא, כך שהמטופלת רואה רק שעות פנויות.
// הפרמטרים מגיעים בכתובת (req.query, לא req.body) ועוברים Joi בקובץ הנתיבים.
// מחזירה רק את השדה time של כל תור (select), כדי לא לשלוח מידע מיותר
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

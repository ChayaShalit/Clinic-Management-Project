import Appointment from '../models/Appointment.model.js';
import { Patient } from '../models/Patient.model.js';
import { User } from '../models/User.model.js';
import PDFDocument from 'pdfkit';
import Doctor from '../models/Doctor.model.js';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { sendAppointmentConfirmation } from '../services/notification.service.js';
import { AppError } from '../utils/AppError.js';

/**
 * @fileoverview
 * קונטרולר התורים: כל הפעולות על תורים
 * כל פונקציה כאן מקבלת בקשה מהלקוח, עושה פעולה אחת, ומחזירה תשובה
 * לפני כל פונקציה רצים שומרים שהוגדרו בקובץ הנתיבים
 * הם בודקים שהמשתמשת מחוברת, מה התפקיד שלה, ושהנתונים שנשלחו תקינים
 * כשמשהו לא תקין זורקים שגיאה, והיא עוברת לטיפול שגיאות מרכזי
 * בגלל זה אין כאן בדיקות שגיאה מקומיות, חוץ מהדוח להורדה
 */

/**
 * מה היא עושה: הופכת טקסט, למשל שעה
 * למה צריך: בדוח להורדה מספרים בתוך עברית מוצגים הפוך, ולכן הופכים אותם מראש
 * משמשת רק בדוח התורים להורדה
 *
 * @param {string} text הטקסט להפיכה
 * @returns {string} הטקסט בסדר הפוך
 */
const ltr = (text) => [...String(text)].reverse().join('');

// הגדרות לכתיבה בעברית בדוח: יישור לימין וכיוון כתיבה מימין לשמאל
// מוגדר פעם אחת כדי לא לחזור עליו בכל שורה
const RTL_TEXT = { align: 'right', features: ['rtla'] };

// הוראה לשליפת שם המטופלת
// בתור שמור רק מזהה של מטופלת, והמטופלת שומרת מזהה של משתמש
// הפופולייט הולך בשרשרת הזו ומביא רק את השם
// משמש את רשימת התורים של הרופאה ואת הדוח להורדה
const POPULATE_PATIENT_NAME = {
    path: 'patientId',
    populate: { path: 'userId', select: 'name' }
};

/**
 * מה היא עושה: מוצאת את המטופלת של המשתמש המחובר
 * למה צריך: בטוקן יש מזהה משתמש, ובתור שמור מזהה מטופלת
 * אם אין מטופלת כזו, זורקת שגיאה 404
 *
 * @param {Object} currentUser המשתמש המחובר, עם מזהה ותפקיד מהטוקן
 * @returns {Promise<Object>} רשומת המטופלת
 */
const getCurrentPatient = async (currentUser) => {
    const patient = await Patient.findOne({ userId: currentUser.id });

    if (!patient) {
        throw new AppError('לא נמצאה רשומת מטופל למשתמש המחובר', 404, 'not found');
    }

    return patient;
};

/**
 * מה היא עושה: מוצאת את הרופא של המשתמש המחובר
 * אם אין רופא כזה, זורקת שגיאה 404
 *
 * @param {Object} currentUser המשתמש המחובר, עם מזהה ותפקיד מהטוקן
 * @returns {Promise<Object>} רשומת הרופא
 */
const getCurrentDoctor = async (currentUser) => {
    const doctor = await Doctor.findOne({ userId: currentUser.id });

    if (!doctor) {
        throw new AppError('רופא לא נמצא', 404, 'not found');
    }

    return doctor;
};

/**
 * מה היא עושה: בודקת אם התור שייך למי ששלחה את הבקשה
 * מטופלת רשאית רק על תור שהיא קבעה, ורופאה רק על תור שנקבע אצלה
 * מחזירה אמת או שקר
 * ההשוואה היא בין טקסטים, כי מזהים במסד הנתונים הם אובייקטים
 *
 * @param {Object} appointment התור שבודקים
 * @param {Object} currentUser המשתמש המחובר
 * @returns {Promise<boolean>} אמת אם התור שייך לו, אחרת שקר
 */
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

/**
 * מה היא עושה: שולפת תור ומוודאת שמותר למשתמשת לטפל בו
 * תור שלא קיים זורק שגיאה 404, ותור של מישהי אחרת זורק שגיאה 403
 * משמשת את ביטול התור
 *
 * @param {string} id מזהה התור
 * @param {Object} currentUser המשתמש המחובר
 * @returns {Promise<Object>} התור, אם קיים ומותר לטפל בו
 */
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

/**
 * מה היא עושה: בודקת שאין כבר תור באותה שעה אצל אותו רופא
 * אם יש, זורקת שגיאה 409 שמשמעותה התנגשות
 * משמשת בזמן קביעת תור חדש
 *
 * @param {Object} details פרטי התור שרוצים לקבוע
 * @param {string} details.doctorId מזהה הרופא
 * @param {string} details.date התאריך
 * @param {string} details.time השעה
 * @returns {Promise<void>} לא מחזירה ערך, ואם השעה תפוסה זורקת שגיאה
 */
const assertSlotFree = async ({ doctorId, date, time }) => {
    if (await Appointment.exists({ doctorId, date, time, status: 'confirmed' })) {
        throw new AppError('השעה שבחרת כבר תפוסה אצל רופא זה. אנא בחרו זמן אחר.', 409, 'conflict');
    }
};

/**
 * מה היא עושה: מחזירה את התאריך של היום לפי שעון ישראל
 * למה צריך: השרת בענן עובד לפי שעון עולמי, ובין חצות לשלוש בלילה התאריך שלו שונה משלנו
 * משמשת בדוח התורים להורדה
 *
 * @returns {string} התאריך של היום, שנה חודש ויום
 */
const todayInIsrael = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(new Date());

/**
 * מה היא עושה: קובעת תור חדש
 * מי קורא לה: דף היומן, כשהמטופלת לוחצת על כפתור הקביעה
 * מה מגיע מהלקוח: רופא, תאריך, שעה, סוג טיפול ובקשה לתזכורת
 * המטופלת לא נשלחת מהלקוח אלא נקבעת מהטוקן, כדי שאי אפשר לקבוע תור על שם מישהי אחרת
 * סדר הפעולות: מוצאים את המטופלת, בודקים שהשעה פנויה, שומרים במסד, ושולחים מייל אישור
 * מה חוזר ללקוח: הודעת הצלחה והתור שנשמר
 * הכתובת בשרת
 * POST /api/appointments
 *
 * @param {Object} req הבקשה, בגוף שלה רופא, תאריך, שעה, סוג טיפול ותזכורת, ובה גם המשתמשת המחוברת
 * @param {Object} res התשובה ללקוח
 * @returns {Promise<void>} שולחת תשובה ללקוח ולא מחזירה ערך
 */
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

    // שמירת התור במסד הנתונים
    await newAppointment.save();

    const doctor = await Doctor.findById(doctorId).populate('userId', 'name').catch(() => null);

    // שליחת המייל ברקע, בלי לחכות לו, כדי שלא יעכב את התשובה
    sendAppointmentConfirmation({
        to: user.email,
        patientName: user.name,
        doctorName: doctor?.userId?.name,
        date,
        time,
        treatmentType,
        wantsReminder
    }).catch((error) => console.error('שליחת מייל אישור נכשלה:', error.message));

    // התשובה ללקוח, קוד 201 שמשמעותו נוצר בהצלחה
    res.status(201).json({
        message: 'התור נקבע בהצלחה!',
        appointment: newAppointment
    });
};

/**
 * מה היא עושה: מבטלת תור
 * מי קורא לה: כפתור ביטול תור בדף הראשי של המטופלת
 * רק מי שקבעה את התור או הרופאה שלו רשאיות, אחרת חוזרת שגיאה 403
 * שימו לב שזו מחיקה מלאה מהמסד ולא שינוי סטטוס
 * הכתובת בשרת
 * DELETE /api/appointments/:id
 *
 * @param {Object} req הבקשה, בכתובת שלה מזהה התור
 * @param {Object} res התשובה ללקוח
 * @returns {Promise<void>} שולחת תשובה ללקוח ולא מחזירה ערך
 */
export const deleteAppointment = async (req, res) => {
    const appointment = await getManagedAppointment(req.params.id, req.currentUser);

    await appointment.deleteOne();

    res.status(200).json({ message: 'התור בוטל בהצלחה' });
};

/**
 * מה היא עושה: מחזירה את התורים של רופא לפי מזהה שבכתובת
 * כרגע אף דף בלקוח לא משתמש בה, כי הרופאה משתמשת בפונקציה שמזהה אותה מהטוקן
 * הכתובת בשרת
 * GET /api/appointments/doctor/:doctorId
 *
 * @param {Object} req הבקשה, בכתובת שלה מזהה הרופא
 * @param {Object} res התשובה ללקוח
 * @returns {Promise<void>} שולחת תשובה ללקוח ולא מחזירה ערך
 */
export const getDoctorAppointments = async (req, res) => {
    const appointments = await Appointment.find({ doctorId: req.params.doctorId }).sort({ time: 1 });

    res.status(200).json({ appointments });
};

/**
 * מה היא עושה: מחזירה את התורים של המטופלת המחוברת
 * מי קורא לה: הדף הראשי של המטופלת, בטעינת התורים הקרובים
 * בתור שמור רק מזהה הרופא, ולכן הפופולייט מוסיף את שם הרופא
 * התורים ממוינים לפי תאריך ושעה, מהמוקדם למאוחר
 * הכתובת בשרת
 * GET /api/appointments/my
 *
 * @param {Object} req הבקשה, ובה המטופלת המחוברת
 * @param {Object} res התשובה ללקוח
 * @returns {Promise<void>} שולחת תשובה ללקוח ולא מחזירה ערך
 */
export const getMyAppointments = async (req, res) => {
    const patient = await getCurrentPatient(req.currentUser);

    const appointments = await Appointment.find({ patientId: patient._id })
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
        .sort({ date: 1, time: 1 });

    res.status(200).json({ appointments });
};

/**
 * מה היא עושה: מחזירה את התורים של הרופאה המחוברת
 * מי קורא לה: הדף הראשי של הרופאה, ומשם מוצגים תורי היום וכל התורים
 * הפופולייט מוסיף את שם המטופלת
 * הכתובת בשרת
 * GET /api/appointments/doctor/my
 *
 * @param {Object} req הבקשה, ובה הרופאה המחוברת
 * @param {Object} res התשובה ללקוח
 * @returns {Promise<void>} שולחת תשובה ללקוח ולא מחזירה ערך
 */
export const getMyDoctorAppointments = async (req, res) => {
    const doctor = await getCurrentDoctor(req.currentUser);

    const appointments = await Appointment.find({ doctorId: doctor._id })
        .populate(POPULATE_PATIENT_NAME)
        .sort({ date: 1, time: 1 });

    res.status(200).json({ appointments });
};

/**
 * מה היא עושה: יוצרת דוח להורדה עם תורי היום של הרופאה
 * מי קורא לה: כפתור ההורדה בדף הראשי של הרופאה
 * איך זה עובד: מוצאים את תורי היום שלא בוטלו, וכותבים אותם לקובץ בעזרת ספרייה ליצירת קבצים
 * הקובץ נשלח ללקוח ישר תוך כדי כתיבה
 * הגופן העברי נמצא בתיקיית הגופנים של הפרויקט, כדי שיעבוד גם בשרת בענן
 * כאן נשארו בדיקות שגיאה מקומיות, כי אחרי שהתחלנו לשלוח אי אפשר להחזיר שגיאה רגילה
 * הכתובת בשרת
 * GET /api/appointments/doctor/my/today/pdf
 *
 * @param {Object} req הבקשה, ובה הרופאה המחוברת
 * @param {Object} res התשובה, אליה נשלח הקובץ
 * @param {Function} next מעבירה שגיאה לטיפול השגיאות המרכזי
 * @returns {Promise<void>} שולחת קובץ ללקוח ולא מחזירה ערך
 */
export const downloadTodayAppointmentsPDF = async (req, res, next) => {
    try {
        const doctor = await getCurrentDoctor(req.currentUser);

        const todayKey = todayInIsrael();

        const appointments = await Appointment.find({
            doctorId: doctor._id,
            date: new Date(todayKey),
            status: { $ne: 'cancelled' }
        })
            .populate(POPULATE_PATIENT_NAME)
            .sort({ time: 1 });

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
        if (res.headersSent) {
            console.error('PDF error:', error);
            return res.destroy(error);
        }

        next(error);
    }
};

/**
 * מה היא עושה: מחזירה את השעות התפוסות אצל רופא ביום מסוים
 * מי קורא לה: דף היומן, אחרי שהמטופלת בוחרת יום
 * הלקוח מחסיר את השעות התפוסות משעות העבודה של הרופא ומציג רק שעות פנויות
 * הרופא והתאריך מגיעים בכתובת עצמה ולא בגוף הבקשה
 * הכתובת בשרת
 * GET /api/appointments/availability?doctorId=...&date=...
 *
 * @param {Object} req הבקשה, בכתובת שלה הרופא והתאריך
 * @param {Object} res התשובה ללקוח
 * @returns {Promise<void>} שולחת תשובה ללקוח ולא מחזירה ערך
 */
export const getAvailability = async (req, res) => {
    const { doctorId, date } = req.query;

    const appointments = await Appointment.find({
        doctorId,
        date,
        status: 'confirmed'
    }).select('time');

    res.status(200).json({ taken: appointments.map(a => a.time) });
};

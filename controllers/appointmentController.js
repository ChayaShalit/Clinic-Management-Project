import Appointment from '../models/Appointment.model.js';
import { Patient } from '../models/Patient.model.js';
import PDFDocument from 'pdfkit';
import Doctor from '../models/Doctor.model.js';
import fs from 'node:fs';
export const createAppointment = async (req, res) => {
    try {
        const { patientId, doctorId, date, time, treatmentType } = req.body;

        if (!patientId || !doctorId || !date || !time) {
            return res.status(400).json({ message: "אנא ודאו שכל שדות החובה מלאים (מטופל, רופא, תאריך ושעה)" });
        }

        const existingAppointment = await Appointment.findOne({
            doctorId: doctorId,
            date: date,
            time: time,
            status: 'confirmed'
        });

        if (existingAppointment) {
            return res.status(409).json({ message: "השעה שבחרת כבר תפוסה אצל רופא זה. אנא בחרו זמן אחר." });
        }

        const newAppointment = new Appointment({
            patientId,
            doctorId,
            date,
            time,
            treatmentType
        });

        await newAppointment.save();

        res.status(201).json({
            message: "התור נקבע בהצלחה!",
            appointment: newAppointment
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "שגיאת שרת בעת קביעת התור" });
    }
};

// פונקציה לעדכון/דחיית תור
export const updateAppointment = async (req, res) => {
    try {
        const { id } = req.params; // שולפים את מזהה התור מתוך הכתובת (URL)
        const { date, time, treatmentType, status } = req.body; // הנתונים החדשים לעדכון
        const currentAppointment = await Appointment.findById(id);

        if (!currentAppointment) {
        return res.status(404).json({ message: "התור לא נמצא" });
            }
            if (date || time) {
    const conflict = await Appointment.findOne({
        _id: { $ne: id },
        doctorId: currentAppointment.doctorId,
        date: date || currentAppointment.date,
        time: time || currentAppointment.time,
        status: 'confirmed'
    });

    if (conflict) {
        return res.status(409).json({ message: "השעה שבחרת כבר תפוסה אצל רופא זה. אנא בחרו זמן אחר." });
    }
}
        // מוצאים את התור לפי ה-ID ומעדכנים אותו. {new: true} אומר שיחזיר לנו את הנתונים המעודכנים.
        const updatedAppointment = await Appointment.findByIdAndUpdate(
            id,
            { date, time, treatmentType, status },
            { new: true }
        );

        if (!updatedAppointment) {
            return res.status(404).json({ message: "התור לא נמצא" });
        }

        res.status(200).json({ message: "התור עודכן בהצלחה", appointment: updatedAppointment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "שגיאת שרת בעת עדכון התור" });
    }
};

// פונקציה לביטול (מחיקת) תור
export const deleteAppointment = async (req, res) => {
    try {
        const { id } = req.params;

        // מוצאים את התור לפי ה-ID ומוחקים אותו
        const deletedAppointment = await Appointment.findByIdAndDelete(id);

        if (!deletedAppointment) {
            return res.status(404).json({ message: "התור לא נמצא" });
        }

        res.status(200).json({ message: "התור בוטל ונמחק בהצלחה" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "שגיאת שרת בעת ביטול התור" });
    }
};

// פונקציה לשליפת התורים של רופא ספציפי
export const getDoctorAppointments = async (req, res) => {
    try {
        const { doctorId } = req.params;
        
        // שולפים מהמסד את כל התורים של הרופא וממיינים אותם לפי השעה (1 = סדר עולה)
        const appointments = await Appointment.find({ doctorId }).sort({ time: 1 });

        if (!appointments || appointments.length === 0) {
            return res.status(404).json({ message: "לא נמצאו תורים לרופא זה" });
        }

        res.status(200).json({ appointments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "שגיאת שרת בעת שליפת התורים" });
    }
};

export const getMyAppointments = async (req, res) => {
    try {
        const patient = await Patient.findOne({
            userId: req.currentUser.id
        });

        if (!patient) {
            return res.status(404).json({
                message: 'מטופל לא נמצא'
            });
        }

        const appointments = await Appointment.find({
            patientId: patient._id
        })
        .populate('doctorId')
        .sort({ date: 1, time: 1 });

        res.status(200).json({ appointments });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'שגיאת שרת בעת שליפת התורים'
        });
    }
};
export const getMyDoctorAppointments = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({
            userId: req.currentUser.id
        });

        if (!doctor) {
            return res.status(404).json({
                message: 'רופא לא נמצא'
            });
        }

        const appointments = await Appointment.find({
            doctorId: doctor._id
        })
        .populate({
            path: 'patientId',
            populate: {
                path: 'userId',
                select: 'name'
            }
        })
        .sort({ date: 1, time: 1 });

        return res.status(200).json({ appointments });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'שגיאה בשליפת תורי הרופא'
        });
    }
};

export const downloadTodayAppointmentsPDF = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({
            userId: req.currentUser.id
        });

        if (!doctor) {
            return res.status(404).json({
                message: 'רופא לא נמצא'
            });
        }

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
        .populate({
            path: 'patientId',
            populate: {
                path: 'userId',
                select: 'name'
            }
        })
        .sort({ time: 1 });

        // משתמשים בגופן עברי שקיים ב-Windows
        const fontPath = 'C:/Windows/Fonts/arial.ttf';

        if (!fs.existsSync(fontPath)) {
            return res.status(500).json({
                message: 'לא נמצא גופן עברי ליצירת PDF'
            });
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

        doc.fontSize(20).text('תורים להיום', {
            align: 'right'
        });

        doc.moveDown();

        doc.fontSize(12).text(
            now.toLocaleDateString('he-IL'),
            { align: 'right' }
        );

        doc.moveDown();

        if (appointments.length === 0) {
            doc.text('אין תורים להיום', {
                align: 'right'
            });
        } else {
            appointments.forEach((appointment, index) => {
                const patientName =
                    appointment.patientId?.userId?.name || 'לא ידוע';

                doc.fontSize(12).text(
                    `${index + 1}. ${appointment.time} | ${patientName}`,
                    { align: 'right' }
                );

                doc.text(
                    `סוג טיפול: ${appointment.treatmentType || 'לא צוין'}`,
                    { align: 'right' }
                );

                doc.moveDown();
            });
        }

        doc.end();

    } catch (error) {
        console.error('PDF error:', error);

        if (!res.headersSent) {
            return res.status(500).json({
                message: 'שגיאה ביצירת PDF'
            });
        }

        res.destroy(error);
    }
};
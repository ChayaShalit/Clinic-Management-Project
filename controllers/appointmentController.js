import Appointment from '../models/Appointment.model.js';

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
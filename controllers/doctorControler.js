import Appointment from "../models/Appointment.model.js";
import Doctor from "../models/Doctor.model.js";






//הפונקציה מקבלת את כל המטופלים של הרופא להיום
//לפי זמן התחלת יום וזמן סיום היום
//מחפש בתורים לפי ID של הרופא את המטופלים שונים להגדרה זהו
//בודק עם $gte גדול או שווה זמן התחלה
// בודק עם lte קטן או שווה שזה זמן סיום התור
const getTodaysAppointments = async (doctorId) => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    const appointments = await Appointment.find({
        doctorId: doctorId,
        date: {
            $gte: startOfDay,
            $lte: endOfDay
        },
        status: 'confirmed'
    });
    return appointments;
};




export const getDoctors = async (req, res, next) => {
    try {
        const doctors = await Doctor.find().populate('userId', 'name')
        const list = doctors
            .filter(doctor => doctor.userId)
            .map(doctor => ({
                _id: doctor._id,
                name: doctor.userId.name,
                specialty: doctor.specialty || '',
                appointmentDuration: doctor.appointmentDuration,
                workStartTime: doctor.workStartTime,
                workEndTime: doctor.workEndTime,
                dayOff: doctor.dayOff || null,
                breaks: (doctor.breaks || []).map(b => ({ startTime: b.startTime, endTime: b.endTime }))
            }))
        return res.status(200).json(list)
    } catch (err) {
        return next(err)
    }
}


export { getTodaysAppointments };

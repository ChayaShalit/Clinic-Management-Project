import Doctor from "../models/Doctor.model.js";

/**
 * GET /api/doctors
 * מחזירה את רשימת הרופאים לדף קביעת התור: שם, התמחות, שעות עבודה, יום חופש והפסקות.
 * השם נמצא באוסף המשתמשים, ולכן populate מביאה אותו (ורק אותו) לפי userId.
 * שגיאות עוברות ל-error middleware (Express 5 תופס גם שגיאות של async), ולכן אין כאן try/catch.
 */
export const getDoctors = async (req, res) => {
    const doctors = await Doctor.find().populate('userId', 'name');

    const list = doctors
        .filter(doctor => doctor.userId) // מדלגים על רופא שהמשתמש שלו נמחק
        .map(doctor => ({
            _id: doctor._id,
            name: doctor.userId.name,
            specialty: doctor.specialty || '',
            appointmentDuration: doctor.appointmentDuration,
            workStartTime: doctor.workStartTime,
            workEndTime: doctor.workEndTime,
            dayOff: doctor.dayOff || null,
            breaks: (doctor.breaks || []).map(b => ({ startTime: b.startTime, endTime: b.endTime }))
        }));

    res.status(200).json(list);
};
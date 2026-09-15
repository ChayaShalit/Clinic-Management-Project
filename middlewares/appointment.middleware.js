import Doctor from '../models/Doctor.model.js';

export const validateAppointmentTime = async (req, res, next) => {
    try {
        const { doctorId, date, time } = req.body;
        
        if (!date || !time || !doctorId) {
            return next();
        }

        const appointmentDate = new Date(date);
        const dayOfWeekIndex = appointmentDate.getDay();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = days[dayOfWeekIndex];

        if (dayOfWeekIndex === 6) {
            return res.status(400).json({ message: "לא ניתן לקבוע תורים ביום שבת." });
        }

        const doctor = await Doctor.findById(doctorId);
        
        if (!doctor) {
            return res.status(404).json({ message: "הרופא לא נמצא במערכת." });
        }

        if (doctor.dayOff === dayName) {
             return res.status(400).json({ message: `הרופא אינו מקבל קהל ביום זה (${dayName}).` });
        }

        const requestedHour = parseInt(time.split(':')[0], 10);
        const requestedMinute = parseInt(time.split(':')[1], 10);
        const requestedTimeInMinutes = requestedHour * 60 + requestedMinute;

        const docStartParts = doctor.workStartTime.split(':');
        const docStartTimeInMinutes = parseInt(docStartParts[0], 10) * 60 + parseInt(docStartParts[1], 10);

        const docEndParts = doctor.workEndTime.split(':');
        const docEndTimeInMinutes = parseInt(docEndParts[0], 10) * 60 + parseInt(docEndParts[1], 10);


        if (requestedTimeInMinutes < docStartTimeInMinutes || requestedTimeInMinutes >= docEndTimeInMinutes) {
            return res.status(400).json({ 
                message: `הרופא לא עובד בשעה זו. שעות הפעילות הן ${doctor.workStartTime} - ${doctor.workEndTime}.` 
            });
        }

        if (doctor.breaks && doctor.breaks.length > 0) {
            for (const breakTime of doctor.breaks) {
                const breakStartParts = breakTime.startTime.split(':');
                const breakStartInMinutes = parseInt(breakStartParts[0], 10) * 60 + parseInt(breakStartParts[1], 10);

                const breakEndParts = breakTime.endTime.split(':');
                const breakEndInMinutes = parseInt(breakEndParts[0], 10) * 60 + parseInt(breakEndParts[1], 10);

                if (requestedTimeInMinutes >= breakStartInMinutes && requestedTimeInMinutes < breakEndInMinutes) {
                     return res.status(400).json({ 
                        message: `לא ניתן לקבוע תור בזמן הפסקה (${breakTime.startTime} - ${breakTime.endTime}).` 
                    });
                }
            }
        }

        next();
    } catch (error) {
        console.error("Error validating time:", error);
        res.status(500).json({ message: "שגיאת שרת באימות זמני התור" });
    }
};
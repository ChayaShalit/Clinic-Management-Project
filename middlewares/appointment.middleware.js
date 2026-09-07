export const validateAppointmentTime = (req, res, next) => {
    const { date, time } = req.body;
    
    // אם חסר תאריך או שעה, ניתן לפונקציה בקונטרולר לטפל בשגיאה
    if (!date || !time) {
        return next();
    }

    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay();

    // חסימת שבת 
    if (dayOfWeek === 6) {
        return res.status(400).json({ message: "לא ניתן לקבוע תורים ביום שבת. נא לבחור תאריך אחר." });
    }

    // חסימת שעות מחוץ לשעות הפעילות
    // מחלצים את השעה מתוך המחרוזת
    const hour = parseInt(time.split(':')[0], 10);
    
    if (hour < 8 || hour >= 18) {
        return res.status(400).json({ message: "המרפאה סגורה בשעות אלו. שעות הפעילות הן 08:00 - 18:00." });
    }

    // אם הכל תקין, ממשיכים הלאה לפונקציה הבאה (לקביעת התור בקונטרולר)
    next();
};
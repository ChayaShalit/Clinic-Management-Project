// קבועים ופונקציות זמן משותפים: משמשים את ה-validators ואת ה-middleware של התורים
export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const DAY_LABELS_HE = {
    Sunday: 'ראשון',
    Monday: 'שני',
    Tuesday: 'שלישי',
    Wednesday: 'רביעי',
    Thursday: 'חמישי',
    Friday: 'שישי',
    Saturday: 'שבת'
};

// שעה בפורמט HH:MM, למשל 08:30
export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

// ממיר '08:30' למספר הדקות מתחילת היום (510)
export const toMinutes = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
};

/**
 * @fileoverview
 * כלי זמן משותפים לבדיקות התקינות ולשומר של התורים
 * כך אותן הגדרות לא חוזרות בכמה קבצים
 */

// שמות הימים באנגלית, בסדר שבו המחשב סופר אותם, מיום ראשון
export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// שמות הימים בעברית, להצגה בהודעות למשתמשת
export const DAY_LABELS_HE = {
    Sunday: 'ראשון',
    Monday: 'שני',
    Tuesday: 'שלישי',
    Wednesday: 'רביעי',
    Thursday: 'חמישי',
    Friday: 'שישי',
    Saturday: 'שבת'
};

// צורת שעה תקינה: שתי ספרות, נקודתיים ושתי ספרות
export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * מה היא עושה: הופכת שעה למספר הדקות מתחילת היום
 * למה צריך: כך אפשר להשוות שעות במספרים, ולבדוק מי מוקדמת ומי מאוחרת
 *
 * @param {string} hhmm שעה בצורה של שעות ודקות
 * @returns {number} מספר הדקות מתחילת היום
 */
export const toMinutes = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
};

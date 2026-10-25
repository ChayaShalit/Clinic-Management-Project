import transporter from '../utils/mailer.js';
import { CLINIC, buildHtml } from '../utils/emailTemplate.js';

/**
 * מיילים אוטומטיים למטופלים:
 *  1. אישור קביעת תור
 *  2. הודעה על הפניה חדשה מהרופא/ה
 *
 * העיצוב של המיילים נמצא בקובץ נפרד: utils/emailTemplate.js
 *
 * כל הפונקציות כאן לא זורקות שגיאה: אם המייל נכשל, זה נרשם בטרמינל
 * והפעולה המקורית (קביעת התור או יצירת ההפניה) ממשיכה כרגיל.
 *
 * משתני סביבה (ב-.env):
 *   EMAIL_USER, EMAIL_PASS   חשבון Gmail ששולח (סיסמת אפליקציה)
 */

/* ---------- עזרים ---------- */
const isMailConfigured = () => Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

// תאריך בפורמט YYYY-MM-DD (או Date) ליום ותאריך בעברית
const parseDate = (value) => {
    if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
};
const longDate = (value) => parseDate(value).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/* ---------- שליחה בטוחה ---------- */
const safeSend = async (mail, label) => {
    if (!mail.to) {
        console.warn(`[מייל] ${label}: אין כתובת מייל ליעד, לא נשלח`);
        return false;
    }
    if (!isMailConfigured()) {
        console.warn(`[מייל] ${label}: EMAIL_USER או EMAIL_PASS לא מוגדרים ב-.env, לא נשלח`);
        return false;
    }
    try {
        await transporter.sendMail({ from: `"${CLINIC}" <${process.env.EMAIL_USER}>`, ...mail });
        return true;
    } catch (error) {
        console.error(`[מייל] ${label}: השליחה נכשלה: ${error.message}`);
        return false;
    }
};

/* ---------- 1. אישור קביעת תור ---------- */
export const sendAppointmentConfirmation = async ({ to, patientName, doctorName, date, time, treatmentType, wantsReminder }) => {
    const doctorLabel = doctorName ? `ד״ר ${doctorName}` : 'הרופא/ה';
    const when = `${longDate(date)} בשעה ${time}`;
    const rows = [
        ['רופא/ה', doctorLabel],
        ['תאריך', longDate(date)],
        ['שעה', time],
        ['סוג הטיפול', treatmentType || 'לא צוין'],
        ['תזכורת במייל', wantsReminder ? 'כן, נשלח מייל יום לפני התור' : 'לא'],
    ];

    return safeSend({
        to,
        subject: `התור שלך נקבע: ${longDate(date)}, ${time}`,
        text: [
            `שלום ${patientName || ''},`,
            '',
            `התור שלך אצל ${doctorLabel} נקבע ל-${when}.`,
            `סוג הטיפול: ${treatmentType || 'לא צוין'}`,
            wantsReminder ? 'נשלח אליך מייל תזכורת יום לפני התור.' : '',
            '',
            `בברכה,`,
            `${CLINIC}`
        ].filter((line, i, all) => line !== '' || all[i - 1] !== '').join('\n'),
        html: buildHtml({
            preheader: `התור שלך אצל ${doctorLabel} נקבע ל-${when}`,
            title: 'התור שלך נקבע בהצלחה',
            greeting: `שלום ${patientName || ''},`,
            intro: `קבענו לך תור אצל ${doctorLabel}.`,
            rows,
            note: 'צריך לבטל או לשנות? אפשר ליצור קשר עם המרפאה בטלפון, ונשמח לעזור. כדאי להגיע כ-10 דקות לפני השעה.'
        })
    }, 'אישור קביעת תור');
};

/* ---------- 2. הפניה חדשה ---------- */
// בכוונה לא נשלחים כאן תוכן ההפניה והקובץ המצורף: מידע רפואי נשאר באזור האישי המוגן
export const sendReferalNotification = async ({ to, patientName, doctorName, kindReferal, hasAttachment }) => {
    const doctorLabel = doctorName ? `ד״ר ${doctorName}` : 'הרופא/ה שלך';
    const rows = [
        ['נשלחה על ידי', doctorLabel],
        ['סוג ההפניה', kindReferal || 'לא צוין'],
        ['קובץ מצורף', hasAttachment ? 'כן, מחכה באזור האישי' : 'ללא'],
    ];

    return safeSend({
        to,
        subject: `הפניה חדשה מ${doctorLabel}`,
        text: [
            `שלום ${patientName || ''},`,
            '',
            `${doctorLabel} שלח/ה לך הפניה חדשה: ${kindReferal || ''}.`,
            'את פרטי ההפניה והמסמכים אפשר לראות באזור האישי באתר.',
            '',
            `בברכה,`,
            `${CLINIC}`
        ].join('\n'),
        html: buildHtml({
            preheader: `${doctorLabel} שלח/ה לך הפניה חדשה: ${kindReferal || ''}`,
            title: 'קיבלת הפניה חדשה',
            greeting: `שלום ${patientName || ''},`,
            intro: `${doctorLabel} שלח/ה לך הפניה חדשה. את הפרטים המלאים והמסמכים אפשר לראות באזור האישי באתר.`,
            rows,
            note: 'מטעמי פרטיות, תוכן ההפניה והמסמכים לא נשלחים במייל, ורק באזור האישי המוגן בסיסמה.'
        })
    }, 'הפניה חדשה');
};
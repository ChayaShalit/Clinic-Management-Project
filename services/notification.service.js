import transporter from '../utils/mailer.js';
import { CLINIC, buildHtml } from '../utils/emailTemplate.js';

/**
 * מיילים אוטומטיים למטופלים:
 *  1. אישור קביעת תור
 *  2. הודעה על הפניה חדשה מהרופא/ה
 *  3. תזכורת יום לפני התור (נשלחת מהעבודה היומית ב-jobs/reminder.job.js)
 *
 * העיצוב נמצא בקובץ נפרד (utils/emailTemplate.js), וכל מייל כאן מגדיר רק את התוכן הייחודי לו.
 * כל הפונקציות כאן לא זורקות שגיאה: אם המייל נכשל, זה נרשם בטרמינל והפעולה המקורית ממשיכה.
 *
 * משתני סביבה (ב-.env):
 *   EMAIL_USER, EMAIL_PASS   חשבון Gmail ששולח (סיסמת אפליקציה)
 */

/* ---------- עזרים ---------- */
const isMailConfigured = () => Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

// תאריך בפורמט YYYY-MM-DD (או Date מהמסד, שנשמר בחצות לפי UTC) ליום ותאריך בעברית
const parseDate = (value) => {
    if (value instanceof Date) return new Date(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
    const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
};
const longDate = (value) => parseDate(value).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const doctorLabel = (name, fallback = 'הרופא/ה') => (name ? `ד״ר ${name}` : fallback);

const SUPPORT_NOTE = 'צריך לבטל או לשנות? אפשר ליצור קשר עם המרפאה בטלפון, ונשמח לעזור. כדאי להגיע כ-10 דקות לפני השעה.';

/* ---------- שליחה ---------- */
// שליחה בטוחה: לא זורקת שגיאה, ומחזירה true אם נשלח ו-false אם לא
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

// המקום היחיד שמרכיב מייל שלם: גרסת טקסט פשוט וגרסה מעוצבת, ושולח אותו
const sendMail = ({ to, patientName, label, subject, preheader, title, intro, rows, note, textLines }) => {
    const greeting = `שלום ${patientName || ''},`;
    return safeSend({
        to,
        subject,
        text: [greeting, '', ...textLines, '', 'בברכה,', CLINIC].join('\n'),
        html: buildHtml({ preheader, title, greeting, intro, rows, note })
    }, label);
};

/* ---------- 1. אישור קביעת תור ---------- */
export const sendAppointmentConfirmation = async ({ to, patientName, doctorName, date, time, treatmentType, wantsReminder }) => {
    const doctor = doctorLabel(doctorName);
    const when = `${longDate(date)} בשעה ${time}`;

    return sendMail({
        to,
        patientName,
        label: 'אישור קביעת תור',
        subject: `התור שלך נקבע: ${longDate(date)}, ${time}`,
        preheader: `התור שלך אצל ${doctor} נקבע ל-${when}`,
        title: 'התור שלך נקבע בהצלחה',
        intro: `קבענו לך תור אצל ${doctor}.`,
        rows: [
            ['רופא/ה', doctor],
            ['תאריך', longDate(date)],
            ['שעה', time],
            ['סוג הטיפול', treatmentType || 'לא צוין'],
            ['תזכורת במייל', wantsReminder ? 'כן, נשלח מייל יום לפני התור' : 'לא'],
        ],
        note: SUPPORT_NOTE,
        textLines: [
            `התור שלך אצל ${doctor} נקבע ל-${when}.`,
            `סוג הטיפול: ${treatmentType || 'לא צוין'}`,
            ...(wantsReminder ? ['נשלח אליך מייל תזכורת יום לפני התור.'] : []),
        ],
    });
};

/* ---------- 2. הפניה חדשה ---------- */
// בכוונה לא נשלחים כאן תוכן ההפניה והקובץ המצורף: מידע רפואי נשאר באזור האישי המוגן
export const sendReferalNotification = async ({ to, patientName, doctorName, kindReferal, hasAttachment }) => {
    const doctor = doctorLabel(doctorName, 'הרופא/ה שלך');

    return sendMail({
        to,
        patientName,
        label: 'הפניה חדשה',
        subject: `הפניה חדשה מ${doctor}`,
        preheader: `${doctor} שלח/ה לך הפניה חדשה: ${kindReferal || ''}`,
        title: 'קיבלת הפניה חדשה',
        intro: `${doctor} שלח/ה לך הפניה חדשה. את הפרטים המלאים והמסמכים אפשר לראות באזור האישי באתר.`,
        rows: [
            ['נשלחה על ידי', doctor],
            ['סוג ההפניה', kindReferal || 'לא צוין'],
            ['קובץ מצורף', hasAttachment ? 'כן, מחכה באזור האישי' : 'ללא'],
        ],
        note: 'מטעמי פרטיות, תוכן ההפניה והמסמכים לא נשלחים במייל, ורק באזור האישי המוגן בסיסמה.',
        textLines: [
            `${doctor} שלח/ה לך הפניה חדשה: ${kindReferal || ''}.`,
            'את פרטי ההפניה והמסמכים אפשר לראות באזור האישי באתר.',
        ],
    });
};

/* ---------- 3. תזכורת יום לפני התור ---------- */
export const sendReminderNotification = async ({ to, patientName, doctorName, date, time, treatmentType }) => {
    const doctor = doctorLabel(doctorName);
    const when = `${longDate(date)} בשעה ${time}`;

    return sendMail({
        to,
        patientName,
        label: 'תזכורת לתור',
        subject: `תזכורת: התור שלך מחר בשעה ${time}`,
        preheader: `תזכורת: יש לך תור מחר אצל ${doctor} בשעה ${time}`,
        title: 'תזכורת: יש לך תור מחר',
        intro: `רצינו להזכיר לך על התור שלך מחר אצל ${doctor}.`,
        rows: [
            ['רופא/ה', doctor],
            ['תאריך', longDate(date)],
            ['שעה', time],
            ['סוג הטיפול', treatmentType || 'לא צוין'],
        ],
        note: SUPPORT_NOTE,
        textLines: [
            `זוהי תזכורת לתור שלך אצל ${doctor} מחר, ${when}.`,
            `סוג הטיפול: ${treatmentType || 'לא צוין'}`,
        ],
    });
};
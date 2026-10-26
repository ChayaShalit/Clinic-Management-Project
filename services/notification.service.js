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
/**
 * מה היא עושה: בודקת שהוגדרו בקובץ .env חשבון המייל והסיסמה (EMAIL_USER ו-EMAIL_PASS)
 * למה צריך: בלי הגדרות אי אפשר לשלוח מייל, ובמקום לקרוס מדפיסים אזהרה ולא שולחים
 * משמשת את safeSend
 *
 * @returns {boolean} אמת אם שני המשתנים קיימים
 */
const isMailConfigured = () => Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

/**
 * מה היא עושה: הופכת תאריך לאובייקט Date של יום מלא, בלי הזזה של יום
 * מקבלת טקסט בפורמט YYYY-MM-DD, או Date מהמסד
 * למה צריך: תאריכים נשמרים במסד בחצות לפי UTC. קריאה במרכיבי UTC מבטיחה שהיום לא יזוז באזור זמן אחר
 * ובטקסט החודש מוקטן באחד, כי ב-JavaScript החודשים מתחילים מאפס
 * משמשת את longDate
 *
 * @param {string|Date} value התאריך
 * @returns {Date} תאריך של אותו יום
 */
const parseDate = (value) => {
    if (value instanceof Date) return new Date(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
    const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
};
/**
 * מה היא עושה: מעצבת תאריך כטקסט בעברית, עם יום בשבוע
 * למשל: יום שלישי, 27 באוקטובר 2026
 * משמשת את שלושת המיילים: בנושא, בטבלה ובטקסט
 *
 * @param {string|Date} value התאריך
 * @returns {string} התאריך בעברית
 */
const longDate = (value) => parseDate(value).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/**
 * מה היא עושה: מחזירה את שם הרופאה עם התואר ד״ר לפניו
 * אם אין שם, מחזירה טקסט ברירת מחדל, כדי שהמייל לא יכלול שם ריק
 * משמשת את כל המיילים
 *
 * @param {string} [name] שם הרופאה
 * @param {string} [fallback] הטקסט כשאין שם. ברירת מחדל: הרופא/ה
 * @returns {string} למשל: ד״ר דנה לוי
 */
const doctorLabel = (name, fallback = 'הרופא/ה') => (name ? `ד״ר ${name}` : fallback);

// ההערה בתחתית מיילי התור והתזכורת: איך לבטל או לשנות. מוגדרת פעם אחת כי היא חוזרת בשניהם
const SUPPORT_NOTE = 'צריך לבטל או לשנות? אפשר ליצור קשר עם המרפאה בטלפון, ונשמח לעזור. כדאי להגיע כ-10 דקות לפני השעה.';

/* ---------- שליחה ---------- */
/**
 * מה היא עושה: שולחת מייל בצורה בטוחה, בלי לזרוק שגיאה
 * לא שולחת אם אין כתובת יעד, או אם לא הוגדרו פרטי המייל בקובץ .env
 * אם השליחה נכשלת, רושמת את הסיבה בטרמינל
 * למה צריך: מייל הוא תוספת. כישלון בו לא צריך להפיל קביעת תור או יצירת הפניה
 * משמשת את sendMail
 *
 * @param {Object} mail פרטי המייל: to, subject, text, html
 * @param {string} label שם קצר לסוג המייל, לצורך הודעות בטרמינל
 * @returns {Promise<boolean>} אמת אם נשלח, שקר אם לא
 */
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

/**
 * מה היא עושה: מרכיבה מייל שלם ושולחת אותו
 * בונה ברכה, גרסת טקסט פשוט (למי שהמייל שלה לא מציג עיצוב), וגרסה מעוצבת מהתבנית
 * למה צריך: המקום היחיד שמרכיב מייל, כדי שלא יהיה קוד כפול בין המיילים
 * כל מייל מגדיר רק את התוכן הייחודי לו
 * משמשת את שלוש הפונקציות שמטה
 *
 * @param {Object} details פרטי המייל
 * @param {string} details.to כתובת היעד
 * @param {string} details.patientName שם המטופלת, לברכה
 * @param {string} details.label שם קצר לסוג המייל, להודעות בטרמינל
 * @param {string} details.subject נושא המייל
 * @param {string} details.preheader תצוגה מקדימה ברשימת המיילים
 * @param {string} details.title כותרת המייל
 * @param {string} details.intro פסקת הפתיחה
 * @param {Array<Array<string>>} details.rows שורות הטבלה, כל שורה היא כותרת וערך
 * @param {string} details.note ההערה בתחתית
 * @param {string[]} details.textLines שורות גרסת הטקסט הפשוט
 * @returns {Promise<boolean>} אמת אם נשלח
 */
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
/**
 * מה היא עושה: שולחת למטופלת מייל אישור שהתור נקבע
 * המייל כולל רופאה, תאריך, שעה, סוג טיפול, והאם ביקשה תזכורת
 * למה צריך: כדי שלמטופלת יהיו כל פרטי התור בכתובת המייל שלה
 * נשלחת מיד אחרי שהתור נשמר, בלי await, ולכן לא מעכבת את התשובה
 * משמשת את יצירת התור בקונטרולר התורים
 *
 * @param {Object} details פרטי התור
 * @param {string} details.to כתובת המטופלת
 * @param {string} details.patientName שם המטופלת
 * @param {string} [details.doctorName] שם הרופאה
 * @param {string} details.date תאריך התור
 * @param {string} details.time שעת התור
 * @param {string} [details.treatmentType] סוג הטיפול
 * @param {boolean} details.wantsReminder האם ביקשה תזכורת
 * @returns {Promise<boolean>} אמת אם נשלח
 */
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
/**
 * מה היא עושה: שולחת למטופלת מייל שקיבלה הפניה חדשה
 * המייל כולל מי שלחה, סוג ההפניה, והאם יש קובץ מצורף
 * למה בלי תוכן: בכוונה לא נשלחים תוכן ההפניה והקובץ המצורף
 * מידע רפואי נשאר באזור האישי המוגן באתר
 * נשלחת מיד אחרי שההפניה נשמרה, בלי await
 * משמשת את יצירת ההפניה בקונטרולר ההפניות
 *
 * @param {Object} details פרטי ההפניה
 * @param {string} details.to כתובת המטופלת
 * @param {string} details.patientName שם המטופלת
 * @param {string} [details.doctorName] שם הרופאה
 * @param {string} details.kindReferal סוג ההפניה
 * @param {boolean} details.hasAttachment האם יש קובץ מצורף
 * @returns {Promise<boolean>} אמת אם נשלח
 */
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
/**
 * מה היא עושה: שולחת למטופלת תזכורת על תור שמתקיים מחר
 * המייל באותו עיצוב כמו מייל האישור
 * למה צריך: כדי שמטופלות לא ישכחו את התור
 * נקראת מהעבודה היומית של התזכורות, דרך הקונטרולר של התזכורות
 * הקונטרולר מסמן שהתזכורת נשלחה רק אם הפונקציה החזירה אמת
 *
 * @param {Object} details פרטי התור
 * @param {string} details.to כתובת המטופלת
 * @param {string} details.patientName שם המטופלת
 * @param {string} [details.doctorName] שם הרופאה
 * @param {Date|string} details.date תאריך התור
 * @param {string} details.time שעת התור
 * @param {string} [details.treatmentType] סוג הטיפול
 * @returns {Promise<boolean>} אמת אם נשלח
 */
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